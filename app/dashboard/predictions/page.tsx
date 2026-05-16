"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PredictionCard } from "@/components/prediction-card"
import { SkeletonCard } from "@/components/skeleton-card"
import { Brain, Search, Filter, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { getAllStudents, getAllStudentMarks, getStudentMarks } from "@/lib/firestore"
import type { User, StudentMarks } from "@/types/firestore"
import { toast } from "sonner"

interface PredictionData {
  studentName: string
  predictedGrade: string
  passProbability: number
  trend: "up" | "down" | "stable"
}

export default function PredictionsPage() {
  const { user } = useAuth()
  const { userData } = useUserData()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [stats, setStats] = useState({
    highPerformers: 0,
    average: 0,
    needAttention: 0,
    atRisk: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        if (userData?.role === "admin") {
          // Admin: Get all students predictions
          const [students, allMarks] = await Promise.all([
            getAllStudents(),
            getAllStudentMarks()
          ])
          
          const marksMap = new Map<string, StudentMarks>()
          allMarks.forEach(mark => marksMap.set(mark.userId, mark))
          
          const predictionData: PredictionData[] = students.map(student => {
            const marks = marksMap.get(student.id)
            const totalPercentage = marks?.totalPercentage || 0
            const attendancePercentage = marks?.attendancePercentage || 0
            
            // Calculate predicted grade based on current performance
            let predictedGrade = "N/A"
            let passProbability = 0
            
            if (marks?.subjects && marks.subjects.length > 0) {
              // Simple prediction based on current marks
              if (totalPercentage >= 85) {
                predictedGrade = "A+"
                passProbability = Math.min(98, totalPercentage + 5)
              } else if (totalPercentage >= 75) {
                predictedGrade = "A"
                passProbability = Math.min(95, totalPercentage + 8)
              } else if (totalPercentage >= 65) {
                predictedGrade = "B+"
                passProbability = Math.min(90, totalPercentage + 10)
              } else if (totalPercentage >= 55) {
                predictedGrade = "B"
                passProbability = Math.min(85, totalPercentage + 12)
              } else if (totalPercentage >= 45) {
                predictedGrade = "C+"
                passProbability = Math.min(75, totalPercentage + 15)
              } else if (totalPercentage >= 40) {
                predictedGrade = "C"
                passProbability = totalPercentage + 10
              } else {
                predictedGrade = "D"
                passProbability = Math.max(30, totalPercentage)
              }
              
              // Adjust based on attendance
              if (attendancePercentage < 75) {
                passProbability = Math.max(0, passProbability - 10)
              }
            }
            
            // Determine trend (simplified - could be based on historical data)
            let trend: "up" | "down" | "stable" = "stable"
            if (totalPercentage >= 70) trend = "up"
            else if (totalPercentage < 50) trend = "down"
            
            return {
              studentName: student.name || "Unknown",
              predictedGrade,
              passProbability: Math.round(passProbability),
              trend
            }
          }).filter(p => p.predictedGrade !== "N/A")
          
          setPredictions(predictionData)
          
          // Calculate stats
          setStats({
            highPerformers: predictionData.filter(p => p.predictedGrade === "A+" || p.predictedGrade === "A").length,
            average: predictionData.filter(p => p.predictedGrade === "B+" || p.predictedGrade === "B").length,
            needAttention: predictionData.filter(p => p.predictedGrade === "C+" || p.predictedGrade === "C").length,
            atRisk: predictionData.filter(p => p.predictedGrade === "D" || p.passProbability < 50).length
          })
        } else {
          // Student: Get only their own prediction
          const marks = await getStudentMarks(user.uid)
          
          if (marks) {
            const totalPercentage = marks.totalPercentage || 0
            const attendancePercentage = marks.attendancePercentage || 0
            
            let predictedGrade = "N/A"
            let passProbability = 0
            
            if (marks.subjects && marks.subjects.length > 0) {
              if (totalPercentage >= 85) {
                predictedGrade = "A+"
                passProbability = Math.min(98, totalPercentage + 5)
              } else if (totalPercentage >= 75) {
                predictedGrade = "A"
                passProbability = Math.min(95, totalPercentage + 8)
              } else if (totalPercentage >= 65) {
                predictedGrade = "B+"
                passProbability = Math.min(90, totalPercentage + 10)
              } else if (totalPercentage >= 55) {
                predictedGrade = "B"
                passProbability = Math.min(85, totalPercentage + 12)
              } else if (totalPercentage >= 45) {
                predictedGrade = "C+"
                passProbability = Math.min(75, totalPercentage + 15)
              } else if (totalPercentage >= 40) {
                predictedGrade = "C"
                passProbability = totalPercentage + 10
              } else {
                predictedGrade = "D"
                passProbability = Math.max(30, totalPercentage)
              }
              
              if (attendancePercentage < 75) {
                passProbability = Math.max(0, passProbability - 10)
              }
            }
            
            let trend: "up" | "down" | "stable" = "stable"
            if (totalPercentage >= 70) trend = "up"
            else if (totalPercentage < 50) trend = "down"
            
            setPredictions([{
              studentName: userData?.name || "You",
              predictedGrade,
              passProbability: Math.round(passProbability),
              trend
            }])
          }
        }
      } catch (err) {
        console.error("Error fetching predictions:", err)
        toast.error("Failed to load predictions")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, userData])

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = gradeFilter === "all" || p.predictedGrade.startsWith(gradeFilter)
    return matchesSearch && matchesGrade
  })

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">AI Predictions</h1>
        <p className="mt-1 text-muted-foreground">
          {userData?.role === "admin" 
            ? "Machine learning powered performance predictions for all students" 
            : "Your predicted performance based on current marks"}
        </p>
      </motion.div>

      {/* Summary Cards - Only for Admin */}
      {userData?.role === "admin" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-500">{stats.highPerformers}</span>
                <Badge className="bg-green-500/10 text-green-500">A/A+</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-500">{stats.average}</span>
                <Badge className="bg-blue-500/10 text-blue-500">B/B+</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Need Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-500">{stats.needAttention}</span>
                <Badge className="bg-yellow-500/10 text-yellow-500">C/C+</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-500">{stats.atRisk}</span>
                <Badge className="bg-red-500/10 text-red-500">D/F</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Student Predictions
          </CardTitle>
          <CardDescription>AI-generated performance predictions with confidence scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">A Grade</SelectItem>
                <SelectItem value="B">B Grade</SelectItem>
                <SelectItem value="C">C Grade</SelectItem>
                <SelectItem value="D">D Grade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No predictions available</p>
              <p className="text-sm">
                {predictions.length === 0 
                  ? "Add marks data to generate predictions" 
                  : "No students match your search criteria"}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid gap-4 sm:grid-cols-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {filteredPredictions.map((prediction, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <PredictionCard {...prediction} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
