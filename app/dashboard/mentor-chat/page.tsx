"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Cpu, 
  Zap, 
  Loader2,
  Maximize2,
  MoreVertical,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

type Message = {
  id: string
  role: "user" | "mentor"
  content: string
  timestamp: Date
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "mentor",
    content: "Greetings. I am your advanced AI Mentor. I have analyzed your recent academic and extracurricular performance metrics. How may I assist in optimizing your learning trajectory today?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5)
  }
]

export default function MentorChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "mentor",
        content: "Processing your request... Based on your current profile, I recommend focusing on advancing your technical skills. Would you like a personalized roadmap?",
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="relative min-h-[85vh] flex flex-col w-full bg-[#030712] overflow-hidden rounded-2xl border border-border shadow-2xl">
      {/* Futuristic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] bg-violet-600/15 blur-[150px] rounded-full mix-blend-screen" />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" style={{ backgroundSize: '40px' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#030712] shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                NEXUS <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">v2.4</span>
              </h2>
              <p className="text-xs text-gray-400 font-medium">Advanced Mentor AI</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex justify-center py-4">
          <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 flex items-center gap-2 backdrop-blur-md">
            <Zap className="h-3 w-3 text-amber-400" /> Secure Quantum Connection Established
          </div>
        </div>

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] lg:max-w-[70%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto ${
                  msg.role === "user" 
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_0_10px_rgba(139,92,246,0.3)]" 
                    : "bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                }`}>
                  {msg.role === "user" ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                </div>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl backdrop-blur-md border ${
                  msg.role === "user"
                    ? "bg-violet-600/20 border-violet-500/30 text-white rounded-br-sm"
                    : "bg-white/5 border-white/10 text-gray-100 rounded-bl-sm"
                }`}>
                  <p className="text-sm leading-relaxed tracking-wide">{msg.content}</p>
                  <p className={`text-[10px] mt-2 flex items-center gap-1 ${
                    msg.role === "user" ? "text-violet-300/70 justify-end" : "text-gray-500 justify-start"
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex w-full justify-start"
            >
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.3)] flex items-center justify-center mt-auto">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="p-4 rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-1.5 h-[52px]">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0 }} className="w-2 h-2 rounded-full bg-cyan-400" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className="w-2 h-2 rounded-full bg-cyan-400" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-4 bg-black/40 backdrop-blur-xl border-t border-white/10">
        <div className="relative flex items-center w-full max-w-4xl mx-auto group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Initialize query sequence..."
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-full pl-6 pr-14 py-6 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50 transition-all z-10"
          />
          
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="icon"
            className={`absolute right-2 z-20 rounded-full w-10 h-10 transition-all duration-300 ${
              input.trim() && !isTyping
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
          </Button>
        </div>
        <div className="text-center mt-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" /> Powered by Advanced Neural Networks
          </p>
        </div>
      </div>
    </div>
  )
}
