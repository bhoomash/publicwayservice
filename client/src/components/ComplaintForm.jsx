import { useState } from 'react';
import { complaintsAPI } from '../utils/api';
import { Upload, MapPin, Calendar, AlertCircle, Check } from 'lucide-react';

const ComplaintForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    date_occurred: '',
    phone: '',
    attachments: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const categories = [
    'Public Health',
    'Infrastructure',
    'Traffic & Transportation',
    'Water & Sanitation',
    'Electricity',
    'Environment',
    'Public Safety',
    'Education',
    'Healthcare',
    'Housing',
    'Corruption',
    'Administrative Issues',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = [];
    const fileErrors = [];

    files.forEach(file => {
      if (file.size > maxSize) {
        fileErrors.push(`${file.name} is too large (max 5MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (fileErrors.length > 0) {
      setErrors(prev => ({
        ...prev,
        attachments: fileErrors.join(', ')
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        attachments: ''
      }));
    }

    setFormData(prev => ({
      ...prev,
      attachments: validFiles
    }));
  };

  const validateForm = () => {
    const newErrors = {};

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

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.date_occurred) {
      newErrors.date_occurred = 'Date of occurrence is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'attachments') {
          formData.attachments.forEach(file => {
            submitData.append('attachments', file);
          });
        } else {
          submitData.append(key, formData[key]);
        }
      });

      const result = await complaintsAPI.submitComplaint(submitData);
      
      setSubmitStatus({
        type: 'success',
        message: `Complaint submitted successfully! Complaint ID: ${result.id}`,
        complaintId: result.id
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        date_occurred: '',
        phone: '',
        attachments: [],
      });

      // Clear file input
      const fileInput = document.getElementById('attachments');
      if (fileInput) fileInput.value = '';

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }

    } catch (error) {
      console.error('Error submitting complaint:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to submit complaint. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Submit a Complaint</h2>
        <p className="text-gray-600">
          Please provide detailed information about your complaint. All fields marked with * are required.
        </p>
      </div>

      {submitStatus && (
        <div className={`mb-6 p-4 rounded-lg border ${
          submitStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            {submitStatus.type === 'success' ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{submitStatus.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Brief summary of your complaint"
            maxLength={200}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={6}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Provide a detailed description of the issue, including what happened, when, and any other relevant information..."
            maxLength={2000}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.description.length}/2000 characters
            </p>
          </div>
        </div>

        {/* Location and Date Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Main Street, City Center, Ward 5"
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>

          {/* Date Occurred */}
          <div>
            <label htmlFor="date_occurred" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date of Occurrence *
            </label>
            <input
              type="date"
              id="date_occurred"
              name="date_occurred"
              value={formData.date_occurred}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date_occurred ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date_occurred && <p className="mt-1 text-sm text-red-600">{errors.date_occurred}</p>}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Your contact number"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        {/* File Attachments */}
        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
            <Upload className="inline h-4 w-4 mr-1" />
            Attachments (Optional)
          </label>
          <input
            type="file"
            id="attachments"
            name="attachments"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.attachments ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <p className="mt-1 text-sm text-gray-500">
            You can upload images, documents (PDF, DOC, DOCX). Max file size: 5MB each.
          </p>
          {errors.attachments && <p className="mt-1 text-sm text-red-600">{errors.attachments}</p>}
          
          {formData.attachments.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Selected files:</p>
              <ul className="mt-1 text-sm text-gray-600">
                {formData.attachments.map((file, index) => (
                  <li key={index} className="flex items-center">
                    <span className="truncate">{file.name}</span>
                    <span className="ml-2 text-gray-400">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit Complaint'
            )}
          </button>
        </div>
      </form>

      {/* Information Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your complaint will be automatically categorized and assigned a priority level</li>
          <li>• You'll receive a unique complaint ID for tracking</li>
          <li>• A relevant department will be assigned to handle your case</li>
          <li>• You'll get notifications about status updates via email and in your dashboard</li>
          <li>• Expected response time varies by category and urgency level</li>
        </ul>
      </div>
    </div>
  );
};

export default ComplaintForm;
