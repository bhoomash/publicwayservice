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
import {
  getPriorityColorClass,
  getStatusColorClass,
  getStatusLabel,
  normalizeComplaintsData
} from '../../utils/normalizeData';

// Local utility function for status icons
const getStatusIcon = (status) => {
  const statusLower = (status || '').toLowerCase();
  switch (statusLower) {
    case 'pending':
      return <Clock size={12} />;
    case 'in_progress':
      return <AlertCircle size={12} />;
    case 'resolved':
      return <CheckCircle size={12} />;
    default:
      return <Clock size={12} />;
  }
};

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [notes, setNotes] = useState({}); // Per-complaint notes storage
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // console.log('🔄 Fetching all complaints...');
      const response = await adminAPI.getAllComplaints();
      // console.log('📊 All complaints response:', response);
      
      // Handle different response structures
      const complaintsData = Array.isArray(response) 
        ? response 
        : (response?.complaints || response?.data || []);
      
      // console.log('📝 Processed complaints data:', complaintsData);
      setComplaints(complaintsData);
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    if (!Array.isArray(complaints)) {
      setFilteredComplaints([]);
      return;
    }

    let filtered = complaints;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(complaint =>
        String(complaint.message || '').toLowerCase().includes(searchLower) ||
        String(complaint.user_name || '').toLowerCase().includes(searchLower) ||
        String(complaint.user_email || '').toLowerCase().includes(searchLower) ||
        String(complaint.category || '').toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => 
        (complaint.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(complaint => 
        (complaint.priority || '').toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    setFilteredComplaints(filtered);
  };

  const categorizeComplaintsByPriority = (complaints = []) => {
    if (!Array.isArray(complaints)) return { high: [], medium: [], low: [] };
    
    return complaints.reduce((acc, complaint) => {
      const priority = (complaint.priority || 'low').toLowerCase();
      if (priority === 'high') {
        acc.high.push(complaint);
      } else if (priority === 'medium') {
        acc.medium.push(complaint);
      } else {
        acc.low.push(complaint);
      }
      return acc;
    }, { high: [], medium: [], low: [] });
  };

  const fetchDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments();
      setDepartments(response || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      await adminAPI.updateComplaintStatus(complaintId, newStatus);
      await fetchComplaints();
      if (selectedComplaint?.id === complaintId) {
        const updatedComplaint = await adminAPI.getComplaintById(complaintId);
        setSelectedComplaint(updatedComplaint);
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
    }
  };

  const assignDepartment = async (complaintId, department) => {
    try {
      await adminAPI.assignComplaint(complaintId, department);
      await fetchComplaints();
      if (selectedComplaint?.id === complaintId) {
        const updatedComplaint = await adminAPI.getComplaintById(complaintId);
        setSelectedComplaint(updatedComplaint);
      }
    } catch (error) {
      console.error('Error assigning department:', error);
    }
  };

  const addNote = async (complaintId) => {
    const noteText = notes[complaintId];
    if (!noteText?.trim()) return;
    
    try {
      await adminAPI.addComplaintNote(complaintId, noteText);
      // Clear only this complaint's note
      setNotes(prev => ({ ...prev, [complaintId]: '' }));
      await fetchComplaints();
      if (selectedComplaint?.id === complaintId) {
        const updatedComplaint = await adminAPI.getComplaintById(complaintId);
        setSelectedComplaint(updatedComplaint);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Handle opening complaint details modal
  const openComplaintDetails = async (complaint) => {
    try {
      const detailedComplaint = await adminAPI.getComplaintById(complaint.id);
      setSelectedComplaint(detailedComplaint);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      // Fallback to basic complaint data
      setSelectedComplaint(complaint);
      setShowModal(true);
    }
  };

  // Handle updating note input for specific complaint
  const updateNote = (complaintId, value) => {
    setNotes(prev => ({ ...prev, [complaintId]: value }));
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
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
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

        {/* Complaint Sections */}
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
                                  {String(complaint.user_name || 'A').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {complaint.message ? complaint.message.substring(0, 100) : 'No message'}
                                {complaint.message?.length > 100 ? '...' : ''}
                              </div>
                              <div className="text-sm text-gray-500">
                                {complaint.user_name || 'Anonymous'} • {complaint.user_email || 'No email'}
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
                              {complaint.category || 'Uncategorized'}
                            </span>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColorClass(complaint.priority)}`}>
                                {(complaint.priority || 'Low').toUpperCase()} PRIORITY
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColorClass(complaint.status)}`}>
                              {getStatusIcon(complaint.status)}
                              <span className="ml-1">{getStatusLabel(complaint.status)}</span>
                            </span>
                            <div className="text-xs text-gray-600">
                              <Building size={12} className="inline mr-1" />
                              {complaint.assigned_department || 'Not Assigned'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                          <div className="flex space-x-2 items-center">
                            <button
                              onClick={() => openComplaintDetails(complaint)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <select
                              value={complaint.status || 'pending'}
                              onChange={(e) => updateComplaintStatus(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          <div>
                            <select
                              value={complaint.assigned_department || ''}
                              onChange={(e) => assignDepartment(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                            >
                              <option value="">Assign Department</option>
                              {departments.map(dept => (
                                <option key={dept.id || dept.name} value={dept.name}>
                                  {dept.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Add note..."
                              value={notes[complaint.id] || ''}
                              onChange={(e) => updateNote(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 flex-1"
                            />
                            <button
                              onClick={() => addNote(complaint.id)}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
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
                                  {String(complaint.user_name || 'A').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {complaint.message ? complaint.message.substring(0, 100) : 'No message'}
                                {complaint.message?.length > 100 ? '...' : ''}
                              </div>
                              <div className="text-sm text-gray-500">
                                {complaint.user_name || 'Anonymous'} • {complaint.user_email || 'No email'}
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
                              {complaint.category || 'Uncategorized'}
                            </span>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColorClass(complaint.priority)}`}>
                                {(complaint.priority || 'Medium').toUpperCase()} PRIORITY
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColorClass(complaint.status)}`}>
                              {getStatusIcon(complaint.status)}
                              <span className="ml-1">{getStatusLabel(complaint.status)}</span>
                            </span>
                            <div className="text-xs text-gray-600">
                              <Building size={12} className="inline mr-1" />
                              {complaint.assigned_department || 'Not Assigned'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                          <div className="flex space-x-2 items-center">
                            <button
                              onClick={() => openComplaintDetails(complaint)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <select
                              value={complaint.status || 'pending'}
                              onChange={(e) => updateComplaintStatus(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          <div>
                            <select
                              value={complaint.assigned_department || ''}
                              onChange={(e) => assignDepartment(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                            >
                              <option value="">Assign Department</option>
                              {departments.map(dept => (
                                <option key={dept.id || dept.name} value={dept.name}>
                                  {dept.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Add note..."
                              value={notes[complaint.id] || ''}
                              onChange={(e) => updateNote(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 flex-1"
                            />
                            <button
                              onClick={() => addNote(complaint.id)}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
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
                                  {String(complaint.user_name || 'A').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {complaint.message ? complaint.message.substring(0, 100) : 'No message'}
                                {complaint.message?.length > 100 ? '...' : ''}
                              </div>
                              <div className="text-sm text-gray-500">
                                {complaint.user_name || 'Anonymous'} • {complaint.user_email || 'No email'}
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
                              {complaint.category || 'Uncategorized'}
                            </span>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColorClass(complaint.priority)}`}>
                                {(complaint.priority || 'Low').toUpperCase()} PRIORITY
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColorClass(complaint.status)}`}>
                              {getStatusIcon(complaint.status)}
                              <span className="ml-1">{getStatusLabel(complaint.status)}</span>
                            </span>
                            <div className="text-xs text-gray-600">
                              <Building size={12} className="inline mr-1" />
                              {complaint.assigned_department || 'Not Assigned'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                          <div className="flex space-x-2 items-center">
                            <button
                              onClick={() => openComplaintDetails(complaint)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <select
                              value={complaint.status || 'pending'}
                              onChange={(e) => updateComplaintStatus(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          <div>
                            <select
                              value={complaint.assigned_department || ''}
                              onChange={(e) => assignDepartment(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                            >
                              <option value="">Assign Department</option>
                              {departments.map(dept => (
                                <option key={dept.id || dept.name} value={dept.name}>
                                  {dept.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Add note..."
                              value={notes[complaint.id] || ''}
                              onChange={(e) => updateNote(complaint.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 flex-1"
                            />
                            <button
                              onClick={() => addNote(complaint.id)}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredComplaints.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Details Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Complaint Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID</label>
                      <p className="text-sm">{selectedComplaint.complaint_id || selectedComplaint.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-sm">{selectedComplaint.title || selectedComplaint.subject || 'No title'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-sm">{selectedComplaint.description || 'No description'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <p className="text-sm">{selectedComplaint.category || 'General'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Priority</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColorClass(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority || 'medium'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">User Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm">{selectedComplaint.user_name || 'Anonymous'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{selectedComplaint.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm">{selectedComplaint.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status & Assignment</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(selectedComplaint.status)}`}>
                        {selectedComplaint.status || 'pending'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned Department</label>
                      <p className="text-sm">{selectedComplaint.assigned_department || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created Date</label>
                      <p className="text-sm">{new Date(selectedComplaint.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-sm">{selectedComplaint.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Attachments</label>
                      <p className="text-sm">{selectedComplaint.attachments ? 'Available' : 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllComplaints;
