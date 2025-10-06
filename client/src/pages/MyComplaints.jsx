import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { complaintsAPI } from '../utils/api';

const normalizeStatus = (status) => {
  if (!status) return 'pending';
  return status.toString().toLowerCase().replace(/\s+/g, '_');
};

const formatLabel = (value, fallback = 'Pending') => {
  if (!value) return fallback;
  return value
    .toString()
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const normalizePriority = (priority, urgency) => {
  const raw = (priority || urgency || 'medium').toString().toLowerCase();
  if (['urgent', 'critical', 'high'].includes(raw)) return 'high';
  if (raw === 'medium') return 'medium';
  if (raw === 'low') return 'low';
  return 'medium';
};

const buildUpdates = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .map((entry) => {
      const date = entry?.timestamp || entry?.date || entry?.created_at || entry?.updated_at || entry?.time;
      return {
        date,
        message: entry?.note || entry?.message || `${formatLabel(entry?.status)} update`,
        status: normalizeStatus(entry?.status)
      };
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
};

const transformComplaint = (complaint) => {
  const status = normalizeStatus(complaint?.status);
  const priority = normalizePriority(complaint?.priority, complaint?.urgency);
  const submittedDate = complaint?.submitted_date || complaint?.created_at || null;
  const lastUpdated = complaint?.last_updated || complaint?.updated_at || submittedDate;

  return {
    id: complaint?.id,
    title: complaint?.title || 'Complaint',
    description: complaint?.description || complaint?.rag_summary || 'No description provided.',
    category: complaint?.category || complaint?.ai_category || 'General',
    status,
    statusLabel: formatLabel(status),
    priority,
    priorityLabel: formatLabel(priority, 'Medium'),
    urgency: complaint?.urgency || priority,
    priorityScore: complaint?.priority_score || 0,
    location: complaint?.location || complaint?.rag_location || 'Not specified',
    assignedTo: complaint?.assigned_department || complaint?.rag_department || 'Pending assignment',
    submittedDate,
    lastUpdated,
    estimatedResolution: complaint?.estimated_resolution || null,
    vectorDbId: complaint?.vector_db_id,
    ragSummary: complaint?.rag_summary,
    ragMetadata: complaint?.rag_metadata,
    aiResponse: complaint?.ai_response,
    updates: buildUpdates(complaint?.status_history),
    attachments: Array.isArray(complaint?.attachments) ? complaint.attachments : [],
  };
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
};

const formatResolution = (value) => {
  if (!value) return 'TBD';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString();
  }
  return value;
};
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  MapPin,
  Brain,
  Sparkles,
  Database,
  TrendingUp
} from 'lucide-react';

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refreshComplaints = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchComplaints = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await complaintsAPI.getMyComplaints();
        const items = Array.isArray(response) ? response.map(transformComplaint) : [];
        if (!isMounted) return;
        setComplaints(items);
        setFilteredComplaints(items);
      } catch (err) {
        if (!isMounted) return;
        const detail = err?.response?.data?.detail;
        const message = typeof detail === 'string' ? detail : detail?.message || err.message || 'Failed to load complaints.';
        setError(message);
        setComplaints([]);
        setFilteredComplaints([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchComplaints();

    const handleComplaintSubmitted = () => {
      refreshComplaints();
    };

    window.addEventListener('complaint:submitted', handleComplaintSubmitted);

    return () => {
      isMounted = false;
      window.removeEventListener('complaint:submitted', handleComplaintSubmitted);
    };
  }, [reloadKey, refreshComplaints]);

  useEffect(() => {
  let filtered = [...complaints];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((complaint) =>
        complaint.title.toLowerCase().includes(searchLower) ||
        (complaint.id || '').toLowerCase().includes(searchLower) ||
        (complaint.description || '').toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((complaint) => complaint.status === statusFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((complaint) => complaint.category === categoryFilter);
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, categoryFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'in_progress':
        return <Clock size={16} className="text-orange-600" />;
      case 'pending':
        return <AlertCircle size={16} className="text-yellow-600" />;
      case 'rejected':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-orange-600 bg-orange-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const categories = ['Infrastructure', 'Utilities', 'Road & Transportation', 'Public Safety', 'Healthcare', 'Education', 'Environmental', 'Corruption', 'Administrative', 'Other'];

  if (loading && !selectedComplaint) {
    return (
      <Layout title="My Complaints">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <p className="text-sm text-gray-600">Loading your complaints...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !selectedComplaint) {
    return (
      <Layout title="My Complaints">
        <div className="max-w-xl mx-auto mt-10 bg-white border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle size={24} className="text-red-600 mr-3 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-700 mb-1">Unable to load complaints</h2>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={refreshComplaints}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
                    <span className={`px-2 py-1 rounded-full font-medium inline-flex items-center space-x-1 ${getStatusColor(selectedComplaint.status)}`}>
                      <span className="flex items-center">{getStatusIcon(selectedComplaint.status)}</span>
                      <span>{selectedComplaint.statusLabel}</span>
                    </span>
                    <span className={`px-2 py-1 rounded-full font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                      {selectedComplaint.priorityLabel} Priority
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
                        {formatDate(selectedComplaint.submittedDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <p className="font-medium flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-500" />
                        {formatDate(selectedComplaint.lastUpdated)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Expected Resolution:</span>
                      <p className="font-medium flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-500" />
                        {formatResolution(selectedComplaint.estimatedResolution)}
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
                {selectedComplaint.updates.length > 0 ? (
                  <div className="space-y-3">
                    {selectedComplaint.updates.map((update, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-gray-800">{update.message}</p>
                          <p className="text-sm text-gray-600">{formatDate(update.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No updates yet. We&apos;ll notify you as soon as your complaint progresses.</p>
                )}
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
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Your Complaints ({filteredComplaints.length})
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshComplaints}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Sparkles size={16} className="mr-1" /> Refresh List
              </button>
            </div>
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
                <div key={complaint.id} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">{complaint.title}</h3>
                          {/* AI Processed Badge */}
                          <span className="ml-3 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-xs font-medium flex items-center">
                            <Brain size={12} className="mr-1" />
                            AI Processed
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(complaint.status)}`}>
                            {getStatusIcon(complaint.status)}
                            <span className="ml-1">{complaint.statusLabel}</span>
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priorityLabel}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{complaint.description}</p>
                      
                      {/* AI Insights Bar */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center text-sm">
                          <Sparkles size={14} className="text-purple-600 mr-2" />
                          <span className="text-gray-700 font-medium mr-2">AI Analysis:</span>
                          <span className="text-gray-600">Auto-assigned to {complaint.assignedTo}</span>
                          {complaint.vectorDbId && (
                            <span className="ml-auto text-xs text-gray-500 flex items-center">
                              <Database size={12} className="mr-1" />
                              Vector DB
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-500 mb-4">
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
                          <span className="ml-1">{formatDate(complaint.submittedDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Updated:</span>
                          <span className="ml-1">{formatDate(complaint.lastUpdated)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Priority Score:</span>
                          <span className="ml-1">{complaint.priorityScore}</span>
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
