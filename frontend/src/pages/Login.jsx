import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, ArrowRight } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { healthApi } from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form);
            toast.success('Welcome back!');

            // Check if user has completed the health assessment
            try {
                const res = await healthApi.getLatest();
                if (res.data && res.data.id) {
                    navigate('/dashboard');
                } else {
                    navigate('/health-assessment');
                }
            } catch {
                navigate('/health-assessment');
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Invalid username or password');
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
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Welcome Back</h1>
                        <p className="text-xs sm:text-sm text-[#96a5a8]">
                            Log in to your ArogyaMitra account
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#96a5a8] mb-1.5 block">
                                Username or Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#657a7e]" />
                                <input 
                                    type="text" 
                                    className="pl-10 text-sm py-2.5 bg-[#002126] border border-[#1a474f] text-white rounded-xl focus:border-[#5fe089]" 
                                    placeholder="Enter your username" 
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
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn btn-primary w-full py-3 mt-2 text-sm font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? 'Logging in...' : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6 pt-5 border-t border-[#1a474f] text-xs text-[#96a5a8]">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-[#5fe089] hover:underline ml-1">
                            Sign up free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
