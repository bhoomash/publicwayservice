import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { ragAPI, complaintsAPI } from '../utils/api';
import { 
  FileText, 
  Upload, 
  MapPin, 
  Phone, 
  Mail,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Search,
  TrendingUp,
  Loader2,
  Brain,
  Lightbulb,
  Info
} from 'lucide-react';

const SubmitComplaint = () => {
  // Submission Mode State
  const [submissionMode, setSubmissionMode] = useState('text'); // 'text' or 'document'
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    contactPhone: '',
    contactEmail: '',
    urgency: 'medium',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  // RAG Integration State
  const [ragAnalysis, setRagAnalysis] = useState(null);
  const [similarComplaints, setSimilarComplaints] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  
  // Document Upload State
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const categories = [
    'Infrastructure',
    'Utilities (Water/Electricity)',
    'Road & Transportation',
    'Public Safety',
    'Healthcare',
    'Education',
    'Environmental',
    'Corruption',
    'Administrative',
    'Other'
  ];

  // Enhanced RAG analysis function with AI insights
  const analyzeComplaintText = useCallback(async (text, category, urgency) => {
    if (!text || text.trim().length < 20) {
      setRagAnalysis(null);
      setSimilarComplaints([]);
      setAiInsights(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Call the RAG analyze-text endpoint
      const response = await ragAPI.analyzeComplaintText(
        formData.title, 
        formData.description, 
        category, 
        urgency,
        formData.location
      );
      
      console.log('RAG Analysis Response:', response);
      
      setRagAnalysis(response);
      setSimilarComplaints(response.similar_complaints || []);
      setShowSuggestions(response.similar_complaints && response.similar_complaints.length > 0);
      
      // Generate AI insights
      if (response.similar_complaints && response.similar_complaints.length > 0) {
        setAiInsights({
          hasSimilar: true,
          count: response.similar_complaints.length,
          message: `Found ${response.similar_complaints.length} similar complaint(s) in the system.`,
          suggestion: 'You may want to review these similar cases before submitting.'
        });
      } else {
        setAiInsights({
          hasSimilar: false,
          message: 'No similar complaints found. This appears to be a unique issue.',
          suggestion: 'Your complaint will help build our knowledge base.'
        });
      }
    } catch (error) {
      console.error('RAG analysis error:', error);
      setAiInsights({
        error: true,
        message: 'AI analysis temporarily unavailable. You can still submit your complaint.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [formData.title, formData.description, formData.location]);

  // Debounce timer - trigger analysis when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const combinedText = `${formData.title} ${formData.description}`.trim();
      if (combinedText.length >= 20 && formData.description.length >= 10) {
        analyzeComplaintText(combinedText, formData.category, formData.urgency);
      } else if (combinedText.length < 20) {
        setRagAnalysis(null);
        setSimilarComplaints([]);
        setAiInsights(null);
      }
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [formData.title, formData.description, formData.category, formData.urgency, analyzeComplaintText]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Document Upload Handler
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedDocument(file);
    setIsExtracting(true);
    setExtractedData(null);

    try {
      // Upload document to RAG pipeline for extraction
      const response = await ragAPI.uploadDocument(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Document extraction progress: ${percentCompleted}%`);
      });

      console.log('✅ Document extraction successful:', response);

      // Set extracted data for confirmation
      setExtractedData({
        title: response.summary?.substring(0, 100) || 'Extracted from document',
        category: response.department || 'General',
        description: response.summary || '',
        location: response.location || '',
        urgency: response.urgency?.toLowerCase() || 'medium',
        vectorDbId: response.vector_db_id,
        complaintId: response.complaint_id,
        color: response.color,
        emoji: response.emoji
      });
      
      setShowConfirmation(true);
    } catch (error) {
      console.error('❌ Document extraction failed:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to process document. Please try again.',
        detail: error.detail || null
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Confirm and submit extracted data
  const handleConfirmDocumentSubmission = async () => {
    if (!extractedData) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // The document is already processed, just confirm the submission
      setSubmitStatus({
        type: 'success',
        complaintId: extractedData.complaintId,
        aiSummary: {
          category: extractedData.category,
          assigned_department: extractedData.category,
          estimated_resolution: extractedData.urgency === 'high' ? '24-48 hours' : '3-5 business days',
          urgency: extractedData.urgency
        },
        vectorDbId: extractedData.vectorDbId,
        ragAnalysis: {
          document_id: extractedData.vectorDbId,
          summary: extractedData.description,
          urgency: extractedData.urgency,
          department: extractedData.category,
          location: extractedData.location,
          color: extractedData.color,
          emoji: extractedData.emoji
        },
        formData: {
          title: extractedData.title,
          category: extractedData.category,
          description: extractedData.description,
          location: extractedData.location,
          urgency: extractedData.urgency,
          attachments: [uploadedDocument]
        }
      });

      // Dispatch events
      window.dispatchEvent(new CustomEvent('complaint:submitted', {
        detail: {
          complaintId: extractedData.complaintId,
          vectorDbId: extractedData.vectorDbId
        }
      }));

      window.dispatchEvent(new CustomEvent('admin:dashboard-refresh', {
        detail: {
          complaintId: extractedData.complaintId
        }
      }));

      // Reset document upload state
      setUploadedDocument(null);
      setExtractedData(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error('💥 Submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to submit complaint. Please try again.',
        detail: error.detail || null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      let complaintResponse;
      
      console.log('Submitting complaint with data:', formData);
      
      // TEXT COMPLAINT - Use Standard Complaint Endpoint with AI Processing
      console.log('📝 Text complaint - Using standard endpoint with AI');
      
      try {
        const textComplaintData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          contact_phone: formData.contactPhone,
          contact_email: formData.contactEmail,
          urgency: formData.urgency
        };
        
        const response = await complaintsAPI.submitComplaint(textComplaintData);
        
        console.log('✅ Text complaint submitted successfully:', response);
        
        complaintResponse = {
          ...response,
          vector_db_id: response.vector_db_id || response.rag_analysis?.document_id
        };
        
      } catch (submitError) {
        console.error('❌ Complaint submission failed:', submitError);
        const detail = submitError.response?.data?.detail;
        const message = typeof detail === 'string'
          ? detail
          : detail?.message || detail?.reason || 'Failed to submit complaint. Please try again.';
        const err = new Error(message);
        if (detail && typeof detail === 'object') {
          err.detail = detail;
        }
        throw err;
      }
      
      // Success! Update UI
      setSubmitStatus({
        type: 'success',
        complaintId: complaintResponse.complaint_id,
        aiSummary: complaintResponse.ai_summary,
        vectorDbId: complaintResponse.vector_db_id,
        ragAnalysis: complaintResponse.rag_analysis,
        formData: { ...formData }
      });
      
      console.log('🎉 Complaint submission complete!', complaintResponse);

      window.dispatchEvent(new CustomEvent('complaint:submitted', {
        detail: {
          complaintId: complaintResponse.complaint_id,
          vectorDbId: complaintResponse.vector_db_id,
          form: { ...formData }
        }
      }));

      window.dispatchEvent(new CustomEvent('admin:dashboard-refresh', {
        detail: {
          complaintId: complaintResponse.complaint_id
        }
      }));
      
      // Reset form and suggestions
      setFormData({
        title: '',
        category: '',
        description: '',
        location: '',
        contactPhone: '',
        contactEmail: '',
        urgency: 'medium',
        attachments: []
      });
      setRagAnalysis(null);
      setSimilarComplaints([]);
      setShowSuggestions(false);
      setAiInsights(null);
      setUploadedDocument(null);
      setExtractedData(null);
      setShowConfirmation(false);
      
    } catch (error) {
      console.error('💥 Submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to submit complaint. Please try again.',
        detail: error.detail || null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus && submitStatus.type === 'success') {
    const complaintData = submitStatus.formData || {};
    const aiData = submitStatus.aiSummary || {};
    const ragData = submitStatus.ragAnalysis || {};
    
    const aiSummary = {
      complaintId: submitStatus.complaintId,
      category: aiData.category || ragData.department || complaintData.category || 'General',
      priorityScore: aiData.priority_score || (
        complaintData.urgency === 'urgent' ? 95 : 
        complaintData.urgency === 'high' ? 80 :
        complaintData.urgency === 'medium' ? 65 : 50
      ),
      assignedDepartment: aiData.assigned_department || ragData.department || (
        aiData.category === 'Infrastructure' || complaintData.category === 'Infrastructure' ? 'Municipal Corporation - Infrastructure' :
        aiData.category === 'Utilities' || complaintData.category === 'Utilities (Water/Electricity)' ? 'Water & Power Department' :
        aiData.category === 'Environmental' || complaintData.category === 'Environmental' ? 'Environmental Compliance Division' :
        aiData.category === 'Road & Transportation' || complaintData.category === 'Road & Transportation' ? 'Transport & Roads Department' :
        aiData.category === 'Public Safety' || complaintData.category === 'Public Safety' ? 'Public Safety & Security' :
        aiData.category === 'Healthcare' || complaintData.category === 'Healthcare' ? 'Health Services Department' :
        'General Administration'
      ),
      estimatedResolution: aiData.estimated_resolution || (
        (aiData.urgency || ragData.urgency || complaintData.urgency) === 'urgent' ? '24 hours' :
        (aiData.urgency || ragData.urgency || complaintData.urgency) === 'high' ? '24-48 hours' :
        (aiData.urgency || ragData.urgency || complaintData.urgency) === 'medium' ? '3-5 business days' :
        '5-10 business days'
      ),
      aiRecommendation: aiData.suggested_response || '✅ Your complaint has been processed using AI-powered analysis. The system has automatically categorized your issue, assigned it to the appropriate department, and added it to our knowledge base for future reference.',
      ragProcessed: true,
      vectorDbId: submitStatus.vectorDbId || ragData.document_id || 'Processing...',
      isFileUpload: complaintData.attachments && complaintData.attachments.length > 0
    };

    return (
      <Layout title="Complaint Submitted">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Complaint Submitted Successfully!</h2>
              <p className="text-gray-600">
                Your complaint has been processed through the RAG intelligence pipeline and assigned for review.
              </p>
            </div>

            {/* AI Processing Results */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">AI</span>
                  </span>
                  AI Analysis Complete
                </div>
                {aiSummary.isFileUpload && (
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold flex items-center">
                    <Upload size={12} className="mr-1" />
                    RAG Pipeline
                  </span>
                )}
                {!aiSummary.isFileUpload && (
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold flex items-center">
                    <FileText size={12} className="mr-1" />
                    Text Analysis
                  </span>
                )}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">{aiSummary.complaintId}</div>
                  <div className="text-sm text-gray-600">Complaint ID</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600">{aiSummary.priorityScore}</div>
                  <div className="text-sm text-gray-600">Priority Score</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="text-gray-600">{aiSummary.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Assigned Department:</span>
                  <span className="text-gray-600">{aiSummary.assignedDepartment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Estimated Resolution:</span>
                  <span className="text-gray-600">{aiSummary.estimatedResolution}</span>
                </div>
                {aiSummary.vectorDbId !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">AI Vector DB ID:</span>
                    <span className="text-gray-600 text-xs">{aiSummary.vectorDbId.substring(0, 12)}...</span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">{aiSummary.aiRecommendation}</p>
              </div>
            </div>

            {/* RAG Insights */}
            {ragData && Object.keys(ragData).length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 border border-cyan-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center mr-2">
                    <Sparkles size={14} className="text-white" />
                  </span>
                  RAG Intelligence Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Urgency</span>
                    <span className={`text-base font-semibold ${ragData.urgency === 'High' ? 'text-red-600' : ragData.urgency === 'Medium' ? 'text-orange-600' : 'text-green-600'}`}>
                      {ragData.emoji ? `${ragData.emoji} ` : ''}{ragData.urgency || 'Analyzing'}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Department</span>
                    <span className="text-base font-semibold text-gray-700">{ragData.department || 'Determining...'}</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Vector DB ID</span>
                    <span className="text-xs font-mono text-gray-600 break-all">{(ragData.document_id || aiSummary.vectorDbId || '').toString()}</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <span className="text-sm text-gray-500 block mb-2">AI Summary</span>
                  <p className="text-gray-700 text-sm leading-relaxed">{ragData.summary || 'The system is generating an insight summary for your report...'}</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    <span>{ragData.location || complaintData.location || 'Location not detected'}</span>
                  </div>
                  <div className="flex items-center">
                    <Brain size={16} className="mr-2 text-gray-500" />
                    <span>Semantic embedding created for similarity search</span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-6">
                You will receive email updates and can track progress in the "My Complaints" section.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setSubmitStatus(null)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Another Complaint
                </button>
                <button
                  onClick={() => window.location.href = '/my-complaints'}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View My Complaints
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Submit Complaint">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left/Center Column */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <FileText size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Submit New Complaint</h2>
                      <p className="text-sm text-gray-600">AI-Powered Analysis & Processing</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="text-purple-600" size={20} />
                    {(isAnalyzing || isExtracting) && <Loader2 className="animate-spin text-blue-600" size={20} />}
                  </div>
                </div>
              </div>

              {/* Submission Mode Switcher */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionMode('text');
                      setUploadedDocument(null);
                      setExtractedData(null);
                      setShowConfirmation(false);
                    }}
                    className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                      submissionMode === 'text'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <FileText size={18} />
                    <span>Text Complaint</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionMode('document');
                      // Clear text form state when switching
                      setRagAnalysis(null);
                      setSimilarComplaints([]);
                      setAiInsights(null);
                    }}
                    className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                      submissionMode === 'document'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Upload size={18} />
                    <span>Document Upload</span>
                  </button>
                </div>
              </div>

              {/* Conditional Rendering Based on Mode */}
              {submissionMode === 'text' ? (
                // TEXT COMPLAINT FORM
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title with AI indicator */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Sparkles size={16} className="text-purple-500 mr-1" />
                    Complaint Title *
                    {isAnalyzing && (
                      <span className="ml-2 text-xs text-blue-600 flex items-center">
                        <Loader2 size={12} className="animate-spin mr-1" />
                        AI analyzing...
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Brief, descriptive title for your complaint"
                  />
                  <p className="text-xs text-gray-500 mt-1">Be specific and concise for better AI categorization</p>
                </div>

            {/* Category and Priority with Enhanced Styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="text-green-500 mr-1" />
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  <option value="">🎯 Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'Infrastructure' && '🏗️ '}
                      {category === 'Utilities (Water/Electricity)' && '💡 '}
                      {category === 'Road & Transportation' && '🚗 '}
                      {category === 'Public Safety' && '🚨 '}
                      {category === 'Healthcare' && '🏥 '}
                      {category === 'Education' && '📚 '}
                      {category === 'Environmental' && '🌿 '}
                      {category === 'Corruption' && '⚖️ '}
                      {category === 'Administrative' && '📋 '}
                      {category === 'Other' && '📌 '}
                      {category}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">AI uses this for department routing</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle size={16} className="text-orange-500 mr-1" />
                  Urgency Level *
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                >
                  <option value="low">🟢 Low - Can wait a few days</option>
                  <option value="medium">🟡 Medium - Should be addressed soon</option>
                  <option value="high">🟠 High - Needs urgent attention</option>
                  <option value="urgent">🔴 Urgent - Immediate action required</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Affects priority score & response time
                </p>
              </div>
            </div>

            {/* Description with AI Analysis */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Brain size={16} className="text-blue-500 mr-1" />
                Detailed Description *
                <span className="ml-2 text-xs text-gray-500">
                  (Min 20 characters for AI analysis)
                </span>
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Describe your complaint in detail. Include when it happened, what went wrong, and how it affects you. More details help our AI provide better insights..."
                />
                {formData.description.length > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                    {formData.description.length} characters
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full address or location details"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1" />
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1" />
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your email address"
                />
              </div>
            </div>

            {/* RAG AI Suggestions */}
            {showSuggestions && (formData.title || formData.description) && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Sparkles size={20} className="text-purple-600 mr-2" />
                    AI-Powered Insights
                  </h3>
                  {isAnalyzing && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      Analyzing...
                    </div>
                  )}
                </div>

                {ragAnalysis && (
                  <>
                    {/* AI Suggestions */}
                    {ragAnalysis.suggestions && ragAnalysis.suggestions.length > 0 && (
                      <div className="mb-4 p-4 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-start">
                          <TrendingUp size={18} className="text-purple-600 mr-2 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-2">AI Recommendations</h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                              {ragAnalysis.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-purple-600 mr-2">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Similar Complaints */}
                    {similarComplaints.length > 0 && (
                      <div className="p-4 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-start mb-3">
                          <Search size={18} className="text-blue-600 mr-2 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">Similar Complaints Found</h4>
                            <p className="text-xs text-gray-600 mb-3">
                              These complaints match your description. You may want to review them before submitting.
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {similarComplaints.slice(0, 3).map((complaint, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-gray-800 text-sm flex-1">
                                  {complaint.title || complaint.metadata?.title || 'Complaint'}
                                </h5>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded ml-2">
                                  {Math.round(complaint.similarity * 100)}% match
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {complaint.text || complaint.metadata?.description || 'No description'}
                              </p>
                              {complaint.metadata?.status && (
                                <div className="mt-2 flex items-center text-xs">
                                  <span className="text-gray-500">Status:</span>
                                  <span className={`ml-2 px-2 py-0.5 rounded ${
                                    complaint.metadata.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                    complaint.metadata.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {complaint.metadata.status.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!ragAnalysis.suggestions?.length && !similarComplaints.length && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                        <p className="text-sm text-gray-600">
                          No similar complaints found. Your issue appears to be unique.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {!ragAnalysis && !isAnalyzing && (
                  <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Type more details to get AI-powered insights and similar complaints...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {submitStatus?.type === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">
                      {submitStatus.message || 'Failed to submit complaint. Please try again.'}
                    </p>
                    {submitStatus.detail && (
                      <div className="mt-2 text-sm text-red-600 space-y-1">
                        {submitStatus.detail.reason && (
                          <p>
                            <span className="font-semibold">Reason:</span> {submitStatus.detail.reason}
                          </p>
                        )}
                        {typeof submitStatus.detail.confidence === 'number' && (
                          <p>
                            <span className="font-semibold">Confidence:</span>{' '}
                            {(submitStatus.detail.confidence * 100).toFixed(0)}%
                          </p>
                        )}
                        {submitStatus.detail.message && submitStatus.detail.message !== submitStatus.message && (
                          <p>{submitStatus.detail.message}</p>
                        )}
                        {!submitStatus.detail.reason && !submitStatus.detail.message && typeof submitStatus.detail === 'string' && (
                          <p>{submitStatus.detail}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    Submit Complaint
                  </>
                )}
              </button>
            </div>
          </form>
              ) : (
                // DOCUMENT UPLOAD INTERFACE
                <div className="p-6 space-y-6">
                  {/* Upload Section */}
                  {!extractedData && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          <Upload size={20} className="mr-2 text-blue-600" />
                          Upload Document for AI Processing
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Upload a document (PDF, DOCX, image) containing your complaint details. 
                          Our AI will automatically extract title, category, description, location, and urgency.
                        </p>
                        
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-white">
                          {isExtracting ? (
                            <div className="space-y-4">
                              <Loader2 size={48} className="text-blue-600 mx-auto animate-spin" />
                              <p className="text-lg font-semibold text-gray-800">Analyzing Document...</p>
                              <p className="text-sm text-gray-600">
                                AI is extracting complaint information from your document
                              </p>
                              <div className="flex items-center justify-center space-x-2">
                                <Brain className="text-purple-600 animate-pulse" size={20} />
                                <Sparkles className="text-blue-600 animate-pulse" size={20} />
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                              <p className="text-lg font-medium text-gray-700 mb-2">
                                Drop your file here or click to browse
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                Supported formats: PDF, DOCX, PNG, JPG (max 10MB)
                              </p>
                              <input
                                type="file"
                                onChange={handleDocumentUpload}
                                accept=".pdf,.docx,.png,.jpg,.jpeg"
                                className="hidden"
                                id="document-upload"
                                disabled={isExtracting}
                              />
                              <label
                                htmlFor="document-upload"
                                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-semibold"
                              >
                                Select Document
                              </label>
                            </>
                          )}
                        </div>
                        
                        {uploadedDocument && !extractedData && !isExtracting && (
                          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText size={20} className="text-blue-600 mr-3" />
                              <span className="text-sm font-medium text-gray-700">{uploadedDocument.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                setUploadedDocument(null);
                                setExtractedData(null);
                              }}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Extracted Data Confirmation */}
                  {extractedData && showConfirmation && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <CheckCircle size={20} className="mr-2 text-green-600" />
                          AI Extraction Complete - Please Review
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Extracted Title */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Title</label>
                            <p className="text-gray-800 font-medium">{extractedData.title}</p>
                          </div>

                          {/* Extracted Category & Urgency */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <label className="text-sm font-medium text-gray-600 mb-2 block">Category</label>
                              <p className="text-gray-800 font-medium flex items-center">
                                {extractedData.emoji && <span className="mr-2">{extractedData.emoji}</span>}
                                {extractedData.category}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <label className="text-sm font-medium text-gray-600 mb-2 block">Urgency</label>
                              <p className={`font-medium ${
                                extractedData.urgency === 'high' ? 'text-red-600' :
                                extractedData.urgency === 'medium' ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {extractedData.urgency.charAt(0).toUpperCase() + extractedData.urgency.slice(1)}
                              </p>
                            </div>
                          </div>

                          {/* Extracted Description */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Description</label>
                            <p className="text-gray-700 text-sm leading-relaxed">{extractedData.description}</p>
                          </div>

                          {/* Extracted Location */}
                          {extractedData.location && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <label className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                                <MapPin size={16} className="mr-1" />
                                Location
                              </label>
                              <p className="text-gray-800">{extractedData.location}</p>
                            </div>
                          )}

                          {/* Vector DB Info */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <Brain size={20} className="text-blue-600 mr-3 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 mb-1">AI Processing Complete</p>
                                <p className="text-xs text-gray-600">
                                  Vector DB ID: <span className="font-mono">{extractedData.vectorDbId.substring(0, 12)}...</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Complaint ID: <span className="font-mono font-semibold">{extractedData.complaintId}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setExtractedData(null);
                              setUploadedDocument(null);
                              setShowConfirmation(false);
                            }}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                          >
                            Cancel & Upload New
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmDocumentSubmission}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center font-semibold"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="animate-spin mr-2" size={18} />
                                Confirming...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={18} className="mr-2" />
                                Confirm & Submit
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message for Document Upload */}
                  {submitStatus?.type === 'error' && submissionMode === 'document' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5" />
                        <div>
                          <p className="text-red-700 font-medium">
                            {submitStatus.message || 'Failed to process document. Please try again.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
        </div>
      </div>
    </div>
    </div>
    </Layout>
  );
};

export default SubmitComplaint;
