import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI, complaintsAPI } from '../utils/api';
import ComplaintDetailDrawer from '../components/ComplaintDetailDrawer';
import Layout from '../components/Layout';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Calendar,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Download
} from 'lucide-react';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const navigate = useNavigate();
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [currentComplaintId, setCurrentComplaintId] = useState(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllComplaints();
      // The response is already an array of complaints
      setComplaints(response || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.priority === priorityFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      } else if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    setFilteredComplaints(filtered);
  };

  const handleStatusUpdate = async (complaint, newStatus, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      // Ensure we're using the MongoDB _id
      const id = complaint?._id || complaint?.id;
      if (!id) throw new Error('Invalid complaint ID');

      await adminAPI.updateComplaintStatus(id, newStatus);
      setComplaints(prev => prev.map(item =>
        (item._id === id || item.id === id) ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAssignDepartment = async (complaint, department, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      // Ensure we're using the MongoDB _id
      const id = complaint?._id || complaint?.id;
      if (!id) throw new Error('Invalid complaint ID');

      await adminAPI.assignComplaint(id, department);
      setComplaints(prev => prev.map(item =>
        (item._id === id || item.id === id) ? { ...item, assigned_department: department } : item
      ));
    } catch (error) {
      console.error('Error assigning department:', error);
    }
  };

  const handleViewDocument = async (complaint, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const id = complaint?._id || complaint?.id;
      if (!id) throw new Error('Invalid complaint ID');

      setCurrentComplaintId(id);
      setLoadingDocument(true);
      setShowDocumentModal(true);
      
      const blob = await complaintsAPI.getComplaintDocument(id);
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document. The complaint may not have a stored document.');
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout isAdmin={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading complaints...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isAdmin={true}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Complaints Management</h1>
                <p className="text-gray-600">Manage and track all citizen complaints</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                Total: {complaints.length} | Showing: {filteredComplaints.length}
              </div>
              <button
                onClick={loadComplaints}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, message, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="water">Water Supply</option>
                <option value="electricity">Electricity</option>
                <option value="roads">Roads</option>
                <option value="waste">Waste Management</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="priority">Sort by Priority</option>
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredComplaints.map((complaint) => (
            <div 
              key={complaint._id || complaint.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => {
                setSelectedComplaintId(complaint._id || complaint.id);
                setIsDetailDrawerOpen(true);
              }}
            >
              <div className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getPriorityColor(complaint.priority)} bg-opacity-20`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {complaint.title || complaint.message?.substring(0, 80) + '...'}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          ID: #{(complaint._id || complaint.id || 'NO-ID').toString().slice(-8)}
                        </span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                      <span className="ml-1">{getStatusLabel(complaint.status)}</span>
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {complaint.message}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Submitted by</p>
                      <p className="text-sm font-medium text-gray-900">
                        {complaint.user_name || complaint.name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {complaint.category || 'Other'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">
                        {complaint.location || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-medium text-gray-900">
                        {complaint.assigned_department || 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Section */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedComplaintId(complaint._id || complaint.id);
                        setIsDetailDrawerOpen(true);
                      }}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    
                    <button
                      onClick={(e) => handleViewDocument(complaint, e)}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Document</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <select
                      value={complaint?.status || 'pending'}
                      onChange={(e) => handleStatusUpdate(complaint, e.target.value, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    
                    <select
                      value={complaint?.assigned_department || ''}
                      onChange={(e) => handleAssignDepartment(complaint, e.target.value, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Assign Department</option>
                      <option value="Water Department">Water Department</option>
                      <option value="Electricity Board">Electricity Board</option>
                      <option value="Public Works">Public Works</option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="Municipal Corporation">Municipal Corporation</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty State */}
          {filteredComplaints.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'No complaints have been submitted yet.'}
                </p>
                {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setCategoryFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Document Viewer Modal */}
        {showDocumentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Complaint Document</h3>
                <button
                  onClick={closeDocumentModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-4">
                {loadingDocument ? (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600">Loading document...</p>
                    </div>
                  </div>
                ) : documentUrl ? (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full min-h-[600px] border-0"
                    title="Complaint Document"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
                    Failed to load document
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-4 border-t">
                {documentUrl && (
                  <a
                    href={documentUrl}
                    download={`complaint_${currentComplaintId}.pdf`}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                )}
                <button
                  onClick={closeDocumentModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Detail Drawer */}
        <ComplaintDetailDrawer
          isOpen={isDetailDrawerOpen}
          onClose={() => {
            setIsDetailDrawerOpen(false);
            setSelectedComplaintId(null);
          }}
          complaintId={selectedComplaintId}
        />
      </div>
    </Layout>
  );
};

export default AdminComplaints;
