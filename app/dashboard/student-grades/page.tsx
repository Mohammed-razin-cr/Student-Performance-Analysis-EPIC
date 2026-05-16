"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Users, GraduationCap, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useUserData } from "@/hooks/useFirestore"
import { getAllStudentMarks } from "@/lib/firestore"
import type { StudentMarks } from "@/types/firestore"

interface StudentData {
  name: string
  email: string
  studentId: string
  grade?: string
  percentage?: number
  attendance?: number
}

export default function StudentGradesPage() {
  const { userData } = useUserData()
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchStudentGrades = async () => {
      try {
        setLoading(true)

        // Fetch student data from data.txt via API
        const response = await fetch('/api/students-data')
        const data = await response.json()

        if (!data.success) {
          console.error('Failed to fetch student data')
          return
        }

        // Fetch marks data
        const marksData = await getAllStudentMarks()
        const marksMap = new Map<string, StudentMarks>()
        marksData.forEach(mark => marksMap.set(mark.studentId, mark))

        // Combine student data with marks
        const studentsWithGrades: StudentData[] = data.students.map((student: any) => {
          const marks = marksMap.get(student.studentId)

          let grade = 'N/A'
          let percentage = 0
          let attendance = 0

          if (marks?.subjects && marks.subjects.length > 0) {
            percentage = marks.totalPercentage || 0
            attendance = marks.attendancePercentage || 0

            // Calculate grade based on percentage
            if (percentage >= 90) grade = 'A+'
            else if (percentage >= 80) grade = 'A'
            else if (percentage >= 70) grade = 'B+'
            else if (percentage >= 60) grade = 'B'
            else if (percentage >= 50) grade = 'C+'
            else if (percentage >= 40) grade = 'C'
            else if (percentage >= 35) grade = 'D'
            else grade = 'F'
          }

          return {
            ...student,
            grade,
            percentage,
            attendance
          }
        })

        setStudents(studentsWithGrades)
      } catch (error) {
        console.error('Error fetching student grades:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userData?.role === 'admin') {
      fetchStudentGrades()
    }
  }, [userData])

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-500'
      case 'B+':
      case 'B':
        return 'bg-blue-500'
      case 'C+':
      case 'C':
        return 'bg-yellow-500'
      case 'D':
        return 'bg-orange-500'
      case 'F':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen p-4 sm:p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Student Grades
          </h1>
          <p className="text-muted-foreground mt-1">
            View grades for all students based on their academic performance
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, email, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grades Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Student Grade Report
              </CardTitle>
              <CardDescription>
                Grades calculated based on academic marks and attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge className={`${getGradeColor(student.grade || 'N/A')} text-white`}>
                          {student.grade || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.percentage ? `${student.percentage.toFixed(1)}%` : 'N/A'}</TableCell>
                      <TableCell>{student.attendance ? `${student.attendance.toFixed(1)}%` : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students found matching your search.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  )
}