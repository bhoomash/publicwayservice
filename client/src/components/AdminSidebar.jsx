import React from 'react';
import { Shield, Users, FileText, BarChart3, Settings, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const adminMenuItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      description: 'Overview & stats',
      icon: Shield
    },
    {
      path: '/admin/complaints',
      label: 'All Complaints',
      description: 'Manage complaints',
      icon: FileText
    },
    {
      path: '/admin/users',
      label: 'User Management',
      description: 'Manage users',
      icon: Users
    },
    {
      path: '/admin/reports',
      label: 'Reports',
      description: 'Analytics & reports',
      icon: BarChart3
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      description: 'System configuration',
      icon: Settings
    }
  ];

  return (
    <aside className={`
      fixed top-0 left-0 h-full bg-white shadow-lg z-50 
      transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
      transition-transform duration-300 ease-in-out
      lg:translate-x-0 lg:static lg:inset-0
      w-72 flex flex-col border-r border-gray-200
    `}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Admin Panel</h2>
            <p className="text-xs text-gray-500">Public Way Service</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-2 px-4">
          {adminMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <IconComponent size={18} className="mr-3" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Admin Badge */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 rounded-lg">
          <Shield className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">Admin Access</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
