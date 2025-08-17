import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../utils/api';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  MapPin,
  User,
  Mail,
  Building,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    assignedComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    highPriorityComplaints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch dashboard stats and complaints
      const [statsData, complaintsData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAllComplaints()
      ]);
      
      setStats(statsData);
      setComplaints(complaintsData);
      setFilteredComplaints(complaintsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Fallback to mock data if API fails
      const mockComplaints = [
      {
        id: 'CMP001',
        userId: 'user123',
        userName: 'John Doe',
        userEmail: 'john.doe@email.com',
        title: 'Street Light Not Working',
        description: 'The street light in front of house number 123 has been non-functional for the past week, causing safety concerns for residents.',
        category: 'Infrastructure',
        urgency: 'high',
        status: 'Assigned',
        priority_score: 85,
        assignedDepartment: 'Municipal Corporation - Electrical',
        aiResponse: 'Based on the description, this appears to be an electrical infrastructure issue requiring immediate attention. Recommended action: Dispatch electrical maintenance team for inspection and repair.',
        submittedDate: '2025-08-15T10:30:00Z',
        lastUpdated: '2025-08-16T14:20:00Z',
        location: '123 Main Street, Downtown',
        attachments: ['streetlight_image.jpg']
      },
      {
        id: 'CMP002',
        userId: 'user456',
        userName: 'Sarah Johnson',
        userEmail: 'sarah.j@email.com',
        title: 'Water Supply Issue - Multiple Households',
        description: 'No water supply in Green Valley Colony for the past 3 days. Over 50 households affected. Emergency situation.',
        category: 'Utilities',
        urgency: 'high',
        status: 'In Progress',
        priority_score: 95,
        assignedDepartment: 'Water Department - Emergency Response',
        aiResponse: 'Critical utility disruption affecting multiple households. High priority case requiring immediate intervention. Estimated resolution: 24-48 hours with emergency repairs.',
        submittedDate: '2025-08-14T08:15:00Z',
        lastUpdated: '2025-08-16T16:45:00Z',
        location: 'Green Valley Colony, Sector 12',
        attachments: ['water_issue_report.pdf']
      },
      {
        id: 'CMP003',
        userId: 'user789',
        userName: 'Mike Wilson',
        userEmail: 'mike.w@email.com',
        title: 'Road Pothole Repair Required',
        description: 'Large potholes on Highway 101 causing vehicle damage and traffic slowdowns.',
        category: 'Infrastructure',
        urgency: 'medium',
        status: 'Resolved',
        priority_score: 65,
        assignedDepartment: 'Road Maintenance Division',
        aiResponse: 'Infrastructure maintenance request for road repair. Standard procedure applies. Estimated completion time: 3-5 business days.',
        submittedDate: '2025-08-13T12:00:00Z',
        lastUpdated: '2025-08-16T09:30:00Z',
        location: 'Highway 101, Mile Marker 45',
        attachments: []
      },
      {
        id: 'CMP004',
        userId: 'user101',
        userName: 'Lisa Chen',
        userEmail: 'lisa.chen@email.com',
        title: 'Noise Pollution from Construction',
        description: 'Construction work happening beyond permitted hours, disturbing residents.',
        category: 'Environmental',
        urgency: 'low',
        status: 'Assigned',
        priority_score: 40,
        assignedDepartment: 'Environmental Compliance',
        aiResponse: 'Environmental compliance issue. Requires inspection of construction permits and work schedule verification.',
        submittedDate: '2025-08-16T15:20:00Z',
        lastUpdated: '2025-08-16T15:20:00Z',
        location: 'Residential Area, Block C',
        attachments: ['noise_recording.mp3']
      }
    ];
    
    setComplaints(mockComplaints);
    setFilteredComplaints(mockComplaints);
    
    // Calculate stats
    setStats({
      totalComplaints: mockComplaints.length,
      assignedComplaints: mockComplaints.filter(c => c.status === 'Assigned').length,
      inProgressComplaints: mockComplaints.filter(c => c.status === 'In Progress').length,
      resolvedComplaints: mockComplaints.filter(c => c.status === 'Resolved').length,
      highPriorityComplaints: mockComplaints.filter(c => c.urgency === 'high').length
    });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = complaints;

    // Sort by priority score (highest first)
    filtered = [...filtered].sort((a, b) => b.priority_score - a.priority_score);

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(complaint => 
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => 
        complaint.status.toLowerCase().replace(' ', '_') === statusFilter
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.category === categoryFilter);
    }

    // Filter by urgency
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.urgency === urgencyFilter);
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, categoryFilter, urgencyFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle size={16} className="text-green-600" />;
      case 'In Progress': return <Clock size={16} className="text-blue-600" />;
      case 'Assigned': return <Target size={16} className="text-blue-600" />;
      default: return <AlertCircle size={16} className="text-orange-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'text-green-600 bg-green-100 border-green-200';
      case 'In Progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Assigned': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-orange-600 bg-orange-100 border-orange-200';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    // TODO: Implement API call to update status
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, status: newStatus, lastUpdated: new Date().toISOString() }
          : complaint
      )
    );
  };

  const categories = ['Infrastructure', 'Utilities', 'Environmental', 'Administrative', 'Public Safety', 'Healthcare', 'Education', 'Other'];

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

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            icon={FileText}
            title="Total Complaints"
            value={stats.totalComplaints}
            color="text-blue-600"
            description="All complaints"
          />
          <StatCard
            icon={Target}
            title="Assigned"
            value={stats.assignedComplaints}
            color="text-blue-600"
            description="Ready for action"
          />
          <StatCard
            icon={Clock}
            title="In Progress"
            value={stats.inProgressComplaints}
            color="text-blue-600"
            description="Being processed"
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved"
            value={stats.resolvedComplaints}
            color="text-green-600"
            description="Successfully closed"
          />
          <StatCard
            icon={AlertCircle}
            title="High Priority"
            value={stats.highPriorityComplaints}
            color="text-red-600"
            description="Urgent attention"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints, users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Urgency Filter */}
            <div>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Urgency</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              All Complaints ({filteredComplaints.length}) - Sorted by Priority
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complaint & User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Department
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {complaint.userName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {complaint.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {complaint.userName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {complaint.userEmail}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {complaint.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(complaint.submittedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {complaint.category}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getUrgencyColor(complaint.urgency)}`}>
                            {complaint.urgency.toUpperCase()}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority_score)}`}>
                            {complaint.priority_score}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                          {getStatusIcon(complaint.status)}
                          <span className="ml-1">{complaint.status}</span>
                        </span>
                        <div className="text-xs text-gray-600 max-w-xs truncate">
                          <Building size={12} className="inline mr-1" />
                          {complaint.assignedDepartment}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 max-w-xs">
                        <div className="truncate-3-lines">
                          {complaint.aiResponse}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedComplaint(complaint)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={16} />
                      </button>
                      <select
                        value={complaint.status}
                        onChange={(e) => updateComplaintStatus(complaint.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
