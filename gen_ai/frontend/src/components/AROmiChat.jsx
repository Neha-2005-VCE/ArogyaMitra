import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Bot, User, Mic } from 'lucide-react'
import { aiCoachApi } from '../services/api'

export default function AROmiChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "🙏 Namaste! I'm AROMI, your personal health companion powered by ArogyaMitra! 💚\n\nTell me about your day, ask about your workouts and meals, or let me know if you're traveling — I'll help adjust your plans!\n\nHow can I assist you today? 💪",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Smart detection keywords
  const detectTravelOrInjury = (message) => {
    const lower = message.toLowerCase()
    if (/\b(travel|traveling|travelling|trip|vacation|holiday|going out)\b/.test(lower)) {
      return { reason: 'travel', duration_days: 3 }
    }
    if (/\b(injured|injury|pain|hurt|sprain|broke|broken)\b/.test(lower)) {
      return { reason: 'health_issue', duration_days: 5 }
    }
    return null
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!inputMessage.trim()) return

    const userMsg = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    const msgText = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

      const res = await aiCoachApi.send({
        message: msgText,
        conversation_history: conversationHistory
      })

      let content = res.data.response || 'Sorry, I could not process your request.';
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

      const botMsg = {
        id: Date.now() + 1,
        text: content,
        structured: structured,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])

      // Smart detection: auto-adjust plan for travel/injury
      const detected = detectTravelOrInjury(msgText)
      if (detected) {
        try {
          await aiCoachApi.adjustPlan(detected)
          const adjustMsg = {
            id: Date.now() + 2,
            text: `✅ I've automatically adjusted your workout plan for ${detected.reason === 'travel' ? 'your travel' : 'your health concern'} for the next ${detected.duration_days} days. Your plan is now lighter and more flexible! 💪`,
            sender: 'bot',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, adjustMsg])
        } catch {
          // Silently fail if no plan exists
        }
      }
    } catch (error) {
      console.error('AROMI error:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Namaste ji! 🙏 Having a small technical issue. Please make sure you are logged in and try again! 💚',
        sender: 'bot',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Voice input
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    setIsListening(true)
    recognition.start()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-24 right-6 w-96 h-[500px] z-50 rounded-2xl overflow-hidden bg-[#13131f] border border-[#2a2a40] shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="bg-[#0A0E18] border-b border-white/[0.04] p-4 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#BFFF00]/10 blur-3xl rounded-full" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#BFFF00]/15 to-transparent border border-[#BFFF00]/20 flex items-center justify-center text-[#BFFF00] relative shadow-lg shadow-[#BFFF00]/10">
            <Bot className="w-5 h-5" />
            <span className="absolute bottom-[-2px] right-[-2px] w-3 h-3 rounded-full bg-[#BFFF00] border-2 border-[#0A0E18]" />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-tight">AROMI</h3>
            <p className="text-[#6B7A90] text-[10px] font-bold uppercase tracking-widest mt-0.5">Online • Adaptive</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[#6B7A90] hover:text-white transition-colors p-1 relative z-10 glass rounded-full hover:scale-105 active:scale-95">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0E18] scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex items-end gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.sender === 'bot'
              ? 'bg-gradient-to-br from-[#BFFF00]/20 to-[#BFFF00]/5 border border-[#BFFF00]/20 text-[#BFFF00]'
              : 'bg-white/[0.03] border border-white/[0.06] text-[#6B7A90]'
              }`}>
              {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-4 rounded-2xl text-[13px] leading-relaxed transition-all ${msg.sender === 'bot'
                  ? 'bg-[#151B2B] text-gray-200 rounded-bl-sm border border-white/[0.04]'
                  : 'bg-gradient-to-br from-[#BFFF00]/90 to-[#7CFC00]/80 text-[#0A0E18] font-semibold rounded-br-sm border border-[#BFFF00]/20 shadow-[0_4px_15px_rgba(191,255,0,0.15)]'
                }`}>
                {msg.structured ? (
                  <div className="space-y-4 text-left">
                    {msg.structured.daily_motivation && (
                      <div className="relative">
                        <p className="text-sm font-bold text-[#BFFF00] italic">
                          "{msg.structured.daily_motivation}"
                        </p>
                      </div>
                    )}

                    {msg.structured.workout_plan && (
                      <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BFFF00] mb-3 flex items-center gap-2">
                          Drill Sequence
                        </h4>
                        <div className="space-y-2">
                          {msg.structured.workout_plan.map((ex, idx) => {
                            let ytVideoId = null;
                            if (ex.video_url) {
                              try {
                                const url = new URL(ex.video_url);
                                ytVideoId = url.searchParams.get('v') || url.pathname.split('/').pop();
                              } catch { }
                            }
                            return (
                              <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg bg-[#0A0E18]/50 border border-white/[0.04]">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-[#6B7A90] mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <p className="font-bold text-white text-xs">{ex.exercise_name}</p>
                                    </div>
                                  </div>
                                  <div className="px-2 py-0.5 rounded text-[9px] text-[#BFFF00] font-bold uppercase bg-[#BFFF00]/10 whitespace-nowrap ml-2">
                                    {ex.sets_reps}
                                  </div>
                                </div>

                                {ytVideoId ? (
                                  <a href={ex.video_url} target="_blank" rel="noopener noreferrer" className="mt-1 ml-7 block relative rounded-lg overflow-hidden border border-white/[0.06] group/yt">
                                    <img src={`https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`} alt="tutorial" className="w-full h-24 object-cover opacity-60 group-hover/yt:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg group-hover/yt:scale-110 transition-transform">
                                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                                      </div>
                                    </div>
                                  </a>
                                ) : ex.video_url ? (
                                  <a href={ex.video_url} target="_blank" rel="noopener noreferrer" className="ml-7 text-[10px] text-[#BFFF00] hover:underline">Watch Tutorial</a>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {msg.structured.nutrition_suggestion && (
                      <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Metabolic Fuel</h4>
                        <p className="text-xs text-gray-300">{msg.structured.nutrition_suggestion}</p>
                      </div>
                    )}

                    {msg.structured.aromi_advice && (
                      <div className="bg-[#BFFF00]/10 p-3 rounded-xl border-l-2 border-[#BFFF00]">
                        <p className="text-white text-xs font-medium italic">{msg.structured.aromi_advice}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
              </div>
              <p className={`text-[9px] font-bold mt-1.5 uppercase tracking-widest ${msg.sender === 'user' ? 'text-[#BFFF00]/40 mr-1' : 'text-[#3D4A5C] ml-1'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.sender === 'bot' ? 'AROMI' : 'YOU'}
              </p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#BFFF00]/20 to-[#BFFF00]/5 border border-[#BFFF00]/20 flex items-center justify-center text-[#BFFF00]">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#151B2B] p-4 rounded-2xl rounded-bl-sm border border-white/[0.04]">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-[#BFFF00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#BFFF00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#BFFF00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-[#0A0E18] border-t border-white/[0.04] flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`p-3 rounded-xl transition flex-shrink-0 flex items-center justify-center ${isListening
            ? 'bg-red-500/20 text-red-500 border border-red-500/30'
            : 'bg-white/[0.03] text-[#6B7A90] hover:text-white border border-white/[0.06] hover:border-white/10'
            }`}
        >
          <Mic className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask AROMI anything... 💬"
          className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-[13px] placeholder-[#3D4A5C] focus:outline-none focus:border-[#BFFF00]/30 focus:bg-white/[0.04] transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="p-3 bg-[#BFFF00] hover:bg-[#a6ec00] text-[#0A0E18] rounded-xl transition disabled:opacity-50 flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#BFFF00]/10 hover:shadow-[#BFFF00]/25 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:shadow-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  )
}
