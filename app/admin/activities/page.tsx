"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, Search, Save, Loader2, Plus, Edit, Calendar,
  Activity, Trophy, Music, Zap
} from "lucide-react"
import { toast } from "sonner"
import { useUserData } from "@/hooks/useFirestore"
import {
  getAllStudents,
  getAllStudentActivityMarks,
  saveStudentActivityMarks,
  addActivityMarkEntry,
} from "@/lib/firestore"
import type { User, StudentActivityMarks, ActivityMarks } from "@/types/firestore"

export default function ActivitiesPage() {
  const { userData } = useUserData()
  
  const [students, setStudents] = useState<User[]>([])
  const [activitiesData, setActivitiesData] = useState<Map<string, StudentActivityMarks>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)
  const [isAddingMarks, setIsAddingMarks] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    sports: [50],
    cultural: [50],
    technical: [50],
    classRoomActivity: [50],
    eventsCompetitions: [50],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [studentsData, activitiesDataArray] = await Promise.all([
          getAllStudents(),
          getAllStudentActivityMarks()
        ])
        
        setStudents(studentsData)
        
        const activitiesMap = new Map<string, StudentActivityMarks>()
        activitiesDataArray.forEach(activity => {
          activitiesMap.set(activity.userId, activity)
        })
        setActivitiesData(activitiesMap)
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

  const openAddMarks = (student: User) => {
    setSelectedStudent(student)
    const existingActivity = activitiesData.get(student.id)
    setFormData({
      sports: [existingActivity?.marks.sports || 50],
      cultural: [existingActivity?.marks.cultural || 50],
      technical: [existingActivity?.marks.technical || 50],
      classRoomActivity: [existingActivity?.marks.classRoomActivity || 50],
      eventsCompetitions: [existingActivity?.marks.eventsCompetitions || 50],
    })
    setIsAddingMarks(true)
  }

  const saveActivityMarks = async () => {
    if (!selectedStudent) return
    
    setIsSaving(true)
    try {
      const activityMark: ActivityMarks = {
        sports: formData.sports[0],
        cultural: formData.cultural[0],
        technical: formData.technical[0],
        classRoomActivity: formData.classRoomActivity[0],
        eventsCompetitions: formData.eventsCompetitions[0],
      }

      const existingData = activitiesData.get(selectedStudent.id)
      
      if (existingData) {
        // Update existing activity marks
        await addActivityMarkEntry(selectedStudent.id, activityMark)
      } else {
        // Create new activity marks record
        await saveStudentActivityMarks(selectedStudent.id, {
          userId: selectedStudent.id,
          studentId: selectedStudent.studentId || '',
          studentName: selectedStudent.name,
          department: selectedStudent.department || '',
          marks: activityMark,
        })
      }

      toast.success("Activity marks saved successfully!")
      
      // Refresh data
      const updated = await getAllStudentActivityMarks()
      const activitiesMap = new Map<string, StudentActivityMarks>()
      updated.forEach(activity => activitiesMap.set(activity.userId, activity))
      setActivitiesData(activitiesMap)
      
      setIsAddingMarks(false)
    } catch (err) {
      console.error("Error saving marks:", err)
      toast.error("Failed to save activity marks")
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
          Manage Activity Marks
        </h1>
        <p className="text-muted-foreground mt-1">
          Add and manage student activity participation marks (Sports, Cultural, Technical)
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
                placeholder="Search students by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Student Activity Marks
            </CardTitle>
            <CardDescription>
              View and manage activity participation records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Sports</TableHead>
                  <TableHead>Cultural</TableHead>
                  <TableHead>Technical</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const activity = activitiesData.get(student.id)
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId || 'N/A'}</TableCell>
                      <TableCell>{student.department || 'N/A'}</TableCell>
                      <TableCell>
                        {activity ? (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            {activity.marks.sports}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {activity.marks.cultural}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity ? (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {activity.marks.technical}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {activity.marks.classRoomActivity}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity ? (
                          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                            {activity.marks.eventsCompetitions}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {activity 
                          ? new Date(activity.lastUpdated.toDate()).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openAddMarks(student)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Marks Dialog */}
      <Dialog open={isAddingMarks} onOpenChange={setIsAddingMarks}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Activity Marks</DialogTitle>
            <DialogDescription>
              Add activity participation marks for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 max-h-[500px] overflow-y-auto">
            {/* Sports */}
            <div>
              <Label className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-orange-500" />
                Sports: {formData.sports[0]}%
              </Label>
              <Slider
                value={formData.sports}
                onValueChange={(value) => setFormData({ ...formData, sports: value })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Cultural */}
            <div>
              <Label className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-500" />
                Cultural: {formData.cultural[0]}%
              </Label>
              <Slider
                value={formData.cultural}
                onValueChange={(value) => setFormData({ ...formData, cultural: value })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Technical */}
            <div>
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Technical: {formData.technical[0]}%
              </Label>
              <Slider
                value={formData.technical}
                onValueChange={(value) => setFormData({ ...formData, technical: value })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Classroom Activity */}
            <div>
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                Classroom Activity: {formData.classRoomActivity[0]}%
              </Label>
              <Slider
                value={formData.classRoomActivity}
                onValueChange={(value) => setFormData({ ...formData, classRoomActivity: value })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Events/Competitions */}
            <div>
              <Label className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-pink-500" />
                Events/Competitions: {formData.eventsCompetitions[0]}%
              </Label>
              <Slider
                value={formData.eventsCompetitions}
                onValueChange={(value) => setFormData({ ...formData, eventsCompetitions: value })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddingMarks(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveActivityMarks}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Marks
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}