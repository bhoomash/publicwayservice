import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { notificationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Settings,
  Trash2,
  RefreshCw,
  Loader2
} from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const data = await notificationsAPI.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchNotifications]);

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

  const getProblemTypeDisplay = (type) => {
    const typeMap = {
      'road': 'Road Issues',
      'water': 'Water Supply',
      'electricity': 'Electricity',
      'sanitation': 'Sanitation',
      'street_light': 'Street Lights',
      'drainage': 'Drainage',
      'garbage': 'Garbage Collection',
      'public_transport': 'Public Transport',
      'noise': 'Noise Pollution',
      'air_pollution': 'Air Pollution',
      'public_safety': 'Public Safety',
      'infrastructure': 'Infrastructure',
      'health': 'Health Services',
      'education': 'Education',
      'general': 'General Issue',
      // Department mappings
      'transport_department': 'Transport',
      'water_department': 'Water',
      'electricity_department': 'Electricity',
      'sanitation_department': 'Sanitation',
      'health_department': 'Health',
      'municipality': 'Municipality',
      'public_works_department': 'Public Works',
      'environment_department': 'Environment',
      'education_department': 'Education',
      'police_department': 'Public Safety'
    };
    const normalizedType = type?.toLowerCase().replace(/\s+/g, '_');
    return typeMap[normalizedType] || type || 'General Issue';
  };

  const getProblemTypeBadgeColor = (type) => {
    const colorMap = {
      'road': 'bg-orange-100 text-orange-700',
      'water': 'bg-blue-100 text-blue-700',
      'electricity': 'bg-yellow-100 text-yellow-700',
      'sanitation': 'bg-green-100 text-green-700',
      'street_light': 'bg-purple-100 text-purple-700',
      'drainage': 'bg-cyan-100 text-cyan-700',
      'garbage': 'bg-red-100 text-red-700',
      'public_transport': 'bg-indigo-100 text-indigo-700',
      'noise': 'bg-pink-100 text-pink-700',
      'air_pollution': 'bg-gray-100 text-gray-700',
      'public_safety': 'bg-red-100 text-red-700',
      'infrastructure': 'bg-stone-100 text-stone-700',
      'health': 'bg-emerald-100 text-emerald-700',
      'education': 'bg-violet-100 text-violet-700',
      'general': 'bg-slate-100 text-slate-700',
      // Department mappings
      'transport_department': 'bg-orange-100 text-orange-700',
      'water_department': 'bg-blue-100 text-blue-700',
      'electricity_department': 'bg-yellow-100 text-yellow-700',
      'sanitation_department': 'bg-green-100 text-green-700',
      'health_department': 'bg-emerald-100 text-emerald-700',
      'municipality': 'bg-slate-100 text-slate-700',
      'public_works_department': 'bg-stone-100 text-stone-700',
      'environment_department': 'bg-green-100 text-green-700',
      'education_department': 'bg-violet-100 text-violet-700',
      'police_department': 'bg-red-100 text-red-700'
    };
    const normalizedType = type?.toLowerCase().replace(/\s+/g, '_');
    return colorMap[normalizedType] || 'bg-gray-100 text-gray-700';
  };

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true, isRead: true }
            : notification
        )
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true, isRead: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const isRead = notification.is_read || notification.isRead; // Support both formats
    if (filter === 'unread') return !isRead;
    if (filter === 'read') return isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !(n.is_read || n.isRead)).length;

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
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchNotifications(false)}
                disabled={refreshing}
                className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh notifications"
              >
                {refreshing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
              
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
          {loading ? (
            // Loading skeleton
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-6 animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
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
                    getNotificationBgColor(notification.type, notification.is_read || notification.isRead)
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.is_read || notification.isRead)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${
                            (notification.is_read || notification.isRead) ? 'text-gray-800' : 'text-gray-900'
                          }`}>
                            {notification.title}
                            {!(notification.is_read || notification.isRead) && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full ml-2"></span>
                            )}
                          </h3>
                          <p className={`mt-1 text-sm ${
                            (notification.is_read || notification.isRead) ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          
                          {/* Problem Type and Metadata */}
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            {/* Problem Type Badge */}
                            {(notification.problem_type || notification.category) && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getProblemTypeBadgeColor(notification.problem_type || notification.category)}`}>
                                {getProblemTypeDisplay(notification.problem_type || notification.category)}
                              </span>
                            )}
                            
                            {/* Department Badge */}
                            {(notification.department || notification.assigned_department) && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                {notification.department || notification.assigned_department}
                              </span>
                            )}
                            
                            {/* Urgency Badge */}
                            {notification.urgency && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                notification.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                notification.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {notification.urgency.charAt(0).toUpperCase() + notification.urgency.slice(1)} Priority
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                            {(notification.related_complaint_id || notification.relatedComplaintId) && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                ID: {notification.related_complaint_id || notification.relatedComplaintId}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!(notification.is_read || notification.isRead) && (
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
