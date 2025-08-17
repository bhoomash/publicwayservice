import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, tokenUtils } from '../utils/api';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otpCode: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!isOtpMode && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    if (isOtpMode && !formData.otpCode.trim()) {
      newErrors.otpCode = 'OTP is required';
    }
    
    return newErrors;
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setApiError('');
      
      try {
        const response = await adminAPI.adminLogin(formData.email, formData.password);
        
        // Store admin token and info
        tokenUtils.setToken(response.access_token);
        tokenUtils.setUser({ ...response.user, role: 'admin' });
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } catch (error) {
        console.error('Admin login error:', error);
        if (error.response?.data?.detail) {
          setApiError(error.response.data.detail);
        } else {
          setApiError('Admin login failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleOtpRequest = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required for OTP login' });
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await adminAPI.requestAdminOTP(formData.email);
      setOtpSent(true);
      setIsOtpMode(true);
    } catch (error) {
      console.error('OTP request error:', error);
      setApiError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setApiError('');
      
      try {
        const response = await adminAPI.adminOtpLogin(formData.email, formData.otpCode);
        
        // Store admin token and info
        tokenUtils.setToken(response.access_token);
        tokenUtils.setUser({ ...response.user, role: 'admin' });
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } catch (error) {
        console.error('Admin OTP login error:', error);
        if (error.response?.data?.detail) {
          setApiError(error.response.data.detail);
        } else {
          setApiError('OTP verification failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 2.676-1.148 5.077-2.784 7.11-4.778" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure access to complaint management system
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {apiError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {apiError}
            </div>
          )}

          {!isOtpMode ? (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Admin Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                  placeholder="Enter admin email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in with Password'}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleOtpRequest}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-red-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Sign in with OTP
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Admin Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-md sm:text-sm"
                  value={formData.email}
                />
              </div>

              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
                  OTP Code
                </label>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.otpCode ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                  placeholder="Enter 6-digit OTP"
                  value={formData.otpCode}
                  onChange={handleInputChange}
                  maxLength="6"
                />
                {errors.otpCode && <p className="mt-1 text-sm text-red-600">{errors.otpCode}</p>}
                {otpSent && (
                  <p className="mt-1 text-sm text-green-600">OTP sent to your email address</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpMode(false);
                    setOtpSent(false);
                    setFormData(prev => ({ ...prev, otpCode: '' }));
                  }}
                  className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Back to Password Login
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-red-600 hover:text-red-500"
          >
            ← Back to User Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
