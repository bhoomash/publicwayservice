import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI, complaintsAPI } from '../../utils/api';
import { 
  Search, 
  Filter, 
  Eye, 
  AlertCircle,
  Clock,
  CheckCircle,
  Building,
  Calendar,
  User,
  FileText,
  Download,
  XCircle
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
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [currentComplaintId, setCurrentComplaintId] = useState(null);

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
      console.log('🔄 Fetching all complaints...');
      const response = await adminAPI.getAllComplaints();
      console.log('📊 Raw API response:', response);
      
      // Handle different response structures
      let complaintsData = [];
      if (Array.isArray(response)) {
        complaintsData = response;
      } else if (response?.complaints && Array.isArray(response.complaints)) {
        complaintsData = response.complaints;
      } else if (response?.data && Array.isArray(response.data)) {
        complaintsData = response.data;
      } else if (typeof response === 'object') {
        // If response is an object with complaint properties, wrap it in array
        complaintsData = [response];
      }
      
      console.log('📝 Processed complaints:', complaintsData.length, 'items');
      setComplaints(complaintsData);
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
      alert('Failed to fetch complaints. Please refresh the page.');
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

  const handleViewDocument = async (complaintId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      setCurrentComplaintId(complaintId);
      setLoadingDocument(true);
      setShowDocumentModal(true);
      
      const blob = await complaintsAPI.getComplaintDocument(complaintId);
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
    } catch (error) {
      console.error('Error loading document:', error);
      const errorMessage = error.response?.status === 404 
        ? 'No document available for this complaint.\n\nThis complaint was likely submitted before the document storage feature was implemented.\n\nNew complaints will automatically have documents generated and stored.'
        : 'Failed to load document. Please try again.';
      alert(errorMessage);
      setShowDocumentModal(false);
    } finally {
      setLoadingDocument(false);
    }
  };

  const closeDocumentModal = () => {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl(null);
    }
    setShowDocumentModal(false);
    setCurrentComplaintId(null);
  };

  // Render complaint card for mobile view
  const renderComplaintCard = (complaint, priorityColor) => (
    <div key={complaint.id} className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityColor} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`h-10 w-10 rounded-full ${priorityColor.replace('border', 'bg')} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
            <span className="text-sm font-medium">
              {String(complaint.user_name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {complaint.user_name || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {complaint.user_email || 'No email'}
            </p>
          </div>
        </div>
        <button
          onClick={() => openComplaintDetails(complaint)}
          className="text-blue-600 hover:text-blue-900 flex-shrink-0"
          title="View Details"
        >
          <Eye size={18} />
        </button>
      </div>

      {/* Message */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500">Complaint Message</p>
        <p className="text-sm text-gray-900 line-clamp-2">
          {complaint.message || complaint.description || 'No message'}
        </p>
        <p className="text-xs text-gray-400">ID: {complaint.id}</p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          {complaint.category || 'Uncategorized'}
        </span>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColorClass(complaint.priority)}`}>
          {(complaint.priority || 'Low').toUpperCase()}
        </span>
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColorClass(complaint.status)}`}>
          {getStatusIcon(complaint.status)}
          <span className="ml-1">{getStatusLabel(complaint.status)}</span>
        </span>
      </div>

      {/* Department */}
      <div className="text-xs text-gray-600 flex items-center">
        <Building size={12} className="mr-1" />
        {complaint.assigned_department || 'Not Assigned'}
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="flex space-x-2">
          <select
            value={complaint.status || 'pending'}
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updateComplaintStatus(complaint.id, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={(e) => handleViewDocument(complaint.id, e)}
            className="px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 flex items-center text-xs font-medium"
            title="View Document"
          >
            <FileText size={14} />
          </button>
        </div>
        <select
          value={complaint.assigned_department || ''}
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            assignDepartment(complaint.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
        >
          <option value="">Assign Department</option>
          {departments.map(dept => (
            <option key={dept.id || dept.name} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add note..."
            value={notes[complaint.id] || ''}
            onChange={(e) => updateNote(complaint.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addNote(complaint.id);
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );

  // Render section for a priority group
  const renderPrioritySection = (title, complaints, priorityColor, icon) => {
    if (complaints.length === 0) return null;

    return (
      <div className={`bg-white rounded-lg shadow-sm border ${priorityColor.replace('border', 'border')}`}>
        <div className={`p-4 md:p-6 border-b ${priorityColor.replace('border', 'border')} ${priorityColor.replace('border-', 'bg-').replace('-500', '-50')}`}>
          <div className="flex items-center">
            {icon}
            <h2 className="text-base md:text-lg font-semibold ml-2">
              {title} ({complaints.length})
            </h2>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden p-4 space-y-4">
          {complaints.map((complaint) => renderComplaintCard(complaint, priorityColor))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
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
              {complaints.map((complaint) => (
                <tr key={complaint.id} className={`hover:bg-opacity-10 hover:${priorityColor.replace('border', 'bg').replace('-500', '-50')} ${priorityColor}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full ${priorityColor.replace('border', 'bg')} flex items-center justify-center`}>
                          <span className="text-sm font-medium text-white">
                            {String(complaint.user_name || 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 max-w-md">
                          {complaint.message ? complaint.message.substring(0, 100) : complaint.description ? complaint.description.substring(0, 100) : 'No message'}
                          {(complaint.message?.length > 100 || complaint.description?.length > 100) ? '...' : ''}
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
                      <button
                        onClick={(e) => handleViewDocument(complaint.id, e)}
                        className="text-green-600 hover:text-green-900"
                        title="View Document"
                      >
                        <FileText size={16} />
                      </button>
                      <select
                        value={complaint.status || 'pending'}
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateComplaintStatus(complaint.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
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
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          assignDepartment(complaint.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-gray-300 rounded px-2 py-1 flex-1"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addNote(complaint.id);
                        }}
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
    );
  };

  if (loading) {
    return (
      <Layout title="All Complaints" isAdmin={true}>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-300 opacity-30" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-600 font-medium">Loading complaints...</p>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center sm:col-span-2 lg:col-span-1">
              <span className="text-xs md:text-sm text-gray-600">
                <span className="font-semibold">{filteredComplaints.length}</span> of <span className="font-semibold">{complaints.length}</span> complaints
              </span>
            </div>
          </div>
        </div>

        {/* Complaint Sections */}
        <div className="space-y-4 md:space-y-6">
          {/* High Priority Complaints */}
          {renderPrioritySection(
            "High Priority Complaints",
            prioritizedComplaints.high,
            "border-red-500",
            <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
          )}

          {/* Medium Priority Complaints */}
          {renderPrioritySection(
            "Medium Priority Complaints",
            prioritizedComplaints.medium,
            "border-yellow-500",
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
          )}

          {/* Low Priority Complaints */}
          {renderPrioritySection(
            "Low Priority Complaints",
            prioritizedComplaints.low,
            "border-green-500",
            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
          )}

          {/* Empty State */}
          {filteredComplaints.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12 text-center">
              <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-sm md:text-base text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Complaint Document</h3>
              <button
                onClick={closeDocumentModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <XCircle className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-2 md:p-4">
              {loadingDocument ? (
                <div className="flex items-center justify-center h-full min-h-[300px] md:min-h-[400px]">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-b-4 border-blue-600"></div>
                      <div className="absolute top-0 left-0 animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-b-4 border-blue-300 opacity-30" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <p className="text-sm md:text-base text-gray-600 font-medium">Loading document...</p>
                  </div>
                </div>
              ) : documentUrl ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-full min-h-[400px] md:min-h-[600px] border-0"
                  title="Complaint Document"
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px] md:min-h-[400px] text-gray-500 text-sm md:text-base">
                  Failed to load document
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-2 md:space-x-3 p-3 md:p-4 border-t">
              {documentUrl && (
                <a
                  href={documentUrl}
                  download={`complaint_${currentComplaintId}.pdf`}
                  className="inline-flex items-center px-3 md:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs md:text-sm font-medium"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Download
                </a>
              )}
              <button
                onClick={closeDocumentModal}
                className="px-3 md:px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs md:text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-2 md:mx-4 max-h-[95vh] md:max-h-screen overflow-y-auto">
            <div className="p-4 md:p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold">Complaint Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">ID</label>
                      <p className="text-xs md:text-sm break-all">{selectedComplaint.complaint_id || selectedComplaint.id}</p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Title</label>
                      <p className="text-xs md:text-sm">{selectedComplaint.title || selectedComplaint.subject || 'No title'}</p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Description</label>
                      <p className="text-xs md:text-sm">{selectedComplaint.description || selectedComplaint.message || 'No description'}</p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Category</label>
                      <p className="text-xs md:text-sm">{selectedComplaint.category || 'General'}</p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Priority</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColorClass(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority || 'medium'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">User Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Name</label>
                      <p className="text-xs md:text-sm">{selectedComplaint.user_name || 'Anonymous'}</p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Email</label>
                      <p className="text-xs md:text-sm break-all">{selectedComplaint.email || selectedComplaint.user_email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-xs md:text-sm">{selectedComplaint.phone || selectedComplaint.contact_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Status & Assignment</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(selectedComplaint.status)}`}>
                        {selectedComplaint.status || 'pending'}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Assigned Department</label>
                      <p className="text-xs md:text-sm">{selectedComplaint.assigned_department || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Created Date</label>
                      <p className="text-xs md:text-sm">
                        {selectedComplaint.created_at || selectedComplaint.submitted_date
                          ? new Date(selectedComplaint.created_at || selectedComplaint.submitted_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Additional Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Location</label>
                      <p className="text-xs md:text-sm">{selectedComplaint.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-500">Document</label>
                      <button
                        onClick={(e) => {
                          setShowModal(false);
                          handleViewDocument(selectedComplaint.id, e);
                        }}
                        className="text-xs md:text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FileText size={14} className="mr-1" />
                        View Document
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6 border-t bg-gray-50 sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="w-full md:w-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllComplaints;
