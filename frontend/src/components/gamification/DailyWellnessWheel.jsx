import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Zap, Sparkles, Award, ArrowDown } from 'lucide-react';
import useWellnessStore from '../../stores/wellnessStore';
import { playSpinTick } from '../../utils/soundEffects';

const WHEEL_SEGMENTS = [
    { label: '+100 XP', xp: 100, color: '#10B981', textColor: '#0B0F17' },
    { label: '🔥 2× Rep Boost', xp: 80, color: '#FF6B6B', textColor: '#FFFFFF' },
    { label: '+50 XP', xp: 50, color: '#06B6D4', textColor: '#0B0F17' },
    { label: '🥗 Meal Master', xp: 60, color: '#F59E0B', textColor: '#0B0F17' },
    { label: '💎 +200 XP JACKPOT', xp: 200, color: '#8B5CF6', textColor: '#FFFFFF' },
    { label: '💧 Hydration Star', xp: 40, color: '#38BDF8', textColor: '#0B0F17' },
    { label: '+75 XP', xp: 75, color: '#22C55E', textColor: '#0B0F17' },
    { label: '⚡ Energy Surge', xp: 90, color: '#F43F5E', textColor: '#FFFFFF' },
];

export default function DailyWellnessWheel() {
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const wheelState = useWellnessStore((s) => s.wheelStateByDate[todayStr]);
    const recordWheelSpin = useWellnessStore((s) => s.recordWheelSpin);

    const numSegments = WHEEL_SEGMENTS.length;
    const segmentAngle = 360 / numSegments;

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setWinner(null);

        // Pick random winning segment
        const winningIndex = Math.floor(Math.random() * numSegments);
        const selectedSegment = WHEEL_SEGMENTS[winningIndex];

        // Additional 5 to 8 full spins for excitement
        const fullSpins = (5 + Math.floor(Math.random() * 4)) * 360;
        
        // Calculate offset so pointer (at 12 o'clock, top = 270 deg or 0 relative offset) aligns
        // Segment 0 is from 0 to 45 deg, centered at 22.5 deg
        const targetAngle = fullSpins + (360 - (winningIndex * segmentAngle + segmentAngle / 2));
        const finalRotation = rotation + targetAngle;

        // Interval to play tick sound while spinning
        let ticks = 0;
        const tickInterval = setInterval(() => {
            playSpinTick();
            ticks++;
            if (ticks > 25) clearInterval(tickInterval);
        }, 120);

        setRotation(finalRotation);

        setTimeout(() => {
            clearInterval(tickInterval);
            setIsSpinning(false);
            setWinner(selectedSegment);
            recordWheelSpin(selectedSegment.label, selectedSegment.xp, todayStr);
        }, 4000);
    };

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-between">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <RotateCcw size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                            <span>Daily Wellness Wheel</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">
                                1 SPIN
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400">Spin for instant XP and workout perks</p>
                    </div>
                </div>

                {winner && (
                    <div className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                        Won: {winner.label}
                    </div>
                )}
            </div>

            {/* Wheel Container - Sleeker Debulked Size */}
            <div className="relative my-2 flex items-center justify-center">
                {/* Pointer Arrow at Top */}
                <div className="absolute -top-3 z-20 flex flex-col items-center pointer-events-none filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]">
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-amber-400" />
                </div>

                {/* Outer Glow Ring */}
                <div className="w-52 h-52 sm:w-56 sm:h-56 rounded-full p-2 bg-gradient-to-tr from-cyan-500/30 via-emerald-500/20 to-purple-500/30 border border-white/10 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex items-center justify-center">
                    {/* Rotating SVG Wheel */}
                    <div
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1.0)' : 'none',
                        }}
                        className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {WHEEL_SEGMENTS.map((seg, idx) => {
                                const startAngle = (idx * segmentAngle * Math.PI) / 180;
                                const endAngle = ((idx + 1) * segmentAngle * Math.PI) / 180;
                                const x1 = 50 + 50 * Math.cos(startAngle);
                                const y1 = 50 + 50 * Math.sin(startAngle);
                                const x2 = 50 + 50 * Math.cos(endAngle);
                                const y2 = 50 + 50 * Math.sin(endAngle);

                                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                                // Text angle
                                const midAngle = (idx + 0.5) * segmentAngle;
                                const rad = (midAngle * Math.PI) / 180;
                                const tx = 50 + 33 * Math.cos(rad);
                                const ty = 50 + 33 * Math.sin(rad);

                                return (
                                    <g key={idx}>
                                        <path d={pathData} fill={seg.color} stroke="#0B0F17" strokeWidth="0.8" />
                                        <text
                                            x={tx}
                                            y={ty}
                                            fill={seg.textColor}
                                            fontSize="4"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                                            fontFamily="Inter, sans-serif"
                                        >
                                            {seg.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* Center Hub Button */}
                    <button
                        onClick={handleSpin}
                        disabled={isSpinning}
                        className={`absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full z-10 flex flex-col items-center justify-center font-black text-[11px] tracking-wider border-2 border-white/30 shadow-2xl transition transform active:scale-95 ${
                            isSpinning
                                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 hover:scale-105 shadow-emerald-500/30'
                        }`}
                    >
                        <Zap size={16} className="mb-0.5 fill-current" />
                        <span>{isSpinning ? 'SPIN...' : 'SPIN'}</span>
                    </button>
                </div>
            </div>

            {/* Bottom Status */}
            <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1">
                    <Sparkles size={13} className="text-cyan-400" />
                    <span>Free daily spin</span>
                </span>
                <span className="font-mono text-emerald-400 font-semibold">Ready to Spin</span>
            </div>
        </div>
    );
}
