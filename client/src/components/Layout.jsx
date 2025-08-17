import React, { useState } from 'react';
import { Menu, Bell, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatBot from './ChatBot';
import Footer from './Footer';

const Layout = ({ children, title = "Dashboard" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr.startsWith('{')) {
        // Parse JSON string
        const user = JSON.parse(userStr);
        return {
          email: user.email || 'user@example.com',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          fullName: user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : (user.email || 'user@example.com').split('@')[0]
        };
      } else {
        // Handle plain email string
        const email = userStr || 'user@example.com';
        return {
          email: email,
          firstName: '',
          lastName: '',
          fullName: email.split('@')[0]
        };
      }
    } catch (error) {
      // Fallback for any parsing errors
      const email = 'user@example.com';
      return {
        email: email,
        firstName: '',
        lastName: '',
        fullName: email.split('@')[0]
      };
    }
  };

  const userInfo = getUserInfo();
  const userEmail = userInfo.email;
  const userName = userInfo.fullName;
  const userInitials = userInfo.firstName && userInfo.lastName 
    ? `${userInfo.firstName.charAt(0)}${userInfo.lastName.charAt(0)}`.toUpperCase()
    : userName.charAt(0).toUpperCase();

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0 h-full">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left side - Mobile menu button and title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Welcome to GrievanceBot Portal</p>
              </div>
            </div>

            {/* Right side - Notifications and User menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <button 
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {userInitials}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">{userName}</p>
                    <p className="text-xs text-gray-500">Citizen</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                
                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500">{userEmail}</p>
                      </div>
                      <a 
                        href="/profile-settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile Settings
                      </a>
                      <a 
                        href="/account-settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Account Settings
                      </a>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - This will expand and footer will follow naturally */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6">
            {children}
          </div>
          {/* Footer - This will appear after content */}
          <Footer />
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* ChatBot */}
      <ChatBot />
    </div>
  );
};

export default Layout;
