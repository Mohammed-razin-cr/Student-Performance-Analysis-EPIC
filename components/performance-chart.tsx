"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Example performance data for Semester 1 subjects
const data = [
  { month: "Jan", attendance: 92, marks: 85, skills: 80 },
  { month: "Feb", attendance: 88, marks: 82, skills: 78 },
  { month: "Mar", attendance: 85, marks: 80, skills: 76 },
  { month: "Apr", attendance: 90, marks: 87, skills: 82 },
  { month: "May", attendance: 87, marks: 84, skills: 79 },
  { month: "Jun", attendance: 82, marks: 80, skills: 75 },
]

export function PerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
        <CardDescription>Monthly attendance, marks, and skills progression</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMarks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSkills" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffc658" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ffc658" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="month" stroke="#8884d8" fontSize={12} />
              <YAxis stroke="#8884d8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #8884d8",
                  borderRadius: "8px",
                  color: "#222",
                }}
              />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorAttendance)"
              />
              <Area
                type="monotone"
                dataKey="marks"
                stroke="#82ca9d"
                fillOpacity={1}
                fill="url(#colorMarks)"
              />
              <Area
                type="monotone"
                dataKey="skills"
                stroke="#ffc658"
                fillOpacity={1}
                fill="url(#colorSkills)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
