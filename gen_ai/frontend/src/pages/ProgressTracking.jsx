import { useEffect, useState } from 'react'
import { TrendingUp, Award, Target, Activity, Calendar, Sparkles, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import { progressApi } from '../services/api'
import toast from 'react-hot-toast'

export default function ProgressTracking() {
  const [summary, setSummary] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [charts, setCharts] = useState({ calories_chart: [], streak_chart: [] })
  const [period, setPeriod] = useState('week')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [logForm, setLogForm] = useState({ weight: '', body_fat: '', notes: '', calories_burned: '' })
  const [historyRecords, setHistoryRecords] = useState([])

  useEffect(() => {
    loadProgress()
  }, [period])

  const loadProgress = async () => {
    try {
      const [summaryRes, achievementsRes, chartsRes] = await Promise.all([
        progressApi.getSummary().catch(() => ({ data: {} })),
        progressApi.getAchievements().catch(() => ({ data: { achievements: [] } })),
        progressApi.getCharts().catch(() => ({ data: { calories_chart: [], streak_chart: [] } }))
      ])
      setSummary(summaryRes.data)
      setAchievements(achievementsRes.data?.achievements || [])
      setCharts(chartsRes.data || { calories_chart: [], streak_chart: [] })
      // Also load history records for the Transformation Log
      try {
        const historyRes = await progressApi.getHistory(period)
        setHistoryRecords(historyRes.data?.history || [])
      } catch { /* no history */ }
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogProgress = async (e) => {
    e.preventDefault()
    try {
      await progressApi.log({
        weight: logForm.weight ? parseFloat(logForm.weight) : null,
        body_fat_percentage: logForm.body_fat ? parseFloat(logForm.body_fat) : null,
        calories_burned: logForm.calories_burned ? parseFloat(logForm.calories_burned) : 0,
        notes: logForm.notes,
      })
      toast.success('Progress logged! 📊')
      setLogForm({ weight: '', body_fat: '', notes: '', calories_burned: '' })
      await loadProgress()
    } catch (error) {
      toast.error('Failed to log progress')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#0d0d14] pt-16 flex items-center justify-center">
          <div className="text-white text-xl">Loading progress...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0d0d14] pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">📈 Progress Tracking</h1>
              <p className="text-gray-400">Monitor your fitness journey</p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-[#1a1a2e] border border-[#2a2a40] text-white rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'achievements', label: '🏆 Achievements' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-medium transition ${activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1a1a2e] border border-[#2a2a40] text-gray-400 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-white/80" />
                      <span className="text-white/70 text-xs">Total Workouts</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{summary?.total_workouts || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-white/80" />
                      <span className="text-white/70 text-xs">Weight Lost</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{summary?.weight_lost || 0} kg</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/80 text-sm">🔥</span>
                      <span className="text-white/70 text-xs">Calories Burned</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{summary?.total_calories_burned || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/80 text-sm">📊</span>
                      <span className="text-white/70 text-xs">BMI</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{summary?.bmi || '-'}</p>
                  </div>
                </div>

                {/* Calories Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass bg-[#0D1520] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Activity className="w-6 h-6 text-purple-500" />
                        Burn Velocity
                      </h2>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Stamina & Output Tracking</p>
                    </div>
                  </div>

                  <div className="h-[300px] w-full">
                    {charts.calories_chart?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={charts.calories_chart}>
                          <defs>
                            <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0D1520',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '16px',
                              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                              color: '#fff'
                            }}
                            itemStyle={{ color: '#8b5cf6', fontWeight: 900 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="calories"
                            stroke="#8b5cf6"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorCal)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                        <p className="text-gray-600 font-bold mb-2">No data recorded yet.</p>
                        <p className="text-gray-700 text-xs">Complete your first drill to see the visual output here.</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Streak Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass bg-[#0D1520] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-emerald-500" />
                        Consistency Matrix
                      </h2>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Discipline Breakdown</p>
                    </div>
                  </div>

                  <div className="h-[200px] w-full">
                    {charts.streak_chart?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.streak_chart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                          />
                          <YAxis
                            hide
                            domain={[0, 1]}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            contentStyle={{
                              backgroundColor: '#0D1520',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '16px'
                            }}
                            formatter={(value) => [value === 1 ? 'DOMINATED' : 'SKIPPED', 'STATUS']}
                          />
                          <Bar
                            dataKey="completed"
                            fill="#10b981"
                            radius={[8, 8, 8, 8]}
                            barSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                        <p className="text-gray-600 font-bold">Waiting for your first streak...</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Log Progress Sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sticky top-24 shadow-2xl backdrop-blur-2xl"
                >
                  <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    Log Input
                  </h3>

                  <form onSubmit={handleLogProgress} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Body Mass (KG)</label>
                      <input
                        type="number" step="0.1"
                        value={logForm.weight}
                        onChange={(e) => setLogForm({ ...logForm, weight: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-gray-700"
                        placeholder="75.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Body Fat (%)</label>
                      <input
                        type="number" step="0.1"
                        value={logForm.body_fat}
                        onChange={(e) => setLogForm({ ...logForm, body_fat: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-gray-700"
                        placeholder="18.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Energy Output (CAL)</label>
                      <input
                        type="number"
                        value={logForm.calories_burned}
                        onChange={(e) => setLogForm({ ...logForm, calories_burned: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-gray-700"
                        placeholder="450"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">State of Mind / Notes</label>
                      <textarea
                        value={logForm.notes}
                        onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-gray-700 resize-none"
                        placeholder="Feeling strong today..."
                      />
                    </div>

                    <button type="submit" className="w-full py-5 btn-premium gradient-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-600/20">
                      Sync Progress ✅
                    </button>
                  </form>

                  {/* Motivational Quote requested */}
                  <div className="mt-12 p-6 bg-purple-600/10 rounded-[2rem] border border-purple-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-1 translate-y-[-1] group-hover:scale-110 transition-transform">
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-xs text-purple-400 font-black uppercase tracking-widest mb-3">Today's Motivation</p>
                    <p className="text-white text-sm font-medium italic leading-relaxed">
                      "Your speed doesn't matter, forward is forward. Keep moving, ji!"
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-4">
                    <Award className="w-8 h-8 text-yellow-500" />
                    Elite Milestones
                  </h2>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Unlocking the next level of you</p>
                </div>

                <div className="flex items-center gap-6 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Unlocked</p>
                    <p className="text-xl font-black text-white">{achievements.filter(a => a.unlocked).length}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Points</p>
                    <p className="text-xl font-black text-purple-500">{achievements.filter(a => a.unlocked).length * 10}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {achievements.map((achievement, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative group overflow-hidden glass rounded-[2.5rem] p-8 text-center border transition-all duration-500 ${achievement.unlocked
                      ? 'border-purple-500/30 bg-purple-600/5 shadow-xl shadow-purple-500/10'
                      : 'border-white/5 bg-white/[0.02] opacity-50 grayscale'
                      }`}
                  >
                    {!achievement.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/20">Keep Pushing, Ji!</p>
                      </div>
                    )}

                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">{achievement.icon}</div>
                    <h3 className="text-lg font-black text-white mb-2">{achievement.name}</h3>
                    <p className="text-gray-500 text-[10px] font-bold leading-relaxed mb-6 h-8 line-clamp-2">{achievement.description}</p>

                    {/* Circular progress with premium look */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="none" />
                        <motion.circle
                          cx="32" cy="32" r="28"
                          stroke={achievement.unlocked ? '#a78bfa' : '#334155'}
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={175.93}
                          initial={{ strokeDashoffset: 175.93 }}
                          animate={{ strokeDashoffset: 175.93 - (achievement.percentage / 100) * 175.93 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-white italic">{achievement.percentage}%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className="text-gray-600">{achievement.current}</span>
                      <span className="text-purple-500">{achievement.target}</span>
                    </div>

                    {achievement.unlocked && (
                      <div className="mt-6 pt-4 border-t border-purple-500/20">
                        <span className="text-xs text-purple-400 font-black tracking-widest uppercase italic">Mastery Achieved</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* New Progress History Section (Unimplemented req) */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 lg:col-span-2"
            >
              <div className="glass bg-[#0D1520] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                      <RotateCcw className="w-6 h-6 text-blue-500" />
                      Transformation Log
                    </h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Historical Data Verification</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-4 px-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Entry Date</th>
                        <th className="pb-4 px-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Weight</th>
                        <th className="pb-4 px-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Body Fat %</th>
                        <th className="pb-4 px-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Activity</th>
                        <th className="pb-4 px-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Observations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {historyRecords.length > 0 ? historyRecords.map((log, i) => (
                        <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-2">
                            <p className="text-sm font-bold text-gray-300">{new Date(log.date).toLocaleDateString()}</p>
                          </td>
                          <td className="py-4 px-2">
                            <span className="text-sm font-black text-blue-400">{log.weight ? `${log.weight} kg` : '—'}</span>
                          </td>
                          <td className="py-4 px-2">
                            <span className="text-sm font-black text-cyan-400">{log.body_fat_percentage ? `${log.body_fat_percentage}%` : '—'}</span>
                          </td>
                          <td className="py-4 px-2">
                            <span className="bg-orange-600/10 text-orange-500 px-3 py-1 rounded-full text-[10px] font-black">{log.calories_burned ? `-${log.calories_burned} CAL` : '—'}</span>
                          </td>
                          <td className="py-4 px-2">
                            <p className="text-xs text-gray-500 italic max-w-xs truncate group-hover:whitespace-normal transition-all">"{log.notes || 'No notes provided'}"</p>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-gray-700 font-bold uppercase tracking-widest text-xs">Waiting for your first entry...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
