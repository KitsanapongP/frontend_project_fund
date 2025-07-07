// app/lib/target_roles_utils.js - Shared utilities for working with target_roles

import apiClient from './api';

// Utility functions for working with target_roles
export const targetRolesUtils = {
  
  // Parse target_roles JSON string
  parseTargetRoles(targetRolesString) {
    if (!targetRolesString) {
      return [];
    }
    
    try {
      return JSON.parse(targetRolesString);
    } catch (error) {
      console.error('Error parsing target_roles:', error);
      return [];
    }
  },

  // Check if current user can see a fund based on target_roles
  canUserSeeFund(targetRoles, userRoleId) {
    // Admin sees everything
    if (userRoleId === 3) {
      return true;
    }
    
    // If no target_roles specified, everyone can see it
    if (!targetRoles || targetRoles.length === 0) {
      return true;
    }
    
    // Check if user's role is in target_roles
    return targetRoles.includes(userRoleId.toString());
  },

  // Format target_roles for display
  formatTargetRolesForDisplay(targetRoles) {
    if (!targetRoles || targetRoles.length === 0) {
      return 'ทุกบทบาท';
    }
    
    const roleNames = {
      '1': 'อาจารย์',
      '2': 'เจ้าหน้าที่', 
      '3': 'ผู้ดูแลระบบ'
    };
    
    return targetRoles.map(roleId => roleNames[roleId] || `Role ${roleId}`).join(', ');
  },

  // Validate target_roles array
  validateTargetRoles(targetRoles) {
    if (!Array.isArray(targetRoles)) {
      return { valid: false, error: 'target_roles must be an array' };
    }
    
    const validRoles = ['1', '2', '3'];
    const invalidRoles = targetRoles.filter(role => !validRoles.includes(role.toString()));
    
    if (invalidRoles.length > 0) {
      return { 
        valid: false, 
        error: `Invalid role IDs: ${invalidRoles.join(', ')}` 
      };
    }
    
    return { valid: true };
  },

  // Get current user's role and permissions
  async getCurrentUserRole() {
    try {
      const user = apiClient.getUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      return {
        role_id: user.role_id,
        role_name: user.role?.role || 'unknown',
        can_see_all_funds: user.role_id === 3, // Admin
        is_teacher: user.role_id === 1,
        is_staff: user.role_id === 2,
        is_admin: user.role_id === 3
      };
    } catch (error) {
      console.error('Error getting user role:', error);
      throw error;
    }
  },

  // Convert role name to role ID
  getRoleId(roleName) {
    const roleMap = {
      'teacher': 1,
      'staff': 2,
      'admin': 3
    };
    return roleMap[roleName.toLowerCase()] || null;
  },

  // Convert role ID to role name
  getRoleName(roleId) {
    const roleMap = {
      1: 'teacher',
      2: 'staff',
      3: 'admin'
    };
    return roleMap[roleId] || 'unknown';
  },

  // Get display name for role
  getRoleDisplayName(roleId) {
    const displayNames = {
      1: 'อาจารย์',
      2: 'เจ้าหน้าที่',
      3: 'ผู้ดูแลระบบ'
    };
    return displayNames[roleId] || 'ไม่ระบุ';
  }
};

export default targetRolesUtils;