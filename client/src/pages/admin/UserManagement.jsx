import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Mail,
  Calendar,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit form states
  const [editForm, setEditForm] = useState({
    role: '',
    status: '',
    is_admin: false
  });

  // Current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // console.log('👥 Fetching all users...');
      const normalizedUsers = await adminAPI.getAllUsers();
      // console.log('📊 Users response:', normalizedUsers);

      // Normalize user data to ensure consistency
      const processedUsers = normalizedUsers.map(user => ({
        ...user,
        id: user.id || user._id,
        // Preserve original role field for backend consistency
        role: user.role || 'citizen',
        complaints_count: user.complaints_count || 0,
        status: user.status || 'active',
        created_at: user.created_at || new Date().toISOString(),
        // Ensure is_admin is strictly boolean (handle various truthy values)
        is_admin: Boolean(user.is_admin === true || user.is_admin === 'true' || user.is_admin === 1)
      }));

      // console.log('📝 Processed users data:', processedUsers);

      // Debug: Log effective role assignments for verification
      console.log('🔍 Effective Role Display Verification:');
      processedUsers.forEach(user => {
        const effectiveRole = user.is_admin === true ? 'admin' : 'citizen';
        console.log(`  User ${user.email}: is_admin=${user.is_admin}, role_field=${user.role}, display_as=${effectiveRole}`);
      });

      setUsers(processedUsers);

    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async () => {
    try {
      setRefreshing(true);
      await fetchUsers();
    } finally {
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => getEffectiveRole(user) === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'citizen': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to determine a user's effective role for display
  const getEffectiveRole = (user) => {
    // Only users with is_admin === true should be shown as admin
    // All others should be shown as citizen (regardless of role field)
    return user.is_admin === true ? 'admin' : 'citizen';
  };

  // Modal action functions
  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      // Use the actual role field, not the effective role
      role: user.role || 'citizen',
      status: user.status || 'active',
      is_admin: user.is_admin === true
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData = {
        // Keep role and is_admin as separate fields
        // role represents the user's actual role (citizen, moderator, etc.)
        // is_admin is a separate boolean flag for admin access
        role: editForm.role || 'citizen',
        status: editForm.status,
        is_admin: editForm.is_admin
      };

      // console.log('🔄 Updating user:', selectedUser.email, 'with data:', updateData);

      await adminAPI.updateUser(selectedUser.id, updateData);
      await fetchUsers(); // Refresh the users list
      closeModals();
    } catch (error) {
      console.error('❌ Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await adminAPI.deleteUser(selectedUser.id);
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      closeModals();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Format date for Indian locale
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <Layout title="User Management" isAdmin={true}>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-300 opacity-30" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Management" isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">User Management</h1>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshUsers}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <UserPlus className="h-5 w-5 mr-2" />
              Add New User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(user => getEffectiveRole(user) === 'admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Citizens</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(user => getEffectiveRole(user) === 'citizen').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(user => user.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="citizen">Citizens</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
                {filteredUsers.length > usersPerPage && ` (Page ${currentPage} of ${totalPages})`}
              </span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complaints
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {(user.first_name || 'U').charAt(0)}{(user.last_name || 'U').charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name || 'Unknown'} {user.last_name || 'User'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail size={12} className="mr-1" />
                            {user.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(getEffectiveRole(user))}`}>
                        {getEffectiveRole(user) === 'admin' && <Shield size={12} className="mr-1" />}
                        {(getEffectiveRole(user) || 'citizen').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status || 'active')}`}>
                        {(user.status || 'active').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                          {user.complaints_count || 0} complaints
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openViewModal(user)}
                          className="text-blue-600 hover:text-blue-900 transition-colors hover:bg-blue-50 p-1 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-green-600 hover:text-green-900 transition-colors hover:bg-green-50 p-1 rounded"
                          title="Edit User"
                        >
                          <Edit size={16} />
                        </button>
                        {getEffectiveRole(user) !== 'admin' && (
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-900 transition-colors hover:bg-red-50 p-1 rounded"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 border rounded text-sm ${currentPage === page
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* View User Modal */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">User Details</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-sm">{selectedUser.first_name} {selectedUser.last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm">{selectedUser.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Joined</label>
                        <p className="text-sm">{formatDate(selectedUser.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Account Status</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Role</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(getEffectiveRole(selectedUser))}`}>
                          {getEffectiveRole(selectedUser).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Complaints</label>
                        <p className="text-sm">{selectedUser.complaints_count || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Verified</label>
                        <p className="text-sm">{selectedUser.is_verified ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Edit User</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                    <p className="text-sm text-gray-600">{selectedUser.first_name} {selectedUser.last_name}</p>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.is_admin}
                          onChange={(e) => setEditForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Admin User</span>
                      </label>
                      {!editForm.is_admin && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="citizen">Citizen</option>
                            <option value="staff">Staff</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Note: All non-admin users display as "CITIZEN" regardless of role
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditUser}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                  <h2 className="text-xl font-bold">Delete User</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
                  This action cannot be undone and will permanently remove the user and all associated data.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;
