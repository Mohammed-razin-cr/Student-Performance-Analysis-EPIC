/**
 * PDF Report Generator for Marks Analytics
 * Generates downloadable PDF reports with charts and statistics
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { StudentMarks } from '@/types/firestore';
import { calculatePerformanceSummary } from './marksAnalytics';

export interface PDFReportOptions {
  title?: string;
  includeRankings?: boolean;
  includeCharts?: boolean;
  includeStatistics?: boolean;
  topPerformersCount?: number;
  filename?: string;
}

/**
 * Generate PDF report from HTML element
 */
export const generatePDFFromHTML = async (
  elementId: string,
  filename: string = 'marks-report.pdf'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF, handling multiple pages if needed
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    // Download PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate detailed PDF report with statistics
 */
export const generateDetailedPDFReport = async (
  marksData: StudentMarks[],
  options: PDFReportOptions = {}
): Promise<void> => {
  const {
    title = 'Student Marks Analytics Report',
    includeRankings = true,
    includeCharts = true,
    includeStatistics = true,
    topPerformersCount = 15,
    filename = `marks-report-${new Date().toISOString().split('T')[0]}.pdf`,
  } = options;

  const summary = calculatePerformanceSummary(marksData);

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 10) {
      pdf.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(15, 76, 129); // Dark blue
  pdf.text(title, margin, yPosition);
  yPosition += 15;

  // Report generation date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 10;

  // Divider
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  if (includeStatistics) {
    checkPageBreak(60);

    // Summary Statistics
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Summary Statistics', margin, yPosition);
    yPosition += 8;

    // Stats table
    const statsData = [
      ['Total Students', summary.totalStudents.toString()],
      ['Passed', `${summary.passedCount} (${summary.passPercentage}%)`],
      ['Failed', `${summary.failedCount} (${summary.failPercentage}%)`],
      ['Distinction', `${summary.distinctionCount} (${summary.distinctionPercentage}%)`],
      ['Average %', summary.averagePercentage],
      ['Highest %', summary.highestPercentage],
      ['Lowest %', summary.lowestPercentage],
      ['Median %', summary.medianPercentage],
    ];

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    let statsY = yPosition;

    statsData.forEach(([label, value]) => {
      pdf.text(label, margin + 5, statsY);
      pdf.text(String(value), margin + 90, statsY);
      statsY += 6;
    });

    yPosition = statsY + 5;
  }

  // Grade Distribution
  if (includeStatistics && summary.gradeDistribution.length > 0) {
    checkPageBreak(40);

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Grade Distribution', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    let gradeY = yPosition;

    summary.gradeDistribution.forEach(grade => {
      // Grade circle
      pdf.setFillColor(200, 200, 200);
      pdf.circle(margin + 8, gradeY - 1, 2, 'F');

      pdf.text(
        `${grade.grade}: ${grade.count} students (${grade.percentage.toFixed(1)}%)`,
        margin + 12,
        gradeY
      );
      gradeY += 6;
    });

    yPosition = gradeY + 5;
  }

  // Top Performers
  if (includeRankings && summary.rankings.length > 0) {
    checkPageBreak(60);

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Top Performers', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    const topCount = Math.min(topPerformersCount, summary.rankings.length);

    for (let i = 0; i < topCount; i++) {
      const student = summary.rankings[i];
      const rankText = `${student.rank}. ${student.studentName}`;
      const percentText = `${student.totalPercentage.toFixed(2)}%`;
      const gradeText = student.grade;

      pdf.text(rankText, margin + 5, yPosition);
      pdf.text(percentText, margin + 100, yPosition);
      pdf.text(gradeText, margin + 150, yPosition);
      yPosition += 6;

      if ((i + 1) % 15 === 0) {
        checkPageBreak(50);
      }
    }

    yPosition += 5;
  }

  // Department Statistics
  if (summary.departmentStats.length > 0) {
    checkPageBreak(40);

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Department Statistics', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    let deptY = yPosition;

    summary.departmentStats.forEach(dept => {
      pdf.text(
        `${dept.department}: ${dept.totalStudents} students, ` +
        `Avg: ${dept.averagePercentage.toFixed(2)}%, ` +
        `Pass: ${dept.passPercentage.toFixed(1)}%`,
        margin + 5,
        deptY
      );
      deptY += 6;
    });

    yPosition = deptY + 5;
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `Page ${pdf.getNumberOfPages()}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save PDF
  pdf.save(filename);
};

/**
 * Generate PDF report from chart element
 */
export const generateChartPDF = async (
  title: string,
  chartElementIds: string[],
  filename: string = 'chart-report.pdf'
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let pageAdded = false;

  for (const elementId of chartElementIds) {
    const element = document.getElementById(elementId);
    if (!element) continue;

    if (pageAdded) {
      pdf.addPage();
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190; // Leave margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
    pageAdded = true;
  }

  pdf.save(filename);
};

/**
 * Generate comparative PDF report for multiple semesters/departments
 */
export const generateComparativePDF = async (
  data: Record<string, StudentMarks[]>,
  filename: string = 'comparative-report.pdf'
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;

  // Title
  pdf.setFontSize(18);
  pdf.setTextColor(15, 76, 129);
  pdf.text('Comparative Marks Analysis', margin, yPosition);
  yPosition += 15;

  // Create comparison table
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  const summaries = Object.entries(data).map(([name, marks]) => ({
    name,
    summary: calculatePerformanceSummary(marks),
  }));

  // Table header
  let tableY = yPosition;
  const colWidth = (pageWidth - 2 * margin) / (summaries.length + 1);

  pdf.text('Metric', margin, tableY);
  summaries.forEach((item, idx) => {
    pdf.text(item.name, margin + colWidth * (idx + 1), tableY);
  });

  tableY += 8;

  // Table data
  const metrics = [
    { label: 'Total Students', key: 'totalStudents' },
    { label: 'Avg Percentage', key: 'averagePercentage' },
    { label: 'Pass %', key: 'passPercentage' },
    { label: 'Fail %', key: 'failPercentage' },
    { label: 'Distinction %', key: 'distinctionPercentage' },
  ];

  metrics.forEach(metric => {
    pdf.text(metric.label, margin, tableY);
    summaries.forEach((item, idx) => {
      const value = item.summary[metric.key as keyof typeof item.summary];
      pdf.text(String(value).substring(0, 8), margin + colWidth * (idx + 1), tableY);
    });
    tableY += 8;
  });

  pdf.save(filename);
};
