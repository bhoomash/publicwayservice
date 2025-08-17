import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';

const AdminComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    loadComplaintDetails();
  }, [id]);

  const loadComplaintDetails = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getComplaintById(id);
      setComplaint(data.complaint);
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error loading complaint details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await adminAPI.updateComplaintStatus(id, newStatus);
      setComplaint(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDepartmentAssign = async (department) => {
    try {
      await adminAPI.assignComplaint(id, department);
      setComplaint(prev => ({ ...prev, assigned_department: department }));
    } catch (error) {
      console.error('Error assigning department:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setAddingNote(true);
      await adminAPI.addComplaintNote(id, newNote);
      const newNoteObj = {
        id: Date.now(),
        note: newNote,
        created_at: new Date().toISOString(),
        admin_name: 'Current Admin'
      };
      setNotes(prev => [newNoteObj, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
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

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaint Not Found</h2>
          <Link to="/admin/complaints" className="text-blue-600 hover:text-blue-800">
            ← Back to Complaints
          </Link>
        </div>
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
                to="/admin/complaints"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Complaints
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Complaint #{complaint.id}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority?.toUpperCase() || 'UNKNOWN'} PRIORITY
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                {complaint.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Complaint Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complaint Message
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900">{complaint.message}</p>
                    </div>
                  </div>

                  {complaint.ai_summary && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI-Generated Summary
                      </label>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-gray-900">{complaint.ai_summary}</p>
                      </div>
                    </div>
                  )}

                  {complaint.ai_priority_reason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority Analysis
                      </label>
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-gray-900">{complaint.ai_priority_reason}</p>
                      </div>
                    </div>
                  )}

                  {complaint.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <p className="text-gray-900">{complaint.location}</p>
                    </div>
                  )}

                  {complaint.attachment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Attachment
                      </label>
                      <a 
                        href={complaint.attachment} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Attachment →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Internal Notes</h2>
                
                {/* Add New Note */}
                <div className="mb-6">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {addingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{note.admin_name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.note}</p>
                    </div>
                  ))}
                  
                  {notes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No internal notes yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="text-gray-900">{complaint.name || 'Anonymous'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <p className="text-gray-900">{complaint.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{complaint.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <p className="text-gray-900">{new Date(complaint.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status
                    </label>
                    <select
                      value={complaint.status || 'pending'}
                      onChange={(e) => handleStatusUpdate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Department
                    </label>
                    <select
                      value={complaint.assigned_department || ''}
                      onChange={(e) => handleDepartmentAssign(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      <option value="Water Department">Water Department</option>
                      <option value="Electricity Board">Electricity Board</option>
                      <option value="Public Works">Public Works</option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="Municipal Corporation">Municipal Corporation</option>
                    </select>
                  </div>

                  {complaint.assigned_department && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Currently assigned to:</span>
                      <p className="mt-1">{complaint.assigned_department}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category and Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <p className="text-gray-900">{complaint.category || 'Other'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Language:</span>
                    <p className="text-gray-900">{complaint.language || 'English'}</p>
                  </div>
                  {complaint.confidence_score && (
                    <div>
                      <span className="font-medium text-gray-700">AI Confidence:</span>
                      <p className="text-gray-900">{Math.round(complaint.confidence_score * 100)}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminComplaintDetail;
