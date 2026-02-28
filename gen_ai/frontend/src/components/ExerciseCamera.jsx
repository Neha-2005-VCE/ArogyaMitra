import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, RotateCcw, X, Zap, TrendingUp, AlertCircle, Play, Youtube, Maximize2, Minimize2, Eye, VolumeX, Volume2 } from 'lucide-react'

/**
 * ExerciseCamera — Webcam motion tracking + YouTube tutorial PiP.
 *
 * - Side-by-side layout on desktop (camera left, tutorial right)
 * - Switchable tabs on mobile (Camera ↔ Tutorial)
 * - Draggable floating PiP on desktop when tutorial is minimized
 * - Rep counting via frame-differencing motion detection
 */
export default function ExerciseCamera({ exerciseName, videoId, embedUrl, targetReps = 12, onComplete, onClose }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const prevFrameRef = useRef(null)
    const animFrameRef = useRef(null)

    const [cameraActive, setCameraActive] = useState(false)
    const [repCount, setRepCount] = useState(0)
    const [motionLevel, setMotionLevel] = useState(0)
    const [formFeedback, setFormFeedback] = useState('Get in position...')
    const [isMoving, setIsMoving] = useState(false)
    const [phase, setPhase] = useState('idle') // idle | up | down
    const [caloriesEstimate, setCaloriesEstimate] = useState(0)
    const [sessionTime, setSessionTime] = useState(0)
    const [error, setError] = useState(null)

    // Layout modes
    const [mobileTab, setMobileTab] = useState('camera') // 'camera' | 'tutorial'
    const [pipMode, setPipMode] = useState('side')       // 'side' | 'float' | 'hidden'
    const [tutorialMuted, setTutorialMuted] = useState(true)

    const motionThreshold = 15
    const repCooldown = useRef(false)

    const ytEmbedSrc = embedUrl
        ? `${embedUrl}?autoplay=1&mute=${tutorialMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
        : videoId
            ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${tutorialMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
            : null

    // Session timer
    useEffect(() => {
        if (!cameraActive) return
        const timer = setInterval(() => setSessionTime(prev => prev + 1), 1000)
        return () => clearInterval(timer)
    }, [cameraActive])

    // Start camera
    const startCamera = async () => {
        setCameraActive(true) // Mount the video element first
        // Wait for React to mount the video element before getting stream
        setTimeout(async () => {
            try {
                setError(null)
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' }
                })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    try {
                        await videoRef.current.play()
                    } catch (playErr) {
                        console.error('Play error on video:', playErr)
                    }
                    setFormFeedback('Camera ready! Start your exercise.')
                }
            } catch (err) {
                console.error('Camera error:', err)
                setError('Cannot access camera. Please allow camera permissions.')
                setCameraActive(false)
            }
        }, 100)
    }

    // Stop camera
    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop())
            videoRef.current.srcObject = null
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setCameraActive(false)
        prevFrameRef.current = null
    }, [])

    // Motion detection loop
    useEffect(() => {
        if (!cameraActive) return

        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        canvas.width = 320
        canvas.height = 240

        const detectMotion = () => {
            if (!video.videoWidth) {
                animFrameRef.current = requestAnimationFrame(detectMotion)
                return
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const pixels = currentFrame.data

            if (prevFrameRef.current) {
                const prev = prevFrameRef.current.data
                let diffPixels = 0
                const totalPixels = pixels.length / 4

                for (let i = 0; i < pixels.length; i += 16) {
                    const rDiff = Math.abs(pixels[i] - prev[i])
                    const gDiff = Math.abs(pixels[i + 1] - prev[i + 1])
                    const bDiff = Math.abs(pixels[i + 2] - prev[i + 2])
                    const avgDiff = (rDiff + gDiff + bDiff) / 3
                    if (avgDiff > motionThreshold) diffPixels++
                }

                const motionPercent = (diffPixels / (totalPixels / 4)) * 100
                setMotionLevel(Math.min(motionPercent, 100))

                const moving = motionPercent > 3

                if (moving && !isMoving && !repCooldown.current) {
                    setPhase('up')
                    setFormFeedback('Good motion! Keep going 💪')
                } else if (!moving && isMoving && phase === 'up') {
                    setPhase('down')
                    setRepCount(prev => {
                        const n = prev + 1
                        setCaloriesEstimate(Math.round(n * 3.5))
                        return n
                    })
                    setFormFeedback(getRepFeedback())
                    repCooldown.current = true
                    setTimeout(() => { repCooldown.current = false }, 600)
                }
                setIsMoving(moving)
            }

            prevFrameRef.current = currentFrame
            animFrameRef.current = requestAnimationFrame(detectMotion)
        }

        animFrameRef.current = requestAnimationFrame(detectMotion)
        return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
    }, [cameraActive, isMoving, phase])

    // Cleanup
    useEffect(() => () => stopCamera(), [stopCamera])

    const getRepFeedback = () => {
        const m = [
            'Great rep! 🔥', 'Excellent form! 💪', 'Keep it up! ⚡',
            'You\u2019re crushing it! 🎯', 'Perfect tempo! 👏',
            'Strong! Keep pushing! 💥', 'Almost there! 🏁', 'Beautiful! ✨',
        ]
        return m[Math.floor(Math.random() * m.length)]
    }

    const resetSession = () => {
        setRepCount(0)
        setCaloriesEstimate(0)
        setSessionTime(0)
        setMotionLevel(0)
        setFormFeedback('Ready! Start exercising.')
        setPhase('idle')
        prevFrameRef.current = null
    }

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
    const progress = Math.min((repCount / targetReps) * 100, 100)
    const isDone = repCount >= targetReps

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-0 md:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0a0a18] border border-[#1e1e38] rounded-none md:rounded-3xl w-full max-w-6xl h-full md:h-auto md:max-h-[92vh] overflow-hidden flex flex-col"
            >
                {/* ── Header ────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e38] bg-[#0d0d1a] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-600/20">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm md:text-lg tracking-tight">Motion Tracker</h2>
                            <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">{exerciseName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Session timer badge */}
                        {cameraActive && (
                            <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white text-xs font-bold tabular-nums">{formatTime(sessionTime)}</span>
                            </div>
                        )}
                        <button onClick={() => { stopCamera(); onClose?.() }} className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Mobile Tab Switcher (only visible on small screens if tutorial available) ── */}
                {ytEmbedSrc && (
                    <div className="flex md:hidden border-b border-[#1e1e38] bg-[#0d0d1a] flex-shrink-0">
                        <button
                            onClick={() => setMobileTab('camera')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mobileTab === 'camera'
                                ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-600/5'
                                : 'text-gray-600 hover:text-gray-400'
                                }`}
                        >
                            <Camera className="w-4 h-4" /> Camera
                        </button>
                        <button
                            onClick={() => setMobileTab('tutorial')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mobileTab === 'tutorial'
                                ? 'text-red-400 border-b-2 border-red-500 bg-red-600/5'
                                : 'text-gray-600 hover:text-gray-400'
                                }`}
                        >
                            <Youtube className="w-4 h-4" /> Tutorial
                        </button>
                    </div>
                )}

                {/* ── Main Content ────────────────────────── */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* ── Camera Feed ── */}
                    <div className={`relative bg-black flex-1 min-h-0 ${ytEmbedSrc && mobileTab !== 'camera' ? 'hidden md:block' : ''}`}>

                        {cameraActive ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform -scale-x-100"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a18]">
                                {error ? (
                                    <div className="text-center px-6">
                                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                        <p className="text-red-400 text-sm mb-4">{error}</p>
                                        <button onClick={startCamera}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition">
                                            Try Again
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-20 h-20 rounded-full bg-purple-600/20 border-2 border-purple-500 flex items-center justify-center mx-auto mb-4"
                                        >
                                            <Camera className="w-8 h-8 text-purple-400" />
                                        </motion.div>
                                        <p className="text-gray-400 text-sm mb-4">Position yourself in front of the camera</p>
                                        <button onClick={startCamera}
                                            className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-8 py-3 rounded-xl font-semibold transition shadow-lg shadow-purple-500/20">
                                            📸 Start AI Pose Camera
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Live Overlay (when camera active) ── */}
                        {cameraActive && (
                            <>
                                {/* Hidden canvas for motion detection processing */}
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Floating PiP (desktop only, when in float mode) */}
                                {ytEmbedSrc && pipMode === 'float' && (
                                    <motion.div
                                        drag
                                        dragConstraints={{ left: -20, right: 300, top: -20, bottom: 200 }}
                                        className="absolute top-14 right-3 w-56 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20 z-20 hidden md:block"
                                    >
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={ytEmbedSrc}
                                            title="Tutorial PiP"
                                            frameBorder="0"
                                            allow="autoplay"
                                            className="pointer-events-none"
                                        />
                                        <div className="absolute top-1 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-white font-bold flex items-center gap-1">
                                            <Youtube className="w-3 h-3 text-red-500" /> PiP · Drag me
                                        </div>
                                        <button
                                            onClick={() => setPipMode('hidden')}
                                            className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-600 transition"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* PiP toggle button */}
                                {ytEmbedSrc && (
                                    <div className="absolute top-14 right-3 z-30 hidden md:flex gap-1">
                                        <button
                                            onClick={() => setPipMode(pipMode === 'float' ? 'hidden' : 'float')}
                                            className="bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-white hover:bg-black/80 transition"
                                            title={pipMode === 'float' ? 'Hide tutorial' : 'Show floating tutorial'}
                                        >
                                            {pipMode === 'float' ? <Minimize2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                )}

                                {/* Motion intensity bar */}
                                <div className="absolute top-3 left-3 right-3 md:right-16">
                                    <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                            <span>Body Motion</span>
                                            <span className={motionLevel > 20 ? 'text-green-400' : ''}>{Math.round(motionLevel)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full"
                                                animate={{ width: `${motionLevel}%` }}
                                                style={{
                                                    background: motionLevel > 50 ? '#22c55e'
                                                        : motionLevel > 15 ? '#8b5cf6'
                                                            : '#334155'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Rep counter overlay */}
                                <div className="absolute bottom-4 left-4">
                                    <div className="bg-black/80 backdrop-blur-lg rounded-2xl px-5 py-3 border border-white/10 shadow-2xl">
                                        <div className="flex items-baseline gap-1">
                                            <motion.span
                                                key={repCount}
                                                initial={{ scale: 1.5, color: '#a78bfa' }}
                                                animate={{ scale: 1, color: '#ffffff' }}
                                                className="text-4xl font-black"
                                            >
                                                {repCount}
                                            </motion.span>
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">/ {targetReps} reps</span>
                                        </div>
                                        <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-purple-500"
                                                animate={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback popup */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={formFeedback}
                                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        className="absolute bottom-4 right-4"
                                    >
                                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl px-5 py-2.5 shadow-xl">
                                            <p className="text-white text-xs font-black italic tracking-wide">{formFeedback.toUpperCase()}</p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </>
                        )}
                    </div>

                    {/* ── YouTube Tutorial Panel ── */}
                    {ytEmbedSrc && (
                        <div className={`${mobileTab !== 'tutorial' ? 'hidden md:flex' : 'flex'} flex-col bg-[#0d0d1a] border-l border-[#1e1e38] w-full md:w-[380px] flex-shrink-0`}>
                            {/* Tutorial header */}
                            <div className="px-4 py-3 border-b border-[#1e1e38] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-red-600/20 flex items-center justify-center">
                                        <Youtube className="w-4 h-4 text-red-500" />
                                    </div>
                                    <span className="text-white font-bold text-xs uppercase tracking-widest">Tutorial</span>
                                </div>
                                <button
                                    onClick={() => setTutorialMuted(!tutorialMuted)}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition"
                                    title={tutorialMuted ? 'Unmute' : 'Mute'}
                                >
                                    {tutorialMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            {/* YouTube iframe */}
                            <div className="aspect-video bg-black overflow-hidden">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={ytEmbedSrc}
                                    title={exerciseName + ' tutorial'}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Exercise quick-tips under video */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Form Cues</h4>
                                {[
                                    "Form over load. Speed is the enemy of growth.",
                                    "Exhale on effort, inhale on reset.",
                                    "Maintain core rigidity for structural integrity.",
                                    "Full range of motion activates deeper tissue."
                                ].map((tip, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                                        <p className="text-gray-500 text-xs italic font-medium">"{tip}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Stats + Controls Sidebar (when no tutorial, or always on desktop) ── */}
                    {!ytEmbedSrc && (
                        <div className="w-full md:w-[280px] flex-shrink-0 p-4 space-y-4 bg-[#0d0d1a] border-l border-[#1e1e38]">
                            <StatsPanel
                                repCount={repCount}
                                targetReps={targetReps}
                                progress={progress}
                                isDone={isDone}
                                caloriesEstimate={caloriesEstimate}
                                sessionTime={sessionTime}
                                formatTime={formatTime}
                            />
                        </div>
                    )}
                </div>

                {/* ── Bottom Controls Bar ────────────────── */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-[#1e1e38] bg-[#0d0d1a] flex-shrink-0">
                    {/* Stats mini cards */}
                    <div className="flex gap-2 flex-1">
                        <div className="bg-[#13131f] rounded-xl px-3 py-2 flex items-center gap-2 border border-[#1e1e38]">
                            <Zap className="w-3.5 h-3.5 text-orange-400" />
                            <div>
                                <p className="text-white text-sm font-bold">{caloriesEstimate}</p>
                                <p className="text-[8px] text-gray-500 font-bold uppercase">cal</p>
                            </div>
                        </div>
                        <div className="bg-[#13131f] rounded-xl px-3 py-2 flex items-center gap-2 border border-[#1e1e38]">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                            <div>
                                <p className="text-white text-sm font-bold tabular-nums">{formatTime(sessionTime)}</p>
                                <p className="text-[8px] text-gray-500 font-bold uppercase">time</p>
                            </div>
                        </div>
                        <div className="bg-[#13131f] rounded-xl px-3 py-2 flex items-center gap-2 border border-[#1e1e38]">
                            <Play className="w-3.5 h-3.5 text-purple-400" />
                            <div>
                                <p className="text-white text-sm font-bold">{repCount}<span className="text-gray-500 text-xs">/{targetReps}</span></p>
                                <p className="text-[8px] text-gray-500 font-bold uppercase">reps</p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button onClick={resetSession}
                            className="flex items-center gap-1.5 px-3 py-2.5 bg-[#13131f] border border-[#1e1e38] text-gray-400 hover:text-white hover:border-purple-500 rounded-xl transition text-xs font-bold">
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                        {cameraActive && (
                            <button onClick={stopCamera}
                                className="flex items-center gap-1.5 px-3 py-2.5 bg-red-600/10 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition text-xs font-bold">
                                <CameraOff className="w-3.5 h-3.5" /> Stop
                            </button>
                        )}
                        {isDone && onComplete && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => {
                                    stopCamera()
                                    onComplete({
                                        calories: caloriesEstimate,
                                        duration: Math.ceil(sessionTime / 60),
                                        reps: repCount
                                    })
                                }}
                                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition"
                            >
                                ✅ Complete
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function StatsPanel({ repCount, targetReps, progress, isDone, caloriesEstimate, sessionTime, formatTime }) {
    return (
        <>
            {/* Progress Ring */}
            <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-3">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a40" strokeWidth="8" />
                        <motion.circle
                            cx="50" cy="50" r="42" fill="none"
                            stroke={isDone ? '#22c55e' : '#7c3aed'}
                            strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={264}
                            animate={{ strokeDashoffset: 264 - (264 * progress) / 100 }}
                            transition={{ duration: 0.5 }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-2xl font-bold text-white">{repCount}</span>
                            <p className="text-[10px] text-gray-400">of {targetReps}</p>
                        </div>
                    </div>
                </div>
                {isDone && (
                    <motion.p
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-green-400 font-bold text-sm"
                    >
                        ✅ Set Complete!
                    </motion.p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
                    <Zap className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{caloriesEstimate}</p>
                    <p className="text-[10px] text-gray-400">cal burned</p>
                </div>
                <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{formatTime(sessionTime)}</p>
                    <p className="text-[10px] text-gray-400">duration</p>
                </div>
            </div>
        </>
    )
}
