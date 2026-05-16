import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type Job = {
  id: string
  title: string
  company: string
  location: string
  employmentType?: string
  postedAt?: string
  applyUrl?: string
  source: "JSearch" | "LinkedIn"
}

function normalizeJSearch(job: any): Job {
  return {
    id: job.job_id || job.job_apply_link || `${job.employer_name}-${job.job_title}`,
    title: job.job_title || "Untitled role",
    company: job.employer_name || "Unknown company",
    location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ") || "Location not listed",
    employmentType: job.job_employment_type,
    postedAt: job.job_posted_at_datetime_utc,
    applyUrl: job.job_apply_link,
    source: "JSearch",
  }
}

function normalizeLinkedIn(job: any): Job {
  return {
    id: job.id || job.job_url || `${job.company_name}-${job.title}`,
    title: job.title || job.job_title || "Untitled role",
    company: job.company_name || job.company || job.employer_name || "Unknown company",
    location: job.location || job.location_name || "Location not listed",
    employmentType: job.employment_type || job.job_employment_type,
    postedAt: job.posted_at || job.posted_time || job.job_posted_at_datetime_utc,
    applyUrl: job.job_url || job.url || job.apply_url,
    source: "LinkedIn",
  }
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "RapidAPI key is not configured." }, { status: 500 })
  }

  const query = req.nextUrl.searchParams.get("query") || "software developer"
  const location = req.nextUrl.searchParams.get("location") || "India"
  const isDefaultFeed = !req.nextUrl.searchParams.get("query")
  const searchTerms = isDefaultFeed ? ["software developer"] : [query]

  const jsearchRequests = searchTerms.map((term) => {
    const url = new URL("https://jsearch.p.rapidapi.com/search")
    url.searchParams.set("query", `${term} in ${location}`)
    url.searchParams.set("page", "1")
    url.searchParams.set("num_pages", isDefaultFeed ? "10" : "2")
    return fetch(url, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
      cache: "no-store",
    })
  })

  const linkedInUrl = new URL("https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h")
  linkedInUrl.searchParams.set("offset", "0")
  linkedInUrl.searchParams.set("title_filter", query)
  linkedInUrl.searchParams.set("location_filter", location)
  linkedInUrl.searchParams.set("description_type", "text")

  const [jsearchResults, linkedInRes] = await Promise.all([
    Promise.allSettled(jsearchRequests),
    fetch(linkedInUrl, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "linkedin-job-search-api.p.rapidapi.com",
      },
      cache: "no-store",
    }).catch(() => null),
  ])

  const jobs: Job[] = []
  const warnings: string[] = []

  for (const result of jsearchResults) {
    if (result.status === "fulfilled" && result.value.ok) {
      const payload = await result.value.json()
      jobs.push(...(payload.data || []).map(normalizeJSearch))
    }
  }

  if (!jobs.length) {
    warnings.push("JSearch is unavailable right now.")
  }

  if (linkedInRes?.ok) {
    const payload = await linkedInRes.json()
    const rows = Array.isArray(payload) ? payload : payload.data || payload.jobs || []
    jobs.push(...rows.map(normalizeLinkedIn))
  } else {
    warnings.push("LinkedIn jobs are unavailable right now.")
  }

  let deduped = Array.from(
    new Map(jobs.map((job) => [`${job.title}-${job.company}-${job.location}`.toLowerCase(), job])).values()
  ).slice(0, isDefaultFeed ? 75 : 60)

  if (isDefaultFeed && deduped.length < 65) {
    const mockCount = 70 - deduped.length;
    deduped.push(...generateMockJobs(mockCount, "India", "software developer"));
  } else if (deduped.length === 0) {
    deduped.push(...generateMockJobs(65, location, query));
  }

  return NextResponse.json({ jobs: deduped, warnings })
}

function generateMockJobs(count: number, location: string, query: string): Job[] {
  const titles = ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist", "DevOps Engineer", "Product Manager", "UI/UX Designer", "Cloud Architect"];
  const companies = ["TechCorp", "InnovateLabs", "CloudSystems", "DataWorks", "SoftSolutions", "WebMakers", "AppForge", "NextGen IT", "GlobalTech", "TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra"];
  const locations = location.toLowerCase().includes("india") ? ["Bangalore, Karnataka, India", "Pune, Maharashtra, India", "Hyderabad, Telangana, India", "Mumbai, Maharashtra, India", "Chennai, Tamil Nadu, India", "Gurugram, Haryana, India", "Noida, Uttar Pradesh, India"] : [location];
  
  const mockJobs: Job[] = [];
  for (let i = 0; i < count; i++) {
    const baseTitle = query.toLowerCase() === "software developer" ? titles[i % titles.length] : query;
    mockJobs.push({
      id: `mock-${Date.now()}-${i}`,
      title: `${baseTitle} (Mock)`,
      company: companies[i % companies.length],
      location: locations[i % locations.length],
      employmentType: "FULLTIME",
      postedAt: new Date(Date.now() - i * 3600000).toISOString(),
      applyUrl: "https://www.linkedin.com/jobs/",
      source: "LinkedIn",
    });
  }
  return mockJobs;
}
