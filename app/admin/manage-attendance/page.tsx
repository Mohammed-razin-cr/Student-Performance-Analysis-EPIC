"use client"

import { useState, useEffect, useRef } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Users, Search, Calendar, Upload, Loader2, Save, Download, Bell, Mail, Send, Phone
} from "lucide-react"
import { toast } from "sonner"
import { useUserData } from "@/hooks/useFirestore"
import { 
  getAllStudents, 
  getAllStudentMarks, 
  updateStudentMarks,
  saveStudentMarks
} from "@/lib/firestore"
import type { User, StudentMarks } from "@/types/firestore"
import * as XLSX from "xlsx"

export default function ManageAttendancePage() {
  const { userData } = useUserData()
  
  const [students, setStudents] = useState<User[]>([])
  const [marksData, setMarksData] = useState<Map<string, StudentMarks>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSendingAlert, setIsSendingAlert] = useState<string | null>(null) // Student ID or 'bulk'
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [studentsData, marksDataArray] = await Promise.all([
        getAllStudents(),
        getAllStudentMarks(),
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

  useEffect(() => {
    if (userData?.role === "admin") {
      fetchData()
    }
  }, [userData])

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { USN: "p19mt24s126083", Name: "Razin", "Attendance %": 85 },
      { USN: "...", Name: "...", "Attendance %": 0 },
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Attendance")
    XLSX.writeFile(wb, "Attendance_Template.xlsx")
    toast.success("Template downloaded!")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      let updatedCount = 0
      let notFoundCount = 0

      for (const row of jsonData as any[]) {
        const rowUsn = String(row["USN"] || row["Student ID"] || row["studentId"] || "").trim().toLowerCase()
        const rowAttendance = Number(row["Attendance %"] || row["Attendance"] || 0)
        
        if (!rowUsn) continue

        // Find the student matching the USN (case insensitive)
        const matchedStudent = students.find(s => 
          (s.usn || "").toLowerCase() === rowUsn || 
          (s.studentId || "").toLowerCase() === rowUsn
        )

        if (matchedStudent) {
          const clampedAttendance = Math.min(100, Math.max(0, rowAttendance))
          const existingMarks = marksData.get(matchedStudent.id)

          if (existingMarks) {
            await updateStudentMarks(matchedStudent.id, {
              attendancePercentage: clampedAttendance
            })
          } else {
             // Create a base marks document if they don't have one
            await saveStudentMarks({
              userId: matchedStudent.id,
              studentId: matchedStudent.studentId || matchedStudent.usn || '',
              studentName: matchedStudent.name || "Unknown",
              department: matchedStudent.department || '',
              subjects: [],
              totalMarks: 0,
              totalPercentage: 0,
              rank: 0,
              exams: [],
              attendance: [],
              attendancePercentage: clampedAttendance,
            })
          }
          updatedCount++
        } else {
          notFoundCount++
        }
      }

      await fetchData() // Refresh DB
      
      toast.success(`Successfully uploaded attendance for ${updatedCount} students.`)
      if (notFoundCount > 0) {
        toast.warning(`${notFoundCount} records skipped (Student ID not found).`)
      }

    } catch (err) {
      console.error(err)
      toast.error("Failed to parse Excel file.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
         fileInputRef.current.value = ""
      }
    }
  }

  // Quick Inline Save for Attendance
  const handleQuickSave = async (studentId: string, value: string) => {
    const clamped = Math.min(100, Math.max(0, Number(value) || 0))
    const existingMarks = marksData.get(studentId)
    const student = students.find(s => s.id === studentId)

    try {
        if (existingMarks) {
            await updateStudentMarks(studentId, {
                attendancePercentage: clamped
            })
        } else if (student) {
            await saveStudentMarks({
                userId: studentId,
                studentId: student.studentId || student.usn || '',
                studentName: student.name || "Unknown",
                department: student.department || '',
                subjects: [],
                totalMarks: 0,
                totalPercentage: 0,
                rank: 0,
                exams: [],
                attendance: [],
                attendancePercentage: clamped,
            })
        }
    } catch(e) {
        console.error("Error inline saving", e)
    }
  }

  const sendAlert = async (student: User, attendance: number) => {
    if (!student.email || !student.phone) {
      return { success: false, message: `Missing email or phone for ${student.name}` }
    }

    try {
      const response = await fetch('/api/attendance-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          email: student.email,
          phone: student.phone,
          attendance: attendance
        })
      })

      const data = await response.json()
      if (data.success) {
        return { success: true }
      } else {
        const errorMsg = data.error || (data.errors && data.errors[0]) || "Server error"
        return { success: false, message: errorMsg }
      }
    } catch (e: any) {
      return { success: false, message: e.message || "Network error" }
    }
  }

  const handleSendIndividualAlert = async (student: User, attendance: number) => {
    setIsSendingAlert(student.id)
    const result = await sendAlert(student, attendance)
    
    if (result.success) {
      toast.success(`Email alert sent to ${student.name}`)
    } else {
      toast.warning(`Email Alert failed: ${result.message}. Trying WhatsApp...`)
    }

    // Always attempt WhatsApp if phone exists
    if (student.phone) {
      const waMessage = encodeURIComponent(`Dear ${student.name}, your attendance is below 75% (Current: ${attendance}%). Please attend classes regularly and maintain the required attendance.`)
      const waNumber = (student.phone || "").replace(/\D/g, '')
      if (waNumber) {
        window.open(`https://wa.me/${waNumber}?text=${waMessage}`, '_blank')
      } else {
        toast.error("Invalid phone number format for WhatsApp.")
      }
    } else {
      toast.error("No phone number found for WhatsApp alert.")
    }
    
    setIsSendingAlert(null)
  }

  const handleBulkAlert = async () => {
    const lowAttendanceStudents = students.filter(s => {
      const marks = marksData.get(s.id)
      return (marks?.attendancePercentage || 0) < 75
    })

    if (lowAttendanceStudents.length === 0) {
      toast.info("No students with low attendance found.")
      return
    }

    if (!confirm(`Are you sure you want to send alerts to ${lowAttendanceStudents.length} students?`)) {
      return
    }

    setIsSendingAlert('bulk')
    let successCount = 0
    
    for (const student of lowAttendanceStudents) {
      const marks = marksData.get(student.id)
      const result = await sendAlert(student, marks?.attendancePercentage || 0)
      if (result.success) successCount++
    }

    toast.success(`Bulk alerts completed: ${successCount}/${lowAttendanceStudents.length} sent successfully.`)
    setIsSendingAlert(null)
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
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div className="flex-1">
           <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
             Manage Attendance
           </h1>
           <p className="text-muted-foreground mt-1">
             Upload an Excel file to bulk update student attendance, or edit individually.
           </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
           <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
           </Button>
           <Button 
             className="cursor-pointer" 
             onClick={() => fileInputRef.current?.click()} 
             disabled={isUploading}
           >
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload Excel
           </Button>
           <Button 
             variant="destructive"
             onClick={handleBulkAlert}
             disabled={!!isSendingAlert}
           >
              {isSendingAlert === 'bulk' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
              Bulk Alert ({"<"} 75%)
           </Button>
           <input 
             type="file" 
             accept=".xlsx,.xls,.csv" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handleFileUpload}
           />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-secondary/10">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.filter(s => marksData.get(s.id)?.attendancePercentage !== undefined).length}
                </p>
                <p className="text-sm text-muted-foreground">With Attendance Data</p>
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
              placeholder="Search students by name, email, or USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Edit attendance for individual students below. Changes simulate save-on-blur or hit enter.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
               <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Student</TableHead>
                  <TableHead className="min-w-[150px] text-center">USN / ID</TableHead>
                  <TableHead className="min-w-[150px]">Contact Info</TableHead>
                  <TableHead className="min-w-[120px] text-center">Attendance %</TableHead>
                  <TableHead className="min-w-[100px] text-center">Status</TableHead>
                  <TableHead className="min-w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => {
                  const marks = marksData.get(student.id)
                  const initials = student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
                  const attendanceVal = marks?.attendancePercentage || 0
                
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
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-center">
                         {student.usn || student.studentId || 'N/A'}
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                               <Mail className="h-3 w-3" /> {student.email}
                            </span>
                            <span className={`text-xs flex items-center gap-1 ${!student.phone ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                               <Phone className="h-3 w-3" /> {student.phone || "No Phone Set"}
                            </span>
                         </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center justify-center gap-2 max-w-[120px] mx-auto">
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              className="h-8 w-16 text-center px-1"
                              defaultValue={attendanceVal}
                              onBlur={(e) => {
                                 if (Number(e.target.value) !== attendanceVal) {
                                     handleQuickSave(student.id, e.target.value);
                                     setMarksData(prev => {
                                         const clone = new Map(prev)
                                         const m = clone.get(student.id) || {} as StudentMarks
                                         clone.set(student.id, { ...m, attendancePercentage: Math.min(100, Math.max(0, Number(e.target.value))) })
                                         return clone
                                     })
                                     toast.success(`Saved attendance for ${student.name}`)
                                 }
                              }}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                      e.currentTarget.blur()
                                  }
                              }}
                            />
                            <span className="text-muted-foreground text-sm font-medium">%</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge variant={attendanceVal >= 75 ? "default" : "destructive"} className="px-3 py-0.5">
                            {attendanceVal >= 75 ? "Good" : "Low"}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                         {attendanceVal < 75 && (
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-8 text-destructive border-destructive hover:bg-destructive/10"
                             onClick={() => handleSendIndividualAlert(student, attendanceVal)}
                             disabled={!!isSendingAlert}
                           >
                             {isSendingAlert === student.id ? (
                               <Loader2 className="h-3 w-3 animate-spin" />
                             ) : (
                               <>
                                 <Send className="h-3 w-3 mr-1" />
                                 Alert
                               </>
                             )}
                           </Button>
                         )}
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
