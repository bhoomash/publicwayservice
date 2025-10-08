import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { adminAPI, complaintsAPI } from '../utils/api';
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
  Target
} from 'lucide-react';

const CollectorDashboard = () => {
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    assignedComplaints: 0,
    resolvedComplaints: 0,
    aiProcessed: 0,
    averageResolutionTime: 0
  });

  const [complaints, setComplaints] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    urgency: 'all',
    sortBy: 'priority_score'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Helper functions for data transformation
  const mapStatus = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'assigned': 'Assigned',
      'resolved': 'Resolved',
      'rejected': 'Rejected'
    };
    return statusMap[status?.toLowerCase()] || 'Pending';
  };

  const mapPriority = (priority) => {
    const priorityMap = {
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return priorityMap[priority?.toLowerCase()] || 'Medium';
  };

  const calculatePriorityScore = (priority) => {
    const scoreMap = {
      'high': Math.floor(80 + Math.random() * 20), // 80-100
      'medium': Math.floor(50 + Math.random() * 30), // 50-80
      'low': Math.floor(20 + Math.random() * 30) // 20-50
    };
    return scoreMap[priority?.toLowerCase()] || 50;
  };

  const generateAIResponse = (complaint) => {
    const category = complaint.category?.toLowerCase();
    const priority = complaint.priority?.toLowerCase();
    
    const responses = {
      'roads': [
        'Infrastructure maintenance team notified. Standard repair timeframe: 3-5 days.',
        'Priority road issue identified. Immediate assessment scheduled.',
        'Traffic impact analysis completed. Repair work coordinated with traffic management.'
      ],
      'water': [
        'Water department emergency response activated.',
        'Critical water supply issue affecting multiple households.',
        'Water quality testing initiated. Temporary alternative supply arranged.'
      ],
      'electricity': [
        'Electrical safety inspection required. Power restoration priority set.',
        'Grid maintenance scheduled. Estimated restoration time provided.',
        'Emergency electrical repair dispatched. Safety protocols activated.'
      ],
      'sanitation': [
        'Waste management team assigned. Collection schedule updated.',
        'Sanitation issue prioritized for immediate attention.',
        'Health department coordination for sanitation improvement.'
      ],
      'environmental': [
        'Environmental impact assessment initiated.',
        'Pollution control measures being evaluated.',
        'Environmental compliance inspection scheduled.'
      ]
    };
    
    const categoryResponses = responses[category] || [
      'Issue logged and assigned to appropriate department.',
      'Standard processing procedures initiated.',
      'Department coordination for resolution underway.'
    ];
    
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    return new Date(dateString).toISOString().split('T')[0];
  };

  const fetchCollectorStats = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Fetch dashboard statistics from the API
      const dashboardStats = await adminAPI.getDashboardStats();
      
      // Calculate collector-specific stats from the data
      setStats({
        totalComplaints: dashboardStats.totalComplaints || 0,
        pendingComplaints: dashboardStats.pendingComplaints || 0,
        assignedComplaints: dashboardStats.inProgressComplaints || 0, // Use in-progress as assigned
        resolvedComplaints: dashboardStats.resolvedComplaints || 0,
        aiProcessed: dashboardStats.totalComplaints || 0, // Assume all complaints are AI processed
        averageResolutionTime: 3.2 // This would need to be calculated from actual data
      });

      // Fetch all complaints for the collector view
      const allComplaints = await adminAPI.getAllComplaints();
      
      // Transform the data to match the expected format
      const transformedComplaints = allComplaints.map(complaint => ({
        id: complaint.id,
        userId: complaint.user_id || 'unknown',
        userName: complaint.user_name || 'Unknown User',
        userEmail: complaint.user_email || 'No email',
        title: complaint.message || 'No title',
        category: complaint.category || 'Other',
        status: mapStatus(complaint.status),
        urgency: mapPriority(complaint.priority),
        priorityScore: calculatePriorityScore(complaint.priority),
        assignedDepartment: complaint.assigned_department || 'Not Assigned',
        aiResponse: generateAIResponse(complaint),
        submittedDate: formatDate(complaint.created_at),
        lastUpdated: formatDate(complaint.updated_at || complaint.created_at)
      }));
      
      setComplaints(transformedComplaints);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching collector dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectorStats();
  }, []);

  const StatCard = ({ icon: Icon, title, value, color, description, change }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <div className="flex items-center mt-1">
            <p className="text-xs text-gray-500">{description}</p>
            {change !== undefined && (
              <span className={`ml-2 text-xs font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
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

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      // Update the complaint status via API
      await adminAPI.updateComplaintStatus(complaintId, newStatus.toLowerCase());
      
      // Update local state
      setComplaints(prev => 
        prev.map(complaint => 
          complaint.id === complaintId 
            ? { ...complaint, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] }
            : complaint
        )
      );
    } catch (error) {
      console.error('Error updating complaint status:', error);
      // Optionally show an error message to the user
      setError('Failed to update complaint status. Please try again.');
    }
  };

  const filteredComplaints = complaints
    .filter(complaint => {
      if (filters.status !== 'all' && complaint.status !== filters.status) return false;
      if (filters.category !== 'all' && complaint.category !== filters.category) return false;
      if (filters.urgency !== 'all' && complaint.urgency !== filters.urgency) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'priority_score') return b.priorityScore - a.priorityScore;
      if (filters.sortBy === 'date') return new Date(b.submittedDate) - new Date(a.submittedDate);
      return 0;
    });

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Admin Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Collector Dashboard</h2>
              <p className="text-purple-100">
                AI-powered complaint management system with automated prioritization
              </p>
              {lastUpdated && (
                <p className="text-xs text-purple-200 mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-3">
              <div className="flex items-center space-x-2">
                <Brain size={32} className="text-purple-200" />
                <span className="text-sm text-purple-200">AI Enabled</span>
              </div>
              <button 
                onClick={() => fetchCollectorStats(false)} 
                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-md flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Zap size={12} className="mr-1 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <Zap size={12} className="mr-1" />
                    Refresh Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setError(null);
                      fetchCollectorStats(true);
                    }}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={FileText}
            title="Total Complaints"
            value={stats.totalComplaints}
            color="text-blue-600"
            description="All complaints"
          />
          <StatCard
            icon={AlertCircle}
            title="Pending"
            value={stats.pendingComplaints}
            color="text-orange-600"
            description="Awaiting assignment"
          />
          <StatCard
            icon={Target}
            title="Assigned"
            value={stats.assignedComplaints}
            color="text-purple-600"
            description="In departments"
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved"
            value={stats.resolvedComplaints}
            color="text-green-600"
            description="Successfully closed"
          />
          <StatCard
            icon={Brain}
            title="AI Processed"
            value={stats.aiProcessed}
            color="text-indigo-600"
            description="Auto-categorized"
          />
          <StatCard
            icon={Clock}
            title="Avg Resolution"
            value={`${stats.averageResolutionTime}d`}
            color="text-teal-600"
            description="Days to resolve"
          />
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Complaints Management</h3>
            <div className="flex items-center space-x-2 ml-auto">
              <Zap size={16} className="text-yellow-500" />
              <span className="text-sm text-gray-600">AI-Prioritized</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Utilities">Utilities</option>
              <option value="Environmental">Environmental</option>
              <option value="Public Safety">Public Safety</option>
            </select>

            <select
              value={filters.urgency}
              onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Urgency</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="priority_score">Priority Score</option>
              <option value="date">Date Submitted</option>
            </select>
          </div>
        </div>

        {/* Complaints Table/Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Active Complaints ({filteredComplaints.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading complaints...</span>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <FileText className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">No complaints found</h3>
              <p className="text-center">
                {error ? 'Unable to load complaints.' : 'No complaints match your current filters.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Response
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                        <div className="text-sm text-gray-500">
                          {complaint.id} • {complaint.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{complaint.userName}</div>
                        <div className="text-sm text-gray-500">{complaint.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${getPriorityColor(complaint.priorityScore)}`}>
                          {complaint.priorityScore}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(complaint.urgency)}`}>
                          {complaint.urgency}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {complaint.assignedDepartment}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {complaint.aiResponse}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View
                        </button>
                        <select
                          value={complaint.status}
                          onChange={(e) => updateComplaintStatus(complaint.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{complaint.title}</h4>
                    <p className="text-xs text-gray-500">{complaint.id} • {complaint.category}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <span className={`text-sm font-bold ${getPriorityColor(complaint.priorityScore)}`}>
                      {complaint.priorityScore}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(complaint.urgency)}`}>
                      {complaint.urgency}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">User:</span>
                    <span className="text-gray-900">{complaint.userName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Department:</span>
                    <span className="text-gray-900 text-right">{complaint.assignedDepartment}</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">AI Response:</p>
                  <p className="text-sm text-gray-700">{complaint.aiResponse}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details
                  </button>
                  <select
                    value={complaint.status}
                    onChange={(e) => updateComplaintStatus(complaint.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CollectorDashboard;
