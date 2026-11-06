import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, 
    CameraOff, 
    Play, 
    Pause, 
    RefreshCw, 
    CheckCircle2, 
    Activity, 
    Flame, 
    Sparkles, 
    Volume2, 
    VolumeX,
    Eye,
    Dumbbell,
    Check
} from 'lucide-react';
import { playRepCount, playSuccess } from '../../utils/soundEffects';
import { triggerConfetti } from '../../utils/confetti';
import useWellnessStore from '../../stores/wellnessStore';
import { createRepTracker, evaluatePose } from '../../utils/poseReps';

export default function WebcamVisionHUD({
    exerciseName = 'Bodyweight Squats',
    targetReps = 12,
    targetSets = 3,
    onCompleteExercise,
    isModal = false,
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Camera & Detection States
    const [cameraStatus, setCameraStatus] = useState('requesting'); // 'requesting' | 'active' | 'denied' | 'simulated'
    const [isTracking, setIsTracking] = useState(true);
    const [isActiveWorkout, setIsActiveWorkout] = useState(true);
    
    // Performance Metrics
    const [reps, setReps] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [formScore, setFormScore] = useState(0);
    const [formFeedback, setFormFeedback] = useState('Stand in frame. Reps count only when the movement is complete.');
    const [audioFeedback, setAudioFeedback] = useState(true);
    const [poseReady, setPoseReady] = useState(false);

    const addWebcamReps = useWellnessStore((s) => s.addWebcamReps);
    const exerciseRef = useRef(exerciseName);
    const trackingRef = useRef({ isTracking, isActiveWorkout, cameraStatus });
    const repTrackerRef = useRef(createRepTracker());
    const landmarkerRef = useRef(null);
    const elapsedRef = useRef(0);
    const uiStampRef = useRef(0);
    exerciseRef.current = exerciseName;
    trackingRef.current = { isTracking, isActiveWorkout, cameraStatus };
    elapsedRef.current = elapsedTime;

    // Stop Camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // Start Camera Stream
    const startCamera = useCallback(async () => {
        stopCamera();
        setCameraStatus('requesting');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraStatus('simulated');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: false,
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }
            setCameraStatus('active');
        } catch (err) {
            console.warn('Camera access unavailable or denied:', err);
            setCameraStatus('denied');
        }
    }, [stopCamera]);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [startCamera, stopCamera]);

    // Timer
    useEffect(() => {
        let interval = null;
        if (isActiveWorkout) {
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActiveWorkout]);

    const recordRep = useCallback((detail = {}) => {
        if (detail.feedback) setFormFeedback(detail.feedback);
        if (detail.formScore != null) setFormScore(detail.formScore);
        setReps((prev) => {
            const next = prev + 1;
            if (audioFeedback) playRepCount();
            addWebcamReps(1, 0.5);

            if (next >= targetReps) {
                playSuccess();
                triggerConfetti({ x: 0.5, y: 0.5 });
                setCurrentSet((s) => {
                    const nextSet = s + 1;
                    if (nextSet > targetSets) {
                        setIsActiveWorkout(false);
                        if (onCompleteExercise) {
                            onCompleteExercise({
                                reps: targetReps * targetSets,
                                durationSec: elapsedRef.current,
                                exerciseName,
                            });
                        }
                    }
                    return nextSet <= targetSets ? nextSet : s;
                });
                return 0;
            }
            return next;
        });
    }, [audioFeedback, targetReps, targetSets, addWebcamReps, onCompleteExercise, exerciseName]);

    const recordRepRef = useRef(recordRep);
    recordRepRef.current = recordRep;

    useEffect(() => {
        repTrackerRef.current = createRepTracker();
        setReps(0);
        setCurrentSet(1);
        setFormScore(0);
        setFormFeedback('Stand in frame. Reps count only when the movement is complete.');
    }, [exerciseName]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
                const fileset = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
                );
                const create = (delegate) => PoseLandmarker.createFromOptions(fileset, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                        delegate,
                    },
                    runningMode: 'VIDEO',
                    numPoses: 1,
                });
                let landmarker;
                try {
                    landmarker = await create('GPU');
                } catch {
                    landmarker = await create('CPU');
                }
                if (cancelled) {
                    landmarker.close?.();
                    return;
                }
                landmarkerRef.current = landmarker;
                setPoseReady(true);
            } catch (err) {
                console.warn('Pose model failed to load', err);
                if (!cancelled) setFormFeedback('Pose model did not load, so reps will not be counted.');
            }
        })();
        return () => {
            cancelled = true;
            landmarkerRef.current?.close?.();
            landmarkerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastVideoTime = -1;
        const links = [
            [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 12], [11, 23], [12, 24], [23, 24],
            [23, 25], [25, 27], [24, 26], [26, 28],
        ];

        const renderPose = () => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const live = trackingRef.current;
            const landmarker = landmarkerRef.current;
            if (live.cameraStatus === 'active' && landmarker && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;
                let landmarks = null;
                try {
                    const result = landmarker.detectForVideo(video, performance.now());
                    landmarks = result?.landmarks?.[0] || null;
                } catch (err) {
                    landmarks = null;
                }

                if (landmarks && live.isTracking) {
                    const point = (index) => ({
                        x: landmarks[index].x * width,
                        y: landmarks[index].y * height,
                    });
                    ctx.save();
                    ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    links.forEach(([a, b]) => {
                        const p1 = point(a);
                        const p2 = point(b);
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    });
                    landmarks.forEach((lm) => {
                        if ((lm.visibility ?? 1) < 0.5) return;
                        ctx.fillStyle = '#F8FAFC';
                        ctx.beginPath();
                        ctx.arc(lm.x * width, lm.y * height, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.restore();

                    if (live.isActiveWorkout) {
                        const verdict = evaluatePose(landmarks, exerciseRef.current, repTrackerRef.current);
                        const now = performance.now();
                        if (verdict.counted) {
                            recordRepRef.current(verdict);
                        } else if (now - uiStampRef.current > 500) {
                            uiStampRef.current = now;
                            setFormFeedback(verdict.feedback);
                            setFormScore(verdict.formScore);
                        }
                    }
                }
            }

            animationFrameRef.current = requestAnimationFrame(renderPose);
        };

        const resize = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);
        animationFrameRef.current = requestAnimationFrame(renderPose);

        return () => {
            window.removeEventListener('resize', resize);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [poseReady]);

    const formatSeconds = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-[#0B0F19] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Top Anchor Header: Prominently Visually Anchored to Active Exercise */}
            <div className="bg-[#111827]/80 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Dumbbell size={18} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                            Currently Tracking
                        </div>
                        <h3 className="font-semibold text-base sm:text-lg text-white">
                            {exerciseName}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Audio Toggle */}
                    <button
                        onClick={() => setAudioFeedback(!audioFeedback)}
                        className={`p-2.5 rounded-full border transition ${
                            audioFeedback
                                ? 'bg-white/[0.06] border-white/10 text-emerald-400'
                                : 'bg-transparent border-white/10 text-slate-500'
                        }`}
                        title="Toggle rep sound chime"
                    >
                        {audioFeedback ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    {/* Camera Status Badge */}
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08]">
                        <span className={`w-2 h-2 rounded-full ${
                            cameraStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'
                        }`} />
                        <span className="text-slate-300">
                            {cameraStatus === 'active'
                                ? (poseReady ? 'Form check live' : 'Loading pose model')
                                : cameraStatus === 'requesting'
                                ? 'Connecting...'
                                : 'Camera required'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Video Viewport Stage */}
            <div className="relative aspect-video sm:aspect-[16/9] w-full bg-[#080C14] flex items-center justify-center overflow-hidden">
                {/* HTML5 Live Video Stream */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-500 ${
                        cameraStatus === 'active' ? 'opacity-90' : 'opacity-0'
                    }`}
                />

                {/* Subtle Grid Backdrop (when camera blocked or simulated) */}
                {cameraStatus !== 'active' && (
                    <div className="absolute inset-0 bg-[#0B0F19] flex flex-col items-center justify-center p-8 text-center">
                        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

                        {cameraStatus === 'denied' ? (
                            <div className="relative z-10 max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                                    <CameraOff size={22} />
                                </div>
                                <h4 className="font-semibold text-white text-base">Camera Access Paused</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Reps stay at zero until the camera can see the exercise done correctly.
                                </p>
                                <div className="flex gap-2 justify-center pt-2">
                                    <button
                                        onClick={startCamera}
                                        className="btn btn-primary text-xs py-2 px-4 rounded-full"
                                    >
                                        <RefreshCw size={13} /> Retry Camera
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 text-center space-y-2">
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                    Waiting for the camera
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Overlaid Canvas Layer: Subtle Pose Skeleton */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10 -scale-x-100"
                />

                {/* Top Center: Form Guidance Pill */}
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
                    <motion.div
                        key={formFeedback}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs font-medium text-slate-200 flex items-center gap-2 shadow-lg"
                    >
                        <Sparkles size={13} className="text-emerald-400" />
                        <span>{formFeedback}</span>
                    </motion.div>
                </div>

                {/* Top Right: Form Accuracy Score */}
                <div className="absolute top-5 right-5 z-20 pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-right shadow-lg">
                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                            Form Score
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center justify-end gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{formScore}%</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Left: Apple-Fitness Style Rep Counter */}
                <div className="absolute bottom-6 left-6 z-20">
                    <motion.div
                        key={reps}
                        initial={{ scale: 1.15 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl flex items-center gap-5"
                    >
                        <div>
                            <div className="text-4xl sm:text-5xl font-black text-white font-mono leading-none tracking-tight">
                                {reps}
                            </div>
                            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1.5">
                                Reps Completed
                            </div>
                        </div>

                        <div className="w-px h-10 bg-white/10" />

                        <div>
                            <div className="text-xl sm:text-2xl font-semibold text-slate-300 font-mono leading-none">
                                Set {currentSet}/{targetSets}
                            </div>
                            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1.5">
                                Target: {targetReps}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Right: Clean Workout Controls */}
                <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2.5">
                    <button
                        onClick={() => setIsActiveWorkout(!isActiveWorkout)}
                        className={`px-5 py-3 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-lg ${
                            isActiveWorkout
                                ? 'bg-slate-800/90 text-slate-200 border border-white/10 hover:bg-slate-700'
                                : 'btn-primary'
                        }`}
                    >
                        {isActiveWorkout ? <Pause size={15} /> : <Play size={15} />}
                        <span>{isActiveWorkout ? 'Pause' : 'Resume'}</span>
                    </button>

                </div>
            </div>

            {/* Bottom Telemetry Bar with Soft Dividers */}
            <div className="bg-[#111827]/70 backdrop-blur-xl px-6 py-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
                <div className="flex items-center gap-6 divide-x divide-slate-800">
                    <span className="flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400" />
                        <span>Biomechanical Tracking Active</span>
                    </span>
                    <span className="pl-6 font-mono text-slate-300">
                        Session Time: {formatSeconds(elapsedTime)}
                    </span>
                </div>

                <div className="font-mono text-slate-300 font-medium">
                    Total Reps: {(currentSet - 1) * targetReps + reps}
                </div>
            </div>
        </div>
    );
}
