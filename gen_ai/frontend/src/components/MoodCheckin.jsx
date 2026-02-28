import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";

const MOODS = [
    { id: "energized", emoji: "🔥", label: "Energized", color: "#FF6B35" },
    { id: "normal", emoji: "😊", label: "Good", color: "#4CAF50" },
    { id: "tired", emoji: "😴", label: "Tired", color: "#2196F3" },
    { id: "stressed", emoji: "😰", label: "Stressed", color: "#FF9800" },
    { id: "sick", emoji: "🤒", label: "Unwell", color: "#9C27B0" },
];

export default function MoodCheckin({ onClose, onAdjusted }) {
    const [selectedMood, setSelectedMood] = useState(null);
    const [energy, setEnergy] = useState(5);
    const [sleep, setSleep] = useState(7);
    const [notes, setNotes] = useState("");
    const [step, setStep] = useState(1); // 1=mood, 2=details, 3=result
    const [result, setResult] = useState(null);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post("/api/mood-checkin", data);
            return res.data;
        },
        onSuccess: (data) => {
            setResult(data);
            setStep(3);
            if (data.plan_adjusted) {
                toast.success("✨ Today's workout has been adjusted for you!", { duration: 4000 });
                onAdjusted?.(data.adjusted_workout);
            }
        },
        onError: () => toast.error("Could not submit mood check-in"),
    });

    const handleSubmit = () => {
        mutation.mutate({
            mood: selectedMood.id,
            energy_level: energy,
            sleep_hours: sleep,
            notes,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-700"
            >
                {/* Step 1 — Mood Selection */}
                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white text-center mb-2">
                            Good Morning! 🌅
                        </h2>
                        <p className="text-gray-400 text-center mb-6">How are you feeling today?</p>
                        <div className="grid grid-cols-5 gap-3 mb-6">
                            {MOODS.map((mood) => (
                                <motion.button
                                    key={mood.id}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedMood(mood)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selectedMood?.id === mood.id
                                        ? "border-current bg-white/10"
                                        : "border-gray-700 hover:border-gray-500"
                                        }`}
                                    style={selectedMood?.id === mood.id ? { borderColor: mood.color } : {}}
                                >
                                    <span className="text-3xl">{mood.emoji}</span>
                                    <span className="text-xs text-gray-300">{mood.label}</span>
                                </motion.button>
                            ))}
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setStep(2)}
                            disabled={!selectedMood}
                            className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </motion.button>
                    </div>
                )}

                {/* Step 2 — Energy & Sleep */}
                {step === 2 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">{selectedMood.emoji}</span>
                            <div>
                                <h2 className="text-xl font-bold text-white">A bit more detail</h2>
                                <p className="text-gray-400 text-sm">AROMI will customize your plan</p>
                            </div>
                        </div>

                        {/* Energy Slider */}
                        <div className="mb-5">
                            <label className="text-white font-medium block mb-2">
                                Energy Level: <span className="text-purple-400">{energy}/10</span>
                            </label>
                            <input
                                type="range" min="1" max="10" value={energy}
                                onChange={(e) => setEnergy(Number(e.target.value))}
                                className="w-full accent-purple-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>😴 Drained</span><span>🔥 Supercharged</span>
                            </div>
                        </div>

                        {/* Sleep Slider */}
                        <div className="mb-5">
                            <label className="text-white font-medium block mb-2">
                                Hours Slept: <span className="text-blue-400">{sleep}hrs</span>
                            </label>
                            <input
                                type="range" min="2" max="12" step="0.5" value={sleep}
                                onChange={(e) => setSleep(Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>2hrs</span><span>12hrs</span>
                            </div>
                        </div>

                        {/* Notes */}
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Anything specific? (sore muscles, big meeting today...)"
                            className="w-full bg-gray-800 text-white rounded-xl p-3 text-sm border border-gray-700 focus:border-purple-500 outline-none resize-none mb-5"
                            rows={2}
                        />

                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300">
                                ← Back
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                disabled={mutation.isPending}
                                className="flex-2 flex-grow py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40"
                            >
                                {mutation.isPending ? "Analyzing... ✨" : "Generate My Day 🚀"}
                            </motion.button>
                        </div>
                    </div>
                )}

                {/* Step 3 — Result */}
                {step === 3 && result && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="text-center mb-4">
                            <div className="text-5xl mb-3">{selectedMood.emoji}</div>
                            <h2 className="text-xl font-bold text-white">{result.message}</h2>
                        </div>

                        {result.plan_adjusted && (
                            <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-3 mb-4">
                                <p className="text-green-400 font-semibold text-sm">✅ Workout Adjusted!</p>
                                <p className="text-gray-300 text-sm">{result.adjustment_reason}</p>
                            </div>
                        )}

                        {result.recommendations?.length > 0 && (
                            <div className="space-y-2 mb-5">
                                {result.recommendations.map((rec, i) => (
                                    <div key={i} className="bg-gray-800 rounded-xl p-3 text-sm text-gray-300">{rec}</div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500"
                        >
                            Let's Go! 💪
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}
