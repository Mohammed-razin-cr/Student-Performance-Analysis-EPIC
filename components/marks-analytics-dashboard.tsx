/**
 * Marks Analytics Dashboard Component
 * Displays rankings, statistics, charts, and allows PDF download
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Download,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Award,
  Zap,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { StudentMarks } from '@/types/firestore';
import {
  calculateRankings,
  calculateStatistics,
  calculateGradeDistribution,
  calculatePercentageRanges,
  calculatePerformanceSummary,
  getTopPerformers,
  getLowestPerformers,
} from '@/lib/marksAnalytics';
import { generateDetailedPDFReport, generatePDFFromHTML } from '@/lib/pdfReportGenerator';

interface MarksAnalyticsDashboardProps {
  marksData: StudentMarks[];
  title?: string;
}

export const MarksAnalyticsDashboard = ({
  marksData,
  title = 'Marks Analytics Report',
}: MarksAnalyticsDashboardProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'charts' | 'details'>(
    'overview'
  );

  if (!marksData || marksData.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-yellow-800">No marks data available. Please upload marks first.</p>
        </CardContent>
      </Card>
    );
  }

  const summary = calculatePerformanceSummary(marksData);
  const rankings = summary.rankings;
  const topPerformers = getTopPerformers(marksData, 10);
  const lowestPerformers = getLowestPerformers(marksData, 10);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateDetailedPDFReport(marksData, {
        title,
        includeRankings: true,
        includeCharts: true,
        includeStatistics: true,
        topPerformersCount: 20,
      });
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadChartPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDFFromHTML('charts-section', `${title}-charts.pdf`);
      toast.success('Charts PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate charts PDF');
      console.error('Charts PDF error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Prepare chart data
  const gradeChartData = summary.gradeDistribution.map(g => ({
    name: g.grade,
    value: g.count,
    fill: g.color,
  }));

  const percentageRangeData = summary.percentageRanges.map(p => ({
    name: p.range,
    students: p.count,
  }));

  const performanceData = rankings.slice(0, 20).map((r, idx) => ({
    rank: idx + 1,
    percentage: r.totalPercentage,
    studentName: r.studentName.substring(0, 10),
  }));

  return (
    <div className="space-y-6" id="analytics-dashboard">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-gray-600 mt-1">
            Analysis of {summary.totalStudents} students across {summary.departmentStats.length}{' '}
            departments
          </p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Full Report
            </>
          )}
        </Button>
      </motion.div>

      {/* Key Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 grid-cols-2 md:grid-cols-5"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-blue-900">{summary.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Passed</p>
                <p className="text-2xl font-bold text-green-900">
                  {summary.passedCount}{' '}
                  <span className="text-sm font-normal">({summary.passPercentage}%)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-900">
                  {summary.failedCount}{' '}
                  <span className="text-sm font-normal">({summary.failPercentage}%)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Distinction</p>
                <p className="text-2xl font-bold text-purple-900">
                  {summary.distinctionCount}{' '}
                  <span className="text-sm font-normal">({summary.distinctionPercentage}%)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-orange-500/20">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Average</p>
                <p className="text-2xl font-bold text-orange-900">{summary.averagePercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'rankings' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('rankings')}
        >
          Rankings
        </Button>
        <Button
          variant={activeTab === 'charts' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </Button>
        <Button
          variant={activeTab === 'details' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('details')}
        >
          Details
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Statistics Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Percentage Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.percentageRanges.map((range, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{range.range}</span>
                    <Badge variant="outline">{range.count} students</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Highest Score</p>
                  <p className="text-xl font-bold text-green-600">{summary.highestPercentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lowest Score</p>
                  <p className="text-xl font-bold text-red-600">{summary.lowestPercentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Median Score</p>
                  <p className="text-xl font-bold text-blue-600">{summary.medianPercentage}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistical Measures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Standard Deviation</p>
                  <p className="text-xl font-bold">{summary.stdDeviation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departments</p>
                  <p className="text-xl font-bold">{summary.departmentStats.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Statistics */}
          {summary.departmentStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Department Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary.departmentStats.map((dept, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{dept.department}</h3>
                        <Badge>{dept.totalStudents} students</Badge>
                      </div>
                      <div className="grid gap-2 grid-cols-3 text-sm">
                        <div>
                          <p className="text-gray-600">Average</p>
                          <p className="font-semibold">{dept.averagePercentage.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Pass Rate</p>
                          <p className="font-semibold text-green-600">
                            {dept.passPercentage.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Distinction</p>
                          <p className="font-semibold text-purple-600">
                            {dept.distinctionPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Rankings Tab */}
      {activeTab === 'rankings' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top 10 Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((student) => (
                    <div key={student.rank} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-semibold text-gray-900">{student.rank}. {student.studentName}</p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{student.totalPercentage.toFixed(2)}%</p>
                        <Badge variant="outline">{student.grade}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lowest Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-red-600" />
                  Need Improvement (Bottom 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowestPerformers.map((student) => (
                    <div key={student.rank} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-semibold text-gray-900">{student.rank}. {student.studentName}</p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{student.totalPercentage.toFixed(2)}%</p>
                        <Badge variant="outline" className={student.status === 'fail' ? 'bg-red-100' : ''}>{student.grade}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Rankings ({rankings.length} students)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((student) => (
                      <TableRow key={student.rank}>
                        <TableCell className="font-bold">{student.rank}</TableCell>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{student.totalPercentage.toFixed(2)}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              student.status === 'distinction'
                                ? 'bg-purple-100 text-purple-800'
                                : student.status === 'pass'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                            }
                          >
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
          id="charts-section"
        >
          <Button
            onClick={handleDownloadChartPDF}
            disabled={isGeneratingPDF}
            className="mb-4"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Charts PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Charts as PDF
              </>
            )}
          </Button>

          {/* Grade Distribution Pie Chart */}
          {gradeChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Number of students in each grade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Percentage Range Bar Chart */}
          {percentageRangeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution by Range</CardTitle>
                <CardDescription>Number of students in each percentage range</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={percentageRangeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="students" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Students Performance Line Chart */}
          {performanceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 20 Students Performance</CardTitle>
                <CardDescription>Percentage scored by rank</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rank" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#8b5cf6"
                      dot={{ fill: '#8b5cf6' }}
                      name="Score %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Pass/Fail Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Pass/Fail Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Passed', count: summary.passedCount, fill: '#10b981' },
                    { name: 'Failed', count: summary.failedCount, fill: '#ef4444' },
                    { name: 'Distinction', count: summary.distinctionCount, fill: '#8b5cf6' },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6">
                    {[
                      { name: 'Passed', count: summary.passedCount, fill: '#10b981' },
                      { name: 'Failed', count: summary.failedCount, fill: '#ef4444' },
                      { name: 'Distinction', count: summary.distinctionCount, fill: '#8b5cf6' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Detailed Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistical Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">Total Students</span>
                    <span className="text-lg font-bold">{summary.totalStudents}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">Passed</span>
                    <span className="text-lg font-bold text-green-600">{summary.passedCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">Failed</span>
                    <span className="text-lg font-bold text-red-600">{summary.failedCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">Distinction</span>
                    <span className="text-lg font-bold text-purple-600">
                      {summary.distinctionCount}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">Average %</span>
                    <span className="text-lg font-bold">{summary.averagePercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">Highest %</span>
                    <span className="text-lg font-bold text-green-600">
                      {summary.highestPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">Lowest %</span>
                    <span className="text-lg font-bold text-red-600">
                      {summary.lowestPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">Median %</span>
                    <span className="text-lg font-bold">{summary.medianPercentage}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Percentage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Percentage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="font-medium">Pass Percentage</span>
                  <span className="text-lg font-bold text-green-600">{summary.passPercentage}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="font-medium">Fail Percentage</span>
                  <span className="text-lg font-bold text-red-600">{summary.failPercentage}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="font-medium">Distinction Percentage</span>
                  <span className="text-lg font-bold text-purple-600">
                    {summary.distinctionPercentage}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">Standard Deviation</span>
                  <span className="text-lg font-bold">{summary.stdDeviation}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
