import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import { getStatusColorClass, getStatusLabel } from '../../utils/normalizeData';
import { 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Activity,
  RefreshCcw,
  Loader2
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    totalUsers: 0,
    resolvedComplaints: 0,
    highPriorityComplaints: 0,
    mediumPriorityComplaints: 0,
    lowPriorityComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    categories: [],
    recentComplaints: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timePeriod, setTimePeriod] = useState('month');

  // Helper function to get time period description
  const getTimePeriodDesc = () => {
    switch (timePeriod) {
      case 'today': return 'today';
      case 'week': return 'this week';
      case 'month': return 'this month';
      case 'year': return 'this year';
      default: return 'selected period';
    }
  };
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInDays} days ago`;
    }
  };

  // Helper function to get activity icon color based on status
  const getActivityIconColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper function to get activity description
  const getActivityDescription = (complaint) => {
    const status = complaint.status?.toLowerCase();
    const category = complaint.category || 'general';
    
    switch (status) {
      case 'resolved':
        return `${category.charAt(0).toUpperCase() + category.slice(1)} complaint resolved`;
      case 'in_progress':
        return `${category.charAt(0).toUpperCase() + category.slice(1)} complaint in progress`;
      case 'assigned':
        return `${category.charAt(0).toUpperCase() + category.slice(1)} complaint assigned to ${complaint.assigned_department || 'department'}`;
      default:
        return `New ${category} complaint submitted`;
    }
  };

  const fetchDashboardStats = useCallback(async (showLoader = true, period = timePeriod) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      console.log('📊 Fetching dashboard stats for period:', period);
      const response = await adminAPI.getDashboardStats(period);
      console.log('📈 Dashboard stats response:', response);
      
      // Normalize API response - handle both camelCase and snake_case
      const normalizeValue = (value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseInt(value) || 0;
        return 0;
      };

      const normalized = {
        totalComplaints: normalizeValue(
          response?.totalComplaints ?? 
          response?.total_complaints ?? 
          response?.data?.totalComplaints ?? 
          response?.data?.total_complaints ?? 0
        ),
        totalUsers: normalizeValue(
          response?.totalUsers ?? 
          response?.total_users ?? 
          response?.data?.totalUsers ?? 
          response?.data?.total_users ?? 0
        ),
        resolvedComplaints: normalizeValue(
          response?.resolvedComplaints ?? 
          response?.resolved_complaints ?? 
          response?.data?.resolvedComplaints ?? 
          response?.data?.resolved_complaints ?? 0
        ),
        highPriorityComplaints: normalizeValue(
          response?.highPriorityComplaints ?? 
          response?.highPriority ?? 
          response?.high_priority_complaints ?? 
          response?.high_priority ?? 
          response?.data?.highPriorityComplaints ?? 
          response?.data?.highPriority ?? 0
        ),
        mediumPriorityComplaints: normalizeValue(
          response?.mediumPriorityComplaints ?? 
          response?.mediumPriority ?? 
          response?.medium_priority_complaints ?? 
          response?.medium_priority ?? 
          response?.data?.mediumPriorityComplaints ?? 
          response?.data?.mediumPriority ?? 0
        ),
        lowPriorityComplaints: normalizeValue(
          response?.lowPriorityComplaints ?? 
          response?.lowPriority ?? 
          response?.low_priority_complaints ?? 
          response?.low_priority ?? 
          response?.data?.lowPriorityComplaints ?? 
          response?.data?.lowPriority ?? 0
        ),
        pendingComplaints: normalizeValue(
          response?.pendingComplaints ?? 
          response?.pending_complaints ?? 
          response?.data?.pendingComplaints ?? 
          response?.data?.pending_complaints ?? 0
        ),
        inProgressComplaints: normalizeValue(
          response?.inProgressComplaints ?? 
          response?.in_progress_complaints ?? 
          response?.data?.inProgressComplaints ?? 
          response?.data?.in_progress_complaints ?? 0
        ),
        categories: response?.categories ?? response?.data?.categories ?? [],
        recentComplaints: response?.recentComplaints ?? response?.recent_complaints ?? response?.data?.recentComplaints ?? response?.data?.recent_complaints ?? []
      };

      console.log('📋 Normalized dashboard data:', normalized);
      console.log('🔍 Raw response keys:', Object.keys(response || {}));
      
      setStats(normalized);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      console.error('❌ Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      
      const detail = error?.response?.data;
      const message = typeof detail === 'string' ? detail : detail?.detail || error.message || 'Failed to load dashboard metrics.';
      setError(message);

      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchDashboardStats(true);
  }, [fetchDashboardStats, timePeriod]);

  useEffect(() => {
    const interval = setInterval(() => fetchDashboardStats(false), 30000);
    const handleExternalRefresh = () => fetchDashboardStats(false);
    window.addEventListener('complaint:submitted', handleExternalRefresh);
    window.addEventListener('admin:dashboard-refresh', handleExternalRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('complaint:submitted', handleExternalRefresh);
      window.removeEventListener('admin:dashboard-refresh', handleExternalRefresh);
    };
  }, [fetchDashboardStats]);

  const StatCard = ({ icon: Icon, title, value, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon size={24} className={color} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Admin Dashboard" isAdmin={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard" isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">Monitor and manage citizen complaints</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">System Active</span>
            </div>
            
            {/* Time Period Selector */}
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            
            {lastUpdated && (
              <span className="text-xs text-gray-500">Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
            {refreshing && (
              <span className="flex items-center text-xs text-blue-600">
                <Loader2 size={14} className="animate-spin mr-1" /> Refreshing
              </span>
            )}
            <button
              onClick={() => fetchDashboardStats(false)}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCcw size={16} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="mt-3 sm:mt-0">
              <button
                onClick={() => fetchDashboardStats(true)}
                className="px-3 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={FileText}
            title="Total Complaints"
            value={stats.totalComplaints}
            color="text-blue-600"
            description={`Complaints ${getTimePeriodDesc()}`}
          />
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers}
            color="text-green-600"
            description="Registered citizens"
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved"
            value={stats.resolvedComplaints}
            color="text-green-600"
            description={`Resolved ${getTimePeriodDesc()}`}
          />
          <StatCard
            icon={Clock}
            title="Pending"
            value={stats.pendingComplaints}
            color="text-yellow-600"
            description={`Awaiting review ${getTimePeriodDesc()}`}
          />
          <StatCard
            icon={TrendingUp}
            title="In Progress"
            value={stats.inProgressComplaints}
            color="text-blue-600"
            description={`Being processed ${getTimePeriodDesc()}`}
          />
          <StatCard
            icon={AlertCircle}
            title="High Priority"
            value={stats.highPriorityComplaints}
            color="text-red-600"
            description={`Urgent attention ${getTimePeriodDesc()}`}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/admin/complaints')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">View All Complaints</p>
                <p className="text-sm text-gray-500">Manage complaints</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/admin/users')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">Manage users</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/admin/reports')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Generate Reports</p>
                <p className="text-sm text-gray-500">Analytics & reports</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/admin/alerts')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Priority Alerts</p>
                <p className="text-sm text-gray-500">Urgent issues</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <span className="text-xs text-gray-500">Live data from database</span>
          </div>
          <div className="space-y-4">
            {stats.recentComplaints && stats.recentComplaints.length > 0 ? (
              stats.recentComplaints.slice(0, 4).map((complaint, index) => (
                <div 
                  key={complaint.id || complaint._id || index} 
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/complaints/${complaint.id || complaint._id}`)}
                >
                  <div className={`w-2 h-2 rounded-full ${getActivityIconColor(complaint.status)}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getActivityDescription(complaint)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {complaint.message ? complaint.message.substring(0, 60) + (complaint.message.length > 60 ? '...' : '') : 'No description available'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusColorClass(complaint.status)}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                      {complaint.priority && (
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${
                          complaint.priority === 'high' 
                            ? 'bg-red-100 text-red-700 border-red-200' 
                            : complaint.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}>
                          {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)} Priority
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(complaint.created_at || complaint.submitted_date)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400">Recent complaints will appear here</p>
                </div>
              </div>
            )}
          </div>
          {stats.recentComplaints && stats.recentComplaints.length > 4 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => navigate('/admin/complaints')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all complaints →
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
