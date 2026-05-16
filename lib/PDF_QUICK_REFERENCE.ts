/**
 * PDF Marks Upload - Quick Reference for Developers
 * 
 * This file contains quick code examples and integration patterns
 */

import { useState, useEffect } from 'react';
import { Timestamp, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  parsePDFMarksSheet,
  extractTextFromPDF,
  parseMarksTable,
  PDFParseResult
} from '@/lib/pdfParser';
import {
  saveStudentMarks,
  updateStudentMarks,
  getAllStudentMarks,
  getStudentMarks,
  getStudentMarksByDepartment
} from '@/lib/firestore';
import type {
  StudentMarks,
  SubjectMarks
} from '@/types/firestore';

// ============================================
// USING THE PDF PARSER
// ============================================

// Example 1: Parse a PDF file
async function handlePDFUpload(file: File) {
  const result: PDFParseResult = await parsePDFMarksSheet(file);

  console.log('Total pages:', result.totalPages);
  console.log('Students found:', result.extractedCount);
  console.log('Errors:', result.errors);
  console.log('Parsed students:', result.students);

  return result;
}

// Example 2: Extract raw text from PDF
async function getRawPDFText(file: File) {
  const text = await extractTextFromPDF(file);
  console.log('Extracted text:', text);
  return text;
}

// Example 3: Parse marks from text
function parseMarksFromText(text: string) {
  const students = parseMarksTable(text);
  return students;
}

// ============================================
// SAVING TO FIRESTORE
// ============================================

// Example 1: Save new student marks
async function saveNewMarks(studentId: string, studentName: string, subjects: SubjectMarks[]) {
  const marksData: StudentMarks = {
    userId: studentId,
    studentId: studentId,
    studentName: studentName,
    department: 'Computer Science',
    semester: '1',
    subjects: subjects,
    totalMarks: subjects.reduce((sum, s) => sum + (s.finalTotal || 0), 0),
    totalPercentage: subjects.length > 0
      ? subjects.reduce((sum, s) => sum + (s.finalTotal || 0), 0) / subjects.length
      : 0,
    exams: [],
    attendance: [],
    attendancePercentage: 0,
    lastUpdated: Timestamp.now(),
  };

  await saveStudentMarks(marksData);
}

// Example 2: Update existing marks
async function updateExistingMarks(studentId: string, newSubjects: SubjectMarks[]) {
  await updateStudentMarks(studentId, {
    subjects: newSubjects,
    totalMarks: newSubjects.reduce((sum, s) => sum + (s.finalTotal || 0), 0),
    totalPercentage: newSubjects.length > 0
      ? newSubjects.reduce((sum, s) => sum + (s.finalTotal || 0), 0) / newSubjects.length
      : 0,
  });
}

// Example 3: Fetch marks for a student
async function getStudentMarksData(studentId: string) {
  const marks = await getStudentMarks(studentId);
  return marks;
}

// Example 4: Get all marks
async function getAllMarks() {
  const allMarks = await getAllStudentMarks();
  return allMarks;
}

// ============================================
// CREATING SUBJECT MARKS OBJECT
// ============================================

function createSubjectMarks(
  code: string,
  name: string,
  int1: number,
  int2: number,
  semester: number
): SubjectMarks {
  const internalsTotal = int1 + int2;
  const finalTotal = internalsTotal + semester;

  // Calculate grade
  let grade = 'F';
  if (finalTotal >= 90) grade = 'A+';
  else if (finalTotal >= 80) grade = 'A';
  else if (finalTotal >= 70) grade = 'B+';
  else if (finalTotal >= 60) grade = 'B';
  else if (finalTotal >= 50) grade = 'C+';
  else if (finalTotal >= 40) grade = 'C';
  else if (finalTotal >= 35) grade = 'D';

  return {
    subjectCode: code,
    subjectName: name,
    internal1: { obtained: int1, total: 15 },
    internal2: { obtained: int2, total: 15 },
    internalsTotal: internalsTotal,
    semester: { obtained: semester, total: 70 },
    finalTotal: finalTotal,
    percentage: finalTotal,
    grade: grade,
    attendancePercentage: 0,
  };
}

// ============================================
// BATCH PROCESSING EXAMPLE
// ============================================

async function uploadMultipleFiles(files: File[]) {
  const results = [];

  for (const file of files) {
    try {
      const result = await parsePDFMarksSheet(file);

      // Save all students from this PDF
      for (const student of result.students) {
        const marksData: StudentMarks = {
          userId: student.studentId,
          studentId: student.studentId,
          studentName: student.studentName,
          department: student.department || '',
          semester: student.semester,
          subjects: student.subjects.map(s => ({
            ...s,
            attendancePercentage: 0,
          })) as any, // Cast for simplicity in reference
          totalMarks: student.totalMarks || 0,
          totalPercentage: student.totalPercentage || 0,
          exams: [],
          attendance: [],
          attendancePercentage: 0,
          lastUpdated: Timestamp.now(),
        };

        await saveStudentMarks(marksData);
      }

      results.push({ file: file.name, status: 'success', count: result.extractedCount });
    } catch (error) {
      results.push({ file: file.name, status: 'error', error: String(error) });
    }
  }

  return results;
}

// ============================================
// FILTERING & SORTING MARKS
// =============================

// Get marks by department
async function getCSMarks() {
  const marks = await getStudentMarksByDepartment('Computer Science');
  return marks.sort((a, b) => b.totalPercentage - a.totalPercentage);
}

// Filter marks by percentage
async function getTopPerformers(threshold: number = 75) {
  const allMarks = await getAllStudentMarks();
  return allMarks
    .filter(m => m.totalPercentage >= threshold)
    .sort((a, b) => b.totalPercentage - a.totalPercentage);
}

// ============================================
// REACT HOOK PATTERN
// ============================================

export function useStudentMarks(studentId: string) {
  const [marks, setMarks] = useState<StudentMarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const data = await getStudentMarks(studentId);
        setMarks(data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [studentId]);

  return { marks, loading, error };
}

// ============================================
// FIRESTORE QUERIES EXAMPLES
// ============================================

// Query top 10 students by percentage
async function getTop10Students() {
  const marksRef = collection(db, 'studentMarks');
  const q = query(
    marksRef,
    orderBy('totalPercentage', 'desc'),
    limit(10)
  );

  const docs = await getDocs(q);
  return docs.docs.map(doc => doc.data() as StudentMarks);
}

// ============================================
// DEBUGGING & LOGGING
// ============================================

function debugParseResult(result: PDFParseResult) {
  console.log('=== PDF Parse Result ===');
  console.log('Pages:', result.totalPages);
  console.log('Students extracted:', result.extractedCount);
  console.log('Errors count:', result.errors.length);

  if (result.errors.length > 0) {
    console.log('Errors:');
    result.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log('Students:');
  result.students.forEach((student, i) => {
    console.log(`  ${i + 1}. ${student.studentId} - ${student.studentName}`);
    console.log(`     Subjects: ${student.subjects.length}`);
    console.log(`     Total: ${student.totalPercentage?.toFixed(2)}%`);
  });
}
