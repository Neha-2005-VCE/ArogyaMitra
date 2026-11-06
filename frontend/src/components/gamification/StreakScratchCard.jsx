import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Zap, Gift, CheckCircle, RefreshCw } from 'lucide-react';
import useWellnessStore from '../../stores/wellnessStore';
import { playPop, playSpinTick } from '../../utils/soundEffects';

export default function StreakScratchCard() {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [scratchPercent, setScratchPercent] = useState(0);
    const [isFullyRevealed, setIsFullyRevealed] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const scratchState = useWellnessStore((s) => s.scratchStateByDate[todayStr]);
    const revealScratchCard = useWellnessStore((s) => s.revealScratchCard);
    const streakDays = useWellnessStore((s) => s.streakDays);

    const prizeXp = 150;

    // Check if already claimed today
    useEffect(() => {
        if (scratchState?.revealed) {
            setIsFullyRevealed(true);
            setScratchPercent(100);
        }
    }, [scratchState]);

    // Initialize Canvas Foil
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.offsetWidth || 340;
        const height = canvas.offsetHeight || 150;
        canvas.width = width;
        canvas.height = height;

        // Metallic Slate / Silver Foil Gradient
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#334155');
        grad.addColorStop(0.25, '#64748B');
        grad.addColorStop(0.5, '#475569');
        grad.addColorStop(0.75, '#94A3B8');
        grad.addColorStop(1, '#1E293B');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Subtle glitter specks
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(16,185,129,0.3)';
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Foil Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ SCRATCH TO REVEAL ✨', width / 2, height / 2 - 8);

        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(`Day ${streakDays} Bonus Streak Drop`, width / 2, height / 2 + 12);
    }, [streakDays]);

    useEffect(() => {
        if (!isFullyRevealed) {
            initCanvas();
        }
    }, [initCanvas, isFullyRevealed]);

    // Calculate Scratched Percentage
    const computeScratchPercent = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imgData.data;
            let transparentCount = 0;
            const step = 32; // Sample every 32nd pixel for blazing performance

            for (let i = 3; i < pixels.length; i += step * 4) {
                if (pixels[i] === 0) {
                    transparentCount++;
                }
            }

            const totalSampled = pixels.length / (step * 4);
            const pct = Math.round((transparentCount / totalSampled) * 100);
            setScratchPercent(pct);

            if (pct >= 40 && !isFullyRevealed) {
                triggerAutoReveal();
            }
        } catch (e) {}
    };

    const triggerAutoReveal = () => {
        setIsFullyRevealed(true);
        setScratchPercent(100);
        revealScratchCard(prizeXp, todayStr);
    };

    // Scratching Handlers
    const scratch = (clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas || isFullyRevealed) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();

        playSpinTick();
        computeScratchPercent();
    };

    const handleMouseDown = (e) => {
        setIsDrawing(true);
        scratch(e.clientX, e.clientY);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        scratch(e.clientX, e.clientY);
    };

    const handleMouseUp = () => setIsDrawing(false);

    const handleTouchStart = (e) => {
        if (e.touches.length > 0) {
            setIsDrawing(true);
            scratch(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e) => {
        if (!isDrawing || e.touches.length === 0) return;
        scratch(e.touches[0].clientX, e.touches[0].clientY);
    };

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Gift size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                            <span>Streak Scratch Card</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                                DAILY
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                            Scratch to claim bonus XP & multiplier
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-400">Scratched:</span>
                    <div className="text-sm font-mono font-bold text-emerald-400">{scratchPercent}%</div>
                </div>
            </div>

            {/* Scratching Arena - Sleek Debulked Height */}
            <div className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden border border-white/10 bg-[#070A10] flex items-center justify-center shadow-inner select-none touch-none">
                {/* Prize Card (Behind Canvas) */}
                <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-emerald-950/40 via-slate-900 to-cyan-950/40">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: isFullyRevealed ? 1 : 0.9, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="space-y-1.5"
                    >
                        <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md">
                            <Trophy size={20} className="fill-slate-950" />
                        </div>
                        <div className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                            +{prizeXp} BONUS XP UNLOCKED!
                        </div>
                        <p className="text-[11px] text-slate-300 max-w-xs mx-auto leading-tight">
                            🔥 {streakDays}-Day Consistency Champion! 1.5× Rep multiplier activated.
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            <CheckCircle size={12} />
                            <span>Claimed & Saved</span>
                        </div>
                    </motion.div>
                </div>

                {/* Foil Canvas Layer */}
                {!isFullyRevealed && (
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                        className="absolute inset-0 w-full h-full cursor-crosshair z-10 transition-opacity duration-300"
                    />
                )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5 text-slate-400">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>Refreshes daily at midnight</span>
                </span>
                {isFullyRevealed && (
                    <button
                        onClick={() => {
                            setIsFullyRevealed(false);
                            setScratchPercent(0);
                            setTimeout(initCanvas, 50);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 transition font-semibold flex items-center gap-1 text-xs"
                    >
                        <RefreshCw size={12} /> Practice
                    </button>
                )}
            </div>
        </div>
    );
}
