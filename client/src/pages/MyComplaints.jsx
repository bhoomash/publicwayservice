import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react';

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    // TODO: Fetch actual complaints from API
    const mockComplaints = [
      {
        id: 'CMP001',
        title: 'Street Light Not Working',
        description: 'The street light in front of house number 123 has been non-functional for the past week.',
        category: 'Infrastructure',
        status: 'In Progress',
        priority: 'medium',
        location: '123 Main Street, Downtown',
        submittedDate: '2025-08-15',
        lastUpdated: '2025-08-16',
        estimatedResolution: '2025-08-20',
        assignedTo: 'Municipal Corporation',
        updates: [
          { date: '2025-08-16', message: 'Complaint received and forwarded to electrical department' },
          { date: '2025-08-15', message: 'Complaint submitted successfully' }
        ]
      },
      {
        id: 'CMP002',
        title: 'Water Supply Issue',
        description: 'No water supply in our area for the past 3 days. Multiple households affected.',
        category: 'Utilities',
        status: 'Pending',
        priority: 'high',
        location: 'Green Valley Colony, Sector 12',
        submittedDate: '2025-08-14',
        lastUpdated: '2025-08-14',
        estimatedResolution: '2025-08-18',
        assignedTo: 'Water Department',
        updates: [
          { date: '2025-08-14', message: 'Complaint submitted successfully' }
        ]
      },
      {
        id: 'CMP003',
        title: 'Road Repair Required',
        description: 'Large potholes on the main road causing traffic issues and vehicle damage.',
        category: 'Infrastructure',
        status: 'Resolved',
        priority: 'medium',
        location: 'Highway 101, Mile Marker 45',
        submittedDate: '2025-08-13',
        lastUpdated: '2025-08-16',
        estimatedResolution: '2025-08-16',
        assignedTo: 'Road Maintenance',
        updates: [
          { date: '2025-08-16', message: 'Road repair completed successfully' },
          { date: '2025-08-15', message: 'Repair work started' },
          { date: '2025-08-14', message: 'Site inspection completed' },
          { date: '2025-08-13', message: 'Complaint submitted successfully' }
        ]
      }
    ];
    
    setComplaints(mockComplaints);
    setFilteredComplaints(mockComplaints);
  }, []);

  useEffect(() => {
    let filtered = complaints;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(complaint => 
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, categoryFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle size={16} className="text-green-600" />;
      case 'In Progress': return <Clock size={16} className="text-orange-600" />;
      case 'Pending': return <AlertCircle size={16} className="text-red-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-orange-600 bg-orange-100';
      case 'Pending': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const categories = ['Infrastructure', 'Utilities', 'Road & Transportation', 'Public Safety', 'Healthcare', 'Education', 'Environmental', 'Corruption', 'Administrative', 'Other'];

  if (selectedComplaint) {
    return (
      <Layout title="Complaint Details">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to My Complaints
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedComplaint.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>ID: {selectedComplaint.id}</span>
                    <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority.charAt(0).toUpperCase() + selectedComplaint.priority.slice(1)} Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Complaint Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <p className="font-medium">{selectedComplaint.category}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Location:</span>
                      <p className="font-medium flex items-start">
                        <MapPin size={16} className="mr-1 mt-0.5 text-gray-500" />
                        {selectedComplaint.location}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Assigned To:</span>
                      <p className="font-medium">{selectedComplaint.assignedTo}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Timeline</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Submitted:</span>
                      <p className="font-medium flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-500" />
                        {new Date(selectedComplaint.submittedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <p className="font-medium flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-500" />
                        {new Date(selectedComplaint.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Expected Resolution:</span>
                      <p className="font-medium flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-500" />
                        {new Date(selectedComplaint.estimatedResolution).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedComplaint.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Status Updates</h3>
                <div className="space-y-3">
                  {selectedComplaint.updates.map((update, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-800">{update.message}</p>
                        <p className="text-sm text-gray-600">{new Date(update.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Complaints">
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
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
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Your Complaints ({filteredComplaints.length})
            </h2>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No complaints found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'You haven\'t submitted any complaints yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {filteredComplaints.map((complaint) => (
                <div key={complaint.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">{complaint.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(complaint.status)}`}>
                            {getStatusIcon(complaint.status)}
                            <span className="ml-1">{complaint.status}</span>
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{complaint.description}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <span className="font-medium">ID:</span>
                          <span className="ml-1">{complaint.id}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Category:</span>
                          <span className="ml-1">{complaint.category}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Submitted:</span>
                          <span className="ml-1">{new Date(complaint.submittedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedComplaint(complaint)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Eye size={16} className="mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyComplaints;
