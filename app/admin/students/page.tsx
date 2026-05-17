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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Users, Search, Download, Plus, Edit, Trash2, 
  GraduationCap, TrendingUp, Award, Calendar,
  Loader2, Eye, FileText, BarChart3, Mail, Phone,
  Building, BookOpen, UserCircle, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { useUserData } from "@/hooks/useFirestore"
import { 
  getAllStudents, 
  getAllStudentMarks, 
  updateUserDocument,
  deleteUserDocument,
  createUserDocument
} from "@/lib/firestore"
import type { User, StudentMarks } from "@/types/firestore"
import { Timestamp, doc, setDoc } from 'firebase/firestore'
import { db } from "@/lib/firebase"

export default function AllStudentsPage() {
  const { userData } = useUserData()
  
  const [students, setStudents] = useState<User[]>([])
  const [marksData, setMarksData] = useState<Map<string, StudentMarks>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)
  const [isViewingStudent, setIsViewingStudent] = useState(false)
  const [isEditingStudent, setIsEditingStudent] = useState(false)
  const [isDeletingStudent, setIsDeletingStudent] = useState(false)
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    semester: "",
    classId: "",
    school: "East Point College of Higher Education",
    phone: "",
    age: "",
  })

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
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditStudent = async () => {
    if (!selectedStudent) return
    
    setIsSaving(true)
    try {
      await updateUserDocument(selectedStudent.id, editForm)
      
      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id ? { ...s, ...editForm } : s
      ))
      
      toast.success("Student updated successfully!")
      setIsEditingStudent(false)
      setSelectedStudent(null)
      setEditForm({})
    } catch (err) {
      console.error(err)
      toast.error("Failed to update student")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return
    
    setIsSaving(true)
    try {
      await deleteUserDocument(selectedStudent.id)
      
      // Remove from local state
      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id))
      
      toast.success("Student deleted successfully!")
      setIsDeletingStudent(false)
      setSelectedStudent(null)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete student")
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = (student: User) => {
    setSelectedStudent(student)
    setEditForm({
      name: student.name,
      studentId: student.studentId,
      department: student.department,
      semester: student.semester,
      classId: student.classId,
      school: student.school,
      phone: student.phone,
    })
    setIsEditingStudent(true)
  }

  const handleAddStudent = async () => {
    if (!newStudentForm.name || !newStudentForm.email) {
      toast.error("Name and email are required")
      return
    }

    setIsSaving(true)
    try {
      const studentId = `student_${Date.now()}`
      const now = Timestamp.now()
      
      const newStudent = {
        id: studentId,
        name: newStudentForm.name,
        email: newStudentForm.email,
        role: 'student' as const,
        studentId: newStudentForm.studentId || `EP${Date.now().toString().slice(-8)}`,
        department: newStudentForm.department,
        semester: newStudentForm.semester,
        classId: newStudentForm.classId,
        school: newStudentForm.school,
        phone: newStudentForm.phone,
        age: newStudentForm.age ? parseInt(newStudentForm.age) : undefined,
        skills: [],
        interests: [],
        createdAt: now,
        updatedAt: now,
      }

      const userRef = doc(db, 'users', studentId)
      await setDoc(userRef, newStudent)
      
      // Add to local state
      setStudents(prev => [...prev, newStudent as User])
      
      toast.success(`Student ${newStudentForm.name} added successfully!`)
      setIsAddingStudent(false)
      setNewStudentForm({
        name: "",
        email: "",
        studentId: "",
        department: "",
        semester: "",
        classId: "",
        school: "East Point College of Higher Education",
        phone: "",
        age: "",
      })
    } catch (err) {
      console.error(err)
      toast.error("Failed to add student")
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
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            All Students
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all registered students
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setIsAddingStudent(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            {students.length} Students
          </Badge>
        </div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, student ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Records</CardTitle>
          <CardDescription>
            Complete list of all registered students with their academic details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Student</TableHead>
                  <TableHead className="min-w-[120px]">Student ID</TableHead>
                  <TableHead className="min-w-[100px]">Department</TableHead>
                  <TableHead className="min-w-[180px]">School</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredStudents.map((student, index) => {
                const marks = marksData.get(student.id)
                const initials = student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
                
                return (
                  <motion.tr
                    key={student.id || `student-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.photoURL} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {student.studentId || '-'}
                    </TableCell>
                    <TableCell>{student.department || '-'}</TableCell>
                    <TableCell className="text-sm">{student.school || '-'}</TableCell>
                    <TableCell>
                      {marks ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">No Data</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* View Student */}
                        <Dialog open={isViewingStudent && selectedStudent?.id === student.id} onOpenChange={(open) => {
                          if (!open) {
                            setIsViewingStudent(false)
                            setSelectedStudent(null)
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedStudent(student)
                                setIsViewingStudent(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Student Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={student.photoURL} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-lg font-semibold">{student.name}</h3>
                                  <p className="text-sm text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">ID:</span>
                                  <span className="font-medium">{student.studentId || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Dept:</span>
                                  <span className="font-medium">{student.department || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">School:</span>
                                  <span className="font-medium truncate">{student.school || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span className="font-medium">{student.phone || '-'}</span>
                                </div>
                              </div>

                              {marks && (
                                <div className="border-t pt-4">
                                  <h4 className="font-medium mb-3">Academic Performance</h4>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-primary">{marks.totalMarks}</p>
                                      <p className="text-xs text-muted-foreground">Total Marks</p>
                                    </div>
                                    <div className="bg-secondary/10 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-secondary">{marks.totalPercentage?.toFixed(1)}%</p>
                                      <p className="text-xs text-muted-foreground">Percentage</p>
                                    </div>
                                    <div className="bg-accent/10 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-accent">#{marks.rank || '-'}</p>
                                      <p className="text-xs text-muted-foreground">Rank</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {student.skills && student.skills.length > 0 && (
                                <div className="border-t pt-4">
                                  <h4 className="font-medium mb-2">Skills</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {student.skills.map((skill, i) => (
                                      <Badge key={i} variant="secondary">{skill}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {student.interests && student.interests.length > 0 && (
                                <div className="border-t pt-4">
                                  <h4 className="font-medium mb-2">Interests</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {student.interests.map((interest, i) => (
                                      <Badge key={i} variant="outline">{interest}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Edit Student */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Delete Student */}
                        <Dialog open={isDeletingStudent && selectedStudent?.id === student.id} onOpenChange={(open) => {
                          if (!open) {
                            setIsDeletingStudent(false)
                            setSelectedStudent(null)
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedStudent(student)
                                setIsDeletingStudent(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Student
                              </DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete {student.name}? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-3 pt-4">
                              <Button variant="outline" onClick={() => {
                                setIsDeletingStudent(false)
                                setSelectedStudent(null)
                              }}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={handleDeleteStudent} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      <Dialog open={isEditingStudent} onOpenChange={(open) => {
        if (!open) {
          setIsEditingStudent(false)
          setSelectedStudent(null)
          setEditForm({})
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.name || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Student's full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input
                value={editForm.studentId || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, studentId: e.target.value }))}
                placeholder="Student ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Department/Course</Label>
              <Select
                value={editForm.department || ""}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCA">MCA</SelectItem>
                  <SelectItem value="MBA">MBA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Input
                value={editForm.semester || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, semester: e.target.value }))}
                placeholder="e.g., Sem-3"
              />
            </div>
            <div className="space-y-2">
              <Label>Class ID</Label>
              <Input
                value={editForm.classId || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, classId: e.target.value }))}
                placeholder="e.g., MCA-III"
              />
            </div>
            <div className="space-y-2">
              <Label>School/College</Label>
              <Input
                value={editForm.school || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, school: e.target.value }))}
                placeholder="School or college name"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => {
                setIsEditingStudent(false)
                setSelectedStudent(null)
                setEditForm({})
              }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleEditStudent} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Student
            </DialogTitle>
            <DialogDescription>
              Add a new student to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Full Name *</Label>
                <Input
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter student's full name"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="student@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={newStudentForm.studentId}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, studentId: e.target.value }))}
                  placeholder="e.g., P18MT24S..."
                />
              </div>
              <div className="space-y-2">
                <Label>Department/Course</Label>
                <Select
                  value={newStudentForm.department}
                  onValueChange={(value) => setNewStudentForm(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCA">MCA</SelectItem>
                    <SelectItem value="MBA">MBA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Input
                  value={newStudentForm.semester}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, semester: e.target.value }))}
                  placeholder="e.g., Sem-3"
                />
              </div>
              <div className="space-y-2">
                <Label>Class ID</Label>
                <Input
                  value={newStudentForm.classId}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, classId: e.target.value }))}
                  placeholder="e.g., MCA-III"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>School/College</Label>
                <Input
                  value={newStudentForm.school}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, school: e.target.value }))}
                  placeholder="School or college name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newStudentForm.phone}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={newStudentForm.age}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Age"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddingStudent(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-secondary" onClick={handleAddStudent} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
