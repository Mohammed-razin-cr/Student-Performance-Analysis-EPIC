"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Circle, ExternalLink, Loader2, Search, TrendingUp, IndianRupee, Building2, Trophy } from "lucide-react"

type Resource = { name: string; url: string; type: "free" | "paid" }
type Phase = {
  phase: number
  title: string
  duration: string
  icon: string
  color: string
  skills: string[]
  resources: Resource[]
  milestone: string
}
type Roadmap = {
  title: string
  duration: string
  phases: Phase[]
  salaryRange: { entry: string; mid: string; senior: string }
  topCompanies: string[]
}

const COLOR_MAP: Record<string, string> = {
  blue: "border-blue-500 bg-blue-500/10 text-blue-600",
  cyan: "border-cyan-500 bg-cyan-500/10 text-cyan-600",
  purple: "border-purple-500 bg-purple-500/10 text-purple-600",
  green: "border-green-500 bg-green-500/10 text-green-600",
  orange: "border-orange-500 bg-orange-500/10 text-orange-600",
  red: "border-red-500 bg-red-500/10 text-red-600",
  yellow: "border-yellow-500 bg-yellow-500/10 text-yellow-600",
  violet: "border-violet-500 bg-violet-500/10 text-violet-600",
  gray: "border-gray-500 bg-gray-500/10 text-gray-600",
}

const DOT_COLOR: Record<string, string> = {
  blue: "bg-blue-500", cyan: "bg-cyan-500", purple: "bg-purple-500",
  green: "bg-green-500", orange: "bg-orange-500", red: "bg-red-500",
  yellow: "bg-yellow-500", violet: "bg-violet-500", gray: "bg-gray-500",
}

const QUICK_ROLES = [
  "Frontend Developer", "Backend Developer", "Data Scientist",
  "DevOps Engineer", "Mobile Developer", "UI/UX Designer",
]

export default function CareerRoadmap() {
  const [roleInput, setRoleInput] = useState("")
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchRoadmap("frontend developer")
  }, [])

  async function fetchRoadmap(role: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/career/roadmap?role=${encodeURIComponent(role)}`)
      const data = await res.json()
      setRoadmap(data.roadmap)
      setChecked(new Set())
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  function toggle(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const totalSkills = roadmap?.phases.reduce((a, p) => a + p.skills.length, 0) ?? 0
  const doneCount = checked.size
  const progress = totalSkills > 0 ? Math.round((doneCount / totalSkills) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <Card>
        <CardContent className="pt-5 pb-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Enter your target role to get a personalized roadmap</p>
          <div className="flex gap-2">
            <Input
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              placeholder="e.g. Data Scientist, DevOps Engineer…"
              onKeyDown={e => e.key === "Enter" && roleInput.trim() && fetchRoadmap(roleInput.trim())}
              className="flex-1"
            />
            <Button onClick={() => fetchRoadmap(roleInput.trim() || "frontend developer")} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Generate
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_ROLES.map(r => (
              <button
                key={r}
                onClick={() => { setRoleInput(r); fetchRoadmap(r) }}
                className="rounded-full border px-3 py-1 text-xs transition hover:bg-primary hover:text-primary-foreground"
              >
                {r}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Generating your roadmap…</span>
        </div>
      )}

      {!loading && roadmap && (
        <div className="space-y-6">
          {/* Header + progress */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">{roadmap.title} Roadmap</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Estimated duration: <span className="font-medium text-foreground">{roadmap.duration}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-40 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm font-medium">{progress}% done</span>
            </div>
          </div>

          {/* Phase timeline */}
          <div className="relative space-y-0">
            {roadmap.phases.map((phase, idx) => {
              const colorCls = COLOR_MAP[phase.color] || COLOR_MAP.blue
              const dotCls = DOT_COLOR[phase.color] || DOT_COLOR.blue
              const isLast = idx === roadmap.phases.length - 1
              return (
                <div key={phase.phase} className="flex gap-4">
                  {/* Connector */}
                  <div className="flex flex-col items-center">
                    <div className={`mt-5 h-10 w-10 rounded-full border-2 flex items-center justify-center text-lg shrink-0 ${colorCls}`}>
                      {phase.icon}
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-border mt-1 mb-1" />}
                  </div>

                  {/* Card */}
                  <div className={`flex-1 pb-6 ${isLast ? "" : ""}`}>
                    <Card className="overflow-hidden">
                      <div className={`h-1 w-full ${dotCls}`} />
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base">Phase {phase.phase}: {phase.title}</span>
                          <Badge variant="secondary">{phase.duration}</Badge>
                        </div>

                        {/* Skills checklist */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Skills to learn</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {phase.skills.map(skill => {
                              const key = `${phase.phase}-${skill}`
                              const done = checked.has(key)
                              return (
                                <button
                                  key={skill}
                                  onClick={() => toggle(key)}
                                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:bg-muted/50 text-left"
                                >
                                  {done
                                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                    : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                  <span className={done ? "line-through text-muted-foreground" : ""}>{skill}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Resources */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Resources</p>
                          <div className="flex flex-wrap gap-2">
                            {phase.resources.map(r => (
                              <a
                                key={r.name}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition hover:bg-primary hover:text-primary-foreground"
                              >
                                {r.name}
                                <Badge variant={r.type === "free" ? "secondary" : "outline"} className="h-4 px-1 text-[10px]">
                                  {r.type}
                                </Badge>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* Milestone */}
                        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                          <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
                          <span className="font-medium">Milestone:</span>
                          <span className="text-muted-foreground">{phase.milestone}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Salary + Companies */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <IndianRupee className="h-4 w-4 text-green-500" />
                  Salary Range in India
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Entry Level", val: roadmap.salaryRange.entry },
                    { label: "Mid Level", val: roadmap.salaryRange.mid },
                    { label: "Senior Level", val: roadmap.salaryRange.senior },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="font-bold text-sm mt-1">{s.val}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Top Hiring Companies
                </div>
                <div className="flex flex-wrap gap-2">
                  {roadmap.topCompanies.map(c => (
                    <Badge key={c} variant="secondary" className="text-sm">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="rounded-xl border bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm">Ready to get started?</p>
                <p className="text-xs text-muted-foreground">Scan your resume to see how close you already are.</p>
              </div>
            </div>
            <Button size="sm" variant="default">Check ATS Score →</Button>
          </div>
        </div>
      )}
    </div>
  )
}
