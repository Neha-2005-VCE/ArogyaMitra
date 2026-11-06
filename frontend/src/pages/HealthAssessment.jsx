import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, Loader2, Sparkles } from 'lucide-react';
import { healthApi, workoutApi, nutritionApi } from '../services/api';
import toast from 'react-hot-toast';

const questions = [
    { key: 'age', label: 'What is your age?', type: 'number', placeholder: '25' },
    { key: 'gender', label: 'What is your gender?', type: 'choice', options: ['Male', 'Female', 'Other'] },
    { key: 'height', label: 'What is your height (in cm)?', type: 'number', placeholder: '170' },
    { key: 'weight', label: 'What is your weight (in kg)?', type: 'number', placeholder: '70' },
    { key: 'fitness_level', label: 'What is your current fitness level?', type: 'choice', options: ['beginner', 'intermediate', 'advanced'] },
    { key: 'fitness_goal', label: 'What is your primary fitness goal?', type: 'choice', options: ['weight_loss', 'muscle_gain', 'maintenance', 'endurance'] },
    { key: 'workout_preference', label: 'Where do you prefer to work out?', type: 'choice', options: ['home', 'gym', 'outdoor', 'hybrid'] },
    { key: 'workout_time_preference', label: 'When do you prefer to work out?', type: 'choice', options: ['Morning', 'Evening'] },
    { key: 'medical_history', label: 'Do you have any medical history?', type: 'textarea', placeholder: 'e.g., Heart condition, Hypertension (or none)' },
    { key: 'health_conditions', label: 'Do you have any current health conditions?', type: 'textarea', placeholder: 'e.g., Diabetes, Asthma (or none)' },
    { key: 'injuries', label: 'Any past or present injuries?', type: 'textarea', placeholder: 'e.g., Lower back pain, Knee injury (or none)' },
    { key: 'allergies', label: 'Do you have any food allergies?', type: 'textarea', placeholder: 'e.g., Peanuts, Dairy, Gluten (or none)' },
    { key: 'medications', label: 'Are you taking any medications?', type: 'textarea', placeholder: 'e.g., Blood pressure medication (or none)' },
    { key: 'calendar_sync', label: 'Would you like to sync your plan to Google Calendar?', type: 'checkbox' },
];

export default function HealthAssessment() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const q = questions[step];
    const progress = ((step + 1) / questions.length) * 100;

    const val = data[q.key] ?? '';
    const set = (v) => setData({ ...data, [q.key]: v });

    const isRequired = ['age', 'gender', 'height', 'weight', 'fitness_level', 'fitness_goal', 'workout_preference', 'workout_time_preference'];
    const canNext = !isRequired.includes(q.key) || (val !== '' && val !== undefined);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await healthApi.submit(data);
            toast.success('Health assessment saved!');
            try { await workoutApi.generate(); } catch { }
            try { await nutritionApi.generate({ calorie_target: 1800, diet_type: data.diet_preference || 'vegetarian', allergies: data.allergies || '' }); } catch { }
            toast.success('Plans generated! ✨');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#002126] text-[#f0f2f3] flex items-center justify-center px-4 py-12 font-['Inter',sans-serif]">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#5fe089] text-[#002126] flex items-center justify-center mx-auto mb-3">
                        <Zap size={22} className="fill-[#002126]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                        Lifestyle & Health Assessment
                    </h1>
                    <p className="text-xs sm:text-sm text-[#96a5a8]">
                        Answer a few questions so our software can customize your roadmap
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-[#96a5a8] mb-2 font-medium">
                        <span>Question {step + 1} of {questions.length}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#003139] rounded-full overflow-hidden border border-[#1a474f]">
                        <motion.div 
                            className="h-full bg-[#5fe089] rounded-full"
                            animate={{ width: `${progress}%` }} 
                            transition={{ duration: 0.3 }} 
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-[#003139] border border-[#1a474f] rounded-2xl p-6 sm:p-8 min-h-[300px] flex flex-col justify-between shadow-2xl">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={step} 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }} 
                            transition={{ duration: 0.2 }} 
                            className="flex-1"
                        >
                            <h2 className="text-lg sm:text-xl font-bold text-white mb-6">{q.label}</h2>

                            {q.type === 'number' && (
                                <input 
                                    type="number" 
                                    className="w-full text-base py-3 bg-[#002126] border border-[#1a474f] rounded-xl text-white focus:border-[#5fe089]" 
                                    placeholder={q.placeholder} 
                                    value={val} 
                                    onChange={(e) => set(Number(e.target.value))} 
                                    autoFocus 
                                />
                            )}

                            {q.type === 'textarea' && (
                                <textarea 
                                    className="w-full min-h-[120px] text-sm py-3 bg-[#002126] border border-[#1a474f] rounded-xl text-white focus:border-[#5fe089] resize-none" 
                                    placeholder={q.placeholder} 
                                    value={val} 
                                    onChange={(e) => set(e.target.value)} 
                                    autoFocus
                                />
                            )}

                            {q.type === 'choice' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {q.options.map((opt) => (
                                        <button 
                                            key={opt} 
                                            type="button"
                                            onClick={() => set(opt)} 
                                            className={`p-3.5 rounded-xl border text-sm font-semibold transition-all capitalize ${
                                                val === opt 
                                                    ? 'bg-[#083841] border-[#5fe089] text-[#5fe089]' 
                                                    : 'bg-[#002126] border-[#1a474f] text-[#c1c9cb] hover:border-[#5fe089]/40 hover:text-white'
                                            }`}
                                        >
                                            {opt.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {q.type === 'checkbox' && (
                                <label className="flex items-center gap-3.5 p-4 rounded-xl cursor-pointer bg-[#002126] border border-[#1a474f] hover:border-[#5fe089]/40 transition">
                                    <input 
                                        type="checkbox" 
                                        checked={val || false} 
                                        onChange={(e) => set(e.target.checked)} 
                                        className="w-5 h-5 accent-[#5fe089]"
                                    />
                                    <span className="text-sm text-white">Yes, sync my workout schedule with Google Calendar</span>
                                </label>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1a474f]">
                        <button 
                            type="button"
                            onClick={() => setStep(Math.max(0, step - 1))} 
                            disabled={step === 0} 
                            className="flex items-center gap-1.5 text-sm font-semibold text-[#96a5a8] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        
                        {step < questions.length - 1 ? (
                            <button 
                                type="button"
                                onClick={() => canNext && setStep(step + 1)} 
                                disabled={!canNext} 
                                className="btn btn-primary text-sm py-2 px-6"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={handleSubmit} 
                                disabled={loading} 
                                className="btn btn-primary text-sm py-2 px-6"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="spinner" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        Generate Plan <Sparkles size={16} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
