/**
 * PDF Parser Utility for Student Marks Extraction
 * Parses student marks from PDF documents
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker from a local static asset so parsing does not depend on a CDN.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface ExtractedStudentMarks {
  studentId: string;
  studentName: string;
  department?: string;
  semester?: string;
  subjects: ExtractedSubjectMarks[];
  totalMarks?: number;
  totalPercentage?: number;
  errors?: string[];
}

export interface ExtractedSubjectMarks {
  subjectName: string;
  subjectCode: string;
  internal1?: { obtained: number; total: number };
  internal2?: { obtained: number; total: number };
  internalsTotal?: number;
  semester?: { obtained: number; total: number };
  finalTotal?: number;
  percentage?: number;
  grade?: string;
}

export interface PDFParseResult {
  students: ExtractedStudentMarks[];
  totalPages: number;
  extractedCount: number;
  errors: string[];
}

/**
 * Extract text from PDF file
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
};

/**
 * Validate extracted marks data
 */
const validateMarksData = (data: any): boolean => {
  return (
    data.studentId &&
    data.studentName &&
    Array.isArray(data.subjects) &&
    data.subjects.length > 0
  );
};

/**
 * Calculate final marks from internal and semester
 */
const calculateFinalMarks = (subject: ExtractedSubjectMarks): void => {
  if (subject.internal1 && subject.internal2) {
    subject.internalsTotal = subject.internal1.obtained + subject.internal2.obtained;
  }
  
  if (subject.internalsTotal !== undefined && subject.semester) {
    subject.finalTotal = subject.internalsTotal + subject.semester.obtained;
    subject.percentage = subject.finalTotal;
    
    // Grade calculation (0-100 scale)
    const percentage = subject.finalTotal;
    if (percentage >= 90) subject.grade = 'A+';
    else if (percentage >= 85) subject.grade = 'A';
    else if (percentage >= 80) subject.grade = 'B+';
    else if (percentage >= 75) subject.grade = 'B';
    else if (percentage >= 70) subject.grade = 'C+';
    else if (percentage >= 65) subject.grade = 'C';
    else if (percentage >= 60) subject.grade = 'D';
    else subject.grade = 'F';
  }
};

/**
 * Parse table data from extracted text
 * Supports common marks sheet formats
 */
export const parseMarksTable = (text: string): ExtractedStudentMarks[] => {
  const students: ExtractedStudentMarks[] = [];
  const errors: string[] = [];
  
  try {
    // Look for patterns like "USN: P19MT24S126083" or "Roll: 126083"
    const usnPattern = /(?:USN|Roll|Register|StudentID|Student ID)[\s:]+([A-Z0-9]+)/gi;
    const namePattern = /(?:Name|Student Name)[\s:]+([A-Za-z\s]+?)(?:\n|Roll|USN|Register|Marks|Total)/gi;
    
    // Extract header information
    const headerMatch = text.match(/(?:Department|Dept)[\s:]+([A-Za-z\s&]+)/i);
    const semesterMatch = text.match(/(?:Semester|Sem)[\s:]+(\d+)/i);
    const deptMatch = headerMatch ? headerMatch[1].trim() : undefined;
    const semMatch = semesterMatch ? semesterMatch[1] : undefined;
    
    // Split text into potential student records
    // This regex looks for student identifiers
    const studentBlocks = text.split(/(?=(?:USN|Roll|Register|StudentID|Student ID)[\s:]+[A-Z0-9]+)/gi);
    
    for (const block of studentBlocks) {
      if (block.trim().length === 0) continue;
      
      const student: ExtractedStudentMarks = {
        studentId: '',
        studentName: '',
        department: deptMatch,
        semester: semMatch,
        subjects: [],
      };
      
      // Extract student ID
      const usnMatch = block.match(/(?:USN|Roll|Register|StudentID|Student ID)[\s:]+([A-Z0-9]+)/i);
      if (usnMatch) {
        student.studentId = usnMatch[1].trim();
      }
      
      // Extract student name
      const nameMatch = block.match(/(?:Name|Student Name)[\s:]+([A-Za-z\s]+?)(?:\n|,)/i);
      if (nameMatch) {
        student.studentName = nameMatch[1].trim();
      }
      
      // Extract subject marks
      // Pattern: Subject Code | Subject Name | Internal1 | Internal2 | Semester | Total
      const subjectPattern = /([A-Z0-9]{6,8})\s+([A-Za-z\s&\-\(\)]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g;
      let subjectMatch;
      
      while ((subjectMatch = subjectPattern.exec(block)) !== null) {
        const subject: ExtractedSubjectMarks = {
          subjectCode: subjectMatch[1].trim(),
          subjectName: subjectMatch[2].trim(),
          internal1: { obtained: parseInt(subjectMatch[3]), total: 15 },
          internal2: { obtained: parseInt(subjectMatch[4]), total: 15 },
          semester: { obtained: parseInt(subjectMatch[5]), total: 70 },
        };
        
        calculateFinalMarks(subject);
        student.subjects.push(subject);
      }
      
      // Calculate total marks and percentage
      if (student.subjects.length > 0) {
        const validSubjects = student.subjects.filter(s => s.finalTotal !== undefined);
        if (validSubjects.length > 0) {
          student.totalMarks = validSubjects.reduce((sum, s) => sum + (s.finalTotal || 0), 0);
          student.totalPercentage = Math.round(student.totalMarks / validSubjects.length);
        }
      }
      
      // Validate before adding
      if (validateMarksData(student)) {
        students.push(student);
      } else if (student.studentId || student.studentName) {
        // Partial data found, add error for this student
        errors.push(`Invalid marks data for student: ${student.studentId || student.studentName}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Error parsing marks table: ${errorMsg}`);
  }
  
  return students;
};

/**
 * Main function to parse PDF marks sheet
 */
export const parsePDFMarksSheet = async (file: File): Promise<PDFParseResult> => {
  const result: PDFParseResult = {
    students: [],
    totalPages: 0,
    extractedCount: 0,
    errors: [],
  };
  
  try {
    // Validate file
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      result.errors.push('Invalid file type. Please upload a PDF file.');
      return result;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      result.errors.push('File size too large. Maximum allowed is 50MB.');
      return result;
    }
    
    // Extract text from PDF
    const text = await extractTextFromPDF(file);
    
    // Get PDF info
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    result.totalPages = pdf.numPages;
    
    // Parse marks
    const students = parseMarksTable(text);
    
    if (students.length === 0) {
      result.errors.push(
        'No student marks data found in PDF. Please ensure the PDF follows the standard format with columns: ' +
        'Subject Code, Subject Name, Internal1, Internal2, Semester, Total'
      );
    } else {
      result.students = students;
      result.extractedCount = students.length;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Failed to parse PDF: ${errorMsg}`);
  }
  
  return result;
};

/**
 * Parse a simple CSV-like format within PDF
 * More reliable for structured data
 */
export const parseStructuredMarksFormat = (text: string): ExtractedStudentMarks[] => {
  const students: ExtractedStudentMarks[] = [];
  
  // Split by common delimiters or table structures
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentStudent: ExtractedStudentMarks | null = null;
  
  for (const line of lines) {
    // Check if this is a student identifier line
    if (/(?:USN|Roll|StudentID)[\s:]/i.test(line)) {
      if (currentStudent && currentStudent.studentId) {
        if (currentStudent.subjects.length > 0 && validateMarksData(currentStudent)) {
          students.push(currentStudent);
        }
      }
      
      currentStudent = {
        studentId: '',
        studentName: '',
        subjects: [],
      };
      
      const usnMatch = line.match(/([A-Z0-9]+)/);
      if (usnMatch) currentStudent.studentId = usnMatch[1];
    } else if (currentStudent && /(?:Name|Student)[\s:]/i.test(line)) {
      const nameMatch = line.match(/:\s*(.+)/);
      if (nameMatch) currentStudent.studentName = nameMatch[1].trim();
    } else if (currentStudent && /[A-Z0-9]{6,}\s+\d+\s+\d+\s+\d+/.test(line)) {
      // This looks like a subject marks line
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        const subject: ExtractedSubjectMarks = {
          subjectCode: parts[0],
          subjectName: parts[1] || '',
          internal1: { obtained: parseInt(parts[2]) || 0, total: 15 },
          internal2: { obtained: parseInt(parts[3]) || 0, total: 15 },
        };
        
        if (parts.length >= 6) {
          subject.semester = { obtained: parseInt(parts[4]) || 0, total: 70 };
          subject.finalTotal = parseInt(parts[5]) || 0;
        }
        
        calculateFinalMarks(subject);
        currentStudent.subjects.push(subject);
      }
    }
  }
  
  // Add last student
  if (currentStudent && currentStudent.studentId && currentStudent.subjects.length > 0) {
    if (validateMarksData(currentStudent)) {
      students.push(currentStudent);
    }
  }
  
  return students;
};
