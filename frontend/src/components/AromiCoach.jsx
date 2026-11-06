import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { chatApi } from "../services/api";

const QUICK_PROMPTS = [
  { label: "Traveling tomorrow", text: "I'm traveling tomorrow. Give me a hotel room workout and meal tips." },
  { label: "Knee pain today", text: "My knee hurts today. What can I do safely without making it worse?" },
  { label: "Feeling fatigued", text: "I'm exhausted today. Should I work out or take a recovery day?" },
  { label: "Busy schedule", text: "Super busy week — give me a 15-minute daily high-efficiency routine." },
  { label: "Hydration check", text: "How much water should I drink today based on my activity?" },
  { label: "Protein meal swap", text: "No paneer today — what is an equivalent Indian vegetarian protein swap?" },
];

const INTENTS = [
  { re: /travel|hotel|flight/i, tag: "travel", color: "#2DD4BF" },
  { re: /pain|hurt|injur|sore/i, tag: "injury", color: "#F87171" },
  { re: /tired|fatigue|exhaust/i, tag: "fatigue", color: "#A78BFA" },
  { re: /busy|hectic/i, tag: "schedule", color: "#FBBF24" },
  { re: /water|hydrat/i, tag: "hydration", color: "#2DD4BF" },
  { re: /meal|food|eat|diet/i, tag: "nutrition", color: "#5fe089" },
  { re: /workout|exercise|gym/i, tag: "workout", color: "#F97316" },
];

const uid = () => Math.random().toString(36).slice(2, 8);
const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function Dots() {
  return (
    <span className="inline-flex items-center gap-1.5 py-1">
      {[0, 1, 2].map(i => (
        <span 
          key={i} 
          className="w-2 h-2 rounded-full bg-[#5fe089] animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }} 
        />
      ))}
    </span>
  );
}

function Bubble({ m }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex gap-3 items-start mb-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
        isUser 
          ? 'bg-[#083841] border border-[#1a474f] text-[#5fe089]' 
          : 'bg-[#5fe089] text-[#002126]'
      }`}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>
      <div className="max-w-[80%]">
        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
          isUser 
            ? 'bg-[#083841] border border-[#1a474f] text-[#f0f2f3]' 
            : 'bg-[#003139] border border-[#1a474f] text-[#f0f2f3]'
        }`}>
          {m.loading ? (
            <Dots />
          ) : isUser ? (
            m.text
          ) : (
            <div className="space-y-2 whitespace-pre-wrap">{m.text}</div>
          )}
        </div>
        <div className={`text-[10px] text-[#657a7e] mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {m.time}
        </div>
      </div>
    </div>
  );
}

export default function AromiCoach() {
  const [msgs, setMsgs] = useState([
    {
      id: uid(),
      role: "assistant",
      time: now(),
      text: "Namaste! I'm AROMI, your dedicated health & wellness coach. How can I help fine-tune your workouts or nutrition today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState(null);
  const [planModal, setPlan] = useState(false);
  const [planDone, setPlanDone] = useState(false);
  const [error, setError] = useState("");

  const endRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (explicitText) => {
    const text = (explicitText !== undefined ? explicitText : input).trim();
    if (!text || loading) return;

    setError("");
    const matched = INTENTS.find(i => i.re.test(text));
    if (matched) setIntent(matched);

    const userMsg = { id: uid(), role: "user", time: now(), text };
    const aiId = uid();
    const aiMsg = { id: aiId, role: "assistant", time: now(), text: "", loading: true };

    setInput("");
    setMsgs(p => [...p, userMsg, aiMsg]);
    setLoading(true);

    const history = msgs
      .filter(m => m.text && !m.loading && (m.role === "user" || m.role === "assistant"))
      .slice(-8)
      .map(m => ({ role: m.role, content: m.text }));

    try {
      const res = await chatApi.send({
        message: text,
        conversation_history: history,
      });

      const reply = res.data?.response;
      if (!reply) throw new Error("Empty response received from AI coach");

      setMsgs(p => p.map(m => m.id === aiId ? { ...m, text: reply, loading: false } : m));

      if (reply.toLowerCase().includes("update your plan")) {
        setTimeout(() => setPlan(true), 700);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to reach AI service";
      setError(msg);
      setMsgs(p => p.map(m => m.id === aiId ? { ...m, text: `Sorry, I ran into an issue: ${msg}\nPlease try again.`, loading: false } : m));
    }

    setLoading(false);
    setTimeout(() => taRef.current?.focus(), 50);
  };

  const confirmUpdate = async () => {
    setPlan(false); 
    setPlanDone(true);
    setTimeout(() => setPlanDone(false), 3000);
    try {
      await chatApi.adjustPlan({ reason: "User requested plan update via AROMI", duration_days: 3 });
      setMsgs(p => [...p, {
        id: uid(), role: "assistant", time: now(),
        text: "✅ Routine adapted! Your updated schedule is now active under Workouts & Nutrition."
      }]);
    } catch {
      setMsgs(p => [...p, {
        id: uid(), role: "assistant", time: now(),
        text: "I've noted your preferences for your next plan generation! 💪"
      }]);
    }
  };

  return (
    <div className="h-full min-h-[calc(100vh-60px)] lg:h-screen flex flex-col bg-[#002126] text-[#f0f2f3] overflow-hidden font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#003139] border-b border-[#1a474f] flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#5fe089] flex items-center justify-center text-[#002126] shadow-sm">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#f0f2f3]">AROMI AI Wellness Coach</span>
              <span className="text-[10px] bg-[#5fe089]/20 text-[#5fe089] border border-[#5fe089]/30 rounded-full px-2 py-0.5 font-bold">
                Online
              </span>
              {intent && (
                <span className="text-[10px] bg-[#083841] border border-[#1a474f] text-[#2dd4bf] rounded-full px-2 py-0.5 uppercase font-bold">
                  {intent.tag}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#96a5a8]">
              {loading ? "Generating evidence-based guidance..." : "Powered by Groq High-Speed LLM"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {planDone && (
            <span className="text-xs text-[#5fe089] bg-[#5fe089]/15 border border-[#5fe089]/30 px-3 py-1 rounded-full font-bold">
              Plan Adapted
            </span>
          )}
          <button 
            onClick={() => {
              setLoading(false);
              setIntent(null);
              setPlan(false);
              setError("");
              setMsgs([{ id: uid(), role: "assistant", time: now(), text: "Fresh start! What would you like guidance on today?" }]);
            }}
            className="btn btn-secondary text-xs py-1.5 px-4 rounded-full flex items-center gap-1.5"
            title="Start New Session"
          >
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="px-6 py-2 bg-[#f87171]/15 border-b border-[#f87171]/30 text-xs text-[#f87171] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold text-sm">×</button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {msgs.map(m => <Bubble key={m.id} m={m} />)}

          {/* Quick Scenario Buttons */}
          {msgs.length === 1 && !loading && (
            <div className="mt-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#96a5a8] mb-3 block">
                Quick Discussion Scenarios
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {QUICK_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => send(p.text)}
                    className="p-3.5 rounded-2xl bg-[#003139] border border-[#1a474f] hover:border-[#5fe089] hover:bg-[#083841] transition-all text-left text-xs text-[#96a5a8] hover:text-white shadow-sm"
                  >
                    <div className="font-bold text-white mb-0.5">{p.label}</div>
                    <div className="line-clamp-2 text-[11px] text-[#657a7e]">{p.text}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-[#003139] border-t border-[#1a474f] flex-shrink-0 shadow-md">
        <div className="max-w-3xl mx-auto flex gap-3 items-center">
          <textarea
            ref={taRef}
            value={input}
            rows={1}
            disabled={loading}
            placeholder="Ask about exercises, Indian meal swaps, soreness, or form advice..."
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1 bg-[#083841] border border-[#1a474f] rounded-full px-5 py-3 text-sm text-[#f0f2f3] placeholder-[#657a7e] resize-none focus:outline-none focus:border-[#5fe089]"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="btn btn-primary h-11 w-11 p-0 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Plan Adjustment Modal */}
      {planModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#003139] border border-[#1a474f] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#5fe089]/20 text-[#5fe089] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Update Your Routine?</h3>
            <p className="text-xs text-[#96a5a8] mb-6 leading-relaxed">
              AROMI wants to dynamically adapt your workouts and nutrition to reflect your latest check-in.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPlan(false)}
                className="btn btn-secondary flex-1 text-xs py-2.5 rounded-full"
              >
                Not Now
              </button>
              <button
                onClick={confirmUpdate}
                className="btn btn-primary flex-1 text-xs py-2.5 rounded-full font-bold"
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
