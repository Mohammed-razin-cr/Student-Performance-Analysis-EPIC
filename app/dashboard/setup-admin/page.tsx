"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Shield, Users, Database, Loader2, CheckCircle, AlertCircle,
  UserPlus, BookOpen, Plus, Trash2, Copy, ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { isAdminRole } from '@/lib/utils'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  Timestamp,
  query,
  where
} from 'firebase/firestore'
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Sample students data
const sampleStudents = [
  { name: "Priya Sharma", email: "priya.sharma@eastpoint.ac.in", department: "Computer Science", age: 19, studentId: "P18MT24S1260101" },
  { name: "Rahul Kumar", email: "rahul.kumar@eastpoint.ac.in", department: "Electronics", age: 21, studentId: "P18MT24S1260102" },
  { name: "Ananya Gupta", email: "ananya.gupta@eastpoint.ac.in", department: "Mechanical", age: 20, studentId: "P18MT24S1260103" },
  { name: "Mohammed Faisal", email: "mohammed.faisal@eastpoint.ac.in", department: "Computer Science", age: 22, studentId: "P18MT24S1260104" },
  { name: "Sneha Patel", email: "sneha.patel@eastpoint.ac.in", department: "Civil", age: 20, studentId: "P18MT24S1260105" },
]

const subjects = ["Mathematics", "Physics", "Chemistry", "English", "Computer Science"]

export default function SetupAdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { userData, loading: userLoading } = useUserData()
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [setupStatus, setSetupStatus] = useState({
    students: false,
    marks: false
  })

  useEffect(() => {
    if (isAdminRole(userData?.role)) {
      setIsAdmin(true)
    }
  }, [userData])

  const copyUserId = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid)
      toast.success("User ID copied to clipboard!")
    }
  }

  const addSampleStudents = async () => {
    if (!user) {
      toast.error("Please login first")
      return
    }

    setIsLoading(true)
    try {
      for (let i = 0; i < sampleStudents.length; i++) {
        const student = sampleStudents[i]
        const fakeUserId = `sample_student_${Date.now()}_${i}`
        const now = Timestamp.now()

        // Create user document
        const userRef = doc(db, 'users', fakeUserId)
        await setDoc(userRef, {
          id: fakeUserId,
          name: student.name,
          email: student.email,
          role: 'student',
          studentId: student.studentId,
          department: student.department,
          school: "East Point College of Higher Education",
          age: student.age,
          skills: ['Problem Solving', 'Team Work', 'Communication'],
          interests: ['Sports', 'Reading', 'Coding'],
          parentInfo: {
            mother: `${student.name.split(' ')[0]}'s Mother`,
            father: `${student.name.split(' ')[0]}'s Father`,
          },
          createdAt: now,
          updatedAt: now,
        })

        toast.success(`Added: ${student.name}`)
      }

      setSetupStatus(prev => ({ ...prev, students: true }))
      toast.success("🎉 All sample students added!")
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to add students: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addSampleMarks = async () => {
    if (!user) {
      toast.error("Please login first")
      return
    }

    setIsLoading(true)
    try {
      // Get all student users
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('role', '==', 'student'))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        toast.error("No students found. Add students first!")
        setIsLoading(false)
        return
      }

      let rank = 1
      for (const docSnap of snapshot.docs) {
        const studentData = docSnap.data()
        const studentId = docSnap.id
        const now = Timestamp.now()

        // Generate random marks
        const exams = subjects.map((subject, i) => ({
          examName: `Mid Term Exam`,
          subject,
          marksObtained: Math.floor(Math.random() * 30) + 70, // 70-100
          totalMarks: 100,
          percentage: 0,
          date: new Date(2025, i, 15).toISOString(),
        }))

        // Calculate percentages
        exams.forEach(exam => {
          exam.percentage = Math.round((exam.marksObtained / exam.totalMarks) * 100)
        })

        const totalMarks = exams.reduce((sum, e) => sum + e.marksObtained, 0)
        const totalPossible = exams.reduce((sum, e) => sum + e.totalMarks, 0)

        // Generate attendance
        const attendance = []
        for (let day = 1; day <= 20; day++) {
          const status = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late')
          attendance.push({
            date: new Date(2025, 0, day).toISOString().split('T')[0],
            status,
            subject: subjects[Math.floor(Math.random() * subjects.length)],
            ...(status === 'absent' ? { remarks: 'Medical leave' } : {})
          })
        }

        // Create marks document
        const marksRef = doc(db, 'studentMarks', studentId)
        await setDoc(marksRef, {
          userId: studentId,
          studentId: studentData.studentId || studentId,
          studentName: studentData.name || 'Unknown Student',
          department: studentData.department || 'General',
          exams,
          attendance,
          totalMarks,
          totalPercentage: Math.round((totalMarks / totalPossible) * 100),
          rank: rank++,
          lastUpdated: now,
        })

        toast.success(`Marks added for: ${studentData.name || 'Student'}`)
      }

      setSetupStatus(prev => ({ ...prev, marks: true }))
      toast.success("🎉 All marks added!")
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to add marks: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Database Setup
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add sample data to Firebase for testing
        </p>
      </motion.div>

      {/* Current User Info & Admin Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-white font-medium">{userData?.name || user?.email}</p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
              <Badge className={isAdmin ? 'bg-green-500' : 'bg-yellow-500'}>
                {userData?.role || 'student'}
              </Badge>
            </div>

            <Separator className="bg-gray-700" />

            {/* User ID for Admin Setup */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-white text-sm">Your User ID</Label>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">For Admin Setup</Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  value={user?.uid || ''}
                  readOnly
                  className="bg-slate-800 border-gray-600 text-gray-300 text-xs font-mono"
                />
                <Button variant="outline" size="icon" onClick={copyUserId} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {!isAdmin && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-400 text-sm font-medium mb-2">📋 To become an admin:</p>
                  <ol className="text-yellow-300/80 text-xs space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300">Firebase Console</a></li>
                    <li>Open your project → Firestore Database</li>
                    <li>Find collection <code className="bg-slate-700 px-1 rounded">users</code> → document with your User ID</li>
                    <li>Change <code className="bg-slate-700 px-1 rounded">role</code> field from "student" to "admin"</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}

              {isAdmin && (
                <div className="flex items-center gap-2 text-green-400 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You are an admin! You can manage students from the Admin Dashboard.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Setup Steps */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Add Sample Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Add Sample Students
              </CardTitle>
              <CardDescription className="text-gray-400">
                Add 5 sample students to test the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-gray-500 space-y-1">
                {sampleStudents.slice(0, 3).map((s, i) => (
                  <p key={i}>• {s.name} - {s.department}</p>
                ))}
                <p>• ... and 2 more</p>
              </div>

              <Button
                onClick={addSampleStudents}
                disabled={isLoading || setupStatus.students}
                variant={setupStatus.students ? "secondary" : "default"}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : setupStatus.students ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {setupStatus.students ? "Students Added" : "Add Sample Students"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Sample Marks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-yellow-400" />
                Add Sample Marks
              </CardTitle>
              <CardDescription className="text-gray-400">
                Add marks and attendance for all students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-gray-500 space-y-1">
                {subjects.map((s, i) => (
                  <p key={i}>• {s} - 70-100 marks</p>
                ))}
              </div>

              <Button
                onClick={addSampleMarks}
                disabled={isLoading || setupStatus.marks}
                variant={setupStatus.marks ? "secondary" : "default"}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : setupStatus.marks ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                {setupStatus.marks ? "Marks Added" : "Add Sample Marks"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Navigation */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <div>
                    <h3 className="text-white font-semibold">You're an Admin!</h3>
                    <p className="text-green-300/70 text-sm">Manage students from the admin dashboard</p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/admin')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to Admin Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
