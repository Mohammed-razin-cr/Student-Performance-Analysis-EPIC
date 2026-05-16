import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function analyzeWithFreeModel(prompt: string) {
  const apiKey = process.env.FREEMODEL_API_KEY
  const baseURL = process.env.FREEMODEL_BASE_URL || "https://api.freemodel.dev/v1"
  const model = process.env.FREEMODEL_MODEL

  if (!apiKey || !model) return null

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are an ATS resume analyst and career coach. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  })

  if (!response.ok) return null
  const payload = await response.json()
  const text = payload?.choices?.[0]?.message?.content
  if (!text) return null
  return JSON.parse(text)
}

async function analyzeWithGroq(prompt: string) {
  const keys = (process.env.GROQ_RESUME_API_KEYS || process.env.GROQ_API_KEY || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)

  for (const apiKey of keys) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an ATS resume analyst and career coach. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    })

    if (!response.ok) continue

    const payload = await response.json()
    const text = payload?.choices?.[0]?.message?.content
    if (!text) continue

    try {
      return JSON.parse(text)
    } catch {
      continue
    }
  }

  return null
}

async function analyzeWithOpenRouter(prompt: string) {
  const keys = (process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)

  for (const apiKey of keys) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openrouter/free",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an ATS resume analyst and career coach. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    })

    if (!response.ok) continue
    const payload = await response.json()
    const text = payload?.choices?.[0]?.message?.content
    if (!text) continue
    try {
      return JSON.parse(text)
    } catch {
      continue
    }
  }

  return null
}

async function analyzeWithCerebras(prompt: string) {
  const keys = (process.env.CEREBRAS_API_KEYS || process.env.CEREBRAS_API_KEY || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)

  for (const apiKey of keys) {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an ATS resume analyst and career coach. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    })

    if (!response.ok) continue
    const payload = await response.json()
    const text = payload?.choices?.[0]?.message?.content
    if (!text) continue
    try {
      return JSON.parse(text)
    } catch {
      continue
    }
  }

  return null
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_RESUME_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini resume key is not configured." }, { status: 500 })
  }

  const { resumeText, jobDescription } = await req.json()
  if (!resumeText?.trim()) {
    return NextResponse.json({ error: "Resume text is required." }, { status: 400 })
  }

  const prompt = `You are an ATS resume analyst and career coach.
Return ONLY valid JSON with this shape:
{
  "atsScore": number,
  "profileStrength": string,
  "keySkills": string[],
  "missingKeywords": string[],
  "improvements": string[],
  "recommendedCourses": string[],
  "jobMatches": string[]
}
Score from 0 to 100. Be concise, specific, and useful for a student.

Resume:
${resumeText.slice(0, 18000)}

${jobDescription ? `Target job description:\n${jobDescription.slice(0, 5000)}` : ""}`

  const groqAnalysis = await analyzeWithGroq(prompt).catch(() => null)
  if (groqAnalysis) {
    return NextResponse.json({ analysis: groqAnalysis, provider: "groq" })
  }

  const openRouterAnalysis = await analyzeWithOpenRouter(prompt).catch(() => null)
  if (openRouterAnalysis) {
    return NextResponse.json({ analysis: openRouterAnalysis, provider: "openrouter" })
  }

  const cerebrasAnalysis = await analyzeWithCerebras(prompt).catch(() => null)
  if (cerebrasAnalysis) {
    return NextResponse.json({ analysis: cerebrasAnalysis, provider: "cerebras" })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    }
  )

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const rawMessage = payload?.error?.message || "Resume analysis failed."
    const fallback = await analyzeWithFreeModel(prompt).catch(() => null)
    if (fallback) {
      return NextResponse.json({ analysis: fallback, provider: "freemodel" })
    }

    const message =
      response.status === 429
        ? "Gemini quota is currently exhausted for this API key. Please enable billing or configure the Free Model backup key."
        : rawMessage
    return NextResponse.json({ error: message }, { status: response.status })
  }

  const payload = await response.json()
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 })
  }

  try {
    return NextResponse.json({ analysis: JSON.parse(text), provider: "gemini" })
  } catch {
    const fallback = await analyzeWithFreeModel(prompt).catch(() => null)
    if (fallback) {
      return NextResponse.json({ analysis: fallback, provider: "freemodel" })
    }
    return NextResponse.json({ error: "Gemini returned invalid JSON." }, { status: 502 })
  }
}
