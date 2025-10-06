import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  BarChart3,
  Brain,
  Zap,
  Plus,
  Sparkles
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    inProgressComplaints: 0,
    aiProcessed: 0,
    averageResolutionTime: 0
  });

  useEffect(() => {
    // Check if user is admin and redirect to admin dashboard
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'admin' || user.is_admin) {
        navigate('/admin', { replace: true });
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }

    // TODO: Fetch actual stats from API
    setStats({
      totalComplaints: 12,
      pendingComplaints: 3,
      resolvedComplaints: 7,
      inProgressComplaints: 2,
      aiProcessed: 12,
      averageResolutionTime: 2.5
    });
  }, []);

  const StatCard = ({ icon: Icon, title, value, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon size={24} className={color} />
        </div>
      </div>
    </div>
  );

  const recentComplaints = [
    {
      id: 'CMP001',
      title: 'Street Light Not Working',
      status: 'In Progress',
      date: '2025-08-15',
      category: 'Infrastructure',
      aiResponse: 'Automated assignment to Municipal Corporation. Estimated resolution: 2-3 days.',
      priorityScore: 75,
      aiProcessed: true,
      vectorDbId: 'vec_abc123',
      similarComplaintsCount: 3
    },
    {
      id: 'CMP002',
      title: 'Water Supply Issue',
      status: 'Pending',
      date: '2025-08-14',
      category: 'Utilities',
      aiResponse: 'High priority issue affecting multiple households. Emergency response recommended.',
      priorityScore: 90,
      aiProcessed: true,
      vectorDbId: 'vec_def456',
      similarComplaintsCount: 2
    },
    {
      id: 'CMP003',
      title: 'Road Repair Required',
      status: 'Resolved',
      date: '2025-08-13',
      category: 'Infrastructure',
      aiResponse: 'Standard maintenance request. Completed within expected timeframe.',
      priorityScore: 60,
      aiProcessed: true,
      vectorDbId: 'vec_ghi789',
      similarComplaintsCount: 5
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Assigned': return 'text-purple-600 bg-purple-100';
      case 'Pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to GrievanceBot</h2>
              <p className="text-blue-100">
                AI-powered complaint tracking and management system
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Brain size={32} className="text-blue-200" />
              <span className="text-sm text-blue-200">AI Enabled</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={FileText}
            title="Total Complaints"
            value={stats.totalComplaints}
            color="text-blue-600"
            description="All time complaints"
          />
          <StatCard
            icon={AlertCircle}
            title="Pending"
            value={stats.pendingComplaints}
            color="text-orange-600"
            description="Awaiting review"
          />
          <StatCard
            icon={TrendingUp}
            title="In Progress"
            value={stats.inProgressComplaints}
            color="text-blue-600"
            description="Being processed"
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved"
            value={stats.resolvedComplaints}
            color="text-green-600"
            description="Successfully closed"
          />
          <StatCard
            icon={Brain}
            title="AI Processed"
            value={stats.aiProcessed}
            color="text-purple-600"
            description="Auto-categorized"
          />
          <StatCard
            icon={Clock}
            title="Avg Resolution"
            value={`${stats.averageResolutionTime}d`}
            color="text-teal-600"
            description="Days to resolve"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Complaints */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <BarChart3 size={20} className="mr-2 text-blue-600" />
                Recent Complaints
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-800">{complaint.title}</h4>
                        {complaint.aiProcessed && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-xs font-medium flex items-center">
                            <Brain size={10} className="mr-1" />
                            AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                        <span className={`text-sm font-bold ${getPriorityColor(complaint.priorityScore)}`}>
                          {complaint.priorityScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4 mb-3">
                      <span className="font-medium">ID: {complaint.id}</span>
                      <span>{complaint.category}</span>
                      <span>{complaint.date}</span>
                      {complaint.similarComplaintsCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                          <TrendingUp size={10} className="mr-1" />
                          {complaint.similarComplaintsCount} similar
                        </span>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500 shadow-sm">
                      <div className="flex items-start space-x-2">
                        <Sparkles size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-purple-600 font-semibold mb-1">AI Analysis</p>
                          <p className="text-sm text-gray-700 mb-2">{complaint.aiResponse}</p>
                          {complaint.vectorDbId && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Zap size={10} className="mr-1" />
                              <span>Vector DB: {complaint.vectorDbId.substring(0, 12)}...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All Complaints →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Zap size={20} className="mr-2 text-blue-600" />
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-dashed border-blue-200 transition-colors group">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                      <Plus size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Submit New Complaint</h4>
                      <p className="text-sm text-blue-600">AI will auto-categorize and prioritize</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg border-2 border-dashed border-green-200 transition-colors group">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                      <BarChart3 size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Track Complaints</h4>
                      <p className="text-sm text-green-600">Monitor progress with AI insights</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-dashed border-purple-200 transition-colors group">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                      <Brain size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-800">AI Assistant</h4>
                      <p className="text-sm text-purple-600">Get guidance and status updates</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">AI Summary</h3>
                <p className="text-sm text-gray-600">Automated insights and recommendations</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-purple-600">
              <Zap size={16} />
              <span>Auto-updated</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <h4 className="font-medium text-gray-800 mb-2">Priority Alerts</h4>
              <p className="text-sm text-gray-600">1 high-priority complaint requires immediate attention</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <h4 className="font-medium text-gray-800 mb-2">Department Load</h4>
              <p className="text-sm text-gray-600">Municipal Corp has 40% capacity, can handle more cases</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <h4 className="font-medium text-gray-800 mb-2">Trends</h4>
              <p className="text-sm text-gray-600">Infrastructure complaints increased 15% this week</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
