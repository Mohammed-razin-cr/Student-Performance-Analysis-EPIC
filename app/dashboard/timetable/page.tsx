"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { CalendarDays, Clock3, Loader2, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { db } from "@/lib/firebase"
import { TIMETABLE_DAYS, normalizeSemester, sortSessions } from "@/lib/timetable"
import { useUserData } from "@/hooks/useFirestore"
import type { Timetable, TimetableSession } from "@/types/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const formatTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 || 12
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`
}

const slotKey = (session: TimetableSession) => `${session.startTime}-${session.endTime}`

export default function StudentTimetablePage() {
  const { userData } = useUserData()
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const snapshot = await getDocs(collection(db, "timetables"))
      setTimetables(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Timetable)))
      setLoading(false)
    }
    load()
  }, [])

  const timetable = useMemo(() => {
    if (!userData) return undefined
    const exactClass = timetables.find(item => item.classId === userData.classId)
    if (exactClass) return exactClass

    const exactAcademicMatch = timetables.find(item =>
      item.department.toLowerCase() === userData.department?.toLowerCase()
      && normalizeSemester(item.semester) === normalizeSemester(userData.semester)
    )
    if (exactAcademicMatch) return exactAcademicMatch

    const sameDepartment = timetables.filter(item =>
      item.department.toLowerCase() === userData.department?.toLowerCase()
    )
    if (sameDepartment.length === 1) return sameDepartment[0]

    return timetables.length === 1 ? timetables[0] : undefined
  }, [timetables, userData])

  const sessions = sortSessions(timetable?.sessions || [])
  const sessionsByDay = Object.fromEntries(
    TIMETABLE_DAYS.map(day => [day, sessions.filter(session => session.day === day)])
  ) as Record<string, TimetableSession[]>

  const timeSlots = [...new Map(
    sessions.map(session => [slotKey(session), { key: slotKey(session), startTime: session.startTime, endTime: session.endTime }])
  ).values()].sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!timetable) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No timetable available yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">Once admin uploads your class timetable, it will appear here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/30"
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-20 left-24 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-3 border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">Weekly schedule</Badge>
            <h1 className="bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
              {timetable.className}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{timetable.classId}</Badge>
              <Badge variant="outline">{timetable.department}</Badge>
              <Badge variant="outline">{timetable.semester}</Badge>
              {timetable.classTeacher && <Badge variant="secondary">{timetable.classTeacher}</Badge>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Days", TIMETABLE_DAYS.length],
              ["Classes", sessions.filter(session => !session.isLab).length],
              ["Labs", sessions.filter(session => session.isLab).length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <Card className="hidden overflow-hidden border-white/10 bg-slate-950/70 backdrop-blur lg:block">
        <CardContent className="p-0">
          <div className="grid grid-cols-[150px_repeat(6,minmax(180px,1fr))] border-b border-white/10 bg-white/[0.03]">
            <div className="px-5 py-4 text-sm font-semibold text-slate-300">Time</div>
            {TIMETABLE_DAYS.map(day => (
              <div key={day} className="border-l border-white/10 px-4 py-4 text-center font-semibold">
                {day}
              </div>
            ))}
          </div>

          {timeSlots.map(slot => (
            <div key={slot.key} className="grid grid-cols-[150px_repeat(6,minmax(180px,1fr))] border-b border-white/10 last:border-b-0">
              <div className="flex items-center gap-2 px-5 py-4 text-sm text-slate-300">
                <Clock3 className="h-4 w-4 text-cyan-300" />
                <span>{formatTime(slot.startTime)}<br />{formatTime(slot.endTime)}</span>
              </div>
              {TIMETABLE_DAYS.map(day => {
                const session = sessionsByDay[day].find(item => slotKey(item) === slot.key)
                return (
                  <div key={`${day}-${slot.key}`} className="min-h-[108px] border-l border-white/10 p-3">
                    {session ? (
                      <div className={`h-full rounded-2xl border p-3 ${
                        session.isLab
                          ? "border-fuchsia-400/25 bg-fuchsia-400/10"
                          : "border-cyan-400/20 bg-cyan-400/[0.07]"
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug">{session.subjectName}</p>
                          {session.isLab && <Sparkles className="h-4 w-4 shrink-0 text-fuchsia-300" />}
                        </div>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{session.subjectCode}</p>
                        <p className="mt-3 text-xs leading-relaxed text-slate-300">{session.faculty}</p>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground/60">—</div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </CardContent>
      </Card>
      </motion.div>

      <div className="space-y-4 lg:hidden">
        {TIMETABLE_DAYS.map((day, index) => (
          <motion.div key={day} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
          <Card className="overflow-hidden border-white/10 bg-slate-950/70 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <h2 className="font-semibold">{day}</h2>
              <Badge variant="outline" className="border-white/10 bg-white/5">{sessionsByDay[day].length} slots</Badge>
            </div>
            <CardContent className="space-y-3 p-4">
              {sessionsByDay[day].length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No classes</p>
              ) : sessionsByDay[day].map((session, index) => (
                <div key={`${session.day}-${session.startTime}-${index}`} className={`rounded-2xl border p-4 ${
                  session.isLab ? "border-fuchsia-400/25 bg-fuchsia-400/10" : "border-cyan-400/20 bg-cyan-400/[0.07]"
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{session.subjectName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">{session.subjectCode}</p>
                    </div>
                    {session.isLab && <Sparkles className="h-4 w-4 text-fuchsia-300" />}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <Clock3 className="h-4 w-4 text-cyan-300" />
                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{session.faculty}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
