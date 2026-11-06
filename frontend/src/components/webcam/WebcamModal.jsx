import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import WebcamVisionHUD from './WebcamVisionHUD';

export default function WebcamModal({
    isOpen,
    onClose,
    exerciseName = 'Bodyweight Squats',
    targetReps = 12,
    targetSets = 3,
}) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                    className="w-full max-w-4xl bg-[#0B0F19] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                >
                    {/* Modal Top Header */}
                    <div className="px-7 py-5 bg-[#111827]/70 border-b border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <h3 className="font-semibold text-base text-white font-['Plus_Jakarta_Sans',sans-serif]">
                                AI Biomechanical Posture Tracker
                            </h3>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                to="/workout-session"
                                onClick={onClose}
                                className="btn btn-secondary px-4 py-2 text-xs rounded-full flex items-center gap-1.5"
                                title="Open in dedicated full-page view"
                            >
                                <ExternalLink size={12} />
                                <span className="hidden sm:inline">Dedicated Player</span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition border border-white/10"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body: Vision HUD */}
                    <div className="p-4 sm:p-7 overflow-y-auto">
                        <WebcamVisionHUD
                            exerciseName={exerciseName}
                            targetReps={targetReps}
                            targetSets={targetSets}
                            isModal={true}
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
