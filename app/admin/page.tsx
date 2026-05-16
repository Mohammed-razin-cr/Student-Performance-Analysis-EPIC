"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Users, Search, Download, Plus, Edit, Trash2, 
  GraduationCap, TrendingUp, Award, Calendar,
  Loader2, Eye, FileText, BarChart3
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { 
  getAllStudents, 
  getAllStudentMarks, 
  saveStudentMarks,
  updateStudentMarks 
} from "@/lib/firestore"
import type { User, StudentMarks, ExamMark } from "@/types/firestore"

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { userData, loading: authLoading } = useUserData()
  
  const [students, setStudents] = useState<User[]>([])
  const [marksData, setMarksData] = useState<Map<string, StudentMarks>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)
  const [isAddingMarks, setIsAddingMarks] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // New marks form
  const [newMark, setNewMark] = useState({
    examName: "",
    subject: "",
    marksObtained: 0,
    totalMarks: 100,
  })

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && userData) {
      if (userData.role !== "admin") {
        toast.error("Access denied. Admin only.")
        router.push("/dashboard")
      }
    }
  }, [userData, authLoading, router])

  // Fetch students and marks
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
        toast.error("Failed to load student data")
      } finally {
        setLoading(false)
      }
    }

    if (userData?.role === "admin") {
      fetchData()
    }
  }, [userData])

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddMarks = async () => {
    if (!selectedStudent || !newMark.examName || !newMark.subject) {
      toast.error("Please fill all fields")
      return
    }

    setIsSaving(true)
    try {
      const existingMarks = marksData.get(selectedStudent.id)
      const examMark: ExamMark = {
        examName: newMark.examName,
        subject: newMark.subject,
        marksObtained: newMark.marksObtained,
        totalMarks: newMark.totalMarks,
        percentage: (newMark.marksObtained / newMark.totalMarks) * 100,
        date: new Date().toISOString().split('T')[0],
      }

      if (existingMarks) {
        // Update existing
        const updatedExams = [...existingMarks.exams, examMark]
        const totalMarks = updatedExams.reduce((sum, e) => sum + e.marksObtained, 0)
        const maxMarks = updatedExams.reduce((sum, e) => sum + e.totalMarks, 0)
        
        await updateStudentMarks(selectedStudent.id, {
          exams: updatedExams,
          totalMarks,
          totalPercentage: (totalMarks / maxMarks) * 100,
        })
      } else {
        // Create new with empty subjects array (marks are managed in /admin/marks page)
        await saveStudentMarks({
          userId: selectedStudent.id,
          studentId: selectedStudent.studentId || "",
          studentName: selectedStudent.name,
          department: selectedStudent.department,
          subjects: [], // Subject-wise marks managed in /admin/marks page
          totalMarks: newMark.marksObtained,
          totalPercentage: (newMark.marksObtained / newMark.totalMarks) * 100,
          rank: 0,
          exams: [examMark],
          attendance: [],
          attendancePercentage: 0,
        })
      }

      toast.success("Marks added successfully!")
      setIsAddingMarks(false)
      setNewMark({ examName: "", subject: "", marksObtained: 0, totalMarks: 100 })
      
      // Refresh data
      const updatedMarks = await getAllStudentMarks()
      const marksMap = new Map<string, StudentMarks>()
      updatedMarks.forEach(mark => marksMap.set(mark.userId, mark))
      setMarksData(marksMap)
      
    } catch (err) {
      console.error(err)
      toast.error("Failed to add marks")
    } finally {
      setIsSaving(false)
    }
  }

  const downloadStudentReport = (student: User) => {
    const marks = marksData.get(student.id)
    
    let report = `
╔══════════════════════════════════════════════════════════════╗
║                    EPIC - STUDENT REPORT                      ║
╚══════════════════════════════════════════════════════════════╝

STUDENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:           ${student.name}
Student ID:     ${student.studentId || 'N/A'}
Email:          ${student.email}
Department:     ${student.department || 'N/A'}
School:         ${student.school || 'N/A'}

`
    if (marks) {
      report += `
ACADEMIC PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Marks:        ${marks.totalMarks}
Total Percentage:   ${marks.totalPercentage?.toFixed(2)}%
Rank:               ${marks.rank || 'Not Ranked'}
Attendance:         ${marks.attendancePercentage?.toFixed(2) || 0}%

EXAM DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      marks.exams?.forEach((exam, index) => {
        report += `
${index + 1}. ${exam.examName} - ${exam.subject}
   Marks: ${exam.marksObtained}/${exam.totalMarks} (${exam.percentage?.toFixed(2)}%)
   Date: ${exam.date}
`
      })
    } else {
      report += `
ACADEMIC PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No marks data available for this student.
`
    }

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated on: ${new Date().toLocaleString()}
EPIC - East Point Intelligence Center
`

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${student.name.replace(/\s+/g, '_')}_report.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Report downloaded!")
  }

  const downloadAllReports = () => {
    filteredStudents.forEach(student => {
      setTimeout(() => downloadStudentReport(student), 100)
    })
  }

  // Calculate stats
  const totalStudents = students.length
  const studentsWithMarks = Array.from(marksData.values()).length
  const averagePercentage = studentsWithMarks > 0
    ? Array.from(marksData.values()).reduce((sum, m) => sum + (m.totalPercentage || 0), 0) / studentsWithMarks
    : 0

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (userData?.role !== "admin") {
    return null
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
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage students, marks, and attendance</p>
        </div>
        <Button onClick={downloadAllReports} variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Download All Reports
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold">{totalStudents}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Marks</p>
                  <p className="text-3xl font-bold">{studentsWithMarks}</p>
                </div>
                <div className="p-3 rounded-full bg-secondary/10">
                  <GraduationCap className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                  <p className="text-3xl font-bold">{averagePercentage.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-full bg-accent/10">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Rank</p>
                  <p className="text-3xl font-bold">
                    {Array.from(marksData.values()).find(m => m.rank === 1)?.studentName?.split(' ')[0] || '-'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Award className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search & Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Student Records</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Student</TableHead>
                <TableHead className="min-w-[100px]">Student ID</TableHead>
                <TableHead className="min-w-[100px]">Department</TableHead>
                <TableHead className="min-w-[100px]">Total Marks</TableHead>
                <TableHead className="min-w-[100px]">Percentage</TableHead>
                <TableHead className="min-w-[100px]">Attendance</TableHead>
                <TableHead className="min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student, index) => {
                const marks = marksData.get(student.id)
                const initials = student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
                
                return (
                  <TableRow key={student.id || `student-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.photoURL} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.studentId || '-'}</TableCell>
                    <TableCell>{student.department || '-'}</TableCell>
                    <TableCell>{marks?.totalMarks || '-'}</TableCell>
                    <TableCell>
                      {marks?.totalPercentage ? (
                        <Badge 
                          variant={marks.totalPercentage >= 75 ? "default" : marks.totalPercentage >= 50 ? "secondary" : "destructive"}
                        >
                          {marks.totalPercentage.toFixed(1)}%
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {marks?.attendancePercentage ? `${marks.attendancePercentage.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={isAddingMarks && selectedStudent?.id === student.id} onOpenChange={(open) => {
                          if (!open) {
                            setIsAddingMarks(false)
                            setSelectedStudent(null)
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedStudent(student)
                                setIsAddingMarks(true)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Add Marks for {student.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Exam Name</Label>
                                <Input
                                  value={newMark.examName}
                                  onChange={(e) => setNewMark(prev => ({ ...prev, examName: e.target.value }))}
                                  placeholder="e.g., Midterm 1"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input
                                  value={newMark.subject}
                                  onChange={(e) => setNewMark(prev => ({ ...prev, subject: e.target.value }))}
                                  placeholder="e.g., Mathematics"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Marks Obtained</Label>
                                  <Input
                                    type="number"
                                    value={newMark.marksObtained}
                                    onChange={(e) => setNewMark(prev => ({ ...prev, marksObtained: parseInt(e.target.value) || 0 }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Total Marks</Label>
                                  <Input
                                    type="number"
                                    value={newMark.totalMarks}
                                    onChange={(e) => setNewMark(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 100 }))}
                                  />
                                </div>
                              </div>
                              <Button onClick={handleAddMarks} className="w-full" disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Add Marks
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadStudentReport(student)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
