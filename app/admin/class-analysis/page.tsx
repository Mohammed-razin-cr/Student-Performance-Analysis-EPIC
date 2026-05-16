"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Upload, FileSpreadsheet, FileText, Users, TrendingUp, TrendingDown,
  Award, AlertTriangle, Download, Sparkles, BarChart3, Trophy,
  ChevronDown, ChevronUp, X, Loader2, CheckCircle2
} from "lucide-react"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { toast } from "sonner"
import {
  parseExcelFile, parsePDFFile, rankStudents,
  computeClassStats, generateAIInsight,
  type ParsedStudent, type ClassParseResult, type ClassStats,
} from "@/lib/classMarksheetParser"

// ─── Colors ──────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#22d3ee", "#ef4444", "#a78bfa"]       // pass, fail, distinction
const BAR_COLORS = ["#0e7490", "#0369a1", "#0891b2", "#6366f1", "#8b5cf6", "#06b6d4", "#38bdf8"]
const CATEGORY_COLORS: Record<string, string> = {
  distinction: "#22d3ee",
  pass: "#38bdf8",
  fail: "#ef4444",
}

export default function ClassAnalysisPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── state ──
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [students, setStudents] = useState<ParsedStudent[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [stats, setStats] = useState<ClassStats | null>(null)
  const [insight, setInsight] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [showAllStudents, setShowAllStudents] = useState(false)
  const [sortKey, setSortKey] = useState<"rank" | "name" | "percentage">("rank")
  const [sortAsc, setSortAsc] = useState(true)

  // ── file selection ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.split(".").pop()?.toLowerCase()
    if (!["xlsx", "xls", "csv", "pdf"].includes(ext ?? "")) {
      toast.error("Unsupported file type. Please upload .xlsx, .csv, or .pdf")
      return
    }
    setFile(f)
    // reset previous results
    setStudents([])
    setSubjects([])
    setStats(null)
    setInsight("")
    setErrors([])
  }

  // ── parse ──
  const handleParse = useCallback(async () => {
    if (!file) return
    setParsing(true)
    try {
      const ext = file.name.split(".").pop()?.toLowerCase()
      let result: ClassParseResult

      if (ext === "pdf") {
        result = await parsePDFFile(file)
      } else {
        result = await parseExcelFile(file)
      }

      if (result.errors.length > 0) setErrors(result.errors)

      if (result.students.length === 0) {
        toast.error("No student data could be extracted from the file.")
        setParsing(false)
        return
      }

      const ranked = rankStudents(result.students)
      const classStats = computeClassStats(ranked)
      const aiInsight = generateAIInsight(classStats, result.subjects)

      setStudents(ranked)
      setSubjects(result.subjects)
      setStats(classStats)
      setInsight(aiInsight)
      toast.success(`Parsed ${ranked.length} students successfully!`)
    } catch (err) {
      toast.error("Failed to parse file: " + String(err))
    } finally {
      setParsing(false)
    }
  }, [file])

  // ── sorting ──
  const sortedStudents = [...students].sort((a, b) => {
    let cmp = 0
    if (sortKey === "rank") cmp = (a.rank ?? 0) - (b.rank ?? 0)
    else if (sortKey === "name") cmp = a.name.localeCompare(b.name)
    else cmp = a.percentage - b.percentage
    return sortAsc ? cmp : -cmp
  })

  const visibleStudents = showAllStudents ? sortedStudents : sortedStudents.slice(0, 20)
  const top10 = students.slice(0, 10)

  // ── chart data ──
  const pieData = stats
    ? [
        { name: "Passed", value: stats.passed - stats.distinction },
        { name: "Failed", value: stats.failed },
        { name: "Distinction", value: stats.distinction },
      ].filter(d => d.value > 0)
    : []

  const distData = stats
    ? [
        { range: "≥90%", count: students.filter(s => s.percentage >= 90).length },
        { range: "80–89%", count: students.filter(s => s.percentage >= 80 && s.percentage < 90).length },
        { range: "70–79%", count: students.filter(s => s.percentage >= 70 && s.percentage < 80).length },
        { range: "60–69%", count: students.filter(s => s.percentage >= 60 && s.percentage < 70).length },
        { range: "50–59%", count: students.filter(s => s.percentage >= 50 && s.percentage < 60).length },
        { range: "40–49%", count: students.filter(s => s.percentage >= 40 && s.percentage < 50).length },
        { range: "<40%", count: students.filter(s => s.percentage < 40).length },
      ].filter(d => d.count > 0)
    : []

  // ── download report ──
  const downloadReport = async () => {
    if (!stats || students.length === 0) return

    // Dynamically import jsPDF to prevent SSR issues
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text("EPIC | CLASS PERFORMANCE REPORT (MCA)", 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
    doc.text(`Source File: ${file?.name ?? "N/A"}`, 14, 36)

    // Summary Statistics
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text("CLASS STATISTICS", 14, 48)

    autoTable(doc, {
      startY: 52,
      head: [["Metric", "Value"]],
      body: [
        ["Total Students", stats.total.toString()],
        ["Passed", `${stats.passed} (${stats.passRate.toFixed(1)}%)`],
        ["Failed", `${stats.failed} (${stats.failRate.toFixed(1)}%)`],
        ["Distinction (>=75%)", `${stats.distinction} (${stats.distinctionRate.toFixed(1)}%)`],
        ["Average Percentage", `${stats.avgPercentage.toFixed(2)}%`],
        ["Highest / Lowest", `${stats.highest.toFixed(2)}% / ${stats.lowest.toFixed(2)}%`],
        ["Median", `${stats.median.toFixed(2)}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [14, 116, 144] },
      margin: { top: 10, right: 14, bottom: 10, left: 14 }
    })

    const finalYStats = (doc as any).lastAutoTable.finalY

    // AI Insight Summary
    doc.setFontSize(14)
    doc.text("AI PERFORMANCE SUMMARY", 14, finalYStats + 14)
    doc.setFontSize(11)
    
    // Split text to fit width
    const splitAiText = doc.splitTextToSize(insight, 180)
    doc.text(splitAiText, 14, finalYStats + 22)

    const finalYAi = finalYStats + 22 + (splitAiText.length * 5)

    // Top 10 Leaderboard
    doc.setFontSize(14)
    doc.text("TOP 10 STUDENTS", 14, finalYAi + 14)

    autoTable(doc, {
      startY: finalYAi + 18,
      head: [["Rank", "Name", "Marks", "Percentage", "Category"]],
      body: top10.map(s => [
        s.rank?.toString() || "-",
        s.name,
        `${s.total}/${s.maxTotal}`,
        `${s.percentage.toFixed(2)}%`,
        s.category
      ]),
      theme: 'grid',
      headStyles: { fillColor: [14, 116, 144] },
      margin: { top: 10, right: 14, bottom: 10, left: 14 }
    })

    // All Students list
    doc.addPage()
    doc.setFontSize(14)
    doc.text("ALL STUDENTS", 14, 20)

    autoTable(doc, {
      startY: 26,
      head: [["Rank", "Name", "Total", "Percentage", "Grade", "Category"]],
      body: students.map(s => [
        s.rank?.toString() || "-",
        s.name,
        `${s.total}/${s.maxTotal}`,
        `${s.percentage.toFixed(2)}%`,
        s.grade,
        s.category
      ]),
      theme: 'striped',
      headStyles: { fillColor: [14, 116, 144] },
      margin: { top: 10, right: 14, bottom: 10, left: 14 }
    })

    const filename = `MCA_Class_Report_${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(filename)
    toast.success("PDF Report downloaded successfully!")
  }

  // ── toggle sort ──
  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col ? (sortAsc ? <ChevronUp className="inline h-3 w-3 ml-0.5" /> : <ChevronDown className="inline h-3 w-3 ml-0.5" />) : null

  // ── reset ──
  const handleReset = () => {
    setFile(null)
    setStudents([])
    setSubjects([])
    setStats(null)
    setInsight("")
    setErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Class Marksheet Analysis
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload an Excel or PDF marksheet to generate class performance analytics, rankings, and AI insights.
        </p>
      </motion.div>

      {/* ─── Upload Card ───────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="p-4 rounded-full bg-primary/8">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Upload Marksheet</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .csv, and .pdf files</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="marksheet-upload"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  {file ? (
                    <>
                      {file.name.endsWith(".pdf") ? <FileText className="h-4 w-4 mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                      {file.name}
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
                {file && (
                  <>
                    <Button onClick={handleParse} disabled={parsing}>
                      {parsing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                      {parsing ? "Analysing..." : "Analyse"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleReset} title="Clear">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Parse errors */}
      {errors.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                {errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ RESULTS ═══════════ */}
      <AnimatePresence>
        {stats && students.length > 0 && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ─── Stats Cards ──────────────────────────────────────────────── */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Total Students" value={stats.total} />
              <StatCard icon={CheckCircle2} label="Passed" value={stats.passed} sub={`${stats.passRate.toFixed(1)}%`} color="text-green-500" />
              <StatCard icon={AlertTriangle} label="Failed" value={stats.failed} sub={`${stats.failRate.toFixed(1)}%`} color="text-red-500" />
              <StatCard icon={Award} label="Distinction" value={stats.distinction} sub={`${stats.distinctionRate.toFixed(1)}%`} color="text-cyan-500" />
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard icon={TrendingUp} label="Average %" value={`${stats.avgPercentage.toFixed(1)}%`} />
              <StatCard icon={TrendingUp} label="Highest %" value={`${stats.highest.toFixed(1)}%`} color="text-green-500" />
              <StatCard icon={TrendingDown} label="Lowest %" value={`${stats.lowest.toFixed(1)}%`} color="text-red-500" />
              <StatCard icon={BarChart3} label="Median %" value={`${stats.median.toFixed(1)}%`} />
            </div>

            {/* ─── Charts Row ──────────────────────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pass vs Fail Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar – marks distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Marks Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={distData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                        {distData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ─── Top 10 Leaderboard ──────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-base">Top 10 Students</CardTitle>
                </div>
                <CardDescription className="text-xs">Ranked by overall percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {top10.map((s) => (
                        <TableRow key={s.rank}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {s.rank === 1 && <span className="text-yellow-500">🥇</span>}
                              {s.rank === 2 && <span className="text-gray-400">🥈</span>}
                              {s.rank === 3 && <span className="text-amber-600">🥉</span>}
                              <span className="font-semibold text-sm">{s.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{s.total}/{s.maxTotal}</TableCell>
                          <TableCell className="text-right font-semibold">{s.percentage.toFixed(2)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">{s.grade}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className="text-xs capitalize"
                              style={{ background: CATEGORY_COLORS[s.category] + "20", color: CATEGORY_COLORS[s.category], border: `1px solid ${CATEGORY_COLORS[s.category]}40` }}
                            >
                              {s.category}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* ─── AI Insight ──────────────────────────────────────────────── */}
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">AI Performance Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground/80">{insight}</p>
              </CardContent>
            </Card>

            {/* ─── Full Student Table ──────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base">All Students</CardTitle>
                    <CardDescription className="text-xs">{students.length} students · {subjects.length} subjects</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadReport}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none w-16" onClick={() => toggleSort("rank")}>
                          Rank <SortIcon col="rank" />
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                          Name <SortIcon col="name" />
                        </TableHead>
                        {subjects.map(sub => (
                          <TableHead key={sub} className="text-right text-xs">{sub}</TableHead>
                        ))}
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("percentage")}>
                          % <SortIcon col="percentage" />
                        </TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleStudents.map((s) => (
                        <TableRow key={s.rank}>
                          <TableCell className="font-mono text-sm">{s.rank}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{s.name}</TableCell>
                          {subjects.map(sub => (
                            <TableCell key={sub} className="text-right font-mono text-sm">{s.marks[sub] ?? "-"}</TableCell>
                          ))}
                          <TableCell className="text-right font-mono text-sm">{s.total}/{s.maxTotal}</TableCell>
                          <TableCell className="text-right font-semibold">{s.percentage.toFixed(2)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">{s.grade}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className="text-xs capitalize"
                              style={{ background: CATEGORY_COLORS[s.category] + "20", color: CATEGORY_COLORS[s.category], border: `1px solid ${CATEGORY_COLORS[s.category]}40` }}
                            >
                              {s.category}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {students.length > 20 && (
                  <div className="flex justify-center mt-4">
                    <Button variant="ghost" size="sm" onClick={() => setShowAllStudents(!showAllStudents)}>
                      {showAllStudents ? "Show Less" : `Show All ${students.length} Students`}
                      {showAllStudents ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Stat Card sub-component ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  sub?: string
  color?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg bg-muted ${color ?? "text-primary"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && <p className={`text-xs font-medium mt-0.5 ${color ?? "text-primary"}`}>{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
