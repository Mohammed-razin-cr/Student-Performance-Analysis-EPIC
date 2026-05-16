import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'data.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    // Parse the data.txt file
    const lines = fileContent.split('\n').filter(line => line.trim())
    const students = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip "Admin" line
      if (line === 'Admin') continue

      // Check if line contains email
      if (line.includes('@eastpoint.ac.in')) {
        const email = line
        const studentId = email.split('@')[0]

        // Look for password on next line
        let password = ''
        if (i + 1 < lines.length) {
          password = lines[i + 1].trim()
          i++ // Skip the password line
        }

        // Look for name - it might be before or after
        let name = ''
        // Check previous lines for name
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const potentialName = lines[j].trim()
          if (potentialName && !potentialName.includes('@') && potentialName !== 'Admin' && potentialName.length > 2) {
            name = potentialName
            break
          }
        }

        // If no name found before, check after
        if (!name) {
          for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
            const potentialName = lines[j].trim()
            if (potentialName && !potentialName.includes('@') && potentialName !== 'Admin' && potentialName.length > 2) {
              name = potentialName
              break
            }
          }
        }

        if (name) {
          students.push({
            name,
            email,
            password,
            studentId
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      students
    })
  } catch (error) {
    console.error('Error reading data.txt:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to read student data'
    }, { status: 500 })
  }
}