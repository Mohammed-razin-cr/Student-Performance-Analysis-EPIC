import { NextResponse } from "next/server"

type Topic = { name: string; priority: number; difficulty: number }

function buildPlan(topics: Topic[], hoursPerDay: number, days: number) {
  const ranked = [...topics].sort((a, b) => b.priority + b.difficulty - (a.priority + a.difficulty))

  return Array.from({ length: days }, (_, index) => {
    const topic = ranked[index % ranked.length]
    const reviewTopic = ranked[(index + ranked.length - 1) % ranked.length]
    const minutes = Math.round(hoursPerDay * 60)
    return {
      day: index + 1,
      focus: topic.name,
      blocks: [
        { label: "Learn", minutes: Math.round(minutes * 0.5), task: `Study core concepts of ${topic.name}` },
        { label: "Practice", minutes: Math.round(minutes * 0.3), task: `Solve problems on ${topic.name}` },
        { label: "Review", minutes: Math.round(minutes * 0.2), task: `Revise ${reviewTopic.name}` },
      ],
    }
  })
}

export async function POST(req: Request) {
  const { topics = [], hoursPerDay = 2, days = 7 } = await req.json()
  const cleanTopics = topics
    .map((topic: any) => ({
      name: String(topic.name || "").trim(),
      priority: Number(topic.priority || 1),
      difficulty: Number(topic.difficulty || 1),
    }))
    .filter((topic: Topic) => topic.name)

  if (!cleanTopics.length) {
    return NextResponse.json({ error: "Add at least one topic." }, { status: 400 })
  }

  const plan = buildPlan(cleanTopics, Math.max(0.5, Number(hoursPerDay)), Math.min(30, Math.max(1, Number(days))))
  const firstTopic = cleanTopics[0].name

  return NextResponse.json({
    plan,
    quiz: [
      `Explain the most important idea in ${firstTopic}.`,
      `Name one common mistake students make in ${firstTopic}.`,
      `Create a small example that demonstrates ${firstTopic}.`,
    ],
    weakTopic: cleanTopics.sort((a: Topic, b: Topic) => b.priority + b.difficulty - (a.priority + a.difficulty))[0].name,
  })
}
