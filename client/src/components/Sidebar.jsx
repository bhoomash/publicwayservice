import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  ClipboardList, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('token');
    if (onLogout) onLogout();
    navigate('/login');
  };

  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr.startsWith('{')) {
        const user = JSON.parse(userStr);
        return user.role || (user.is_admin ? 'admin' : 'citizen');
      }
      return localStorage.getItem('userRole') || 'citizen';
    } catch (error) {
      return 'citizen';
    }
  };

  const userRole = getUserRole();

  // Different menu items based on user role
  const citizenMenuItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'Overview & Statistics'
    },
    {
      path: '/submit-complaint',
      icon: FileText,
      label: 'Submit Complaint',
      description: 'File New Grievance'
    },
    {
      path: '/my-complaints',
      icon: ClipboardList,
      label: 'My Complaints',
      description: 'Track Status'
    },
    {
      path: '/help',
      icon: HelpCircle,
      label: 'Help & FAQs',
      description: 'Support Center'
    }
  ];

  // For admin users, redirect them to admin panel (this sidebar should not be used for admins)
  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/admin');
    }
  }, [userRole, navigate]);

  if (userRole === 'admin') {
    return null;
  }

  const menuItems = citizenMenuItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Government Sidebar */}
      <div className={`
        fixed top-20 left-0 h-full gov-sidebar z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="gov-sidebar-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="gov-logo">
                  <span className="text-sm font-bold">PWS</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold gov-text-primary">Public Way Service</h2>
                  <p className="text-xs gov-text-muted">Service Navigation</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded hover:gov-bg-light"
              >
                <X size={18} className="gov-text-muted" />
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="gov-sidebar-nav flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <div key={item.path} className="gov-sidebar-item">
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                    className={({ isActive }) => `
                      gov-sidebar-link
                      ${isActive ? 'active' : ''}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <IconComponent 
                          size={18} 
                          className="gov-sidebar-icon"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="gov-sidebar-text">{item.label}</div>
                          <div className="gov-sidebar-desc">{item.description}</div>
                        </div>
                      </>
                    )}
                  </NavLink>
                </div>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="gov-border-top p-4 gov-bg-light">
            <div className="flex items-center space-x-3 mb-4 p-3 gov-bg-white rounded gov-border">
              <div className="w-8 h-8 gov-bg-primary rounded flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium gov-text-primary truncate">
                  {localStorage.getItem('userEmail') || 'User'}
                </p>
                <p className="text-xs gov-text-muted">Citizen Account</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 p-3 gov-text-danger hover:gov-bg-white gov-border rounded"
            >
              <LogOut size={16} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;