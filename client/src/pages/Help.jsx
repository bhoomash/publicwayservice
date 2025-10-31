import React, { useState } from 'react';
import Layout from '../components/Layout';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle
} from 'lucide-react';

const Help = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I submit a complaint?',
      answer: 'To submit a complaint, navigate to the "Submit Complaint" section from the sidebar. Fill out the required information including title, category, description, and location. You can also attach supporting documents. Once submitted, you\'ll receive a complaint ID for tracking.'
    },
    {
      id: 2,
      category: 'Account & Login',
      question: 'I forgot my password. How can I reset it?',
      answer: 'Click on "Forgot Password" on the login page. Enter your registered email address, and you\'ll receive an OTP to reset your password. Follow the instructions in the email to create a new password.'
    },
    {
      id: 3,
      category: 'Complaint Tracking',
      question: 'How can I track the status of my complaint?',
      answer: 'Visit the "My Complaints" section to view all your submitted complaints. Each complaint shows its current status (Pending, In Progress, or Resolved) along with updates and estimated resolution time.'
    },
    {
      id: 4,
      category: 'Account & Login',
      question: 'How do I create a new account?',
      answer: 'Click on "Register" from the login page. Fill in your personal details including name, email, and phone number. You\'ll receive an OTP via email for verification. Once verified, your account will be active.'
    },
    {
      id: 5,
      category: 'Complaint Process',
      question: 'What types of complaints can I submit?',
      answer: 'You can submit complaints related to Infrastructure, Utilities (Water/Electricity), Roads & Transportation, Public Safety, Healthcare, Education, Environmental issues, Corruption, Administrative matters, and other government services.'
    },
    {
      id: 6,
      category: 'Complaint Process',
      question: 'How long does it take to resolve a complaint?',
      answer: 'Resolution time varies depending on the type and complexity of the complaint. Most infrastructure issues are resolved within 5-7 business days, while administrative matters may take 10-15 business days. You\'ll see estimated resolution time for each complaint.'
    },

    {
      id: 8,
      category: 'Complaint Process',
      question: 'Can I attach files to my complaint?',
      answer: 'Yes, you can attach supporting documents, images, or videos to your complaint. Supported formats include PNG, JPG, PDF with a maximum size of 10MB per file. These attachments help us better understand and resolve your issue.'
    },
    {
      id: 9,
      category: 'Privacy & Security',
      question: 'How is my personal information protected?',
      answer: 'We take privacy seriously. Your personal information is encrypted and stored securely. We only use your information to process complaints and communicate updates. We never share your data with third parties without consent.'
    },
    {
      id: 10,
      category: 'Technical Support',
      question: 'The website is not working properly. What should I do?',
      answer: 'Try refreshing the page or clearing your browser cache. Ensure you\'re using a supported browser (Chrome, Firefox, Safari, Edge). If problems persist, try logging out and logging back in, or contact our technical support team.'
    }
  ];

  const categories = [...new Set(faqs.map(faq => faq.category))];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone Support',
      details: '+1-800-GOV-HELP (468-4357)',
      description: 'Monday to Friday, 9:00 AM - 6:00 PM'
    },
    {
      icon: Mail,
      title: 'Email Support',
      details: 'support@govportal.gov',
      description: 'Response within 24 hours'
    },
    {
      icon: MapPin,
      title: 'Office Address',
      details: '123 Government Plaza, City Hall',
      description: 'Suite 456, Capital City, ST 12345'
    },
    {
      icon: Clock,
      title: 'Office Hours',
      details: 'Monday - Friday: 9:00 AM - 5:00 PM',
      description: 'Closed on weekends and holidays'
    }
  ];

  return (
    <Layout title="Help & FAQs">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
          <div className="flex items-center mb-4">
            <HelpCircle size={32} className="mr-3" />
            <h1 className="text-3xl font-bold">Help & Support</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help topics, questions, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'} found
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredFaqs.length === 0 ? (
                  <div className="p-8 text-center">
                    <HelpCircle size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No results found</h3>
                    <p className="text-gray-500">
                      Try adjusting your search terms or browse our categories below.
                    </p>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => (
                    <div key={faq.id} className="p-6">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full text-left focus:outline-none"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-2">
                              {faq.category}
                            </span>
                            <h3 className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors">
                              {faq.question}
                            </h3>
                          </div>
                          <div className="ml-4">
                            {expandedFaq === faq.id ? (
                              <ChevronUp size={20} className="text-gray-500" />
                            ) : (
                              <ChevronDown size={20} className="text-gray-500" />
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {expandedFaq === faq.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Categories */}
            {searchTerm === '' && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Browse by Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map((category) => {
                    const categoryCount = faqs.filter(faq => faq.category === category).length;
                    return (
                      <button
                        key={category}
                        onClick={() => setSearchTerm(category)}
                        className="flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <span className="font-medium text-gray-700">{category}</span>
                        <span className="text-sm text-gray-500">{categoryCount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MessageCircle size={20} className="mr-2 text-blue-600" />
                Contact Support
              </h3>
              <p className="text-gray-600 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              
              <div className="space-y-4">
                {contactInfo.map((contact, index) => {
                  const IconComponent = contact.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <IconComponent size={20} className="text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">{contact.title}</h4>
                        <p className="text-sm text-gray-700">{contact.details}</p>
                        <p className="text-xs text-gray-500">{contact.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
                  <h4 className="font-medium text-blue-800">Submit a Complaint</h4>
                  <p className="text-sm text-blue-600">File a new grievance</p>
                </button>
                
                <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
                  <h4 className="font-medium text-green-800">Track Complaint</h4>
                  <p className="text-sm text-green-600">Check complaint status</p>
                </button>
                
                <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
                  <h4 className="font-medium text-purple-800">Update Profile</h4>
                  <p className="text-sm text-purple-600">Manage your account</p>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">All Systems Operational</span>
              </div>
              <p className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Help;
