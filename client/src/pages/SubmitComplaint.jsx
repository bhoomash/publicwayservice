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
  Search,
  TrendingUp,
  Loader2,
  Info,
  User,
  Calendar,
  Flag,
  Eye,
  ArrowRight,
  HelpCircle,
  Shield,
  Clock,
  FileCheck
} from 'lucide-react';

const SubmitComplaint = () => {
  // Submission Mode State
  const [submissionMode, setSubmissionMode] = useState('text'); // 'text' or 'document'
  
  // Initialize form data with auto-saved data if available
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('complaint-draft');
    return saved ? JSON.parse(saved) : {
      title: '',
      category: '',
      description: '',
      location: '',
      contactPhone: '',
      contactEmail: '',
      urgency: 'medium',
      attachments: []
    };
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
    { id: 'infrastructure', label: 'Infrastructure & Buildings', icon: '🏗️', dept: 'Public Works Department' },
    { id: 'utilities', label: 'Utilities (Water/Electricity)', icon: '⚡', dept: 'Utilities Department' },
    { id: 'roads', label: 'Roads & Transportation', icon: '🛣️', dept: 'Transport Department' },
    { id: 'safety', label: 'Public Safety & Security', icon: '🛡️', dept: 'Police Department' },
    { id: 'healthcare', label: 'Healthcare Services', icon: '🏥', dept: 'Health Department' },
    { id: 'education', label: 'Education & Schools', icon: '🎓', dept: 'Education Department' },
    { id: 'environment', label: 'Environmental Issues', icon: '🌿', dept: 'Environment Department' },
    { id: 'corruption', label: 'Corruption & Misconduct', icon: '⚖️', dept: 'Internal Affairs' },
    { id: 'administrative', label: 'Administrative Services', icon: '📋', dept: 'Administration' },
    { id: 'other', label: 'Other Issues', icon: '📝', dept: 'General Department' }
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
      const response = await ragAPI.analyzeComplaintText(
        formData.title, 
        formData.description, 
        category, 
        urgency,
        formData.location
      );
      
      setRagAnalysis(response);
      setSimilarComplaints(response.similar_complaints || []);
      setShowSuggestions(response.similar_complaints && response.similar_complaints.length > 0);
      
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
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description, formData.category, formData.urgency, analyzeComplaintText]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Add character limit validation for description
    if (name === 'description' && value.length > 500) {
      return;
    }
    
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);
    
    // Auto-save to localStorage
    localStorage.setItem('complaint-draft', JSON.stringify(newFormData));
  };

  // Document upload handler
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File validation
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setSubmitStatus({
        type: 'error',
        message: 'Invalid file type',
        detail: 'Please upload PDF, DOCX, or TXT files only.'
      });
      return;
    }

    if (file.size > maxSize) {
      setSubmitStatus({
        type: 'error',
        message: 'File too large',
        detail: 'Please upload files smaller than 10MB.'
      });
      return;
    }

    setIsExtracting(true);
    setUploadedDocument(file);

    try {
      const response = await ragAPI.uploadDocument(file);
      
      setExtractedData({
        title: response.summary || 'Extracted Complaint',
        description: response.summary || '',
        category: response.department ? getCategoryFromDepartment(response.department) : '',
        urgency: response.urgency ? response.urgency.toLowerCase() : 'medium',
        location: response.location || '',
        originalAnalysis: response
      });
      
      setShowConfirmation(true);
      
    } catch (error) {
      console.error('Document upload error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to process document',
        detail: error.response?.data?.detail || 'Please try again or use the text form.'
      });
      setUploadedDocument(null);
    } finally {
      setIsExtracting(false);
    }
  };

  // Helper function to map department to category
  const getCategoryFromDepartment = (department) => {
    const mapping = {
      'Transport Department': 'roads',
      'Public Works Department': 'infrastructure',
      'Health Department': 'healthcare',
      'Police Department': 'safety',
      'Education Department': 'education',
      'Environment Department': 'environment',
      'Utilities Department': 'utilities',
      'Water Department': 'utilities',
      'Electricity Department': 'utilities',
      'Sanitation Department': 'environment'
    };
    
    return Object.keys(mapping).find(key => 
      department.toLowerCase().includes(key.toLowerCase())
    ) ? mapping[Object.keys(mapping).find(key => 
      department.toLowerCase().includes(key.toLowerCase())
    )] : 'other';
  };

  // Use extracted data for form submission
  const useExtractedData = () => {
    if (extractedData) {
      setFormData(prev => ({
        ...prev,
        title: extractedData.title,
        description: extractedData.description,
        category: extractedData.category,
        urgency: extractedData.urgency,
        location: extractedData.location
      }));
      setSubmissionMode('text');
      setShowConfirmation(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = [];

    // Required field validation
    if (!formData.title?.trim()) errors.push('Title is required');
    if (!formData.description?.trim()) errors.push('Description is required');
    if (!formData.category) errors.push('Category is required');
    
    // Minimum length validation
    if (formData.description?.trim().length < 20) {
      errors.push('Description must be at least 20 characters long');
    }

    // Email validation
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.push('Please enter a valid email address');
    }

    // Phone validation
    if (formData.contactPhone && !/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,}$/.test(formData.contactPhone)) {
      errors.push('Please enter a valid phone number');
    }

    return errors;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fix the following issues:',
        detail: validationErrors.join(', ')
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await complaintsAPI.submitComplaint(formData);
      
      setSubmitStatus({
        type: 'success',
        complaintId: response.complaint_id,
        message: 'Complaint submitted successfully!',
        detail: 'You will receive updates via email and can track progress in My Complaints.'
      });

      // Reset form and clear auto-saved data
      const resetForm = {
        title: '',
        category: '',
        description: '',
        location: '',
        contactPhone: '',
        contactEmail: '',
        urgency: 'medium',
        attachments: []
      };
      setFormData(resetForm);
      localStorage.removeItem('complaint-draft');
      
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit complaint',
        detail: error.response?.data?.detail || 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.category);
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Layout title="Submit Complaint">
      <div className="max-w-7xl mx-auto">
        {/* Progress Indicator */}
        <div className="gov-card mb-6">
          <div className="gov-card-body py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 gov-bg-primary rounded-full flex items-center justify-center text-white font-medium text-xs">
                  1
                </div>
                <span className="font-medium gov-text-primary">Submit Details</span>
              </div>
              <div className="flex-1 mx-4 h-px gov-bg-light"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 gov-border rounded-full flex items-center justify-center gov-text-muted font-medium text-xs">
                  2
                </div>
                <span className="gov-text-muted">Review & Confirm</span>
              </div>
              <div className="flex-1 mx-4 h-px gov-bg-light"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 gov-border rounded-full flex items-center justify-center gov-text-muted font-medium text-xs">
                  3
                </div>
                <span className="gov-text-muted">Track Status</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submission Mode Toggle */}
            <div className="gov-card">
              <div className="gov-card-header">
                <h3 className="gov-card-title">Submission Method</h3>
                <p className="gov-card-subtitle">Choose how you'd like to submit your complaint</p>
              </div>
              <div className="gov-card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSubmissionMode('text')}
                    className={`p-4 rounded-lg gov-border text-left hover:gov-shadow ${
                      submissionMode === 'text' ? 'gov-bg-primary text-white border-transparent' : 'gov-bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText size={20} />
                      <div>
                        <h4 className="font-medium">Text Form</h4>
                        <p className="text-sm opacity-80">Fill out the complaint form manually</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionMode('document')}
                    className={`p-4 rounded-lg gov-border text-left hover:gov-shadow ${
                      submissionMode === 'document' ? 'gov-bg-primary text-white border-transparent' : 'gov-bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Upload size={20} />
                      <div>
                        <h4 className="font-medium">Document Upload</h4>
                        <p className="text-sm opacity-80">Upload PDF, DOCX, or text files</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {submissionMode === 'text' ? (
              /* TEXT FORM */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="gov-card">
                  <div className="gov-card-header">
                    <h3 className="gov-card-title flex items-center">
                      <Info size={18} className="mr-2" />
                      Basic Information
                    </h3>
                    <p className="gov-card-subtitle">Provide essential details about your complaint</p>
                  </div>
                  <div className="gov-card-body space-y-4">
                    {/* Title */}
                    <div className="gov-form-group">
                      <label className="gov-label">
                        Complaint Title <span className="gov-text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Brief summary of your complaint"
                        className={`gov-input ${
                          !formData.title?.trim() && formData.title !== '' ? 'border-red-300' : ''
                        }`}
                        required
                        aria-describedby="title-error"
                      />
                      {!formData.title?.trim() && formData.title !== '' && (
                        <p id="title-error" className="text-xs gov-text-danger mt-1">Title is required</p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="gov-form-group">
                      <label className="gov-label">
                        Category <span className="gov-text-danger">*</span>
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="gov-input gov-select"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                      {formData.category && (
                        <p className="text-xs gov-text-muted mt-1">
                          Will be routed to: {getSelectedCategory()?.dept}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="gov-form-group">
                      <label className="gov-label">
                        Detailed Description <span className="gov-text-danger">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Provide detailed information about the issue, including what happened, when, and any relevant circumstances..."
                        rows={6}
                        className={`gov-input ${
                          formData.description.length > 0 && formData.description.length < 20 
                            ? 'border-red-300' : ''
                        }`}
                        required
                        aria-describedby="description-error"
                      />
                      {formData.description.length > 0 && formData.description.length < 20 && (
                        <p id="description-error" className="text-xs gov-text-danger mt-1">
                          Description must be at least 20 characters long
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs gov-text-muted">
                          Minimum 20 characters required
                        </p>
                        <p className={`text-xs ${
                          formData.description.length > 450 ? 'gov-text-warning' : 
                          formData.description.length >= 500 ? 'gov-text-danger' : 'gov-text-muted'
                        }`}>
                          {formData.description.length}/500 characters
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location & Priority */}
                <div className="gov-card">
                  <div className="gov-card-header">
                    <h3 className="gov-card-title flex items-center">
                      <MapPin size={18} className="mr-2" />
                      Location & Priority
                    </h3>
                  </div>
                  <div className="gov-card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Location */}
                      <div className="gov-form-group">
                        <label className="gov-label">Location/Address</label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="Street address, landmark, or area"
                          className="gov-input"
                        />
                      </div>

                      {/* Urgency */}
                      <div className="gov-form-group">
                        <label className="gov-label">Priority Level</label>
                        <select
                          name="urgency"
                          value={formData.urgency}
                          onChange={handleInputChange}
                          className="gov-input gov-select"
                        >
                          <option value="low">🟢 Low - Routine matter</option>
                          <option value="medium">🟠 Medium - Needs attention</option>
                          <option value="high">🔴 High - Urgent issue</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="gov-card">
                  <div className="gov-card-header">
                    <h3 className="gov-card-title flex items-center">
                      <User size={18} className="mr-2" />
                      Contact Information
                    </h3>
                    <p className="gov-card-subtitle">Optional - for updates and follow-up</p>
                  </div>
                  <div className="gov-card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Phone */}
                      <div className="gov-form-group">
                        <label className="gov-label">
                          <Phone size={14} className="inline mr-1" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                          className={`gov-input ${
                            formData.contactPhone && !/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,}$/.test(formData.contactPhone)
                              ? 'border-red-300 focus:border-red-500' : ''
                          }`}
                        />
                        {formData.contactPhone && !/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,}$/.test(formData.contactPhone) && (
                          <p className="text-xs gov-text-danger mt-1">Please enter a valid phone number</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="gov-form-group">
                        <label className="gov-label">
                          <Mail size={14} className="inline mr-1" />
                          Email Address
                        </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className={`gov-input ${
                          formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail) 
                            ? 'border-red-300 focus:border-red-500' : ''
                        }`}
                      />
                      {formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail) && (
                        <p className="text-xs gov-text-danger mt-1">Please enter a valid email address</p>
                      )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="gov-card">
                  <div className="gov-card-body">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm gov-text-muted">
                          <p className="flex items-center">
                            <Shield size={14} className="mr-1" />
                            Your information is secure and confidential
                          </p>
                        </div>
                        {localStorage.getItem('complaint-draft') && (
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.removeItem('complaint-draft');
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
                            }}
                            className="gov-btn gov-btn-outline gov-btn-sm"
                          >
                            Clear Draft
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.title || !formData.description}
                        className="gov-btn gov-btn-primary gov-btn-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FileCheck size={18} />
                            Submit Complaint
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* DOCUMENT UPLOAD */
              <div className="gov-card">
                <div className="gov-card-header">
                  <h3 className="gov-card-title flex items-center">
                    <Upload size={18} className="mr-2" />
                    Document Upload
                  </h3>
                  <p className="gov-card-subtitle">Upload PDF, DOCX, or text files for automatic processing</p>
                </div>
                <div className="gov-card-body">
                  <div className="text-center py-12">
                    <Upload size={48} className="mx-auto gov-text-muted mb-4" />
                    <h4 className="text-lg font-medium gov-text-primary mb-2">Upload Your Document</h4>
                    <p className="gov-text-muted mb-6">
                      Drag and drop or click to select files (PDF, DOCX, TXT)
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      id="document-upload"
                      onChange={handleDocumentUpload}
                    />
                    <label
                      htmlFor="document-upload"
                      className="gov-btn gov-btn-outline gov-btn-lg cursor-pointer"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Choose File'
                      )}
                    </label>
                    {uploadedDocument && (
                      <div className="mt-4 p-3 gov-bg-light rounded">
                        <p className="text-sm gov-text-primary font-medium">
                          📄 {uploadedDocument.name}
                        </p>
                        <p className="text-xs gov-text-muted">
                          {(uploadedDocument.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Analysis */}
            {(isAnalyzing || aiInsights) && (
              <div className="gov-card">
                <div className="gov-card-header">
                  <h3 className="gov-card-title text-sm flex items-center">
                    <Search size={16} className="mr-2" />
                    AI Analysis
                    {isAnalyzing && <Loader2 size={14} className="ml-2 animate-spin" />}
                  </h3>
                </div>
                <div className="gov-card-body">
                  {aiInsights && (
                    <div className={`p-3 rounded ${aiInsights.error ? 'gov-bg-light gov-text-muted' : 
                      aiInsights.hasSimilar ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                      <p className="text-sm font-medium mb-1">{aiInsights.message}</p>
                      <p className="text-xs opacity-80">{aiInsights.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Similar Complaints */}
            {similarComplaints.length > 0 && (
              <div className="gov-card">
                <div className="gov-card-header">
                  <h3 className="gov-card-title text-sm flex items-center">
                    <TrendingUp size={16} className="mr-2" />
                    Similar Cases Found ({similarComplaints.length})
                  </h3>
                </div>
                <div className="gov-card-body space-y-3">
                  {similarComplaints.slice(0, 3).map((complaint, index) => (
                    <div key={index} className="p-3 gov-bg-light rounded">
                      <h4 className="text-sm font-medium gov-text-primary mb-1">
                        {complaint.title || 'Complaint'}
                      </h4>
                      <p className="text-xs gov-text-muted mb-2">
                        {complaint.summary || complaint.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="gov-text-muted">
                          Similarity: {Math.round((complaint.similarity || 0) * 100)}%
                        </span>
                        <button className="gov-text-primary hover:underline flex items-center">
                          <Eye size={12} className="mr-1" />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help & Guidelines */}
            <div className="gov-card">
              <div className="gov-card-header">
                <h3 className="gov-card-title text-sm flex items-center">
                  <HelpCircle size={16} className="mr-2" />
                  Submission Guidelines
                </h3>
              </div>
              <div className="gov-card-body text-sm space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle size={14} className="gov-text-success mt-0.5 flex-shrink-0" />
                  <p className="gov-text-muted">Be specific and provide clear details</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle size={14} className="gov-text-success mt-0.5 flex-shrink-0" />
                  <p className="gov-text-muted">Include location information when relevant</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle size={14} className="gov-text-success mt-0.5 flex-shrink-0" />
                  <p className="gov-text-muted">Select appropriate priority level</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="gov-text-muted">Expected response: 1-3 business days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Confirmation Dialog */}
        {showConfirmation && extractedData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="gov-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="gov-card-header">
                <h3 className="gov-card-title flex items-center">
                  <FileCheck size={20} className="mr-2" />
                  Document Processed Successfully
                </h3>
                <p className="gov-card-subtitle">Review the extracted information and proceed</p>
              </div>
              <div className="gov-card-body space-y-4">
                <div className="gov-alert gov-alert-info">
                  <Info size={16} className="mr-2" />
                  AI has extracted the following information from your document. You can edit this before submission.
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="gov-label">Extracted Title</label>
                    <div className="gov-input p-3 gov-bg-light">
                      {extractedData.title}
                    </div>
                  </div>
                  
                  <div>
                    <label className="gov-label">Extracted Description</label>
                    <div className="gov-input p-3 gov-bg-light max-h-32 overflow-y-auto">
                      {extractedData.description}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="gov-label">Category</label>
                      <div className="gov-input p-3 gov-bg-light">
                        {categories.find(c => c.id === extractedData.category)?.label || 'Other'}
                      </div>
                    </div>
                    <div>
                      <label className="gov-label">Priority</label>
                      <div className="gov-input p-3 gov-bg-light">
                        {extractedData.urgency?.charAt(0).toUpperCase() + extractedData.urgency?.slice(1)}
                      </div>
                    </div>
                  </div>
                  
                  {extractedData.location && (
                    <div>
                      <label className="gov-label">Location</label>
                      <div className="gov-input p-3 gov-bg-light">
                        {extractedData.location}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="gov-card-footer flex justify-between">
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setUploadedDocument(null);
                    setExtractedData(null);
                  }}
                  className="gov-btn gov-btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={useExtractedData}
                  className="gov-btn gov-btn-primary"
                >
                  <ArrowRight size={16} />
                  Use This Information
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {submitStatus && (
          <div className={`fixed bottom-6 right-6 max-w-md gov-card gov-shadow-lg z-40 ${
            submitStatus.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
          }`}>
            <div className="gov-card-body">
              <div className="flex items-start space-x-3">
                {submitStatus.type === 'success' ? (
                  <CheckCircle size={20} className="gov-text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="gov-text-danger flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium gov-text-primary">{submitStatus.message}</h4>
                  {submitStatus.detail && (
                    <p className="text-sm gov-text-muted mt-1">{submitStatus.detail}</p>
                  )}
                  {submitStatus.complaintId && (
                    <p className="text-sm gov-text-primary mt-2 font-mono">
                      ID: {submitStatus.complaintId}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => setSubmitStatus(null)}
                  className="gov-text-muted hover:gov-text-primary"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubmitComplaint;