"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { 
  Sparkles, X, Send, User, Bot, Loader2, Maximize2, Minimize2, 
  Trash2, MessageSquare, ChevronDown, History, Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useUserData } from "@/hooks/useFirestore"
import { useAuth } from "@/contexts/AuthContext"

export interface AIChatAssistantProps {
  initialOpen?: boolean;
}

export function AIChatAssistant({ initialOpen = false }: AIChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { userData } = useUserData()
  const role = userData?.role || 'student'
  const userId = user?.uid || ''
  
  const [contextData, setContextData] = useState<any[]>([])
  const [contextLoaded, setContextLoaded] = useState(false)
  const contextRef = useRef<any[]>([])

  useEffect(() => {
    if (!isOpen || !userId) return;
    setContextLoaded(false);
    const loadContext = async () => {
      try {
        const { getAllStudents, getAllStudentMarks, getStudentMarks } = await import("@/lib/firestore");
        
        let ctx: any[] = [];
        if (role === 'admin' || role === 'faculty') {
          const students = await getAllStudents();
          const marks = await getAllStudentMarks();
          ctx = students.slice(0, 100).map(s => ({
            name: s.name, dept: s.department, usn: s.usn,
            attendance: marks.find(m => m.userId === s.id)?.attendancePercentage || 0,
            gpa: marks.find(m => m.userId === s.id)?.totalPercentage || 0
          }));
        } else if (userData) {
          const myMarks = await getStudentMarks(userId);
          ctx = [{
            name: userData.name,
            dept: userData.department,
            usn: userData.usn,
            semester: userData.semester,
            overall_attendance: myMarks?.attendancePercentage ?? 'not recorded',
            overall_marks: myMarks?.totalPercentage ?? 'not recorded',
            subjects: myMarks?.subjects?.map(s => ({
              name: s.subjectName,
              code: s.subjectCode,
              attendance_pct: s.attendancePercentage ?? 'N/A',
              internal1: s.internal1?.obtained ?? 'N/A',
              internal2: s.internal2?.obtained ?? 'N/A',
              semester_exam: s.semester?.obtained ?? 'N/A',
              total: s.finalTotal ?? s.percentage ?? 'N/A',
              grade: s.grade ?? 'N/A'
            })) ?? []
          }];
        }
        setContextData(ctx);
        contextRef.current = ctx;
      } catch (e) {
        console.error("Context load error:", e);
      } finally {
        setContextLoaded(true);
      }
    };
    loadContext();
  }, [isOpen, userId, role, userData]);
  
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ role, userId, contextData: contextRef.current }),
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const isReady = contextLoaded && !!userId

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !isReady) return
    sendMessage({ text: input })
    setInput('')
  }


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const clearChat = () => {
    setMessages([])
  }

  const suggestions = role === 'student' 
    ? [
        "Show my attendance",
        "What is my current GPA?",
        "Am I at risk in any subject?",
        "How can I improve my scores?"
      ]
    : [
        "Who has attendance below 75%?",
        "Top performing students",
        "Department performance summary",
        "Identify at-risk students"
      ]

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "pointer-events-auto flex flex-col shadow-2xl transition-all duration-300",
              isExpanded 
                ? "w-[90vw] h-[80vh] md:w-[600px] md:h-[700px]" 
                : "w-[85vw] h-[60vh] md:w-[400px] md:h-[550px]"
            )}
          >
            <Card className="flex flex-col h-full border-primary/20 bg-card/95 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/20 ring-1 ring-primary/30">
              <CardHeader className="p-4 border-b border-border/50 bg-primary/5 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/20 text-primary animate-pulse">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      EPIC AI Co-pilot
                      <Badge variant="outline" className="text-[10px] h-4 px-1 lowercase font-normal border-primary/20 bg-primary/10 text-primary">
                        beta
                      </Badge>
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none mt-1">
                      <span className="w-1 h-1 rounded-full bg-green-500" />
                      Connected to academic database
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-full" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="space-y-4 py-4">
                        <div className="text-center space-y-2 mb-6">
                          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                            <Bot className="h-6 w-6" />
                          </div>
                          <h3 className="text-sm font-semibold">Welcome, {role === 'admin' ? 'Administrator' : role === 'faculty' ? 'Faculty' : 'Student'}</h3>
                          <p className="text-xs text-muted-foreground px-4">
                            {role === 'student' 
                              ? "Ask me about your attendance, grades, or for study advice."
                              : "Ask me anything about student performance, attendance, or alerts."}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setInput('');
                                sendMessage({ text: s });
                              }}
                              className="text-left text-xs p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary group flex items-center gap-2"
                            >
                              <MessageSquare className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((m: any) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-3",
                          m.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div className={cn(
                          "mt-1 shrink-0 rounded-lg p-1.5",
                          m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card border border-border shadow-sm"
                        )}>
                          {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3 text-primary" />}
                        </div>
                        <div className={cn(
                          "flex flex-col gap-1 max-w-[85%]",
                          m.role === 'user' ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "rounded-2xl p-3 text-sm shadow-sm",
                            m.role === 'user' 
                              ? "bg-primary text-primary-foreground rounded-tr-none" 
                              : "bg-muted/50 border border-border/50 rounded-tl-none prose prose-p:leading-relaxed prose-sm dark:prose-invert"
                          )}>
                            {m.content || m.parts?.map((p: any, i: number) => p.type === 'text' ? p.text : null)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="mt-1 shrink-0 rounded-lg p-1.5 bg-card border border-border shadow-sm">
                          <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        </div>
                        <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-none p-3 shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                          </div>
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center">
                        Sorry, the AI engine is temporarily unavailable. 
                        <Button variant="link" size="sm" className="h-4 p-0 ml-2 text-destructive font-bold underline" onClick={() => clearChat()}>
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 border-t border-border/50 bg-background/50 flex flex-col gap-2 shrink-0">
                <div className="flex items-center gap-2 w-full">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 shrink-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-colors" 
                    onClick={clearChat}
                    title="Clear history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder={!isReady ? 'Loading your data...' : 'Ask me anything...'}
                      className="h-10 rounded-xl bg-background border-border/50 border-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 text-xs"
                      disabled={isLoading || !isReady}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-10 w-10 shrink-0 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95" 
                      disabled={isLoading || !input.trim() || !isReady}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
                <div className="w-full flex items-center justify-center gap-4 text-[9px] uppercase tracking-tighter text-muted-foreground/50">
                   <div className="flex items-center gap-1"><History className="h-2 w-2" /> Session Secure</div>
                   <div className="flex items-center gap-1"><Shield className="h-2 w-2" /> Data Encrypted</div>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="pointer-events-auto h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center relative group overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Assistant"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <ChevronDown className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center justify-center"
              >
                <Sparkles className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isOpen && (
          <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping opacity-20 pointer-events-none" />
        )}
      </motion.button>
    </div>
  )
}
