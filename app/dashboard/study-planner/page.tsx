"use client"

import { useState } from "react"
import { Brain, CalendarDays, Loader2, Plus, Sparkles, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Topic = { name: string; priority: number; difficulty: number }
type DayPlan = { day: number; focus: string; blocks: { label: string; minutes: number; task: string }[] }

export default function StudyPlannerPage() {
  const [topics, setTopics] = useState<Topic[]>([
    { name: "Arrays", priority: 2, difficulty: 2 },
    { name: "Graphs", priority: 1, difficulty: 3 },
    { name: "Dynamic Programming", priority: 3, difficulty: 3 },
  ])
  const [hoursPerDay, setHoursPerDay] = useState(2)
  const [days, setDays] = useState(7)
  const [plan, setPlan] = useState<DayPlan[]>([])
  const [quiz, setQuiz] = useState<string[]>([])
  const [weakTopic, setWeakTopic] = useState("")
  const [loading, setLoading] = useState(false)

  function updateTopic(index: number, patch: Partial<Topic>) {
    setTopics((current) => current.map((topic, i) => i === index ? { ...topic, ...patch } : topic))
  }

  async function generatePlan() {
    setLoading(true)
    try {
      const response = await fetch("/api/study-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, hoursPerDay, days }),
      })
      const payload = await response.json()
      setPlan(payload.plan || [])
      setQuiz(payload.quiz || [])
      setWeakTopic(payload.weakTopic || "")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><CalendarDays className="h-6 w-6" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Study Planner</h1>
          <p className="text-muted-foreground">Turn loose topics into a concrete learning rhythm.</p>
        </div>
        <Badge variant="secondary">Adaptive</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle>Planner Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">Hours / day<Input type="number" value={hoursPerDay} min={0.5} step={0.5} onChange={(e) => setHoursPerDay(Number(e.target.value))} /></label>
              <label className="space-y-1 text-sm">Days<Input type="number" value={days} min={1} max={30} onChange={(e) => setDays(Number(e.target.value))} /></label>
            </div>
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <div key={index} className="rounded-xl border p-3">
                  <Input value={topic.name} onChange={(e) => updateTopic(index, { name: e.target.value })} />
                  <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input type="number" min={1} max={3} value={topic.priority} onChange={(e) => updateTopic(index, { priority: Number(e.target.value) })} />
                    <Input type="number" min={1} max={3} value={topic.difficulty} onChange={(e) => updateTopic(index, { difficulty: Number(e.target.value) })} />
                    <Button variant="outline" size="icon" onClick={() => setTopics((current) => current.filter((_, i) => i !== index))}><Trash2 /></Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Priority · Difficulty</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setTopics((current) => [...current, { name: "", priority: 1, difficulty: 1 }])}><Plus /> Add topic</Button>
              <Button onClick={generatePlan} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Generated Plan</CardTitle>
              {weakTopic && <Badge>Focus next: {weakTopic}</Badge>}
            </CardHeader>
            <CardContent>
              {!plan.length ? (
                <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  Your plan will appear here.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {plan.map((day) => (
                    <div key={day.day} className="rounded-xl border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Day {day.day}</p>
                      <h3 className="mt-1 font-semibold">{day.focus}</h3>
                      <div className="mt-3 space-y-2">
                        {day.blocks.map((block) => (
                          <div key={block.label} className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">{block.task}</span>
                            <Badge variant="secondary">{block.minutes}m</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Sample Quiz</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {quiz.length ? quiz.map((question) => <div key={question} className="rounded-xl bg-muted/40 p-3">{question}</div>) : <p className="text-muted-foreground">Generate a plan to get revision prompts.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
