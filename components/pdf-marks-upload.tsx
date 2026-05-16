/**
 * PDF Marks Upload Component
 * Allows admin to upload and preview student marks from PDF
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserData } from '@/hooks/useFirestore';
import {
  parsePDFMarksSheet,
  PDFParseResult,
  ExtractedStudentMarks,
} from '@/lib/pdfParser';
import { saveStudentMarks, getAllStudents } from '@/lib/firestore';
import { MarksAnalyticsDashboard } from '@/components/marks-analytics-dashboard';
import { generateDetailedPDFReport } from '@/lib/pdfReportGenerator';
import type { User, StudentMarks, SubjectMarks } from '@/types/firestore';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Eye,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import { isAdminRole } from '@/lib/utils';

interface PDFMarksUploadProps {
  onUploadComplete?: () => void;
}

export const PDFMarksUpload = ({ onUploadComplete }: PDFMarksUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<PDFParseResult | null>(null);
  const [combinedStudents, setCombinedStudents] = useState<ExtractedStudentMarks[]>([]);
  const [combinedErrors, setCombinedErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ExtractedStudentMarks | null>(null);
  const [localMarksData, setLocalMarksData] = useState<StudentMarks[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userData: user } = useUserData();

  // Check if user is admin
  if (!user || !isAdminRole(user.role)) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Only administrators can upload marks. Please contact your admin.
        </AlertDescription>
      </Alert>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length === 0) return;
    const invalid = selected.find(f => !f.type.includes('pdf') && !f.name.endsWith('.pdf'));
    if (invalid) {
      toast.error('Please select only PDF files');
      return;
    }

    setFiles(selected);
    setParseResult(null);
    setCombinedStudents([]);
    setCombinedErrors([]);
    setLocalMarksData(null);
  };

  const handleParsePDF = async () => {
    if (!files || files.length === 0) {
      toast.error('Please select one or more PDF files');
      return;
    }

    setParsing(true);
    const allStudents: ExtractedStudentMarks[] = [];
    const allErrors: string[] = [];
    let totalPages = 0;

    try {
      for (const f of files) {
        try {
          const result = await parsePDFMarksSheet(f);
          totalPages += result.totalPages || 0;
          if (result.students && result.students.length > 0) {
            allStudents.push(...result.students);
          }
          if (result.errors && result.errors.length > 0) {
            allErrors.push(...result.errors.map(e => `${f.name}: ${e}`));
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          allErrors.push(`${f.name}: ${errorMsg}`);
        }
      }

      setCombinedStudents(allStudents);
      setCombinedErrors(allErrors);

      const summary: PDFParseResult = {
        students: allStudents,
        totalPages,
        extractedCount: allStudents.length,
        errors: allErrors,
      };

      setParseResult(summary);

      if (allErrors.length > 0) {
        toast.error(`Parsing completed with ${allErrors.length} error(s)`);
      } else if (allStudents.length === 0) {
        toast.warning('No student marks found in selected PDFs');
      } else {
        toast.success(`Successfully parsed marks for ${allStudents.length} student(s)`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to parse PDFs: ${errorMsg}`);
      console.error('PDF parsing error:', error);
    } finally {
      setParsing(false);
    }
  };

  const handleUploadMarks = async () => {
    if (!parseResult || parseResult.students.length === 0) {
      toast.error('No student marks to upload');
      return;
    }

    setUploading(true);
    const uploadedStudents: string[] = [];
    const failedStudents: string[] = [];

    try {
      for (const extractedStudent of parseResult.students) {
        try {
          // Convert extracted data to StudentMarks format
          const subjects: SubjectMarks[] = extractedStudent.subjects.map(subject => ({
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            internal1: subject.internal1 || { obtained: 0, total: 15 },
            internal2: subject.internal2 || { obtained: 0, total: 15 },
            internalsTotal: subject.internalsTotal || 0,
            semester: subject.semester || { obtained: 0, total: 70 },
            finalTotal: subject.finalTotal || 0,
            percentage: subject.percentage || 0,
            grade: subject.grade,
            attendancePercentage: 0,
          }));

          const marksData: StudentMarks = {
            userId: extractedStudent.studentId, // Using studentId as userId temporarily
            studentId: extractedStudent.studentId,
            studentName: extractedStudent.studentName,
            department: extractedStudent.department || user?.department || '',
            semester: extractedStudent.semester,
            subjects,
            totalMarks: extractedStudent.totalMarks || 0,
            totalPercentage: extractedStudent.totalPercentage || 0,
            attendance: [],
            attendancePercentage: 0,
            exams: [],
            lastUpdated: Timestamp.now(),
          };

          // Save to Firestore - using studentId as the document ID
          await saveStudentMarks(marksData);
          uploadedStudents.push(extractedStudent.studentName);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          failedStudents.push(`${extractedStudent.studentName} (${errorMsg})`);
          console.error('Error uploading student marks:', error);
        }
      }

      // Show results
      if (uploadedStudents.length > 0) {
        toast.success(
          `Successfully uploaded marks for ${uploadedStudents.length} student(s)`
        );
      }

      if (failedStudents.length > 0) {
        toast.error(
          `Failed to upload ${failedStudents.length} student(s): ${failedStudents.join(', ')}`
        );
      }

      // Reset state
      setFiles([]);
      setParseResult(null);
      setCombinedStudents([]);
      setCombinedErrors([]);
      setLocalMarksData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call callback
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Upload failed: ${errorMsg}`);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Subject Code,Subject Name,Internal1,Internal2,Semester,Total
CS301,Data Structures,10,12,45,67
CS302,Algorithms,11,13,48,72
CS303,Database Systems,9,11,42,62`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(template));
    element.setAttribute('download', 'marks_template.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Template downloaded');
  };

  return (
    <>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Upload Marks from PDF
          </CardTitle>
          <CardDescription>
            Upload a student marks PDF sheet to automatically extract and store marks in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="text-base font-semibold">
              Select PDF File
            </Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="pdf-upload"
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  // Handle multiple file selection
                  const selected = e.target.files ? Array.from(e.target.files) : [];
                  setFiles(selected);
                  setParseResult(null);
                  setCombinedStudents([]);
                  setCombinedErrors([]);
                  setLocalMarksData(null);
                }}
                disabled={parsing || uploading}
                className="cursor-pointer"
              />
              {files.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiles([]);
                    setParseResult(null);
                    setCombinedStudents([]);
                    setCombinedErrors([]);
                    setLocalMarksData(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {files.length > 0 && (
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Selected files:</span>
                </div>
                <ul className="list-disc list-inside ml-5">
                  {files.map((f, i) => (
                    <li key={i}>{f.name} ({(f.size / 1024).toFixed(2)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Parse Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleParsePDF}
              disabled={files.length === 0 || parsing || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {parsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Parse Selected PDFs
            </Button>

            <Button
              variant="outline"
              onClick={downloadTemplate}
              disabled={parsing || uploading}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>

            <Button
              variant="secondary"
              onClick={async () => {
                // Analyze locally without uploading
                if (combinedStudents.length === 0) {
                  toast.error('No parsed student data. Please parse selected PDFs first.');
                  return;
                }

                // Convert extracted data to StudentMarks[] and set localMarksData
                const marksArr: StudentMarks[] = combinedStudents.map(s => ({
                  userId: s.studentId,
                  studentId: s.studentId,
                  studentName: s.studentName,
                  department: s.department || user?.department || '',
                  semester: s.semester || '',
                  subjects: s.subjects.map(sub => ({
                    subjectName: sub.subjectName,
                    subjectCode: sub.subjectCode,
                    internal1: sub.internal1 || { obtained: 0, total: 15 },
                    internal2: sub.internal2 || { obtained: 0, total: 15 },
                    internalsTotal: sub.internalsTotal || 0,
                    semester: sub.semester || { obtained: 0, total: 70 },
                    finalTotal: sub.finalTotal || 0,
                    percentage: sub.percentage || 0,
                    grade: sub.grade,
                  })),
                  totalMarks: s.totalMarks || 0,
                  totalPercentage: s.totalPercentage || 0,
                  attendance: [],
                  attendancePercentage: 0,
                  exams: [],
                  lastUpdated: Timestamp.now(),
                }));

                setLocalMarksData(marksArr);
                toast.success(`Prepared local analysis for ${marksArr.length} student(s)`);
              }}
              disabled={parsing || uploading}
            >
              Analyze Locally
            </Button>

            <Button
              variant="ghost"
              onClick={async () => {
                if (!localMarksData || localMarksData.length === 0) {
                  toast.error('No local analysis available. Click "Analyze Locally" first.');
                  return;
                }

                try {
                  await generateDetailedPDFReport(localMarksData, {
                    title: 'Local Marks Report',
                    includeCharts: true,
                    includeStatistics: true,
                    includeRankings: true,
                    topPerformersCount: 20,
                  });
                  toast.success('Local PDF report downloaded');
                } catch (err) {
                  console.error('Download PDF Error', err);
                  toast.error('Failed to generate local PDF report');
                }
              }}
              disabled={parsing || uploading || !localMarksData || localMarksData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Local Report
            </Button>
          </div>

          {/* Parse Results */}
          {parseResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Total Pages</p>
                    <p className="text-2xl font-bold">{parseResult.totalPages}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Students Found</p>
                    <p className="text-2xl font-bold text-green-600">
                      {parseResult.extractedCount}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{parseResult.errors.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <div className="font-semibold mb-2">Parsing Warnings:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {parseResult.errors.map((error, idx) => (
                        <li key={idx} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Students List */}
              {parseResult.students.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Extracted Students</h3>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Subjects</TableHead>
                          <TableHead>Total %</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseResult.students.map((student, idx) => (
                          <TableRow key={idx} className="border-gray-200">
                            <TableCell className="font-mono text-sm">
                              {student.studentId}
                            </TableCell>
                            <TableCell>{student.studentName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.subjects.length}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                {student.totalPercentage?.toFixed(2) || 'N/A'}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowPreview(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUploadMarks}
                disabled={uploading || parseResult.students.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading
                  ? `Uploading... (${parseResult.students.length} students)`
                  : `Upload ${parseResult.students.length} Student(s) to Firebase`}
              </Button>
            </div>
          )}

          {localMarksData && localMarksData.length > 0 && (
            <div className="mt-6">
              <MarksAnalyticsDashboard marksData={localMarksData} title="Local Analysis (Selected PDFs)" />
            </div>
          )}

        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Marks Preview</DialogTitle>
            <DialogDescription>
              {selectedStudent?.studentId} - {selectedStudent?.studentName}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Department</p>
                  <p className="text-lg font-semibold">{selectedStudent.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Semester</p>
                  <p className="text-lg font-semibold">{selectedStudent.semester || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Percentage</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {selectedStudent.totalPercentage?.toFixed(2) || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Subjects</p>
                  <p className="text-lg font-semibold">{selectedStudent.subjects.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Subject Marks</h4>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Subject Code</TableHead>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Int1</TableHead>
                      <TableHead>Int2</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStudent.subjects.map((subject, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">
                          {subject.subjectCode}
                        </TableCell>
                        <TableCell className="text-sm">{subject.subjectName}</TableCell>
                        <TableCell>
                          {subject.internal1?.obtained}/{subject.internal1?.total}
                        </TableCell>
                        <TableCell>
                          {subject.internal2?.obtained}/{subject.internal2?.total}
                        </TableCell>
                        <TableCell>
                          {subject.semester?.obtained}/{subject.semester?.total}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {subject.finalTotal || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subject.grade || 'N/A'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
