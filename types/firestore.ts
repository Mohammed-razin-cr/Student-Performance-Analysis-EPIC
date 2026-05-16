/**
 * Firestore Database Types for EPIC
 * Complete type definitions for all collections
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// USER TYPES
// ============================================

export type UserRole = 'student' | 'faculty' | 'admin';

export interface ParentInfo {
  mother: string;
  father: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  usn?: string;           // University Serial Number (e.g., p19mt24s126083)
  employeeId?: string;
  school: string;
  department: string;
  semester?: string;      // Current semester (1-8)
  age?: number;
  phone?: string;
  bio?: string;
  parentInfo?: ParentInfo;
  photoURL?: string;
  skills?: string[];
  interests?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// STUDENT PROFILE TYPES
// ============================================

export interface AreasOfInterest {
  sport: number;        // 0-100
  reading: number;      // 0-100
  hiTech: number;       // 0-100
  musicArt: number;     // 0-100
}

export interface PersonalityTraits {
  conscientiousness: number;  // 0-100
  openness: number;           // 0-100
  agreeableness: number;      // 0-100
  extraversion?: number;      // 0-100
  neuroticism?: number;       // 0-100
}

export type RecommendationType = 'stress' | 'program' | 'activity' | 'academic' | 'health';

export interface Recommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt?: Timestamp;
}

export type MedicalStatus = 'active' | 'cured' | 'monitoring' | 'inactive';

export interface MedicalHistory {
  condition: string;
  code: string;              // ICD-10 code
  status: MedicalStatus;
  recommendation?: string;
  lastEpisode?: string;      // Date string
  diagnosedDate?: string;    // Date string
  notes?: string;
}

export interface SocialContact {
  name: string;
  initial: string;
  relationship?: string;     // 'friend', 'mentor', 'peer', etc.
  contactInfo?: string;
}

export interface StudentProfile {
  userId: string;
  areasOfInterest: AreasOfInterest;
  traits: PersonalityTraits;
  recommendations: Recommendation[];
  medicalHistory: MedicalHistory[];
  socialContacts: SocialContact[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PREDICTION TYPES
// ============================================

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface PredictionInput {
  cgpa: number;              // 0-10
  credits: number;           // 0-200
  extraCurricular: number;   // 0-10
  projects: number;          // 0-10
  selfStudy: number;         // 0-10
  assignment: number;        // 0-1 (percentage as decimal)
  engagement: number;        // 0-10
  contribution: number;      // 0-10
}

export interface PredictionResult {
  grade: Grade;
  passProbability: number;   // 0-100
  risk: RiskLevel;
  improvementPotential: number;  // 0-10
  feedback?: string;
}

export interface Prediction {
  id: string;
  userId: string;
  input: PredictionInput;
  result: PredictionResult;
  createdAt: Timestamp;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface PerformanceDataPoint {
  month: string;             // 'Jan', 'Feb', etc.
  score: number;             // 0-100
  target?: number;           // 0-100
}

export interface AttendanceDataPoint {
  date: string;              // 'MM/DD' or ISO date
  percentage: number;        // 0-100
  status?: 'present' | 'absent' | 'late' | 'excused';
}

export interface SkillDataPoint {
  skill: string;             // Skill name
  score: number;             // 0-100
  category?: string;         // 'technical', 'soft', 'academic'
}

export interface GradeDistribution {
  grade: string;             // 'A+', 'A', etc.
  count: number;
  percentage: number;
}

export interface ActivityTrendPoint {
  week: string;              // 'W1', 'W2', etc.
  sports: number;            // 0-100
  cultural: number;          // 0-100
  technical: number;         // 0-100
}

export interface Analytics {
  userId: string;
  performanceData: PerformanceDataPoint[];
  attendanceData: AttendanceDataPoint[];
  skillsData: SkillDataPoint[];
  gradeDistribution: GradeDistribution[];
  activityTrend: ActivityTrendPoint[];
  lastUpdated: Timestamp;
}

// ============================================
// ASSIGNMENT & COURSE TYPES
// ============================================

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  maxScore: number;
  submittedBy?: string[];    // Array of user IDs
  createdAt: Timestamp;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  credits: number;
  instructor: string;        // User ID
  students: string[];        // Array of user IDs
  semester: string;
  year: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  score?: number;
  feedback?: string;
  submittedAt: Timestamp;
  gradedAt?: Timestamp;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'prediction' | 'assignment' | 'grade' | 'announcement' | 'alert';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface NotificationSettings {
  email: boolean;
  predictions: boolean;
  reports: boolean;
  assignments: boolean;
  grades: boolean;
}

export interface UserSettings {
  userId: string;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  updatedAt: Timestamp;
}

// ============================================
// MARKS & ATTENDANCE TYPES
// ============================================

// Subject-wise marks structure (MCA Pattern)
// Internal 1: 15 marks
// Internal 2: 15 marks  
// Semester Exam: 70 marks
// Total: 15 + 15 + 70 = 100 marks
export interface SubjectMarks {
  subjectName: string;
  subjectCode: string;
  // Attendance
  attendancePercentage?: number;  // Actual attendance % for this subject (0-100)
  // Internal Assessments
  internal1: { obtained: number; total: number; };   // Out of 15
  internal2: { obtained: number; total: number; };   // Out of 15
  internalsTotal: number;  // Sum of internal1 + internal2 (out of 30)
  // Semester Exam
  semester: { obtained: number; total: number; };  // Out of 70
  // Final Calculation
  finalTotal: number;     // internalsTotal + semester.obtained (out of 100)
  percentage: number;     // Same as finalTotal (already out of 100)
  grade?: string;
  // Legacy fields for backward compatibility
  attendance?: { obtained: number; total: number; };
  test?: { obtained: number; total: number; date?: string };
  assignment?: { obtained: number; total: number; };
  seminar?: { obtained: number; total: number; };
  iaTotal?: number;
}

export interface ExamMark {
  examName: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  date: string;  // ISO date string
}

export interface AttendanceRecord {
  date: string;  // ISO date string
  status: 'present' | 'absent' | 'late' | 'excused';
  subject?: string;
  remarks?: string;
}

export interface StudentMarks {
  userId: string;
  studentId: string;
  studentName: string;
  department: string;
  semester?: string;
  subjects: SubjectMarks[];  // Subject-wise marks
  totalMarks: number;
  totalPercentage: number;
  rank?: number;
  exams: ExamMark[];  // Legacy - for backward compatibility
  attendance: AttendanceRecord[];
  attendancePercentage: number;
  lastUpdated?: Timestamp;
}

// ============================================
// ACTIVITY MARKS TYPES
// ============================================

export interface ActivityMarks {
  sports: number;              // 0-100 - Sports participation
  cultural: number;            // 0-100 - Cultural participation
  technical: number;           // 0-100 - Technical participation
  classRoomActivity: number;   // 0-100 - Classroom participation
  eventsCompetitions: number;  // 0-100 - Events/Competitions participation
}

export interface StudentActivityMarks {
  userId: string;
  studentId: string;
  studentName: string;
  department: string;
  marks: ActivityMarks;  // Map of activity categories with scores
  lastUpdated: Timestamp;
}

// ============================================
// FRIEND REQUEST TYPES
// ============================================

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsn: string;
  senderPhotoURL?: string;
  receiverId: string;
  receiverName: string;
  receiverUsn: string;
  status: FriendRequestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Friend {
  id: string;
  friendId: string;
  friendName: string;
  friendUsn: string;
  friendPhotoURL?: string;
  friendDepartment?: string;
  friendSchool?: string;
  addedAt: Timestamp;
}

// ============================================
// HELPER TYPES
// ============================================

// For creating new documents (without id and timestamps)
export type CreateUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateStudentProfile = Omit<StudentProfile, 'createdAt' | 'updatedAt'>;
export type CreatePrediction = Omit<Prediction, 'id' | 'createdAt'>;
export type CreateAnalytics = Omit<Analytics, 'lastUpdated'>;
export type CreateStudentMarks = Omit<StudentMarks, 'lastUpdated'>;

// For updating existing documents (all fields optional except id)
export type UpdateUser = Partial<Omit<User, 'id' | 'createdAt'>> & { id: string };
export type UpdateStudentProfile = Partial<Omit<StudentProfile, 'userId' | 'createdAt'>> & { userId: string };
export type UpdateAnalytics = Partial<Omit<Analytics, 'userId'>> & { userId: string };
