"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Award, BookOpen, Sparkles, Target, Trophy, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { getFriendsList, getStudentMarks, getStudentProfile } from "@/lib/firestore"
import { calculateUserBadges } from "@/lib/badges"
import { BADGE_DEFINITIONS } from "@/types/badges"
import type { Badge as BadgeType, BadgeDefinition } from "@/types/badges"

type BadgeWithEarned = BadgeDefinition & {
  earnedLevel: BadgeType["level"] | null
  earned: boolean
}

const LEVEL_COLORS = {
  bronze: "from-orange-700 to-orange-400",
  silver: "from-slate-400 to-white",
  gold: "from-yellow-500 to-amber-200",
}

const LEVEL_TEXT_COLORS = {
  bronze: "text-orange-300",
  silver: "text-slate-200",
  gold: "text-yellow-300",
}

const CATEGORY_ICONS = {
  academic: BookOpen,
  social: Users,
  attendance: Target,
  prediction: TrendingUp,
  elite: Award,
}

export default function AchievementsPage() {
  const { user } = useAuth()
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [allBadges, setAllBadges] = useState<BadgeWithEarned[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) return
      try {
        const [marks, profile, friends] = await Promise.all([
          getStudentMarks(user.uid),
          getStudentProfile(user.uid),
          getFriendsList(user.uid),
        ])
        const earnedBadges = await calculateUserBadges(user.uid, marks, friends, profile)
        setBadges(earnedBadges)
        setAllBadges(BADGE_DEFINITIONS.map(def => {
          const earned = earnedBadges.find(b => b.id.startsWith(def.id))
          return { ...def, earnedLevel: earned?.level || null, earned: !!earned }
        }))
      } finally {
        setIsLoading(false)
      }
    }
    fetchBadges()
  }, [user])

  const filteredBadges = selectedCategory === "all"
    ? allBadges
    : allBadges.filter(badge => badge.category === selectedCategory)

  const earnedCount = badges.length
  const goldCount = badges.filter(badge => badge.level === "gold").length
  const silverCount = badges.filter(badge => badge.level === "silver").length
  const bronzeCount = badges.filter(badge => badge.level === "bronze").length
  const completion = allBadges.length ? Math.round((earnedCount / allBadges.length) * 100) : 0

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-fuchsia-400/15 bg-slate-950 p-6 shadow-2xl shadow-fuchsia-950/20"
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="absolute -bottom-20 left-24 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <Badge className="mb-3 border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100 hover:bg-fuchsia-300/10">Achievement constellation</Badge>
            <h1 className="bg-gradient-to-r from-white via-fuchsia-100 to-cyan-200 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
              Achievements
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Every badge is a signal of momentum. Track what you have earned, and what the next frontier asks of you.
            </p>
          </div>
          <div className="min-w-[260px] rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-slate-400">Collection progress</p>
                <p className="text-3xl font-bold text-white">{completion}%</p>
              </div>
              <Sparkles className="h-6 w-6 text-fuchsia-200" />
            </div>
            <Progress value={completion} className="mt-4 h-2" />
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total badges", value: earnedCount, icon: Trophy, tone: "text-cyan-200" },
          { label: "Gold", value: goldCount, icon: Award, tone: "text-yellow-300" },
          { label: "Silver", value: silverCount, icon: Award, tone: "text-slate-200" },
          { label: "Bronze", value: bronzeCount, icon: Award, tone: "text-orange-300" },
        ].map((item, index) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
            <Card className="border-white/10 bg-slate-950/70 backdrop-blur">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <item.icon className={`h-6 w-6 ${item.tone}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${item.tone}`}>{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70 p-1 backdrop-blur">
          {["all", "academic", "social", "attendance", "prediction", "elite"].map(value => (
            <TabsTrigger key={value} value={value} className="capitalize">{value}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredBadges.map((badge, index) => {
          const Icon = CATEGORY_ICONS[badge.category]
          const earnedLevel = badge.earnedLevel
          return (
            <motion.div key={badge.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card className={`group h-full overflow-hidden border-white/10 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 ${
                badge.earned ? "bg-slate-950/70" : "bg-slate-950/40 opacity-70"
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-4xl transition duration-300 group-hover:scale-110 ${badge.earned ? "" : "grayscale opacity-40"}`}>
                        {badge.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{badge.name}</CardTitle>
                        <CardDescription>{badge.description}</CardDescription>
                      </div>
                    </div>
                    <Icon className="h-5 w-5 text-slate-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    {(["bronze", "silver", "gold"] as const).map(level => {
                      const isEarned = earnedLevel === level
                        || (earnedLevel === "silver" && level === "bronze")
                        || (earnedLevel === "gold" && (level === "bronze" || level === "silver"))
                      return <div key={level} className={`h-2 flex-1 rounded-full ${isEarned ? `bg-gradient-to-r ${LEVEL_COLORS[level]}` : "bg-white/10"}`} />
                    })}
                  </div>
                  <div className="space-y-2 text-xs">
                    {earnedLevel ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Level earned</span>
                          <Badge className={`${LEVEL_TEXT_COLORS[earnedLevel]} border-current bg-transparent`}>
                            {earnedLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{badge.levels[earnedLevel].requirement}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-muted-foreground">Bronze requirement</p>
                        <p className="text-muted-foreground">{badge.levels.bronze.requirement}</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
