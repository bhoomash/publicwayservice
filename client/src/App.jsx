// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {

//   return (
//     <>
//       <h1 className="text-3xl font-bold">Welcome</h1>
//     </>
//   )
// }

// export default App

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
import AdminDashboard from './pages/AdminDashboard';
import ComplaintDetails from './pages/ComplaintDetails';
import ProfileSettings from './pages/ProfileSettings';
import AccountSettings from './pages/AccountSettings';
import AdminLogin from './pages/AdminLogin';
import AdminComplaints from './pages/AdminComplaints';
import AdminComplaintDetail from './pages/AdminComplaintDetail';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  
  try {
    const userData = JSON.parse(user);
    if (userData.role === 'admin' || userData.is_admin) {
      return children;
    } else {
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    return <Navigate to="/admin/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/collector" element={
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
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
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
        <Route path="/account-settings" element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/complaints" element={
          <AdminProtectedRoute>
            <AdminComplaints />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/complaints/:id" element={
          <AdminProtectedRoute>
            <AdminComplaintDetail />
          </AdminProtectedRoute>
        } />
        
        {/* Catch all route - redirect based on user role */}
        <Route path="*" element={
          (() => {
            const token = localStorage.getItem('token');
            if (!token) {
              return <Navigate to="/login" replace />;
            }
            
            try {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              if (user.role === 'admin' || user.is_admin) {
                return <Navigate to="/admin/dashboard" replace />;
              } else {
                return <Navigate to="/dashboard" replace />;
              }
            } catch (error) {
              return <Navigate to="/login" replace />;
            }
          })()
        } />
      </Routes>
    </Router>
  );
}

export default App;
