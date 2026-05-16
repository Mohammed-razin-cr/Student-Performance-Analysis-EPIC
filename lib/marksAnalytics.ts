/**
 * Marks Analytics Utility
 * Calculates rankings, statistics, and grade distribution
 */

import type { StudentMarks } from '@/types/firestore';

export interface StudentRanking {
  rank: number;
  studentId: string;
  studentName: string;
  totalPercentage: number;
  totalMarks: number;
  grade: string;
  subjectCount: number;
  status: 'pass' | 'distinction' | 'fail';
}

export interface MarksStatistics {
  totalStudents: number;
  passedCount: number;
  failedCount: number;
  distinctionCount: number;
  passPercentage: number;
  failPercentage: number;
  distinctionPercentage: number;
  averagePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  medianPercentage: number;
  stdDeviation: number;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PercentageRange {
  range: string;
  minPercentage: number;
  maxPercentage: number;
  count: number;
  percentage: number;
}

export interface DepartmentStats {
  department: string;
  totalStudents: number;
  averagePercentage: number;
  passPercentage: number;
  distinctionPercentage: number;
  topPerformer: StudentRanking | null;
  lowestPerformer: StudentRanking | null;
}

export interface SemesterStats {
  semester: string;
  totalStudents: number;
  averagePercentage: number;
  passPercentage: number;
  distinctionPercentage: number;
  rankings: StudentRanking[];
  statistics: MarksStatistics;
}

/**
 * Calculate ranking for students based on percentage
 */
export const calculateRankings = (marksData: StudentMarks[]): StudentRanking[] => {
  // Sort by percentage (descending), then by name (ascending for tie-breaking)
  const sorted = [...marksData].sort((a, b) => {
    const percentDiff = b.totalPercentage - a.totalPercentage;
    if (percentDiff !== 0) return percentDiff;
    return a.studentName.localeCompare(b.studentName);
  });

  return sorted.map((student, index) => {
    const percentage = student.totalPercentage;
    let status: 'pass' | 'distinction' | 'fail';

    if (percentage < 40) {
      status = 'fail';
    } else if (percentage >= 75) {
      status = 'distinction';
    } else {
      status = 'pass';
    }

    return {
      rank: index + 1,
      studentId: student.studentId,
      studentName: student.studentName,
      totalPercentage: percentage,
      totalMarks: student.totalMarks,
      grade: getGradeFromPercentage(percentage),
      subjectCount: student.subjects?.length || 0,
      status,
    };
  });
};

/**
 * Get grade from percentage
 */
export const getGradeFromPercentage = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

/**
 * Calculate overall statistics
 */
export const calculateStatistics = (marksData: StudentMarks[]): MarksStatistics => {
  if (marksData.length === 0) {
    return {
      totalStudents: 0,
      passedCount: 0,
      failedCount: 0,
      distinctionCount: 0,
      passPercentage: 0,
      failPercentage: 0,
      distinctionPercentage: 0,
      averagePercentage: 0,
      highestPercentage: 0,
      lowestPercentage: 0,
      medianPercentage: 0,
      stdDeviation: 0,
    };
  }

  const percentages = marksData.map(m => m.totalPercentage);

  // Count pass/fail/distinction
  const passedCount = marksData.filter(m => m.totalPercentage >= 40).length;
  const failedCount = marksData.filter(m => m.totalPercentage < 40).length;
  const distinctionCount = marksData.filter(m => m.totalPercentage >= 75).length;

  // Calculate average
  const averagePercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;

  // Sort for median and min/max
  const sortedPercentages = [...percentages].sort((a, b) => a - b);
  const medianPercentage =
    sortedPercentages.length % 2 === 0
      ? (sortedPercentages[sortedPercentages.length / 2 - 1] +
          sortedPercentages[sortedPercentages.length / 2]) /
        2
      : sortedPercentages[Math.floor(sortedPercentages.length / 2)];

  const highestPercentage = sortedPercentages[sortedPercentages.length - 1];
  const lowestPercentage = sortedPercentages[0];

  // Calculate standard deviation
  const variance =
    percentages.reduce((sum, p) => sum + Math.pow(p - averagePercentage, 2), 0) /
    percentages.length;
  const stdDeviation = Math.sqrt(variance);

  return {
    totalStudents: marksData.length,
    passedCount,
    failedCount,
    distinctionCount,
    passPercentage: (passedCount / marksData.length) * 100,
    failPercentage: (failedCount / marksData.length) * 100,
    distinctionPercentage: (distinctionCount / marksData.length) * 100,
    averagePercentage,
    highestPercentage,
    lowestPercentage,
    medianPercentage,
    stdDeviation,
  };
};

/**
 * Calculate grade distribution
 */
export const calculateGradeDistribution = (marksData: StudentMarks[]): GradeDistribution[] => {
  const gradeMap = new Map<string, number>();
  const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

  // Initialize all grades
  grades.forEach(grade => gradeMap.set(grade, 0));

  // Count grades
  marksData.forEach(student => {
    const grade = getGradeFromPercentage(student.totalPercentage);
    gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
  });

  const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#fca5a5', '#ef4444', '#7f1d1d'];
  const gradeColors: Record<string, string> = {
    'A+': colors[0],
    'A': colors[1],
    'B+': colors[2],
    'B': colors[3],
    'C+': colors[4],
    'C': colors[5],
    'D': colors[6],
    'F': colors[7],
  };

  return grades.map(grade => ({
    grade,
    count: gradeMap.get(grade) || 0,
    percentage: (((gradeMap.get(grade) || 0) / marksData.length) * 100),
    color: gradeColors[grade],
  })).filter(g => g.count > 0);
};

/**
 * Calculate percentage range distribution
 */
export const calculatePercentageRanges = (marksData: StudentMarks[]): PercentageRange[] => {
  const ranges = [
    { range: '90-100%', minPercentage: 90, maxPercentage: 100 },
    { range: '80-89%', minPercentage: 80, maxPercentage: 89 },
    { range: '70-79%', minPercentage: 70, maxPercentage: 79 },
    { range: '60-69%', minPercentage: 60, maxPercentage: 69 },
    { range: '50-59%', minPercentage: 50, maxPercentage: 59 },
    { range: '40-49%', minPercentage: 40, maxPercentage: 49 },
    { range: '0-39%', minPercentage: 0, maxPercentage: 39 },
  ];

  return ranges.map(range => {
    const count = marksData.filter(
      m => m.totalPercentage >= range.minPercentage && m.totalPercentage <= range.maxPercentage
    ).length;

    return {
      ...range,
      count,
      percentage: (count / marksData.length) * 100,
    };
  }).filter(r => r.count > 0);
};

/**
 * Calculate department statistics
 */
export const calculateDepartmentStats = (marksData: StudentMarks[]): DepartmentStats[] => {
  const departmentMap = new Map<string, StudentMarks[]>();

  // Group by department
  marksData.forEach(student => {
    const dept = student.department || 'Unknown';
    if (!departmentMap.has(dept)) {
      departmentMap.set(dept, []);
    }
    departmentMap.get(dept)!.push(student);
  });

  return Array.from(departmentMap.entries()).map(([dept, students]) => {
    const stats = calculateStatistics(students);
    const rankings = calculateRankings(students);

    return {
      department: dept,
      totalStudents: stats.totalStudents,
      averagePercentage: stats.averagePercentage,
      passPercentage: stats.passPercentage,
      distinctionPercentage: stats.distinctionPercentage,
      topPerformer: rankings[0] || null,
      lowestPerformer: rankings[rankings.length - 1] || null,
    };
  });
};

/**
 * Calculate semester statistics
 */
export const calculateSemesterStats = (marksData: StudentMarks[]): SemesterStats[] => {
  const semesterMap = new Map<string, StudentMarks[]>();

  // Group by semester
  marksData.forEach(student => {
    const sem = student.semester || 'Unknown';
    if (!semesterMap.has(sem)) {
      semesterMap.set(sem, []);
    }
    semesterMap.get(sem)!.push(student);
  });

  return Array.from(semesterMap.entries()).map(([sem, students]) => {
    const statistics = calculateStatistics(students);
    const rankings = calculateRankings(students);

    return {
      semester: sem,
      totalStudents: statistics.totalStudents,
      averagePercentage: statistics.averagePercentage,
      passPercentage: statistics.passPercentage,
      distinctionPercentage: statistics.distinctionPercentage,
      rankings,
      statistics,
    };
  });
};

/**
 * Calculate performance summary
 */
export const calculatePerformanceSummary = (marksData: StudentMarks[]) => {
  const stats = calculateStatistics(marksData);
  const rankings = calculateRankings(marksData);
  const gradeDistribution = calculateGradeDistribution(marksData);
  const percentageRanges = calculatePercentageRanges(marksData);
  const departmentStats = calculateDepartmentStats(marksData);
  const semesterStats = calculateSemesterStats(marksData);

  return {
    totalStudents: stats.totalStudents,
    passedCount: stats.passedCount,
    failedCount: stats.failedCount,
    distinctionCount: stats.distinctionCount,
    passPercentage: stats.passPercentage.toFixed(2),
    failPercentage: stats.failPercentage.toFixed(2),
    distinctionPercentage: stats.distinctionPercentage.toFixed(2),
    averagePercentage: stats.averagePercentage.toFixed(2),
    highestPercentage: stats.highestPercentage.toFixed(2),
    lowestPercentage: stats.lowestPercentage.toFixed(2),
    medianPercentage: stats.medianPercentage.toFixed(2),
    stdDeviation: stats.stdDeviation.toFixed(2),
    statistics: stats,
    rankings,
    gradeDistribution,
    percentageRanges,
    departmentStats,
    semesterStats,
  };
};

/**
 * Get top performers
 */
export const getTopPerformers = (marksData: StudentMarks[], count: number = 10): StudentRanking[] => {
  return calculateRankings(marksData).slice(0, count);
};

/**
 * Get lowest performers
 */
export const getLowestPerformers = (marksData: StudentMarks[], count: number = 10): StudentRanking[] => {
  const rankings = calculateRankings(marksData);
  return rankings.slice(Math.max(0, rankings.length - count)).reverse();
};

/**
 * Export data for reporting
 */
export const exportAnalyticsData = (marksData: StudentMarks[]) => {
  return {
    generatedAt: new Date().toISOString(),
    summary: calculatePerformanceSummary(marksData),
    topPerformers: getTopPerformers(marksData, 20),
    lowestPerformers: getLowestPerformers(marksData, 20),
  };
};
