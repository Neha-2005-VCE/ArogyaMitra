import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { workoutApi } from '../services/api'
import toast from 'react-hot-toast'
import { Target, ArrowLeft, Trophy, Play, CheckCircle2, Circle, ShieldAlert, Zap, Skull, Shield } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function BossBattle() {
    const navigate = useNavigate()
    const [battle, setBattle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [roundsCompleted, setRoundsCompleted] = useState(0)
    const [isStarted, setIsStarted] = useState(false)
    const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minutes
    const [checkedExercises, setCheckedExercises] = useState([])
    const [damageEffect, setDamageEffect] = useState(false)
    const [bossDefeated, setBossDefeated] = useState(false)

    useEffect(() => {
        loadBattle()
    }, [])

    useEffect(() => {
        let timer;
        if (isStarted && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0 && isStarted) {
            endBattle()
        }
        return () => clearInterval(timer)
    }, [isStarted, timeLeft])

    const loadBattle = async () => {
        try {
            const res = await workoutApi.getBossBattle()
            setBattle(res.data)
            setTimeLeft(res.data.duration_minutes * 60)
            setLoading(false)
        } catch (err) {
            toast.error('Could not load boss battle')
            navigate('/workouts')
        }
    }

    const handleCheck = (index) => {
        if (!isStarted) {
            toast('Encounter must be started first.', { icon: '🛡️', style: { borderRadius: '10px', background: '#333', color: '#fff' } })
            return
        }

        // Toggle check
        if (checkedExercises.includes(index)) {
            setCheckedExercises(p => p.filter(i => i !== index))
            return
        }

        const newChecked = [...checkedExercises, index]
        setCheckedExercises(newChecked)

        // Complete Round Check inside handleCheck to immediately verify length
        if (newChecked.length === battle.exercises.length) {
            setTimeout(() => {
                completeRound()
            }, 400) // slight delay to show the final checkmark animation
        }
    }

    const completeRound = () => {
        const newRounds = roundsCompleted + 1
        setRoundsCompleted(newRounds)
        setCheckedExercises([])
        setDamageEffect(true)
        setTimeout(() => setDamageEffect(false), 500)

        // Trigger Boss Defeat notification once target rounds are hit
        if (newRounds >= battle.target_rounds && !bossDefeated) {
            setBossDefeated(true)
            toast.success("Boss Defeated! You can keep going for bonus EXP! 🏆", {
                duration: 8000,
                style: {
                    borderRadius: '10px',
                    background: '#06080C',
                    color: '#BFFF00',
                    border: '1px solid #BFFF00'
                },
            })
        }
    }

    const endBattle = async () => {
        setIsStarted(false)
        const t = toast.loading('Recording battle results...')
        try {
            const res = await workoutApi.completeBossBattle({
                rounds_completed: roundsCompleted,
                duration_minutes: battle.duration_minutes - (timeLeft / 60)
            })
            toast.success(res.data.message, { id: t, duration: 5000 })
            setTimeout(() => navigate('/dashboard'), 2000)
        } catch (err) {
            toast.error('Failed to submit results', { id: t })
        }
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    if (loading) return (
        <div className="min-h-screen bg-[#06080C] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#3D4A5C] border-t-[#BFFF00] rounded-full animate-spin" />
        </div>
    )

    const bossHealthPercent = Math.max(0, 100 - ((roundsCompleted / battle.target_rounds) * 100))

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#06080C] pt-28 pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[#6B7A90] hover:text-white transition-colors mb-6 group w-fit"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-transform glass-hover">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Leave Arena</span>
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass rounded-[2rem] p-8 md:p-12 relative overflow-hidden transition-all duration-300 ${damageEffect ? 'border-red-500/80 shadow-[0_0_100px_rgba(239,68,68,0.3)] bg-red-900/10 scale-[0.99] translate-x-1' : 'border-purple-500/20'}`}
                    >
                        {/* Background Glows */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none -mt-20 -mr-20" />
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-600/5 blur-[80px] rounded-full pointer-events-none -mb-10 -ml-10" />

                        {/* Header Section */}
                        <div className="relative z-10 flex flex-col items-center text-center mb-12">
                            <motion.div
                                animate={damageEffect ? { rotate: [0, -15, 15, -10, 10, 0], scale: 1.1 } : bossDefeated ? { scale: [1, 1.1, 1] } : {}}
                                transition={damageEffect ? { duration: 0.3 } : bossDefeated ? { repeat: Infinity, duration: 2 } : {}}
                                className={`w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-black border ${bossDefeated ? 'border-green-500/50 grayscale shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 'border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)]'} flex items-center justify-center text-6xl mb-6`}
                            >
                                {bossDefeated ? '💀' : '🐉'}
                            </motion.div>

                            <span className={`px-5 py-2 rounded-full ${bossDefeated ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'} text-xs font-bold uppercase tracking-[0.2em] border mb-4 shadow-xl`}>
                                {bossDefeated ? 'Boss Defeated' : 'Weekly Event Active'}
                            </span>

                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
                                {battle.boss_name}
                            </h1>
                        </div>

                        {/* Instructions Modal before start */}
                        {!isStarted && roundsCompleted === 0 && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative z-10 max-w-2xl mx-auto mb-12 bg-white/[0.03] border border-white/[0.08] p-8 rounded-[2rem] shadow-2xl backdrop-blur-md"
                            >
                                <h3 className="text-[#BFFF00] font-black text-xl mb-4 flex items-center justify-center gap-3">
                                    <ShieldAlert className="w-6 h-6" /> HOW TO PLAY
                                </h3>
                                <ul className="text-[#6B7A90] font-medium text-left space-y-4">
                                    <li className="flex gap-3">
                                        <span className="text-[#BFFF00] bg-[#BFFF00]/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                                        <span>The <strong className="text-white">{battle.duration_minutes}-minute encounter</strong> begins once you hit Engage. Do not start until you are fully ready.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-[#BFFF00] bg-[#BFFF00]/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                                        <span>Perform the exercises in the <strong>Circuit Protocol</strong>. Check off each exercise manually as you complete it.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-[#BFFF00] bg-[#BFFF00]/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                                        <span>Checking off all tasks finishes <strong className="text-white">1 Round</strong> and deals <strong className="text-red-400">{(100 / battle.target_rounds)}% damage</strong> to the boss.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-[#BFFF00] bg-[#BFFF00]/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
                                        <span>Deplete the boss's Health by completing <strong className="text-purple-400">{battle.target_rounds} Rounds</strong> to win. Surviving and doing extra rounds grants bonus EXP overkill.</span>
                                    </li>
                                </ul>
                            </motion.div>
                        )}

                        {/* Main Battle Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">

                            {/* Left Col: Exercises */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Target className="w-6 h-6 text-[#BFFF00]" />
                                        <h3 className="text-white font-black text-xl tracking-tight">Circuit Protocol</h3>
                                    </div>
                                    <span className="text-xs font-bold text-[#6B7A90] uppercase tracking-widest bg-white/[0.05] px-3 py-1 rounded-full border border-white/[0.05]">
                                        {battle.exercises.length} Tasks per round
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {battle.exercises.map((ex, i) => {
                                        const isChecked = checkedExercises.includes(i)
                                        return (
                                            <motion.div
                                                key={i}
                                                onClick={() => handleCheck(i)}
                                                whileHover={isStarted ? { scale: 1.02 } : {}}
                                                whileTap={isStarted ? { scale: 0.98 } : {}}
                                                className={`glass p-5 rounded-2xl flex items-center justify-between transition-all ${isStarted ? 'cursor-pointer shadow-lg' : 'opacity-50 grayscale pointer-events-none'} border
                          ${isChecked
                                                        ? 'bg-[#BFFF00]/10 border-[#BFFF00]/40 shadow-[0_0_20px_rgba(191,255,0,0.15)] opacity-80'
                                                        : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-1.5 rounded-full border-2 transition-colors ${isChecked ? 'border-[#BFFF00] bg-[#BFFF00] text-black' : 'border-[#6B7A90] text-transparent'}`}>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-2xl">{ex.icon}</div>
                                                    <span className={`font-bold text-lg select-none ${isChecked ? 'text-[#BFFF00] line-through decoration-2 opacity-80' : 'text-white'}`}>{ex.name}</span>
                                                </div>
                                                <div className={`px-4 py-2 rounded-xl border font-black select-none ${isChecked ? 'bg-[#BFFF00]/20 border-[#BFFF00]/40 text-[#BFFF00]' : 'bg-white/5 border-white/10 text-white'}`}>
                                                    {ex.reps} <span className="text-[#6B7A90] text-xs uppercase tracking-widest font-bold ml-1">Reps</span>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Right Col: Timer & Stats */}
                            <div className="flex flex-col gap-6">
                                <div className="glass p-8 rounded-[2rem] bg-black/40 border border-white/[0.08] flex flex-col items-center justify-center text-center h-full shadow-2xl relative overflow-hidden">

                                    {/* Decorative background for combat side */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#BFFF00]/10 via-transparent to-transparent opacity-50"></div>

                                    {/* Boss HP Bar */}
                                    <div className="w-full mb-8 relative z-10">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-[#6B7A90] font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-purple-400" /> BOSS HEALTH
                                            </span>
                                            <span className={`font-black text-xl tracking-tighter ${bossHealthPercent === 0 ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "text-white"}`}>
                                                {bossHealthPercent}%
                                            </span>
                                        </div>
                                        <div className="h-6 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.08] relative shadow-inner">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-50 z-10 mix-blend-overlay"></div>
                                            <motion.div
                                                className={`absolute top-0 left-0 h-full transition-all ${bossHealthPercent > 50 ? 'bg-gradient-to-r from-purple-600 to-indigo-500' : 'bg-gradient-to-r from-orange-500 to-red-600'}`}
                                                initial={{ width: '100%' }}
                                                animate={{ width: `${bossHealthPercent}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", type: 'spring', stiffness: 50 }}
                                            />
                                        </div>
                                    </div>

                                    {!isStarted && roundsCompleted === 0 ? (
                                        <div className="w-full relative z-10 pt-4">
                                            <div className="text-7xl font-black text-white tracking-tighter mb-2 font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                                {formatTime(timeLeft)}
                                            </div>
                                            <p className="text-[#6B7A90] font-bold uppercase tracking-widest text-sm mb-10">Awaiting Engagement</p>

                                            <button
                                                onClick={() => setIsStarted(true)}
                                                className="w-full py-5 rounded-2xl bg-[#BFFF00] text-black font-black text-xl uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(191,255,0,0.3)] hover:shadow-[0_0_60px_rgba(191,255,0,0.5)] flex items-center justify-center gap-3 border border-[#BFFF00]"
                                            >
                                                <Zap className="w-6 h-6 fill-current" />
                                                Engage Boss
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full relative z-10">
                                            <div className="text-7xl font-black tracking-tighter mb-2 font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                {formatTime(timeLeft)}
                                            </div>
                                            <p className="text-red-400 font-bold uppercase tracking-widest text-sm mb-8 flex items-center justify-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Combat Active
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                                                    <p className="text-[#6B7A90] font-black uppercase tracking-widest text-[10px] mb-1">Rounds Done</p>
                                                    <div className="text-5xl font-black text-white">{roundsCompleted}</div>
                                                </div>
                                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                                                    <p className="text-[#BFFF00] font-black uppercase tracking-widest text-[10px] mb-1 opacity-70">Damage Dealt</p>
                                                    <div className="text-3xl font-black text-[#BFFF00] drop-shadow-[0_0_10px_rgba(191,255,0,0.4)] tracking-tighter">
                                                        {(roundsCompleted * (100 / battle.target_rounds)).toFixed(0)}%
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={endBattle}
                                                className={`w-full py-5 flex items-center justify-center gap-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 outline-none font-black text-lg uppercase tracking-widest
                          ${bossDefeated
                                                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:bg-purple-600/30'
                                                        : 'bg-white/[0.02] border-white/[0.1] text-[#6B7A90] hover:text-white hover:bg-white/[0.05]'
                                                    }`}
                                            >
                                                {bossDefeated ? <Trophy className="w-6 h-6 text-purple-400" /> : <Skull className="w-5 h-5 opacity-50" />}
                                                <span>{bossDefeated ? "Claim Victory & EXP" : "Retreat (End Early)"}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    )
}
