"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Activity, Calendar, FileText, AlertTriangle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getStudentProfile } from "@/lib/firestore"
import type { StudentProfile } from "@/types/firestore"
import Link from "next/link"

interface MedicalRecord {
  id: string
  condition: string
  code: string
  status: "active" | "cured" | "monitoring"
  diagnosisDate: string
  lastUpdate: string
  notes: string
  history: {
    date: string
    event: string
    notes: string
  }[]
}

export default function MedicalHistoryPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        const profile = await getStudentProfile(user.uid)
        setStudentProfile(profile)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  // Medical records data
  const medicalRecords: MedicalRecord[] = [
    {
      id: "1",
      condition: "Anxiety disorder",
      code: "F41.9",
      status: "active",
      diagnosisDate: "2023-09-15",
      lastUpdate: "2025-12-20",
      notes: "Personal consultation recommended. Student shows signs of test anxiety and social anxiety in large group settings.",
      history: [
        { date: "2025-12-20", event: "Follow-up consultation", notes: "Slight improvement noted. Continue current treatment plan." },
        { date: "2025-10-15", event: "Therapy session", notes: "Cognitive behavioral therapy session completed." },
        { date: "2025-08-20", event: "Medication review", notes: "Dosage adjusted based on progress." },
        { date: "2024-03-10", event: "Initial diagnosis", notes: "Diagnosed with generalized anxiety disorder." },
        { date: "2023-09-15", event: "First consultation", notes: "Initial assessment and referral to specialist." },
      ]
    },
    {
      id: "2",
      condition: "Mild depressive episode",
      code: "F32.0",
      status: "cured",
      diagnosisDate: "2018-06-10",
      lastUpdate: "2019-08-03",
      notes: "Successfully treated. No recurrence observed.",
      history: [
        { date: "2019-08-03", event: "Final review", notes: "Patient discharged. Full recovery confirmed." },
        { date: "2019-05-15", event: "Progress review", notes: "Significant improvement. Medication tapered." },
        { date: "2019-02-20", event: "Therapy completed", notes: "Completed 12-week therapy program." },
        { date: "2018-09-10", event: "Treatment started", notes: "Began combination therapy and counseling." },
        { date: "2018-06-10", event: "Initial diagnosis", notes: "Mild depressive episode diagnosed following academic stress." },
      ]
    },
    {
      id: "3",
      condition: "ADHD - Inattentive type",
      code: "F90.0",
      status: "monitoring",
      diagnosisDate: "2022-01-20",
      lastUpdate: "2025-11-15",
      notes: "Under observation. Academic accommodations in place.",
      history: [
        { date: "2025-11-15", event: "Quarterly review", notes: "Stable condition. Current accommodations effective." },
        { date: "2025-08-01", event: "Start of school year", notes: "Accommodations renewed for new academic year." },
        { date: "2025-03-10", event: "Annual assessment", notes: "No significant changes. Continue monitoring." },
        { date: "2022-03-15", event: "Accommodations approved", notes: "Extended test time and preferential seating approved." },
        { date: "2022-01-20", event: "Initial diagnosis", notes: "ADHD diagnosed following comprehensive evaluation." },
      ]
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500">Active</Badge>
      case "cured":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">Cured</Badge>
      case "monitoring":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Monitoring</Badge>
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="h-5 w-5 text-red-400" />
      case "cured":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "monitoring":
        return <Activity className="h-5 w-5 text-yellow-400" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="border-primary text-primary hover:bg-primary hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Medical History</h1>
          <p className="text-gray-400">Complete medical and psychological records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{medicalRecords.filter(r => r.status === "active").length}</p>
                <p className="text-sm text-gray-400">Active Conditions</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Activity className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{medicalRecords.filter(r => r.status === "monitoring").length}</p>
                <p className="text-sm text-gray-400">Under Monitoring</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{medicalRecords.filter(r => r.status === "cured").length}</p>
                <p className="text-sm text-gray-400">Resolved</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Medical Records */}
      {medicalRecords.map((record, index) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * (index + 3) }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(record.status)}
                  <div>
                    <CardTitle className="text-lg text-white">{record.condition}</CardTitle>
                    <p className="text-sm text-gray-400">ICD-10: {record.code}</p>
                  </div>
                </div>
                {getStatusBadge(record.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">{record.notes}</p>
              
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Diagnosed: {new Date(record.diagnosisDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText className="h-4 w-4" />
                  <span>Last update: {new Date(record.lastUpdate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="pt-4 border-t border-slate-700">
                <h4 className="font-semibold text-white mb-4">History Timeline</h4>
                <div className="space-y-4">
                  {record.history.map((event, eventIndex) => (
                    <div key={eventIndex} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        {eventIndex < record.history.length - 1 && (
                          <div className="w-0.5 h-full bg-slate-700 mt-1"></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-white">{event.event}</p>
                        <p className="text-xs text-gray-400 mb-1">{new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-300">{event.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-b from-yellow-900/20 to-slate-800 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-500">Confidentiality Notice</h4>
                <p className="text-sm text-gray-400 mt-1">
                  This medical information is strictly confidential and protected under applicable privacy laws. 
                  Access is restricted to authorized personnel only. Unauthorized disclosure is prohibited.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
