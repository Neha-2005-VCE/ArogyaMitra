import { useEffect, useState } from 'react'
import { Play, Check, Clock, Flame, ChevronDown, ChevronUp, X, Camera, Sparkles, Activity, Target, Zap, CameraOff, Youtube, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import ExerciseCamera from '../components/ExerciseCamera'
import WorkoutComplete from '../components/WorkoutComplete'
import { workoutApi } from '../services/api'
import { generateCalendarUrl } from '../utils/calendar'
import toast from 'react-hot-toast'

export default function WorkoutPlans() {
  const [plan, setPlan] = useState(null)
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [todayName, setTodayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('today')
  const [expandedDay, setExpandedDay] = useState(null)
  const [completedExercises, setCompletedExercises] = useState(new Set())
  const [playerExercise, setPlayerExercise] = useState(null)
  const [videoData, setVideoData] = useState(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [workoutStats, setWorkoutStats] = useState(null)

  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    try {
      const [planRes, todayRes] = await Promise.all([
        workoutApi.getCurrent().catch(() => ({ data: null })),
        workoutApi.getToday().catch(() => ({ data: { today: null, day_name: '' } }))
      ])
      setPlan(planRes.data?.plan || null)
      setTodayWorkout(todayRes.data?.today || null)
      setTodayName(todayRes.data?.day_name || '')
    } catch (error) {
      console.error('Error loading workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    setGenerating(true)
    try {
      toast.loading('Generating your workout plan... 💪', { id: 'gen' })
      await workoutApi.generate()
      toast.success('New workout plan generated! 💪', { id: 'gen' })
      await loadWorkouts()
    } catch (error) {
      toast.error('Failed to generate plan', { id: 'gen' })
    } finally {
      setGenerating(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!todayWorkout || todayWorkout.rest_day) {
      toast.error('No workout available today to sync.')
      return
    }

    let description = `🏋️ ArogyaMitra Workout — ${todayWorkout.focus_area}\n\n`;
    if (todayWorkout.warmup) description += `🔥 Warmup: ${todayWorkout.warmup}\n\n`;

    description += `💪 Exercises:\n`;
    (todayWorkout.exercises || []).forEach(ex => {
      description += `• ${ex.name} — ${ex.sets} sets × ${ex.reps} reps\n`;
    });

    if (todayWorkout.cool_down) description += `\n🧊 Cooldown: ${todayWorkout.cool_down}\n`;

    const url = generateCalendarUrl({
      title: `🏋️ ${todayWorkout.focus_area} — ArogyaMitra`,
      description,
      date: new Date().toISOString().split('T')[0],
      startTime: '06:00',
      durationMinutes: todayWorkout.duration_minutes || 45
    });

    window.open(url, '_blank');
  }

  const handleCompleteExercise = async (exerciseName, cameraStats = null) => {
    try {
      const calories = cameraStats?.calories || 50
      const duration = cameraStats?.duration || 5
      await workoutApi.complete({ exercise_id: exerciseName, calories_burned: calories, duration_minutes: duration })
      setCompletedExercises(prev => new Set([...prev, exerciseName]))
      toast.success(`Exercise completed! 🔥 ${calories} cal burned, +5 charity points 💚`)

      // Check if all exercises are done
      if (todayWorkout && (completedExercises.size + 1) >= todayWorkout.exercises.length) {
        const totalCal = [...completedExercises].length * 50 + calories
        setWorkoutStats({
          calories: totalCal,
          sets: (todayWorkout.exercises.length) * 3,
          minutes: [...completedExercises].length * 5 + duration,
          intensity: 85
        })
        setShowSummary(true)
      }
    } catch (error) {
      toast.error('Failed to mark as complete')
    }
  }

  const days = plan?.days || plan?.weekly_plan || []

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#0d0d14] pt-16 flex items-center justify-center">
          <div className="text-white text-xl">Loading workouts...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#080D14] pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
                Workout <span className="gradient-text">Plans</span> 🏋️
              </h1>
              <p className="text-gray-400 text-lg font-medium">Your personalized path to peak performance.</p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCalendar}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl text-white font-bold text-sm tracking-wide transition-all flex items-center gap-2"
              >
                📅 Add to Calendar
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="btn-premium gradient-primary text-white shadow-lg shadow-purple-600/20"
              >
                {generating ? 'Regenerating...' : '✨ Refresh My Plan'}
              </button>
            </div>
          </div>

          {plan ? (
            <>
              {/* Tab Switcher */}
              <div className="flex gap-3 mb-10 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl w-fit border border-white/5">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-8 py-3 rounded-xl font-bold transition-all text-sm tracking-wide ${activeTab === 'today'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  🌅 TODAY'S DRILL
                </button>
                <button
                  onClick={() => setActiveTab('week')}
                  className={`px-8 py-3 rounded-xl font-bold transition-all text-sm tracking-wide ${activeTab === 'week'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  📅 WEEKLY ROADMAP
                </button>
              </div>

              {/* TODAY TAB */}
              {activeTab === 'today' && todayWorkout && (
                <div className="space-y-4">
                  {/* Today's header card */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {todayName} — {todayWorkout.focus_area}
                    </h2>
                    <div className="flex gap-6 text-white/80 flex-wrap">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {todayWorkout.duration_minutes || 45} min
                      </span>
                      <span className="flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        {todayWorkout.exercises?.length || 0} exercises
                      </span>
                      {todayWorkout.rest_day && (
                        <span className="bg-green-500/30 text-green-300 px-3 py-1 rounded-full text-sm">
                          🧘 Rest Day
                        </span>
                      )}
                    </div>
                  </div>

                  {!todayWorkout.rest_day && (
                    <>
                      {/* Warmup */}
                      {todayWorkout.warmup && (
                        <div className="bg-[#1a1a2e] border border-[#2a2a40] rounded-xl p-4">
                          <h3 className="text-white font-semibold mb-2">🔥 Warmup</h3>
                          <p className="text-gray-400">{todayWorkout.warmup}</p>
                        </div>
                      )}

                      {/* Exercises */}
                      <div className="space-y-4">
                        {todayWorkout.exercises?.map((ex, idx) => {
                          const isCompleted = completedExercises.has(ex.name)
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="glass glass-hover p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 group"
                            >
                              {/* Left: Intensity & Status */}
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => !isCompleted && handleCompleteExercise(ex.name)}
                                  className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCompleted
                                    ? 'bg-green-500 border-green-400'
                                    : 'border-white/10 hover:border-purple-500 hover:bg-purple-500/10'
                                    }`}
                                >
                                  {isCompleted ? <Check className="w-5 h-5 text-white" /> : <div className="w-2 h-2 rounded-full bg-white/20" />}
                                </button>

                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                                  {idx === 0 ? '🔥' : idx === 1 ? '💪' : '⚡'}
                                </div>
                              </div>

                              {/* Middle: Exercise info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`text-xl font-bold transition-all ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{ex.name}</h4>
                                  {!isCompleted && <span className="text-[10px] font-black bg-purple-600/30 text-purple-400 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-purple-500/20">Active</span>}
                                </div>
                                <p className="text-gray-500 text-sm font-medium line-clamp-1 group-hover:line-clamp-none transition-all">{ex.description}</p>

                                <div className="flex gap-3 mt-4">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Sets</span>
                                    <span className="text-white font-bold">{ex.sets}</span>
                                  </div>
                                  <div className="w-px h-6 bg-white/5 self-end mb-1" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Reps</span>
                                    <span className="text-white font-bold">{ex.reps}</span>
                                  </div>
                                  <div className="w-px h-6 bg-white/5 self-end mb-1" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Rest</span>
                                    <span className="text-purple-400 font-bold">{ex.rest_seconds}s</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Action */}
                              <button
                                onClick={() => setPlayerExercise(ex)}
                                className="w-full sm:w-auto px-6 py-4 bg-white/5 hover:bg-purple-600 text-white rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/5 hover:border-purple-500/50 group/btn shadow-xl"
                              >
                                <Play className="w-5 h-5 group-hover/btn:fill-current" />
                                <span className="font-bold text-sm">START DRILL</span>
                              </button>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Cooldown */}
                      {todayWorkout.cool_down && (
                        <div className="bg-[#1a1a2e] border border-[#2a2a40] rounded-xl p-4">
                          <h3 className="text-white font-semibold mb-2">🧊 Cool Down</h3>
                          <p className="text-gray-400">{todayWorkout.cool_down}</p>
                        </div>
                      )}

                      {/* Daily tip */}
                      {todayWorkout.daily_tip && (
                        <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4">
                          <p className="text-green-300 text-sm">💡 {todayWorkout.daily_tip}</p>
                        </div>
                      )}
                    </>
                  )}

                  {todayWorkout.rest_day && (
                    <div className="text-center py-12 bg-[#1a1a2e] border border-[#2a2a40] rounded-xl">
                      <div className="text-6xl mb-4">🧘</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Rest Day!</h3>
                      <p className="text-gray-400">Your body recovers stronger. Light stretching is great today.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'today' && !todayWorkout && (
                <div className="text-center py-12 bg-[#1a1a2e] border border-[#2a2a40] rounded-xl">
                  <p className="text-gray-400">Today's workout data not available. Check your plan.</p>
                </div>
              )}

              {/* WEEK TAB */}
              {activeTab === 'week' && (
                <div className="space-y-3">
                  {days.map((day, idx) => (
                    <div key={idx} className="bg-[#1a1a2e] border border-[#2a2a40] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                        className="w-full p-5 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-white font-bold text-lg w-28">{day.day}</span>
                          <span className="text-purple-400 font-medium">{day.focus_area}</span>
                          {day.rest_day && (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">Rest Day</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {!day.rest_day && (
                            <>
                              <span className="text-gray-400 text-sm flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {day.duration_minutes} min
                              </span>
                              <span className="text-gray-400 text-sm">
                                {day.exercises?.length || 0} exercises
                              </span>
                            </>
                          )}
                          {expandedDay === idx ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {expandedDay === idx && !day.rest_day && (
                        <div className="px-5 pb-5 border-t border-[#2a2a40] pt-4 space-y-3">
                          {day.warmup && (
                            <p className="text-gray-400 text-sm">🔥 Warmup: {day.warmup}</p>
                          )}
                          {day.exercises?.map((ex, i) => (
                            <div key={i} className="bg-[#0d0d14] rounded-lg p-4 flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">{ex.name}</p>
                                <p className="text-gray-500 text-xs mt-1">{ex.description}</p>
                              </div>
                              <div className="flex gap-2">
                                <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">{ex.sets}×{ex.reps}</span>
                                <span className="bg-orange-600/20 text-orange-300 px-2 py-1 rounded text-xs">{ex.rest_seconds}s</span>
                              </div>
                            </div>
                          ))}
                          {day.cool_down && (
                            <p className="text-gray-400 text-sm">🧊 Cool Down: {day.cool_down}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏋️</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Workout Plan Yet</h2>
              <p className="text-gray-400 mb-6">Generate your first personalized workout plan</p>
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {generating ? 'Generating...' : '✨ Generate Plan'}
              </button>
            </div>
          )}

          {/* Exercise Player Modal */}
          {playerExercise && (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0D1520] border border-white/10 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">{playerExercise.name}</h2>
                    <p className="text-purple-400/80 text-xs font-black uppercase tracking-[0.2em] mt-1 italic">Optimization Protocol Active</p>
                  </div>
                  <button onClick={() => setPlayerExercise(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition shadow-inner">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                  {/* YouTube Video */}
                  <VideoPlayer
                    exerciseName={playerExercise.youtube_search_query || playerExercise.name}
                    onVideoLoad={setVideoData}
                  />

                  {/* Exercise Details */}
                  <div className="flex flex-col">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs text-gray-500">
                      ⚡ Technical Targets
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {[
                        { label: 'Sets', value: playerExercise.sets, color: 'text-purple-400', bg: 'bg-purple-600/10' },
                        { label: 'Reps', value: playerExercise.reps, color: 'text-blue-400', bg: 'bg-blue-600/10' },
                        { label: 'Rest', value: `${playerExercise.rest_seconds}s`, color: 'text-orange-400', bg: 'bg-orange-600/10' },
                      ].map((item, i) => (
                        <div key={i} className={`${item.bg} rounded-2xl p-6 border border-white/5 text-center`}>
                          <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                          <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Coaching cue from AI */}
                    {playerExercise.coaching_cue && (
                      <div className="bg-gradient-to-r from-purple-600/10 to-transparent p-4 rounded-2xl border-l-4 border-purple-500 mb-4">
                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Coach Cue</p>
                        <p className="text-white text-sm font-medium italic">"{playerExercise.coaching_cue}"</p>
                      </div>
                    )}

                    <div className="glass bg-white/5 border border-white/5 rounded-3xl p-6 mb-8 flex-1">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        AI Coach Logic
                      </h4>
                      <ul className="space-y-4 px-1">
                        {[
                          "Form over load. Speed is the enemy of growth.",
                          "Exhale on effort, inhale on reset.",
                          "Maintain core rigidity for structural integrity.",
                          "Full range of motion activates deeper tissue."
                        ].map((tip, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                            <p className="text-gray-400 text-sm font-medium italic">"{tip}"</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setShowCamera(true)}
                        className="w-full py-5 btn-premium gradient-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                      >
                        <Camera className="w-5 h-5" /> Start Camera + Tutorial
                      </button>

                      {/* Direct YouTube search link */}
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent((playerExercise.youtube_search_query || playerExercise.name) + ' exercise proper form')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 text-gray-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest border border-white/5 hover:border-red-500/30 rounded-2xl transition flex items-center justify-center gap-2"
                      >
                        <Youtube className="w-4 h-4" /> Search on YouTube
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => {
                          handleCompleteExercise(playerExercise.name)
                          setPlayerExercise(null)
                        }}
                        className="w-full py-4 text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest border border-white/5 hover:border-white/10 rounded-2xl transition"
                      >
                        Manual Complete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div >

      {/* Camera Motion Tracker */}
      {
        showCamera && playerExercise && (
          <ExerciseCamera
            exerciseName={playerExercise.name}
            videoId={videoData?.video_id}
            embedUrl={videoData?.embed_url}
            targetReps={parseInt(playerExercise.reps) || 12}
            onComplete={(stats) => {
              handleCompleteExercise(playerExercise.name, {
                calories: stats?.calories || 50,
                duration: stats?.duration || 5
              })
              setShowCamera(false)
              setPlayerExercise(null)
            }}
            onClose={() => setShowCamera(false)}
          />
        )
      }

      {
        showSummary && workoutStats && (
          <WorkoutComplete
            stats={workoutStats}
            onKeepGoing={() => setShowSummary(false)}
          />
        )
      }
    </>
  )
}

function VideoPlayer({ exerciseName, onVideoLoad }) {
  const [videoId, setVideoId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    workoutApi.youtubeSearch(exerciseName + ' exercise proper form')
      .then(res => {
        if (!cancelled) {
          if (res.data?.video_id) {
            setVideoId(res.data.video_id)
          }
          // Always callback with full data so camera can use embed_url
          if (onVideoLoad) onVideoLoad(res.data || {})
        }
      })
      .catch(() => {
        if (onVideoLoad) onVideoLoad({})
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [exerciseName])

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' exercise proper form')}`

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
          <Play className="w-4 h-4 text-red-500" />
        </div>
        Master Class Tutorial
      </h3>
      <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative group flex-1">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#080D14]">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Searching Tutorials...</p>
          </div>
        ) : videoId ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={exerciseName}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#080D14]">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <CameraOff className="w-8 h-8 text-gray-600" />
            </div>
            <h4 className="text-white font-bold mb-2">Tutorial Unavailable</h4>
            <p className="text-gray-500 text-sm mb-6">We couldn't find a direct video for this drill.</p>
            <a href={searchUrl} target="_blank" rel="noopener noreferrer"
              className="px-6 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition uppercase tracking-widest">
              Manual YouTube Search
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
