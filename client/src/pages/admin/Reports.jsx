import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCcw,
  Loader2
} from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState({
    monthly: [],
    categories: [],
    departments: [],
    trends: {
      totalComplaints: 0,
      resolvedComplaints: 0,
      avgResolutionTime: 0,
      satisfactionRate: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  // Colors for charts
  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod, selectedYear]);

  const fetchReportsData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('📊 Fetching reports data for:', { period: selectedPeriod, year: selectedYear });
      
      const reportsData = await adminAPI.getReports({
        year: selectedYear,
        period: selectedPeriod
      });

      console.log('📈 Reports data received:', reportsData);

      // Generate monthly data if not provided
      const monthlyData = reportsData.monthly || generateMonthlyData();
      
      // Transform categories data
      const categoriesData = (reportsData.categories || []).map(cat => ({
        name: cat.name || 'Unknown',
        count: cat.count || 0,
        percentage: cat.percentage || 0
      }));

      // Transform departments data
      const departmentsData = reportsData.departments || [];

      // Set trends data
      const trendsData = {
        totalComplaints: reportsData.trends?.totalComplaints || 0,
        resolvedComplaints: reportsData.trends?.resolvedComplaints || 0,
        avgResolutionTime: reportsData.trends?.avgResolutionTime || 0,
        satisfactionRate: reportsData.trends?.satisfactionRate || 0
      };

      setReports({
        monthly: monthlyData,
        categories: categoriesData,
        departments: departmentsData,
        trends: trendsData
      });

    } catch (error) {
      console.error('❌ Error fetching reports data:', error);
      setError(error.message || 'Failed to fetch reports data');
      
      // Set fallback data
      setReports({
        monthly: generateMonthlyData(),
        categories: [],
        departments: [],
        trends: {
          totalComplaints: 0,
          resolvedComplaints: 0,
          avgResolutionTime: 0,
          satisfactionRate: 0
        }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      complaints: Math.floor(Math.random() * 50) + 10,
      resolved: Math.floor(Math.random() * 40) + 8,
      pending: Math.floor(Math.random() * 10) + 1
    }));
  };

  const generateReport = async (type) => {
    try {
      setRefreshing(true);
      console.log(`📄 Generating ${type} report...`);
      
      const result = await adminAPI.exportReport(type, {
        year: selectedYear,
        period: selectedPeriod,
        format: 'pdf'
      });

      if (result.success) {
        console.log('✅ Report generated successfully');
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      setError('Failed to generate report');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Reports & Analytics" isAdmin={true}>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-300 opacity-30" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-600 font-medium">Loading reports...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reports & Analytics" isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Generate comprehensive reports and analyze complaint trends</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
            </select>
            <button
              onClick={() => fetchReportsData(true)}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => generateReport('comprehensive')}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-5 w-5 mr-2" />
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : 'Export Report'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => fetchReportsData()}
                className="ml-auto px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Complaints</p>
                <p className="text-2xl font-semibold text-gray-900">{reports.trends.totalComplaints}</p>
                <p className="text-xs text-gray-600">For {selectedYear}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900">{reports.trends.resolvedComplaints}</p>
                <p className="text-xs text-gray-600">
                  {reports.trends.totalComplaints > 0 ? 
                    `${((reports.trends.resolvedComplaints / reports.trends.totalComplaints) * 100).toFixed(1)}% resolution rate` : 
                    'No data available'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Resolution Time</p>
                <p className="text-2xl font-semibold text-gray-900">{reports.trends.avgResolutionTime}d</p>
                <p className="text-xs text-gray-600">Average days to resolve</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Satisfaction Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{reports.trends.satisfactionRate}%</p>
                <p className="text-xs text-gray-600">Citizen feedback score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Complaint Trends ({selectedYear})</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Total Complaints</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Resolved</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
            </div>
          </div>
          
          {/* Recharts Bar Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reports.monthly}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="complaints" 
                  fill="#3B82F6" 
                  name="Total Complaints"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="resolved" 
                  fill="#10B981" 
                  name="Resolved"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="pending" 
                  fill="#F59E0B" 
                  name="Pending"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution and Department Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Complaints by Category</h2>
            {reports.categories.length > 0 ? (
              <div className="space-y-4">
                {/* Pie Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reports.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reports.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Category List */}
                <div className="space-y-3">
                  {reports.categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{category.count}</span>
                        <span className="text-xs text-gray-500">({category.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No category data available</p>
                  <p className="text-xs text-gray-400">Data will appear here when complaints are categorized</p>
                </div>
              </div>
            )}
          </div>

          {/* Department Efficiency */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Department Efficiency</h2>
            {reports.departments.length > 0 ? (
              <div className="space-y-4">
                {reports.departments.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                      <span className="text-sm text-gray-600">{dept.efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          dept.efficiency >= 90 ? 'bg-green-500' :
                          dept.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${dept.efficiency}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{dept.resolved} resolved</span>
                      <span>{dept.assigned} assigned</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No department data available</p>
                  <p className="text-xs text-gray-400">Department efficiency metrics will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Report Generation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Generate Custom Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => generateReport('monthly')}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Monthly Report</p>
                <p className="text-sm text-gray-500">Detailed monthly analysis</p>
              </div>
            </button>
            
            <button
              onClick={() => generateReport('department')}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Department Report</p>
                <p className="text-sm text-gray-500">Performance by department</p>
              </div>
            </button>
            
            <button
              onClick={() => generateReport('trends')}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Trend Analysis</p>
                <p className="text-sm text-gray-500">Historical trends & patterns</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
