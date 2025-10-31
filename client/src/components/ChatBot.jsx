import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: 'Hello! I\'m your Government Portal AI Assistant. I can help you with:\n\n• Filing complaints\n• Tracking complaint status\n• Answering questions about services\n• Providing guidance on procedures\n\nHow can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      // Get auth token
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please login to use the AI assistant');
      }

      // Call the chat API
      const response = await axios.post(
        `${API_URL}/chat/message`,
        { message: currentInput },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        message: response.data.ai_response || 'I received your message. How else can I help?',
        timestamp: new Date(response.data.timestamp || new Date())
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. ';
      
      if (error.message.includes('login')) {
        errorMessage += 'Please login to use the AI assistant.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Your session has expired. Please login again.';
      } else {
        errorMessage += 'Please try again or contact support if the issue persists.';
      }
      
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        message: errorMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
      setError(error.message);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    'How do I track my complaint status?',
    'I want to file a new complaint',
    'What is the average resolution time?',
    'How do I contact support?'
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
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            ?
          </span>
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
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-blue-100">Powered by Gemini AI</p>
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
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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
            ))}
            
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
            <div ref={messagesEndRef} />
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

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
