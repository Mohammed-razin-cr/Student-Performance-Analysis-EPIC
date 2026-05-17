"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PerformanceChart } from "@/components/performance-chart"
import { AttendanceChart } from "@/components/attendance-chart"
import { MessageSquare, Video, Loader2, Zap, Brain, Sparkles, LineChart } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { getStudentMarks, getStudentProfile, getFriendsList } from "@/lib/firestore"
import type { StudentMarks, StudentProfile, Friend } from "@/types/firestore"
import Link from "next/link"
import { useRouter } from "next/navigation"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 100 },
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { userData, loading: userLoading } = useUserData()
  const [isLoading, setIsLoading] = useState(true)
  const [studentMarks, setStudentMarks] = useState<StudentMarks | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])

  useEffect(() => {
    if (userData?.role === "admin") {
      router.replace("/admin")
      return
    }
  }, [userData, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [marks, profile, friendsList] = await Promise.all([
          getStudentMarks(user.uid),
          getStudentProfile(user.uid),
          getFriendsList(user.uid)
        ])
        setStudentMarks(marks)
        setStudentProfile(profile)
        setFriends(friendsList)
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

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-primary" />
        </motion.div>
      </div>
    )
  }

  const displayName = userData?.name || "Student"
  const school = userData?.school || "East Point College of Higher Education"
  const photoURL = userData?.photoURL || ""
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "S"

  const areasOfInterest = studentProfile?.areasOfInterest || {}

  const traits = studentProfile?.traits || {
    conscientiousness: 75,
    openness: 60,
    agreeableness: 80
  }

  const socialContacts = friends.length > 0
    ? friends.map(friend => ({
      name: friend.friendName,
      initial: friend.friendName.charAt(0).toUpperCase()
    }))
    : [
      { name: "Dev Team", initial: "D" },
      { name: "AI Mentor", initial: "A" },
    ]

    return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 left-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">Student dashboard</Badge>
            <h1 className="text-3xl font-black text-foreground sm:text-4xl">
              Welcome back, {displayName.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Your academic overview, progress, and next useful actions in one organized place.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 text-center min-[420px]:grid-cols-3">
            {[
              ["Friends", friends.length],
              ["Interests", Object.keys(areasOfInterest).length],
              ["Focus", `${traits.conscientiousness}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Student Profile Card */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            {/* Profile Header */}
            <div className="border-b border-border bg-primary/10 p-6 text-foreground">
              <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
              <p className="text-sm opacity-80 mt-1">{school}</p>
            </div>

            <CardContent className="p-6 space-y-8">
              {/* Student Photo & Info */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Avatar className="w-32 h-32 rounded-full border-4 border-background shadow-md">
                    {photoURL && <AvatarImage src={photoURL} alt={displayName} className="object-cover" />}
                    <AvatarFallback className="bg-muted text-4xl font-bold text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  {userData?.parentInfo?.mother && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <span className="block font-semibold text-muted-foreground uppercase tracking-tight mb-1">Mother</span>
                      <span className="font-bold text-foreground truncate">{userData.parentInfo.mother}</span>
                    </div>
                  )}
                  {userData?.parentInfo?.father && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <span className="block font-semibold text-muted-foreground uppercase tracking-tight mb-1">Father</span>
                      <span className="font-bold text-foreground truncate">{userData.parentInfo.father}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Profile Button */}
              <Button
                asChild
                variant="outline"
                className="w-full font-semibold"
              >
                <Link href="/dashboard/my-profile">View Full Profile</Link>
              </Button>

              {/* Areas of Interest */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Areas of Interest
                </h3>
                <div className="space-y-4">
                  {Object.keys(areasOfInterest).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No areas of interest set. Edit your profile to add some!</p>
                  ) : (
                    Object.entries(areasOfInterest).map(([label, value]) => (
                      <div key={label} className="space-y-1.5">
                        <div className="flex justify-between text-xs px-0.5">
                          <span className="font-medium text-foreground capitalize">{label}</span>
                          <span className="font-semibold text-muted-foreground">{value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Middle Column - Profile Info & Charts */}
        <div className="lg:col-span-1 space-y-6">
          {/* Growth Mindset Assessment */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl font-bold">Growth Mindset</CardTitle>
                <Link href="/dashboard/traits" className="text-primary text-xs font-semibold hover:underline">
                  Detailed Analysis →
                </Link>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-2">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      className="text-primary"
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (traits.conscientiousness * 2.64) }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-foreground">{traits.conscientiousness}%</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm font-bold text-foreground">Active Engagement</p>
                  <p className="text-xs text-muted-foreground mt-1">Consistency & Discipline Level</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Social Network */}
          <motion.div variants={itemVariants}>
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Friends</CardTitle>
                  <Link href="/dashboard/social-contacts" className="text-primary text-xs font-semibold hover:underline">
                    Manage Network
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 justify-center">
                  {socialContacts.slice(0, 4).map((contact, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <Avatar className="h-12 w-12 border border-border shadow-sm">
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                          {contact.initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase text-center w-16 truncate">
                        {contact.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Recommendations */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Smart Recommendations
            </h3>

            {/* Academic Growth */}
            <Card className="border-border border-l-4 border-l-primary bg-card shadow-sm transition-all hover:-translate-y-1">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Academic Focus Area</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">Based on recent patterns, joining the Digital Design workshop could boost your technical proficiency.</p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Insight */}
            <Card className="border-border border-l-4 border-l-primary bg-card shadow-sm transition-all hover:-translate-y-1">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <LineChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Efficiency Insight</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">Your engagement peaks during technical sessions. Maintain this momentum for upcoming projects.</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements Section */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Recent Milestone</h3>
              <Card className="overflow-hidden border-border bg-card shadow-sm">
                <div className="h-1 w-full bg-primary/20" />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-foreground">Technical Milestone</h4>
                    <Badge variant="secondary" className="text-[10px] font-bold">LVL 4</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Successfully completed all core laboratory challenges this month.</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Link href="/dashboard/study-planner">
                <Button variant="outline" className="font-bold w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mentor Chat
                </Button>
              </Link>
              <Button
                className="font-bold"
                onClick={() => window.open("https://meet.google.com/new", "_blank")}
              >
                <Video className="h-4 w-4 mr-2" />
                Join Session
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Attendance Participation</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceChart />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Academic Growth Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceChart />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
