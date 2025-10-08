import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, CheckCircle, MessageSquare, History } from 'lucide-react';
import { adminAPI } from '../utils/api';

const ComplaintDetailDrawer = ({ isOpen, onClose, complaintId }) => {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [assigningDepartment, setAssigningDepartment] = useState(false);

  useEffect(() => {
    if (isOpen && complaintId) {
      loadComplaintDetails();
    } else {
      setNewNote('');
      setAddingNote(false);
      setAssigningDepartment(false);
    }
  }, [isOpen, complaintId]);

  const loadComplaintDetails = async () => {
    try {
      setLoading(true);
      // Ensure we're using the MongoDB _id
      const id = complaintId?._id || complaintId;
      if (!id) throw new Error('Invalid complaint ID');
      
      const data = await adminAPI.getComplaintById(id);
      setComplaint(data);
    } catch (error) {
      console.error('Error loading complaint details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      // Ensure we're using the MongoDB _id
      const id = complaint?._id || complaintId?._id || complaintId;
      await adminAPI.addComplaintNote(id, newNote.trim());
      setNewNote('');
      await loadComplaintDetails(); // Refresh the details
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleAssignDepartment = async (department) => {
    if (!department) return;

    try {
      setAssigningDepartment(true);
      // Ensure we're using the MongoDB _id
      const id = complaint?._id || complaintId?._id || complaintId;
      await adminAPI.assignComplaint(id, department);
      await loadComplaintDetails(); // Refresh the details
    } catch (error) {
      console.error('Error assigning department:', error);
    } finally {
      setAssigningDepartment(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in_progress': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <X className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Complaint Details</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : complaint ? (
              <div className="space-y-6">
                {/* Complaint Header */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">#{complaint.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      complaint.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {complaint.title}
                  </h3>
                  <p className="text-gray-600">{complaint.message}</p>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Complainant Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900">{complaint.user_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{complaint.user_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 text-gray-900">{complaint.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        complaint.priority === 'high' ? 'bg-red-100 text-red-800' :
                        complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {complaint.priority?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status History */}
                {complaint.status_history && complaint.status_history.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <History className="w-5 h-5 mr-2" />
                      Status History
                    </h4>
                    <div className="space-y-3">
                      {complaint.status_history.map((history, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          {getStatusIcon(history.status)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {history.status.replace('_', ' ').charAt(0).toUpperCase() + 
                                 history.status.slice(1)}
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(history.timestamp)}
                              </span>
                            </div>
                            {history.note && (
                              <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Department Assignment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Department Assignment</h4>
                  <select
                    value={complaint?.assigned_department || ''}
                    onChange={(e) => handleAssignDepartment(e.target.value)}
                    disabled={assigningDepartment}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    <option value="Water Department">Water Department</option>
                    <option value="Electricity Board">Electricity Board</option>
                    <option value="Public Works">Public Works</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Municipal Corporation">Municipal Corporation</option>
                  </select>
                  {assigningDepartment && (
                    <div className="mt-2 text-sm text-blue-600">
                      Updating department...
                    </div>
                  )}
                </div>

                {/* Add Note Form */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Add Note
                  </h4>
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter your note here..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      disabled={addingNote}
                    />
                    <button
                      type="submit"
                      disabled={addingNote || !newNote.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      {addingNote ? 'Adding Note...' : 'Add Note'}
                    </button>
                  </form>
                </div>

                {/* Notes List */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Notes
                  </h4>
                  <div className="space-y-4">
                    {complaint?.notes?.length ? (
                      complaint.notes.map((note, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{note?.admin_name || 'Admin'}</span>
                            <span className="text-xs text-gray-500">
                              {note?.created_at ? formatDateTime(note.created_at) : 'No date'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{note?.note || 'No content'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No notes added yet</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Failed to load complaint details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailDrawer;