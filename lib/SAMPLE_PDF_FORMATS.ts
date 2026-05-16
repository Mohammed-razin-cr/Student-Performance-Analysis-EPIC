/**
 * Sample PDF Marks Sheet Formats
 * 
 * This file contains example PDF content that the system can parse.
 * Use these formats as templates for your marks sheets.
 */

// ============================================
// FORMAT 1: Structured Table Format (RECOMMENDED)
// ============================================

/*
MARKS SHEET - SEMESTER 1
Department: Computer Science
Academic Year: 2024-2025

Student Information:
USN: P19MT24S126083
Name: John Doe
Department: Computer Science
Semester: 1

SUBJECT-WISE MARKS DISTRIBUTION
(Internal1: 15 marks, Internal2: 15 marks, Semester: 70 marks, Total: 100 marks)

Subject Code | Subject Name              | Int1 | Int2 | Semester | Total
-------------|---------------------------|------|------|----------|-------
CS301        | Data Structures           | 12   | 14   | 55       | 81
CS302        | Algorithms                | 11   | 13   | 52       | 76
CS303        | Database Systems          | 10   | 12   | 48       | 70
CS304        | Web Development           | 13   | 15   | 58       | 86
CS305        | Object Oriented Design    | 12   | 13   | 54       | 79
CS306        | Linux & Shell Programming | 11   | 14   | 56       | 81
CS307        | Data Structures Lab       | 14   | 15   | 60       | 89
CS308        | Programming Lab           | 13   | 14   | 58       | 85

Student Information:
USN: P19MT24S126084
Name: Jane Smith
Department: Computer Science
Semester: 1

Subject Code | Subject Name              | Int1 | Int2 | Semester | Total
-------------|---------------------------|------|------|----------|-------
CS301        | Data Structures           | 13   | 15   | 60       | 88
CS302        | Algorithms                | 12   | 14   | 55       | 81
CS303        | Database Systems          | 11   | 13   | 50       | 74
CS304        | Web Development           | 14   | 15   | 62       | 91
CS305        | Object Oriented Design    | 13   | 14   | 56       | 83
CS306        | Linux & Shell Programming | 12   | 15   | 58       | 85
CS307        | Data Structures Lab       | 15   | 15   | 65       | 95
CS308        | Programming Lab           | 14   | 15   | 60       | 89
*/

// ============================================
// FORMAT 2: Line-by-Line Format
// ============================================

/*
ACADEMIC MARKS REPORT

Department: Computer Science
Semester: 1
Date: 2024-12-15

===== Student Record 1 =====
USN: P19MT24S126083
Name: John Doe
Register Number: 126083
Dept: Computer Science
Semester: 1

MARKS ENTRY:
CS301 Data Structures 12 14 55 81
CS302 Algorithms 11 13 52 76
CS303 Database Systems 10 12 48 70
CS304 Web Development 13 15 58 86

===== Student Record 2 =====
USN: P19MT24S126084
Name: Jane Smith
Register Number: 126084
Dept: Computer Science
Semester: 1

MARKS ENTRY:
CS301 Data Structures 13 15 60 88
CS302 Algorithms 12 14 55 81
CS303 Database Systems 11 13 50 74
CS304 Web Development 14 15 62 91
*/

// ============================================
// FORMAT 3: Compact Inline Format
// ============================================

/*
SEMESTER 1 MARKS SHEET
Dept: CS, Academic Year: 2024-25

Register: 126083, Name: John Doe
CS301 Data-Structures 12 14 55 81
CS302 Algorithms 11 13 52 76
CS303 Database-Systems 10 12 48 70
CS304 Web-Development 13 15 58 86

Register: 126084, Name: Jane Smith
CS301 Data-Structures 13 15 60 88
CS302 Algorithms 12 14 55 81
CS303 Database-Systems 11 13 50 74
CS304 Web-Development 14 15 62 91
*/

// ============================================
// IMPORTANT PARSING RULES
// ============================================

/*
The PDF parser looks for:

1. STUDENT IDENTIFIER (one of):
   - "USN: <code>"
   - "Roll: <number>"
   - "Register: <code>"
   - "StudentID: <code>"
   - "Student ID: <code>"

2. STUDENT NAME (following):
   - "Name: <full name>"

3. SUBJECT MARKS (format):
   - <Subject Code> <Subject Name> <Int1> <Int2> <Semester> <Total>
   
   Example: CS301 Data Structures 12 14 55 81
   
   Where:
   - Subject Code: 6-8 character alphanumeric (CS301, MCA101T)
   - Subject Name: Any text until marks start
   - Int1: Internal 1 marks (0-15)
   - Int2: Internal 2 marks (0-15)
   - Semester: Semester exam marks (0-70)
   - Total: Final total (0-100)

4. OPTIONAL METADATA:
   - Department: "Department: <name>" or "Dept: <code>"
   - Semester: "Semester: <number>" or "Sem: <number>"

RULES FOR SUCCESSFUL PARSING:
- Each student must have a clear identifier (USN, Roll, etc.)
- Subject marks must be on a single line or consecutive
- Marks must be numbers, separated by spaces or delimiters
- PDF must be text-based (not scanned/image)
- Clear formatting (table or line-by-line is best)

AVOID:
- Scanned PDFs or images (no OCR)
- Mixed formats (consistent format required)
- Hidden or embedded data
- Non-standard delimiters
*/

// ============================================
// DATA VALIDATION RULES
// ============================================

/*
The system validates:

1. Student Data:
   ✓ StudentId: Must be non-empty string
   ✓ StudentName: Must be non-empty string
   ✓ Subjects: Must have at least 1 subject

2. Mark Ranges:
   ✓ Internal1: 0-15
   ✓ Internal2: 0-15
   ✓ Semester: 0-70
   ✓ Total: 0-100

3. Calculations:
   ✓ internalsTotal = internal1 + internal2
   ✓ finalTotal = internalsTotal + semester
   ✓ percentage = finalTotal (already 0-100)
   ✓ grade = calculated from percentage

INVALID RECORDS ARE:
- Missing student ID
- Missing student name
- No subjects with marks
- Marks outside valid ranges
*/

// ============================================
// EXAMPLE: Creating a Marks PDF
// ============================================

/*
If you're creating your own marks sheet PDF:

1. Use a text-based PDF creator (not scanner/image)
2. Create a clear table structure
3. Include all required fields:
   - Student ID (USN, Roll, etc.)
   - Student Name
   - Subject Code (6-8 chars)
   - Subject Name
   - Internal1 (0-15)
   - Internal2 (0-15)
   - Semester (0-70)
   - Total (0-100)

4. Format example:
   
   Student ID: P19MT24S126083
   Student Name: John Doe
   Department: Computer Science
   Semester: 1
   
   CS301 | Data Structures | 12 | 14 | 55 | 81
   CS302 | Algorithms | 11 | 13 | 52 | 76
   CS303 | Database Systems | 10 | 12 | 48 | 70

5. Test with the parser:
   - Upload to the system
   - Check preview for accuracy
   - Verify all students are extracted
   - Review any error messages

6. If parsing fails:
   - Check PDF is text-based (not scanned)
   - Verify student identifiers format
   - Ensure marks are in valid ranges
   - Try different formatting
   - Check for special characters
*/

// ============================================
// TROUBLESHOOTING TIPS
// ============================================

/*
Problem: "No student marks found in PDF"
Solution:
- Ensure PDF has clear student identifiers (USN, Roll, etc.)
- Check subject marks format (Code Name Int1 Int2 Sem Total)
- Verify PDF is text-based, not scanned image
- Try using the recommended format above

Problem: "Invalid marks data for student"
Solution:
- Check marks are in valid ranges (Int1: 0-15, Int2: 0-15, Sem: 0-70)
- Ensure all 6 values are present for each subject
- Verify no special characters in marks
- Check subject codes are 6-8 characters

Problem: Only some students extracted
Solution:
- Check student name format (should follow "Name:" pattern)
- Verify consistent formatting throughout PDF
- Check for typos in student identifiers
- Ensure each student block is separated

Problem: Marks not showing in system after upload
Solution:
- Verify upload showed success message
- Check browser console for errors
- Refresh the page
- Verify Firebase Firestore has the data
- Check studentId matches the document ID
*/
