"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Upload, FileText, Trash2, Download, BookOpen,
  Plus, X, Loader2, CheckCircle, AlertCircle, Search, Star
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { uploadRawToCloudinary } from "@/lib/cloudinary"

const DEPARTMENTS = ["MCA", "MBA", "BCA", "BBA", "B.Sc", "M.Sc", "B.Tech", "M.Tech"]
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"]

interface Note {
  _id: string
  title: string
  description: string
  subject: string
  department: string
  semester: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedByName: string
  downloads: number
  createdAt: string
  userRatings?: Record<string, number>
  avgRating?: number
}

export default function AdminNotesPage() {
  const { user } = useAuth()
  const { userData } = useUserData()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")

  const [form, setForm] = useState({
    title: "", description: "", subject: "",
    department: "", semester: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const fetchNotes = async () => {
    try {
      const q = query(collection(db, "notes"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const fetchedNotes = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        const ratings = data.userRatings ? Object.values(data.userRatings) as number[] : [];
        const avgRating = ratings.length > 0 ? ratings.reduce((S, v) => S + v, 0) / ratings.length : 0;
        return {
          _id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          avgRating
        };
      }) as Note[]
      setNotes(fetchedNotes)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load notes from Firebase")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotes() }, [])

  const handleFileSelect = (file: File) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, Word, and PowerPoint files are allowed")
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be under 50MB")
      return
    }
    setSelectedFile(file)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !form.title || !form.subject || !form.department || !form.semester) {
      toast.error("Please fill all fields and select a file")
      return
    }

    setUploading(true)
    try {
      // 1. Upload file to Cloudinary
      const cloudinaryData = await uploadRawToCloudinary(selectedFile)
      const downloadUrl = cloudinaryData.secure_url
      const publicId = cloudinaryData.public_id

      // 2. Save Metadata to Firebase Firestore
      const newNoteRef = await addDoc(collection(db, "notes"), {
        ...form,
        fileUrl: downloadUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        publicId,
        uploadedBy: user?.uid,
        uploadedByName: userData?.name || 'Admin',
        downloads: 0,
        createdAt: serverTimestamp()
      })

      toast.success("Note uploaded successfully!")
      
      // Update local state smoothly
      const newLocalNote: Note = {
        _id: newNoteRef.id,
        ...form,
        fileUrl: downloadUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadedByName: userData?.name || 'Admin',
        downloads: 0,
        createdAt: new Date().toISOString()
      }

      setNotes(prev => [newLocalNote, ...prev])
      setForm({ title: "", description: "", subject: "", department: "", semester: "" })
      setSelectedFile(null)
      setShowForm(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await deleteDoc(doc(db, "notes", id))
      setNotes(prev => prev.filter(n => n._id !== id))
      toast.success("Note deleted")
    } catch (err: any) {
      toast.error("Failed to delete note from Firebase")
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Notes Manager
          </h1>
          <p className="text-muted-foreground mt-1">Upload and manage study notes for students</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shadow-lg shadow-primary/20">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Upload Note"}
        </Button>
      </motion.div>

      {/* Upload Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload New Note
                </CardTitle>
                <CardDescription>Supports PDF, Word (.docx), and PowerPoint (.pptx) up to 50MB</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input placeholder="e.g. Unit 1 – Data Structures" value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject *</Label>
                      <Input placeholder="e.g. Advanced Algorithms" value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Department *</Label>
                      <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Semester *</Label>
                      <Select value={form.semester} onValueChange={v => setForm(f => ({ ...f, semester: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                        <SelectContent>
                          {SEMESTERS.map(s => <SelectItem key={s} value={s}>Semester {s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea placeholder="Brief description of the note content..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={2} />
                  </div>

                  {/* File Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3 text-primary">
                        <CheckCircle className="h-8 w-8" />
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">{formatSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="font-medium text-muted-foreground">Drop file here or click to browse</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">PDF, DOCX, PPTX up to 50MB</p>
                      </>
                    )}
                  </div>

                  <Button type="submit" disabled={uploading} className="w-full gap-2 h-11">
                    {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload Note</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Notes", value: notes.length, color: "text-primary" },
          { label: "Total Downloads", value: notes.reduce((s, n) => s + n.downloads, 0), color: "text-green-500" },
          { label: "Departments", value: [...new Set(notes.map(n => n.department))].length, color: "text-blue-500" },
          { label: "Subjects", value: [...new Set(notes.map(n => n.subject))].length, color: "text-purple-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search + List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notes..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-muted-foreground">No notes uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((note, i) => (
                <motion.div key={note._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all">
                  <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{note.title}</p>
                      <Badge variant="outline" className="text-xs shrink-0">{note.department}</Badge>
                      <Badge variant="secondary" className="text-xs shrink-0">Sem {note.semester}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{note.subject} • {note.fileName}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {note.downloads} downloads • {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-current mr-1" />
                        {note.avgRating?.toFixed(1) || "0.0"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5 h-8">
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </Button>
                    </a>
                    <Button variant="destructive" size="sm" className="h-8 w-8 p-0"
                      onClick={() => handleDelete(note._id, note.title)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
