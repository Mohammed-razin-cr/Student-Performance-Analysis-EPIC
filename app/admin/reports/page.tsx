"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search, Download, 
  GraduationCap, TrendingUp, Award, Calendar,
  Loader2, FileText, Filter, ChevronDown, ChevronUp,
  Trophy, Medal
} from "lucide-react"
import { toast } from "sonner"
import { useUserData } from "@/hooks/useFirestore"
import { 
  getAllStudents, 
  getAllStudentMarks, 
} from "@/lib/firestore"
import type { User, StudentMarks } from "@/types/firestore"

export default function AdminReportsPage() {
  const { userData } = useUserData()
  
  const [students, setStudents] = useState<User[]>([])
  const [marksData, setMarksData] = useState<Map<string, StudentMarks>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"rank" | "percentage" | "name" | "attendance">("rank")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [studentsData, marksDataArray] = await Promise.all([
          getAllStudents(),
          getAllStudentMarks()
        ])
        
        setStudents(studentsData)
        
        const marksMap = new Map<string, StudentMarks>()
        marksDataArray.forEach(mark => {
          marksMap.set(mark.userId, mark)
        })
        setMarksData(marksMap)
      } catch (err) {
        console.error("Error fetching data:", err)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    if (userData?.role === "admin") {
      fetchData()
    }
  }, [userData])

  // Get unique departments
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))]

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = 
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDepartment = departmentFilter === "all" || student.department === departmentFilter
      
      return matchesSearch && matchesDepartment
    })
    .map(student => ({
      ...student,
      marks: marksData.get(student.id)
    }))
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "rank":
          const rankA = a.marks?.rank || 999
          const rankB = b.marks?.rank || 999
          comparison = rankA - rankB
          break
        case "percentage":
          const percA = a.marks?.totalPercentage || 0
          const percB = b.marks?.totalPercentage || 0
          comparison = percB - percA
          break
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "")
          break
        case "attendance":
          const attA = a.marks?.attendancePercentage || 0
          const attB = b.marks?.attendancePercentage || 0
          comparison = attB - attA
          break
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })

  const downloadStudentReport = (student: User & { marks?: StudentMarks }) => {
    const marks = student.marks
    
    let report = `
╔══════════════════════════════════════════════════════════════════╗
║                    EPIC - STUDENT ACADEMIC REPORT                 ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         STUDENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Name:             ${student.name}
  Student ID:       ${student.studentId || 'N/A'}
  Email:            ${student.email}
  Department:       ${student.department || 'N/A'}
  School:           ${student.school || 'N/A'}
  Phone:            ${student.phone || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                       ACADEMIC PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`
    if (marks) {
      report += `  Total Marks:          ${marks.totalMarks}
  Overall Percentage:   ${marks.totalPercentage?.toFixed(2)}%
  Class Rank:           ${marks.rank || 'Not Ranked'}
  Attendance Rate:      ${marks.attendancePercentage?.toFixed(2) || 0}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         EXAM BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`
      if (marks.exams && marks.exams.length > 0) {
        marks.exams.forEach((exam, index) => {
          const grade = exam.percentage >= 90 ? 'A+' : 
                        exam.percentage >= 80 ? 'A' :
                        exam.percentage >= 70 ? 'B' :
                        exam.percentage >= 60 ? 'C' :
                        exam.percentage >= 50 ? 'D' : 'F'
          
          report += `  ${index + 1}. ${exam.examName}
     Subject:     ${exam.subject}
     Score:       ${exam.marksObtained}/${exam.totalMarks}
     Percentage:  ${exam.percentage?.toFixed(2)}%
     Grade:       ${grade}
     Date:        ${exam.date}

`
        })
      } else {
        report += `  No exam records available.

`
      }

      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                       ATTENDANCE RECORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`
      if (marks.attendance && marks.attendance.length > 0) {
        const presentDays = marks.attendance.filter(a => a.status === "present").length
        const absentDays = marks.attendance.filter(a => a.status === "absent").length
        const lateDays = marks.attendance.filter(a => a.status === "late").length
        
        report += `  Summary:
     Present:     ${presentDays} days
     Absent:      ${absentDays} days
     Late:        ${lateDays} days
     Total:       ${marks.attendance.length} days

`
      } else {
        report += `  No attendance records available.

`
      }
    } else {
      report += `  No academic data available for this student.

`
    }

    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Report Generated: ${new Date().toLocaleString()}
  
  EPIC - East Point Intelligence Center
  AI-Powered Student Performance Analysis System

╚══════════════════════════════════════════════════════════════════╝
`

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${student.name?.replace(/\s+/g, '_')}_Academic_Report.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Report downloaded!")
  }

  const downloadRankingReport = () => {
    let report = `
╔══════════════════════════════════════════════════════════════════╗
║                 EPIC - CLASS RANKING REPORT                       ║
╚══════════════════════════════════════════════════════════════════╝

Generated: ${new Date().toLocaleString()}
Department: ${departmentFilter === "all" ? "All Departments" : departmentFilter}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RANK  | STUDENT NAME              | PERCENTAGE | ATTENDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`
    filteredStudents
      .filter(s => s.marks?.rank)
      .forEach((student) => {
        const rank = String(student.marks?.rank || '-').padStart(4, ' ')
        const name = (student.name || 'Unknown').padEnd(25, ' ')
        const perc = (student.marks?.totalPercentage?.toFixed(1) || '0.0').padStart(10, ' ')
        const att = (student.marks?.attendancePercentage?.toFixed(1) || '0.0').padStart(10, ' ')
        
        report += `${rank}  | ${name} | ${perc}% | ${att}%\n`
      })

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
  Total Students:     ${filteredStudents.length}
  With Marks:         ${filteredStudents.filter(s => s.marks?.totalMarks).length}
  Avg Percentage:     ${(filteredStudents.reduce((sum, s) => sum + (s.marks?.totalPercentage || 0), 0) / filteredStudents.filter(s => s.marks).length || 0).toFixed(2)}%
  Avg Attendance:     ${(filteredStudents.reduce((sum, s) => sum + (s.marks?.attendancePercentage || 0), 0) / filteredStudents.filter(s => s.marks?.attendancePercentage).length || 0).toFixed(2)}%

╚══════════════════════════════════════════════════════════════════╝
`

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Class_Ranking_Report_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Ranking report downloaded!")
  }

  const downloadAllReports = () => {
    filteredStudents.forEach((student, index) => {
      setTimeout(() => downloadStudentReport(student), index * 200)
    })
    toast.success(`Downloading ${filteredStudents.length} reports...`)
  }

  // Stats
  const stats = {
    totalStudents: filteredStudents.length,
    withMarks: filteredStudents.filter(s => s.marks?.totalMarks).length,
    avgPercentage: filteredStudents.filter(s => s.marks).length > 0
      ? filteredStudents.reduce((sum, s) => sum + (s.marks?.totalPercentage || 0), 0) / 
        filteredStudents.filter(s => s.marks).length
      : 0,
    topStudent: filteredStudents.find(s => s.marks?.rank === 1),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Reports & Rankings
          </h1>
          <p className="text-muted-foreground mt-1">
            View rankings and download detailed reports
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={downloadRankingReport} variant="outline" className="flex-1 sm:flex-none">
            <Trophy className="h-4 w-4 mr-2" />
            Ranking Report
          </Button>
          <Button onClick={downloadAllReports} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            All Reports
          </Button>
        </div>
      </motion.div>

      {/* Top 3 Podium */}
      {filteredStudents.filter(s => s.marks?.rank && s.marks.rank <= 3).length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-500/10 via-slate-500/10 to-orange-500/10">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-end justify-center gap-2 sm:gap-4 overflow-x-auto px-2">
              {/* 2nd Place */}
              {filteredStudents.find(s => s.marks?.rank === 2) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto border-4 border-slate-400">
                    <AvatarImage src={filteredStudents.find(s => s.marks?.rank === 2)?.photoURL} />
                    <AvatarFallback className="bg-slate-400 text-white text-lg sm:text-xl">
                      {filteredStudents.find(s => s.marks?.rank === 2)?.name?.charAt(0) || '2'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="h-16 w-14 sm:h-24 sm:w-20 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-lg mt-2 flex items-center justify-center">
                    <Medal className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <p className="font-medium mt-2 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{filteredStudents.find(s => s.marks?.rank === 2)?.name}</p>
                  <Badge variant="secondary">
                    {filteredStudents.find(s => s.marks?.rank === 2)?.marks?.totalPercentage?.toFixed(1)}%
                  </Badge>
                </motion.div>
              )}

              {/* 1st Place */}
              {filteredStudents.find(s => s.marks?.rank === 1) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto border-4 border-yellow-400">
                    <AvatarImage src={filteredStudents.find(s => s.marks?.rank === 1)?.photoURL} />
                    <AvatarFallback className="bg-yellow-400 text-white text-xl sm:text-2xl">
                      {filteredStudents.find(s => s.marks?.rank === 1)?.name?.charAt(0) || '1'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="h-20 w-16 sm:h-32 sm:w-24 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg mt-2 flex items-center justify-center">
                    <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <p className="font-medium mt-2 text-sm sm:text-base truncate max-w-[90px] sm:max-w-none">{filteredStudents.find(s => s.marks?.rank === 1)?.name}</p>
                  <Badge className="bg-yellow-500">
                    {filteredStudents.find(s => s.marks?.rank === 1)?.marks?.totalPercentage?.toFixed(1)}%
                  </Badge>
                </motion.div>
              )}

              {/* 3rd Place */}
              {filteredStudents.find(s => s.marks?.rank === 3) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <Avatar className="h-10 w-10 sm:h-14 sm:w-14 mx-auto border-4 border-orange-400">
                    <AvatarImage src={filteredStudents.find(s => s.marks?.rank === 3)?.photoURL} />
                    <AvatarFallback className="bg-orange-400 text-white text-base sm:text-lg">
                      {filteredStudents.find(s => s.marks?.rank === 3)?.name?.charAt(0) || '3'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg mt-2 flex items-center justify-center">
                    <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <p className="font-medium mt-2 text-xs sm:text-sm truncate max-w-[70px] sm:max-w-none">{filteredStudents.find(s => s.marks?.rank === 3)?.name}</p>
                  <Badge variant="outline" className="border-orange-400 text-orange-600">
                    {filteredStudents.find(s => s.marks?.rank === 3)?.marks?.totalPercentage?.toFixed(1)}%
                  </Badge>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept, i) => (
                  <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Ranking</CardTitle>
          <CardDescription>
            All students sorted by {sortBy}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 min-w-[60px]">Rank</TableHead>
                  <TableHead className="min-w-[200px]">Student</TableHead>
                  <TableHead className="min-w-[100px]">Department</TableHead>
                  <TableHead className="min-w-[100px]">Total Marks</TableHead>
                  <TableHead className="min-w-[100px]">Percentage</TableHead>
                  <TableHead className="min-w-[100px]">Attendance</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredStudents.map((student, index) => {
                const initials = student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
                const rank = student.marks?.rank
                
                return (
                  <TableRow key={student.id || `student-${index}`}>
                    <TableCell>
                      {rank === 1 ? (
                        <Badge className="bg-yellow-500">🥇 1</Badge>
                      ) : rank === 2 ? (
                        <Badge variant="secondary" className="bg-slate-300">🥈 2</Badge>
                      ) : rank === 3 ? (
                        <Badge variant="outline" className="border-orange-400 text-orange-600">🥉 3</Badge>
                      ) : rank ? (
                        <span className="font-medium">#{rank}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.photoURL} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.studentId || student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.department || '-'}</TableCell>
                    <TableCell>{student.marks?.totalMarks || 0}</TableCell>
                    <TableCell>
                      {student.marks?.totalPercentage ? (
                        <Badge 
                          variant={
                            student.marks.totalPercentage >= 75 ? "default" : 
                            student.marks.totalPercentage >= 50 ? "secondary" : 
                            "destructive"
                          }
                        >
                          {student.marks.totalPercentage.toFixed(1)}%
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {student.marks?.attendancePercentage ? (
                        <Badge variant={student.marks.attendancePercentage >= 75 ? "default" : "secondary"}>
                          {student.marks.attendancePercentage.toFixed(1)}%
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadStudentReport(student)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Report
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
    </div>
  )
}
