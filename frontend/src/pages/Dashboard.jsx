import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    Flame, 
    Zap, 
    Utensils, 
    Heart, 
    CalendarDays, 
    Award, 
    X, 
    ArrowRight, 
    Dumbbell, 
    Trophy,
    CheckCircle2,
    Clock,
    RefreshCw,
    ExternalLink,
    Loader2,
    Send,
    Camera,
    Sparkles,
    Check,
    Gift,
    Sun,
    Sunrise,
    Sunset,
    Moon
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import useAuthStore from '../stores/authStore';
import useSidebarStore from '../stores/sidebarStore';
import useWellnessStore from '../stores/wellnessStore';
import WebcamModal from '../components/webcam/WebcamModal';
import { mealImages, resolveMealImage } from '../utils/mealImages';
import { progressApi, workoutApi, nutritionApi, calendarApi, chatApi } from '../services/api';

// Dynamic Greeting Generator based on Local Time
function getTimeGreeting(name = 'Fitness Member') {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return {
            greeting: `Good morning, ${name}`,
            subtext: "Ready to energize your body and focus your mind today?",
            icon: Sunrise,
            color: "text-amber-400"
        };
    } else if (hour >= 12 && hour < 17) {
        return {
            greeting: `Good afternoon, ${name}`,
            subtext: "Keep your metabolic momentum strong through the rest of the day.",
            icon: Sun,
            color: "text-amber-400"
        };
    } else if (hour >= 17 && hour < 22) {
        return {
            greeting: `Good evening, ${name}`,
            subtext: "Time to wrap up your daily workout goals and unwind gracefully.",
            icon: Sunset,
            color: "text-rose-400"
        };
    } else {
        return {
            greeting: `Good night, ${name}`,
            subtext: "Restorative sleep is where real muscle recovery and tissue repair happen.",
            icon: Moon,
            color: "text-sky-400"
        };
    }
}

export default function Dashboard() {
    const user = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);
    const { isCollapsed } = useSidebarStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    // Persistent Wellness Store
    const userXp = useWellnessStore((s) => s.userXp);
    const streakDays = useWellnessStore((s) => s.streakDays);
    const isMealCompleted = useWellnessStore((s) => s.isMealCompleted);
    const toggleMeal = useWellnessStore((s) => s.toggleMeal);
    const getDynamicDailyMacros = useWellnessStore((s) => s.getDynamicDailyMacros);

    const currentLevel = Math.floor(userXp / 250) + 1;
    const levelXpProgress = userXp % 250;

    // Webcam Modal State
    const [webcamModalOpen, setWebcamModalOpen] = useState(false);
    const [modalExerciseName, setModalExerciseName] = useState('Bodyweight Squats');

    // Time of day greeting
    const greetingData = useMemo(() => {
        return getTimeGreeting(user?.full_name?.split(' ')[0] || 'Member');
    }, [user?.full_name]);

    // Daily Mood / Energy Tracker
    const [showMoodTracker, setShowMoodTracker] = useState(() => {
        try {
            const todayStr = new Date().toDateString();
            const lastDate = localStorage.getItem('lastFeedbackDate');
            return lastDate !== todayStr;
        } catch {
            return false;
        }
    });

    const handleFeedbackSubmit = async (mood) => {
        try {
            const todayStr = new Date().toDateString();
            localStorage.setItem('lastFeedbackDate', todayStr);
            await progressApi.log({
                date: new Date().toISOString().split('T')[0],
                notes: `Daily check-in: Feeling ${mood.label} ${mood.emoji}`,
            }).catch(() => null);
            toast.success(`Check-in recorded: Feeling ${mood.label} ${mood.emoji}! ✨`);
        } catch { }
        setShowMoodTracker(false);
    };

    const closeMoodTracker = () => {
        setShowMoodTracker(false);
        try {
            localStorage.setItem('lastFeedbackDate', new Date().toDateString());
        } catch { }
    };

    // Auto-detect calendar connected redirect
    useEffect(() => {
        if (searchParams.get('calendar') === 'connected') {
            toast.success('Google Calendar connected successfully! 📅');
            queryClient.invalidateQueries(['calendarStatus']);
            updateUser({ calendar_token: true, calendar_connected: true });
            searchParams.delete('calendar');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams, queryClient, updateUser]);

    // Queries
    const { data: summary } = useQuery({ 
        queryKey: ['summary'], 
        queryFn: () => progressApi.getSummary().then(r => r.data), 
        retry: false 
    });
    
    const { data: todayWorkout } = useQuery({ 
        queryKey: ['todayWorkout'], 
        queryFn: () => workoutApi.getToday().then(r => r.data?.today || r.data).catch(() => null), 
        retry: false 
    });

    const { data: todayNutrition } = useQuery({ 
        queryKey: ['todayNutrition'], 
        queryFn: () => nutritionApi.getToday().then(r => r.data).catch(() => null), 
        retry: false 
    });

    const { data: achievements = [] } = useQuery({ 
        queryKey: ['achievements'], 
        queryFn: () => progressApi.getAchievements().then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), 
        retry: false 
    });

    const { data: calendarStatus, refetch: refetchCalendar } = useQuery({ 
        queryKey: ['calendarStatus'], 
        queryFn: () => calendarApi.getStatus().then(r => r.data).catch(() => ({ connected: false })), 
        retry: false 
    });

    const syncTodayMut = useMutation({
        mutationFn: () => calendarApi.syncToday(),
        onSuccess: (res) => {
            toast.success(res.data?.message || 'Schedule synced with Google Calendar! 📅');
            refetchCalendar();
        },
        onError: () => toast.error('Failed to sync schedule')
    });

    const disconnectMut = useMutation({
        mutationFn: () => calendarApi.disconnect(),
        onSuccess: () => {
            toast.success('Google Calendar disconnected');
            refetchCalendar();
            updateUser({ calendar_token: false, calendar_connected: false });
        }
    });

    const isCalendarConnected = Boolean(calendarStatus?.connected || user?.calendar_token || user?.calendar_connected);
    const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);

    const handleConnectCalendar = async () => {
        setIsConnectingCalendar(true);
        try {
            const res = await calendarApi.getAuthUrl();
            const authUrl = res.data?.auth_url || res.data?.url;
            if (authUrl) {
                window.location.href = authUrl;
            } else {
                toast.error("Could not obtain Google authorization URL");
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to initiate Google Calendar connection");
        } finally {
            setIsConnectingCalendar(false);
        }
    };

    // Achievements calculation
    const unlockedAchievements = achievements.filter(a => a.unlocked || a.completed);
    const totalAchievements = achievements.length || 11;
    const achievementPct = totalAchievements > 0 ? Math.round((unlockedAchievements.length / totalAchievements) * 100) : 0;
    const topMilestones = achievements.slice(0, 4);

    // Dynamic Macro calculation
    const dynamicMacros = getDynamicDailyMacros({ calories: 2000, protein: 75, carbs: 250, fat: 55 });

    const stats = [
        { icon: Activity, label: 'Workouts Completed', value: summary?.total_workouts ?? 0, unit: 'sessions', color: '#10B981' },
        { icon: Flame, label: 'Calories Burned', value: summary?.total_calories_burned ?? 0, unit: 'kcal', color: '#FF6B6B' },
        { icon: Zap, label: 'Active Streak', value: streakDays || summary?.current_streak || 0, unit: 'days', color: '#0EA5E9' },
        { icon: Utensils, label: 'Meals Logged', value: `${dynamicMacros.completedCount} / 4`, unit: 'meals', color: '#F59E0B' },
    ];

    // Authentic Indian Cuisine Meals for Preview (Accurate names matching prompt)
    const previewMeals = [
        { type: 'breakfast', name: 'Puri with Potato Curry', calories: 340, time: '8:30 AM' },
        { type: 'lunch', name: 'Saag Aloo & Phulka Roti', calories: 440, time: '1:15 PM' },
        { type: 'dinner', name: 'Tofu Tikka Masala with Jeera Rice', calories: 390, time: '8:00 PM' },
    ];

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0F19] text-[#F1F5F9] font-['Inter',sans-serif]">
            <Sidebar />

            <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-12 min-h-screen overflow-x-hidden flex flex-col items-center">
                <div className="w-full max-w-5xl space-y-8">
                    {/* Header Banner: Warm, Human-Centric Greeting with Breathing Room */}
                    <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-slate-300">
                                    <greetingData.icon size={14} className={greetingData.color} />
                                    <span>{greetingData.greeting}</span>
                                </div>
                                <button
                                    onClick={() => setShowMoodTracker(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 text-xs font-medium transition border border-white/[0.06]"
                                >
                                    <Heart size={13} className="text-rose-400" />
                                    <span>Check-in</span>
                                </button>
                                <Link
                                    to="/progress"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/20 transition"
                                >
                                    <Gift size={13} />
                                    <span>Mini-Games</span>
                                </Link>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                                Welcome back, {user?.full_name || 'Fitness Member'}
                            </h1>
                            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                                {greetingData.subtext}
                            </p>
                        </div>

                        {/* Right: Start Webcam Session Button */}
                        <div className="flex items-center gap-3 self-start sm:self-auto">
                            <button
                                onClick={() => {
                                    setModalExerciseName('Bodyweight Squats');
                                    setWebcamModalOpen(true);
                                }}
                                className="btn btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2 rounded-full shadow-lg"
                            >
                                <Camera size={16} />
                                <span>Start Webcam</span>
                            </button>

                            <Link 
                                to="/profile" 
                                className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-bold text-sm text-slate-200 hover:border-white/20 transition shadow-sm"
                                title="View Profile"
                            >
                                {(user?.full_name?.[0] || 'U').toUpperCase()}
                            </Link>
                        </div>
                    </div>

                    {/* Mood Tracker Modal */}
                    {showMoodTracker && (
                        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-md p-4">
                            <div className="bg-[#0B0F19] border border-white/10 rounded-3xl max-w-md w-full p-8 relative shadow-2xl animate-in zoom-in-95 duration-150 space-y-5">
                                <button
                                    onClick={closeMoodTracker}
                                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition"
                                >
                                    <X size={18} />
                                </button>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold text-white">How are you feeling right now?</h3>
                                    <p className="text-xs text-slate-400">
                                        Helps us adapt workout pacing and rest recommendations for today.
                                    </p>
                                </div>
                                <div className="grid grid-cols-5 gap-2 pt-2">
                                    {[
                                        { emoji: '😴', label: 'Low' },
                                        { emoji: '😐', label: 'Tired' },
                                        { emoji: '🙂', label: 'Good' },
                                        { emoji: '😄', label: 'Great' },
                                        { emoji: '🔥', label: 'Energized' },
                                    ].map((mood, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleFeedbackSubmit(mood)}
                                            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-white/[0.04] transition-all"
                                        >
                                            <span className="text-2xl">{mood.emoji}</span>
                                            <span className="text-[10px] font-medium text-slate-400">{mood.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Grid: Spacious, Elegant Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <div 
                                key={i} 
                                className="bg-white/[0.025] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 sm:p-7 hover:border-white/[0.12] transition-all duration-300 shadow-xl space-y-3"
                            >
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06]" style={{ color: stat.color }}>
                                    <stat.icon size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                                        {stat.value}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium mt-1">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Grid: Balanced Multi-Column */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left 2 Cols: Workouts + Indian Meals + Milestones */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Today's Workout Card with De-Cluttered Horizontal Pills */}
                            <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Dumbbell size={20} className="text-emerald-400" />
                                            <h2 className="text-2xl font-bold tracking-tight text-white">
                                                Today's Movement Protocol
                                            </h2>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-400">
                                            {todayWorkout?.focus_area || 'Full Body Conditioning'} • {todayWorkout?.duration_minutes || 45} mins total
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setModalExerciseName(todayWorkout?.exercises?.[0]?.name || 'Bodyweight Squats');
                                                setWebcamModalOpen(true);
                                            }}
                                            className="btn btn-secondary px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5"
                                        >
                                            <Camera size={14} className="text-emerald-400" />
                                            <span>Open Webcam HUD</span>
                                        </button>
                                        <Link to="/workouts" className="btn btn-primary px-4 py-2 text-xs rounded-full flex items-center gap-1">
                                            <span>View All</span>
                                            <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                                
                                {todayWorkout?.exercises && todayWorkout.exercises.length > 0 ? (
                                    <div className="space-y-4">
                                        {todayWorkout.exercises.slice(0, 3).map((ex, i) => (
                                            <div
                                                key={i}
                                                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-7 h-7 rounded-full bg-white/[0.05] text-slate-400 flex items-center justify-center text-xs font-semibold">
                                                            {i + 1}
                                                        </span>
                                                        <h4 className="font-bold text-base text-white">{ex.name}</h4>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1 pl-10 leading-relaxed">{ex.description || 'Smooth cadence, full range of motion, and controlled eccentric tempo.'}</p>
                                                    
                                                    {/* Dedicated horizontal container sitting beneath description */}
                                                    <div className="flex gap-4 mt-3 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg w-fit ml-10">
                                                        <span><strong className="text-white font-semibold">{ex.sets || 3}</strong> Sets</span>
                                                        <span className="text-slate-600">•</span>
                                                        <span><strong className="text-emerald-400 font-semibold">{ex.reps || 12}</strong> Reps</span>
                                                        <span className="text-slate-600">•</span>
                                                        <span><strong className="text-sky-400 font-semibold">{ex.rest_seconds || 45}s</strong> Rest</span>
                                                    </div>
                                                </div>

                                                {/* Distinct floating action pill on the right side */}
                                                <button
                                                    onClick={() => {
                                                        setModalExerciseName(ex.name);
                                                        setWebcamModalOpen(true);
                                                    }}
                                                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-xs font-semibold text-white transition-all duration-200 flex items-center gap-2 shadow-sm self-start sm:self-center"
                                                >
                                                    <Camera size={14} />
                                                    <span>Track</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-4">
                                        <p className="text-sm text-slate-400">
                                            Restorative recovery day. Focus on hydration and gentle mobility.
                                        </p>
                                        <Link to="/workouts" className="text-xs text-emerald-400 font-semibold hover:underline">
                                            View Recovery Flow →
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Today's Indian Meals Preview with Vertical Stack Layout */}
                            <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Utensils size={20} className="text-sky-400" />
                                            <h2 className="text-2xl font-bold tracking-tight text-white">
                                                Indian Meal Architecture
                                            </h2>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-400">
                                            {dynamicMacros.consumed.calories} of {dynamicMacros.targets.calories} kcal consumed today • Tap checkmark to log
                                        </p>
                                    </div>
                                    <Link to="/nutrition" className="btn btn-secondary px-5 py-2 text-xs rounded-full flex items-center gap-1.5 font-medium">
                                        <span>Full Meal Plan</span>
                                        <ArrowRight size={13} />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {previewMeals.map((m) => {
                                        const done = isMealCompleted(m.type);
                                        const imageUrl = resolveMealImage(m.name, m.type);
                                        return (
                                            <div
                                                key={m.type}
                                                className={`rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col justify-between bg-white ${
                                                    done
                                                        ? 'border-[#8AA84A]'
                                                        : 'border-[#E7E1C4]'
                                                }`}
                                            >
                                                <div className="relative h-44 w-full overflow-hidden bg-[#F4E7A4]">
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={m.name} 
                                                        className={`h-44 w-full object-cover transition-all duration-300 ${
                                                            done ? 'filter saturate-75 brightness-90' : ''
                                                        }`}
                                                        loading="lazy"
                                                    />
                                                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-white/10 shadow-sm">
                                                        {m.type}
                                                    </span>
                                                </div>

                                                {/* Bottom Half: Solid slate background (bg-slate-900 p-4) containing title, calories, and prominent tactile green checkmark toggle */}
                                                <div className="bg-white p-4 flex items-center justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className={`text-sm font-semibold leading-snug ${done ? 'line-through text-[#8A9378]' : 'text-[#243016]'}`}>
                                                            {m.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-[#5C6B32]">
                                                            <span className="font-mono text-[#3E4C22] font-medium">{m.calories} kcal</span>
                                                            {m.time && <span>• {m.time}</span>}
                                                        </div>
                                                    </div>

                                                    <motion.button
                                                        whileHover={{ scale: 1.08 }}
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={() => toggleMeal(m.type, m)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-md ${
                                                            done
                                                                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                                                                : 'bg-slate-800 text-slate-400 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-400'
                                                        }`}
                                                        title={done ? "Uncheck" : "Mark as logged"}
                                                    >
                                                        <Check size={18} className={done ? 'stroke-[3]' : 'stroke-2'} />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Col: Social Impact + Calendar + Achievements */}
                        <div className="space-y-8">
                            {/* Social Aid & Charity Impact */}
                            <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-xl space-y-5">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                                    <Award size={15} />
                                    <span>Social Welfare & Aid</span>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                                        ₹{summary?.charity_donations ?? 0}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        Aid unlocked through workout consistency and completed meal milestones.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-center text-xs pt-1">
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                        <div className="text-lg font-bold text-white font-mono">
                                            {Math.floor((summary?.charity_donations ?? 0) / 20)}
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase font-medium mt-1">Meals Sponsored</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                        <div className="text-lg font-bold text-sky-400 font-mono">
                                            {Math.floor((summary?.charity_donations ?? 0) / 50)}
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase font-medium mt-1">Kids Supported</div>
                                    </div>
                                </div>
                            </div>

                            {/* Google Calendar Synchronization */}
                            <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays size={18} className="text-sky-400" />
                                        <h3 className="font-semibold text-white text-base">Google Calendar</h3>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                                        isCalendarConnected
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-white/[0.05] text-slate-400'
                                    }`}>
                                        {isCalendarConnected ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Keep your workout slots and nutrition reminders synchronized to your calendar.
                                </p>
                                {isCalendarConnected ? (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => syncTodayMut.mutate()}
                                            disabled={syncTodayMut.isPending}
                                            className="btn btn-primary w-full text-xs py-3 rounded-full font-semibold flex items-center justify-center gap-2"
                                        >
                                            {syncTodayMut.isPending ? <Loader2 size={14} className="spinner" /> : <RefreshCw size={14} />}
                                            <span>Sync Daily Schedule</span>
                                        </button>
                                        <button
                                            onClick={() => disconnectMut.mutate()}
                                            disabled={disconnectMut.isPending}
                                            className="w-full text-xs py-1.5 text-slate-500 hover:text-rose-400 transition text-center"
                                        >
                                            Disconnect Calendar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConnectCalendar}
                                        disabled={isConnectingCalendar}
                                        className="btn btn-secondary w-full text-xs py-3 rounded-full font-semibold flex items-center justify-center gap-2 text-sky-300"
                                    >
                                        {isConnectingCalendar ? <Loader2 size={14} className="spinner" /> : <ExternalLink size={14} />}
                                        <span>Connect Schedule</span>
                                    </button>
                                )}
                            </div>

                            {/* Gamification Milestone Teaser */}
                            <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Trophy size={18} className="text-amber-400" />
                                        <h3 className="font-semibold text-white text-base">Milestone Progress</h3>
                                    </div>
                                    <Link to="/progress" className="text-xs text-emerald-400 font-medium hover:underline">
                                        View All Badges →
                                    </Link>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Level {currentLevel} • {userXp} XP</span>
                                        <span className="text-slate-300 font-mono">{achievementPct}% Unlocked</span>
                                    </div>
                                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${achievementPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Synchronized Webcam Modal */}
            <WebcamModal
                isOpen={webcamModalOpen}
                onClose={() => setWebcamModalOpen(false)}
                exerciseName={modalExerciseName}
            />
        </div>
    );
}
