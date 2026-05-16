"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SkeletonTable } from "@/components/skeleton-card"
import { FileText, Download, Search, Filter, Eye, Loader2, Users, TrendingUp, AlertTriangle, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { getAllStudents, getAllStudentMarks, getStudentMarks } from "@/lib/firestore"
import type { User, StudentMarks } from "@/types/firestore"

interface StudentReportData {
  id: string
  name: string
  rollNo: string
  department: string
  attendance: number
  marks: number
  grade: string
  status: string
}

export default function ReportsPage() {
  const { user } = useAuth()
  const { userData } = useUserData()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [isDownloading, setIsDownloading] = useState(false)
  const [studentsData, setStudentsData] = useState<StudentReportData[]>([])
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Check if user is admin or student
        if (userData?.role === "admin") {
          // Admin: Get all students and their marks
          const [students, allMarks] = await Promise.all([
            getAllStudents(),
            getAllStudentMarks()
          ])
          
          const marksMap = new Map<string, StudentMarks>()
          allMarks.forEach(mark => marksMap.set(mark.userId, mark))
          
          const reportData: StudentReportData[] = students.map(student => {
            const marks = marksMap.get(student.id)
            const totalMarks = marks?.totalMarks || 0
            const totalPercentage = marks?.totalPercentage || 0
            const attendancePercentage = marks?.attendancePercentage || 0
            
            // Calculate grade based on percentage
            let grade = "N/A"
            if (marks?.subjects && marks.subjects.length > 0) {
              if (totalPercentage >= 90) grade = "A+"
              else if (totalPercentage >= 80) grade = "A"
              else if (totalPercentage >= 70) grade = "B+"
              else if (totalPercentage >= 60) grade = "B"
              else if (totalPercentage >= 50) grade = "C+"
              else if (totalPercentage >= 40) grade = "C"
              else if (totalPercentage >= 35) grade = "D"
              else grade = "F"
            }
            
            // Determine status
            let status = "No Data"
            if (marks?.subjects && marks.subjects.length > 0) {
              if (totalPercentage < 40) status = "Fail"
              else if (totalPercentage < 50 || attendancePercentage < 75) status = "At Risk"
              else status = "Pass"
            }
            
            return {
              id: student.id,
              name: student.name || "Unknown",
              rollNo: student.studentId || student.email?.split("@")[0] || "N/A",
              department: student.department || "N/A",
              attendance: Math.round(attendancePercentage),
              marks: Math.round(totalPercentage),
              grade,
              status
            }
          })
          
          setStudentsData(reportData)
          
          // Get unique departments
          const uniqueDepts = [...new Set(students.map(s => s.department).filter(Boolean))]
          setDepartments(uniqueDepts as string[])
        } else {
          // Student: Get only their own marks
          const marks = await getStudentMarks(user.uid)
          
          if (marks) {
            const totalPercentage = marks.totalPercentage || 0
            const attendancePercentage = marks.attendancePercentage || 0
            
            let grade = "N/A"
            if (marks.subjects && marks.subjects.length > 0) {
              if (totalPercentage >= 90) grade = "A+"
              else if (totalPercentage >= 80) grade = "A"
              else if (totalPercentage >= 70) grade = "B+"
              else if (totalPercentage >= 60) grade = "B"
              else if (totalPercentage >= 50) grade = "C+"
              else if (totalPercentage >= 40) grade = "C"
              else if (totalPercentage >= 35) grade = "D"
              else grade = "F"
            }
            
            let status = "No Data"
            if (marks.subjects && marks.subjects.length > 0) {
              if (totalPercentage < 40) status = "Fail"
              else if (totalPercentage < 50 || attendancePercentage < 75) status = "At Risk"
              else status = "Pass"
            }
            
            setStudentsData([{
              id: user.uid,
              name: userData?.name || "You",
              rollNo: userData?.studentId || "N/A",
              department: userData?.department || "N/A",
              attendance: Math.round(attendancePercentage),
              marks: Math.round(totalPercentage),
              grade,
              status
            }])
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        toast.error("Failed to load report data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, userData])

  const filteredStudents = studentsData.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = departmentFilter === "all" || student.department === departmentFilter
    return matchesSearch && matchesDept
  })

  const handleDownload = async () => {
    setIsDownloading(true)
    
    // Generate CSV content
    const headers = ["Name", "Roll No", "Department", "Attendance %", "Marks %", "Grade", "Status"]
    const rows = filteredStudents.map(s => [
      s.name, s.rollNo, s.department, s.attendance, s.marks, s.grade, s.status
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")
    
    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `student-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    setIsDownloading(false)
    toast.success("Report downloaded successfully!")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pass":
        return "bg-green-500/10 text-green-500"
      case "At Risk":
        return "bg-yellow-500/10 text-yellow-500"
      case "Fail":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade === "A" || grade === "A+") return "text-green-500"
    if (grade === "B" || grade === "B+") return "text-blue-500"
    if (grade === "C" || grade === "C+") return "text-yellow-500"
    return "text-red-500"
  }

  const passCount = studentsData.filter(s => s.status === "Pass").length
  const atRiskCount = studentsData.filter(s => s.status === "At Risk").length
  const failCount = studentsData.filter(s => s.status === "Fail").length
  const avgAttendance = studentsData.length > 0 
    ? Math.round(studentsData.reduce((acc, s) => acc + s.attendance, 0) / studentsData.length)
    : 0

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          {userData?.role === "admin" ? "View and download student performance reports" : "View your performance report"}
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{studentsData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {studentsData.length > 0 ? Math.round((passCount / studentsData.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">{atRiskCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Avg Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgAttendance}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Student Reports
              </CardTitle>
              <CardDescription>Complete list of student performance data</CardDescription>
            </div>
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {userData?.role === "admin" && departments.length > 0 && (
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">Roll No</TableHead>
                    <TableHead className="min-w-[100px]">Department</TableHead>
                    <TableHead className="text-center min-w-[100px]">Attendance</TableHead>
                    <TableHead className="text-center min-w-[80px]">Marks %</TableHead>
                    <TableHead className="text-center min-w-[60px]">Grade</TableHead>
                    <TableHead className="text-center min-w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={student.id || `student-${index}`}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.rollNo}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell className="text-center">{student.attendance}%</TableCell>
                      <TableCell className="text-center">{student.marks}%</TableCell>
                      <TableCell className={`text-center font-semibold ${getGradeColor(student.grade)}`}>
                        {student.grade}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}

          {!isLoading && filteredStudents.length === 0 && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No students found matching your search criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
