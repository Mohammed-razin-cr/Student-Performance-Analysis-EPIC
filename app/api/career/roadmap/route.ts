import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const PREDEFINED_ROADMAPS: Record<string, any> = {
  "frontend developer": {
    title: "Frontend Developer",
    duration: "6-12 months",
    phases: [
      {
        phase: 1, title: "Foundation", duration: "2 months", icon: "🏗️", color: "blue",
        skills: ["HTML5 & CSS3", "JavaScript (ES6+)", "Responsive Design", "Git & GitHub"],
        resources: [
          { name: "freeCodeCamp", url: "https://freecodecamp.org", type: "free" },
          { name: "The Odin Project", url: "https://theodinproject.com", type: "free" },
        ],
        milestone: "Build 3 static websites"
      },
      {
        phase: 2, title: "React Ecosystem", duration: "2 months", icon: "⚛️", color: "cyan",
        skills: ["React.js", "State Management (Redux/Zustand)", "React Router", "TypeScript basics"],
        resources: [
          { name: "React Official Docs", url: "https://react.dev", type: "free" },
          { name: "Epic React", url: "https://epicreact.dev", type: "paid" },
        ],
        milestone: "Build a full React CRUD app"
      },
      {
        phase: 3, title: "Advanced Tools", duration: "2 months", icon: "🛠️", color: "purple",
        skills: ["Next.js", "Tailwind CSS", "Testing (Jest/RTL)", "API integration"],
        resources: [
          { name: "Next.js Learn", url: "https://nextjs.org/learn", type: "free" },
          { name: "Tailwind CSS Docs", url: "https://tailwindcss.com", type: "free" },
        ],
        milestone: "Deploy a Next.js project"
      },
      {
        phase: 4, title: "Job Ready", duration: "2 months", icon: "🚀", color: "green",
        skills: ["Portfolio building", "System Design basics", "DSA for interviews", "Open Source contributions"],
        resources: [
          { name: "LeetCode", url: "https://leetcode.com", type: "free" },
          { name: "Frontend Mentor", url: "https://frontendmentor.io", type: "free" },
        ],
        milestone: "Land first frontend role"
      }
    ],
    salaryRange: { entry: "4-8 LPA", mid: "10-20 LPA", senior: "25-50 LPA" },
    topCompanies: ["Google", "Microsoft", "Flipkart", "Swiggy", "Razorpay"]
  },
  "data scientist": {
    title: "Data Scientist",
    duration: "8-14 months",
    phases: [
      {
        phase: 1, title: "Math & Python", duration: "2 months", icon: "📐", color: "orange",
        skills: ["Python basics", "NumPy & Pandas", "Statistics & Probability", "Linear Algebra"],
        resources: [
          { name: "Kaggle Learn", url: "https://kaggle.com/learn", type: "free" },
          { name: "StatQuest", url: "https://youtube.com/@statquest", type: "free" },
        ],
        milestone: "Analyze a real dataset"
      },
      {
        phase: 2, title: "ML Fundamentals", duration: "3 months", icon: "🤖", color: "red",
        skills: ["Scikit-learn", "Supervised Learning", "Unsupervised Learning", "Model Evaluation"],
        resources: [
          { name: "Coursera ML by Andrew Ng", url: "https://coursera.org/learn/machine-learning", type: "paid" },
          { name: "Hands-On ML (book)", url: "https://oreilly.com", type: "paid" },
        ],
        milestone: "Compete on Kaggle"
      },
      {
        phase: 3, title: "Deep Learning", duration: "3 months", icon: "🧠", color: "violet",
        skills: ["TensorFlow / PyTorch", "CNNs, RNNs, Transformers", "NLP basics", "Computer Vision"],
        resources: [
          { name: "fast.ai", url: "https://fast.ai", type: "free" },
          { name: "Deep Learning Specialization", url: "https://deeplearning.ai", type: "paid" },
        ],
        milestone: "Build an NLP project"
      },
      {
        phase: 4, title: "Production & Job Ready", duration: "2 months", icon: "🚀", color: "green",
        skills: ["MLOps basics", "SQL & Data Warehousing", "BI Tools (Tableau)", "Case Study practice"],
        resources: [
          { name: "Made with ML", url: "https://madewithml.com", type: "free" },
          { name: "StrataScratch", url: "https://stratascratch.com", type: "free" },
        ],
        milestone: "Land first Data Science role"
      }
    ],
    salaryRange: { entry: "5-10 LPA", mid: "15-30 LPA", senior: "35-80 LPA" },
    topCompanies: ["Amazon", "Google", "Uber", "Ola", "Walmart Labs"]
  },
  "backend developer": {
    title: "Backend Developer",
    duration: "6-12 months",
    phases: [
      {
        phase: 1, title: "Core Programming", duration: "2 months", icon: "💻", color: "gray",
        skills: ["Python/Node.js/Java", "OOP Concepts", "Data Structures", "Git & CLI"],
        resources: [
          { name: "CS50", url: "https://cs50.harvard.edu", type: "free" },
          { name: "The Odin Project", url: "https://theodinproject.com", type: "free" },
        ],
        milestone: "Build a CLI application"
      },
      {
        phase: 2, title: "APIs & Databases", duration: "2 months", icon: "🗄️", color: "blue",
        skills: ["REST API design", "SQL & NoSQL databases", "ORMs", "Authentication/JWT"],
        resources: [
          { name: "PostgreSQL Tutorial", url: "https://postgresqltutorial.com", type: "free" },
          { name: "MongoDB University", url: "https://university.mongodb.com", type: "free" },
        ],
        milestone: "Build a full REST API"
      },
      {
        phase: 3, title: "Scalability", duration: "2 months", icon: "⚡", color: "yellow",
        skills: ["Caching (Redis)", "Message Queues", "Microservices basics", "Docker"],
        resources: [
          { name: "Docker Docs", url: "https://docs.docker.com", type: "free" },
          { name: "Hussein Nasser YT", url: "https://youtube.com/@hnasr", type: "free" },
        ],
        milestone: "Dockerize an application"
      },
      {
        phase: 4, title: "Cloud & Deployment", duration: "2 months", icon: "☁️", color: "green",
        skills: ["AWS/GCP basics", "CI/CD pipelines", "System Design", "DSA for interviews"],
        resources: [
          { name: "AWS Free Tier", url: "https://aws.amazon.com/free", type: "free" },
          { name: "Grokking System Design", url: "https://educative.io", type: "paid" },
        ],
        milestone: "Deploy a scalable backend"
      }
    ],
    salaryRange: { entry: "5-10 LPA", mid: "15-25 LPA", senior: "30-60 LPA" },
    topCompanies: ["Atlassian", "Freshworks", "Zoho", "CRED", "Meesho"]
  },
}

const DEFAULT_ROADMAP = PREDEFINED_ROADMAPS["frontend developer"]

export async function GET(req: NextRequest) {
  const role = (req.nextUrl.searchParams.get("role") || "frontend developer").toLowerCase().trim()
  
  if (PREDEFINED_ROADMAPS[role]) {
    return NextResponse.json({ roadmap: PREDEFINED_ROADMAPS[role], source: "predefined" })
  }

  const apiKey = process.env.GEMINI_RESUME_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ roadmap: DEFAULT_ROADMAP, source: "default" })
  }

  try {
    const prompt = `Generate a career roadmap for "${role}" in the Indian tech job market. Return ONLY valid JSON with this structure:
{
  "title": "Role Title",
  "duration": "X-Y months",
  "phases": [
    {
      "phase": 1,
      "title": "Phase Name",
      "duration": "X months",
      "icon": "emoji",
      "color": "blue|cyan|purple|green|orange|red|yellow|violet|gray",
      "skills": ["skill1", "skill2", "skill3", "skill4"],
      "resources": [
        {"name": "Resource Name", "url": "https://...", "type": "free|paid"}
      ],
      "milestone": "Specific deliverable to achieve"
    }
  ],
  "salaryRange": {"entry": "X-Y LPA", "mid": "X-Y LPA", "senior": "X-Y LPA"},
  "topCompanies": ["Company1", "Company2", "Company3", "Company4", "Company5"]
}
Generate exactly 4 phases. Make it practical and India-specific.`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!geminiRes.ok) {
      throw new Error("Gemini API error")
    }

    const payload = await geminiRes.json()
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("No response from Gemini")

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    
    const roadmap = JSON.parse(jsonMatch[0])
    return NextResponse.json({ roadmap, source: "ai" })
  } catch (error) {
    return NextResponse.json({ roadmap: DEFAULT_ROADMAP, source: "default" })
  }
}
