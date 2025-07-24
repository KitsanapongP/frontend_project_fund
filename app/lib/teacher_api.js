// app/lib/teacher_api.js - Teacher specific API methods (Updated with Submission Management)

import apiClient from '../lib/api';
import { targetRolesUtils } from '../lib/target_roles_utils';

// Teacher API methods for role-based fund access
export const teacherAPI = {
  
  // Get all categories and subcategories visible to teacher
  async getVisibleFundsStructure(year = '2568') {
    try {
      console.log('Getting teacher funds structure for year:', year);

      // Step 1: Get years to convert year to year_id
      const yearsResponse = await apiClient.get('/years');
      console.log('Years response:', yearsResponse);
      
      // Handle different response formats
      const yearsData = yearsResponse.years || yearsResponse.data || [];
      
      if (!Array.isArray(yearsData) || yearsData.length === 0) {
        throw new Error('No years data available');
      }

      const targetYear = yearsData.find(y => y.year === year);
      if (!targetYear) {
        throw new Error(`Year ${year} not found`);
      }

      // Step 2: Get categories for the year
      const categoriesResponse = await apiClient.get('/categories', { 
        year_id: targetYear.year_id 
      });
      console.log('Categories response:', categoriesResponse);

      if (!categoriesResponse.categories) {
        return { categories: [] };
      }

      // Step 3: Get subcategories for each category - Teacher specific endpoint
      const categoriesWithSubs = await Promise.all(
        categoriesResponse.categories.map(async (category) => {
          try {
            console.log(`Getting teacher subcategories for category ${category.category_id}`);
            
            // เรียก Teacher specific endpoint
            const subResponse = await apiClient.get('/teacher/subcategories', {
              category_id: category.category_id,
              year_id: targetYear.year_id
            });
            
            console.log(`Teacher subcategories for category ${category.category_id}:`, subResponse);
            
            return {
              ...category,
              subcategories: subResponse.subcategories || []
            };
          } catch (error) {
            console.error(`Error fetching teacher subcategories for category ${category.category_id}:`, error);
            return {
              ...category,
              subcategories: []
            };
          }
        })
      );

      // Filter out categories with no visible subcategories
      const filteredCategories = categoriesWithSubs.filter(
        cat => cat.subcategories && cat.subcategories.length > 0
      );

      console.log('Final teacher result:', filteredCategories);

      return {
        categories: filteredCategories,
        year: year,
        year_id: targetYear.year_id
      };
    } catch (error) {
      console.error('Error fetching teacher funds structure:', error);
      throw error;
    }
  },

  // Get subcategories visible to teacher role
  async getVisibleSubcategories(categoryId = null, yearId = null) {
    try {
      const params = {};
      if (categoryId) params.category_id = categoryId;
      if (yearId) params.year_id = yearId;
      
      console.log('Getting teacher subcategories with params:', params);
      
      // เรียก Teacher specific endpoint
      const response = await apiClient.get('/teacher/subcategories', params);
      console.log('Teacher subcategories response:', response);
      
      return response;
    } catch (error) {
      console.error('Error fetching teacher subcategories:', error);
      throw error;
    }
  },

  // Check if a specific fund is visible to teacher
  async checkFundVisibility(subcategoryId) {
    try {
      const response = await apiClient.get('/teacher/subcategories', {
        subcategory_id: subcategoryId
      });
      
      return response.subcategories && response.subcategories.length > 0;
    } catch (error) {
      console.error('Error checking teacher fund visibility:', error);
      return false;
    }
  },

  // Get teacher dashboard stats
  async getDashboardStats() {
    try {
      const response = await apiClient.get('/teacher/dashboard/stats');
      return response;
    } catch (error) {
      console.error('Error fetching teacher dashboard stats:', error);
      throw error;
    }
  },

  // Get teacher's applications
  async getMyApplications(params = {}) {
    try {
      const response = await apiClient.get('/teacher/applications', params);
      return response;
    } catch (error) {
      console.error('Error fetching teacher applications:', error);
      throw error;
    }
  },

  // Submit new application (legacy method - ใช้งานเก่า)
  async submitApplication(applicationData) {
    try {
      const response = await apiClient.post('/applications', applicationData);
      return response;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  },

  // Get current teacher profile
  async getProfile() {
    try {
      const response = await apiClient.get('/profile');
      return response;
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      throw error;
    }
  }
};

// ==================== NEW SUBMISSION MANAGEMENT API ====================

export const submissionAPI = {
  
  // 1. Get user's submissions with filters
  async getSubmissions(params = {}) {
    try {
      const response = await apiClient.get('/submissions', params);
      return response;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  // 2. Create new submission
  async createSubmission(submissionData) {
    try {
      const response = await apiClient.post('/submissions', submissionData);
      return response;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  },

  // 3. Get specific submission with details
  async getSubmission(submissionId) {
    try {
      const response = await apiClient.get(`/submissions/${submissionId}`);
      return response;
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
  },

  // 4. Update submission (draft only)
  async updateSubmission(submissionId, updateData) {
    try {
      const response = await apiClient.put(`/submissions/${submissionId}`, updateData);
      return response;
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  },

  // 5. Delete submission (unsubmitted only)
  async deleteSubmission(submissionId) {
    try {
      const response = await apiClient.delete(`/submissions/${submissionId}`);
      return response;
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  },

  // 6. Submit submission (change status to submitted)
  async submitSubmission(submissionId) {
    try {
      const response = await apiClient.post(`/submissions/${submissionId}/submit`);
      return response;
    } catch (error) {
      console.error('Error submitting submission:', error);
      throw error;
    }
  }
};

// ==================== FILE UPLOAD API ====================

export const fileAPI = {
  
  // 1. Upload file
  async uploadFile(file) {
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

  // 2. Get file info
  async getFileInfo(fileId) {
    try {
      const response = await apiClient.get(`/files/${fileId}`);
      return response;
    } catch (error) {
      console.error('Error fetching file info:', error);
      throw error;
    }
  },

  // 3. Download file
  async downloadFile(fileId) {
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

  // 4. Delete file
  async deleteFile(fileId) {
    try {
      const response = await apiClient.delete(`/files/${fileId}`);
      return response;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};

// ==================== DOCUMENT MANAGEMENT API ====================

export const documentAPI = {
  
  // 1. Attach document to submission
  async attachDocument(submissionId, documentData) {
    try {
      const response = await apiClient.post(`/submissions/${submissionId}/documents`, documentData);
      return response;
    } catch (error) {
      console.error('Error attaching document:', error);
      throw error;
    }
  },

  // 2. Get submission documents
  async getSubmissionDocuments(submissionId) {
    try {
      const response = await apiClient.get(`/submissions/${submissionId}/documents`);
      return response;
    } catch (error) {
      console.error('Error fetching submission documents:', error);
      throw error;
    }
  },

  // 3. Detach document from submission
  async detachDocument(submissionId, documentId) {
    try {
      const response = await apiClient.delete(`/submissions/${submissionId}/documents/${documentId}`);
      return response;
    } catch (error) {
      console.error('Error detaching document:', error);
      throw error;
    }
  }
};

// ==================== FUND APPLICATION DETAILS API ====================

export const fundApplicationAPI = {
  
  // Create fund application with all details and files
  async createApplication(applicationData) {
    try {
      console.log('Creating fund application:', applicationData);
      
      const {
        // Basic submission data
        submission_type = 'fund_application',
        year_id,
        priority = 'normal',
        
        // Fund application details
        project_title,
        project_description,
        requested_amount,
        subcategory_id,
        
        // Files
        uploadedFiles = {},
        
        // Other data
        ...otherData
      } = applicationData;

      // Step 1: Create submission
      const submissionResponse = await submissionAPI.createSubmission({
        submission_type,
        year_id,
        priority
      });
      
      const submissionId = submissionResponse.submission.submission_id;
      console.log('Created submission:', submissionId);

      // Step 2: Upload files and attach documents
      const uploadPromises = Object.entries(uploadedFiles).map(async ([documentTypeId, file]) => {
        if (file) {
          try {
            // Upload file
            const fileResponse = await fileAPI.uploadFile(file);
            const fileId = fileResponse.file.file_id;
            
            // Attach to submission
            await documentAPI.attachDocument(submissionId, {
              file_id: fileId,
              document_type_id: parseInt(documentTypeId)
            });
            
            return { documentTypeId, fileId, success: true };
          } catch (error) {
            console.error(`Error uploading file for document type ${documentTypeId}:`, error);
            return { documentTypeId, error, success: false };
          }
        }
      });

      const uploadResults = await Promise.all(uploadPromises.filter(Boolean));
      console.log('File upload results:', uploadResults);

      // Step 3: Add fund application details
      const detailsResponse = await apiClient.post(`/submissions/${submissionId}/fund-details`, {
        project_title,
        project_description,
        requested_amount: parseFloat(requested_amount) || 0,
        subcategory_id: parseInt(subcategory_id),
        ...otherData
      });

      return {
        success: true,
        submission: submissionResponse.submission,
        details: detailsResponse,
        uploadResults
      };
      
    } catch (error) {
      console.error('Error creating fund application:', error);
      throw error;
    }
  },

  // Submit fund application (change status to submitted)
  async submitApplication(submissionId) {
    try {
      const response = await submissionAPI.submitSubmission(submissionId);
      return response;
    } catch (error) {
      console.error('Error submitting fund application:', error);
      throw error;
    }
  }
};

// ==================== PUBLICATION REWARD API ====================

export const publicationRewardAPI = {
  
  // Create publication reward application with all details and files
  async createApplication(applicationData) {
    try {
      console.log('Creating publication reward application:', applicationData);
      
      const {
        // Basic submission data
        submission_type = 'publication_reward',
        year_id,
        priority = 'normal',
        
        // Publication details
        author_status,
        article_title,
        journal_name,
        journal_quartile,
        publication_reward,
        
        // Files
        uploadedFiles = {},
        otherDocuments = [],
        
        // Coauthors
        coauthors = [],
        
        // Other data
        ...otherData
      } = applicationData;

      // Step 1: Create submission
      const submissionResponse = await submissionAPI.createSubmission({
        submission_type,
        year_id,
        priority
      });
      
      const submissionId = submissionResponse.submission.submission_id;
      console.log('Created submission:', submissionId);

      // Step 2: Upload files and attach documents
      const uploadPromises = [];
      
      // Regular documents
      Object.entries(uploadedFiles).forEach(([documentTypeId, file]) => {
        if (file) {
          uploadPromises.push(
            fileAPI.uploadFile(file).then(fileResponse => 
              documentAPI.attachDocument(submissionId, {
                file_id: fileResponse.file.file_id,
                document_type_id: parseInt(documentTypeId)
              })
            )
          );
        }
      });

      // Other documents (multiple files)
      otherDocuments.forEach((file, index) => {
        uploadPromises.push(
          fileAPI.uploadFile(file).then(fileResponse => 
            documentAPI.attachDocument(submissionId, {
              file_id: fileResponse.file.file_id,
              document_type_id: 11, // Other documents type
              description: `เอกสารอื่นๆ ${index + 1}`
            })
          )
        );
      });

      await Promise.all(uploadPromises);
      console.log('Files uploaded and attached successfully');

      // Step 3: Add publication reward details
      const detailsResponse = await apiClient.post(`/submissions/${submissionId}/publication-details`, {
        author_status,
        article_title,
        journal_name,
        journal_quartile,
        publication_reward: parseFloat(publication_reward) || 0,
        coauthors,
        ...otherData
      });

      return {
        success: true,
        submission: submissionResponse.submission,
        details: detailsResponse
      };
      
    } catch (error) {
      console.error('Error creating publication reward application:', error);
      throw error;
    }
  },

  // Submit publication reward application
  async submitApplication(submissionId) {
    try {
      const response = await submissionAPI.submitSubmission(submissionId);
      return response;
    } catch (error) {
      console.error('Error submitting publication reward application:', error);
      throw error;
    }
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const submissionUtils = {
  
  // Get submission type display name
  getSubmissionTypeName(type) {
    const types = {
      'fund_application': 'ใบสมัครทุนวิจัย',
      'publication_reward': 'เงินรางวัลตีพิมพ์',
      'conference_grant': 'ทุนประชุมวิชาการ',
      'training_request': 'ขอทุนฝึกอบรม'
    };
    return types[type] || type;
  },

  // Get submission status display name
  getStatusName(statusId) {
    const statuses = {
      1: 'รอพิจารณา',
      2: 'อนุมัติ',
      3: 'ไม่อนุมัติ',
      4: 'ต้องแก้ไข'
    };
    return statuses[statusId] || 'ไม่ทราบสถานะ';
  },

  // Format submission number for display
  formatSubmissionNumber(number) {
    return number || 'ยังไม่ได้กำหนด';
  },

  // Check if submission can be edited
  canEdit(submission) {
    return submission.status_id === 1 && !submission.submitted_at;
  },

  // Check if submission can be deleted
  canDelete(submission) {
    return submission.status_id === 1 && !submission.submitted_at;
  }
};

// Default export - รวม legacy teacherAPI
export default {
  ...teacherAPI,
  submission: submissionAPI,
  file: fileAPI,
  document: documentAPI,
  fundApplication: fundApplicationAPI,
  publicationReward: publicationRewardAPI,
  utils: submissionUtils
};