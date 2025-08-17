import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
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
  MessageSquare
} from 'lucide-react';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showAIResponse, setShowAIResponse] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual complaint details from API
    const mockComplaint = {
      id: 'CMP001',
      userId: 'user123',
      userName: 'John Doe',
      userEmail: 'john.doe@email.com',
      userPhone: '+1-555-0123',
      title: 'Street Light Not Working',
      description: 'The street light in front of house number 123 has been non-functional for the past week. This is causing safety concerns for residents, especially during evening hours. Multiple neighbors have complained about the darkness making it difficult to walk safely. The light pole appears intact, but the bulb or electrical connection seems to be the issue.',
      category: 'Infrastructure',
      urgency: 'high',
      status: 'Assigned',
      priority_score: 85,
      assignedDepartment: 'Municipal Corporation - Electrical Division',
      aiResponse: 'Based on the description, this appears to be an electrical infrastructure issue requiring immediate attention. The complaint indicates a non-functional street light affecting public safety. Recommended action: Dispatch electrical maintenance team for inspection and repair. Priority level: High due to safety concerns. Estimated resolution time: 24-48 hours.',
      submittedDate: '2025-08-15T10:30:00Z',
      lastUpdated: '2025-08-16T14:20:00Z',
      location: '123 Main Street, Downtown',
      attachments: [
        { name: 'streetlight_image.jpg', size: '2.3 MB', type: 'image' },
        { name: 'location_map.pdf', size: '1.1 MB', type: 'pdf' }
      ],
      statusHistory: [
        { date: '2025-08-16T14:20:00Z', status: 'Assigned', note: 'Assigned to Municipal Corporation - Electrical Division', updatedBy: 'System' },
        { date: '2025-08-15T10:30:00Z', status: 'Submitted', note: 'Complaint submitted by user', updatedBy: 'John Doe' }
      ],
      notes: [
        { date: '2025-08-16T15:00:00Z', note: 'Electrical team has been notified. Will inspect tomorrow morning.', addedBy: 'Admin' }
      ]
    };
    
    setComplaint(mockComplaint);
    setIsLoading(false);
  }, [id]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle size={20} className="text-green-600" />;
      case 'In Progress': return <Clock size={20} className="text-blue-600" />;
      case 'Assigned': return <Target size={20} className="text-blue-600" />;
      default: return <AlertCircle size={20} className="text-orange-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'text-green-600 bg-green-100 border-green-200';
      case 'In Progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Assigned': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-orange-600 bg-orange-100 border-orange-200';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const handleStatusUpdate = () => {
    if (statusUpdate) {
      // TODO: Implement API call to update status
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
        statusHistory: [newStatusEntry, ...prev.statusHistory]
      }));
      
      setStatusUpdate('');
      setNewNote('');
    }
  };

  const addNote = () => {
    if (newNote) {
      // TODO: Implement API call to add note
      const note = {
        date: new Date().toISOString(),
        note: newNote,
        addedBy: 'Admin'
      };
      
      setComplaint(prev => ({
        ...prev,
        notes: [note, ...prev.notes]
      }));
      
      setNewNote('');
    }
  };

  if (isLoading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!complaint) {
    return (
      <Layout title="Complaint Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Complaint Not Found</h2>
          <button 
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Complaint ${complaint.id}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{complaint.title}</h1>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">ID: {complaint.id}</span>
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                      <span className="ml-2">{complaint.status}</span>
                    </span>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getUrgencyColor(complaint.urgency)}`}>
                      {complaint.urgency.toUpperCase()} PRIORITY
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{complaint.priority_score}</div>
                  <div className="text-xs text-gray-500">Priority Score</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Category:</span>
                  <p className="font-medium">{complaint.category}</p>
                </div>
                <div>
                  <span className="text-gray-600">Submitted:</span>
                  <p className="font-medium">{new Date(complaint.submittedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium">{new Date(complaint.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User size={20} className="mr-2 text-blue-600" />
                User Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{complaint.userName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{complaint.userName}</p>
                    <p className="text-sm text-gray-600">Citizen</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail size={16} className="mr-2" />
                    {complaint.userEmail}
                  </div>
                  {complaint.userPhone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText size={16} className="mr-2" />
                      {complaint.userPhone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
              
              {complaint.location && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start">
                    <MapPin size={16} className="mr-2 mt-1 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Location:</span>
                      <p className="font-medium text-gray-800">{complaint.location}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Response */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <button
                  onClick={() => setShowAIResponse(!showAIResponse)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <MessageSquare size={20} className="mr-2 text-purple-600" />
                    AI Analysis & Recommendations
                  </h3>
                  <span className="text-gray-400">
                    {showAIResponse ? '−' : '+'}
                  </span>
                </button>
              </div>
              {showAIResponse && (
                <div className="p-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{complaint.aiResponse}</p>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              
              {/* Status Update */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                <button
                  onClick={handleStatusUpdate}
                  disabled={!statusUpdate}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Status
                </button>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock size={20} className="mr-2 text-blue-600" />
                Status History
              </h3>
              <div className="space-y-4">
                {complaint.statusHistory.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                      <p className="text-xs text-gray-500">by {entry.updatedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {complaint.notes && complaint.notes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
                <div className="space-y-3">
                  {complaint.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-gray-700">{note.note}</p>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>by {note.addedBy}</span>
                        <span>{new Date(note.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComplaintDetails;
