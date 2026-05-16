"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getStudentProfile } from "@/lib/firestore"
import type { StudentProfile } from "@/types/firestore"
import Link from "next/link"

export default function TraitsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        const profile = await getStudentProfile(user.uid)
        setStudentProfile(profile)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const traits = studentProfile?.traits || {
    conscientiousness: 75,
    openness: 60,
    agreeableness: 80,
    extraversion: 65,
    neuroticism: 45
  }

  const traitDescriptions = {
    conscientiousness: {
      name: "Conscientiousness",
      description: "The tendency to be organized, responsible, and hardworking.",
      color: "from-teal-500 to-cyan-500"
    },
    openness: {
      name: "Openness",
      description: "The tendency to be creative, curious, and open to new experiences.",
      color: "from-purple-500 to-pink-500"
    },
    agreeableness: {
      name: "Agreeableness",
      description: "The tendency to be cooperative, helpful, and empathetic.",
      color: "from-green-500 to-emerald-500"
    },
    extraversion: {
      name: "Extraversion",
      description: "The tendency to be outgoing, energetic, and sociable.",
      color: "from-orange-500 to-yellow-500"
    },
    neuroticism: {
      name: "Neuroticism",
      description: "The tendency to experience negative emotions like anxiety and stress.",
      color: "from-red-500 to-rose-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="border-primary text-primary hover:bg-primary hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Traits of Character</h1>
          <p className="text-gray-400">Full personality map based on psychological assessment</p>
        </div>
      </div>

      {/* Main Trait Circle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-xl text-white text-center">Personality Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-8">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(20, 184, 166, 0.2)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${traits.conscientiousness * 2.83} 283`}
                    initial={{ strokeDasharray: "0 283" }}
                    animate={{ strokeDasharray: `${traits.conscientiousness * 2.83} 283` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold text-primary">C</span>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-300 mb-2">
              Primary trait: <span className="text-primary font-semibold">Conscientiousness</span>
            </p>
            <p className="text-center text-gray-400 text-sm">
              You demonstrate high levels of organization, responsibility, and self-discipline.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* All Traits */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(traits).map(([key, value], index) => {
          const traitInfo = traitDescriptions[key as keyof typeof traitDescriptions]
          if (!traitInfo) return null
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">{traitInfo.name}</h3>
                    <span className="text-2xl font-bold text-primary">{value}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <motion.div
                      className={`h-3 rounded-full bg-gradient-to-r ${traitInfo.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{traitInfo.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Interpretation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Interpretation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              Based on the personality assessment, this student shows a strong tendency towards 
              conscientiousness, indicating good organizational skills and a responsible attitude 
              towards studies and commitments.
            </p>
            <p className="text-gray-300">
              The combination of high agreeableness and moderate openness suggests a collaborative 
              nature with receptiveness to new ideas and learning approaches.
            </p>
            <div className="pt-4">
              <h4 className="font-semibold text-white mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li>Leverage organizational skills for project-based learning</li>
                <li>Encourage leadership roles in group activities</li>
                <li>Provide structured environments for optimal performance</li>
                <li>Support creative exploration to enhance openness</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
