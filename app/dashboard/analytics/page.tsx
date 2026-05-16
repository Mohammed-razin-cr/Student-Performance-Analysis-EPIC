"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformanceChart } from "@/components/performance-chart"
import { GradeDistributionChart } from "@/components/grade-distribution-chart"
import { AttendanceChart } from "@/components/attendance-chart"
import { SkeletonChart } from "@/components/skeleton-card"
import { useUserData } from "@/hooks/useFirestore"
import { semesterSubjects } from "@/lib/semesterSubjects"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Calendar, TrendingUp, Sparkles, BarChart3 } from "lucide-react"

const skillsData = [
  { skill: "Communication", score: 85 },
  { skill: "Problem Solving", score: 78 },
  { skill: "Critical Thinking", score: 82 },
  { skill: "Teamwork", score: 90 },
  { skill: "Leadership", score: 75 },
  { skill: "Technical Skills", score: 88 },
]

const activityTrend = [
  { week: "W1", sports: 45, cultural: 30, technical: 55 },
  { week: "W2", sports: 52, cultural: 35, technical: 60 },
  { week: "W3", sports: 48, cultural: 42, technical: 58 },
  { week: "W4", sports: 55, cultural: 48, technical: 65 },
  { week: "W5", sports: 60, cultural: 52, technical: 70 },
  { week: "W6", sports: 58, cultural: 55, technical: 72 },
]

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const { userData, loading: userLoading } = useUserData()
  const semesterNum = parseInt(userData?.semester || "1")
  const subjects = semesterSubjects[semesterNum as keyof typeof semesterSubjects] || []

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (userLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }


  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Performance Analytics
        </h1>
        <p className="mt-1 text-muted-foreground">Comprehensive academic and behavioral insights for your current semester.</p>
      </motion.div>

      {/* Summary Cards */}
      {!isLoading && (
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Attendance</CardTitle>
                <div className="text-2xl font-bold">88%</div>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Average Marks</CardTitle>
                <div className="text-2xl font-bold">84 / 100</div>
              </div>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-secondary" />
              </div>
            </CardHeader>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Skill Growth</CardTitle>
                <div className="text-2xl font-bold">83%</div>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="rounded-xl bg-muted/60 p-1 shadow-inner">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8">
          {isLoading ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <SkeletonChart />
              <SkeletonChart />
            </div>
          ) : (
            <motion.div
              className="grid gap-6 lg:grid-cols-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Performance Trends and Grade Distribution */}
              <div>
                <Card className="shadow-xl rounded-2xl border-0">
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>Monthly attendance, marks, and skills progression for Semester {userData?.semester || "1"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PerformanceChart />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className="shadow-xl rounded-2xl border-0">
                  <GradeDistributionChart />
                </Card>
              </div>
            </motion.div>
          )}
          {/* Subject List for Current Semester */}
          <Card className="mt-6 shadow-md rounded-2xl border-0">
            <CardHeader>
              <CardTitle>Subjects for Semester {userData?.semester || "1"}</CardTitle>
              <CardDescription>All subjects and credits for your current semester</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {subjects.map((sub) => (
                  <li key={sub.code} className="flex justify-between border-b pb-1">
                    <span>{sub.title} <span className="text-xs text-muted-foreground">({sub.code})</span></span>
                    <span className="text-sm text-muted-foreground">Credits: {sub.credits}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AttendanceChart />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="skills">
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Skills Assessment</CardTitle>
                  <CardDescription>Average skill scores across all students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {skillsData.map((skill, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{skill.skill}</span>
                          <span className="text-muted-foreground">{skill.score}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.score}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-8">
          {/* Activity Trend Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Activity Trends</span>
                  <Sparkles className="h-4 w-4 text-primary" />
                </CardTitle>
                <CardDescription>Your participation in activities over recent weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityTrend} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="sports" stroke="#0e7490" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="cultural" stroke="#0369a1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="technical" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Summary Cards */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            {[
              { name: 'Sports', value: 85, icon: '🏆' },
              { name: 'Cultural', value: 90, icon: '🎭' },
              { name: 'Technical', value: 88, icon: '💻' },
              { name: 'Academic', value: 88, icon: '📚' },
              { name: 'Events', value: 95, icon: '🎉' },
            ].map((item, idx) => (
              <motion.div
                key={item.name}
                className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="font-semibold text-sm text-foreground">{item.name}</span>
                <span className="text-xl font-bold text-primary mt-1">{item.value}%</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Original Bar Chart for reference, but styled */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-indigo-900/60 to-blue-900/60 border-0 shadow-xl rounded-2xl mt-4">
              <CardHeader>
                <CardTitle className="text-indigo-200">Current Activity Participation</CardTitle>
                <CardDescription className="text-indigo-300">Your current participation scores in different activities</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceChart />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
