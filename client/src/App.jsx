import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CollectorDashboard from './pages/CollectorDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import MyComplaints from './pages/MyComplaints';
import Notifications from './pages/Notifications';
import Help from './pages/Help';
import AdminDashboard from './pages/admin/AdminDashboard';
import AllComplaints from './pages/admin/AllComplaints';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import ComplaintDetails from './pages/ComplaintDetails';
import ProfileSettings from './pages/ProfileSettings';

// Helper function to get user info from localStorage
const getUserInfo = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return null;
    }

    // Try to parse user data
    let userData;
    if (user.startsWith('{')) {
      userData = JSON.parse(user);
    } else {
      // Handle plain email string
      userData = { email: user };
    }

    return userData;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Check if user is admin
const isAdmin = () => {
  const userInfo = getUserInfo();
  if (!userInfo) return false;
  
  // Check multiple possible admin indicators
  return (
    userInfo.role === 'admin' ||
    userInfo.is_admin === true ||
    userInfo.email === 'anirudh200503@gmail.com' // Admin email
  );
};

// Protected Route for regular users
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userInfo = getUserInfo();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If user is admin, redirect to admin panel
  if (isAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

// Protected Route for admin users
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Smart redirect component for root path
const SmartRedirect = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (isAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<SmartRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Citizen Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/collector-dashboard" element={
          <ProtectedRoute>
            <CollectorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/submit-complaint" element={
          <ProtectedRoute>
            <SubmitComplaint />
          </ProtectedRoute>
        } />
        <Route path="/my-complaints" element={
          <ProtectedRoute>
            <MyComplaints />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <Help />
          </ProtectedRoute>
        } />
        <Route path="/complaint/:id" element={
          <ProtectedRoute>
            <ComplaintDetails />
          </ProtectedRoute>
        } />
        <Route path="/profile-settings" element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/complaints" element={
          <AdminProtectedRoute>
            <AllComplaints />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <AdminProtectedRoute>
            <UserManagement />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <AdminProtectedRoute>
            <Reports />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <AdminProtectedRoute>
            <Settings />
          </AdminProtectedRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
