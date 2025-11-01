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
    <div className="h-screen flex flex-col gov-bg-light overflow-hidden">
      {/* Government Header Bar - White with Dark Blue Text */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-blue-900 shadow-sm h-20">
        <div className="gov-container px-3 sm:px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Mobile: Menu button first */}
            <div className="flex lg:hidden items-center order-1">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded text-blue-900 hover:bg-blue-50 flex-shrink-0"
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
            </div>
            
            {/* Title - centered on mobile, left on desktop */}
            <div className="flex-1 min-w-0 order-2 text-center lg:text-left">
              <h1 className="text-sm sm:text-base lg:text-xl font-bold text-blue-900 truncate">Public Way Service</h1>
              <p className="text-xs text-gray-600 hidden sm:block">Digital Grievance Management System</p>
            </div>
            
            {/* User Dropdown Menu - Shows on both mobile and desktop */}
            <div className="flex items-center order-3">
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-1 lg:space-x-2 p-1.5 lg:p-2 rounded text-blue-900 hover:bg-blue-50"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-blue-900 text-white rounded flex items-center justify-center flex-shrink-0">
                    <span className="font-medium text-sm">{userInitials}</span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="font-medium text-sm text-blue-900 truncate max-w-[120px]">{userName}</p>
                    <p className="text-xs text-gray-600">{isAdmin ? "Administrator" : "Citizen"}</p>
                  </div>
                  <ChevronDown size={14} className="text-blue-900" />
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

      {/* Main Layout with Sidebar and Content */}
      <div className="flex flex-1 pt-20 overflow-hidden">
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
        <div className="flex-1 flex flex-col h-full overflow-hidden">
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
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* ChatBot - Only show for non-admin users */}
      {!isAdmin && <ChatBot />}
      </div>
    </div>
  );
};

export default Layout;