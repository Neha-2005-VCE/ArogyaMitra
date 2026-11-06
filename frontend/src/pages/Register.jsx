import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Zap, ArrowRight } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

export default function Register() {
    const [form, setForm] = useState({ full_name: '', email: '', username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const register = useAuthStore((s) => s.register);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(form);
            toast.success('Account created! 🎉');
            navigate('/health-assessment');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#002126] text-[#f0f2f3] font-['Inter',sans-serif]">
            <div className="w-full max-w-md">
                <div className="bg-[#003139] border border-[#1a474f] rounded-2xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block group mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#5fe089] flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
                                <Zap size={20} className="text-[#002126] fill-[#002126]" />
                            </div>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Create Account</h1>
                        <p className="text-xs sm:text-sm text-[#96a5a8]">
                            Start your personalized wellness journey
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#96a5a8] mb-1.5 block">
                                Full Name
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#657a7e]" />
                                <input 
                                    type="text" 
                                    className="pl-10 text-sm py-2.5 bg-[#002126] border border-[#1a474f] text-white rounded-xl focus:border-[#5fe089]" 
                                    placeholder="Your Name" 
                                    value={form.full_name} 
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#96a5a8] mb-1.5 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#657a7e]" />
                                <input 
                                    type="email" 
                                    className="pl-10 text-sm py-2.5 bg-[#002126] border border-[#1a474f] text-white rounded-xl focus:border-[#5fe089]" 
                                    placeholder="you@example.com" 
                                    value={form.email} 
                                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#96a5a8] mb-1.5 block">
                                Username
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#657a7e]" />
                                <input 
                                    type="text" 
                                    className="pl-10 text-sm py-2.5 bg-[#002126] border border-[#1a474f] text-white rounded-xl focus:border-[#5fe089]" 
                                    placeholder="choose_username" 
                                    value={form.username} 
                                    onChange={(e) => setForm({ ...form, username: e.target.value })} 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#96a5a8] mb-1.5 block">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#657a7e]" />
                                <input 
                                    type="password" 
                                    className="pl-10 text-sm py-2.5 bg-[#002126] border border-[#1a474f] text-white rounded-xl focus:border-[#5fe089]" 
                                    placeholder="••••••••" 
                                    value={form.password} 
                                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                                    required 
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn btn-primary w-full py-3 mt-2 text-sm font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? 'Creating Account...' : (
                                <>
                                    <span>Continue to Assessment</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6 pt-5 border-t border-[#1a474f] text-xs text-[#96a5a8]">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-[#5fe089] hover:underline ml-1">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
