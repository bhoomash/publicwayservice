import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  ClipboardList, 
  Bell, 
  HelpCircle, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('token');
    if (onLogout) onLogout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'View complaints summary'
    },
    {
      path: '/submit-complaint',
      icon: FileText,
      label: 'Submit Complaint',
      description: 'File a new grievance'
    },
    {
      path: '/my-complaints',
      icon: ClipboardList,
      label: 'My Complaints',
      description: 'Track your complaints'
    },
    {
      path: '/notifications',
      icon: Bell,
      label: 'Notifications',
      description: 'View updates & alerts'
    },
    {
      path: '/help',
      icon: HelpCircle,
      label: 'Help / FAQs',
      description: 'Get assistance'
    }
  ];

  // Add admin menu item for admin users
  const userRole = localStorage.getItem('userRole') || 'user';
  if (userRole === 'admin') {
    menuItems.splice(1, 0, {
      path: '/admin',
      icon: ClipboardList,
      label: 'Admin Dashboard',
      description: 'Manage all complaints'
    });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-lg z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-72 border-r border-gray-200
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GB</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">GrievanceBot</h1>
                <p className="text-xs text-gray-500">Government Portal</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 overflow-y-auto">
            <ul className="space-y-2 px-4">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 1024) {
                          toggleSidebar();
                        }
                      }}
                      className={({ isActive }) => `
                        flex items-center p-3 rounded-lg transition-all duration-200
                        hover:bg-blue-50 hover:border-l-4 hover:border-blue-500
                        ${isActive 
                          ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700' 
                          : 'text-gray-700 hover:text-blue-700'
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <IconComponent 
                            size={20} 
                            className={`mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.label}</div>
                            <div className="text-xs text-gray-500 truncate">{item.description}</div>
                          </div>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {localStorage.getItem('userEmail')?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {localStorage.getItem('userEmail') || 'User'}
                </p>
                <p className="text-xs text-gray-500">Citizen</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} className="mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
