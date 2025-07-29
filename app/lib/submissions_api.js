// app/lib/submissions_api.js - Submissions Listing API

import apiClient from './api';

export const submissionsListingAPI = {
  
  // ==================== GENERAL SUBMISSIONS LISTING ====================
  
  // Get all submissions (filtered by user role)
  async getAllSubmissions(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type = '',
        status = '',
        year_id = '',
        priority = '',
        search = '',
        sort_by = 'created_at',
        sort_order = 'desc'
      } = options;

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sort_by', sort_by);
      params.append('sort_order', sort_order);
      
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (year_id) params.append('year_id', year_id);
      if (priority) params.append('priority', priority);
      if (search) params.append('search', search);

      const response = await apiClient.get(`/submissions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  // Search submissions
  async searchSubmissions(keyword, options = {}) {
    try {
      const {
        page = 1,
        limit = 15,
        type = '',
        status = '',
        year_id = ''
      } = options;

      const params = new URLSearchParams();
      params.append('q', keyword);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (year_id) params.append('year_id', year_id);

      const response = await apiClient.get(`/submissions/search?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error searching submissions:', error);
      throw error;
    }
  },

  // ==================== ROLE-SPECIFIC SUBMISSIONS ====================
  
  // Get teacher's own submissions
  async getTeacherSubmissions(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type = '',
        status = ''
      } = options;

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (type) params.append('type', type);
      if (status) params.append('status', status);

      const response = await apiClient.get(`/teacher/submissions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching teacher submissions:', error);
      throw error;
    }
  },

  // Get submissions for staff review
  async getStaffSubmissions(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type = '',
        status = '',
        priority = ''
      } = options;

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);

      const response = await apiClient.get(`/staff/submissions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching staff submissions:', error);
      throw error;
    }
  },

  // Get all submissions for admin
  async getAdminSubmissions(options = {}) {
    try {
      const {
        page = 1,
        limit = 25,
        type = '',
        status = '',
        year_id = '',
        user_id = '',
        date_from = '',
        date_to = ''
      } = options;

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (year_id) params.append('year_id', year_id);
      if (user_id) params.append('user_id', user_id);
      if (date_from) params.append('date_from', date_from);
      if (date_to) params.append('date_to', date_to);

      const response = await apiClient.get(`/admin/submissions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin submissions:', error);
      throw error;
    }
  },

  // ==================== HELPER FUNCTIONS ====================

  // Get submissions by type
  async getSubmissionsByType(submissionType, options = {}) {
    return this.getAllSubmissions({ ...options, type: submissionType });
  },

  // Get submissions by status
  async getSubmissionsByStatus(statusId, options = {}) {
    return this.getAllSubmissions({ ...options, status: statusId });
  },

  // Get pending submissions
  async getPendingSubmissions(options = {}) {
    return this.getAllSubmissions({ ...options, status: '1' });
  },

  // Get approved submissions
  async getApprovedSubmissions(options = {}) {
    return this.getAllSubmissions({ ...options, status: '2' });
  },

  // Get rejected submissions
  async getRejectedSubmissions(options = {}) {
    return this.getAllSubmissions({ ...options, status: '3' });
  },

  // Get publication reward submissions
  async getPublicationRewardSubmissions(options = {}) {
    return this.getSubmissionsByType('publication_reward', options);
  },

  // Get fund application submissions
  async getFundApplicationSubmissions(options = {}) {
    return this.getSubmissionsByType('fund_application', options);
  },

  // ==================== UTILITY FUNCTIONS ====================

  // Format submission for display
  formatSubmission(submission) {
    return {
      id: submission.submission_id,
      number: submission.submission_number,
      type: this.getSubmissionTypeLabel(submission.submission_type),
      status: this.getStatusLabel(submission.status?.status_name || 'Unknown'),
      priority: this.getPriorityLabel(submission.priority),
      submitter: `${submission.user?.user_fname || ''} ${submission.user?.user_lname || ''}`.trim(),
      year: submission.year?.year || 'N/A',
      created_at: new Date(submission.created_at).toLocaleDateString('th-TH'),
      submitted_at: submission.submitted_at 
        ? new Date(submission.submitted_at).toLocaleDateString('th-TH') 
        : 'ยังไม่ส่ง',
      raw: submission
    };
  },

  // Get submission type label
  getSubmissionTypeLabel(type) {
    const types = {
      'fund_application': 'ทุนวิจัย',
      'publication_reward': 'เงินรางวัลตีพิมพ์',
      'conference_grant': 'ทุนประชุมวิชาการ',
      'training_request': 'ทุนฝึกอบรม'
    };
    return types[type] || type;
  },

  // Get status label
  getStatusLabel(statusName) {
    const statuses = {
      'Pending': 'รอพิจารณา',
      'Approved': 'อนุมัติ',
      'Rejected': 'ไม่อนุมัติ',
      'Revision Required': 'ต้องแก้ไข'
    };
    return statuses[statusName] || statusName;
  },

  // Get priority label
  getPriorityLabel(priority) {
    const priorities = {
      'normal': 'ปกติ',
      'high': 'สูง',
      'urgent': 'ด่วน'
    };
    return priorities[priority] || priority;
  },

  // Get status color
  getStatusColor(statusId) {
    const colors = {
      1: 'yellow',    // Pending
      2: 'green',     // Approved
      3: 'red',       // Rejected
      4: 'orange'     // Revision Required
    };
    return colors[statusId] || 'gray';
  },

  // Get priority color
  getPriorityColor(priority) {
    const colors = {
      'normal': 'blue',
      'high': 'orange', 
      'urgent': 'red'
    };
    return colors[priority] || 'gray';
  }
};

export default submissionsListingAPI;