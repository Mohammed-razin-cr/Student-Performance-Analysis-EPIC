"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Award, Target, Users, BookOpen, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { getStudentMarks, getStudentProfile, getFriendsList } from "@/lib/firestore"
import { calculateUserBadges, getBadgeProgress } from "@/lib/badges"
import { BADGE_DEFINITIONS } from "@/types/badges"
import type { Badge as BadgeType, BadgeDefinition } from "@/types/badges"
import type { StudentMarks, StudentProfile, Friend } from "@/types/firestore"

type BadgeWithEarned = BadgeDefinition & {
  earnedLevel: BadgeType['level'] | null
  earned: boolean
}

const LEVEL_COLORS = {
  bronze: 'from-orange-700 to-orange-500',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-300',
}

const LEVEL_TEXT_COLORS = {
  bronze: 'text-orange-400',
  silver: 'text-gray-300',
  gold: 'text-yellow-400',
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

        // Create all possible badges with earned status
        const all = BADGE_DEFINITIONS.map(def => {
          const earned = earnedBadges.find(b => b.id.startsWith(def.id))
          return {
            ...def,
            earnedLevel: earned?.level || null,
            earned: !!earned,
          }
        })
        setAllBadges(all)
      } catch (err) {
        console.error("Error fetching badges:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBadges()
  }, [user])

  const filteredBadges = selectedCategory === 'all' 
    ? allBadges 
    : allBadges.filter(b => b.category === selectedCategory)

  const earnedCount = badges.length
  const goldCount = badges.filter(b => b.level === 'gold').length
  const silverCount = badges.filter(b => b.level === 'silver').length
  const bronzeCount = badges.filter(b => b.level === 'bronze').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center sm:items-center gap-4"
      >
        <Link href="/dashboard">
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Go back to dashboard">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Achievements
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track your badges and accomplishments</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-lg bg-card dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{earnedCount}</p>
                <p className="text-sm text-muted-foreground">Total Badges</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg bg-card dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full bg-gradient-to-br ${LEVEL_COLORS.gold}`}>
                <Award className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{goldCount}</p>
                <p className="text-sm text-muted-foreground">Gold Badges</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-card dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full bg-gradient-to-br ${LEVEL_COLORS.silver}`}>
                <Award className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{silverCount}</p>
                <p className="text-sm text-muted-foreground">Silver Badges</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-card dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full bg-gradient-to-br ${LEVEL_COLORS.bronze}`}>
                <Award className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{bronzeCount}</p>
                <p className="text-sm text-muted-foreground">Bronze Badges</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="bg-muted dark:bg-slate-800 w-full justify-start overflow-x-auto no-scrollbar flex-nowrap h-auto p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="prediction">Prediction</TabsTrigger>
          <TabsTrigger value="elite">Elite</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Badges Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBadges.map((badge, index) => {
          const Icon = CATEGORY_ICONS[badge.category]
          const earnedLevel = badge.earnedLevel

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`border-0 shadow-lg ${badge.earned ? 'bg-card dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800' : 'bg-muted/50 dark:bg-slate-900/50 opacity-60'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-4xl ${badge.earned ? '' : 'grayscale opacity-40'}`}>
                        {badge.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground dark:text-white">{badge.name}</CardTitle>
                        <CardDescription>{badge.description}</CardDescription>
                      </div>
                    </div>
                    <Icon className="h-5 w-5 text-gray-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Level badges */}
                  <div className="flex gap-2">
                    {['bronze', 'silver', 'gold'].map((level) => {
                      const isEarned = earnedLevel === level || 
                        (earnedLevel === 'silver' && level === 'bronze') ||
                        (earnedLevel === 'gold' && (level === 'bronze' || level === 'silver'))
                      
                      return (
                        <div
                          key={level}
                          className={`flex-1 h-2 rounded-full ${
                            isEarned
                              ? `bg-gradient-to-r ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      )
                    })}
                  </div>

                  {/* Requirements */}
                  <div className="space-y-1 text-xs">
                    {earnedLevel ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Level Earned:</span>
                          <Badge className={`${LEVEL_TEXT_COLORS[earnedLevel]} bg-transparent border-current`}>
                            {earnedLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{badge.levels[earnedLevel].requirement}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground font-semibold">Bronze Requirement:</p>
                        <p className="text-muted-foreground">{badge.levels.bronze.requirement}</p>
                      </>
                    )}
                  </div>

                  {/* Next level progress */}
                  {earnedLevel && earnedLevel !== 'gold' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Next: {earnedLevel === 'bronze' ? 'Silver' : 'Gold'}</span>
                        <span className="text-muted-foreground">0%</span>
                      </div>
                      <Progress value={0} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        {badge.levels[earnedLevel === 'bronze' ? 'silver' : 'gold'].requirement}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredBadges.length === 0 && (
        <Card className="border-0 shadow-lg bg-card dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">No badges in this category yet</h3>
            <p className="text-muted-foreground">Keep working hard to earn your first badge!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
