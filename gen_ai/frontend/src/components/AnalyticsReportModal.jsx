import { motion } from 'framer-motion'
import { Activity, ShieldAlert, HeartPulse, X, TrendingUp, AlertTriangle } from 'lucide-react'

export default function AnalyticsReportModal({ onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#0a0f16] border border-emerald-500/30 rounded-[2rem] shadow-2xl shadow-emerald-500/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative"
            >
                {/* Header */}
                <div className="sticky top-0 bg-[#0a0f16]/90 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Kinematic Risk Analysis</h2>
                            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-0.5 flex gap-2">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Telemetry</span>
                                <span className="text-gray-500">|</span>
                                <span className="text-gray-400">Last 7 Days</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 space-y-8">

                    {/* Overall Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 text-center md:text-left">Overall System Load</h3>
                            <div className="flex items-end gap-3 justify-center md:justify-start">
                                <span className="text-5xl font-black text-white">12</span>
                                <span className="text-emerald-400 font-bold mb-2">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-medium text-center md:text-left">Optimal recovery vector</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 text-center md:text-left">Joint Stress Index</h3>
                            <div className="flex items-end gap-3 justify-center md:justify-start">
                                <span className="text-5xl font-black text-white">4.2</span>
                                <span className="text-amber-400 font-bold mb-2">/10</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-medium text-center md:text-left">Moderate knee tension detected</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 text-center md:text-left">Form Consistency</h3>
                            <div className="flex items-end gap-3 justify-center md:justify-start">
                                <span className="text-5xl font-black text-white">94</span>
                                <span className="text-purple-400 font-bold mb-2">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-medium text-center md:text-left">Excellent bi-lateral symmetry</p>
                        </div>
                    </div>

                    {/* Deep Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Biomechanics Breakdown */}
                        <div className="bg-[#111827] rounded-3xl p-6 border border-white/5">
                            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-indigo-400" /> Biomechanical Strain Map
                            </h3>

                            <div className="space-y-5">
                                {[
                                    { area: "Cervical Spine", load: 15, status: "Safe", color: "bg-emerald-500" },
                                    { area: "Lumbar Region", load: 60, status: "Watch", color: "bg-amber-500" },
                                    { area: "Left Knee", load: 25, status: "Safe", color: "bg-emerald-500" },
                                    { area: "Right Shoulder", load: 85, status: "Warning", color: "bg-red-500" }
                                ].map((stat, i) => (
                                    <div key={i} className="relative">
                                        <div className="flex justify-between text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide">
                                            <span>{stat.area}</span>
                                            <span className={stat.color.replace('bg-', 'text-')}>{stat.status}</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stat.load}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className={`h-full rounded-full ${stat.color}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Insights */}
                        <div className="bg-[#111827] rounded-3xl p-6 border border-white/5 flex flex-col">
                            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-400" /> AI Diagnostic Insights
                            </h3>

                            <div className="flex-1 space-y-4">
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
                                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-red-400 text-sm font-bold mb-1">Shoulder Impingement Risk</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed">Your right shoulder exhibited restricted tracking during yesterday's overhead press. AROMI has substituted heavy pressing with mobility work for 48 hours to prevent labrum fraying.</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                                    <TrendingUp className="w-6 h-6 text-amber-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-amber-400 text-sm font-bold mb-1">Lumbar Flexion Alert</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed">Minor rounding detected at the bottom of your squat pattern. Recommend focusing on hip-hinge depth rather than knee dominance to protect L4/L5 discs.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-6 border-t border-white/5 text-center">
                        <button onClick={onClose} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95">
                            Acknowledge & Return
                        </button>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    )
}
