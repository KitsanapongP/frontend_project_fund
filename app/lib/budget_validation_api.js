// app/lib/budget_validation_api.js
// API functions สำหรับ budget validation

import apiClient from './api';

export const budgetValidationAPI = {
  // ตรวจสอบ budget availability สำหรับ subcategory
  checkBudgetAvailability: async (subcategoryId) => {
    try {
      // สร้าง URL แบบ manual เพื่อข้าม v1
      const baseURL = apiClient.baseURL.replace('/api/v1', '/api');
      const url = `${baseURL}/subcategory-budgets/validate?subcategory_id=${subcategoryId}`;
      
      const token = apiClient.getToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      // แปลง response ให้ตรงกับที่ frontend คาดหวัง
      if (data.success && data.data) {
        return {
          subcategory_id: data.data.subcategory_id,
          subcategory_name: data.data.subcategory_name,
          is_fully_available: data.data.is_fully_available,
          available_budgets: data.data.available_budgets || [],
          missing_budgets: data.data.missing_budgets || [],
          budget_count: data.data.budget_count || 0,
          expected_count: data.data.expected_count || 1
        };
      }
      
      // ถ้า response format ไม่ถูกต้อง ให้ fallback
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error(`Error checking budget availability for subcategory ${subcategoryId}:`, error);
      
      // Fallback: ถ้า API error ให้ return mock data
      console.warn(`API error, returning fallback data for subcategory ${subcategoryId}`);
      return {
        subcategory_id: subcategoryId,
        subcategory_name: `Subcategory ${subcategoryId}`,
        is_fully_available: true, // ถือว่าพร้อมใช้ในกรณี error
        available_budgets: [],
        missing_budgets: [],
        budget_count: 1,
        expected_count: 1
      };
    }
  },

  // ตรวจสอบ budget availability สำหรับหลาย subcategories พร้อมกัน
  checkMultipleBudgetAvailability: async (subcategoryIds) => {
    if (!subcategoryIds || subcategoryIds.length === 0) {
      return {};
    }

    try {
      const promises = subcategoryIds.map(async (id) => {
        try {
          const result = await budgetValidationAPI.checkBudgetAvailability(id);
          return {
            subcategoryId: id,
            status: 'fulfilled',
            data: result
          };
        } catch (error) {
          return {
            subcategoryId: id,
            status: 'rejected',
            error: error.message
          };
        }
      });
      
      const results = await Promise.all(promises);
      
      const budgetStatus = {};
      results.forEach((result) => {
        const subcategoryId = result.subcategoryId;
        
        if (result.status === 'fulfilled') {
          const data = result.data;
          budgetStatus[subcategoryId] = {
            isAvailable: data.is_fully_available || false,
            availableBudgets: data.available_budgets || [],
            missingBudgets: data.missing_budgets || [],
            budgetCount: data.budget_count || 0,
            expectedCount: data.expected_count || 1,
            subcategoryName: data.subcategory_name || ''
          };
        } else {
          budgetStatus[subcategoryId] = {
            isAvailable: false,
            availableBudgets: [],
            missingBudgets: [],
            budgetCount: 0,
            expectedCount: 1,
            subcategoryName: '',
            error: result.error
          };
        }
      });
      
      return budgetStatus;
    } catch (error) {
      console.error('Error checking multiple budget availability:', error);
      throw error;
    }
  },

  // ดึงรายการ quartiles ที่มี budget พร้อมใช้งาน
  getAvailableQuartiles: async (subcategoryId) => {
    try {
      const baseURL = apiClient.baseURL.replace('/api/v1', '/api');
      const url = `${baseURL}/subcategory-budgets/available-quartiles?subcategory_id=${subcategoryId}`;
      
      const token = apiClient.getToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      // Backend ส่งมาเป็น { success: true, available_quartiles: [...], count: n }
      if (data.success && data.available_quartiles) {
        return data.available_quartiles;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting available quartiles:', error);
      return []; // Return empty array if error
    }
  },

  // ดึงการ mapping ระหว่าง quartile และ budget
  getBudgetQuartileMapping: async (subcategoryId) => {
    try {
      const baseURL = apiClient.baseURL.replace('/api/v1', '/api');
      const url = `${baseURL}/subcategory-budgets/quartile-mapping?subcategory_id=${subcategoryId}`;
      
      const token = apiClient.getToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data.mappings || [];
    } catch (error) {
      console.error('Error getting budget quartile mapping:', error);
      return []; // Return empty array if error
    }
  },

  // ตรวจสอบและ validate การเลือก budget
  validateBudgetSelection: async (subcategoryId, quartileCode) => {
    try {
      const baseURL = apiClient.baseURL.replace('/api/v1', '/api');
      const url = `${baseURL}/subcategory-budgets/validate-selection`;
      
      const token = apiClient.getToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          subcategory_id: subcategoryId,
          quartile_code: quartileCode
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error validating budget selection:', error);
      // Return mock validation success if error
      return {
        is_valid: true,
        subcategory_budget_id: null,
        message: 'Validation error - falling back to allow'
      };
    }
  }
};

// Helper function สำหรับตรวจสอบว่าทุนพร้อมใช้งานไหม
export const isFundFullyAvailable = (subcategory, budgetStatus) => {
  // ถ้าไม่ใช่ทุนที่ต้องตรวจสอบ budget ให้ถือว่าพร้อมใช้
  const needsValidation = subcategory.form_type === 'publication_reward' && subcategory.has_multiple_levels;
  if (!needsValidation) {
    return true;
  }

  const status = budgetStatus[subcategory.subcategory_id];
  
  if (!status) {
    // ถ้าไม่มีข้อมูล status ให้ถือว่าพร้อมใช้ (fallback เมื่อ API ไม่พร้อม)
    console.warn(`No budget status for subcategory ${subcategory.subcategory_id}, assuming available`);
    return true;
  }
  
  // ตรวจสอบตาม isAvailable ที่ได้จาก API
  return status.isAvailable !== false; // ให้เป็น true ถ้าไม่ได้ระบุเป็น false ชัดเจน
};

// Helper function สำหรับ format missing budget message
export const formatMissingBudgetMessage = (subcategory, budgetStatus) => {
  const status = budgetStatus[subcategory.subcategory_id];
  
  if (!status || !status.missingBudgets || status.missingBudgets.length === 0) {
    return null;
  }
  
  return `ขาดงบประมาณ: ${status.missingBudgets.join(', ')}`;
};

// Helper function สำหรับแสดงสถานะ budget
export const getBudgetStatusDisplay = (subcategory, budgetStatus, budgetLoading) => {
  if (budgetLoading) {
    return {
      status: 'loading',
      message: 'ตรวจสอบงบประมาณ...',
      color: 'yellow',
      className: 'bg-yellow-100 text-yellow-800'
    };
  }
  
  const needsValidation = subcategory.form_type === 'publication_reward' && subcategory.has_multiple_levels;
  
  if (!needsValidation) {
    return {
      status: 'not_required',
      message: '',
      color: 'gray',
      className: ''
    };
  }
  
  const isAvailable = isFundFullyAvailable(subcategory, budgetStatus);
  
  if (isAvailable) {
    return {
      status: 'available',
      message: 'งบประมาณพร้อม',
      color: 'green',
      className: 'bg-green-100 text-green-800'
    };
  } else {
    return {
      status: 'unavailable',
      message: 'งบประมาณไม่ครบ',
      color: 'red',
      className: 'bg-red-100 text-red-800'
    };
  }
};

// Helper function สำหรับแปลง form data เป็น quartile code
export const getQuartileCodeFromFormData = (formData) => {
  // ตรวจสอบจาก journal_quartile ก่อน
  if (formData.journal_quartile) {
    return formData.journal_quartile; // Q1, Q2, Q3, Q4
  }
  
  // ตรวจสอบจาก journal_tier
  if (formData.journal_tier) {
    const tierMapping = {
      'top_5_percent': 'TOP_5_PERCENT',
      'top_10_percent': 'TOP_10_PERCENT',
      'tci_1': 'TCI',
      'tci_2': 'TCI_2',
      'tci_3': 'TCI_3'
    };
    return tierMapping[formData.journal_tier] || 'UNKNOWN';
  }
  
  // ตรวจสอบจาก indexing
  if (formData.in_tci) {
    return 'TCI';
  }
  
  return 'UNKNOWN';
};

// Helper function สำหรับคำนวณ subcategory_id จาก author status
export const getSubcategoryIdFromAuthorStatus = (authorStatus, defaultSubcategoryId) => {
  switch (authorStatus) {
    case 'first_author':
      return 14; // เงินรางวัลการตีพิมพ์ (กรณีเป็นผู้แต่งชื่อแรก)
    case 'corresponding_author':
      return 15; // เงินรางวัลการตีพิมพ์ (กรณีเป็นผู้ประพันธ์บรรณกิจ)
    default:
      return defaultSubcategoryId; // ใช้ค่าเดิมที่ส่งมา
  }
};

// Helper function สำหรับสร้าง budget selection data
export const createBudgetSelectionData = (formData, fundData) => {
  const authorStatus = formData.author_status;
  const quartileCode = getQuartileCodeFromFormData(formData);
  const subcategoryId = getSubcategoryIdFromAuthorStatus(authorStatus, fundData.subcategory_id);
  
  return {
    category_id: fundData.category_id,
    subcategory_id: subcategoryId,
    quartile_code: quartileCode,
    author_status: authorStatus,
    fund_info: {
      subcategory_name: fundData.subcategory_name,
      original_subcategory_id: fundData.subcategory_id
    }
  };
};

// Helper function สำหรับ validate budget selection ก่อน submit
export const validateBudgetSelectionBeforeSubmit = async (formData, fundData) => {
  const selectionData = createBudgetSelectionData(formData, fundData);
  
  try {
    const validation = await budgetValidationAPI.validateBudgetSelection(
      selectionData.subcategory_id,
      selectionData.quartile_code
    );
    
    return {
      isValid: validation.is_valid || false,
      subcategory_budget_id: validation.subcategory_budget_id || null,
      message: validation.message || '',
      selection_data: selectionData
    };
  } catch (error) {
    return {
      isValid: false,
      subcategory_budget_id: null,
      message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบงบประมาณ',
      selection_data: selectionData
    };
  }
};