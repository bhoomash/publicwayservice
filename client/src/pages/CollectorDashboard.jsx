import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
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

const AdminDashboard = () => {
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

  useEffect(() => {
    // TODO: Fetch actual stats from API
    setStats({
      totalComplaints: 147,
      pendingComplaints: 23,
      assignedComplaints: 45,
      resolvedComplaints: 79,
      aiProcessed: 147,
      averageResolutionTime: 3.2
    });

    // TODO: Fetch actual complaints from API
    const mockComplaints = [
      {
        id: 'CMP001',
        userId: 'user123',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        title: 'Street Light Not Working',
        category: 'Infrastructure',
        status: 'Assigned',
        urgency: 'High',
        priorityScore: 85,
        assignedDepartment: 'Municipal Corporation',
        aiResponse: 'Recommended immediate inspection and repair within 24 hours due to safety concerns.',
        submittedDate: '2025-08-15',
        lastUpdated: '2025-08-16'
      },
      {
        id: 'CMP002',
        userId: 'user456',
        userName: 'Sarah Wilson',
        userEmail: 'sarah@example.com',
        title: 'Water Supply Disruption',
        category: 'Utilities',
        status: 'In Progress',
        urgency: 'High',
        priorityScore: 92,
        assignedDepartment: 'Water Department',
        aiResponse: 'Critical infrastructure issue affecting 200+ households. Emergency response initiated.',
        submittedDate: '2025-08-14',
        lastUpdated: '2025-08-17'
      },
      {
        id: 'CMP003',
        userId: 'user789',
        userName: 'Mike Johnson',
        userEmail: 'mike@example.com',
        title: 'Noise Pollution from Construction',
        category: 'Environmental',
        status: 'Pending',
        urgency: 'Medium',
        priorityScore: 65,
        assignedDepartment: 'Environment Department',
        aiResponse: 'Scheduled for inspection during peak hours to assess noise levels and compliance.',
        submittedDate: '2025-08-13',
        lastUpdated: '2025-08-13'
      }
    ];
    
    setComplaints(mockComplaints);
  }, []);

  const StatCard = ({ icon: Icon, title, value, color, description, change }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <div className="flex items-center mt-1">
            <p className="text-xs text-gray-500">{description}</p>
            {change && (
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

  const updateComplaintStatus = (complaintId, newStatus) => {
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] }
          : complaint
      )
    );
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
            </div>
            <div className="flex items-center space-x-2">
              <Brain size={32} className="text-purple-200" />
              <span className="text-sm text-purple-200">AI Enabled</span>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={FileText}
            title="Total Complaints"
            value={stats.totalComplaints}
            color="text-blue-600"
            description="All complaints"
            change={12}
          />
          <StatCard
            icon={AlertCircle}
            title="Pending"
            value={stats.pendingComplaints}
            color="text-orange-600"
            description="Awaiting assignment"
            change={-5}
          />
          <StatCard
            icon={Target}
            title="Assigned"
            value={stats.assignedComplaints}
            color="text-purple-600"
            description="In departments"
            change={8}
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved"
            value={stats.resolvedComplaints}
            color="text-green-600"
            description="Successfully closed"
            change={15}
          />
          <StatCard
            icon={Brain}
            title="AI Processed"
            value={stats.aiProcessed}
            color="text-indigo-600"
            description="Auto-categorized"
            change={100}
          />
          <StatCard
            icon={Clock}
            title="Avg Resolution"
            value={`${stats.averageResolutionTime}d`}
            color="text-teal-600"
            description="Days to resolve"
            change={-12}
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
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
