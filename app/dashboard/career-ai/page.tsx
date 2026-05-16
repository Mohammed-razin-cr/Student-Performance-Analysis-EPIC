"use client"

import { useEffect, useMemo, useState } from "react"
import { BriefcaseBusiness, Compass, FileSearch, Globe, Loader2, UploadCloud } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import CareerRoadmap from "@/components/career-roadmap"

type Analysis = {
  atsScore: number
  profileStrength: string
  keySkills: string[]
  missingKeywords: string[]
  improvements: string[]
  recommendedCourses: string[]
  jobMatches: string[]
}

type Job = {
  id: string
  title: string
  company: string
  location: string
  employmentType?: string
  postedAt?: string
  applyUrl?: string
  source: string
}

export default function CareerAIPage() {
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState("")
  const [query, setQuery] = useState("software developer")
  const [location, setLocation] = useState("India")
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobError, setJobError] = useState("")

  const visibleSkills = useMemo(() => analysis?.keySkills?.slice(0, 8) || [], [analysis])

  useEffect(() => {
    searchJobs()
    // Load a useful India-first feed when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function analyzeResume() {
    if (!file) {
      setResumeError("Upload a PDF resume first.")
      return
    }
    setResumeLoading(true)
    setResumeError("")
    try {
      const { extractResumeText } = await import("@/lib/resumePdf")
      const resumeText = await extractResumeText(file)
      const response = await fetch("/api/career/resume-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Resume analysis failed.")
      setAnalysis(payload.analysis)
    } catch (error: any) {
      setResumeError(error.message || "Resume analysis failed.")
    } finally {
      setResumeLoading(false)
    }
  }

  async function searchJobs() {
    setJobsLoading(true)
    setJobError("")
    try {
      const params = query === "software developer" && location === "India"
        ? new URLSearchParams()
        : new URLSearchParams({ query, location })
      const response = await fetch(`/api/career/jobs?${params}`)
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not load jobs.")
      setJobs(payload.jobs || [])
      if (!payload.jobs?.length) setJobError("No jobs found for that search.")
    } catch (error: any) {
      setJobError(error.message || "Could not load jobs.")
    } finally {
      setJobsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary"><BriefcaseBusiness className="h-6 w-6" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Career & Placement Hub</h1>
            <p className="text-muted-foreground">Build your resume signal, then move directly into live opportunities.</p>
          </div>
          <Badge variant="secondary">AI Powered</Badge>
        </div>
      </div>

      <Tabs defaultValue="resume">
        <TabsList className="w-full max-w-2xl">
          <TabsTrigger value="roadmap" className="flex-1"><Compass /> Career Roadmap</TabsTrigger>
          <TabsTrigger value="resume" className="flex-1"><FileSearch /> ATS Resume Check</TabsTrigger>
          <TabsTrigger value="jobs" className="flex-1"><Globe /> Live Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="mt-6">
          <CareerRoadmap />
        </TabsContent>

        <TabsContent value="resume" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <Card>
              <CardHeader><CardTitle>Upload Resume</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5 text-center transition hover:bg-primary/10">
                  <UploadCloud className="mb-3 h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">{file?.name || "Choose PDF resume"}</span>
                  <input className="hidden" type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                </label>
                <Textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Target job description (optional)"
                  className="min-h-28"
                />
                <Button className="w-full" onClick={analyzeResume} disabled={resumeLoading}>
                  {resumeLoading && <Loader2 className="animate-spin" />}
                  {resumeLoading ? "Scanning..." : "Scan Resume"}
                </Button>
                {resumeError && <p className="text-sm text-destructive">{resumeError}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Analysis Report</CardTitle></CardHeader>
              <CardContent>
                {!analysis ? (
                  <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                    Your ATS report will appear here after the scan.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                      <div className="rounded-2xl bg-primary/5 p-5 text-center">
                        <p className="text-5xl font-bold text-primary">{analysis.atsScore}%</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">ATS score</p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm leading-6">{analysis.profileStrength}</p>
                        <Progress value={analysis.atsScore} />
                        <div className="flex flex-wrap gap-2">
                          {visibleSkills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <Insight title="Improve next" items={analysis.improvements} />
                      <Insight title="Missing keywords" items={analysis.missingKeywords} />
                      <Insight title="Recommended courses" items={analysis.recommendedCourses} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6 space-y-5">
          <Card>
            <CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_220px_140px]">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Role, e.g. frontend developer" />
              <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" />
              <Button onClick={searchJobs} disabled={jobsLoading}>
                {jobsLoading && <Loader2 className="animate-spin" />}
                Search
              </Button>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between">
            {jobError ? <p className="text-sm text-muted-foreground">{jobError}</p> : <p className="text-sm text-muted-foreground">{jobs.length} jobs loaded from India</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} className="gap-4">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="leading-snug">{job.title}</CardTitle>
                    <Badge variant="secondary">{job.source}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">{job.company}</p>
                    <p className="text-muted-foreground">{job.location}</p>
                  </div>
                  {job.applyUrl && <Button asChild variant="outline" className="w-full"><a href={job.applyUrl} target="_blank">Apply now</a></Button>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Insight({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {(items || []).slice(0, 4).map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  )
}
