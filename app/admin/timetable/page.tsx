"use client"

import { useEffect, useMemo, useState } from "react"
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore"
import { CalendarDays, Database, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { TIMETABLE_DAYS, parseTimetableCsv, sortSessions } from "@/lib/timetable"
import type { Timetable, TimetableSession } from "@/types/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const emptyForm = {
  classId: "",
  className: "",
  department: "",
  semester: "",
  classTeacher: "",
}

export default function AdminTimetablePage() {
  const [form, setForm] = useState(emptyForm)
  const [csvText, setCsvText] = useState("")
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const parsedSessions = useMemo(() => {
    try {
      return csvText.trim() ? sortSessions(parseTimetableCsv(csvText)) : []
    } catch {
      return []
    }
  }, [csvText])

  const fetchTimetables = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "timetables"), orderBy("updatedAt", "desc")))
      setTimetables(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Timetable)))
    } catch (error) {
      console.error(error)
      toast.error("Failed to load timetables")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimetables()
  }, [])

  const handleFileUpload = async (file?: File) => {
    if (!file) return
    setCsvText(await file.text())
  }

  const handleCreate = async () => {
    if (!form.classId || !form.className || !form.department || !form.semester) {
      toast.error("Fill class ID, class name, department, and semester")
      return
    }

    let sessions: TimetableSession[]
    try {
      sessions = sortSessions(parseTimetableCsv(csvText))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid CSV")
      return
    }

    if (!sessions.length) {
      toast.error("Upload a CSV with at least one session")
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, "timetables"), {
        ...form,
        sessions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success("Timetable uploaded")
      setForm(emptyForm)
      setCsvText("")
      await fetchTimetables()
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload timetable")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this timetable?")) return
    await deleteDoc(doc(db, "timetables", id))
    setTimetables(current => current.filter(item => item.id !== id))
    toast.success("Timetable deleted")
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/30">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-20 left-20 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-3 border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">Academic control plane</Badge>
            <h1 className="bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
              Timetable Manager
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Upload once, route automatically by class, and keep every student dashboard synchronized with the latest weekly grid.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ["Classes", timetables.length],
              ["Sessions", timetables.reduce((sum, item) => sum + (item.sessions?.length || 0), 0)],
              ["Ready", parsedSessions.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-cyan-400/15 bg-slate-950/70 shadow-xl shadow-cyan-950/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-300" />
              Upload timetable
            </CardTitle>
            <CardDescription>
              CSV columns: day,startTime,endTime,subjectCode,subjectName,faculty,room,isLab
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["classId", "Class ID", "MCA-III"],
                ["className", "Class Name", "MCA III SEMESTER"],
                ["department", "Department", "MCA"],
                ["semester", "Semester", "Sem-3"],
                ["classTeacher", "Class Teacher", "DR MOSES PRAVEEN"],
              ].map(([key, label, placeholder]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    value={form[key as keyof typeof form]}
                    placeholder={placeholder}
                    onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))}
                    className="border-white/10 bg-white/5"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>CSV file</Label>
              <Input type="file" accept=".csv,text/csv" onChange={event => handleFileUpload(event.target.files?.[0])} className="border-white/10 bg-white/5" />
            </div>

            <div className="space-y-2">
              <Label>CSV preview / paste area</Label>
              <Textarea
                rows={10}
                value={csvText}
                onChange={event => setCsvText(event.target.value)}
                placeholder={"day,startTime,endTime,subjectCode,subjectName,faculty,room,isLab\nMonday,08:45,09:45,BDA-KP,Big Data Analytics,Dr. Kumaar Praveen,Lab A,false"}
                className="border-white/10 bg-white/5 font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {parsedSessions.length} validated session{parsedSessions.length === 1 ? "" : "s"}
              </p>
              <Button onClick={handleCreate} disabled={saving} className="gap-2 bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Publish timetable
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-fuchsia-400/15 bg-slate-950/70 shadow-xl shadow-fuchsia-950/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-fuchsia-300" />
              Live preview
            </CardTitle>
            <CardDescription>What students will effectively inherit once this goes live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TIMETABLE_DAYS.map(day => {
              const count = parsedSessions.filter(session => session.day === day).length
              return (
                <div key={day} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="font-medium">{day}</span>
                  <Badge variant="outline" className="border-white/10 bg-white/5">{count} slots</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-slate-950/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-300" />
            Published timetables
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : timetables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timetables uploaded yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {timetables.map(timetable => (
                <div key={timetable.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{timetable.className}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{timetable.classTeacher || "Class teacher not set"}</p>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(timetable.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge>{timetable.classId}</Badge>
                    <Badge variant="outline">{timetable.department}</Badge>
                    <Badge variant="outline">{timetable.semester}</Badge>
                    <Badge variant="secondary">{sortSessions(timetable.sessions || []).length} sessions</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
