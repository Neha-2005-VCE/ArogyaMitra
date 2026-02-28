import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Calendar, Ruler, Weight, Target, Dumbbell, Heart, Save, ChevronRight, Award, Flame, Sparkles, Edit3, Shield, Activity } from 'lucide-react'
import Navbar from '../components/Navbar'
import { profileApi, healthApi, progressApi } from '../services/api'
import useAuthStore from '../stores/authStore'
import toast from 'react-hot-toast'

const goalLabels = {
    weight_loss: 'Weight Loss',
    muscle_gain: 'Muscle Gain',
    maintenance: 'General Fitness',
    endurance: 'Endurance',
    weight_gain: 'Weight Gain',
}

const levelColors = {
    beginner: 'from-green-600 to-emerald-500',
    intermediate: 'from-yellow-600 to-amber-500',
    advanced: 'from-red-600 to-orange-500',
}

export default function UserProfile() {
    const { user, updateUser } = useAuthStore()
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    const [assessment, setAssessment] = useState(null)
    const [stats, setStats] = useState(null)

    const [form, setForm] = useState({
        full_name: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        phone: '',
        bio: '',
    })

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const [profileRes, statsRes] = await Promise.all([
                profileApi.get(),
                progressApi.getSummary(),
            ])
            const p = profileRes.data
            setForm({
                full_name: p.full_name || '',
                age: p.age || '',
                gender: p.gender || '',
                height: p.height || '',
                weight: p.weight || '',
                phone: p.phone || '',
                bio: p.bio || '',
            })
            setStats(statsRes.data)

            try {
                const assessRes = await healthApi.getLatest()
                setAssessment(assessRes.data)
            } catch { /* no assessment yet */ }


        } catch (err) {
            console.error('Profile load error:', err)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const payload = {
                full_name: form.full_name || undefined,
                age: form.age ? parseInt(form.age) : undefined,
                gender: form.gender || undefined,
                height: form.height ? parseFloat(form.height) : undefined,
                weight: form.weight ? parseFloat(form.weight) : undefined,
                phone: form.phone || undefined,
                bio: form.bio || undefined,
            }
            const res = await profileApi.update(payload)
            updateUser(res.data.user)
            toast.success('Profile updated! ✅')
            setEditing(false)
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }



    const StatBadge = ({ icon: Icon, label, value, color }) => (
        <div className="bg-[#13131f] rounded-xl p-4 border border-[#2a2a40] flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-white text-lg font-bold">{value}</p>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</p>
            </div>
        </div>
    )

    const InfoRow = ({ icon: Icon, label, value, editable, field, type = 'text' }) => (
        <div className="flex items-center justify-between py-3 border-b border-[#1e1e38] last:border-0">
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-gray-400 text-sm font-medium">{label}</span>
            </div>
            {editing && editable ? (
                <input
                    type={type}
                    value={form[field] || ''}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="bg-[#0d0d14] border border-[#2a2a40] rounded-lg px-3 py-1.5 text-white text-sm w-40 text-right focus:outline-none focus:border-purple-500"
                />
            ) : (
                <span className="text-white text-sm font-medium">{value || '—'}</span>
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0d0d14]">
            <Navbar />
            <div className="pt-20 md:pt-24 pb-8 px-4 max-w-5xl mx-auto">

                {/* ── Profile Header ────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-900/40 via-[#1a1a2e] to-[#1a1a2e] rounded-3xl p-6 md:p-8 border border-purple-500/20 mb-8"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-purple-600/20">
                                {(user?.full_name || user?.username || '?')[0]?.toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-3 border-[#0d0d14] flex items-center justify-center">
                                <Activity className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                                {user?.full_name || user?.username}
                            </h1>
                            <p className="text-gray-400 text-sm mb-3">@{user?.username} · {user?.email}</p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                {user?.fitness_level && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${levelColors[user.fitness_level] || levelColors.beginner}`}>
                                        {user.fitness_level.charAt(0).toUpperCase() + user.fitness_level.slice(1)}
                                    </span>
                                )}
                                {user?.fitness_goal && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                        🎯 {goalLabels[user.fitness_goal] || user.fitness_goal}
                                    </span>
                                )}
                                {user?.workout_preference && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-600/20 text-orange-400 border border-orange-600/30">
                                        🏋️ {user.workout_preference.charAt(0).toUpperCase() + user.workout_preference.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => editing ? handleSave() : setEditing(true)}
                            disabled={loading}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 ${editing
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-[#13131f] border border-[#2a2a40] text-gray-300 hover:border-purple-500 hover:text-white'
                                }`}
                        >
                            {editing ? (
                                <><Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save'}</>
                            ) : (
                                <><Edit3 className="w-4 h-4" /> Edit Profile</>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* ── Stats Grid ────────────────────────────── */}
                {stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        <StatBadge icon={Dumbbell} label="Workouts" value={stats.total_workouts} color="from-purple-600 to-violet-500" />
                        <StatBadge icon={Flame} label="Calories" value={Math.round(stats.total_calories_burned)} color="from-orange-600 to-red-500" />
                        <StatBadge icon={Activity} label="Streak" value={`${stats.current_streak}d`} color="from-blue-600 to-cyan-500" />
                        <StatBadge icon={Heart} label="Charity Pts" value={stats.charity_donations} color="from-green-600 to-emerald-500" />
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* ── Personal Information Card ──────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#1a1a2e] rounded-2xl border border-[#2a2a40] p-6"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <User className="w-5 h-5 text-purple-400" />
                            <h3 className="text-white font-bold text-lg">Personal Info</h3>
                        </div>

                        <InfoRow icon={User} label="Full Name" value={form.full_name} editable field="full_name" />
                        <InfoRow icon={Calendar} label="Age" value={form.age} editable field="age" type="number" />
                        <InfoRow icon={Shield} label="Gender" value={form.gender} editable field="gender" />
                        <InfoRow icon={Phone} label="Phone" value={form.phone} editable field="phone" />
                    </motion.div>

                    {/* ── Body Metrics Card ─────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#1a1a2e] rounded-2xl border border-[#2a2a40] p-6"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <h3 className="text-white font-bold text-lg">Body Metrics</h3>
                        </div>

                        <InfoRow icon={Ruler} label="Height" value={form.height ? `${form.height} cm` : null} editable field="height" type="number" />
                        <InfoRow icon={Weight} label="Weight" value={form.weight ? `${form.weight} kg` : null} editable field="weight" type="number" />
                        <InfoRow icon={Target} label="BMI" value={assessment?.bmi ? assessment.bmi.toFixed(1) : '—'} />
                        <InfoRow icon={Dumbbell} label="Fitness Level" value={user?.fitness_level?.charAt(0).toUpperCase() + user?.fitness_level?.slice(1)} />
                        <InfoRow icon={Sparkles} label="Goal" value={goalLabels[user?.fitness_goal] || user?.fitness_goal} />
                    </motion.div>

                    {/* ── Health Information Card ────────────── */}
                    {assessment && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-[#1a1a2e] rounded-2xl border border-[#2a2a40] p-6"
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <Heart className="w-5 h-5 text-red-400" />
                                <h3 className="text-white font-bold text-lg">Health Info</h3>
                            </div>

                            <InfoRow icon={Heart} label="Conditions" value={assessment.health_conditions || 'None'} />
                            <InfoRow icon={Activity} label="Injuries" value={assessment.injuries || 'None'} />
                            <InfoRow icon={Shield} label="Allergies" value={assessment.allergies || 'None'} />
                        </motion.div>
                    )}

                    {/* ── Integrations Card ─────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-[#1a1a2e] rounded-2xl border border-[#2a2a40] p-6"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <Calendar className="w-5 h-5 text-green-400" />
                            <h3 className="text-white font-bold text-lg">Integrations</h3>
                        </div>

                        <div className="space-y-4">


                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                                        <span className="text-lg">🤖</span>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">AROMI AI Coach</p>
                                        <p className="text-gray-500 text-xs">Powered by LLaMA 3.3</p>
                                    </div>
                                </div>
                                <span className="px-4 py-2 rounded-lg text-xs font-bold bg-green-600/15 text-green-400 border border-green-600/30">
                                    Active
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Bio ─────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 bg-[#1a1a2e] rounded-2xl border border-[#2a2a40] p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Edit3 className="w-5 h-5 text-purple-400" />
                        <h3 className="text-white font-bold text-lg">About</h3>
                    </div>
                    {editing ? (
                        <textarea
                            value={form.bio}
                            onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                            rows={3}
                            placeholder="Tell us about yourself and your fitness journey..."
                            className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none text-sm"
                        />
                    ) : (
                        <p className="text-gray-400 text-sm italic">
                            {form.bio || 'No bio yet. Click "Edit Profile" to add one!'}
                        </p>
                    )}
                </motion.div>

            </div>
        </div>
    )
}
