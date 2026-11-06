import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Trophy, 
    Sparkles, 
    Flame, 
    Zap, 
    Gift, 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    Activity, 
    Dumbbell, 
    Utensils, 
    Scale,
    Check
} from "lucide-react";
import { progressApi, workoutApi, nutritionApi, healthApi } from "../services/api";
import useWellnessStore from "../stores/wellnessStore";
import StreakScratchCard from "./gamification/StreakScratchCard";
import DailyWellnessWheel from "./gamification/DailyWellnessWheel";
import toast from "react-hot-toast";

const PERIOD_MAP  = { "Last Week": "week", "Last Month": "month", "Last 3 Months": "3months", "Last Year": "year" };
const PERIODS     = Object.keys(PERIOD_MAP);
const TABS        = [
  { id: "Achievements",  icon: "🏆", label: "Achievements & Games" },
  { id: "Overview",      icon: "📊", label: "Overview" },
  { id: "Workouts",      icon: "💪", label: "Workouts" },
  { id: "Nutrition",     icon: "🍎", label: "Nutrition" },
  { id: "Body Metrics",  icon: "⚖️", label: "Body Metrics" },
];

const ACH_DEFS = [
  { id: "first_step",           icon: "👟", title: "First Step",           desc: "Complete your first workout",  target: 1,    pts: "+50 pts",  ptsNum: 50,  color: "#F59E0B", featured: true  },
  { id: "workout_warrior",      icon: "⚔️", title: "Workout Warrior",       desc: "Complete 5 workouts",          target: 5,    pts: "+100 pts", ptsNum: 100, color: "#10B981", featured: false },
  { id: "beast_mode",           icon: "🦁", title: "Beast Mode",            desc: "Complete 10 workouts",         target: 10,   pts: "+200 pts", ptsNum: 200, color: "#FF6B6B", featured: false },
  { id: "nutrition_ninja",      icon: "🥷", title: "Nutrition Ninja",       desc: "Track 5 meals",                target: 5,    pts: "+75 pts",  ptsNum: 75,  color: "#06B6D4", featured: false },
  { id: "exercise_excellence",  icon: "⭐", title: "Exercise Excellence",   desc: "Complete 25 exercises",        target: 25,   pts: "+150 pts", ptsNum: 150, color: "#3B82F6", featured: false },
  { id: "fire_starter",         icon: "🔥", title: "Fire Starter",          desc: "Burn 500 calories",            target: 500,  pts: "+100 pts", ptsNum: 100, color: "#F97316", featured: false },
  { id: "fire_master",          icon: "🔥", title: "Fire Master",           desc: "Burn 1000 calories",           target: 1000, pts: "+200 pts", ptsNum: 200, color: "#EF4444", featured: false },
  { id: "consistency_counts",   icon: "📅", title: "Consistency Counts",    desc: "Achieve 3-day streak",         target: 3,    pts: "+100 pts", ptsNum: 100, color: "#06B6D4", featured: false },
  { id: "streak_king",          icon: "👑", title: "Streak King",           desc: "Achieve 7-day streak",         target: 7,    pts: "+250 pts", ptsNum: 250, color: "#FBBF24", featured: false },
  { id: "weight_loss_winner",   icon: "🎯", title: "Weight Loss Winner",    desc: "Lose 2kg",                     target: 2,    pts: "+300 pts", ptsNum: 300, color: "#10B981", featured: false },
  { id: "major_transformation", icon: "💎", title: "Major Transformation",  desc: "Lose 5kg",                     target: 5,    pts: "+500 pts", ptsNum: 500, color: "#A855F7", featured: false },
];

function PBar({ pct = 0, color = "#10B981", h = 6 }) {
  return (
    <div className="bg-white/[0.08] rounded-full overflow-hidden" style={{ height: h }}>
      <div 
        className="rounded-full transition-all duration-700 ease-out" 
        style={{ 
            width: `${Math.min(Math.max(pct, 0), 100)}%`, 
            height: "100%", 
            background: color,
            boxShadow: `0 0 10px ${color}66`
        }} 
      />
    </div>
  );
}

function Spin() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-3 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium">Syncing telemetry data...</span>
    </div>
  );
}

function Empty({ icon = "📊", title, sub }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-10 text-center flex flex-col items-center gap-2">
      <span className="text-4xl">{icon}</span>
      <div className="text-base font-bold text-white">{title}</div>
      <div className="text-xs text-slate-400 max-w-sm leading-relaxed">{sub}</div>
    </div>
  );
}

function Card({ icon, label, value, unit = "", change, changeUp, color, loading }) {
  return (
    <div className="bg-slate-900/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all shadow-lg">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color || "#10B981" }} />
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/[0.04] border border-white/5">
            {icon}
        </div>
        {change != null && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              changeUp 
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
          }`}>
            {changeUp ? "▲" : "▼"} {Math.abs(change)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-7 bg-white/[0.05] rounded-md mb-1.5 w-3/5 animate-pulse" />
      ) : (
        <div className="text-2xl font-black text-white font-mono leading-none">
          {value ?? "—"}<span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
        </div>
      )}
      <div className="text-xs text-slate-400 font-medium mt-1.5">{label}</div>
    </div>
  );
}

function BarChart({ rows, valKey, color, label }) {
  const vals = rows.map(r => Number(r[valKey]) || 0);
  const max  = Math.max(...vals, 1);
  return (
    <div className="bg-slate-900/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-lg">
      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">{label}</div>
      <div className="flex items-end gap-2 sm:gap-3 h-28">
        {rows.map((r, i) => {
          const pct = (vals[i] / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div 
                title={`${r.day || r.date || ""}: ${vals[i]}`} 
                className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                style={{ 
                    height: pct > 0 ? `${pct}%` : "4px", 
                    background: pct > 0 ? color : "rgba(255,255,255,0.06)",
                    boxShadow: pct > 0 ? `0 0 12px ${color}40` : "none"
                }} 
              />
              <span className="text-[10px] font-mono text-slate-400">{r.day || r.label || ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── OVERVIEW TAB ───────────────────────────────────────────────────────────
function OverviewTab({ summary: s, charts, loading }) {
  const calData = charts?.calories_chart || Array.from({ length: 7 }, (_, i) => ({ day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], calories: 0 }));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card icon="💪" label="Total Workouts"  value={s?.total_workouts ?? 0} color="#10B981" loading={loading} />
        <Card icon="🔥" label="Calories Burned" value={s?.total_calories_burned ?? 0} color="#FF6B6B" unit=" kcal" loading={loading} />
        <Card icon="⚡" label="Current Streak"  value={s?.current_streak ?? 0} unit=" days" color="#06B6D4" loading={loading} />
        <Card icon="🥗" label="Meals Logged"    value={s?.meals_tracked ?? 0} color="#F59E0B" loading={loading} />
      </div>
      <BarChart rows={calData} valKey="calories" color="#10B981" label="Daily Caloric Expenditure" />
    </div>
  );
}

// ── WORKOUTS TAB ───────────────────────────────────────────────────────────
function WorkoutsTab({ summary: s, charts, workoutHistory, loading }) {
  const wkData = charts?.weekly_workouts || Array.from({ length: 7 }, (_, i) => ({ day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], count: 0 }));
  const hasHistory = Array.isArray(workoutHistory) && workoutHistory.length > 0;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card icon="💪" label="Total Sessions"  value={s?.total_workouts  ?? 0} color="#10B981" loading={loading} />
        <Card icon="⏱️" label="Active Duration" value={s?.total_duration  ?? 0} unit=" mins" color="#06B6D4" loading={loading} />
        <Card icon="🔥" label="Burned Calories" value={s?.total_calories_burned ?? 0} color="#FF6B6B" loading={loading} />
        <Card icon="⚡" label="Routine Streak"  value={s?.current_streak  ?? 0} unit=" days" color="#F59E0B" loading={loading} />
      </div>
      <BarChart rows={wkData} valKey="count" color="#10B981" label="Workouts Frequency" />
      {hasHistory ? (
        <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-white/[0.08] text-xs font-bold uppercase text-slate-300 tracking-wider">
            Recent Completed Sessions
          </div>
          {workoutHistory.slice(0, 6).map((w, i) => (
            <div key={i} className="flex justify-between items-center p-4 border-b border-white/[0.04] last:border-none">
              <div>
                <div className="text-xs font-bold text-white">{w.name || w.workout_name || "Exercise Movement"}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{w.date || "Today"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-400">{w.calories_burned || 30} kcal</div>
                <div className="text-[10px] text-slate-500">{w.duration || 15} mins</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon="💪" title="No Recorded Sessions" sub="Complete a workout or webcam vision session to see detailed records." />
      )}
    </div>
  );
}

// ── NUTRITION TAB ──────────────────────────────────────────────────────────
function NutritionTab({ summary: s, nutritionData, charts, loading }) {
  const calData = charts?.weekly_nutrition || Array.from({ length: 7 }, (_, i) => ({ day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], calories: 0 }));
  const nd = nutritionData || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card icon="🥗" label="Meals Logged"    value={s?.meals_tracked ?? nd.meals_tracked ?? 0} color="#10B981" loading={loading} />
        <Card icon="🔥" label="Avg Calories"    value={s?.avg_daily_calories ?? 1850} color="#FF6B6B" unit=" kcal" loading={loading} />
        <Card icon="🥩" label="Protein Avg"     value={s?.avg_protein ?? 75} color="#06B6D4" unit=" g" loading={loading} />
        <Card icon="💧" label="Water Intake"    value={s?.hydration ?? 2.8} color="#38BDF8" unit=" L" loading={loading} />
      </div>
      <BarChart rows={calData} valKey="calories" color="#10B981" label="Calorie Target Adherence" />
    </div>
  );
}

// ── BODY METRICS TAB ───────────────────────────────────────────────────────
function BodyMetricsTab({ summary: s, healthData: h, loading }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card icon="⚖️" label="Current Weight" value={h?.weight || s?.current_weight || "72"} unit=" kg" color="#10B981" loading={loading} />
        <Card icon="📏" label="Height"         value={h?.height || s?.height || "175"} unit=" cm" color="#06B6D4" loading={loading} />
        <Card icon="📊" label="Body Mass Index" value={s?.bmi || h?.bmi || "23.5"} color="#A855F7" loading={loading} />
        <Card icon="🎯" label="Weight Delta"   value={s?.weight_loss ?? "0"} unit=" kg" color="#FF6B6B" loading={loading} />
      </div>
    </div>
  );
}

// ── ACHIEVEMENTS & MINI-GAMES TAB ──────────────────────────────────────────
function AchievementsTab({ rawAchievements, loading }) {
  const userXp = useWellnessStore((s) => s.userXp);
  const claimedMilestones = useWellnessStore((s) => s.claimedMilestones);
  const claimMilestone = useWellnessStore((s) => s.claimMilestone);
  const streakDays = useWellnessStore((s) => s.streakDays);

  const currentLevel = Math.floor(userXp / 250) + 1;
  const levelXpProgress = userXp % 250;

  // Level Rank Titles
  const rankTitles = [
      'Apprentice Striker',
      'Emerald Novice',
      'Neon Vanguard',
      'Cyber Athlete',
      'Obsidian Master',
      'Zenith Champion',
  ];
  const rankTitle = rankTitles[Math.min(currentLevel - 1, rankTitles.length - 1)];

  // Merge live API data into definitions
  const list = ACH_DEFS.map((def) => {
    const live = (rawAchievements || []).find(
      (a) => a.id === def.id || a.achievement_id === def.id || a.title === def.title
    );
    const curProgress = live?.progress ?? live?.current_value ?? (def.id === 'first_step' ? 1 : 0);
    const isTargetMet = curProgress >= def.target || live?.unlocked || live?.completed;
    const isClaimed = claimedMilestones.includes(def.id);

    return {
      ...def,
      progress: curProgress,
      isTargetMet,
      isClaimed,
      pct: def.target > 0 ? Math.min(100, Math.round((curProgress / def.target) * 100)) : 0,
    };
  });

  const totalUnlocked = list.filter((a) => a.isClaimed || a.isTargetMet).length;
  const overallPct = Math.round((totalUnlocked / list.length) * 100);

  const handleClaim = (ach) => {
      const awarded = claimMilestone(ach.id, ach.ptsNum);
      if (awarded) {
          toast.success(`Reward Unlocked: ${ach.title}! ${ach.pts} awarded ✨`);
      }
  };

  return (
    <div className="space-y-6">
      {/* 1. Animated Leveling Progression Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/30">
              <Trophy size={28} className="fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  LEVEL {currentLevel}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{rankTitle}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Gamified Progression & Milestones
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono">
                {userXp} XP
              </div>
              <div className="text-[11px] text-slate-400 font-semibold">Total Earned</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <div className="text-2xl font-black text-amber-400 font-mono">
                {streakDays}d
              </div>
              <div className="text-[11px] text-slate-400 font-semibold">Streak Flame</div>
            </div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="relative z-10 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300 font-semibold">
            <span>Progress to Level {currentLevel + 1}</span>
            <span className="font-mono text-emerald-400">{levelXpProgress} / 250 XP</span>
          </div>
          <div className="h-3 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(8, (levelXpProgress / 250) * 100))}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* 2. Daily Interactive Mini-Games Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Gift size={20} className="text-cyan-400" />
          <h3 className="text-2xl font-bold tracking-tight text-white">
            Daily Wellness Mini-Games
          </h3>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            PLAY & WIN BONUS XP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StreakScratchCard />
          <DailyWellnessWheel />
        </div>
      </div>

      {/* 3. Milestone Cards with 3 Clear Status Badges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles size={20} className="text-emerald-400" />
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Achievement Unlocks ({totalUnlocked} / {list.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{overallPct}% Completed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((a) => {
            return (
              <div
                key={a.id}
                className={`rounded-3xl p-5 border transition-all duration-300 relative flex flex-col justify-between ${
                  a.isClaimed
                    ? "bg-slate-900/60 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                    : a.isTargetMet
                    ? "bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                    : "bg-slate-900/50 border-white/[0.08] hover:border-white/20"
                }`}
              >
                <div>
                  {/* Top Row: Icon & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                      {a.icon}
                    </div>

                    {/* Status Badge Requirement: "In Progress" | "Claim Reward" | "Completed" */}
                    <div>
                      {a.isClaimed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                          <Check size={12} className="stroke-[3]" />
                          <span>Completed</span>
                        </span>
                      ) : a.isTargetMet ? (
                        <button
                          onClick={() => handleClaim(a)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition animate-pulse"
                        >
                          <Sparkles size={12} />
                          <span>Claim Reward</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/10 text-xs font-semibold">
                          <Clock size={11} />
                          <span>In Progress</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-extrabold text-sm text-white">{a.title}</h4>
                    <span className="text-xs font-mono font-bold text-amber-400">{a.pts}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{a.desc}</p>
                </div>

                {/* Progress Bar & Ratio */}
                <div>
                  <PBar pct={a.pct} color={a.isClaimed ? "#10B981" : a.isTargetMet ? "#F59E0B" : "#06B6D4"} h={5} />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
                    <span>{a.progress} / {a.target}</span>
                    <span className={a.isClaimed ? "text-emerald-400 font-bold" : "text-slate-400"}>
                      {a.pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── MAIN PROGRESS TRACKING COMPONENT ───────────────────────────────────────
export default function ProgressTracking() {
  const [tab, setTab] = useState("Achievements");
  const [period, setPeriod] = useState("Last Month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [charts, setCharts] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const dailyActivity = useWellnessStore((s) => s.dailyActivity);
  const workoutLog = useWellnessStore((s) => s.workoutLog);

  const localSummary = useMemo(() => {
    const days = Object.values(dailyActivity || {});
    const calories = days.reduce((sum, day) => sum + (day.calories || 0), 0);
    const meals = days.reduce((sum, day) => sum + (day.meals || 0), 0);
    const workouts = days.reduce((sum, day) => sum + (day.workouts || 0), 0);
    const duration = days.reduce((sum, day) => sum + (day.durationSec || 0), 0);
    const reps = days.reduce((sum, day) => sum + (day.reps || 0), 0);
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 30; i += 1) {
      const key = cursor.toISOString().split('T')[0];
      const day = dailyActivity?.[key];
      const active = day && ((day.reps || 0) + (day.meals || 0) + (day.workouts || 0) > 0);
      if (!active && i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      if (!active) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const week = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().split('T')[0];
      const day = dailyActivity?.[key] || {};
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: Math.round(day.calories || 0),
        count: day.workouts || 0,
      };
    });
    return { calories, meals, workouts, duration: Math.round(duration / 60), reps, streak, week, exercises: days.reduce((sum, day) => sum + (day.exercises || 0), 0) };
  }, [dailyActivity]);

  const localAchievements = useMemo(() => ([
    { id: 'first_step', progress: localSummary.workouts > 0 ? 1 : 0 },
    { id: 'workout_warrior', progress: localSummary.workouts },
    { id: 'beast_mode', progress: localSummary.workouts },
    { id: 'nutrition_ninja', progress: localSummary.meals },
    { id: 'exercise_excellence', progress: localSummary.exercises },
    { id: 'fire_starter', progress: Math.round(localSummary.calories) },
    { id: 'fire_master', progress: Math.round(localSummary.calories) },
    { id: 'consistency_counts', progress: localSummary.streak },
    { id: 'streak_king', progress: localSummary.streak },
  ]), [localSummary]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = PERIOD_MAP[period] || "month";
      const [sumR, histR, achR, chartR, healthR, nutR, wkR] = await Promise.allSettled([
        progressApi.getSummary(),
        progressApi.getHistory(p),
        progressApi.getAchievements(),
        progressApi.getCharts(),
        healthApi.getLatest(),
        nutritionApi.getToday(),
        workoutApi.getHistory(),
      ]);
      if (sumR.status === "fulfilled") setSummary(sumR.value?.data || null);
      if (achR.status === "fulfilled") setAchievements(Array.isArray(achR.value?.data) ? achR.value.data : []);
      if (chartR.status === "fulfilled") setCharts(chartR.value?.data || null);
      if (healthR.status === "fulfilled") setHealthData(healthR.value?.data || null);
      if (nutR.status === "fulfilled") setNutritionData(nutR.value?.data || null);
      if (wkR.status === "fulfilled") setWorkoutHistory(Array.isArray(wkR.value?.data) ? wkR.value.data : []);
    } catch (e) {
      setError(`Telemetry sync issue: ${e.message}`);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const tabProps = {
    summary: {
      ...(summary || {}),
      total_workouts: Math.max(summary?.total_workouts || 0, localSummary.workouts),
      total_calories_burned: Math.max(summary?.total_calories_burned || 0, Math.round(localSummary.calories)),
      current_streak: Math.max(summary?.current_streak || 0, localSummary.streak),
      meals_tracked: Math.max(summary?.meals_tracked || 0, localSummary.meals),
      total_duration: Math.max(summary?.total_duration || 0, localSummary.duration),
    },
    charts: {
      ...(charts || {}),
      calories_chart: localSummary.week.some((day) => day.calories > 0) ? localSummary.week : charts?.calories_chart,
      weekly_workouts: localSummary.week.some((day) => day.count > 0) ? localSummary.week : charts?.weekly_workouts,
      weekly_nutrition: localSummary.week.some((day) => day.calories > 0) ? localSummary.week : charts?.weekly_nutrition,
    },
    loading,
  };
  const history = (Array.isArray(workoutHistory) && workoutHistory.length > 0) ? workoutHistory : workoutLog;
  const achievementSource = (achievements && achievements.length > 0) ? achievements : localAchievements;

  return (
    <div className="w-full text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 mb-2">
            <TrendingUp size={13} />
            <span>Real-time Biomarkers & Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Progress Analytics & Rewards Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track kinetic milestones, dynamic macro adherence, and play daily wellness mini-games
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-emerald-400 hover:border-emerald-500/40 transition disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Sync Data"}
          </button>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 my-6 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "bg-slate-900/80 text-slate-400 border border-white/[0.08] hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {loading && tab !== "Achievements" ? (
          <Spin />
        ) : tab === "Achievements" ? (
          <AchievementsTab rawAchievements={achievementSource} loading={loading} />
        ) : tab === "Overview" ? (
          <OverviewTab {...tabProps} />
        ) : tab === "Workouts" ? (
          <WorkoutsTab {...tabProps} workoutHistory={history} />
        ) : tab === "Nutrition" ? (
          <NutritionTab {...tabProps} nutritionData={nutritionData} />
        ) : tab === "Body Metrics" ? (
          <BodyMetricsTab {...tabProps} healthData={healthData} />
        ) : null}
      </div>
    </div>
  );
}
