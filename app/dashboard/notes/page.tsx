"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Download, FileText, Search, Loader2, GraduationCap, Filter, Star } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, doc, updateDoc, increment, where } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"

const DEPARTMENTS = ["all", "MCA", "MBA", "BCA", "BBA", "B.Sc", "M.Sc", "B.Tech", "M.Tech"]
const SEMESTERS = ["all", "1", "2", "3", "4", "5", "6", "7", "8"]

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

export default function StudentNotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("all")
  const [semester, setSemester] = useState("all")
  const [downloading, setDownloading] = useState<string | null>(null)
  const [ratingLoading, setRatingLoading] = useState<string | null>(null)

  const fetchNotes = async () => {
    setLoading(true)
    try {
      let q = collection(db, "notes") as any
      const conditions: any[] = []
      
      if (department !== 'all') conditions.push(where("department", "==", department))
      if (semester !== 'all') conditions.push(where("semester", "==", semester))
      
      if (conditions.length > 0) {
        q = query(collection(db, "notes"), ...conditions, orderBy("createdAt", "desc"))
      } else {
        q = query(collection(db, "notes"), orderBy("createdAt", "desc"))
      }
      
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
      
      // Sort by rating desc, then createdAt desc
      fetchedNotes.sort((a,b) => {
        if ((b.avgRating || 0) !== (a.avgRating || 0)) return (b.avgRating || 0) - (a.avgRating || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      setNotes(fetchedNotes)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load notes from Firebase")
    } finally {
      setLoading(false)
    }
  }

  const handleRate = async (noteId: string, rating: number) => {
    if (!user) return toast.error("Must be logged in to rate");
    setRatingLoading(noteId);
    try {
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, {
        [`userRatings.${user.uid}`]: rating
      });
      setNotes(prev => {
        const newNotes = prev.map(n => {
          if (n._id === noteId) {
            const newUserRatings = { ...(n.userRatings || {}), [user.uid]: rating };
            const ratingsArray = Object.values(newUserRatings);
            const avgRating = ratingsArray.length > 0 ? ratingsArray.reduce((S,v)=>S+v,0) / ratingsArray.length : 0;
            return { ...n, userRatings: newUserRatings, avgRating };
          }
          return n;
        });
        return newNotes.sort((a,b) => {
          if ((b.avgRating || 0) !== (a.avgRating || 0)) return (b.avgRating || 0) - (a.avgRating || 0);
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
      toast.success("Rating saved!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save rating");
    } finally {
      setRatingLoading(null);
    }
  }

  useEffect(() => { fetchNotes() }, [department, semester])

  const handleDownload = async (note: Note) => {
    setDownloading(note._id)
    try {
      // Increment download count in Firestore
      await updateDoc(doc(db, "notes", note._id), {
        downloads: increment(1)
      })
      setNotes(prev => prev.map(n => n._id === note._id ? { ...n, downloads: n.downloads + 1 } : n))

      // Trigger download
      const link = document.createElement('a')
      link.href = note.fileUrl
      link.download = note.fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Downloading "${note.title}"`)
    } catch (e) {
      console.error(e)
      toast.error("Download tracking failed.")
    } finally {
      setDownloading(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return '📄'
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝'
    if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return '📊'
    return '📁'
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase())
  )

  // Group by subject
  const grouped = filtered.reduce((acc, note) => {
    if (!acc[note.subject]) acc[note.subject] = []
    acc[note.subject].push(note)
    return acc
  }, {} as Record<string, Note[]>)

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Study Notes
        </h1>
        <p className="text-muted-foreground mt-1">Download notes uploaded by your faculty</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available Notes", value: notes.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
          { label: "Subjects", value: [...new Set(notes.map(n => n.subject))].length, icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Total Downloads", value: notes.reduce((s, n) => s + n.downloads, 0), icon: Download, color: "text-green-500", bg: "bg-green-500/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notes or subjects..." className="pl-9" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-36">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d === 'all' ? 'All Depts' : d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Sems' : `Sem ${s}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-14 w-14 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">No notes available</h3>
            <p className="text-muted-foreground text-sm">Check back later. Faculty will upload notes here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([subject, subjectNotes], gi) => (
            <motion.div key={subject} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}>
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/50 py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    {subject}
                    <Badge variant="secondary" className="ml-auto">{subjectNotes.length} note{subjectNotes.length > 1 ? 's' : ''}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {subjectNotes.map((note, i) => (
                      <motion.div key={note._id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-all group">
                        <div className="text-2xl shrink-0">{getFileIcon(note.fileType)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold group-hover:text-primary transition-colors truncate">{note.title}</p>
                          {note.description && (
                            <p className="text-sm text-muted-foreground truncate">{note.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">{note.department}</Badge>
                            <Badge variant="outline" className="text-xs">Sem {note.semester}</Badge>
                            {note.fileSize > 0 && <span className="text-xs text-muted-foreground">{formatSize(note.fileSize)}</span>}
                            <span className="text-xs text-muted-foreground">{note.downloads} downloads</span>
                            <span className="text-xs text-muted-foreground">by {note.uploadedByName}</span>
                          </div>
                          <div className="mt-2.5 flex items-center">
                            {[1, 2, 3, 4, 5].map(star => {
                              const userRating = user && note.userRatings ? note.userRatings[user.uid] : 0;
                              const isFilled = star <= (userRating || Math.round(note.avgRating || 0));
                              return (
                                <button
                                  key={star}
                                  disabled={ratingLoading === note._id}
                                  onClick={() => handleRate(note._id, star)}
                                  className={`p-0.5 transition-all outline-none ${ratingLoading === note._id ? 'opacity-50' : 'hover:scale-110'}`}
                                >
                                  <Star className={`h-4 w-4 ${isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400/50"}`} />
                                </button>
                              );
                            })}
                            <span className="text-xs text-muted-foreground ml-2 font-medium">
                              {note.avgRating?.toFixed(1) || "0.0"} ({Object.keys(note.userRatings || {}).length})
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDownload(note)}
                          disabled={downloading === note._id}
                          className="gap-2 shrink-0 shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all"
                          size="sm"
                        >
                          {downloading === note._id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Download className="h-3.5 w-3.5" />
                          }
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
