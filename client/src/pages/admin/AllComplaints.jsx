import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import { 
  Search, 
  Filter, 
  Eye, 
  AlertCircle,
  Clock,
  CheckCircle,
  Building,
  Calendar,
  User
} from 'lucide-react';

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllComplaints();
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.priority_score === priorityFilter);
    }

    setFilteredComplaints(filtered);
  };

  const categorizeComplaintsByPriority = (complaints) => {
    return complaints.reduce((acc, complaint) => {
      if (complaint.priority_score === 'high') {
        acc.high.push(complaint);
      } else if (complaint.priority_score === 'medium') {
        acc.medium.push(complaint);
      } else {
        acc.low.push(complaint);
      }
      return acc;
    }, { high: [], medium: [], low: [] });
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      await adminAPI.updateComplaintStatus(complaintId, newStatus);
      setComplaints(complaints.map(complaint =>
        complaint.id === complaintId ? { ...complaint, status: newStatus } : complaint
      ));
    } catch (error) {
      console.error('Error updating complaint status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned': return 'border-blue-200 text-blue-800 bg-blue-50';
      case 'In Progress': return 'border-yellow-200 text-yellow-800 bg-yellow-50';
      case 'Resolved': return 'border-green-200 text-green-800 bg-green-50';
      default: return 'border-gray-200 text-gray-800 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return 'border-red-200 text-red-800 bg-red-50';
      case 'medium': return 'border-yellow-200 text-yellow-800 bg-yellow-50';
      case 'low': return 'border-green-200 text-green-800 bg-green-50';
      default: return 'border-gray-200 text-gray-800 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Assigned': return <Clock size={12} />;
      case 'In Progress': return <AlertCircle size={12} />;
      case 'Resolved': return <CheckCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  if (loading) {
    return (
      <Layout title="All Complaints" isAdmin={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const prioritizedComplaints = categorizeComplaintsByPriority(filteredComplaints);

  return (
    <Layout title="All Complaints" isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Complaint Management</h1>
            <p className="text-gray-600">Manage and track all citizen complaints</p>
          </div>
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
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">
                Showing {filteredComplaints.length} of {complaints.length} complaints
              </span>
            </div>
          </div>
        </div>

        {/* Priority-Based Complaints Sections */}
        <div className="space-y-6">
          {/* High Priority Complaints */}
          {prioritizedComplaints.high.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200">
              <div className="p-6 border-b border-red-200 bg-red-50">
                <div className="flex items-center">
                  <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                  <h2 className="text-lg font-semibold text-red-800">
                    High Priority Complaints ({prioritizedComplaints.high.length})
                  </h2>
                </div>
                <p className="text-sm text-red-600 mt-1">Requires immediate attention</p>
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prioritizedComplaints.high.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-red-50 border-l-4 border-red-500">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {complaint.userName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {complaint.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {complaint.userName} • {complaint.userEmail}
                              </div>
                              <div className="text-xs text-gray-400">
                                ID: {complaint.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {complaint.category}
                            </span>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority_score)}`}>
                                HIGH PRIORITY
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
                            <div className="text-xs text-gray-600">
                              <Building size={12} className="inline mr-1" />
                              {complaint.assignedDepartment}
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
          )}

          {/* Medium Priority Complaints */}
          {prioritizedComplaints.medium.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-yellow-200">
              <div className="p-6 border-b border-yellow-200 bg-yellow-50">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 text-yellow-600 mr-2" />
                  <h2 className="text-lg font-semibold text-yellow-800">
                    Medium Priority Complaints ({prioritizedComplaints.medium.length})
                  </h2>
                </div>
                <p className="text-sm text-yellow-600 mt-1">Moderate attention required</p>
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prioritizedComplaints.medium.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-yellow-50 border-l-4 border-yellow-500">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-yellow-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {complaint.userName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {complaint.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {complaint.userName} • {complaint.userEmail}
                              </div>
                              <div className="text-xs text-gray-400">
                                ID: {complaint.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {complaint.category}
                            </span>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority_score)}`}>
                                MEDIUM PRIORITY
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
                            <div className="text-xs text-gray-600">
                              <Building size={12} className="inline mr-1" />
                              {complaint.assignedDepartment}
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
          )}

          {/* Low Priority Complaints */}
          {prioritizedComplaints.low.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-green-200">
              <div className="p-6 border-b border-green-200 bg-green-50">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-green-800">
                    Low Priority Complaints ({prioritizedComplaints.low.length})
                  </h2>
                </div>
                <p className="text-sm text-green-600 mt-1">Can be addressed when resources are available</p>
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prioritizedComplaints.low.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-green-50 border-l-4 border-green-500">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {complaint.userName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {complaint.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {complaint.userName} • {complaint.userEmail}
                              </div>
                              <div className="text-xs text-gray-400">
                                ID: {complaint.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {complaint.category}
                            </span>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority_score)}`}>
                                LOW PRIORITY
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
                            <div className="text-xs text-gray-600">
                              <Building size={12} className="inline mr-1" />
                              {complaint.assignedDepartment}
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
          )}
        </div>

        {/* Empty State */}
        {filteredComplaints.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllComplaints;
