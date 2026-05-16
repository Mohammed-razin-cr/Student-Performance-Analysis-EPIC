"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useAuth } from "@/contexts/AuthContext"
import { getStudentActivityMarks } from "@/lib/firestore"

interface ActivityChartData {
  name: string
  value: number
}

export function AttendanceChart() {
  const { user } = useAuth()
  const [data, setData] = useState<ActivityChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivityMarks = async () => {
      if (!user) return

      try {
        setLoading(true)
        const activityData = await getStudentActivityMarks(user.uid)

        if (activityData?.marks) {
          // Normalize Firestore keys to expected chart keys
          const marks = activityData.marks as any
          const chartData: ActivityChartData[] = [
            { name: "Sports", value: marks.sports ?? marks.Sports ?? 0 },
            { name: "Cultural", value: marks.cultural ?? marks.Cultural ?? 0 },
            { name: "Technical", value: marks.technical ?? marks.Technical ?? 0 },
            { name: "Classroom", value: marks.classRoomActivity ?? marks.classroomActivity ?? marks.ClassRoomActivity ?? marks["ClassRoom Activity"] ?? marks["classRoom Activity"] ?? 0 },
            { name: "Events", value: marks.eventsCompetitions ?? marks.events ?? marks.Events ?? marks["Events/Competitions"] ?? 0 },
          ]
          setData(chartData)
        } else {
          setData([])
        }
      } catch (error) {
        console.error("Error fetching activity marks:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchActivityMarks()
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Participation</CardTitle>
          <CardDescription>Your participation scores across different activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Loading activity data...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Participation</CardTitle>
          <CardDescription>Your participation scores across different activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No activity marks recorded yet. Check back soon!
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Participation</CardTitle>
        <CardDescription>Your current participation scores in different activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full space-y-4">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#888"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#888"
                  fontSize={12}
                  domain={[0, 100]}
                  label={{ value: 'Score (0-100)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 20, 30, 0.95)",
                    border: "1px solid #6366f1",
                    borderRadius: "8px",
                    color: "#fff",
                    padding: "12px",
                  }}
                  formatter={(value: number) => [`${value}`, "Score"]}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#6366f1" animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Cards */}
          <div className="grid grid-cols-5 gap-2 text-sm">
            {data.map((item, index) => {
              const colorClass = [
                'bg-orange-500/10 border-orange-500/30 text-orange-400',
                'bg-purple-500/10 border-purple-500/30 text-purple-400',
                'bg-blue-500/10 border-blue-500/30 text-blue-400',
                'bg-green-500/10 border-green-500/30 text-green-400',
                'bg-pink-500/10 border-pink-500/30 text-pink-400',
              ]
              return (
                <div key={index} className={`p-3 rounded-lg border ${colorClass[index]}`}>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-lg font-bold mt-1">{item.value}%</p>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
