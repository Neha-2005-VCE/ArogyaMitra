import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import AROmiChat from './AROmiChat'

export default function GlobalChat({ children }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {children}

            {/* ═══ GLOBAL FLOATING AI COACH BUTTON ═══ */}
            {!isOpen && (
                <div className="fixed bottom-8 right-8 z-[100]">
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-[#BFFF00] text-[#06080C] px-6 py-4 rounded-[2rem] shadow-2xl shadow-[#BFFF00]/20 font-bold flex items-center gap-3 text-sm hover:shadow-[0_0_40px_rgba(191,255,0,0.4)] transition-all border border-[#BFFF00]/30"
                    >
                        <Bot className="w-5 h-5" />
                        <span className="hidden sm:inline">Coach AROMI</span>
                    </motion.button>
                </div>
            )}

            {/* ═══ FLOATING AI CHAT MODAL ═══ */}
            <AROmiChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
