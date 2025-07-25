// app/lib/form_type_config.js
export const FORM_TYPE_CONFIG = {
  'publication_reward': {
    component: 'PublicationRewardForm',
    route: 'publication-reward-form',
    buttonText: 'กรอกแบบฟอร์ม',
    buttonIcon: 'FileText', // หรือ icon อื่นๆ
    isOnlineForm: true
  },
  'research_proposal': {
    component: 'ResearchProposalForm', 
    route: 'research-proposal-form',
    buttonText: 'กรอกแบบฟอร์ม',
    buttonIcon: 'FileText',
    isOnlineForm: true
  },
  'activity_proposal': {
    component: 'ActivityProposalForm',
    route: 'activity-proposal-form', 
    buttonText: 'กรอกแบบฟอร์ม',
    buttonIcon: 'FileText',
    isOnlineForm: true
  },
  'download': {
    component: null,
    route: null,
    buttonText: 'ดาวน์โหลดฟอร์ม',
    buttonIcon: 'Download',
    isOnlineForm: false
  }
};