"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  GraduationCap, TrendingUp, Award, Calendar, BookOpen,
  Loader2, CheckCircle, XCircle, Clock, Trophy, Target, BarChart3
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { getStudentMarks } from "@/lib/firestore"
import type { StudentMarks, SubjectMarks, AttendanceRecord } from "@/types/firestore"

export default function MyAcademicsPage() {
  const { user } = useAuth()
  const { userData, loading: userLoading } = useUserData()
  
  const [marksData, setMarksData] = useState<StudentMarks | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMarks = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const marks = await getStudentMarks(user.uid)
        setMarksData(marks)
      } catch (err) {
        console.error("Error fetching marks:", err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchMarks()
    }
  }, [user])

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: "A+", color: "bg-green-500" }
    if (percentage >= 80) return { grade: "A", color: "bg-green-400" }
    if (percentage >= 70) return { grade: "B+", color: "bg-blue-500" }
    if (percentage >= 60) return { grade: "B", color: "bg-blue-400" }
    if (percentage >= 50) return { grade: "C+", color: "bg-yellow-500" }
    if (percentage >= 40) return { grade: "C", color: "bg-yellow-400" }
    if (percentage >= 35) return { grade: "D", color: "bg-orange-500" }
    return { grade: "F", color: "bg-red-500" }
  }

  const getGradeBadgeVariant = (percentage: number) => {
    if (percentage >= 60) return "default"
    if (percentage >= 40) return "secondary"
    return "destructive"
  }

  const presentCount = marksData?.attendance?.filter(a => a.status === "present").length || 0
  const lateCount = marksData?.attendance?.filter(a => a.status === "late").length || 0
  const absentCount = marksData?.attendance?.filter(a => a.status === "absent").length || 0

  // Calculate overall stats from subjects (MCA Pattern)
  const totalSubjects = marksData?.subjects?.length || 0
  const totalIA = marksData?.subjects?.reduce((sum, s) => sum + (s.iaTotal || 0), 0) || 0
  const totalSemester = marksData?.subjects?.reduce((sum, s) => sum + (s.semester?.obtained || 0), 0) || 0
  const totalFinal = marksData?.subjects?.reduce((sum, s) => sum + (s.finalTotal || 0), 0) || 0
  const overallPercentage = totalSubjects > 0 ? totalFinal / totalSubjects : 0

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          My Academics
        </h1>
        <p className="text-muted-foreground mt-1">
          View your subject-wise marks, grades, and attendance records
        </p>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSubjects}</p>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-secondary/10">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallPercentage.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Overall</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">#{marksData?.rank || '-'}</p>
                  <p className="text-sm text-muted-foreground">Class Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{marksData?.attendancePercentage?.toFixed(0) || 0}%</p>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance
          </TabsTrigger>
        </TabsList>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          {marksData?.subjects && marksData.subjects.length > 0 ? (
            <>
              {/* Subject Cards for Mobile */}
              <div className="block lg:hidden space-y-4">
                {marksData.subjects.map((subject, index) => {
                  const gradeInfo = getGrade(subject.percentage || subject.finalTotal || 0)
                  
                  return (
                    <motion.div
                      key={subject.subjectCode}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden">
                        <div className={`h-2 ${gradeInfo.color}`} />
                        <CardContent className="pt-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{subject.subjectName}</h3>
                              <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                            </div>
                            <Badge className={gradeInfo.color}>
                              {subject.grade || gradeInfo.grade}
                            </Badge>
                          </div>
                          
                          {/* IA Components */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Internal Assessment (IA) - 30 marks</p>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-center">
                                <p className="text-xs text-muted-foreground">Attend</p>
                                <p className="font-medium">{subject.attendance?.obtained || 0}/10</p>
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-center">
                                <p className="text-xs text-muted-foreground">Test</p>
                                <p className="font-medium">{subject.test?.obtained || 0}/10</p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-center">
                                <p className="text-xs text-muted-foreground">Assign</p>
                                <p className="font-medium">{subject.assignment?.obtained || 0}/5</p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-center">
                                <p className="text-xs text-muted-foreground">Seminar</p>
                                <p className="font-medium">{subject.seminar?.obtained || 0}/5</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Semester & Totals */}
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-center">
                              <p className="text-xs text-muted-foreground">IA</p>
                              <p className="font-bold">{subject.iaTotal || 0}/30</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-center">
                              <p className="text-xs text-muted-foreground">Sem</p>
                              <p className="font-bold">{subject.semester?.obtained || 0}/70</p>
                            </div>
                            <div className="bg-primary/10 p-2 rounded text-center">
                              <p className="text-xs text-muted-foreground">Final</p>
                              <p className="font-bold text-primary">{subject.finalTotal || 0}/100</p>
                            </div>
                          </div>
                          
                          <Progress value={subject.finalTotal || subject.percentage || 0} className="h-2" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              {/* Subject Table for Desktop */}
              <Card className="hidden lg:block overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Subject-wise Marks
                  </CardTitle>
                  <CardDescription>
                    MCA Marking Pattern: IA (30) + Semester (70) = 100
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center text-blue-600">Attend</TableHead>
                        <TableHead className="text-center text-blue-600">Test</TableHead>
                        <TableHead className="text-center text-green-600">Assign</TableHead>
                        <TableHead className="text-center text-green-600">Seminar</TableHead>
                        <TableHead className="text-center text-blue-700">IA (30)</TableHead>
                        <TableHead className="text-center text-purple-600">Sem (70)</TableHead>
                        <TableHead className="text-center text-primary">Final</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marksData.subjects.map((subject, index) => (
                        <TableRow key={subject.subjectCode || `subject-${index}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{subject.subjectName}</p>
                              <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {subject.attendance?.obtained || 0}/10
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {subject.test?.obtained || 0}/10
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {subject.assignment?.obtained || 0}/5
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {subject.seminar?.obtained || 0}/5
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {subject.iaTotal || 0}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {subject.semester?.obtained || 0}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-primary">{subject.finalTotal || 0}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getGradeBadgeVariant(subject.finalTotal || subject.percentage || 0)}>
                              {subject.grade || getGrade(subject.finalTotal || subject.percentage || 0).grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Overall</TableCell>
                        <TableCell className="text-center text-sm">
                          {marksData.subjects.reduce((sum, s) => sum + (s.attendance?.obtained || 0), 0)}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {marksData.subjects.reduce((sum, s) => sum + (s.test?.obtained || 0), 0)}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {marksData.subjects.reduce((sum, s) => sum + (s.assignment?.obtained || 0), 0)}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {marksData.subjects.reduce((sum, s) => sum + (s.seminar?.obtained || 0), 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {totalIA}/{totalSubjects * 30}
                        </TableCell>
                        <TableCell className="text-center">
                          {totalSemester}/{totalSubjects * 70}
                        </TableCell>
                        <TableCell className="text-center text-primary font-bold">
                          {totalFinal}/{totalSubjects * 100}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getGradeBadgeVariant(overallPercentage)}>
                            {getGrade(overallPercentage).grade}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {Math.max(...marksData.subjects.map(s => s.finalTotal || s.percentage || 0)).toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Highest Subject</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {marksData.subjects.find(s => (s.finalTotal || s.percentage || 0) === Math.max(...marksData.subjects.map(x => x.finalTotal || x.percentage || 0)))?.subjectName}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {overallPercentage.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Out of 100 per subject
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-orange-600">
                        {Math.min(...marksData.subjects.map(s => s.finalTotal || s.percentage || 0)).toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Lowest Subject</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {marksData.subjects.find(s => (s.finalTotal || s.percentage || 0) === Math.min(...marksData.subjects.map(x => x.finalTotal || x.percentage || 0)))?.subjectName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Subject Records</h3>
                <p className="text-muted-foreground">
                  Your subject-wise marks will appear here once your teacher adds them.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>
                Your attendance summary for this semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      {marksData?.attendancePercentage?.toFixed(0) || 0}%
                    </span>
                  </div>
                  <p className="text-sm font-medium">Overall</p>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                  <div>
                    <p className="text-xl font-bold">{presentCount}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-xl font-bold">{lateCount}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                  <div>
                    <p className="text-xl font-bold">{absentCount}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records */}
          {marksData?.attendance && marksData.attendance.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <div className="space-y-3 px-4 sm:px-0">
                  {marksData.attendance.map((record, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {record.status === "present" ? (
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-950">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        ) : record.status === "late" ? (
                          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-950">
                            <Clock className="h-4 w-4 text-yellow-600" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-full bg-red-100 dark:bg-red-950">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{record.subject}</p>
                          <p className="text-sm text-muted-foreground">{record.date}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          record.status === "present" ? "default" :
                          record.status === "late" ? "secondary" :
                          "destructive"
                        }
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Attendance Records</h3>
                <p className="text-muted-foreground">
                  Your attendance records will appear here once your teacher adds them.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Motivational Card */}
      {marksData && marksData.subjects && marksData.subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {overallPercentage >= 75 
                      ? "Excellent Performance! Keep it up! 🎉" 
                      : overallPercentage >= 50
                      ? "Good progress! You can do even better! 💪"
                      : "Stay focused and work harder! You got this! 📚"
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {marksData.rank 
                      ? `You're ranked #${marksData.rank} in your class.`
                      : "Keep attending classes and performing well in exams."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
