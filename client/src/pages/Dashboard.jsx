import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { complaintsAPI } from '../utils/api';
import { 
  FileText, 
  TrendingUp,
  Users,
  BarChart3,
  Zap,
  Plus,
  RefreshCcw,
  Loader2,
  Eye,
  ArrowRight,
  Calendar
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
  const ComplaintCardSkeleton = () => (
    <div className="gov-card animate-pulse">
      <div className="gov-card-body">
        <div className="flex items-center justify-between mb-2">
          <div className="h-5 gov-bg-light rounded w-1/2"></div>
          <div className="flex items-center space-x-2">
            <div className="h-6 gov-bg-light rounded w-16"></div>
            <div className="h-5 gov-bg-light rounded w-8"></div>
          </div>
        </div>
        <div className="flex items-center space-x-4 mb-3">
          <div className="h-4 gov-bg-light rounded w-16"></div>
          <div className="h-4 gov-bg-light rounded w-20"></div>
          <div className="h-4 gov-bg-light rounded w-20"></div>
        </div>
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
      case 'help':
        navigate('/help');
        break;
      default:
        break;
    }
  }, [navigate]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved': return 'gov-status-resolved';
      case 'In Progress': return 'gov-status-in-progress';
      case 'Assigned': return 'gov-status-in-progress';
      case 'Pending': return 'gov-status-pending';
      default: return 'gov-status-pending';
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 80) return 'gov-text-danger';
    if (score >= 60) return 'gov-text-warning';
    return 'gov-text-success';
  };

  return (
    <Layout title="Citizen Dashboard">
      <div className="space-y-6">
        {/* Government Header Section */}
        <div className="gov-card gov-bg-primary text-white">
          <div className="gov-card-body">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Public Way Service Portal</h2>
                <p className="opacity-90 text-sm">
                  Digital platform for efficient complaint submission and tracking
                </p>
                {lastUpdated && (
                  <p className="text-xs opacity-75 mt-2">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <span className="text-sm opacity-90">Secure Portal</span>
                </div>
                <button 
                  onClick={() => fetchUserStats(false)} 
                  className="gov-btn gov-btn-secondary gov-btn-sm"
                  disabled={loading}
                  aria-label="Refresh dashboard data"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCcw size={14} />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Complaints */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3 className="gov-card-title flex items-center">
                <BarChart3 size={18} className="mr-2 gov-text-primary" />
                Recent Complaints
              </h3>
              <p className="gov-card-subtitle">Latest submissions and updates</p>
            </div>
            <div className="gov-card-body">
              <div className="space-y-4">
                {complaintsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <ComplaintCardSkeleton key={index} />
                  ))
                ) : recentComplaints.length > 0 ? (
                  recentComplaints.map((complaint) => (
                    <div key={complaint.id || complaint._id} className="gov-border p-4 rounded gov-bg-light">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium gov-text-primary">{complaint.title}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`gov-status ${getStatusBadge(complaint.status)}`}>
                            {complaint.status}
                          </span>
                          {complaint.priorityScore && (
                            <span className={`text-sm font-bold ${getPriorityColor(complaint.priorityScore)}`}>
                              {complaint.priorityScore}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-sm gov-text-muted space-x-4 mb-3">
                        <span className="font-medium">ID: {complaint.id || complaint._id}</span>
                        <span>{complaint.category || 'General'}</span>
                        <span className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {new Date(complaint.date || complaint.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => navigate(`/complaint-details/${complaint.id || complaint._id}`)}
                          className="gov-btn gov-btn-outline gov-btn-sm"
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 gov-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium gov-text-primary mb-2">No complaints submitted</h3>
                    <p className="gov-text-muted mb-4">Submit your first complaint to get started</p>
                    <button 
                      onClick={() => handleQuickAction('submit')}
                      className="gov-btn gov-btn-primary"
                    >
                      Submit Complaint
                    </button>
                  </div>
                )}
              </div>
              {recentComplaints.length > 0 && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => navigate('/my-complaints')}
                    className="gov-btn gov-btn-outline"
                    aria-label="View all complaints"
                  >
                    View All Complaints
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3 className="gov-card-title flex items-center">
                <Zap size={18} className="mr-2 gov-text-primary" />
                Quick Actions
              </h3>
              <p className="gov-card-subtitle">Common tasks and services</p>
            </div>
            <div className="gov-card-body">
              <div className="space-y-4">
                <button 
                  onClick={() => handleQuickAction('submit')}
                  className="w-full p-4 text-left gov-bg-light hover:gov-bg-white gov-border rounded transition-colors group"
                  aria-label="Submit new complaint"
                >
                  <div className="flex items-center">
                    <div className="p-2 gov-bg-primary text-white rounded mr-3 group-hover:gov-bg-primary-light">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h4 className="font-medium gov-text-primary">Submit New Complaint</h4>
                      <p className="text-sm gov-text-muted">File a new grievance or service request</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('track')}
                  className="w-full p-4 text-left gov-bg-light hover:gov-bg-white gov-border rounded transition-colors group"
                  aria-label="Track your complaints"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-green-600 text-white rounded mr-3 group-hover:bg-green-700">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <h4 className="font-medium gov-text-primary">Track Complaints</h4>
                      <p className="text-sm gov-text-muted">Monitor progress and status updates</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('help')}
                  className="w-full p-4 text-left gov-bg-light hover:gov-bg-white gov-border rounded transition-colors group"
                  aria-label="Get help and support"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-600 text-white rounded mr-3 group-hover:bg-blue-700">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="font-medium gov-text-primary">Help & Support</h4>
                      <p className="text-sm gov-text-muted">Guidelines, FAQs and assistance</p>
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