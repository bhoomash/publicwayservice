/**
 * Normalizes user data to ensure consistent field names and structure
 * @param {Object|Array} data - Raw user data from the API
 * @returns {Array} Normalized array of users
 */
export const normalizeUsersData = (data) => {
    // Handle both array and object responses
    const usersArray = Array.isArray(data) ? data : data?.users || [];

    return usersArray.map(user => ({
        id: user._id || user.id,
        first_name: user.first_name || user.firstName || '',
        last_name: user.last_name || user.lastName || '',
        email: user.email || '',
        role: user.role?.toLowerCase() || user.is_admin ? 'admin' : 'citizen',
        status: user.status?.toLowerCase() || 'active',
        created_at: user.created_at || user.createdAt || new Date().toISOString(),
        updated_at: user.updated_at || user.updatedAt || new Date().toISOString(),
        complaints_count: user.complaints_count || 0,
        is_verified: user.is_verified || user.isVerified || false,
        is_admin: user.is_admin || user.isAdmin || false,
        // Original data for reference if needed
        _original: user
    }));
};

/**
 * Normalizes a single user object
 * @param {Object} user - Single user data
 * @returns {Object} Normalized user object
 */
export const normalizeUser = (user) => {
    return normalizeUsersData([user])[0];
};

/**
 * Normalizes complaint data to ensure consistent field names and structure
 * @param {Object|Array} data - Raw complaint data from the API
 * @returns {Array} Normalized array of complaints
 */
export const normalizeComplaintsData = (data) => {
    // Handle both array and object responses
    const complaintsArray = Array.isArray(data) ? data : data?.complaints || [];

    return complaintsArray.map(complaint => ({
        id: complaint._id || complaint.id,
        message: complaint.message || complaint.description || '',
        user_name: complaint.user_name || complaint.name || 'Anonymous',
        user_email: complaint.user_email || complaint.email || '',
        assigned_department: complaint.assigned_department || complaint.department || 'Not Assigned',
        priority: complaint.priority?.toLowerCase() || 'low',
        status: complaint.status?.toLowerCase() || 'pending',
        category: complaint.category?.toLowerCase() || 'other',
        created_at: complaint.created_at || complaint.submitted_date || new Date().toISOString(),
        updated_at: complaint.updated_at || complaint.created_at || new Date().toISOString(),
        // Preserve any additional fields that might be useful
        attachments: complaint.attachments || [],
        location: complaint.location || '',
        notes: complaint.notes || [],
        // Original data for reference if needed
        _original: complaint
    }));
};

/**
 * Normalizes a single complaint object
 * @param {Object} complaint - Single complaint data
 * @returns {Object} Normalized complaint object
 */
export const normalizeComplaint = (complaint) => {
    return normalizeComplaintsData([complaint])[0];
};

/**
 * Gets the appropriate color class for a priority level
 * @param {string} priority - The priority level (high, medium, low)
 * @returns {string} Tailwind CSS color classes
 */
export const getPriorityColorClass = (priority) => {
    switch (priority?.toLowerCase()) {
        case 'high':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low':
            return 'bg-green-100 text-green-800 border-green-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

/**
 * Gets the appropriate color class for a status
 * @param {string} status - The complaint status
 * @returns {string} Tailwind CSS color classes
 */
export const getStatusColorClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'in_progress':
        case 'in progress':
            return 'bg-blue-100 text-blue-800';
        case 'resolved':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Gets a formatted status label
 * @param {string} status - The complaint status
 * @returns {string} Formatted status label
 */
export const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
        case 'in_progress':
            return 'In Progress';
        case 'pending':
            return 'Pending';
        case 'resolved':
            return 'Resolved';
        case 'rejected':
            return 'Rejected';
        default:
            return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    }
};