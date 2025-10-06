import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API functions
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Verify email with OTP
  verifyEmail: async (email, otpCode) => {
    const response = await api.post('/auth/verify-email', {
      email,
      otp_code: otpCode,
    });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login-json', {
      email,
      password,
    });
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (email, otpCode, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      email,
      otp_code: otpCode,
      new_password: newPassword,
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  // Get account settings
  getAccountSettings: async () => {
    const response = await api.get('/auth/settings');
    return response.data;
  },

  // Update notification settings
  updateNotificationSettings: async (notifications) => {
    const response = await api.put('/auth/settings/notifications', notifications);
    return response.data;
  },

  // Update privacy settings
  updatePrivacySettings: async (privacy) => {
    const response = await api.put('/auth/settings/privacy', privacy);
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/auth/account');
    return response.data;
  },
};

// Complaints API functions
export const complaintsAPI = {
  // Submit new complaint
  submitComplaint: async (complaintData) => {
    const response = await api.post('/complaints/new', complaintData);
    return response.data;
  },

  // Get user's complaints
  getMyComplaints: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    
    const response = await api.get(`/complaints/my-complaints?${params}`);
    return response.data;
  },

  // Get complaint details
  getComplaintDetails: async (complaintId) => {
    const response = await api.get(`/complaints/${complaintId}`);
    return response.data;
  },

  // Update complaint status (admin only)
  updateComplaintStatus: async (complaintId, updates) => {
    const response = await api.put(`/complaints/${complaintId}/status`, updates);
    return response.data;
  },

  // Delete complaint
  deleteComplaint: async (complaintId) => {
    const response = await api.delete(`/complaints/${complaintId}`);
    return response.data;
  },

  // Get all complaints (collector/admin)
  getAllComplaints: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.urgency) params.append('urgency', filters.urgency);
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    
    const response = await api.get(`/complaints/collector/all?${params}`);
    return response.data;
  },

  // Get complaints statistics
  getComplaintsStats: async () => {
    const response = await api.get('/complaints/stats');
    return response.data;
  },

  // Assign complaint to collector
  assignCollector: async (complaintId, collectorId) => {
    const response = await api.put(`/complaints/${complaintId}/assign`, {
      collector_id: collectorId,
    });
    return response.data;
  },
};

// Notifications API functions
export const notificationsAPI = {
  // Get notifications
  getNotifications: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.isRead !== undefined) params.append('is_read', filters.isRead);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/notifications?${params}`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
};

// Chat/AI Assistant API functions
export const chatAPI = {
  // Send message to AI
  sendMessage: async (message) => {
    const response = await api.post('/chat/message', { message });
    return response.data;
  },

  // Get chat history
  getChatHistory: async (limit = 20) => {
    const response = await api.get(`/chat/history?limit=${limit}`);
    return response.data;
  },

  // Clear chat history
  clearHistory: async () => {
    const response = await api.delete('/chat/history');
    return response.data;
  },

  // Get quick responses
  getQuickResponses: async () => {
    const response = await api.get('/chat/quick-responses');
    return response.data;
  },
};

// Utility functions
export const tokenUtils = {
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userEmail', user.email);
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Admin API functions
export const adminAPI = {
  // Admin Authentication
  adminLogin: async (email, password) => {
    const response = await api.post('/auth/admin-login', { email, password });
    return response.data;
  },

  requestAdminOTP: async (email) => {
    const response = await api.post('/auth/admin-otp-request', { email });
    return response.data;
  },

  adminOtpLogin: async (email, otpCode) => {
    const response = await api.post('/auth/admin-otp-login', { email, otp_code: otpCode });
    return response.data;
  },

  // Dashboard Stats
  getDashboardStats: async (timeFilter = 'today') => {
    const response = await api.get(`/admin/dashboard-stats?period=${timeFilter}`);
    return response.data;
  },

  // Complaints Management
  getAllComplaints: async () => {
    const response = await api.get('/admin/complaints');
    return response.data;
  },

  getComplaintById: async (complaintId) => {
    const response = await api.get(`/admin/complaints/${complaintId}`);
    return response.data;
  },

  updateComplaintStatus: async (complaintId, status) => {
    const response = await api.put(`/admin/complaints/${complaintId}/status`, { status });
    return response.data;
  },

  assignComplaint: async (complaintId, department) => {
    const response = await api.put(`/admin/complaints/${complaintId}/assign`, { department });
    return response.data;
  },

  addComplaintNote: async (complaintId, note) => {
    const response = await api.post(`/admin/complaints/${complaintId}/notes`, { note });
    return response.data;
  },

  // Departments Management
  getDepartments: async () => {
    const response = await api.get('/admin/departments');
    return response.data;
  },

  createDepartment: async (departmentData) => {
    const response = await api.post('/admin/departments', departmentData);
    return response.data;
  },

  updateDepartment: async (departmentId, departmentData) => {
    const response = await api.put(`/admin/departments/${departmentId}`, departmentData);
    return response.data;
  },

  deleteDepartment: async (departmentId) => {
    const response = await api.delete(`/admin/departments/${departmentId}`);
    return response.data;
  },

  // Reports and Analytics
  getReports: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/admin/reports?${params}`);
    return response.data;
  },

  exportReport: async (format, filters = {}) => {
    const params = new URLSearchParams({ ...filters, format });
    const response = await api.get(`/admin/reports/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Notifications
  getAdminNotifications: async () => {
    const response = await api.get('/admin/notifications');
    return response.data;
  },

  markNotificationRead: async (notificationId) => {
    const response = await api.put(`/admin/notifications/${notificationId}/read`);
    return response.data;
  },

  // Settings
  getAdminSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateAdminSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },
};

// RAG API functions
export const ragAPI = {
  // Upload complaint document (PDF, DOCX, Image)
  uploadDocument: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/rag/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Search for similar complaints
  searchSimilarComplaints: async (query, filters = {}) => {
    const response = await api.post('/api/rag/search', {
      query,
      n_results: filters.n_results || 5,
      department_filter: filters.department || null,
      urgency_filter: filters.urgency || null,
    });
    return response.data;
  },

  // Get complaint details from vector DB
  getComplaintDetails: async (documentId) => {
    const response = await api.get(`/api/rag/complaint/${documentId}`);
    return response.data;
  },

  // Get RAG statistics
  getRAGStats: async () => {
    const response = await api.get('/api/rag/stats');
    return response.data;
  },

  // Analyze text and find similar complaints before submission
  analyzeComplaintText: async (title, description, category = null, urgency = null, location = null) => {
    const response = await api.post('/api/rag/analyze-text', {
      title,
      description,
      category,
      urgency,
      location,
    });
    return response.data;
  },

  // Add existing complaint to vector database
  addToVectorDB: async (complaintId) => {
    const response = await api.post('/api/rag/add-to-vector-db', null, {
      params: { complaint_id: complaintId },
    });
    return response.data;
  },

  // Health check for RAG service
  healthCheck: async () => {
    const response = await api.get('/api/rag/health');
    return response.data;
  },

  // Analyze text input for similar complaints and suggestions (public endpoint - no auth required)
  analyzeText: async (text, maxResults = 5) => {
    const response = await api.post('/api/rag/public/analyze-text', {
      text,
      max_results: maxResults,
    });
    return response.data;
  },

  // Search for similar complaints
  searchSimilar: async (query, maxResults = 5) => {
    const response = await api.post('/api/rag/search', {
      query,
      max_results: maxResults,
    });
    return response.data;
  },

  // Add complaint to vector database (public endpoint - no auth required)
  addToVectorDB: async (complaintData) => {
    const response = await api.post('/api/rag/public/add-to-vector-db', {
      id: complaintData.id,
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      location: complaintData.location,
      status: complaintData.status || 'pending',
    });
    return response.data;
  },

  // Get RAG statistics
  getStats: async () => {
    const response = await api.get('/api/rag/stats');
    return response.data;
  },
};

export default api;