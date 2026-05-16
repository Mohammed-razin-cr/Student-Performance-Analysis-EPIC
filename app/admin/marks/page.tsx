"use client"

import './attendance-bar.css';

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Users, Search, Save,
  GraduationCap, Calendar, Check, X,
  Loader2, BookOpen, Award, Trash2
} from "lucide-react"
import { toast } from "sonner"
import { useUserData } from "@/hooks/useFirestore"
import { 
  getAllStudents, 
  getAllStudentMarks, 
  saveStudentMarks,
  updateStudentMarks,
  getAllStudentActivityMarks,
  saveStudentActivityMarks
} from "@/lib/firestore"
import { PDFMarksUpload } from "@/components/pdf-marks-upload"
import type { User, StudentMarks, SubjectMarks, AttendanceRecord } from "@/types/firestore"

// MCA Subjects by Semester
const SUBJECTS = [
  // Semester I
  { name: "Object Oriented Programming with Java", code: "MCA101T", semester: 1 },
  { name: "Advanced Software Engineering", code: "MCA102T", semester: 1 },
  { name: "Mathematical Foundations", code: "MCA103T", semester: 1 },
  { name: "Advanced Database Management System", code: "MCA104T", semester: 1 },
  { name: "Data Structures and Algorithms", code: "MCA105T", semester: 1 },
  { name: "Theory of Computation", code: "MCA106T", semester: 1 },
  { name: "Java Programming Lab", code: "MCA107P", semester: 1 },
  { name: "Data Structures and Algorithm Lab", code: "MCA108P", semester: 1 },
  
  // Semester II
  { name: "Artificial Intelligence", code: "MCA201T", semester: 2 },
  { name: "Web Technologies", code: "MCA202T", semester: 2 },
  { name: "Advanced Python Programming", code: "MCA203T", semester: 2 },
  { name: "Operating System and Linux", code: "MCA204T", semester: 2 },
  { name: "Network and Information Security", code: "MCA205T", semester: 2 },
  { name: "Cloud Computing", code: "MCA206T", semester: 2 },
  { name: "Web Technologies Lab", code: "MCA207P", semester: 2 },
  { name: "Python Programming Lab", code: "MCA208P", semester: 2 },
  
  // Semester III
  { name: "Research Methodology", code: "MCA301T", semester: 3 },
  { name: "Data Science", code: "MCA302T", semester: 3 },
  { name: "Machine Learning", code: "MCA303T", semester: 3 },
  { name: "Cyber Security and Cyber Laws", code: "MCA304T", semester: 3 },
  { name: "Big Data Analytics", code: "MCA305T", semester: 3 },
  { name: "Data Science Lab", code: "MCA306P", semester: 3 },
  { name: "Mini Project", code: "MCA307P", semester: 3 },
  
  // Semester IV
  { name: "Main Project", code: "MCA401P", semester: 4 },
  
  // Elective Options (can be selected for Elective-I, II, III)
  { name: "Object Oriented Analysis and Design using UML", code: "ELEC01", semester: 3 },
  { name: "Internet of Things", code: "ELEC02", semester: 3 },
  { name: "Software Testing Tools", code: "ELEC03", semester: 3 },
  { name: "Mobile Computing", code: "ELEC04", semester: 3 },
  { name: "Deep Learning", code: "ELEC05", semester: 3 },
  { name: "Blockchain Technologies", code: "ELEC06", semester: 3 },
]

// MCA Marking Pattern:
// Internal 1: 15 marks
// Internal 2: 15 marks
// Semester Exam: 70 marks
// Total: 15 + 15 + 70 = 100 marks

const emptySubjectMarks = (): Omit<SubjectMarks, 'subjectName' | 'subjectCode'> => ({
  attendancePercentage: 0,
  internal1: { obtained: 0, total: 15 },
  internal2: { obtained: 0, total: 15 },
  internalsTotal: 0,
  semester: { obtained: 0, total: 70 },
  finalTotal: 0,
  percentage: 0,
  grade: '',
})

export default function ManageMarksPage() {
  const { userData } = useUserData()
  
  const [students, setStudents] = useState<User[]>([])
  const [marksData, setMarksData] = useState<Map<string, StudentMarks>>(new Map())
  const [loading, setLoading] = useState(true)
  const [activityMarksData, setActivityMarksData] = useState<Map<string, any>>(new Map())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)
  const [isManagingMarks, setIsManagingMarks] = useState(false)
    // View Activities Dialog state (must be at top level, not inside JSX)
    const [isViewingActivities, setIsViewingActivities] = useState(false);
    const [activityView, setActivityView] = useState({
      sports: 0,
      cultural: 0,
      technical: 0,
      classRoomActivity: 0,
      eventsCompetitions: 0
    });
  const [isManagingActivities, setIsManagingActivities] = useState(false)
  const [activityForm, setActivityForm] = useState({
    sports: '',
    cultural: '',
    technical: '',
    classRoomActivity: '',
    eventsCompetitions: ''
  })
  const [isAddingAttendance, setIsAddingAttendance] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Current student's marks being edited
  const [currentSubjects, setCurrentSubjects] = useState<SubjectMarks[]>([])
  
  // Attendance form - stores attendance status for each subject
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [subjectAttendance, setSubjectAttendance] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [studentsData, marksDataArray, activityMarksArray] = await Promise.all([
          getAllStudents(),
          getAllStudentMarks(),
          getAllStudentActivityMarks()
        ])
        setStudents(studentsData)
        const marksMap = new Map<string, StudentMarks>()
        marksDataArray.forEach(mark => {
          marksMap.set(mark.userId, mark)
        })
        setMarksData(marksMap)
        const activityMap = new Map<string, any>()
        activityMarksArray.forEach(activity => {
          activityMap.set(activity.userId, activity)
        })
        setActivityMarksData(activityMap)
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

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const refreshMarksData = async () => {
    const updatedMarks = await getAllStudentMarks()
    const marksMap = new Map<string, StudentMarks>()
    updatedMarks.forEach(mark => marksMap.set(mark.userId, mark))
    setMarksData(marksMap)
  }

  const openManageMarks = (student: User) => {
    setSelectedStudent(student)
    const existingMarks = marksData.get(student.id)
    
    if (existingMarks?.subjects && existingMarks.subjects.length > 0) {
      setCurrentSubjects(existingMarks.subjects)
    } else {
      // Initialize with empty subjects
      setCurrentSubjects([])
    }
    setIsManagingMarks(true)
  }

  const addSubject = (subjectName: string, subjectCode: string) => {
    const exists = currentSubjects.find(s => s.subjectCode === subjectCode)
    if (exists) {
      toast.error("Subject already added")
      return
    }
    
    const newSubject: SubjectMarks = {
      subjectName,
      subjectCode,
      ...emptySubjectMarks(),
    }
    setCurrentSubjects(prev => [...prev, newSubject])
    toast.success(`${subjectName} added`)
  }

  const removeSubject = (index: number) => {
    setCurrentSubjects(prev => prev.filter((_, i) => i !== index))
    toast.success("Subject removed")
  }

  const updateSubjectMark = (
    subjectIndex: number, 
    examType: 'internal1' | 'internal2' | 'semester',
    field: 'obtained' | 'total',
    value: number | string
  ) => {
    setCurrentSubjects(prev => {
      const updated = [...prev]
      const subject = { ...updated[subjectIndex] }
      
      subject[examType] = {
        ...subject[examType],
        [field]: Number(value)
      }
      
      // Calculate Internals Total (out of 30)
      const internalsTotal = 
        (subject.internal1?.obtained || 0) + 
        (subject.internal2?.obtained || 0)
      
      // Final Total = Internals (30) + Semester (70) = 100
      const finalTotal = internalsTotal + (subject.semester?.obtained || 0)

      subject.internalsTotal = internalsTotal
      subject.finalTotal = finalTotal
      subject.percentage = finalTotal  // Already out of 100
      subject.grade = getGrade(subject.percentage)
      
      updated[subjectIndex] = subject
      return updated
    })
  }

  const updateSubjectAttendancePercentage = (subjectIndex: number, value: string) => {
    setCurrentSubjects(prev => {
      const updated = [...prev]
      const subject = { ...updated[subjectIndex] }
      subject.attendancePercentage = Math.min(100, Math.max(0, Number(value) || 0))
      updated[subjectIndex] = subject
      return updated
    })
  }

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C+'
    if (percentage >= 40) return 'C'
    if (percentage >= 35) return 'D'
    return 'F'
  }

  const saveAllMarks = async () => {
    if (!selectedStudent) return
    
    setIsSaving(true)
    try {
      const totalFinal = currentSubjects.reduce((sum, s) => sum + s.finalTotal, 0)
      const totalPossible = currentSubjects.length * 100  // Each subject is out of 100
      const totalPercentage = totalPossible > 0 ? (totalFinal / totalPossible) * 100 : 0
      
      // Calculate overall attendance percentage from subject-wise attendance
      const subjectsWithAttendance = currentSubjects.filter(s => s.attendancePercentage !== undefined && s.attendancePercentage > 0)
      const overallAttendancePercentage = subjectsWithAttendance.length > 0
        ? subjectsWithAttendance.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / subjectsWithAttendance.length
        : 0
      
      const existingMarks = marksData.get(selectedStudent.id)
      
      if (existingMarks) {
        await updateStudentMarks(selectedStudent.id, {
          subjects: currentSubjects,
          totalMarks: totalFinal,
          totalPercentage,
          attendancePercentage: Math.round(overallAttendancePercentage * 10) / 10,
        })
      } else {
        await saveStudentMarks({
          userId: selectedStudent.id,
          studentId: selectedStudent.studentId || '',
          studentName: selectedStudent.name,
          department: selectedStudent.department || '',
          subjects: currentSubjects,
          totalMarks: totalFinal,
          totalPercentage,
          rank: 0,
          exams: [],
          attendance: [],
          attendancePercentage: Math.round(overallAttendancePercentage * 10) / 10,
        })
      }
      
      toast.success("Marks saved successfully!")
      await refreshMarksData()
      setIsManagingMarks(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to save marks")
    } finally {
      setIsSaving(false)
    }
  }

  const openAttendanceDialog = (student: User) => {
    setSelectedStudent(student)
    const existingMarks = marksData.get(student.id)
    
    // Initialize attendance state for all subjects added for this student
    if (existingMarks?.subjects && existingMarks.subjects.length > 0) {
      const initialAttendance: Record<string, boolean> = {}
      existingMarks.subjects.forEach(subject => {
        initialAttendance[subject.subjectCode] = true // Default to present
      })
      setSubjectAttendance(initialAttendance)
      setCurrentSubjects(existingMarks.subjects)
    } else {
      setSubjectAttendance({})
      setCurrentSubjects([])
    }
    setAttendanceDate(new Date().toISOString().split('T')[0])
    setIsAddingAttendance(true)
  }

  const handleSaveAttendance = async () => {
    if (!selectedStudent) return
    
    if (currentSubjects.length === 0) {
      toast.error("No subjects found. Please add subjects and marks first.")
      return
    }

    setIsSaving(true)
    try {
      const existingMarks = marksData.get(selectedStudent.id)
      
      // Create attendance records for each subject
      const newAttendanceRecords: AttendanceRecord[] = currentSubjects.map(subject => ({
        date: attendanceDate,
        subject: subject.subjectName,
        status: subjectAttendance[subject.subjectCode] ? "present" : "absent",
        remarks: "",
      }))

      if (existingMarks) {
        const updatedAttendance = [...(existingMarks.attendance || []), ...newAttendanceRecords]
        const presentCount = updatedAttendance.filter(a => a.status === "present").length
        const attendancePercentage = (presentCount / updatedAttendance.length) * 100
        
        await updateStudentMarks(selectedStudent.id, {
          attendance: updatedAttendance,
          attendancePercentage,
        })
      } else {
        const presentCount = newAttendanceRecords.filter(a => a.status === "present").length
        const attendancePercentage = (presentCount / newAttendanceRecords.length) * 100
        
        await saveStudentMarks({
          userId: selectedStudent.id,
          studentId: selectedStudent.studentId || "",
          studentName: selectedStudent.name,
          department: selectedStudent.department || '',
          subjects: [],
          totalMarks: 0,
          totalPercentage: 0,
          rank: 0,
          exams: [],
          attendance: newAttendanceRecords,
          attendancePercentage,
        })
      }

      toast.success(`Attendance recorded for ${attendanceDate}!`)
      setIsAddingAttendance(false)
      await refreshMarksData()
    } catch (err) {
      console.error(err)
      toast.error("Failed to record attendance")
    } finally {
      setIsSaving(false)
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
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Manage Marks & Attendance
        </h1>
        <p className="text-muted-foreground mt-1">
          Add subject-wise marks (Internals, Assignments, Semester) and attendance
        </p>
      </motion.div>

      {/* PDF Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PDFMarksUpload onUploadComplete={refreshMarksData} />
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-secondary/10">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{marksData.size}</p>
                <p className="text-sm text-muted-foreground">With Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Array.from(marksData.values())
                    .reduce((sum, m) => sum + (m.attendance?.filter(a => a.status === "present").length || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {marksData.size > 0 ? 
                    (Array.from(marksData.values()).reduce((sum, m) => sum + (m.totalPercentage || 0), 0) / marksData.size).toFixed(0) 
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Records</CardTitle>
          <CardDescription>Click on a student to manage their marks and attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Student</TableHead>
                  <TableHead className="min-w-[100px]">Subjects</TableHead>
                  <TableHead className="min-w-[120px]">Activities</TableHead>
                  <TableHead className="min-w-[80px]">Total %</TableHead>
                  <TableHead className="min-w-[100px]">Attendance</TableHead>
                  <TableHead className="min-w-[180px]">Actions</TableHead>
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
                    <TableCell>
                      <Badge variant="secondary">
                        {marks?.subjects?.length || 0} subjects
                      </Badge>
                    </TableCell>
                    {/* Activities Cell */}
                    <TableCell>
                      {(() => {
                        const activity = activityMarksData.get(student.id);
                        if (!activity || !activity.marks) return <span className="text-muted-foreground">-</span>;
                        return (
                          <Button size="sm" variant="ghost" className="px-2 py-0 h-6 text-xs" onClick={() => {
                            setSelectedStudent(student);
                            setActivityView({
                              sports: activity.marks.sports,
                              cultural: activity.marks.cultural,
                              technical: activity.marks.technical,
                              classRoomActivity: activity.marks.classRoomActivity,
                              eventsCompetitions: activity.marks.eventsCompetitions
                            });
                            setIsViewingActivities(true);
                          }}>View</Button>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {marks?.totalPercentage ? (
                        <Badge 
                          variant={marks.totalPercentage >= 60 ? "default" : marks.totalPercentage >= 40 ? "secondary" : "destructive"}
                        >
                          {marks.totalPercentage.toFixed(1)}%
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {marks?.attendancePercentage ? `${marks.attendancePercentage.toFixed(0)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => openManageMarks(student)}
                        >
                          <GraduationCap className="h-4 w-4 mr-1" />
                          Marks
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => openAttendanceDialog(student)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Attend
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedStudent(student);
                            const activity = activityMarksData.get(student.id);
                            setActivityForm({
                              sports: activity?.marks?.sports?.toString() || '',
                              cultural: activity?.marks?.cultural?.toString() || '',
                              technical: activity?.marks?.technical?.toString() || '',
                              classRoomActivity: activity?.marks?.classRoomActivity?.toString() || '',
                              eventsCompetitions: activity?.marks?.eventsCompetitions?.toString() || ''
                            });
                            setIsManagingActivities(true);
                          }}
                        >
                          Activities
                        </Button>

                            {/* Manage Activities Dialog */}
                            <Dialog open={isManagingActivities} onOpenChange={setIsManagingActivities}>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-yellow-500" />
                                    Manage Activities - {selectedStudent?.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Enter activity marks (0-100) for each category
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Sports</Label>
                                    <Input type="number" min={0} max={100} value={activityForm.sports} onChange={e => setActivityForm(f => ({ ...f, sports: e.target.value }))} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Cultural</Label>
                                    <Input type="number" min={0} max={100} value={activityForm.cultural} onChange={e => setActivityForm(f => ({ ...f, cultural: e.target.value }))} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Technical</Label>
                                    <Input type="number" min={0} max={100} value={activityForm.technical} onChange={e => setActivityForm(f => ({ ...f, technical: e.target.value }))} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Classroom Activity</Label>
                                    <Input type="number" min={0} max={100} value={activityForm.classRoomActivity} onChange={e => setActivityForm(f => ({ ...f, classRoomActivity: e.target.value }))} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Events/Competitions</Label>
                                    <Input type="number" min={0} max={100} value={activityForm.eventsCompetitions} onChange={e => setActivityForm(f => ({ ...f, eventsCompetitions: e.target.value }))} />
                                  </div>
                                  <Button
                                    className="w-full"
                                    onClick={async () => {
                                      if (!selectedStudent) return;
                                      await saveStudentActivityMarks(selectedStudent.id, {
                                        userId: selectedStudent.id,
                                        studentId: selectedStudent.studentId || '',
                                        studentName: selectedStudent.name,
                                        department: selectedStudent.department || '',
                                        marks: {
                                          sports: Number(activityForm.sports) || 0,
                                          cultural: Number(activityForm.cultural) || 0,
                                          technical: Number(activityForm.technical) || 0,
                                          classRoomActivity: Number(activityForm.classRoomActivity) || 0,
                                          eventsCompetitions: Number(activityForm.eventsCompetitions) || 0
                                        }
                                      });
                                      setIsManagingActivities(false);
                                      // Refresh activity marks data
                                      const activityMarksArray = await getAllStudentActivityMarks();
                                      const activityMap = new Map<string, any>();
                                      activityMarksArray.forEach(activity => {
                                        activityMap.set(activity.userId, activity);
                                      });
                                      setActivityMarksData(activityMap);
                                      toast.success('Activity marks saved!');
                                    }}
                                  >
                                    Save Activities
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* View Activities Dialog (always rendered at top level) */}
                            <Dialog open={isViewingActivities} onOpenChange={setIsViewingActivities}>
                              <DialogContent className="max-w-xs">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-yellow-500" />
                                    Activity Marks - {selectedStudent?.name}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-2 text-sm font-medium text-white bg-[#232b36] p-4 rounded">
                                  <span><b>Sports:</b> {activityView.sports}</span>
                                  <span><b>Cultural:</b> {activityView.cultural}</span>
                                  <span><b>Technical:</b> {activityView.technical}</span>
                                  <span><b>Classroom:</b> {activityView.classRoomActivity}</span>
                                  <span><b>Events:</b> {activityView.eventsCompetitions}</span>
                                </div>
                              </DialogContent>
                            </Dialog>
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

      {/* Manage Marks Dialog */}
      <Dialog open={isManagingMarks} onOpenChange={setIsManagingMarks}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Manage Marks - {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Add subjects and enter marks for Internals, Assignments, and Semester Exams
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Add Subject */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Add Subject</Label>
                <Select
                  onValueChange={(value) => {
                    const subject = SUBJECTS.find(s => s.code === value)
                    if (subject) addSubject(subject.name, subject.code)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(sem => {
                      const semSubjects = SUBJECTS.filter(s => s.semester === sem && !currentSubjects.find(cs => cs.subjectCode === s.code))
                      if (semSubjects.length === 0) return null
                      return (
                        <div key={sem}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                            Semester {sem}
                          </div>
                          {semSubjects.map(subject => (
                            <SelectItem key={subject.code} value={subject.code}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))}
                        </div>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subjects List */}
            {currentSubjects.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Subjects & Marks</Label>
                
                {currentSubjects.map((subject, idx) => (
                  <Card key={subject.subjectCode} className="border-2">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{subject.subjectName}</p>
                            <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={subject.percentage >= 40 ? "default" : "destructive"}>
                            {subject.percentage.toFixed(1)}% - {subject.grade || 'N/A'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => removeSubject(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Attendance Percentage */}
                      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">Attendance Percentage</p>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            placeholder="0"
                            value={subject.attendancePercentage || ''}
                            onChange={(e) => updateSubjectAttendancePercentage(idx, e.target.value)}
                            className="h-8 w-24"
                            min={0}
                            max={100}
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  (subject.attendancePercentage || 0) >= 75 ? 'bg-green-500' :
                                  (subject.attendancePercentage || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                } attendance-bar-width`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Internal Exams Row */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">Internal Assessments - Total 30 marks</p>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Internal 1 */}
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-blue-600">Internal 1 (15)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={subject.internal1?.obtained || ''}
                              onChange={(e) => updateSubjectMark(idx, 'internal1', 'obtained', e.target.value)}
                              className="h-8"
                              min={0}
                              max={15}
                            />
                          </div>

                          {/* Internal 2 */}
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-blue-600">Internal 2 (15)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={subject.internal2?.obtained || ''}
                              onChange={(e) => updateSubjectMark(idx, 'internal2', 'obtained', e.target.value)}
                              className="h-8"
                              min={0}
                              max={15}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Semester Exam Row */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">Semester Exam - 70 marks</p>
                        <div className="max-w-[200px]">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-purple-600">Semester Exam (70)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={subject.semester?.obtained || ''}
                              onChange={(e) => updateSubjectMark(idx, 'semester', 'obtained', e.target.value)}
                              className="h-8"
                              min={0}
                              max={70}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Subject Summary */}
                      <div className="pt-3 border-t grid grid-cols-4 gap-3 text-sm">
                        <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-center">
                          <p className="text-xs text-muted-foreground">Attendance</p>
                          <p className="font-bold">{subject.attendancePercentage || 0}%</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-center">
                          <p className="text-xs text-muted-foreground">Internals</p>
                          <p className="font-bold">{subject.internalsTotal || 0}/30</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-center">
                          <p className="text-xs text-muted-foreground">Semester</p>
                          <p className="font-bold">{subject.semester?.obtained || 0}/70</p>
                        </div>
                        <div className="bg-primary/10 p-2 rounded text-center">
                          <p className="text-xs text-muted-foreground">Final Total</p>
                          <p className="font-bold text-primary">{subject.finalTotal}/100</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {currentSubjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No subjects added yet. Select a subject from the dropdown above.</p>
              </div>
            )}

            {/* Overall Summary */}
            {currentSubjects.length > 0 && (
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Overall Attendance</p>
                      <p className={`text-xl font-bold ${
                        (() => {
                          const subjectsWithAttendance = currentSubjects.filter(s => s.attendancePercentage !== undefined && s.attendancePercentage > 0)
                          const avg = subjectsWithAttendance.length > 0 
                            ? subjectsWithAttendance.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / subjectsWithAttendance.length 
                            : 0
                          return avg >= 75 ? 'text-green-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-600'
                        })()
                      }`}>
                        {(() => {
                          const subjectsWithAttendance = currentSubjects.filter(s => s.attendancePercentage !== undefined && s.attendancePercentage > 0)
                          return subjectsWithAttendance.length > 0 
                            ? (subjectsWithAttendance.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / subjectsWithAttendance.length).toFixed(1) 
                            : 0
                        })()}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Internals</p>
                      <p className="text-xl font-bold">
                        {currentSubjects.reduce((sum, s) => sum + (s.internalsTotal || 0), 0)}
                        <span className="text-sm text-muted-foreground">/{currentSubjects.length * 30}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Semester</p>
                      <p className="text-xl font-bold">
                        {currentSubjects.reduce((sum, s) => sum + (s.semester?.obtained || 0), 0)}
                        <span className="text-sm text-muted-foreground">/{currentSubjects.length * 70}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Grand Total</p>
                      <p className="text-xl font-bold">
                        {currentSubjects.reduce((sum, s) => sum + s.finalTotal, 0)}
                        <span className="text-sm text-muted-foreground">/{currentSubjects.length * 100}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Overall %</p>
                      <p className="text-2xl font-bold text-primary">
                        {currentSubjects.length > 0 ? 
                          (currentSubjects.reduce((sum, s) => sum + s.finalTotal, 0) / currentSubjects.length).toFixed(1) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <Button 
              onClick={saveAllMarks} 
              className="w-full" 
              size="lg"
              disabled={isSaving || currentSubjects.length === 0}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save All Marks
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Attendance Dialog */}
      <Dialog open={isAddingAttendance} onOpenChange={setIsAddingAttendance}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Record Attendance
            </DialogTitle>
            <DialogDescription>
              Mark attendance for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
            
            {currentSubjects.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No subjects found.</p>
                <p className="text-xs">Please add subjects in Marks section first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                  {currentSubjects.map((subject) => (
                    <div 
                      key={subject.subjectCode}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{subject.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className={`text-xs font-medium ${subjectAttendance[subject.subjectCode] ? 'text-green-600' : 'text-red-600'}`}>
                          {subjectAttendance[subject.subjectCode] ? 'Present' : 'Absent'}
                        </span>
                        <Switch
                          checked={subjectAttendance[subject.subjectCode] || false}
                          onCheckedChange={(checked) => 
                            setSubjectAttendance(prev => ({ ...prev, [subject.subjectCode]: checked }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Today&apos;s Attendance:</span>
                  <span className="font-medium">
                    {Object.values(subjectAttendance).filter(Boolean).length} / {currentSubjects.length} Present
                  </span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSaveAttendance} 
              className="w-full" 
              disabled={isSaving || currentSubjects.length === 0}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Attendance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
