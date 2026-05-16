"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Loader2, CheckCircle, Brain, Sparkles, User } from "lucide-react"
import { toast } from "sonner"
import { getPredictionWithFeedback, type PredictionInput } from "@/lib/api"
import { useUserData } from "@/hooks/useFirestore"

export default function StudentInputPage() {
  const { userData, loading: userLoading } = useUserData()
  
  const [formData, setFormData] = useState({
    cgpa: "",
    credits: "",
    extraCurricular: "",
    projects: "",
    selfStudy: "",
    assignment: [90],
    engagement: [70],
    contribution: [60],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prediction, setPrediction] = useState<{
    grade: string
    passProbability: number
    risk: string
    improvementPotential: number
    feedback?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation - check if user data is available
    if (!userData?.name || !userData?.studentId) {
      toast.error("Profile data not found. Please complete your profile first.")
      return
    }

    if (!formData.cgpa || !formData.credits || !formData.extraCurricular || 
        !formData.projects || !formData.selfStudy) {
      toast.error("Please fill in all academic metrics")
      return
    }

    setIsSubmitting(true)
    setPrediction(null)

    try {
      // Prepare input for API
      const input: PredictionInput = {
        cgpa: parseFloat(formData.cgpa),
        credits: parseInt(formData.credits),
        extraCurricular: parseInt(formData.extraCurricular),
        projects: parseInt(formData.projects),
        selfStudy: parseInt(formData.selfStudy),
        assignment: formData.assignment[0] / 100, // Convert to 0-1 range
        engagement: formData.engagement[0] / 10, // Convert to 0-10 range (slider is 0-100)
        contribution: formData.contribution[0] / 10, // Convert to 0-10 range
      }

      // Call the API
      const response = await getPredictionWithFeedback(input)

      if (response.success) {
        setPrediction({
          grade: response.prediction.grade,
          passProbability: response.prediction.passProbability,
          risk: response.prediction.risk,
          improvementPotential: response.prediction.improvementPotential,
          feedback: response.prediction.feedback,
        })
        toast.success("AI Prediction Generated Successfully!")
      } else {
        toast.error("Failed to generate prediction")
      }
    } catch (error) {
      console.error("Prediction error:", error)
      toast.error("Failed to connect to AI backend. Please ensure the backend server is running.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-green-500/10 text-green-500"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500"
      case "High":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Student Input</h1>
        <p className="mt-1 text-xs sm:text-sm lg:text-base text-muted-foreground">Enter student data to generate AI-powered predictions</p>
      </motion.div>

      <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 xl:grid-cols-2">
        {/* Input Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span>Student Data Entry</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Fill in the details to generate performance predictions</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Student Profile Info - Auto-populated from profile */}
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <Avatar className="h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0">
                      {userData?.photoURL && <AvatarImage src={userData.photoURL} alt={userData?.name || "Student"} />}
                      <AvatarFallback>
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-semibold text-xs sm:text-sm truncate">{userLoading ? "Loading..." : (userData?.name || "Not set")}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{userData?.studentId || "No Roll Number"}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0 px-1.5 sm:px-2">{userData?.department || "N/A"}</Badge>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                    Profile loaded automatically. Update profile to change.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cgpa" className="text-xs sm:text-sm">CGPA (0-10) *</Label>
                      <Input
                        id="cgpa"
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        placeholder="e.g., 7.5"
                        className="h-8 sm:h-9 text-sm"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="credits" className="text-xs sm:text-sm">Credits *</Label>
                      <Input
                        id="credits"
                        type="number"
                        min={0}
                        placeholder="e.g., 120"
                        className="h-8 sm:h-9 text-sm"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="extraCurricular" className="text-xs sm:text-sm">Extra Activities *</Label>
                      <Input
                        id="extraCurricular"
                        type="number"
                        min={0}
                        placeholder="Count"
                        className="h-8 sm:h-9 text-sm"
                        value={formData.extraCurricular}
                        onChange={(e) => setFormData({ ...formData, extraCurricular: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="projects" className="text-xs sm:text-sm">Projects *</Label>
                      <Input
                        id="projects"
                        type="number"
                        min={0}
                        placeholder="Count"
                        className="h-8 sm:h-9 text-sm"
                        value={formData.projects}
                        onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="selfStudy" className="text-xs sm:text-sm">Self-Study Hours/Day *</Label>
                    <Input
                      id="selfStudy"
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="e.g., 3"
                      className="h-8 sm:h-9 text-sm"
                      value={formData.selfStudy}
                      onChange={(e) => setFormData({ ...formData, selfStudy: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs sm:text-sm">Assignment Completion</Label>
                      <span className="text-xs sm:text-sm font-medium text-primary">{formData.assignment[0]}%</span>
                    </div>
                    <Slider
                      value={formData.assignment}
                      onValueChange={(value) => setFormData({ ...formData, assignment: value })}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs sm:text-sm">Subject Engagement</Label>
                      <span className="text-xs sm:text-sm font-medium text-primary">{(formData.engagement[0] / 10).toFixed(1)}/10</span>
                    </div>
                    <Slider
                      value={formData.engagement}
                      onValueChange={(value) => setFormData({ ...formData, engagement: value })}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs sm:text-sm">Faculty Contribution</Label>
                      <span className="text-xs sm:text-sm font-medium text-primary">{(formData.contribution[0] / 10).toFixed(1)}/10</span>
                    </div>
                    <Slider
                      value={formData.contribution}
                      onValueChange={(value) => setFormData({ ...formData, contribution: value })}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-9 sm:h-10 text-sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-xs sm:text-sm">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Generate AI Prediction</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prediction Result */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-secondary flex-shrink-0" />
                <span>AI Prediction Result</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Machine learning generated performance prediction</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {!prediction && !isSubmitting && (
                <div className="flex h-48 sm:h-64 flex-col items-center justify-center text-center px-4">
                  <Brain className="mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                    Enter student data and click &quot;Generate AI Prediction&quot; to see results
                  </p>
                </div>
              )}

              {isSubmitting && (
                <div className="flex h-48 sm:h-64 flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                  </motion.div>
                  <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">AI is analyzing student data...</p>
                </div>
              )}

              {prediction && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 sm:space-y-5"
                >
                  <Alert className="border-green-500/30 bg-green-500/10 py-2 sm:py-3">
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                    <AlertTitle className="text-green-500 text-xs sm:text-sm">Prediction Generated</AlertTitle>
                    <AlertDescription className="text-xs sm:text-sm">AI has successfully analyzed the student data.</AlertDescription>
                  </Alert>

                  <div className="grid gap-2 sm:gap-3 grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/30 p-2 sm:p-3 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Predicted Grade</p>
                      <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-bold text-primary">{prediction.grade}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-2 sm:p-3 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Pass Probability</p>
                      <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-bold text-secondary">{prediction.passProbability}%</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-2 sm:p-3 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Risk Level</p>
                      <div className="mt-0.5 sm:mt-1">
                        <Badge className={`text-[10px] sm:text-xs ${getRiskColor(prediction.risk)}`}>{prediction.risk}</Badge>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-2 sm:p-3 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Improvement</p>
                      <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-bold text-accent">{prediction.improvementPotential}/10</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs sm:text-sm font-medium">Confidence Score</p>
                    <div className="h-2 sm:h-3 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${prediction.passProbability}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  {prediction.feedback && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs sm:text-sm font-medium mb-1.5">AI Feedback</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{prediction.feedback}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
