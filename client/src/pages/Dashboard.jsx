import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { complaintsAPI } from '../utils/api';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  BarChart3,
  Brain,
  Zap,
  Plus,
  Sparkles,
  RefreshCcw,
  Loader2
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    inProgressComplaints: 0,
    averageResolutionTime: 0
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch user dashboard stats
  const fetchUserStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const data = await complaintsAPI.getUserDashboardStats();
      setStats({
        totalComplaints: data.totalComplaints || 0,
        pendingComplaints: data.pendingComplaints || 0,
        resolvedComplaints: data.resolvedComplaints || 0,
        inProgressComplaints: data.inProgressComplaints || 0,
        averageResolutionTime: data.averageResolutionTime || 0
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching user dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
      
      // Keep default stats if API fails
      setStats({
        totalComplaints: 0,
        pendingComplaints: 0,
        resolvedComplaints: 0,
        inProgressComplaints: 0,
        averageResolutionTime: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch recent complaints
  const fetchRecentComplaints = useCallback(async () => {
    try {
      setComplaintsLoading(true);
      const complaints = await complaintsAPI.getMyComplaints({ limit: 3 });
      setRecentComplaints(complaints || []);
    } catch (error) {
      console.error('Error fetching recent complaints:', error);
      toast.error('Failed to load recent complaints');
      setRecentComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is admin and redirect to admin dashboard
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.role === 'admin' || userData.is_admin) {
        navigate('/admin', { replace: true });
        return;
      }
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
    }

    // Fetch initial data
    fetchUserStats();
  }, [navigate, fetchUserStats]);

  // Fetch recent complaints when component mounts
  useEffect(() => {
    fetchRecentComplaints();
  }, [fetchRecentComplaints]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUserStats(false); // Don't show loading spinner for auto-refresh
      fetchRecentComplaints();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [fetchUserStats, fetchRecentComplaints]);

  // Loading skeleton component
  const StatCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );

  const ComplaintCardSkeleton = () => (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-blue-100 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        <div className="flex items-center space-x-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-5 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
      <div className="flex items-center space-x-4 mb-3">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );

  // Handle quick action navigation
  const handleQuickAction = useCallback((action) => {
    switch (action) {
      case 'submit':
        navigate('/submit-complaint');
        break;
      case 'track':
        navigate('/my-complaints');
        break;
      case 'assistant':
        navigate('/help');
        break;
      default:
        break;
    }
  }, [navigate]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Assigned': return 'text-purple-600 bg-purple-100';
      case 'Pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to GrievanceBot</h2>
              <p className="text-blue-100">
                AI-powered complaint tracking and management system
              </p>
              {lastUpdated && (
                <p className="text-xs text-blue-200 mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-3">
              <div className="flex items-center space-x-2">
                <Brain size={32} className="text-blue-200" />
                <span className="text-sm text-blue-200">AI Enabled</span>
              </div>
              <button 
                onClick={() => fetchUserStats(false)} 
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                disabled={loading}
                aria-label="Refresh dashboard data"
              >
                {loading ? (
                  <>
                    <RefreshCcw size={12} className="mr-1 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCcw size={12} className="mr-1" />
                    Refresh Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Complaints */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <BarChart3 size={20} className="mr-2 text-blue-600" />
                Recent Complaints
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {complaintsLoading ? (
                  // Show skeleton loading for complaints
                  Array.from({ length: 3 }).map((_, index) => (
                    <ComplaintCardSkeleton key={index} />
                  ))
                ) : recentComplaints.length > 0 ? (
                  recentComplaints.map((complaint) => (
                    <div key={complaint.id || complaint._id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-800">{complaint.title}</h4>
                          {complaint.aiProcessed && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-xs font-medium flex items-center">
                              <Brain size={10} className="mr-1" />
                              AI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                          <span className={`text-sm font-bold ${getPriorityColor(complaint.priorityScore || 50)}`}>
                            {complaint.priorityScore || 50}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4 mb-3">
                        <span className="font-medium">ID: {complaint.id || complaint._id}</span>
                        <span>{complaint.category || 'General'}</span>
                        <span>{new Date(complaint.date || complaint.created_at).toLocaleDateString()}</span>
                        {(complaint.similarComplaintsCount > 0 || complaint.similarComplaints?.length > 0) && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                            <TrendingUp size={10} className="mr-1" />
                            {complaint.similarComplaintsCount || complaint.similarComplaints?.length || 0} similar
                          </span>
                        )}
                      </div>
                      {complaint.aiResponse && (
                        <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500 shadow-sm">
                          <div className="flex items-start space-x-2">
                            <Sparkles size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-purple-600 font-semibold mb-1">AI Analysis</p>
                              <p className="text-sm text-gray-700 mb-2">{complaint.aiResponse}</p>
                              {complaint.vectorDbId && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Zap size={10} className="mr-1" />
                                  <span>Vector DB: {complaint.vectorDbId.substring(0, 12)}...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints yet</h3>
                    <p className="text-gray-600 mb-4">Get started by submitting your first complaint</p>
                    <button 
                      onClick={() => handleQuickAction('submit')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Submit Complaint
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <button 
                  onClick={() => navigate('/my-complaints')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label="View all complaints"
                >
                  View All Complaints →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Zap size={20} className="mr-2 text-blue-600" />
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button 
                  onClick={() => handleQuickAction('submit')}
                  className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-dashed border-blue-200 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Submit new complaint"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                      <Plus size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Submit New Complaint</h4>
                      <p className="text-sm text-blue-600">AI will auto-categorize and prioritize</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('track')}
                  className="w-full p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg border-2 border-dashed border-green-200 transition-colors group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Track your complaints"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                      <BarChart3 size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Track Complaints</h4>
                      <p className="text-sm text-green-600">Monitor progress with AI insights</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('assistant')}
                  className="w-full p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-dashed border-purple-200 transition-colors group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-label="Get help from AI assistant"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                      <Brain size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-800">AI Assistant</h4>
                      <p className="text-sm text-purple-600">Get guidance and status updates</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;