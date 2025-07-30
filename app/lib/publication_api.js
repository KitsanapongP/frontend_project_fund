// app/lib/publication_api.js - Updated with submissionUsersAPI
import apiClient from './api';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Submission Management API (ตาม API docs)
export const submissionAPI = {
  // Create new submission
  async create(data) {
    try {
      const response = await apiClient.post('/submissions', {
        submission_type: data.submission_type,
        year_id: data.year_id,
      });
      return response;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  },

  // Get submission by ID
  async getById(id) {
    try {
      const response = await apiClient.get(`/submissions/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
  },

  // Update submission (only drafts)
  async update(id, data) {
    try {
      const response = await apiClient.put(`/submissions/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  },

  // Delete submission (only drafts)
  async delete(id) {
    try {
      const response = await apiClient.delete(`/submissions/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  },

  // Submit submission (change status)
  async submit(id) {
    try {
      const response = await apiClient.post(`/submissions/${id}/submit`);
      return response;
    } catch (error) {
      console.error('Error submitting:', error);
      throw error;
    }
  }
};

// Submission Users Management API
export const submissionUsersAPI = {
  
  // 1. Add user to submission (co-author)
  async addUser(submissionId, userData) {
    try {
      const response = await apiClient.post(`/submissions/${submissionId}/users`, userData);
      return response;
    } catch (error) {
      console.error('Error adding user to submission:', error);
      throw error;
    }
  },

  // 2. Get all users for submission
  async getUsers(submissionId) {
    try {
      const response = await apiClient.get(`/submissions/${submissionId}/users`);
      return response;
    } catch (error) {
      console.error('Error fetching submission users:', error);
      throw error;
    }
  },

  // 3. Update user role in submission
  async updateUser(submissionId, userId, updateData) {
    try {
      const response = await apiClient.put(`/submissions/${submissionId}/users/${userId}`, updateData);
      return response;
    } catch (error) {
      console.error('Error updating submission user:', error);
      throw error;
    }
  },

  // 4. Remove user from submission
  async removeUser(submissionId, userId) {
    try {
      const response = await apiClient.delete(`/submissions/${submissionId}/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Error removing user from submission:', error);
      throw error;
    }
  },

  // 5. Add multiple users at once (batch operation)
  async addMultipleUsers(submissionId, usersData) {
    try {
      const response = await apiClient.post(`/submissions/${submissionId}/users/batch`, {
        users: usersData
      });
      return response;
    } catch (error) {
      console.error('Error adding multiple users to submission:', error);
      throw error;
    }
  },

  // 6. Set all co-authors (replace existing)
  async setCoauthors(submissionId, coauthors) {
    try {
      // Prepare users data with co-author role
      const usersData = coauthors.map((coauthor, index) => ({
        user_id: coauthor.user_id,
        role: 'co_author',
        order_sequence: index + 2, // Start from 2 (1 is main author)
        is_active: true
      }));

      const response = await apiClient.post(`/submissions/${submissionId}/users/set-coauthors`, {
        coauthors: usersData
      });
      return response;
    } catch (error) {
      console.error('Error setting co-authors:', error);
      throw error;
    }
  }
};

// Publication Details API
export const publicationDetailsAPI = {
  // Add publication details to submission
  async add(submissionId, details) {
    try {
      const response = await apiClient.post(`/submissions/${submissionId}/publication-details`, {
        article_title: details.article_title,
        journal_name: details.journal_name,
        publication_date: details.publication_date,
        publication_type: details.publication_type || 'journal',
        journal_quartile: details.journal_quartile,
        impact_factor: details.impact_factor,
        doi: details.doi,
        url: details.url,
        page_numbers: details.page_numbers,
        volume_issue: details.volume_issue,
        indexing: details.indexing,
        
        // เงินรางวัลและการคำนวณ
        publication_reward: details.reward_amount,
        revision_fee: details.revision_fee,
        publication_fee: details.publication_fee,
        external_funding_amount: details.external_funding_amount,
        total_amount: details.total_amount,
        
        // ข้อมูลผู้แต่ง
        author_count: details.author_count,
        is_corresponding_author: details.is_corresponding_author,
        author_status: details.author_status,
        
        // ข้อมูลธนาคาร
        bank_account: details.bank_account,
        bank_name: details.bank_name,
        phone_number: details.phone_number,
        
        // อื่นๆ
        university_ranking: details.university_ranking,
        has_university_fund: details.has_university_fund,
        university_fund_ref: details.university_fund_ref
      });
      return response;
    } catch (error) {
      console.error('Error adding publication details:', error);
      throw error;
    }
  }
};

// File Management API
export const fileAPI = {
  // Upload file
  async upload(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Get file by ID
  async getById(fileId) {
    try {
      const response = await apiClient.get(`/files/${fileId}`);
      return response;
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  },

  // Download file
  async download(fileId) {
    try {
      const response = await apiClient.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  // Delete file
  async delete(fileId) {
    try {
      const response = await apiClient.delete(`/files/${fileId}`);
      return response;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};

// Document Management API
export const documentAPI = {
  // Attach document to submission
  async attach(submissionId, documentData) {
    try {
      const response = await apiClient.post(`/submissions/${submissionId}/documents`, {
        file_id: documentData.file_id,
        document_type_id: documentData.document_type_id,
        description: documentData.description,
        display_order: documentData.display_order || 1
      });
      return response;
    } catch (error) {
      console.error('Error attaching document:', error);
      throw error;
    }
  },

  // Get submission documents
  async getBySubmission(submissionId) {
    try {
      const response = await apiClient.get(`/submissions/${submissionId}/documents`);
      return response;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Remove document from submission
  async detach(submissionId, documentId) {
    try {
      const response = await apiClient.delete(`/submissions/${submissionId}/documents/${documentId}`);
      return response;
    } catch (error) {
      console.error('Error detaching document:', error);
      throw error;
    }
  }
};

// Combined Publication Reward API (ใช้ APIs ด้านบนร่วมกัน)
export const publicationRewardAPI = {
  // Create complete publication reward application
  async createApplication(applicationData) {
    try {
      const {
        // Submission data
        year_id,
        
        // Publication details
        article_title,
        journal_name,
        journal_month,
        journal_year,
        journal_quartile,
        impact_factor,
        doi,
        journal_url,
        journal_pages,
        journal_issue,
        article_online_db,
        publication_reward,
        author_status,
        author_count,
        
        // Files
        uploadedFiles = {},
        otherDocuments = [],
        
        // Co-authors
        coauthors = []
      } = applicationData;

      // Step 1: Create submission
      const submissionResponse = await submissionAPI.create({
        submission_type: 'publication_reward',
        year_id,
      });
      
      const submissionId = submissionResponse.submission.submission_id;

      // Step 2: Add co-authors to submission_users
      if (coauthors && coauthors.length > 0) {
        try {
          await submissionUsersAPI.setCoauthors(submissionId, coauthors);
          console.log('Co-authors added successfully');
        } catch (error) {
          console.error('Error adding co-authors:', error);
          // Don't throw error here, continue with submission
        }
      }

      // Step 3: Add publication details
      const publicationDate = journal_year && journal_month 
        ? `${journal_year}-${journal_month.padStart(2, '0')}-01`
        : new Date().toISOString().split('T')[0];

      await publicationDetailsAPI.add(submissionId, {
        article_title,
        journal_name,
        publication_date: publicationDate,
        publication_type: 'journal',
        journal_quartile,
        impact_factor: parseFloat(impact_factor) || null,
        doi,
        url: journal_url,
        page_numbers: journal_pages,
        volume_issue: journal_issue,
        indexing: article_online_db,
        publication_reward: parseFloat(publication_reward),
        author_count: author_count || 1,
        is_corresponding_author: author_status === 'corresponding_author',
        author_status
      });

      // Step 4: Upload files and attach documents
      const uploadPromises = [];

      // Upload main article file
      if (uploadedFiles.article_file && uploadedFiles.article_file.length > 0) {
        uploadPromises.push(
          fileAPI.upload(uploadedFiles.article_file[0])
            .then(res => documentAPI.attach(submissionId, {
              file_id: res.file.file_id,
              document_type_id: 1, // Assuming 1 is for article file
              description: 'ไฟล์บทความที่ตีพิมพ์'
            }))
        );
      }

      // Upload other documents
      otherDocuments.forEach((doc, index) => {
        if (doc.file) {
          uploadPromises.push(
            fileAPI.upload(doc.file)
              .then(res => documentAPI.attach(submissionId, {
                file_id: res.file.file_id,
                document_type_id: doc.documentTypeId || 99, // Use provided type or default
                description: doc.description || `เอกสารอื่นๆ ${index + 1}`
              }))
          );
        }
      });

      await Promise.all(uploadPromises);

      return {
        success: true,
        submission: submissionResponse.submission,
        submissionId
      };
      
    } catch (error) {
      console.error('Error creating publication reward application:', error);
      throw error;
    }
  },

  // Submit application
  async submitApplication(submissionId) {
    try {
      const response = await submissionAPI.submit(submissionId);
      return response;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  },

  // Get publication reward by submission ID
  async getBySubmissionId(submissionId) {
    try {
      const response = await submissionAPI.getById(submissionId);
      return response;
    } catch (error) {
      console.error('Error fetching publication reward:', error);
      throw error;
    }
  }
};

// Helper API for form data
export const publicationFormAPI = {
  async getUsers(role = null) {
    try {
      const params = role ? { role } : {};
      const response = await apiClient.get('/users', params);
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getDocumentTypes() {
    try {
      const response = await apiClient.get('/document-types', { category: 'publication' });
      return response;
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw error;
    }
  }
};

// Export all APIs
export default {
  submission: submissionAPI,
  submissionUsers: submissionUsersAPI,
  publicationDetails: publicationDetailsAPI,
  file: fileAPI,
  document: documentAPI,
  publicationReward: publicationRewardAPI,
  form: publicationFormAPI
};