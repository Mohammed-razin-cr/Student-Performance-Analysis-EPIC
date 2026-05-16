/**
 * Class Marksheet Parser
 * Parses Excel (.xlsx/.csv) and PDF files to extract student names and marks.
 * Handles flexible column naming conventions.
 */

export interface ParsedStudent {
  name: string
  marks: Record<string, number>   // subject -> marks
  total: number
  maxTotal: number
  percentage: number
  category: "distinction" | "pass" | "fail"
  grade: string
  rank?: number
}

export interface ClassParseResult {
  students: ParsedStudent[]
  subjects: string[]
  errors: string[]
}

// ─── Grade & Category helpers ─────────────────────────────────────────────────

export function getGrade(pct: number): string {
  if (pct >= 90) return "O"
  if (pct >= 80) return "A+"
  if (pct >= 70) return "A"
  if (pct >= 60) return "B+"
  if (pct >= 50) return "B"
  if (pct >= 40) return "C"
  return "F"
}

export function getCategory(pct: number): "distinction" | "pass" | "fail" {
  if (pct >= 75) return "distinction"
  if (pct >= 50) return "pass"
  return "fail"
}

function sanitizeName(v: unknown): string {
  return String(v ?? "").trim()
}

function toNumber(v: unknown): number | null {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.]/g, ""))
  return isNaN(n) ? null : n
}

/** Columns whose names suggest they are metadata, not subject marks */
const SKIP_COLUMNS = new Set([
  "sno", "sl", "sl.no", "s.no", "no", "serial", "serialno", "serialnumber",
  "rollno", "roll", "rollnumber", "usn", "regno", "registrationno",
  "name", "studentname", "student", "student name",
  "total", "totals", "grand total", "grandtotal", "sum",
  "percentage", "percent", "%", "pct",
  "grade", "category", "status", "result",
  "rank", "remark", "remarks",
])

function isSubjectColumn(header: string): boolean {
  const lower = header.toLowerCase().replace(/[^a-z0-9. ]/g, "").trim()
  return !SKIP_COLUMNS.has(lower)
}

function findNameColumn(headers: string[]): number {
  const nameHints = ["name", "studentname", "student name", "student"]
  for (const hint of nameHints) {
    const idx = headers.findIndex(h => h.toLowerCase().replace(/\s+/g, "").includes(hint.replace(/\s+/g, "")))
    if (idx !== -1) return idx
  }
  // Fallback: first text column
  return 0
}

// ─── Excel/CSV Parser ─────────────────────────────────────────────────────────

export async function parseExcelFile(file: File): Promise<ClassParseResult> {
  const XLSX = await import("xlsx")
  const buf = await file.arrayBuffer()
  const workbook = XLSX.read(buf, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })

  if (rows.length < 2) {
    return { students: [], subjects: [], errors: ["File appears to be empty or has only headers."] }
  }

  const headers = rows[0].map(h => String(h ?? "").trim())
  const nameIdx = findNameColumn(headers)
  const subjectIndices: number[] = []

  headers.forEach((h, i) => {
    if (i !== nameIdx && isSubjectColumn(h) && h !== "") {
      subjectIndices.push(i)
    }
  })

  const subjects = subjectIndices.map(i => headers[i])
  const students: ParsedStudent[] = []
  const errors: string[] = []

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[]
    const name = sanitizeName(row[nameIdx])
    if (!name || name.toLowerCase() === "total" || name.toLowerCase() === "average") continue

    const marks: Record<string, number> = {}
    let totalObtained = 0
    let totalMax = 0
    let hasAnyMark = false

    for (const idx of subjectIndices) {
      const subject = headers[idx]
      const val = toNumber(row[idx])
      // Try to detect max marks - default 100 per subject
      marks[subject] = val ?? 0
      if (val !== null && val >= 0) {
        totalObtained += val
        totalMax += 100
        hasAnyMark = true
      }
    }

    if (!hasAnyMark && subjects.length > 0) {
      errors.push(`Row ${r + 1}: No valid marks found for "${name}" - skipped.`)
      continue
    }

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0

    students.push({
      name,
      marks,
      total: totalObtained,
      maxTotal: totalMax,
      percentage: Math.round(percentage * 100) / 100,
      category: getCategory(percentage),
      grade: getGrade(percentage),
    })
  }

  return { students, subjects, errors }
}

// ─── PDF Parser (text-extraction approach) ────────────────────────────────────

export async function parsePDFFile(file: File): Promise<ClassParseResult> {
  const errors: string[] = []

  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const buf = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise
    let fullText = ""

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ")
      fullText += pageText + "\n"
    }

    return parsePDFText(fullText)
  } catch (err) {
    errors.push(`PDF parsing failed: ${String(err)}`)
    return { students: [], subjects: [], errors }
  }
}

/**
 * Heuristic PDF text parser.
 * Attempts to find lines with a student name followed by numeric marks.
 */
function parsePDFText(text: string): ClassParseResult {
  const lines = text
    .split(/\n|\r/)
    .map(l => l.trim())
    .filter(Boolean)

  const errors: string[] = []
  const students: ParsedStudent[] = []

  // Try to detect header line — a line with multiple words and no big numbers
  let headerLine: string | null = null
  let headerLineIdx = -1
  const numberPattern = /^\d+(\.\d+)?$/

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const tokens = lines[i].split(/\s{2,}|\t/)
    if (tokens.length >= 3) {
      const numericRatio = tokens.filter(t => numberPattern.test(t.trim())).length / tokens.length
      if (numericRatio < 0.4) {
        headerLine = lines[i]
        headerLineIdx = i
        break
      }
    }
  }

  // Extract subjects from header
  let subjects: string[] = []
  if (headerLine) {
    const tokens = headerLine.split(/\s{2,}|\t/).map(t => t.trim()).filter(Boolean)
    subjects = tokens.filter(t => isSubjectColumn(t) && !numberPattern.test(t))
  }

  // Parse data lines: lines with at least one name chunk + several numbers
  const dataLines = lines.slice(headerLineIdx + 1)
  for (const line of dataLines) {
    const tokens = line.split(/\s{2,}|\t/).map(t => t.trim()).filter(Boolean)
    if (tokens.length < 2) continue

    const numericTokens = tokens.filter(t => numberPattern.test(t))
    if (numericTokens.length < 1) continue

    // Name heuristic: leading non-numeric contiguous tokens
    let nameEndIdx = 0
    for (let i = 0; i < tokens.length; i++) {
      if (numberPattern.test(tokens[i])) { nameEndIdx = i; break }
      nameEndIdx = i + 1
    }

    const name = tokens.slice(0, nameEndIdx).join(" ").trim()
    if (!name || name.length < 2) continue

    const markValues = tokens.slice(nameEndIdx).map(t => parseFloat(t)).filter(n => !isNaN(n))
    if (markValues.length === 0) continue

    // Skip total/sum rows
    if (["total", "average", "avg", "sum"].includes(name.toLowerCase())) continue

    const marks: Record<string, number> = {}
    // Drop last value if it looks like a total (optional heuristic)
    const subjectMarks = markValues.length > subjects.length && subjects.length > 0
      ? markValues.slice(0, subjects.length)
      : markValues

    subjectMarks.forEach((val, idx) => {
      const subject = subjects[idx] ?? `Subject ${idx + 1}`
      marks[subject] = val
    })

    if (subjects.length === 0 && subjectMarks.length > 0) {
      subjectMarks.forEach((val, idx) => {
        marks[`Subject ${idx + 1}`] = val
      })
      if (students.length === 0) {
        subjectMarks.forEach((_, idx) => {
          subjects.push(`Subject ${idx + 1}`)
        })
      }
    }

    const totalObtained = subjectMarks.reduce((a, b) => a + b, 0)
    const totalMax = subjectMarks.length * 100
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0

    students.push({
      name,
      marks,
      total: Math.round(totalObtained * 100) / 100,
      maxTotal: totalMax,
      percentage: Math.round(percentage * 100) / 100,
      category: getCategory(percentage),
      grade: getGrade(percentage),
    })
  }

  if (students.length === 0) {
    errors.push("Could not extract structured data from PDF. Please try using an Excel/CSV file instead.")
  }

  return { students, subjects, errors }
}

// ─── Post-processing ──────────────────────────────────────────────────────────

export function rankStudents(students: ParsedStudent[]): ParsedStudent[] {
  const sorted = [...students].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage
    return a.name.localeCompare(b.name)
  })
  return sorted.map((s, i) => ({ ...s, rank: i + 1 }))
}

export interface ClassStats {
  total: number
  passed: number
  failed: number
  distinction: number
  passRate: number
  failRate: number
  distinctionRate: number
  avgPercentage: number
  highest: number
  lowest: number
  median: number
}

export function computeClassStats(students: ParsedStudent[]): ClassStats {
  if (students.length === 0) {
    return { total: 0, passed: 0, failed: 0, distinction: 0, passRate: 0, failRate: 0, distinctionRate: 0, avgPercentage: 0, highest: 0, lowest: 0, median: 0 }
  }

  const pcts = students.map(s => s.percentage).sort((a, b) => a - b)
  const total = students.length
  const distinction = students.filter(s => s.category === "distinction").length
  const failed = students.filter(s => s.category === "fail").length
  const passed = total - failed
  const avg = pcts.reduce((a, b) => a + b, 0) / total
  const median = total % 2 === 0
    ? (pcts[total / 2 - 1] + pcts[total / 2]) / 2
    : pcts[Math.floor(total / 2)]

  return {
    total,
    passed,
    failed,
    distinction,
    passRate: (passed / total) * 100,
    failRate: (failed / total) * 100,
    distinctionRate: (distinction / total) * 100,
    avgPercentage: Math.round(avg * 100) / 100,
    highest: pcts[pcts.length - 1],
    lowest: pcts[0],
    median: Math.round(median * 100) / 100,
  }
}

/** Simple rule-based AI insight generator */
export function generateAIInsight(stats: ClassStats, subjects: string[]): string {
  const { total, passed, failed, distinction, avgPercentage, highest, lowest } = stats
  const passRate = Math.round(stats.passRate)
  const failRate = Math.round(stats.failRate)
  const distRate = Math.round(stats.distinctionRate)

  let level = "average"
  if (avgPercentage >= 75) level = "excellent"
  else if (avgPercentage >= 60) level = "good"
  else if (avgPercentage < 40) level = "below average"

  const spread = highest - lowest
  const spreadDesc = spread > 40 ? "wide variation" : spread > 20 ? "moderate variation" : "consistent performance"

  let insight = `The overall class performance is ${level}, with an average score of ${avgPercentage.toFixed(1)}% across ${total} student${total !== 1 ? "s" : ""}. `

  if (distRate >= 50) insight += `A strong ${distRate}% of students achieved distinction (≥75%), indicating a high-performing cohort. `
  else if (distRate >= 25) insight += `${distRate}% of students achieved distinction, showing a solid upper tier. `
  else insight += `Only ${distRate}% reached distinction: targeted enrichment programs may help high-potential students. `

  if (failRate === 0) {
    insight += `Notably, no student failed: an excellent outcome. `
  } else if (failRate <= 10) {
    insight += `${failed} student${failed > 1 ? "s" : ""} failed (${failRate}%), which is a small proportion and may warrant individual counselling. `
  } else if (failRate <= 30) {
    insight += `${failRate}% failure rate suggests some students need additional academic support. `
  } else {
    insight += `A high failure rate of ${failRate}% signals systemic challenges: curriculum review or remedial classes are recommended. `
  }

  insight += `There is ${spreadDesc} in scores (highest: ${highest.toFixed(1)}%, lowest: ${lowest.toFixed(1)}%). `

  if (subjects.length > 0) {
    insight += `The analysis covers ${subjects.length} subject${subjects.length > 1 ? "s" : ""}. `
  }

  insight += `Faculty should focus ${failRate > 20 ? "urgently" : "selectively"} on at-risk students to improve overall outcomes.`

  return insight
}
