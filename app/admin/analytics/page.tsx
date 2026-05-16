'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useFirestore';
import { getAllStudentMarks } from '@/lib/firestore';
import { isAdminRole } from '@/lib/utils';

import type { StudentMarks } from '@/types/firestore';
import { MarksAnalyticsDashboard } from '@/components/marks-analytics-dashboard';

type FilterType = 'all' | 'department' | 'semester';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const { userData, loading: userLoading } = useUserData();
  // Debug: log the role value
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('userData?.role:', userData?.role);
  }
  const isAdmin = isAdminRole(userData?.role);
  const router = useRouter();
  const [marksData, setMarksData] = useState<StudentMarks[]>([]);
  const [filteredData, setFilteredData] = useState<StudentMarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);

  // Check admin access
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Admin access required');
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // Fetch marks data
  useEffect(() => {
    const fetchMarksData = async () => {
      try {
        setLoading(true);
        const data = await getAllStudentMarks();
        if (data && Array.isArray(data)) {
          setMarksData(data);

          // Extract unique departments and semesters
          const depts = [...new Set(data.map((m: StudentMarks) => m.department).filter(Boolean))] as string[];
          const sems = [...new Set(data.map((m: StudentMarks) => m.semester).filter(Boolean))] as string[];

          setDepartments(depts);
          setSemesters(sems);
          setFilteredData(data);
        }
      } catch (error) {
        toast.error('Failed to load marks data');
        console.error('Error fetching marks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchMarksData();
    }
  }, [isAdmin]);

  // Apply filters
  useEffect(() => {
    let filtered = marksData;

    if (filterType === 'department' && selectedFilter) {
      filtered = marksData.filter((m) => m.department === selectedFilter);
    } else if (filterType === 'semester' && selectedFilter) {
      filtered = marksData.filter((m) => m.semester === selectedFilter);
    }

    setFilteredData(filtered);
  }, [filterType, selectedFilter, marksData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await getAllStudentMarks();
      if (data && Array.isArray(data)) {
        setMarksData(data);
        setFilteredData(data);
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      toast.error('Failed to refresh data');
      console.error('Error refreshing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Admin access required to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Marks Analytics</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive analysis of student performance across all marks submissions
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} variant="outline" size="lg">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
            <Select value={filterType} onValueChange={(value) => {
              setFilterType(value as FilterType);
              setSelectedFilter('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="department">By Department</SelectItem>
                <SelectItem value="semester">By Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === 'department' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Department
              </label>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterType === 'semester' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Semester
              </label>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedFilter && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFilter('');
                setFilterType('all');
              }}
            >
              Clear Filter
            </Button>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <p className="text-blue-800">Loading analytics data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredData.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">
                No marks data available for the selected filters. Please upload marks first.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analytics Dashboard */}
        {!loading && filteredData.length > 0 && (
          <MarksAnalyticsDashboard
            marksData={filteredData}
            title={
              filterType === 'department'
                ? `Marks Analytics - ${selectedFilter} Department`
                : filterType === 'semester'
                  ? `Marks Analytics - ${selectedFilter} Semester`
                  : 'Marks Analytics - All Students'
            }
          />
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6 border-t text-gray-600 text-sm"
        >
          <p>
            Showing analytics for <strong>{filteredData.length}</strong> student records
            {filterType !== 'all' && ` (${filterType}: ${selectedFilter})`}
          </p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
        </motion.div>
      </motion.div>
    </main>
  );
}
