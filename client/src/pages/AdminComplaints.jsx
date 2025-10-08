import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';
import ComplaintDetailDrawer from '../components/ComplaintDetailDrawer';

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

  const handleStatusUpdate = async (complaint, newStatus) => {
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

  const handleAssignDepartment = async (complaint, department) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Complaints Management</h1>
            </div>
            <button
              onClick={loadComplaints}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="priority">Sort by Priority</option>
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredComplaints.length} of {complaints.length} complaints
            </div>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <div 
              key={complaint.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedComplaintId(complaint.id);
                setIsDetailDrawerOpen(true);
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority?.toUpperCase() || 'UNKNOWN'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{complaint._id || complaint.id || 'NO-ID'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {complaint.title || complaint.message?.substring(0, 100) + '...'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">User Name:</span> {complaint.user_name || complaint.name || 'Anonymous'}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {complaint.user_email || '-'}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(complaint.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {complaint.category || 'Other'}
                      </div>
                      <div>
                        <span className="font-medium">Assigned Department:</span> {complaint.assigned_department || 'Not Assigned'}
                      </div>
                      <div>
                        <span className="font-medium">Priority:</span> 
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority?.charAt(0).toUpperCase() + complaint.priority?.slice(1) || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/admin/complaints/${complaint.id}`}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                    
                    <select
                      value={complaint?.status || 'pending'}
                      onChange={(e) => handleStatusUpdate(complaint, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    
                    <select
                      value={complaint?.assigned_department || ''}
                      onChange={(e) => handleAssignDepartment(complaint, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
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
                
                <div className="mt-3 text-sm text-gray-700">
                  <p className="line-clamp-2">{complaint.message}</p>
                </div>
              </div>
            </div>
          ))}
          
          {filteredComplaints.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-500">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </div>

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
  );
};

export default AdminComplaints;
