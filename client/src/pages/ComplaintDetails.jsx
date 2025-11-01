import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { complaintsAPI, adminAPI } from '../utils/api';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

import { 
  ArrowLeft, 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Download,
  Edit,
  Trash2,
  MessageSquare,
  Brain,
  Sparkles,
  Database,
  TrendingUp,
  Lightbulb,
  Zap,
  Loader2,
  X
} from 'lucide-react';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(true);

  // Memoized helper functions for better performance
  const getStatusIcon = useMemo(() => (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle size={20} className="text-green-600" aria-label="Resolved status" />;
      case 'In Progress': return <Clock size={20} className="text-blue-600" aria-label="In Progress status" />;
      case 'Assigned': return <Target size={20} className="text-blue-600" aria-label="Assigned status" />;
      default: return <AlertCircle size={20} className="text-orange-600" aria-label="Pending status" />;
    }
  }, []);

  const getStatusColor = useMemo(() => (status) => {
    switch (status) {
      case 'Resolved': return 'text-green-600 bg-green-100 border-green-200';
      case 'In Progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Assigned': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-orange-600 bg-orange-100 border-orange-200';
    }
  }, []);

  const getUrgencyColor = useMemo(() => (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  }, []);

  // Date formatting helper
  const formatDate = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }, []);

  const formatDateOnly = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }, []);

  // Fetch complaint data from API
  const fetchComplaint = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const complaintData = await complaintsAPI.getComplaintById(id);
      setComplaint(complaintData);
    } catch (err) {
      console.error('Error fetching complaint:', err);
      setError('Failed to load complaint details');
      toast.error('Failed to load complaint details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  // Handle status update with API call
  const handleStatusUpdate = useCallback(async () => {
    if (!statusUpdate || !complaint?.id) return;
    
    try {
      setIsUpdating(true);
      await adminAPI.updateComplaintStatus(complaint.id, statusUpdate);
      
      // Update local state
      const newStatusEntry = {
        date: new Date().toISOString(),
        status: statusUpdate,
        note: newNote || `Status updated to ${statusUpdate}`,
        updatedBy: 'Admin'
      };
      
      setComplaint(prev => ({
        ...prev,
        status: statusUpdate,
        lastUpdated: new Date().toISOString(),
        statusHistory: [newStatusEntry, ...(prev.statusHistory || [])]
      }));
      
      setStatusUpdate('');
      setNewNote('');
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  }, [statusUpdate, newNote, complaint?.id]);

  // Add note with API call
  const addNote = useCallback(async () => {
    if (!newNote || !complaint?.id) return;
    
    try {
      setIsAddingNote(true);
      await adminAPI.addComplaintNote(complaint.id, newNote);
      
      // Update local state
      const note = {
        date: new Date().toISOString(),
        note: newNote,
        addedBy: 'Admin'
      };
      
      setComplaint(prev => ({
        ...prev,
        notes: [note, ...(prev.notes || [])]
      }));
      
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  }, [newNote, complaint?.id]);

  // Handle complaint deletion
  const handleDeleteComplaint = useCallback(async () => {
    if (!complaint?.id) return;
    
    try {
      setIsDeleting(true);
      await complaintsAPI.deleteComplaint(complaint.id);
      toast.success('Complaint deleted successfully');
      
      // Redirect based on user role
      if (isUserAdmin) {
        navigate('/admin/complaints');
      } else {
        navigate('/my-complaints');
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }, [complaint?.id, navigate, isUserAdmin]);

  // Navigate to similar complaint
  const handleSimilarComplaintClick = useCallback((similarId) => {
    navigate(`/admin/complaints/${similarId}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center h-64" role="status" aria-label="Loading complaint details">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading complaint details...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Error">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Complaint</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={fetchComplaint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!complaint) {
    return (
      <Layout title="Complaint Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Complaint Not Found</h2>
          <p className="text-gray-600 mb-6">The complaint you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  // Check if user is admin
  const isUserAdmin = useMemo(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      return userData.is_admin === true || userData.role === 'admin';
    } catch {
      return false;
    }
  }, []);

  return (
    <Layout title={`Complaint ${complaint.id}`}>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        {/* Back Button */}
        <nav aria-label="Breadcrumb">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={20} className="mr-2" aria-hidden="true" />
            Back to Dashboard
          </button>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <main className="lg:col-span-2 space-y-6">
            {/* Complaint Header */}
            <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{complaint.title}</h1>
                  <div className="flex items-center space-x-4 flex-wrap gap-2">
                    <span className="text-sm text-gray-600">ID: {complaint.id}</span>
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border transition-colors ${getStatusColor(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                      <span className="ml-2">{complaint.status}</span>
                    </span>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border transition-colors ${getUrgencyColor(complaint.urgency)}`}>
                      {(complaint.urgency || 'medium').toUpperCase()} PRIORITY
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{complaint.priority_score || 'N/A'}</div>
                  <div className="text-xs text-gray-500">Priority Score</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Category:</span>
                  <p className="font-medium">{complaint.category || 'General'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Submitted:</span>
                  <p className="font-medium">{formatDateOnly(complaint.submittedDate || complaint.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium">{formatDateOnly(complaint.lastUpdated || complaint.updated_at)}</p>
                </div>
              </div>
            </header>

            {/* User Information */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User size={20} className="mr-2 text-blue-600" aria-hidden="true" />
                User Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center" aria-hidden="true">
                    <span className="text-white font-medium">{(complaint.userName || complaint.user_name || 'U').charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{complaint.userName || complaint.user_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-600">Citizen</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail size={16} className="mr-2" aria-hidden="true" />
                    {complaint.userEmail || complaint.email || 'Not provided'}
                  </div>
                  {(complaint.userPhone || complaint.phone) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText size={16} className="mr-2" aria-hidden="true" />
                      {complaint.userPhone || complaint.phone}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{complaint.description || 'No description provided'}</p>
              
              {complaint.location && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start">
                    <MapPin size={16} className="mr-2 mt-1 text-gray-500" aria-hidden="true" />
                    <div>
                      <span className="text-sm text-gray-600">Location:</span>
                      <p className="font-medium text-gray-800">{complaint.location}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* AI Processing Status - Only show if admin or if AI was used */}
            {complaint.aiProcessed && (isUserAdmin || complaint.ai_response) && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm border-2 border-purple-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Brain size={24} className="mr-2 text-purple-600" />
                    AI Processing Details
                  </h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-semibold flex items-center">
                    <Sparkles size={12} className="mr-1" />
                    AI POWERED
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="text-xs text-gray-600 mb-1">Priority Score</div>
                    <div className="text-2xl font-bold text-purple-600">{complaint.priority_score}</div>
                    <div className="text-xs text-gray-500">AI calculated</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-xs text-gray-600 mb-1">Vector DB ID</div>
                    <div className="text-sm font-mono text-blue-600">{complaint.vectorDbId}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Database size={10} className="mr-1" />
                      Stored in RAG
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-xs text-gray-600 mb-1">Similar Cases</div>
                    <div className="text-2xl font-bold text-green-600">{complaint.similarComplaints?.length || 0}</div>
                    <div className="text-xs text-gray-500">Found by AI</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start mb-2">
                    <Sparkles size={16} className="text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-2">AI Analysis</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{complaint.aiResponse}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Complaints - Only show to admins */}
            {isUserAdmin && complaint.similarComplaints && complaint.similarComplaints.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-blue-600" aria-hidden="true" />
                  Similar Complaints ({complaint.similarComplaints.length})
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  AI found these similar complaints based on semantic analysis:
                </p>
                <div className="space-y-3">
                  {complaint.similarComplaints.map((similar, index) => (
                    <button
                      key={index}
                      onClick={() => handleSimilarComplaintClick(similar.id)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md hover:bg-blue-100 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label={`View similar complaint: ${similar.title}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800 flex-1">{similar.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {Math.round((similar.similarity || 0) * 100)}% match
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            similar.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                            similar.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {similar.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">Complaint ID: {similar.id}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* AI Recommendations - Only show to admins */}
            {isUserAdmin && complaint.aiRecommendations && complaint.aiRecommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Lightbulb size={20} className="mr-2 text-yellow-600" />
                  AI Recommendations
                </h3>
                <ul className="space-y-3">
                  {complaint.aiRecommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Original AI Response Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <button
                  onClick={() => setShowAIResponse(!showAIResponse)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <MessageSquare size={20} className="mr-2 text-purple-600" />
                    Status Updates & Notes
                  </h3>
                  <span className="text-gray-400">
                    {showAIResponse ? '−' : '+'}
                  </span>
                </button>
              </div>
              {showAIResponse && (
                <div className="p-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>Assigned to: {complaint.assignedDepartment}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      AI Generated
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Attachments</h3>
                <div className="space-y-3">
                  {complaint.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText size={20} className="text-gray-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-800">{attachment.name}</p>
                          <p className="text-sm text-gray-600">{attachment.size}</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700">
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="space-y-6" aria-label="Complaint actions and details">
            {/* Quick Actions */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              
              <div className="space-y-4">
                {/* Show admin controls only for admins */}
                {isUserAdmin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Status
                      </label>
                      <select
                        value={statusUpdate}
                        onChange={(e) => setStatusUpdate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={isUpdating}
                      >
                        <option value="">Select status...</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Note (Optional)
                      </label>
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note about this status update..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={3}
                        disabled={isUpdating}
                      />
                    </div>
                    
                    <button
                      onClick={handleStatusUpdate}
                      disabled={!statusUpdate || isUpdating}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        'Update Status'
                      )}
                    </button>

                    {/* Add Note Button */}
                    <button
                      onClick={addNote}
                      disabled={!newNote || isAddingNote}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                    >
                      {isAddingNote ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Adding Note...
                        </>
                      ) : (
                        'Add Note'
                      )}
                    </button>
                  </>
                )}

                {/* Delete Complaint Button - Available to both users and admins */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Complaint
                </button>

                {/* Download Document Button */}
                {complaint.generatedDocumentId && (
                  <button
                    onClick={() => window.open(`${API_URL}/complaints/${complaint.id}/document`, '_blank')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                  >
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </button>
                )}
              </div>
            </section>

            {/* Status History */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock size={20} className="mr-2 text-blue-600" aria-hidden="true" />
                Status History
              </h3>
              <div className="space-y-4">
                {(complaint.statusHistory || []).map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateOnly(entry.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                      <p className="text-xs text-gray-500">by {entry.updatedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Notes */}
            {complaint.notes && complaint.notes.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
                <div className="space-y-3">
                  {complaint.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-gray-700">{note.note}</p>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>by {note.addedBy}</span>
                        <span>{formatDateOnly(note.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 mr-3" aria-hidden="true" />
                  <h2 id="delete-modal-title" className="text-xl font-bold">Delete Complaint</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this complaint? This action cannot be undone and will permanently remove all associated data.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteComplaint}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Complaint'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ComplaintDetails;
