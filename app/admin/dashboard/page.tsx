"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Eye, LogOut } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { logOut } from "@/lib/auth"
import { getAllStudents, getAllStudentMarks } from "@/lib/firestore"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import type { User, StudentMarks } from "@/types/firestore"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminDashboard() {
  const router = useRouter()
  const [students, setStudents] = useState<User[]>([])
  const [marksData, setMarksData] = useState<Map<string, StudentMarks>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [studentsData, allMarks] = await Promise.all([
          getAllStudents(),
          getAllStudentMarks().catch(() => []),
        ])
        
        setStudents(studentsData)
        
        // Create map for quick access
        const marksMap = new Map()
        allMarks.forEach(mark => {
          marksMap.set(mark.userId, mark)
        })
        setMarksData(marksMap)
      } catch (error) {
        toast.error("Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await logOut()
      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      toast.error("Failed to logout")
    }
  }

  const downloadStudentReport = (student: User) => {
    const marks = marksData.get(student.id)
    
    let reportText = `STUDENT REPORT - EPIC SYSTEM\n`
    reportText += `${'='.repeat(50)}\n\n`
    reportText += `Student Name: ${student.name}\n`
    reportText += `Student ID: ${student.studentId}\n`
    reportText += `Email: ${student.email}\n`
    reportText += `Department: ${student.department}\n`
    reportText += `School: ${student.school}\n`
    reportText += `Age: ${student.age || 'N/A'}\n\n`
    
    if (marks) {
      reportText += `ACADEMIC PERFORMANCE\n`
      reportText += `${'='.repeat(50)}\n`
      reportText += `Total Marks: ${marks.totalMarks}\n`
      reportText += `Total Percentage: ${marks.totalPercentage.toFixed(2)}%\n`
      reportText += `Rank: ${marks.rank || 'N/A'}\n`
      reportText += `Attendance: ${marks.attendancePercentage.toFixed(2)}%\n\n`
      
      if (marks.exams.length > 0) {
        reportText += `EXAM DETAILS\n`
        reportText += `${'='.repeat(50)}\n`
        marks.exams.forEach(exam => {
          reportText += `\n${exam.examName} - ${exam.subject}\n`
          reportText += `  Marks: ${exam.marksObtained}/${exam.totalMarks}\n`
          reportText += `  Percentage: ${exam.percentage.toFixed(2)}%\n`
        })
      }
    }
    
    // Download as txt file
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText))
    element.setAttribute('download', `${student.name}_Report.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    toast.success(`Report downloaded for ${student.name}`)
  }

  const downloadAllReports = () => {
    students.forEach(student => {
      // Small delay to avoid multiple downloads at once
      setTimeout(() => downloadStudentReport(student), 100)
    })
    toast.success("Downloading all reports...")
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="mt-1 text-muted-foreground">View and manage all student records</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid gap-4 md:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Students with Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marksData.size}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marksData.size > 0
                  ? (
                      Array.from(marksData.values()).reduce((sum, m) => sum + m.totalPercentage, 0) /
                      marksData.size
                    ).toFixed(1)
                  : 'N/A'}
                %
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Download */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Input
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={downloadAllReports}>
            <Download className="mr-2 h-4 w-4" />
            Download All Reports
          </Button>
        </motion.div>

        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Student Records ({filteredStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const marks = marksData.get(student.id)
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-semibold">{student.name}</TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell className="text-sm">{student.email}</TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell>
                            {marks ? `${marks.totalMarks}` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {marks ? (
                              <Badge
                                className={
                                  marks.totalPercentage >= 75
                                    ? 'bg-green-500'
                                    : marks.totalPercentage >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }
                              >
                                {marks.totalPercentage.toFixed(1)}%
                              </Badge>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            {marks?.rank ? (
                              <Badge variant="outline">#{marks.rank}</Badge>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            {marks ? `${marks.attendancePercentage.toFixed(0)}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadStudentReport(student)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  )
}
