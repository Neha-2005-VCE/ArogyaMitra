import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, 
    Pause, 
    SkipForward, 
    CheckCircle, 
    X, 
    Timer, 
    Flame, 
    Target, 
    Camera, 
    Video, 
    Activity, 
    Dumbbell, 
    Sparkles, 
    ArrowLeft 
} from 'lucide-react';
import { workoutSessionApi } from '../services/api';
import useAuthStore from '../stores/authStore';
import useWellnessStore from '../stores/wellnessStore';
import WebcamVisionHUD from '../components/webcam/WebcamVisionHUD';
import { playSuccess } from '../utils/soundEffects';
import { triggerSuperConfetti } from '../utils/confetti';
import { exerciseEmbedUrl } from '../utils/exerciseVideos';
import toast from 'react-hot-toast';

export default function WorkoutSession() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const recordCompletedExercise = useWellnessStore((s) => s.recordCompletedExercise);

    const [session, setSession] = useState(null);
    const [exercisesList, setExercisesList] = useState([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [loadingVideo, setLoadingVideo] = useState(false);

    // Load or create session
    useEffect(() => {
        let isMounted = true;

        const initializeSession = async () => {
            setLoading(true);
            try {
                const workoutPlanParam = searchParams.get('plan');
                let passedPlan = null;
                if (workoutPlanParam) {
                    try {
                        passedPlan = JSON.parse(decodeURIComponent(workoutPlanParam));
                    } catch (e) {
                        console.error('Failed to parse URL plan param:', e);
                    }
                }

                if (passedPlan && Array.isArray(passedPlan.exercises) && passedPlan.exercises.length > 0) {
                    if (isMounted) {
                        setSession({ focus_area: passedPlan.focus_area || 'Active Workout' });
                        setExercisesList(passedPlan.exercises);
                        setCurrentExerciseIndex(0);
                        setLoading(false);
                    }
                    return;
                }

                // Fallback default exercises
                const defaults = [
                    { name: 'Bodyweight Squats', sets: 3, reps: '15', rest_seconds: 60, description: 'Sit back into hips, chest upright, knees tracking over toes.' },
                    { name: 'Standard Push Ups', sets: 3, reps: '12', rest_seconds: 60, description: 'Maintain neutral spine, elbows tucked at 45 degrees.' },
                    { name: 'Core Plank Hold', sets: 3, reps: '45s', rest_seconds: 45, description: 'Engage glutes and core, straight line from heels to head.' },
                ];

                if (isMounted) {
                    setSession({ focus_area: 'Chest & Core Strength' });
                    setExercisesList(defaults);
                    setCurrentExerciseIndex(0);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to initialize session:', err);
                if (isMounted) setLoading(false);
            }
        };

        initializeSession();
        return () => { isMounted = false; };
    }, [searchParams]);

    const currentExercise = useMemo(() => {
        return exercisesList[currentExerciseIndex] || {
            name: 'Movement',
            sets: 3,
            reps: '12',
            rest_seconds: 45,
            description: 'Focus on form & steady breathing.'
        };
    }, [exercisesList, currentExerciseIndex]);

    // Fetch YouTube Tutorial for current movement
    useEffect(() => {
        if (!currentExercise?.name) return;
        setYoutubeUrl(exerciseEmbedUrl(currentExercise.name));
        setLoadingVideo(false);
    }, [currentExercise]);

    const handleCompleteMovement = (result = {}) => {
        playSuccess();
        triggerSuperConfetti();
        recordCompletedExercise({
            name: result.exerciseName || currentExercise.name,
            reps: result.reps || parseInt(currentExercise.reps, 10) || 0,
            durationSec: result.durationSec || 0,
        });
        toast.success(`Completed ${currentExercise.name} with correct reps`);

        if (currentExerciseIndex < exercisesList.length - 1) {
            setCurrentExerciseIndex((prev) => prev + 1);
            toast('Next movement loaded. Align with camera HUD ✨');
        } else {
            toast.success('🎉 Full Workout Routine Complete! Outstanding performance!');
            navigate('/progress');
        }
    };

    const handleSkip = () => {
        if (currentExerciseIndex < exercisesList.length - 1) {
            setCurrentExerciseIndex((prev) => prev + 1);
        } else {
            navigate('/workouts');
        }
    };

    const progressPercent = exercisesList.length > 0 
        ? Math.round(((currentExerciseIndex + 1) / exercisesList.length) * 100) 
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-emerald-400 animate-spin mx-auto" />
                    <p className="text-sm font-semibold">Calibrating AI Biomechanical Vision Session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Top Navigation Bar */}
            <div className="bg-slate-900/90 backdrop-blur-2xl border-b border-white/[0.08] sticky top-0 z-40 shadow-xl">
                <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <Link
                                to="/workouts"
                                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-white/10"
                                title="Exit to Workouts"
                            >
                                <ArrowLeft size={18} />
                            </Link>
                            <div>
                                <h1 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                                    <span>Live AI Vision Workout</span>
                                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        {session?.focus_area || 'Active Focus'}
                                    </span>
                                </h1>
                                <p className="text-xs text-slate-400">
                                    Current Exercise: <strong className="text-white">{currentExercise.name}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/workouts')}
                                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 transition flex items-center gap-1.5"
                            >
                                <X size={15} /> End
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                            <span>Movement {currentExerciseIndex + 1} of {exercisesList.length}</span>
                            <span className="font-bold text-emerald-400">{progressPercent}% Completed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stage Grid */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: High-Performance Webcam Vision HUD */}
                    <div className="lg:col-span-2 space-y-6">
                        <WebcamVisionHUD
                            key={currentExercise.name}
                            exerciseName={currentExercise.name}
                            targetReps={parseInt(currentExercise.reps || '12') || 12}
                            targetSets={currentExercise.sets || 3}
                            onCompleteExercise={handleCompleteMovement}
                        />

                        {/* YouTube Video Form Guide & Exercise Bio */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* YouTube Video Reference */}
                            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-lg">
                                <div className="aspect-video bg-black relative">
                                    {loadingVideo ? (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-950">
                                            <div className="text-center">
                                                <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-emerald-400 animate-spin mx-auto mb-2" />
                                                <p className="text-xs text-slate-400">Loading form guide...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <iframe
                                            key={youtubeUrl}
                                            width="100%"
                                            height="100%"
                                            src={youtubeUrl}
                                            title={`${currentExercise.name} form tutorial`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allowFullScreen
                                        />
                                    )}
                                </div>
                                <div className="p-3 bg-slate-950/80 border-t border-white/[0.08] flex items-center gap-2 text-xs text-slate-300">
                                    <Video size={14} className="text-cyan-400" />
                                    <span className="truncate">Form Guide: {currentExercise.name}</span>
                                </div>
                            </div>

                            {/* Bio Breakdown */}
                            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 flex flex-col justify-between shadow-lg">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-emerald-400 tracking-wider">
                                        <Target size={15} />
                                        <span>Target Movement</span>
                                    </div>
                                    <h3 className="font-extrabold text-base text-white mb-2">
                                        {currentExercise.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                        {currentExercise.description || 'Focus on controlled eccentric descent, pause momentarily at full range, and exhale through exertion.'}
                                    </p>
                                </div>

                                <div className="flex items-center divide-x divide-slate-800 bg-white/[0.025] border border-white/[0.06] rounded-2xl px-5 py-3 text-xs">
                                    <div className="pr-4 text-center">
                                        <div className="text-[10px] uppercase font-semibold text-slate-500">Sets</div>
                                        <div className="font-semibold text-white mt-0.5">{currentExercise.sets || 3}</div>
                                    </div>
                                    <div className="px-4 text-center">
                                        <div className="text-[10px] uppercase font-semibold text-slate-500">Reps</div>
                                        <div className="font-semibold text-emerald-400 mt-0.5">{currentExercise.reps || '12'}</div>
                                    </div>
                                    <div className="pl-4 text-center">
                                        <div className="text-[10px] uppercase font-semibold text-slate-500">Rest</div>
                                        <div className="font-semibold text-sky-400 mt-0.5">{currentExercise.rest_seconds || 45}s</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Controls & Actions */}
                    <div className="space-y-5">
                        {/* Session Actions Card */}
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-4">
                            <div>
                                <h3 className="font-extrabold text-base text-white mb-1">
                                    Workout Controller
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Save completed exercise or advance to next
                                </p>
                            </div>

                            <button
                                onClick={handleCompleteMovement}
                                className="btn btn-primary w-full py-3.5 text-sm font-black flex items-center justify-center gap-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            >
                                <CheckCircle size={18} /> Complete & Save Movement
                            </button>

                            <button
                                onClick={handleSkip}
                                className="btn btn-secondary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 rounded-full text-slate-300 hover:text-white"
                            >
                                <SkipForward size={16} /> Skip to Next Movement
                            </button>
                        </div>

                        {/* Real-time Coaching Cues */}
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                                <Sparkles size={14} /> AI Biomechanical Cues
                            </h4>
                            <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                    <span>Frame your full body in the webcam viewport so joints are illuminated in cyan.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                                    <span>Keep reps smooth and deliberate — the AI vision model tracks velocity and angle arcs.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <span>Each completed movement adds streak multipliers and charity nutrition meals.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
