import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Dumbbell, 
    Play, 
    Clock, 
    Sparkles, 
    Loader2, 
    Camera, 
    Heart, 
    Activity, 
    ChevronRight,
    Check,
    Target
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import useSidebarStore from '../stores/sidebarStore';
import WebcamModal from '../components/webcam/WebcamModal';
import { exerciseEmbedUrl } from '../utils/exerciseVideos';
import { workoutApi } from '../services/api';
import toast from 'react-hot-toast';

export default function WorkoutPlans() {
    const daysOfWeek = useMemo(() => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);
    const todayName = daysOfWeek[new Date().getDay()];
    
    const [selectedDay, setSelectedDay] = useState(todayName);
    const [webcamModalOpen, setWebcamModalOpen] = useState(false);
    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

    const { isCollapsed } = useSidebarStore();
    const qc = useQueryClient();

    const { data: planResponse, isLoading } = useQuery({ 
        queryKey: ['workoutPlan'], 
        queryFn: () => workoutApi.getCurrent().then(r => r.data), 
        retry: 2 
    });
    
    const genMut = useMutation({ 
        mutationFn: () => workoutApi.generate(), 
        onSuccess: () => { 
            qc.invalidateQueries(['workoutPlan']); 
            toast.success('Your routine has been updated ✨'); 
        },
        onError: () => {
            toast.error('Using current active routine.');
        }
    });

    const defaultWeekPlan = useMemo(() => [
        {
            day: 'Monday', focus_area: 'Chest & Core Strength', duration_minutes: 45, warmup: '5 minutes of dynamic arm circles, torso twists, and scapular wall slides',
            exercises: [
                { name: 'Standard Push Ups', sets: 3, reps: '12-15 reps', rest_seconds: 60, description: 'Maintain neutral spine, elbows tucked at 45 degrees, and inhale on descent.' },
                { name: 'Bodyweight Squats', sets: 3, reps: '15 reps', rest_seconds: 60, description: 'Hips back, chest upright, knees tracking smoothly over middle toes.' },
                { name: 'Core Plank Hold', sets: 3, reps: '45 seconds', rest_seconds: 45, description: 'Squeeze glutes, push floor away through elbows, breathe rhythmically.' },
                { name: 'Mountain Climbers', sets: 3, reps: '20 reps each', rest_seconds: 45, description: 'Drive knees rhythmically toward chest while keeping hips level.' },
            ]
        },
        {
            day: 'Tuesday', focus_area: 'Back & Posture Alignment', duration_minutes: 40, warmup: '5 minutes of cat-cow stretch, shoulder rolls, and thoracic rotations',
            exercises: [
                { name: 'Prone Cobra Retraction', sets: 3, reps: '12 reps', rest_seconds: 45, description: 'Lying on belly, lift chest smoothly, pinch scapulae together, hold 2 seconds.' },
                { name: 'Glute Bridges', sets: 3, reps: '15 reps', rest_seconds: 60, description: 'Drive through heels, squeeze glutes at peak contraction, pause at top.' },
                { name: 'Bird Dog Holds', sets: 3, reps: '10 reps each', rest_seconds: 45, description: 'Extend opposite arm and leg while stabilizing core with zero hip tilt.' },
            ]
        },
        {
            day: 'Wednesday', focus_area: 'Legs & Lower Body Power', duration_minutes: 45, warmup: '5 minutes of bodyweight lunges and hip opening rotations',
            exercises: [
                { name: 'Reverse Lunges', sets: 3, reps: '12 reps per leg', rest_seconds: 60, description: 'Step backward smoothly, drop back knee toward ground with upright torso.' },
                { name: 'Sumo Squats', sets: 3, reps: '15 reps', rest_seconds: 60, description: 'Wider stance with toes angled outward, targeting inner thighs and glutes.' },
                { name: 'Standing Calf Raises', sets: 4, reps: '20 reps', rest_seconds: 30, description: 'Raise heels high with a 2-second hold at top for ankle stability.' },
            ]
        },
        {
            day: 'Thursday', focus_area: 'Active Mobility & Shoulder Health', duration_minutes: 35, warmup: '5 minutes of arm swings and thoracic spine mobility',
            exercises: [
                { name: 'Pike Push Ups', sets: 3, reps: '10 reps', rest_seconds: 60, description: 'Inverted V stance, lower crown of head gently toward ground to build shoulder strength.' },
                { name: 'Superman Extensions', sets: 3, reps: '12 reps', rest_seconds: 45, description: 'Simultaneously lift arms and legs off the mat to strengthen posterior chain.' },
                { name: 'Side Plank Holds', sets: 3, reps: '30s each', rest_seconds: 45, description: 'Elbow directly under shoulder, body forming a straight diagonal line.' },
            ]
        },
        {
            day: 'Friday', focus_area: 'Full Body Functional Conditioning', duration_minutes: 40, warmup: '5 minutes of jumping jacks and high knee skips',
            exercises: [
                { name: 'Burpees (Smooth Pace)', sets: 3, reps: '10 reps', rest_seconds: 60, description: 'Hands to ground, step or jump back, return smoothly with soft landing.' },
                { name: 'Jump Squats', sets: 3, reps: '12 reps', rest_seconds: 60, description: 'Squat back, explode upward gently, landing softly through heels to midfoot.' },
                { name: 'Bicycle Crunches', sets: 3, reps: '20 reps total', rest_seconds: 45, description: 'Controlled rotation, bringing elbow to opposite knee with steady tempo.' },
            ]
        },
        {
            day: 'Saturday', focus_area: 'Endurance & Core Conditioning', duration_minutes: 35, warmup: '5 minutes of joint circles',
            exercises: [
                { name: 'High Knees in Place', sets: 3, reps: '30 seconds', rest_seconds: 45, description: 'Drive knees upward towards waist with rhythmic breathing.' },
                { name: 'Russian Twists', sets: 3, reps: '20 reps', rest_seconds: 45, description: 'Rotate torso side to side with elevated feet and steady cadence.' },
                { name: 'Bear Plank Hold', sets: 3, reps: '30 seconds', rest_seconds: 45, description: 'Hover knees 2 inches above ground under hips, bracing core.' },
            ]
        },
        {
            day: 'Sunday', focus_area: 'Rest & Gentle Recovery', duration_minutes: 25, rest_day: true, warmup: 'Slow diaphragmatic breathing',
            exercises: [
                { name: 'Child Pose to Cobra Flow', sets: 3, reps: '60 seconds', rest_seconds: 30, description: 'Gentle spinal decompression, breathing into the lower back and shoulders.' },
                { name: 'Hamstring & Calf Stretch', sets: 2, reps: '45s each', rest_seconds: 30, description: 'Hinge forward with flat back to relieve leg tightness from the week.' },
            ]
        }
    ], []);

    const rawPlan = planResponse?.plan_data || planResponse?.plan;
    const currentWeekPlan = useMemo(() => {
        if (!rawPlan) return defaultWeekPlan;
        const parsed = typeof rawPlan === 'string' ? JSON.parse(rawPlan) : rawPlan;
        if (Array.isArray(parsed?.days)) return parsed.days;
        if (parsed?.week && Array.isArray(parsed.week)) return parsed.week;
        return defaultWeekPlan;
    }, [rawPlan, defaultWeekPlan]);

    const activeDayWorkout = useMemo(() => {
        return currentWeekPlan.find(d => (d.day || '').toLowerCase() === selectedDay.toLowerCase()) || currentWeekPlan[0];
    }, [currentWeekPlan, selectedDay]);

    const activeExercises = useMemo(() => {
        return activeDayWorkout?.exercises || [];
    }, [activeDayWorkout]);

    const activeExercise = activeExercises[activeExerciseIndex] || activeExercises[0] || { name: 'Bodyweight Squats' };

    const sessionPlanPayload = useMemo(() => {
        if (!activeDayWorkout) return null;
        return {
            ...activeDayWorkout,
            exercises: activeExercises
        };
    }, [activeDayWorkout, activeExercises]);

    const handleSelectExercise = (idx) => {
        setActiveExerciseIndex(idx);
    };

    const handleStartWebcam = (exerciseName) => {
        setWebcamModalOpen(true);
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0F19] text-[#F1F5F9] font-['Inter',sans-serif]">
            <Sidebar />

            <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-12 min-h-screen overflow-x-hidden flex flex-col items-center">
                <div className="w-full max-w-5xl space-y-8">
                    {/* Spacious Header with Breathing Room */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                <Activity size={14} />
                                <span>Cult.fit Inspired Training Flow</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                                Daily Movement & Form Tracking
                            </h1>
                            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                                Thoughtfully paced workouts designed around progressive overload, biomechanical alignment, and recovery.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => handleStartWebcam(activeExercise.name)}
                                className="btn btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2 rounded-full shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
                            >
                                <Camera size={16} />
                                <span>Start Webcam Session</span>
                            </button>

                            <button 
                                onClick={() => genMut.mutate()} 
                                disabled={genMut.isPending} 
                                className="btn btn-secondary px-5 py-3 text-sm rounded-full"
                            >
                                {genMut.isPending ? <Loader2 size={16} className="spinner" /> : <Sparkles size={16} />}
                                <span>Calibrate Routine</span>
                            </button>
                        </div>
                    </div>

                    {/* Day Selection Bar - Spacious & Minimal */}
                    <div className="space-y-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                            Select Training Day
                        </span>
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                            {daysOfWeek.map((day) => {
                                const isToday = day.toLowerCase() === todayName.toLowerCase();
                                const isSelected = selectedDay.toLowerCase() === day.toLowerCase();
                                return (
                                    <button
                                        key={day}
                                        onClick={() => {
                                            setSelectedDay(day);
                                            setActiveExerciseIndex(0);
                                        }}
                                        className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                                            isSelected
                                                ? 'bg-white text-slate-950 font-semibold shadow-lg shadow-white/10'
                                                : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        <span>{day}</span>
                                        {isToday && (
                                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Routine Container: Spacious & Breathable */}
                    <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8">
                        {/* Routine Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold tracking-tight text-white">
                                        {selectedDay}: {activeDayWorkout?.focus_area || 'Movement Protocol'}
                                    </h2>
                                    {activeDayWorkout?.rest_day && (
                                        <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium">
                                            Active Recovery
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-5 text-sm text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={15} className="text-emerald-400" />
                                        <span>{activeDayWorkout?.duration_minutes || 45} mins total</span>
                                    </span>
                                    <span className="text-slate-700">•</span>
                                    <span className="flex items-center gap-1.5">
                                        <Dumbbell size={15} className="text-sky-400" />
                                        <span>{activeExercises.length} progressive movements</span>
                                    </span>
                                </div>
                            </div>

                            <Link 
                                to={`/workout-session?plan=${encodeURIComponent(JSON.stringify(sessionPlanPayload))}`}
                                className="btn btn-secondary px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
                            >
                                <Play size={15} className="fill-current text-emerald-400" />
                                <span>Open Full-Screen Player</span>
                            </Link>
                        </div>

                        {/* Warm-up protocol notice */}
                        {activeDayWorkout?.warmup && activeDayWorkout.warmup !== 'None' && (
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3.5">
                                <Sparkles size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                        Preparation & Joint Mobility
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {activeDayWorkout.warmup}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Form tutorial for the selected movement */}
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                            <div className="aspect-video">
                                <iframe
                                    key={activeExercise.name}
                                    src={exerciseEmbedUrl(activeExercise.name)}
                                    title={`${activeExercise.name} form tutorial`}
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                            </div>
                            <div className="bg-slate-950 px-4 py-3 text-sm text-slate-300">
                                Form guide: {activeExercise.name}
                            </div>
                        </div>

                        {/* Active Exercise Visual Anchor Notice */}
                        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                            <span className="font-medium">
                                Click any movement below to visually anchor the AI webcam tracker:
                            </span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Target size={13} />
                                Active: {activeExercise.name}
                            </span>
                        </div>

                        {/* Redesigned Clean Exercise Cards */}
                        <div className="space-y-4">
                            {activeExercises.map((ex, idx) => {
                                const isSelectedActive = activeExerciseIndex === idx;
                                return (
                                    <div 
                                        key={idx}
                                        onClick={() => handleSelectExercise(idx)}
                                        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                            isSelectedActive
                                                ? 'bg-white/[0.04] border-emerald-500/40 shadow-xl shadow-emerald-500/5'
                                                : 'bg-white/[0.015] border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.025]'
                                        }`}
                                    >
                                        {/* Movement Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                                                    isSelectedActive
                                                        ? 'bg-emerald-500 text-slate-950 font-bold'
                                                        : 'bg-white/[0.05] text-slate-400'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <h3 className="font-bold text-base sm:text-lg text-white">
                                                    {ex.name}
                                                </h3>
                                                {isSelectedActive && (
                                                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                                        Active Tracking
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-10 mt-1">
                                                {ex.description || 'Focus on controlled eccentric lowering, pause at peak contraction, and steady breathing.'}
                                            </p>

                                            {/* Dedicated horizontal metrics container sitting beneath exercise description */}
                                            <div className="flex gap-4 mt-3 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg w-fit ml-10">
                                                <span><strong className="text-white font-semibold">{ex.sets || 3}</strong> Sets</span>
                                                <span className="text-slate-600">•</span>
                                                <span><strong className="text-emerald-400 font-semibold">{ex.reps || '12'}</strong> Reps</span>
                                                <span className="text-slate-600">•</span>
                                                <span><strong className="text-sky-400 font-semibold">{ex.rest_seconds || 45}s</strong> Rest</span>
                                            </div>
                                        </div>

                                        {/* Distinct floating action pill on the right side */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveExerciseIndex(idx);
                                                setWebcamModalOpen(true);
                                            }}
                                            className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-200 self-start sm:self-center shadow-sm ${
                                                isSelectedActive
                                                    ? 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                                                    : 'bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-white'
                                            }`}
                                        >
                                            <Camera size={14} />
                                            <span>Track</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* Webcam Synchronized Modal */}
            <WebcamModal
                isOpen={webcamModalOpen}
                onClose={() => setWebcamModalOpen(false)}
                exerciseName={activeExercise.name}
                targetReps={parseInt(activeExercise.reps || '12') || 12}
                targetSets={activeExercise.sets || 3}
            />
        </div>
    );
}
