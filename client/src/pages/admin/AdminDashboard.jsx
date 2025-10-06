import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
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

  const fetchDashboardStats = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const response = await adminAPI.getDashboardStats();
      const normalized = {
        totalComplaints: response?.totalComplaints ?? 0,
        totalUsers: response?.totalUsers ?? 0,
        resolvedComplaints: response?.resolvedComplaints ?? 0,
        highPriorityComplaints: response?.highPriorityComplaints ?? response?.highPriority ?? 0,
        mediumPriorityComplaints: response?.mediumPriorityComplaints ?? response?.mediumPriority ?? 0,
        lowPriorityComplaints: response?.lowPriorityComplaints ?? response?.lowPriority ?? 0,
        pendingComplaints: response?.pendingComplaints ?? 0,
        inProgressComplaints: response?.inProgressComplaints ?? 0,
        categories: response?.categories ?? [],
        recentComplaints: response?.recentComplaints ?? []
      };

      setStats((prev) => ({ ...prev, ...normalized }));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
  }, []);

  useEffect(() => {
    fetchDashboardStats(true);
  }, [fetchDashboardStats]);

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
            description="All complaints"
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
            description="Successfully resolved"
          />
          <StatCard
            icon={Clock}
            title="Pending"
            value={stats.pendingComplaints}
            color="text-yellow-600"
            description="Awaiting review"
          />
          <StatCard
            icon={TrendingUp}
            title="In Progress"
            value={stats.inProgressComplaints}
            color="text-blue-600"
            description="Being processed"
          />
          <StatCard
            icon={AlertCircle}
            title="High Priority"
            value={stats.highPriorityComplaints}
            color="text-red-600"
            description="Urgent attention"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">View All Complaints</p>
                <p className="text-sm text-gray-500">Manage complaints</p>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">Manage users</p>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Generate Reports</p>
                <p className="text-sm text-gray-500">Analytics & reports</p>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New complaint resolved</p>
                <p className="text-xs text-gray-500">Street light issue marked as resolved</p>
              </div>
              <span className="text-xs text-gray-500">2 mins ago</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-xs text-gray-500">Citizen joined the platform</p>
              </div>
              <span className="text-xs text-gray-500">5 mins ago</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">High priority complaint</p>
                <p className="text-xs text-gray-500">Water pipeline issue reported</p>
              </div>
              <span className="text-xs text-gray-500">10 mins ago</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
