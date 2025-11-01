import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, User, FileText, CheckCircle, Loader2 } from 'lucide-react';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: 'Hello! I\'m Public Way Service Assistant. I can help you with complaint submissions, status tracking, and general guidance. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [complaintForm, setComplaintForm] = useState(null);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // API call to send message
  const sendMessageToAPI = async (message) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        ai_response: "I'm having trouble connecting right now. Please try again or visit the complaint form directly.",
        has_complaint_form: false
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await sendMessageToAPI(currentMessage);
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        message: response.ai_response,
        timestamp: new Date(),
        hasComplaintForm: response.has_complaint_form,
        complaintData: response.complaint_form_data
      };

      setMessages(prev => [...prev, botResponse]);
      
      // If AI detected a potential complaint, show the guided form
      if (response.has_complaint_form && response.complaint_form_data) {
        setComplaintForm({
          detected_description: response.complaint_form_data.detected_description || currentMessage,
          suggested_category: response.complaint_form_data.suggested_category || 'Other',
          step: 'confirm',
          data: {}
        });
      }
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        message: "I'm having trouble connecting right now. Please try again or visit the complaint form directly.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleStartGuidedComplaint = () => {
    setComplaintForm({
      step: 'title',
      data: complaintForm?.detected_description ? { description: complaintForm.detected_description } : {}
    });
    
    const botMessage = {
      id: Date.now(),
      type: 'bot',
      message: "Great! Let's submit your complaint step by step. First, please provide a brief title for your complaint:",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleComplaintFormInput = (value) => {
    if (!complaintForm) return;

    const newData = { ...complaintForm.data };
    
    switch (complaintForm.step) {
      case 'title':
        newData.title = value;
        setComplaintForm({ ...complaintForm, data: newData, step: 'description' });
        addBotMessage("Perfect! Now please provide a detailed description of the issue:");
        break;
      case 'description':
        newData.description = value;
        setComplaintForm({ ...complaintForm, data: newData, step: 'category' });
        addBotMessage("Thank you! Please select a category for your complaint:", true, [
          'Infrastructure', 'Public Safety', 'Healthcare', 'Education', 
          'Environment', 'Transportation', 'Water & Sanitation', 
          'Electricity', 'Administrative', 'Corruption', 'Other'
        ]);
        break;
      case 'category':
        newData.category = value;
        setComplaintForm({ ...complaintForm, data: newData, step: 'location' });
        addBotMessage("Got it! Where did this issue occur? Please provide the location:");
        break;
      case 'location':
        newData.location = value;
        setComplaintForm({ ...complaintForm, data: newData, step: 'urgency' });
        addBotMessage("Almost done! How urgent is this issue?", true, [
          'Low (Non-urgent)', 'Medium (Moderate)', 'High (Urgent)', 'Critical (Emergency)'
        ]);
        break;
      case 'urgency':
        newData.urgency = value.split(' ')[0].toLowerCase(); // Extract just the urgency level
        setComplaintForm({ ...complaintForm, data: newData, step: 'review' });
        showComplaintReview(newData);
        break;
    }
  };

  const addBotMessage = (message, hasOptions = false, options = []) => {
    const botMessage = {
      id: Date.now(),
      type: 'bot',
      message,
      timestamp: new Date(),
      hasOptions,
      options
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const showComplaintReview = (data) => {
    const reviewMessage = `Perfect! Here's your complaint summary:

📋 **Title**: ${data.title}
📝 **Description**: ${data.description}
🏷️ **Category**: ${data.category}
📍 **Location**: ${data.location}
⚡ **Urgency**: ${data.urgency}

Would you like to submit this complaint?`;

    addBotMessage(reviewMessage, true, ['✅ Submit Complaint', '✏️ Edit Details', '❌ Cancel']);
  };

  const submitGuidedComplaint = async () => {
    if (!complaintForm?.data) return;
    
    setIsSubmittingComplaint(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat/submit-guided-complaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ complaint_data: complaintForm.data })
      });

      if (!response.ok) {
        throw new Error('Failed to submit complaint');
      }

      const result = await response.json();
      
      addBotMessage(`🎉 **Complaint Submitted Successfully!**

**Complaint ID**: ${result.complaint_id}
**Status**: Pending Review
**Estimated Resolution**: ${result.ai_analysis?.estimated_resolution || '5-7 business days'}

Your complaint has been automatically assigned to the **${result.rag_analysis?.department || 'appropriate department'}** and will be processed according to its priority level.

You can track the progress in your "My Complaints" section. You'll receive email updates as progress is made.

Is there anything else I can help you with?`);

      setComplaintForm(null);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      addBotMessage("Sorry, there was an error submitting your complaint. Please try again or use the complaint form in the sidebar.");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleOptionClick = (option) => {
    // Add user's selection as a message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: option,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Handle the option based on current context
    if (complaintForm) {
      if (option === '✅ Submit Complaint') {
        submitGuidedComplaint();
      } else if (option === '✏️ Edit Details') {
        setComplaintForm({ ...complaintForm, step: 'title' });
        addBotMessage("Let's start over. Please provide a title for your complaint:");
      } else if (option === '❌ Cancel') {
        setComplaintForm(null);
        addBotMessage("No problem! Your complaint was not submitted. Is there anything else I can help you with?");
      } else if (complaintForm.step === 'category' || complaintForm.step === 'urgency') {
        handleComplaintFormInput(option);
      }
    } else if (option === 'Start Guided Complaint') {
      handleStartGuidedComplaint();
    }
  };

  const handleFormSubmit = () => {
    if (complaintForm && complaintForm.step !== 'review') {
      handleComplaintFormInput(inputMessage);
      setInputMessage('');
    } else {
      handleSendMessage();
    }
  };

  const quickQuestions = [
    'How do I track my complaint?',
    'How long does resolution take?',
    'How to submit a complaint?',
    'Contact support'
  ];

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-105"
        >
          <MessageCircle size={24} className="text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <div>
                <h3 className="font-semibold">Public Way Service Assistant</h3>
                <p className="text-xs text-blue-100">Smart complaint submission</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      {message.type === 'user' ? (
                        <User size={16} className="text-white" />
                      ) : (
                        <Bot size={16} className="text-gray-600" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick action buttons for complaint detection */}
                {message.hasComplaintForm && (
                  <div className="mt-2 ml-10">
                    <button
                      onClick={handleStartGuidedComplaint}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2"
                    >
                      <FileText size={16} />
                      <span>Start Guided Complaint</span>
                    </button>
                  </div>
                )}

                {/* Option buttons */}
                {message.hasOptions && message.options && (
                  <div className="mt-2 ml-10 space-y-1">
                    {message.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(option)}
                        disabled={isSubmittingComplaint}
                        className="block w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded text-sm transition-colors disabled:opacity-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot size={16} className="text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submitting indicator */}
            {isSubmittingComplaint && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot size={16} className="text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Submitting your complaint...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="space-y-1">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="w-full text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Complaint form status */}
          {complaintForm && (
            <div className="px-4 py-2 bg-green-50 border-t border-green-200">
              <div className="flex items-center space-x-2">
                <FileText size={16} className="text-green-600" />
                <span className="text-sm text-green-800">
                  Guided Complaint: {complaintForm.step === 'review' ? 'Review' : `Step ${['title', 'description', 'category', 'location', 'urgency'].indexOf(complaintForm.step) + 1}/5`}
                </span>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFormSubmit()}
                placeholder={
                  complaintForm && complaintForm.step !== 'review'
                    ? `Enter ${complaintForm.step}...`
                    : "Type your message..."
                }
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isSubmittingComplaint}
              />
              <button
                onClick={handleFormSubmit}
                disabled={!inputMessage.trim() || isSubmittingComplaint}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingComplaint ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;