import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState({
    monthly: [],
    categories: [],
    departments: [],
    trends: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod, selectedYear]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      // Mock data for reports
      const mockReports = {
        monthly: [
          { month: 'Jan', complaints: 45, resolved: 38, pending: 7 },
          { month: 'Feb', complaints: 52, resolved: 41, pending: 11 },
          { month: 'Mar', complaints: 38, resolved: 35, pending: 3 },
          { month: 'Apr', complaints: 61, resolved: 48, pending: 13 },
          { month: 'May', complaints: 55, resolved: 52, pending: 3 },
          { month: 'Jun', complaints: 67, resolved: 58, pending: 9 }
        ],
        categories: [
          { name: 'Infrastructure', count: 89, percentage: 35.2 },
          { name: 'Sanitation', count: 67, percentage: 26.5 },
          { name: 'Transportation', count: 45, percentage: 17.8 },
          { name: 'Public Safety', count: 32, percentage: 12.6 },
          { name: 'Others', count: 20, percentage: 7.9 }
        ],
        departments: [
          { name: 'Municipal Corporation', assigned: 145, resolved: 128, efficiency: 88.3 },
          { name: 'Police Department', assigned: 87, resolved: 75, efficiency: 86.2 },
          { name: 'Health Department', assigned: 54, resolved: 49, efficiency: 90.7 },
          { name: 'Transport Authority', assigned: 43, resolved: 35, efficiency: 81.4 }
        ],
        trends: {
          totalComplaints: 318,
          resolvedComplaints: 287,
          avgResolutionTime: 4.2,
          satisfactionRate: 87.5
        }
      };
      setReports(mockReports);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (type) => {
    // Mock report generation
    console.log(`Generating ${type} report...`);
    // In real implementation, this would trigger a download
  };

  if (loading) {
    return (
      <Layout title="Reports & Analytics" isAdmin={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
            </select>
            <button
              onClick={() => generateReport('comprehensive')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Complaints</p>
                <p className="text-2xl font-semibold text-gray-900">{reports.trends.totalComplaints}</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900">{reports.trends.resolvedComplaints}</p>
                <p className="text-xs text-green-600">90.3% resolution rate</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Resolution Time</p>
                <p className="text-2xl font-semibold text-gray-900">{reports.trends.avgResolutionTime}d</p>
                <p className="text-xs text-green-600">-0.8 days improvement</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Satisfaction Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{reports.trends.satisfactionRate}%</p>
                <p className="text-xs text-green-600">+2.3% increase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Complaint Trends</h2>
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
          
          {/* Simple Bar Chart Representation */}
          <div className="space-y-4">
            {reports.monthly.map((month, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-12 text-sm font-medium text-gray-700">{month.month}</div>
                <div className="flex-1">
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-blue-500 rounded-lg"
                      style={{ width: `${(month.complaints / 70) * 100}%` }}
                    ></div>
                    <div 
                      className="absolute left-0 top-0 h-full bg-green-500 rounded-lg"
                      style={{ width: `${(month.resolved / 70) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-20">
                  {month.complaints} total
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution and Department Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Complaints by Category</h2>
            <div className="space-y-4">
              {reports.categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
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

          {/* Department Efficiency */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Department Efficiency</h2>
            <div className="space-y-4">
              {reports.departments.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                    <span className="text-sm text-gray-600">{dept.efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
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
