"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

// Example updated grade distribution for Semester 1
const data = [
  { name: "A Grade", value: 30, color: "#4caf50" },
  { name: "B Grade", value: 40, color: "#2196f3" },
  { name: "C Grade", value: 20, color: "#ff9800" },
  { name: "D Grade", value: 7, color: "#f44336" },
  { name: "F Grade", value: 3, color: "#9e9e9e" },
]

// Example student marks and attendance for grade calculation
const student = {
  attendance: 88, // percent
  marks: 84, // average marks
}

function getStudentGrade(attendance: number, marks: number): string {
  if (attendance >= 90 && marks >= 90) return "A Grade"
  if (attendance >= 80 && marks >= 80) return "B Grade"
  if (attendance >= 70 && marks >= 70) return "C Grade"
  if (attendance >= 60 && marks >= 60) return "D Grade"
  return "F Grade"
}

export function GradeDistributionChart() {
  const studentGrade = getStudentGrade(student.attendance, student.marks)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Distribution</CardTitle>
        <CardDescription>Overall grade distribution across students</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #8884d8",
                  borderRadius: "8px",
                  color: "#222",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <span className="font-semibold">Your Grade:</span> <span className="text-lg">{studentGrade}</span>
          <div className="text-muted-foreground text-sm mt-1">(Attendance: {student.attendance}%, Marks: {student.marks})</div>
        </div>
      </CardContent>
    </Card>
  )
}
