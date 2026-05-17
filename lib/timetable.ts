import type { TimetableDay, TimetableSession } from "@/types/firestore"

export const TIMETABLE_DAYS: TimetableDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export const normalizeSemester = (semester?: string) =>
  (semester || "").trim().toLowerCase().replace(/^sem[-\s]?/, "")

export const parseTimetableCsv = (text: string): TimetableSession[] => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = lines[0].split(",").map(header => header.trim())
  const required = ["day", "startTime", "endTime", "subjectCode", "subjectName", "faculty"]
  const missing = required.filter(field => !headers.includes(field))
  if (missing.length) {
    throw new Error(`CSV is missing: ${missing.join(", ")}`)
  }

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map(value => value.trim())
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] || ""]))
    const day = row.day as TimetableDay

    if (!TIMETABLE_DAYS.includes(day)) {
      throw new Error(`Invalid day on row ${index + 2}: ${row.day}`)
    }

    return {
      day,
      startTime: row.startTime,
      endTime: row.endTime,
      subjectCode: row.subjectCode,
      subjectName: row.subjectName,
      faculty: row.faculty,
      room: row.room,
      isLab: ["true", "yes", "1"].includes((row.isLab || "").toLowerCase()),
    }
  })
}

export const sortSessions = (sessions: TimetableSession[]) =>
  sessions
    .filter(session =>
      Boolean(
        session
        && TIMETABLE_DAYS.includes(session.day)
        && session.startTime
        && session.endTime
        && session.subjectCode
        && session.subjectName
      )
    )
    .sort((a, b) => {
    const dayDiff = TIMETABLE_DAYS.indexOf(a.day) - TIMETABLE_DAYS.indexOf(b.day)
    return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime)
  })
