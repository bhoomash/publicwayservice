import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Settings,
  Trash2
} from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Fetch actual notifications from API
    const mockNotifications = [
      {
        id: 1,
        title: 'Complaint Status Update',
        message: 'Your complaint CMP001 "Street Light Not Working" has been assigned to the electrical department.',
        type: 'status_update',
        isRead: false,
        timestamp: '2025-08-17T10:30:00Z',
        relatedComplaintId: 'CMP001'
      },
      {
        id: 2,
        title: 'Complaint Resolved',
        message: 'Good news! Your complaint CMP003 "Road Repair Required" has been successfully resolved.',
        type: 'resolved',
        isRead: false,
        timestamp: '2025-08-16T15:45:00Z',
        relatedComplaintId: 'CMP003'
      },
      {
        id: 3,
        title: 'System Maintenance',
        message: 'The Gov Portal will undergo scheduled maintenance on August 20th from 2:00 AM to 4:00 AM.',
        type: 'system',
        isRead: true,
        timestamp: '2025-08-15T09:00:00Z'
      },
      {
        id: 4,
        title: 'New Feature Available',
        message: 'You can now track real-time updates for your complaints in the "My Complaints" section.',
        type: 'feature',
        isRead: true,
        timestamp: '2025-08-14T12:00:00Z'
      },
      {
        id: 5,
        title: 'Complaint Submitted',
        message: 'Your complaint CMP002 "Water Supply Issue" has been successfully submitted and is under review.',
        type: 'submitted',
        isRead: true,
        timestamp: '2025-08-14T08:30:00Z',
        relatedComplaintId: 'CMP002'
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type, isRead) => {
    const iconSize = 20;
    const iconClass = isRead ? 'text-gray-500' : 'text-blue-600';
    
    switch (type) {
      case 'resolved':
        return <CheckCircle size={iconSize} className="text-green-600" />;
      case 'status_update':
        return <AlertCircle size={iconSize} className={iconClass} />;
      case 'system':
        return <Settings size={iconSize} className={iconClass} />;
      case 'feature':
        return <Info size={iconSize} className={iconClass} />;
      case 'submitted':
        return <Bell size={iconSize} className={iconClass} />;
      default:
        return <Bell size={iconSize} className={iconClass} />;
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) return 'bg-white';
    
    switch (type) {
      case 'resolved':
        return 'bg-green-50 border-green-200';
      case 'status_update':
        return 'bg-blue-50 border-blue-200';
      case 'system':
        return 'bg-yellow-50 border-yellow-200';
      case 'feature':
        return 'bg-purple-50 border-purple-200';
      case 'submitted':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Layout title="Notifications">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All notifications are read'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <CheckCircle size={16} className="mr-2" />
                Mark All as Read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'You\'re all caught up! No unread notifications.'
                  : filter === 'read'
                  ? 'No read notifications found.'
                  : 'You don\'t have any notifications yet.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 transition-colors hover:bg-gray-50 ${
                    getNotificationBgColor(notification.type, notification.isRead)
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.isRead)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${
                            notification.isRead ? 'text-gray-800' : 'text-gray-900'
                          }`}>
                            {notification.title}
                            {!notification.isRead && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full ml-2"></span>
                            )}
                          </h3>
                          <p className={`mt-1 text-sm ${
                            notification.isRead ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                            {notification.relatedComplaintId && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {notification.relatedComplaintId}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings size={20} className="mr-2 text-blue-600" />
            Notification Preferences
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Email Notifications</h4>
                <p className="text-xs text-gray-500">Receive updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Status Updates</h4>
                <p className="text-xs text-gray-500">Get notified when complaint status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">System Announcements</h4>
                <p className="text-xs text-gray-500">Important system updates and maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
