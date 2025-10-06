import React, { useState, useEffect } from 'react';
import { complaintsAPI, ragAPI } from '../utils/api';
import { 
  Upload, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  Check, 
  FileText, 
  Image, 
  File,
  X,
  Search,
  Loader
} from 'lucide-react';

const EnhancedComplaintForm = ({ onSubmitSuccess }) => {
  const [submitMode, setSubmitMode] = useState('text'); // 'text' or 'document'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    urgency: 'Medium',
    date_occurred: '',
    phone: '',
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [similarComplaints, setSimilarComplaints] = useState([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [searchingSimilar, setSearchingSimilar] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitResult, setSubmitResult] = useState(null);

  const categories = [
    'Infrastructure',
    'Public Safety',
    'Healthcare',
    'Education',
    'Environmental',
    'Transportation',
    'Utilities',
    'Administrative',
    'Corruption',
    'Other'
  ];

  const urgencyLevels = ['Low', 'Medium', 'High'];

  // Debounced search for similar complaints
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title && formData.description && formData.description.length > 20) {
        searchForSimilar();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description]);

  const searchForSimilar = async () => {
    try {
      setSearchingSimilar(true);
      const result = await ragAPI.analyzeComplaintText(
        formData.title,
        formData.description,
        formData.category,
        formData.urgency,
        formData.location
      );
      
      if (result.similar_complaints && result.similar_complaints.length > 0) {
        setSimilarComplaints(result.similar_complaints);
        setShowSimilar(true);
      }
    } catch (error) {
      console.error('Error searching similar complaints:', error);
    } finally {
      setSearchingSimilar(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];

    if (file.size > maxSize) {
      setErrors({ file: 'File size must be less than 10MB' });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors({ file: 'Only PDF, DOCX, TXT, JPG, and PNG files are allowed' });
      return;
    }

    setUploadFile(file);
    setErrors({ file: '' });
  };

  const removeFile = () => {
    setUploadFile(null);
    setUploadProgress(0);
  };

  const validateForm = () => {
    const newErrors = {};

    if (submitMode === 'text') {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formData.description.length < 20) {
        newErrors.description = 'Description must be at least 20 characters';
      }

      if (!formData.category) {
        newErrors.category = 'Category is required';
      }
    } else {
      if (!uploadFile) {
        newErrors.file = 'Please upload a document';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTextSubmit = async () => {
    try {
      const response = await complaintsAPI.submitComplaint(formData);
      setSubmitResult(response);
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        urgency: 'Medium',
        date_occurred: '',
        phone: '',
      });
      setSimilarComplaints([]);
      
      if (onSubmitSuccess) {
        onSubmitSuccess(response);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setErrors({ submit: error.response?.data?.detail || 'Failed to submit complaint' });
    }
  };

  const handleDocumentSubmit = async () => {
    try {
      const response = await ragAPI.uploadDocument(uploadFile, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      setSubmitResult(response);
      setSubmitStatus('success');
      
      // Reset form
      setUploadFile(null);
      setUploadProgress(0);
      
      if (onSubmitSuccess) {
        onSubmitSuccess(response);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setSubmitStatus('error');
      setErrors({ submit: error.response?.data?.detail || 'Failed to upload document' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrors({});

    try {
      if (submitMode === 'text') {
        await handleTextSubmit();
      } else {
        await handleDocumentSubmit();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (file) => {
    if (!file) return <File className="h-8 w-8" />;
    
    if (file.type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (file.type.includes('image')) return <Image className="h-8 w-8 text-blue-500" />;
    if (file.type.includes('word') || file.type.includes('document')) 
      return <FileText className="h-8 w-8 text-blue-600" />;
    return <File className="h-8 w-8" />;
  };

  if (submitStatus === 'success' && submitResult) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-500 rounded-full p-2 mr-3">
              <Check className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-green-900">
              Complaint Submitted Successfully!
            </h3>
          </div>
          
          <div className="space-y-3 mb-6">
            <p className="text-gray-700">
              <span className="font-semibold">Complaint ID:</span> {submitResult.complaint_id || 'Processing...'}
            </p>
            {submitResult.summary && (
              <p className="text-gray-700">
                <span className="font-semibold">Summary:</span> {submitResult.summary}
              </p>
            )}
            {submitResult.urgency && (
              <p className="text-gray-700">
                <span className="font-semibold">Priority:</span>{' '}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
                  submitResult.urgency === 'High' ? 'bg-red-100 text-red-800' :
                  submitResult.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {submitResult.emoji} {submitResult.urgency}
                </span>
              </p>
            )}
            {submitResult.department && (
              <p className="text-gray-700">
                <span className="font-semibold">Assigned To:</span> {submitResult.department}
              </p>
            )}
          </div>
          
          <button
            onClick={() => {
              setSubmitStatus(null);
              setSubmitResult(null);
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Complaint</h2>
        
        {/* Mode Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSubmitMode('text')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              submitMode === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="inline h-5 w-5 mr-2" />
            Text Complaint
          </button>
          <button
            onClick={() => setSubmitMode('document')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              submitMode === 'document'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Upload className="inline h-5 w-5 mr-2" />
            Upload Document
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {submitMode === 'text' ? (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complaint Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Brief title of your complaint"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="6"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your complaint in detail..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                {searchingSimilar && (
                  <p className="mt-2 text-sm text-blue-600 flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Searching for similar complaints...
                  </p>
                )}
              </div>

              {/* Category and Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {urgencyLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Address or landmark"
                />
              </div>

              {/* Similar Complaints Alert */}
              {showSimilar && similarComplaints.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-2">
                        Similar complaints found
                      </h4>
                      <p className="text-sm text-yellow-800 mb-3">
                        We found {similarComplaints.length} similar complaint(s). You may want to check if your issue has been reported:
                      </p>
                      <div className="space-y-2">
                        {similarComplaints.slice(0, 3).map((complaint, idx) => (
                          <div key={idx} className="bg-white rounded p-2 text-sm">
                            <p className="font-medium">{complaint.summary}</p>
                            <p className="text-gray-600 text-xs mt-1">
                              {complaint.department} • {complaint.urgency} • 
                              Similarity: {Math.round(complaint.similarity_score * 100)}%
                            </p>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSimilar(false)}
                        className="text-sm text-yellow-700 hover:text-yellow-900 mt-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Document *
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a PDF, DOCX, image, or text file describing your complaint. 
                  Our AI will automatically extract and classify the information.
                </p>
                
                {!uploadFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PDF, DOCX, TXT, JPG, PNG (max 10MB)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(uploadFile)}
                        <div>
                          <p className="font-medium text-gray-900">{uploadFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-3">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1 text-center">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {errors.file && (
                  <p className="mt-2 text-sm text-red-600">{errors.file}</p>
                )}
              </div>
            </>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                {submitMode === 'document' ? 'Uploading and Processing...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Submit Complaint
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EnhancedComplaintForm;
