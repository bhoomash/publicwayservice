import React, { useState } from 'react';
import Layout from '../components/Layout';
import { 
  FileText, 
  Upload, 
  MapPin, 
  Phone, 
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const SubmitComplaint = () => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // TODO: Implement API call to submit complaint
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSubmitStatus('success');
      // Reset form
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
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    const mockAISummary = {
      complaintId: `CMP${Date.now().toString().slice(-6)}`,
      category: formData.category || 'General',
      priorityScore: Math.floor(Math.random() * 40) + 60, // 60-100
      assignedDepartment: formData.category === 'Infrastructure' ? 'Municipal Corporation - Infrastructure' :
                         formData.category === 'Utilities' ? 'Water & Power Department' :
                         formData.category === 'Environmental' ? 'Environmental Compliance Division' :
                         'General Administration',
      estimatedResolution: formData.urgency === 'high' ? '24-48 hours' :
                          formData.urgency === 'medium' ? '3-5 business days' :
                          '5-10 business days',
      aiRecommendation: 'Your complaint has been analyzed and categorized automatically. The AI system has assigned a priority score based on urgency, impact, and resource availability.'
    };

    return (
      <Layout title="Complaint Submitted">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Complaint Submitted Successfully!</h2>
              <p className="text-gray-600">
                Your complaint has been processed by our AI system and assigned for review.
              </p>
            </div>

            {/* AI Processing Results */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-bold">AI</span>
                </span>
                AI Analysis Complete
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">{mockAISummary.complaintId}</div>
                  <div className="text-sm text-gray-600">Complaint ID</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600">{mockAISummary.priorityScore}</div>
                  <div className="text-sm text-gray-600">Priority Score</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="text-gray-600">{mockAISummary.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Assigned Department:</span>
                  <span className="text-gray-600">{mockAISummary.assignedDepartment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Estimated Resolution:</span>
                  <span className="text-gray-600">{mockAISummary.estimatedResolution}</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">{mockAISummary.aiRecommendation}</p>
              </div>
            </div>

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <FileText size={24} className="text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Submit New Complaint</h2>
                <p className="text-sm text-gray-600">Fill out the form below to submit your grievance</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of your complaint"
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low - Can wait a few days</option>
                  <option value="medium">Medium - Should be addressed soon</option>
                  <option value="high">High - Needs urgent attention</option>
                  <option value="urgent">Urgent - Immediate action required</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select urgency based on severity and impact
                </p>
              </div>
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
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide detailed information about your complaint..."
              />
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

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload size={16} className="inline mr-1" />
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF up to 10MB each
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  Select Files
                </label>
              </div>

              {/* Uploaded Files */}
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={20} className="text-red-600 mr-3" />
                <p className="text-red-700">
                  Failed to submit complaint. Please try again.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing with AI...
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SubmitComplaint;
