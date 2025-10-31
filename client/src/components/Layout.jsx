import React, { useState } from 'react';
import { Menu, X, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import ChatBot from './EnhancedChatBot';
import Footer from './Footer';

const Layout = ({ children, title = "Dashboard", isAdmin = false }) => {
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
    <div className="h-screen flex gov-bg-light overflow-hidden">
      {/* Government Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 gov-header">
        <div className="gov-container">
          <div className="gov-header-brand">
            <div className="gov-logo">
              <span className="text-lg font-bold">PWS</span>
            </div>
            <div>
              <h1 className="gov-title">Public Way Service</h1>
              <p className="gov-subtitle">Digital Grievance Management System</p>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded text-white hover:bg-white hover:bg-opacity-20"
              >
                <Menu size={20} />
              </button>
              
              {/* User Dropdown Menu - Moved to Dark Blue Header */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded text-white"
                >
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center">
                    <span className="font-medium text-sm">{userInitials}</span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="font-medium text-sm">{userName}</p>
                    <p className="opacity-80 text-xs">{isAdmin ? "Administrator" : "Citizen"}</p>
                  </div>
                  <ChevronDown size={14} className="text-white opacity-80" />
                </button>
                
                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 gov-card z-20">
                      <div className="gov-card-header">
                        <p className="text-sm font-medium gov-text-primary">{userName}</p>
                        <p className="text-xs gov-text-muted">{userEmail}</p>
                      </div>
                      <div className="gov-card-body py-2">
                        <a 
                          href="/profile-settings" 
                          className="flex items-center space-x-2 px-3 py-2 text-sm gov-text-muted rounded gov-nav-link"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={16} />
                          <span>Profile Settings</span>
                        </a>
                        <a 
                          href="/account-settings" 
                          className="flex items-center space-x-2 px-3 py-2 text-sm gov-text-muted rounded gov-nav-link"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={16} />
                          <span>Account Settings</span>
                        </a>
                        <div className="border-t gov-border mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm gov-text-danger rounded"
                          >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Sidebar */}
      {isAdmin ? (
        <AdminSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
        />
      ) : (
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0 h-full pt-20">
        {/* Sub-header with page title and actions */}
        <header className="gov-bg-white px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0 gov-border-bottom">
          <div className="flex items-center justify-between">
            {/* Left side - Page title */}
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-xl font-semibold gov-text-primary">{title}</h2>
                <p className="text-sm gov-text-muted hidden sm:block">
                  {isAdmin ? "Administrative Control Panel" : "Public Way Service Portal"}
                </p>
              </div>
            </div>

            {/* Right side - Actions (User menu moved to header) */}
            <div className="flex items-center space-x-3">
              {/* User menu has been moved to the dark blue header above */}
            </div>
          </div>
        </header>

        {/* Main Content - All content including footer scrolls together */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {children}
          </div>
          
          {/* Footer appears after all dashboard content */}
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
      
      {/* ChatBot - Only show for non-admin users */}
      {!isAdmin && <ChatBot />}
    </div>
  );
};

export default Layout;