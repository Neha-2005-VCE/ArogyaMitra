import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, User, Activity, Zap, Heart } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import useSidebarStore from '../stores/sidebarStore';
import useAuthStore from '../stores/authStore';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
    const user = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);
    const { isCollapsed } = useSidebarStore();
    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        age: user?.age || '',
        gender: user?.gender || '',
        height: user?.height || '',
        weight: user?.weight || '',
        fitness_level: user?.fitness_level || '',
        fitness_goal: user?.fitness_goal || '',
        bio: user?.bio || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await authApi.updateProfile(form);
            updateUser(res.data);
            toast.success('Profile updated successfully! ✅');
        } catch {
            toast.error('Failed to update profile');
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0F19] text-[#F1F5F9] font-['Inter',sans-serif]">
            <Sidebar />

            <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-12 min-h-screen overflow-x-hidden flex flex-col items-center">
                <div className="w-full max-w-5xl space-y-8">
                    {/* Header */}
                    <div className="pb-6 border-b border-white/[0.08]">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
                            Account & Health Profile
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Manage your biometric details and fitness preferences
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* User Overview Card */}
                        <div className="bg-white/[0.025] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 sm:p-8 text-center h-fit shadow-xl">
                            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-emerald-400 shadow-md">
                                {(user?.full_name?.[0] || 'U').toUpperCase()}
                            </div>
                            <h2 className="text-lg font-bold text-white mb-0.5">{user?.full_name || 'Member'}</h2>
                            <p className="text-xs text-slate-400 mb-6">{user?.email}</p>

                            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.08]">
                                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                    <div className="text-lg font-bold text-white">{user?.total_workouts ?? 0}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Workouts</div>
                                </div>
                                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                    <div className="text-lg font-bold text-emerald-400">{user?.streak_points ?? 0}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Streak</div>
                                </div>
                                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                    <div className="text-lg font-bold text-emerald-400">₹{user?.charity_donations ?? 0}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Aid</div>
                                </div>
                            </div>
                        </div>

                        {/* Edit Profile Form */}
                        <div className="lg:col-span-2 bg-white/[0.025] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 sm:p-8 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-6 pb-3 border-b border-white/[0.08]">
                                Biometric & Activity Details
                            </h3>

                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                            Full Name
                                        </label>
                                        <input 
                                            type="text" 
                                            value={form.full_name} 
                                            onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                            Age
                                        </label>
                                        <input 
                                            type="number" 
                                            value={form.age} 
                                            onChange={(e) => setForm({ ...form, age: e.target.value })} 
                                            placeholder="25"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                            Height (cm)
                                        </label>
                                        <input 
                                            type="number" 
                                            value={form.height} 
                                            onChange={(e) => setForm({ ...form, height: e.target.value })} 
                                            placeholder="175"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                            Weight (kg)
                                        </label>
                                        <input 
                                            type="number" 
                                            value={form.weight} 
                                            onChange={(e) => setForm({ ...form, weight: e.target.value })} 
                                            placeholder="70"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                            Fitness Level
                                        </label>
                                        <select 
                                            value={form.fitness_level} 
                                            onChange={(e) => setForm({ ...form, fitness_level: e.target.value })}
                                        >
                                            <option value="">Select Level</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                            Primary Fitness Goal
                                        </label>
                                        <select 
                                            value={form.fitness_goal} 
                                            onChange={(e) => setForm({ ...form, fitness_goal: e.target.value })}
                                        >
                                            <option value="">Select Goal</option>
                                            <option value="weight_loss">Weight Loss</option>
                                            <option value="muscle_gain">Muscle Gain</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="endurance">Endurance</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                        Personal Bio / Health Notes
                                    </label>
                                    <textarea 
                                        rows={3} 
                                        value={form.bio} 
                                        onChange={(e) => setForm({ ...form, bio: e.target.value })} 
                                        placeholder="Any specific workout preferences or injuries..."
                                        className="resize-none"
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/[0.08] flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={saving} 
                                        className="btn btn-primary text-xs sm:text-sm py-2.5 px-7 flex items-center gap-2 rounded-full font-semibold shadow-lg"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 size={16} className="spinner" /> Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} /> Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
