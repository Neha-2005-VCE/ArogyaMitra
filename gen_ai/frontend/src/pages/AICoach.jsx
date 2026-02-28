import { useState, useEffect, useRef } from "react";
import { aiCoachApi } from "../services/api";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Move, Coffee, Heart, Map, Sparkles, Calendar, User, Bot, Send, Play, RotateCcw } from "lucide-react";

const QUICK_PROMPTS = [
    { icon: "✈️", label: "Traveling tomorrow", text: "I'm traveling tomorrow. Give me a hotel room workout and meal tips." },
    { icon: "🤕", label: "Knee pain today", text: "My knee hurts today. What can I do safely?" },
    { icon: "😴", label: "Feeling fatigued", text: "I'm exhausted today. Should I work out or rest?" },
    { icon: "🗓️", label: "Busy week", text: "Super busy week — give me a 15-min daily routine." },
    { icon: "💧", label: "Hydration check", text: "How much water should I drink today?" },
    { icon: "🍛", label: "Meal swap", text: "No paneer today — what's a good protein swap?" },
];

const INTENTS = [
    { re: /travel|hotel|flight/i, tag: "travel", color: "#38BDF8" },
    { re: /pain|hurt|injur|sore/i, tag: "injury", color: "#F87171" },
    { re: /tired|fatigue|exhaust/i, tag: "fatigue", color: "#A78BFA" },
    { re: /busy|hectic/i, tag: "schedule", color: "#FBBF24" },
    { re: /water|hydrat/i, tag: "hydration", color: "#22D3EE" },
    { re: /meal|food|eat|diet/i, tag: "nutrition", color: "#34D399" },
    { re: /workout|exercise|gym/i, tag: "workout", color: "#BFFF00" },
];

const uid = () => Math.random().toString(36).slice(2, 8);
const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/* ─── Typing Dots ──────────────────────────────── */
function Dots() {
    return (
        <span className="inline-flex gap-1.5 items-center">
            {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-[#BFFF00] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
        </span>
    );
}

/* ─── Chat Bubble ──────────────────────────────── */
function Bubble({ m }) {
    const isUser = m.role === "user";
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} gap-4 items-end mb-8`}
        >
            {/* Bot avatar */}
            {!isUser && (
                <div className="w-11 h-11 rounded-2xl flex-shrink-0 bg-gradient-to-br from-[#BFFF00]/20 to-[#BFFF00]/5 border border-[#BFFF00]/20 flex items-center justify-center text-[#BFFF00] shadow-lg shadow-[#BFFF00]/10 relative">
                    <Bot className="w-5 h-5" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#BFFF00] border-[3px] border-[#06080C]" />
                </div>
            )}

            <div className={`max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
                <div className={`p-5 text-sm leading-relaxed transition-all duration-500 ${isUser
                    ? "bg-gradient-to-br from-[#BFFF00]/90 to-[#7CFC00]/80 text-[#06080C] font-semibold rounded-[1.5rem] rounded-tr-sm border border-[#BFFF00]/30"
                    : "glass rounded-[1.5rem] rounded-tl-sm text-gray-200"
                    }`}>
                    {m.loading ? (
                        <Dots />
                    ) : m.structured ? (
                        <div className="space-y-5">
                            {/* Motivation */}
                            {m.structured.daily_motivation && (
                                <div className="relative">
                                    <Sparkles className="absolute -top-3 -left-3 w-6 h-6 text-[#BFFF00]/20" />
                                    <p className="text-base font-bold gradient-text-lime italic">
                                        "{m.structured.daily_motivation}"
                                    </p>
                                </div>
                            )}

                            {/* Workout Plan */}
                            {m.structured.workout_plan && (
                                <div className="glass rounded-2xl p-5 border border-white/[0.06]">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BFFF00] mb-5 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-md bg-[#BFFF00]/10 flex items-center justify-center">
                                            <Move className="w-3 h-3" />
                                        </div>
                                        Drill Sequence
                                    </h4>
                                    <div className="space-y-3">
                                        {m.structured.workout_plan.map((ex, idx) => {
                                            let ytVideoId = null;
                                            if (ex.video_url) {
                                                try {
                                                    const url = new URL(ex.video_url);
                                                    ytVideoId = url.searchParams.get('v') || url.pathname.split('/').pop();
                                                } catch { }
                                            }
                                            return (
                                                <div key={idx} className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] group hover:bg-white/[0.04] hover:border-[#BFFF00]/10 transition-all">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/[0.04] flex items-center justify-center text-[10px] font-bold text-[#6B7A90] group-hover:bg-[#BFFF00]/10 group-hover:text-[#BFFF00] group-hover:border-[#BFFF00]/20 transition-all">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white text-sm">{ex.exercise_name}</p>
                                                                <p className="text-[10px] text-[#6B7A90] italic">"{ex.coaching_cue}"</p>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1 rounded-lg bg-[#BFFF00]/10 border border-[#BFFF00]/15">
                                                            <span className="text-[10px] text-[#BFFF00] font-bold uppercase tracking-wider">{ex.sets_reps}</span>
                                                        </div>
                                                    </div>

                                                    {/* YouTube thumbnail */}
                                                    {ytVideoId && (
                                                        <a
                                                            href={ex.video_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="relative block ml-10 rounded-xl overflow-hidden border border-white/[0.06] group/yt hover:border-red-500/30 transition-all"
                                                        >
                                                            <img
                                                                src={`https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`}
                                                                alt={ex.exercise_name + ' tutorial'}
                                                                className="w-full h-auto object-cover opacity-60 group-hover/yt:opacity-100 transition-opacity"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl group-hover/yt:scale-110 transition-transform">
                                                                    <Play className="w-5 h-5 text-white fill-white" />
                                                                </div>
                                                            </div>
                                                            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-white font-bold flex items-center gap-1">
                                                                <Play className="w-2.5 h-2.5 text-red-500 fill-red-500" /> Watch Tutorial
                                                            </div>
                                                        </a>
                                                    )}

                                                    {ex.video_url && !ytVideoId && (
                                                        <a
                                                            href={ex.video_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-[10px] font-bold text-[#BFFF00] uppercase tracking-widest hover:text-white transition-colors pl-10"
                                                        >
                                                            <Play className="w-3 h-3 fill-current" /> Watch Tutorial
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <a
                                            href="/workouts"
                                            className="flex-1 py-3 bg-[#BFFF00]/10 border border-[#BFFF00]/15 text-[#BFFF00] rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#BFFF00]/20 hover:scale-[1.02] transition-all"
                                        >
                                            <Map className="w-3 h-3" /> Track with Camera
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Nutrition Suggestion */}
                            {m.structured.nutrition_suggestion && (
                                <div className="glass rounded-2xl p-5 border border-white/[0.06]">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                            <Coffee className="w-3 h-3" />
                                        </div>
                                        Metabolic Fuel
                                    </h4>
                                    <p className="text-gray-300 text-xs font-medium leading-relaxed">{m.structured.nutrition_suggestion}</p>
                                </div>
                            )}

                            {/* Coach Advice */}
                            {m.structured.aromi_advice && (
                                <div className="bg-[#BFFF00]/[0.04] p-4 rounded-xl border-l-2 border-[#BFFF00]">
                                    <p className="text-[10px] text-[#BFFF00] font-bold uppercase tracking-widest mb-1">Coach Insight</p>
                                    <p className="text-white text-sm font-medium italic">{m.structured.aromi_advice}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap font-medium">
                            {m.text.split("\n").map((line, i) => {
                                const t = line.trim();
                                if (!t) return <div key={i} className="h-2" />;
                                if (t.startsWith("- ") || t.startsWith("• "))
                                    return <div key={i} className="flex gap-3 mb-2 items-start mt-2">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#BFFF00] shadow-[0_0_8px_rgba(191,255,0,0.5)]" />
                                        <span className="text-sm">{t.slice(2)}</span>
                                    </div>;
                                return <div key={i} className="mb-3">
                                    {t.split(/\*\*(.*?)\*\*/g).map((p, j) =>
                                        j % 2 === 1 ? <strong key={j} className="text-white font-bold">{p}</strong> : p
                                    )}
                                </div>;
                            })}
                        </div>
                    )}
                </div>
                <div className={`text-[10px] font-bold mt-2 px-2 uppercase tracking-[0.15em] ${isUser ? 'text-[#BFFF00]/40' : 'text-[#3D4A5C]'}`}>
                    {m.time} {isUser ? "· YOU" : "· AROMI"}
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════
   AI COACH PAGE
   ═══════════════════════════════════════════════════ */
export default function AICoach() {
    const [msgs, setMsgs] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [intent, setIntent] = useState(null);
    const [planModal, setPlan] = useState(false);
    const [planDone, setPlanDone] = useState(false);
    const endRef = useRef(null);
    const taRef = useRef(null);

    useEffect(() => {
        setMsgs([{
            id: "welcome", role: "assistant", time: now(),
            text: "Namaste! 🙏 I'm **AROMI**, your AI wellness coach.\n\nI adapt your workouts and meals in real-time based on your situation — traveling, injured, tired, or busy.\n\nWhat's on your mind today?"
        }]);
    }, []);

    useEffect(() => {
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [msgs]);

    const send = async (raw) => {
        const text = (raw ?? input).trim();
        if (!text || loading) return;
        setInput("");
        if (taRef.current) taRef.current.style.height = "auto";

        const det = INTENTS.find(p => p.re.test(text));
        if (det) setIntent(det);

        const userMsg = { id: uid(), role: "user", time: now(), text };
        const aiId = uid();
        const aiMsg = { id: aiId, role: "assistant", time: now(), text: "", loading: true };

        setMsgs(p => [...p, userMsg, aiMsg]);
        setLoading(true);

        try {
            const res = await aiCoachApi.chat(text);
            let content = res.data.response;
            let structured = null;

            try {
                if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('```json'))) {
                    const jsonStr = content.includes('```json')
                        ? content.split('```json')[1].split('```')[0]
                        : content;
                    structured = JSON.parse(jsonStr);
                    content = "I've personalized your plan, ji! Check the details below.";
                }
            } catch (e) {
                console.log("Not a structured response, using as text");
            }

            setMsgs(p => p.map(m => m.id === aiId ? {
                ...m,
                text: typeof content === 'string' ? content : "Plan updated! ✨",
                loading: false,
                structured: structured
            } : m));

            if (res.data.plan_updated || structured) {
                setIntent(null);
                if (structured) setTimeout(() => setPlan(true), 800);
                else toast.success("Plan adapted by AROMI! ✨");
            }

        } catch (err) {
            toast.error("Connecting to server...");
            setMsgs(p => p.map(m => m.id === aiId ? {
                ...m,
                text: "Namaste! 🙏 Having a small technical issue. Please try again! 💚",
                loading: false
            } : m));
        }

        setLoading(false);
        setTimeout(() => taRef.current?.focus(), 50);
    };

    const confirmUpdate = () => {
        setPlan(false); setPlanDone(true);
        setTimeout(() => setPlanDone(false), 4000);
        setMsgs(p => [...p, {
            id: uid(), role: "assistant", time: now(),
            text: "✅ **Plan updated!** Check your dashboard for your adapted routine. Consistency is your superpower — bilkul perfect! 💪"
        }]);
    };

    return (
        <div className="h-screen flex flex-col bg-[#06080C] text-gray-300 overflow-hidden font-sans">
            <Navbar />

            {/* ═══ HEADER ═══ */}
            <div className="pt-20 px-6 pb-4 flex items-center justify-between border-b border-white/[0.04] bg-gradient-to-b from-[#0A0E18] to-[#06080C]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BFFF00]/15 to-[#BFFF00]/5 border border-[#BFFF00]/15 flex items-center justify-center text-[#BFFF00] shadow-lg shadow-[#BFFF00]/10 relative animate-pulse-subtle">
                        <Bot className="w-6 h-6" />
                        <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#06080C] ${loading ? "bg-amber-400" : "bg-[#BFFF00]"}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-white tracking-tight">AROMI</h1>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/15 uppercase tracking-widest text-[#BFFF00] font-bold">Coach</span>
                            {intent && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full animate-bounce" style={{ background: `${intent.color}15`, color: intent.color, border: `1px solid ${intent.color}30` }}>
                                    {intent.tag} detected
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[#3D4A5C]">{loading ? "AROMI is thinking..." : "Ready to adjust your plan"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {planDone && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#BFFF00]/10 border border-[#BFFF00]/15 rounded-full text-[10px] text-[#BFFF00] font-bold uppercase tracking-wider animate-fade-in">
                            ✓ Plan Synced
                        </div>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2.5 rounded-xl glass glass-hover text-[#6B7A90] hover:text-white transition-colors hover:scale-105"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ═══ CHAT AREA ═══ */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-2 space-y-2 scrollbar-hide">
                {msgs.map(m => <Bubble key={m.id} m={m} />)}

                {/* Quick prompts */}
                {msgs.length === 1 && !loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8 px-2">
                        {QUICK_PROMPTS.map((p, i) => (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                key={p.label}
                                onClick={() => send(p.text)}
                                className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-2xl glass glass-lime text-left hover:scale-105 transition-all duration-300"
                            >
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#BFFF00]/[0.02] blur-2xl -mr-4 -mt-4 group-hover:bg-[#BFFF00]/[0.05] transition-colors" />
                                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl group-hover:scale-105 group-hover:border-[#BFFF00]/20 transition-all duration-300">
                                    {p.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white tracking-tight">{p.label}</p>
                                    <p className="text-[10px] text-[#3D4A5C] font-bold uppercase tracking-widest mt-0.5">Instant Adapt</p>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
                <div ref={endRef} className="h-4" />
            </div>

            {/* ═══ INPUT AREA ═══ */}
            <div className="p-6 bg-[#06080C] border-t border-white/[0.04] relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className={`group flex items-end gap-3 p-3 pl-6 rounded-2xl transition-all duration-500 border ${loading
                        ? "glass border-[#BFFF00]/20 shadow-[0_0_40px_rgba(191,255,0,0.05)]"
                        : "glass border-white/[0.06] focus-within:border-[#BFFF00]/30 focus-within:shadow-[0_0_40px_rgba(191,255,0,0.04)]"
                        }`}>
                        <textarea
                            ref={taRef}
                            rows={1}
                            value={input}
                            disabled={loading}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            onInput={e => {
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                            }}
                            placeholder="Message AROMI... (e.g. 'I'm traveling tomorrow')"
                            className="flex-1 py-3 bg-transparent border-none outline-none text-sm text-gray-200 placeholder-[#3D4A5C] resize-none font-medium leading-relaxed"
                        />
                        <button
                            onClick={() => send()}
                            disabled={loading || !input.trim()}
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${!input.trim() || loading
                                ? "bg-white/[0.03] text-[#3D4A5C]"
                                : "bg-[#BFFF00] text-[#06080C] shadow-xl shadow-[#BFFF00]/20 hover:scale-105 active:scale-95 hover:shadow-[0_0_25px_rgba(191,255,0,0.3)]"
                                }`}
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-[#3D4A5C] border-t-[#BFFF00] rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ PLAN SYNC MODAL ═══ */}
            {planModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-md glass rounded-3xl p-10 shadow-[0_0_80px_rgba(191,255,0,0.08)] relative overflow-hidden text-center"
                    >
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#BFFF00]/50 to-transparent" />

                        <div className="w-20 h-20 rounded-2xl bg-[#BFFF00]/10 border border-[#BFFF00]/15 flex items-center justify-center text-4xl mb-6 mx-auto">
                            🔄
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Sync Adaptation?</h3>
                        <p className="text-[#6B7A90] text-sm mb-8 leading-relaxed">
                            AROMI has calculated a new metabolic roadmap based on your current constraints.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmUpdate}
                                className="w-full py-4 rounded-xl btn-lime text-sm font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                Affirm & Update
                            </button>
                            <button
                                onClick={() => setPlan(false)}
                                className="w-full py-4 rounded-xl glass glass-hover text-[#6B7A90] text-sm font-bold uppercase tracking-widest"
                            >
                                Discard Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
