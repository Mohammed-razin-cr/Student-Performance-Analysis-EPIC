"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function EpicLoader({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          if (onComplete) {
            setTimeout(onComplete, 500)
          }
          return 100
        }
        // Use a more dynamic increment for a "natural" feel
        const diff = Math.random() * 5 + 1
        return Math.min(prev + diff, 100)
      })
    }, 40)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_70%)]" />

      <div className="relative flex flex-col items-center gap-12">
        {/* Animated logo container */}
        <motion.div
          className="relative w-32 h-32"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-[3px] border-primary/20 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner rotating ring (reverse) */}
          <motion.div
            className="absolute inset-4 rounded-full border-[2px] border-secondary/20 border-b-secondary"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Center logo text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-2xl font-black tracking-tighter text-primary"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              EPIC
            </motion.span>
          </div>
        </motion.div>

        {/* Progress section */}
        <div className="w-72 space-y-4">
          <div className="relative h-[6px] w-full rounded-full bg-muted overflow-hidden">
            {/* Progress bar */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          <div className="flex justify-between items-center px-1">
            <motion.span
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Initializing Systems
            </motion.span>
            <span className="text-sm font-mono font-bold text-primary">
              {Math.floor(progress)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
