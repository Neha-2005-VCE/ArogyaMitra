import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Flame, MessageCircle, Heart, BarChart3, Bot, Target, Sparkles, Calendar, Zap, ArrowUpRight, TrendingUp, Dumbbell, Apple } from 'lucide-react'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import AROmiChat from '../components/AROmiChat'
import { workoutApi, nutritionApi, progressApi } from '../services/api'
import useAuthStore from '../stores/authStore'
import toast from 'react-hot-toast'

import MoodCheckin from '../components/MoodCheckin'
import AnalyticsReportModal from '../components/AnalyticsReportModal'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    workoutsCompleted: 0,
    caloriesBurned: 0,
    currentStreak: 0,
    charityPoints: 0
  })
  const [showChat, setShowChat] = useState(false)
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false)
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [todayMeals, setTodayMeals] = useState(null)
  const [showMoodCheckin, setShowMoodCheckin] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [bossBattle, setBossBattle] = useState(null)

  useEffect(() => {
    loadDashboardData()

    // Show mood checkin if not done today
    const today = new Date().toDateString();
    if (localStorage.getItem("arogyamitra-last-checkin") !== today) {
      setTimeout(() => setShowMoodCheckin(true), 1500)
    }
  }, [])

  const handleMoodCheckinComplete = (adjustedPlan) => {
    setShowMoodCheckin(false)
    localStorage.setItem("arogyamitra-last-checkin", new Date().toDateString())
    if (adjustedPlan) {
      loadDashboardData()
    }
  }



  const loadDashboardData = async () => {
    try {
      const [progressRes, workoutRes, nutritionRes, bossRes] = await Promise.all([
        progressApi.getSummary().catch(() => ({ data: {} })),
        workoutApi.getToday().catch(() => ({ data: { today: null } })),
        nutritionApi.getToday().catch(() => ({ data: { today: null } })),
        workoutApi.getBossBattle().catch(() => ({ data: null }))
      ])

      setStats({
        workoutsCompleted: progressRes.data.total_workouts || 0,
        caloriesBurned: progressRes.data.total_calories_burned || 0,
        currentStreak: progressRes.data.current_streak || 0,
        charityPoints: progressRes.data.charity_donations || user?.charity_donations || 0
      })

      setTodayWorkout(workoutRes.data?.today || null)
      setTodayMeals(nutritionRes.data?.today || null)
      if (bossRes.data) setBossBattle(bossRes.data)

      if (user?.age && user?.height && user?.weight) {
        setHasCompletedAssessment(true)
      }


    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }



  const charityLevel = stats.charityPoints >= 500 ? 'Gold 🥇' : stats.charityPoints >= 100 ? 'Silver 🥈' : 'Bronze 🥉'

  const statItems = [
    { icon: '🏋️', label: 'Workouts', value: stats.workoutsCompleted, accent: 'from-[#BFFF00]/15 to-[#BFFF00]/5', border: 'border-[#BFFF00]/15', glow: 'glow-lime' },
    { icon: '🔥', label: 'Calories', value: stats.caloriesBurned, accent: 'from-orange-500/15 to-orange-500/5', border: 'border-orange-500/15', glow: 'glow-orange' },
    { icon: '⚡', label: 'Streak', value: `${stats.currentStreak}d`, accent: 'from-cyan-500/15 to-cyan-500/5', border: 'border-cyan-500/15', glow: 'glow-blue' },
    { icon: '💚', label: 'Impact', value: `₹${stats.charityPoints}`, accent: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/15', glow: 'glow-green' },
  ]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#06080C] pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* ═══ WELCOME HEADER ═══ */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <p className="text-[#BFFF00] text-xs font-bold uppercase tracking-[0.25em] mb-2">Dashboard</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                Namaste, <span className="gradient-text-lime">{user?.full_name || user?.username}</span>
              </h1>
              <p className="text-[#6B7A90] text-base font-medium">Your fitness journey is looking strong today. Let's conquer it.</p>
            </motion.div>

            {!hasCompletedAssessment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 border-[#BFFF00]/20"
                style={{ borderColor: 'rgba(191,255,0,0.2)' }}
              >
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">🎯 Complete Assessment</h3>
                  <p className="text-[#6B7A90] text-sm">Get AI plans tailored for you!</p>
                </div>
                <button
                  onClick={() => navigate('/health-assessment')}
                  className="btn-lime px-6 py-3 rounded-xl text-sm whitespace-nowrap"
                >
                  Get Started →
                </button>
              </motion.div>
            )}
          </div>



          {/* ═══ STAT CARDS — BENTO ROW ═══ */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {statItems.map((s, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className={`glass glass-hover rounded-[2rem] p-6 group cursor-default hover:scale-105 transition-all duration-300 ${s.glow}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.accent} ${s.border} border flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <p className="text-3xl font-bold text-white tracking-tight">{s.value}</p>
                <p className="text-[#6B7A90] text-xs font-semibold uppercase tracking-[0.15em] mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ═══ BENTO GRID — 3 COLUMNS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* ── Quick Actions (4 cols) ─────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-4 bento-card"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#BFFF00]" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Quick Actions</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { path: '/health-assessment', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10', title: 'Health Assessment', hover: 'hover:border-rose-500/30' },
                  { path: '/ai-coach', icon: Bot, color: 'text-[#BFFF00]', bg: 'bg-[#BFFF00]/10', title: 'Ask AROMI Coach', hover: 'hover:border-[#BFFF00]/30' },
                  { path: '/progress', icon: BarChart3, color: 'text-cyan-400', bg: 'bg-cyan-500/10', title: 'Track Progress', hover: 'hover:border-cyan-500/30' },
                  { path: '/workouts', icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Today\'s Workout', hover: 'hover:border-orange-500/30' },
                ].map((action, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(action.path)}
                    className={`glass glass-hover flex items-center gap-4 p-4 text-left group ${action.hover} rounded-2xl`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{action.title}</h3>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#3D4A5C] group-hover:text-white transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* ── Today's Workout (5 cols) ────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-5 bento-card relative overflow-hidden"
            >
              {/* Lime accent line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#BFFF00]/40 to-transparent" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#BFFF00]" />
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Today's Workout</h2>
                </div>
                <button onClick={() => navigate('/workouts')} className="text-[#BFFF00] hover:text-[#d4ff4d] text-xs font-bold uppercase tracking-wider transition flex items-center gap-1">
                  View <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {todayWorkout ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div>
                      <h3 className="text-xl font-bold text-white">{todayWorkout.focus_area}</h3>
                      <p className="text-[#6B7A90] text-xs mt-0.5">Targeting your core objectives</p>
                    </div>
                    {todayWorkout.rest_day ? (
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/15">🧘 Rest</span>
                    ) : (
                      <div className="flex gap-2">
                        <span className="px-3 py-1.5 bg-[#BFFF00]/10 text-[#BFFF00] rounded-lg text-[10px] font-bold border border-[#BFFF00]/15">⏱ {todayWorkout.duration_minutes}m</span>
                        <span className="px-3 py-1.5 bg-white/5 text-[#6B7A90] rounded-lg text-[10px] font-bold border border-white/5">{todayWorkout.exercises?.length || 0} ex</span>
                      </div>
                    )}
                  </div>

                  {!todayWorkout.rest_day && (
                    <div className="space-y-2">
                      {(todayWorkout.exercises || []).slice(0, 3).map((ex, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-[#6B7A90] group-hover:bg-[#BFFF00]/10 group-hover:text-[#BFFF00] transition">{i + 1}</div>
                            <span className="text-white text-sm font-semibold">{ex.name}</span>
                          </div>
                          <span className="text-[10px] text-[#6B7A90] font-mono">{ex.sets}×{ex.reps}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/workouts')}
                    className="w-full py-3 mt-2 btn-lime hover:scale-105 transition-transform rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Dumbbell className="w-4 h-4" /> Start Session
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 bg-white/[0.015] rounded-2xl border border-dashed border-white/5">
                  <p className="text-[#3D4A5C] mb-5 text-sm">Your AI plan is not ready yet.</p>
                  <button onClick={() => navigate('/health-assessment')} className="btn-lime px-6 py-3 rounded-xl text-sm">
                    Build Plan ⚡
                  </button>
                </div>
              )}
            </motion.div>

            {/* ── Calendar & Impact (3 cols, stacked) ── */}
            <div className="lg:col-span-3 flex flex-col gap-5">



              {/* Charity Impact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bento-card flex-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Impact</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/15">
                    {charityLevel}
                  </span>
                </div>
                <p className="text-4xl font-bold text-emerald-400 mb-1">₹{stats.charityPoints}</p>
                <p className="text-[#3D4A5C] text-[10px] font-bold uppercase tracking-[0.15em]">Raised for health</p>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.03]">
                    <p className="text-white text-sm font-bold">{Math.floor(stats.charityPoints / 10)}</p>
                    <p className="text-[#3D4A5C] text-[9px] uppercase font-bold tracking-wider">Lives</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.03]">
                    <p className="text-white text-sm font-bold">{stats.currentStreak}</p>
                    <p className="text-[#3D4A5C] text-[9px] uppercase font-bold tracking-wider">Streak</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Nutrition (8 cols) ──────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-8 bento-card relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Apple className="w-4 h-4 text-orange-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Today's Nutrition</h2>
                </div>
                <button onClick={() => navigate('/nutrition')} className="text-orange-400 hover:text-orange-300 text-xs font-bold uppercase tracking-wider transition flex items-center gap-1">
                  Meal Log <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {todayMeals ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['breakfast', 'lunch', 'dinner'].map(type => {
                    const meal = todayMeals[type]
                    if (!meal) return null
                    const cfg = { breakfast: { emoji: '🌅', color: 'text-amber-400', border: 'border-amber-500/10' }, lunch: { emoji: '☀️', color: 'text-orange-400', border: 'border-orange-500/10' }, dinner: { emoji: '🌙', color: 'text-indigo-400', border: 'border-indigo-500/10' } }[type]
                    return (
                      <div key={type} className={`bg-white/[0.02] border ${cfg.border} rounded-2xl p-5 hover:bg-white/[0.04] transition-all hover:scale-105 glass-hover`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{cfg.emoji}</span>
                          <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${cfg.color}`}>{type}</p>
                        </div>
                        <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{meal.name}</h4>
                        <div className="mt-4 pt-3 border-t border-white/[0.03] flex items-center justify-between">
                          <span className="text-[10px] text-[#3D4A5C] uppercase font-bold">Target</span>
                          <span className="text-sm font-bold text-orange-400">{meal.calories} cal</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-white/[0.015] rounded-2xl border border-dashed border-white/5">
                  <p className="text-[#3D4A5C] mb-5 text-sm">Fuel your body with the right macros.</p>
                  <button onClick={() => navigate('/nutrition')} className="btn-lime px-6 py-3 rounded-xl text-sm">
                    Create Nutrition Plan 🥗
                  </button>
                </div>
              )}
            </motion.div>

            {/* ── Motivation (4 cols) ─────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-4 bento-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Daily Wisdom</h3>
                </div>
                <p className="text-[#6B7A90] italic text-sm leading-relaxed">
                  "Success is not final, failure is not fatal: it is the courage to continue that counts."
                </p>
                <p className="mt-4 text-white font-bold text-xs not-italic">— Winston Churchill</p>
              </div>
              <div className="mt-6 p-3 bg-[#BFFF00]/[0.04] rounded-xl border border-[#BFFF00]/10">
                <p className="text-[#BFFF00] text-[10px] font-bold uppercase tracking-[0.15em] text-center">Keep pushing forward 💪</p>
              </div>
            </motion.div>


            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-5 mt-2">
              {/* Fake InjuryRiskCard */}
              <div className="glass lg:col-span-2 p-6 rounded-[2rem] border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden glass-hover hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold tracking-wide">Movement & Injury Risk</h3>
                    <p className="text-xs text-emerald-400 font-medium">Low Risk Environment</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  ✅ Form analytics show perfectly balanced joint tension over the last 3 days. Connect camera in next workout to maintain safety checks.
                </p>
                <button onClick={() => setShowAnalyticsModal(true)} className="w-full py-3 rounded-xl bg-[#BFFF00]/10 text-[#BFFF00] text-xs font-bold uppercase tracking-widest hover:bg-[#BFFF00]/20 hover:scale-105 transition-all outline-none">
                  View Analytics Report
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {/* Fake WaterTracker */}
                <div className="glass p-5 rounded-[2rem] flex items-center justify-between glass-hover hover:scale-105 transition-transform">
                  <div>
                    <h3 className="text-white font-bold text-sm">Hydration Goal</h3>
                    <p className="text-cyan-400 font-bold text-2xl mt-1">4<span className="text-sm text-gray-500">/8 glasses</span></p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-xl border border-cyan-500/30">
                    💧
                  </div>
                </div>
                {/* Boss Battle Card */}
                {bossBattle && (
                  <div className="glass p-5 rounded-[2rem] border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-[#0a0514] relative overflow-hidden flex flex-col justify-between glass-hover hover:scale-105 transition-transform shadow-[0_0_30px_rgba(147,51,234,0.15)]">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-600/20 blur-[30px] rounded-full pointer-events-none" />
                    <div className="absolute -right-2 -top-2 text-6xl opacity-20">🐉</div>
                    <div className="relative z-10">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] uppercase font-bold tracking-widest border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">Epic Difficulty</span>
                      <h3 className="text-white font-black text-xl mt-2 font-heading tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{bossBattle.boss_name}</h3>
                      <p className="text-purple-300 text-xs mt-1 mb-4 font-bold">{bossBattle.duration_minutes} Min Survival</p>
                    </div>
                    <button onClick={() => navigate('/workouts/boss-battle')} className="w-full relative z-10 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] flex items-center justify-center gap-2 transition-all active:scale-95">
                      FIGHT NOW 🗡️
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── DoctorGenie Telegram Bot Card ──────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-12 mt-2"
            >
              <div className="glass rounded-[2rem] p-8 border border-[#2AABEE]/20 bg-gradient-to-br from-[#2AABEE]/[0.06] to-transparent relative overflow-hidden glass-hover group hover:border-[#2AABEE]/40 transition-all duration-500">
                {/* Decorative glow */}
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#2AABEE]/[0.05] blur-[60px] rounded-full pointer-events-none group-hover:bg-[#2AABEE]/[0.1] transition-colors duration-700" />
                <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-purple-600/[0.04] blur-[40px] rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  {/* QR Code */}
                  <div className="flex-shrink-0">
                    <div className="w-36 h-36 rounded-2xl bg-white p-2 shadow-xl shadow-[#2AABEE]/10 group-hover:shadow-[#2AABEE]/25 transition-shadow duration-500 group-hover:scale-105 transform transition-transform">
                      <img
                        src="/doctorgenie-qr.png"
                        alt="DoctorGenie Bot QR Code"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/15 flex items-center justify-center border border-[#2AABEE]/25">
                        <svg className="w-5 h-5 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight">DoctorGenie Bot</h3>
                      <span className="px-2.5 py-0.5 bg-[#2AABEE]/15 text-[#2AABEE] rounded-full text-[9px] font-bold uppercase tracking-widest border border-[#2AABEE]/25">Telegram</span>
                    </div>
                    <p className="text-[#6B7A90] text-sm mb-5 leading-relaxed max-w-lg">
                      Your AI medical assistant on Telegram — scan prescriptions, find hospitals & more.
                    </p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                      {[
                        { icon: '🏥', label: 'Prescription Scanner' },
                        { icon: '📍', label: 'Hospital Finder' },
                        { icon: '💊', label: 'Med Reminders' },
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/[0.03] px-4 py-2 rounded-xl border border-white/[0.05]">
                          <span className="text-base">{feature.icon}</span>
                          <span className="text-white text-xs font-bold">{feature.label}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href="https://t.me/DoctorGenieBot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#2AABEE]/20 hover:shadow-[#2AABEE]/40"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                      Open Bot
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          <AnimatePresence>
            {showMoodCheckin && (
              <MoodCheckin
                onClose={() => setShowMoodCheckin(false)}
                onAdjusted={handleMoodCheckinComplete}
              />
            )}

            {showAnalyticsModal && (
              <AnalyticsReportModal
                onClose={() => setShowAnalyticsModal(false)}
              />
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  )
}
