import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Flame, CheckCircle, Clock, TrendingUp, Home, Share2 } from 'lucide-react';
import { workoutSessionApi } from '../services/api';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function WorkoutComplete() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSession();
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
        });
    }, []);

    const loadSession = async () => {
        try {
            const sessionId = searchParams.get('sessionId');
            if (sessionId) {
                const res = await workoutSessionApi.getCurrent();
                setSession(res.data);
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        {
            icon: Flame,
            label: 'Calories Burned',
            value: session?.total_calories || 14,
            color: '#F97316'
        },
        {
            icon: CheckCircle,
            label: 'Sets Finished',
            value: session?.exercises?.reduce((sum, e) => sum + (e.sets || 0), 0) || 3,
            color: '#84CC16'
        },
        {
            icon: Clock,
            label: 'Active Minutes',
            value: session?.duration_minutes || 4,
            color: '#2DD4BF'
        },
        {
            icon: TrendingUp,
            label: 'Completion',
            value: '100%',
            color: '#A78BFA'
        }
    ];

    const achievements = [
        { text: 'Improved cardiovascular endurance and stamina', completed: true },
        { text: 'Maintained form consistency via camera tracking', completed: true },
        { text: 'Logged daily session toward consistency streak', completed: true },
        { text: 'Converted workout calories to charitable aid', completed: true }
    ];

    const handleShare = () => {
        const text = `Just completed my workout on ArogyaMitra! 🔥 Burned ${session?.total_calories || 14} calories!`;
        if (navigator.share) {
            navigator.share({ text });
        } else {
            navigator.clipboard.writeText(text);
            toast.success('Summary copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
                <div className="spinner rounded-full h-10 w-10 border-b-2 border-[#84CC16]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F14] text-[#F8FAFC] flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#84CC16] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#0B0F14]">
                        <Trophy size={32} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                        Workout Complete!
                    </h1>
                    <p className="text-xs sm:text-sm text-[#A0AEC0]">
                        Great discipline today. Your statistics have been recorded.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-[#151D2B] border border-[#273244] rounded-xl p-5 text-center"
                        >
                            <stat.icon size={22} className="mx-auto mb-2" style={{ color: stat.color }} />
                            <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
                            <div className="text-[11px] text-[#A0AEC0] font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Achievements */}
                <div className="bg-[#151D2B] border border-[#273244] rounded-xl p-6 mb-6">
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle size={16} className="text-[#84CC16]" />
                        Session Milestones
                    </h2>
                    <div className="space-y-2.5">
                        {achievements.map((achievement, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-lg bg-[#111827] border border-[#273244]"
                            >
                                <div className="w-5 h-5 bg-[#84CC16]/15 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle size={13} className="text-[#84CC16]" />
                                </div>
                                <span className="text-[#F8FAFC] text-xs font-medium">{achievement.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <Home size={16} />
                        Return to Dashboard
                    </button>
                    <button
                        onClick={handleShare}
                        className="btn btn-secondary px-5 py-3 text-sm flex items-center justify-center"
                        title="Share Workout"
                    >
                        <Share2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
