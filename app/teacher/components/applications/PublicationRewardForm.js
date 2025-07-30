// app/teacher/components/applications/PublicationRewardForm.js - Complete Version with Submission Management API
"use client";

import { useState, useEffect } from "react";
import { Award, Upload, Users, FileText, Plus, X, Save, Send, AlertCircle, Search, Eye, Calculator  } from "lucide-react";
import PageLayout from "../common/PageLayout";
import SimpleCard from "../common/SimpleCard";
import { systemAPI, authAPI } from '../../../lib/api';
import { 
  submissionAPI, 
  publicationDetailsAPI, 
  fileAPI, 
  documentAPI, 
  publicationRewardAPI, 
  publicationFormAPI,
  submissionUsersAPI
} from '../../../lib/publication_api';
import Swal from 'sweetalert2';
import { PDFDocument } from 'pdf-lib';

// SweetAlert2 configuration
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

const formatNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (value) => {
  const num = formatNumber(value);
  return num.toLocaleString('th-TH');
};

const mergePDFs = async (pdfFiles) => {
  try {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of pdfFiles) {
      if (file.type === 'application/pdf') {
        const pdfBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }
    }
    
    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    return new File([blob], 'merged_documents.pdf', { type: 'application/pdf' });
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw error;
  }
};

// 1. เพิ่ม utility functions สำหรับจัดการ draft
const DRAFT_KEY = 'publication_reward_draft';

// ฟังก์ชันบันทึก draft ลง localStorage
const saveDraftToLocal = (data) => {
  try {
    const draftData = {
      formData: data.formData,
      coauthors: data.coauthors,
      otherDocuments: data.otherDocuments.map(doc => ({
        documentTypeId: doc.documentTypeId,
        description: doc.description,
        fileName: doc.file?.name || null,
        fileSize: doc.file?.size || null,
        fileType: doc.file?.type || null
      })),
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 วัน
    };
    
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    return true;
  } catch (error) {
    console.error('Error saving draft to localStorage:', error);
    return false;
  }
};

// ฟังก์ชันโหลด draft จาก localStorage
const loadDraftFromLocal = () => {
  try {
    const draftString = localStorage.getItem(DRAFT_KEY);
    if (!draftString) return null;
    
    const draft = JSON.parse(draftString);
    
    // ตรวจสอบว่า draft หมดอายุหรือไม่
    if (new Date(draft.expiresAt) < new Date()) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    
    return draft;
  } catch (error) {
    console.error('Error loading draft from localStorage:', error);
    return null;
  }
};

// ฟังก์ชันลบ draft
const deleteDraftFromLocal = () => {
  localStorage.removeItem(DRAFT_KEY);
};

// File upload component
const FileUpload = ({ onFileSelect, accept, multiple = false, error, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileSelection = (files) => {
    if (multiple) {
      // สำหรับหลายไฟล์ เพิ่มเข้าไปในรายการที่มีอยู่
      const newFiles = [...selectedFiles, ...files];
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);
    } else {
      // สำหรับไฟล์เดียว
      const validFiles = files.slice(0, 1);
      setSelectedFiles(validFiles);
      onFileSelect(validFiles);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelection(files);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const viewFile = (file) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  // สำหรับไฟล์เดียว และมีไฟล์ที่เลือกแล้ว ให้แสดงเฉพาะไฟล์ที่เลือก
  if (!multiple && selectedFiles.length > 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{selectedFiles[0].name}</p>
              <p className="text-xs text-green-600">
                {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => viewFile(selectedFiles[0])}
              className="text-blue-500 hover:text-blue-700"
              title="ดูไฟล์"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeFile(0)}
              className="text-red-500 hover:text-red-700"
              title="ลบไฟล์"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    );
  }

  // สำหรับหลายไฟล์ หรือยังไม่มีไฟล์เลือก
  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : error 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${label}`).click()}
      >
        <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {multiple ? 
            'คลิกหรือลากไฟล์มาวางที่นี่ (สามารถเลือกได้หลายไฟล์)' : 
            'คลิกหรือลากไฟล์มาวางที่นี่'
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {accept || 'PDF, DOC, DOCX, JPG, PNG (ไม่เกิน 10MB)'}
        </p>
        <input
          id={`file-input-${label}`}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Display selected files for multiple selection */}
      {multiple && selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">ไฟล์ที่เลือก:</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewFile(file);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                    title="ดูไฟล์"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="ลบไฟล์"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
};

const CoauthorSelector = ({ users, selectedCoauthors, onAddCoauthor, onRemoveCoauthor, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredUsers = users.filter(user => {
    // กรองผู้ใช้ปัจจุบันออก
    if (currentUser && user.user_id === currentUser.user_id) {
      return false;
    }
    
    // กรองผู้ที่เลือกไปแล้วออก
    if (selectedCoauthors.find(c => c.user_id === user.user_id)) {
      return false;
    }
    
    // กรองตาม search term
    const searchLower = searchTerm.toLowerCase();
    return user.user_fname.toLowerCase().includes(searchLower) ||
           user.user_lname.toLowerCase().includes(searchLower) ||
           user.email.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาผู้ร่วมวิจัย..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(e.target.value.length > 0);
            }}
            onFocus={() => setShowDropdown(searchTerm.length > 0)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Dropdown */}
        {showDropdown && filteredUsers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredUsers.slice(0, 10).map(user => (
              <button
                key={user.user_id}
                type="button"
                onClick={() => {
                  onAddCoauthor(user);
                  setSearchTerm('');
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">
                  {user.user_fname} {user.user_lname}
                </div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected co-authors */}
      {selectedCoauthors.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            ผู้ร่วมวิจัยที่เลือก ({selectedCoauthors.length} คน)
          </label>
          <div className="space-y-2">
            {selectedCoauthors.map(coauthor => (
              <div key={coauthor.user_id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <div className="font-medium text-blue-900">
                    {coauthor.user_fname} {coauthor.user_lname}
                  </div>
                  <div className="text-sm text-blue-700">{coauthor.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveCoauthor(coauthor)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


export default function PublicationRewardForm({ onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [years, setYears] = useState([]);
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingFiles, setPendingFiles] = useState({
    article: null,
    others: []
  });
  const [mergedPdfFile, setMergedPdfFile] = useState(null);
  // Form data state
  const [formData, setFormData] = useState({
    // Basic submission info
    year_id: null,
    
    // Publication details
    author_status: '',
    article_title: '',
    journal_name: '',
    journal_issue: '',
    journal_pages: '',
    journal_month: '',
    journal_year: new Date().getFullYear().toString(),
    journal_url: '',
    doi: '',
    article_online_db: '',
    journal_tier: '',
    journal_quartile: '',
    in_isi: false,
    in_scopus: false,
    article_type: '',
    journal_type: '',
    
    // Reward calculation
    reward_amount: 0,                    // เปลี่ยนจาก publication_reward
    revision_fee: 0,                     // เปลี่ยนจาก editor_fee  
    publication_fee: 0,                  // รวมจาก university + college
    external_funding_amount: 0,          // ใหม่ - ผลรวมจากตารางทุนภายนอก
    total_amount: 0, 
    
    // Bank info
    bank_account: '',
    bank_name: '',
    phone_number: '',
    
    // Other info
    university_ranking: '',
    has_university_fund: '',
    university_fund_ref: ''
  });

  // Co-authors and files
  const [coauthors, setCoauthors] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [otherDocuments, setOtherDocuments] = useState([]);

  // External funding sources
  const [externalFundings, setExternalFundings] = useState([]);
  const [publicationFee, setPublicationFee] = useState(0); // ค่าตีพิมพ์

  // Load initial data
  useEffect(() => {
    loadInitialData();
    checkAndLoadDraft();
  }, []);

  // คำนวณเมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    const externalTotal = externalFundings.reduce((sum, funding) => 
      sum + (parseFloat(funding.amount) || 0), 0);
    
    const totalAmount = formData.reward_amount + formData.revision_fee + formData.publication_fee - externalTotal;
    
    setFormData(prev => ({
      ...prev,
      external_funding_amount: externalTotal,
      total_amount: totalAmount
    }));
  }, [formData.reward_amount, formData.revision_fee, formData.publication_fee, externalFundings]);

  useEffect(() => {
    const externalTotal = externalFundings.reduce((sum, funding) => 
      sum + (parseFloat(funding.amount) || 0), 0);
    
    const rewardAmount = parseFloat(formData.publication_reward) || 0;  // ใช้ publication_reward
    const revisionFee = parseFloat(formData.revision_fee) || 0;
    const publicationFee = parseFloat(formData.publication_fee) || 0;
    
    const totalAmount = rewardAmount + revisionFee + publicationFee - externalTotal;
    
    setFormData(prev => ({
      ...prev,
      external_funding_amount: externalTotal,
      total_amount: Math.max(totalAmount, 0)
    }));
  }, [formData.publication_reward, formData.revision_fee, formData.publication_fee, externalFundings]);

  useEffect(() => {
    if (formData.author_status && formData.journal_quartile) {
      const reward = calculateReward(formData.author_status, formData.journal_quartile);
      setFormData(prev => ({ ...prev, publication_reward: reward }));
    }
  }, [formData.author_status, formData.journal_quartile]);

  // ในฟังก์ชัน loadInitialData
  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Starting loadInitialData...');
      
      // ดึงข้อมูลผู้ใช้ปัจจุบัน
      let userLoaded = false;
      let currentUserData = null;
      
      // พยายามดึงจาก API ก่อน
      try {
        const profileResponse = await authAPI.getProfile();
        console.log('Full profile response:', profileResponse);
        
        if (profileResponse && profileResponse.user) {
          currentUserData = profileResponse.user;
          setCurrentUser(currentUserData);
          userLoaded = true;
          console.log('Current user from API:', currentUserData);
        }
      } catch (error) {
        console.log('Could not fetch profile from API:', error);
      }
      
      // ถ้าดึงจาก API ไม่ได้ ให้ใช้จาก localStorage
      if (!userLoaded) {
        const storedUser = authAPI.getCurrentUser();
        console.log('Stored user from localStorage:', storedUser);
        if (storedUser) {
          currentUserData = storedUser;
          setCurrentUser(storedUser);
        }
      }

      // ใช้ API functions จาก publication_api.js
      const [yearsResponse, usersResponse, docTypesResponse] = await Promise.all([
        systemAPI.getYears(),                                    
        publicationFormAPI.getUsers(),                                  
        publicationFormAPI.getDocumentTypes()                    
      ]);

      console.log('Raw API responses:');
      console.log('Years:', yearsResponse);
      console.log('Users:', usersResponse); 
      console.log('Document Types:', docTypesResponse);

      // Handle years response
      if (yearsResponse && yearsResponse.years) {
        console.log('Setting years:', yearsResponse.years);
        setYears(yearsResponse.years);
        const currentYear = yearsResponse.years.find(y => y.year === '2568');
        if (currentYear) {
          console.log('Found current year:', currentYear);
          setFormData(prev => ({ ...prev, year_id: currentYear.year_id }));
        }
      }

      // Handle users response และกรองผู้ใช้ปัจจุบันออก
      if (usersResponse && usersResponse.users) {
        console.log('All users before filtering:', usersResponse.users);
        
        // กรองผู้ใช้ปัจจุบันออกจากรายชื่อผู้ร่วมวิจัย
        const filteredUsers = usersResponse.users.filter(user => {
          // ตรวจสอบว่ามี currentUserData และ user_id
          if (currentUserData && currentUserData.user_id) {
            return user.user_id !== currentUserData.user_id;
          }
          return true; // ถ้าไม่มี currentUserData ให้แสดงทั้งหมด
        });
        
        console.log('Current user ID:', currentUserData?.user_id);
        console.log('Filtered users (without current user):', filteredUsers);
        setUsers(filteredUsers);
      }

      // Handle document types response
      if (docTypesResponse && docTypesResponse.document_types) {
        console.log('Setting document types:', docTypesResponse.document_types);
        setDocumentTypes(docTypesResponse.document_types);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAndLoadDraft = async () => {
    const draft = loadDraftFromLocal();
    if (draft) {
      const savedDate = new Date(draft.savedAt).toLocaleString('th-TH');
      
      const result = await Swal.fire({
        title: 'พบข้อมูลที่บันทึกไว้',
        html: `
          <p>พบข้อมูลร่างที่บันทึกไว้เมื่อ ${savedDate}</p>
          <p class="text-lg font-semibold mt-2">ต้องการโหลดข้อมูลนี้หรือไม่?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'โหลดข้อมูล',
        cancelButtonText: 'เริ่มใหม่',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      });

      if (result.isConfirmed) {
        // โหลดข้อมูลฟอร์ม
        setFormData(draft.formData);
        setCoauthors(draft.coauthors || []);
        
        // แจ้งเตือนเรื่องไฟล์
        if (draft.otherDocuments.length > 0) {
          const fileList = draft.otherDocuments
            .filter(doc => doc.fileName)
            .map(doc => `• ${doc.fileName} (${(doc.fileSize / 1024 / 1024).toFixed(2)} MB)`)
            .join('<br>');
          
          if (fileList) {
            Swal.fire({
              icon: 'info',
              title: 'กรุณาเลือกไฟล์ใหม่',
              html: `
                <p>ไฟล์ที่เคยเลือกไว้:</p>
                <div class="text-left mt-2 text-sm">${fileList}</div>
                <p class="mt-3 text-sm text-gray-600">เนื่องจากความปลอดภัย กรุณาเลือกไฟล์เหล่านี้อีกครั้ง</p>
              `,
              confirmButtonColor: '#3085d6'
            });
            
            // เก็บข้อมูลไฟล์ที่ต้อง re-upload
            setPendingFiles({
              others: draft.otherDocuments.filter(doc => doc.fileName)
            });
          }
        }
        
        Toast.fire({
          icon: 'success',
          title: 'โหลดข้อมูลร่างเรียบร้อยแล้ว'
        });
      } else {
        deleteDraftFromLocal();
      }
    }
  };

  const calculateReward = (authorStatus, quartile) => {
    // Reward calculation logic based on author status and journal quartile
    const rewardRates = {
      'first_author': {
        'T5': 50000,
        'T10': 45000,
        'Q1': 40000,
        'Q2': 30000,
        'Q3': 20000,
        'Q4': 10000,
        'TCI': 5000
      },
      'corresponding_author': {
        'T5': 50000,
        'T10': 45000,
        'Q1': 40000,
        'Q2': 30000,
        'Q3': 20000,
        'Q4': 10000,
        'TCI': 5000
      }
    };

    return rewardRates[authorStatus]?.[quartile] || 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddCoauthor = (user) => {
    if (!coauthors.find(c => c.user_id === user.user_id)) {
      setCoauthors(prev => [...prev, user]);
    }
  };

  const handleRemoveCoauthor = async (index) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบผู้แต่งร่วม?',
      text: `ต้องการลบ ${coauthors[index].user_fname} ${coauthors[index].user_lname} ออกจากรายชื่อผู้แต่งร่วมหรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      setCoauthors(prev => prev.filter((_, i) => i !== index));
      
      Toast.fire({
        icon: 'success',
        title: 'ลบผู้แต่งร่วมเรียบร้อยแล้ว'
      });
    }
  };

  const handleAddExternalFunding = () => {
    const newFunding = {
      id: Date.now(),
      fundName: '',
      amount: '',
      file: null
    };
    setExternalFundings([...externalFundings, newFunding]);
  };

  const handleRemoveExternalFunding = (id) => {
    // หาไฟล์ที่เกี่ยวข้อง
    const funding = externalFundings.find(f => f.id === id);
    if (funding && funding.file) {
      // ลบไฟล์จากเอกสารอื่นๆ ด้วย
      setOtherDocuments(otherDocuments.filter(doc => 
        doc.type !== 'external_funding' || doc.file !== funding.file
      ));
    }
    
    // ลบ funding
    setExternalFundings(externalFundings.filter(f => f.id !== id));
  };

  const handleExternalFundingChange = (id, field, value) => {
    setExternalFundings(externalFundings.map(funding => 
      funding.id === id ? { ...funding, [field]: value } : funding
    ));
  };

// แก้ไขฟังก์ชัน handleFileUpload ใน PublicationRewardForm.js

const handleFileUpload = (documentTypeId, files) => {
  console.log('handleFileUpload called with:', { documentTypeId, files });
  
  if (files && files.length > 0) {
    if (documentTypeId === 'other') {
      // สำหรับเอกสารอื่นๆ เก็บทั้งหมดเป็น array
      console.log('Setting other documents:', files);
      setOtherDocuments(files);
    } else {
      // สำหรับเอกสารที่กำหนด เก็บเฉพาะไฟล์แรก
      console.log(`Setting uploaded file for type ${documentTypeId}:`, files[0]);
      setUploadedFiles(prev => {
        const updated = {
          ...prev,
          [documentTypeId]: files[0]
        };
        console.log('Updated uploadedFiles state:', updated);
        return updated;
      });
    }

    // Clear error
    if (errors[`file_${documentTypeId}`]) {
      setErrors(prev => ({ ...prev, [`file_${documentTypeId}`]: '' }));
    }
  } else {
    console.log('No files provided to handleFileUpload');
  }
};

// แก้ไขฟังก์ชัน handleExternalFundingFileChange ด้วย
const handleExternalFundingFileChange = (id, file) => {
  console.log('handleExternalFundingFileChange called with:', { id, file });
  
  if (file && file.type === 'application/pdf') {
    // อัพเดตไฟล์ในตาราง
    setExternalFundings(prev => {
      const updated = prev.map(funding => 
        funding.id === id ? { ...funding, file: file } : funding
      );
      console.log('Updated externalFundings:', updated);
      return updated;
    });
    
    console.log('External funding file added successfully');
  } else {
    console.error('Invalid file type for external funding:', file?.type);
    alert('กรุณาเลือกไฟล์ PDF เท่านั้น');
  }
};

// เพิ่มฟังก์ชันสำหรับ debug state changes
const debugStateChange = (stateName, newValue) => {
  console.log(`State changed - ${stateName}:`, newValue);
};

  const removeFile = async (index) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบไฟล์?',
      text: 'คุณต้องการลบไฟล์นี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);
      
      Toast.fire({
        icon: 'success',
        title: 'ลบไฟล์เรียบร้อยแล้ว'
      });
    }
  };

  const removeOtherDocument = (index) => {
    setOtherDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.year_id) newErrors.year_id = 'กรุณาเลือกปีงบประมาณ';
    if (!formData.author_status) newErrors.author_status = 'กรุณาเลือกสถานะผู้แต่ง';
    if (!formData.article_title) newErrors.article_title = 'กรุณากรอกชื่อบทความ';
    if (!formData.journal_name) newErrors.journal_name = 'กรุณากรอกชื่อวารสาร';
    if (!formData.journal_quartile) newErrors.journal_quartile = 'กรุณาเลือก Journal Quartile';
    
    setErrors(newErrors);
    
    // แสดง error ด้วย SweetAlert ถ้ามี
    if (Object.keys(newErrors).length > 0) {
      const errorList = Object.values(newErrors).map(err => `• ${err}`).join('<br>');
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        html: errorList,
        confirmButtonColor: '#3085d6'
      });
      return false;
    }
    
    return true;
  };

  const showSubmissionConfirmation = async () => {
    const publicationDate = formData.journal_month && formData.journal_year 
      ? `${formData.journal_month}/${formData.journal_year}` 
      : '-';

    // รวบรวมไฟล์ทั้งหมดเพื่อแสดงและรวม PDF
    const allFiles = [];
    const allFilesList = [];
    
    // ไฟล์จาก uploadedFiles
    Object.entries(uploadedFiles).forEach(([key, file]) => {
      if (file) {
        const docType = documentTypes.find(dt => dt.id == key);
        allFiles.push(file);
        allFilesList.push({
          name: file.name,
          type: docType?.name || 'เอกสาร',
          size: file.size
        });
      }
    });
    
    // ไฟล์จาก otherDocuments
    if (otherDocuments && Array.isArray(otherDocuments) && otherDocuments.length > 0) {
      otherDocuments.forEach(doc => {
        const file = doc.file || doc;
        if (file && (file.name || doc.name)) {
          allFiles.push(file);
          allFilesList.push({
            name: file.name || doc.name,
            type: 'เอกสารอื่นๆ',
            size: file.size || doc.size || 0
          });
        }
      });
    }
    
    // ไฟล์จาก external funding
    externalFundings.forEach(funding => {
      if (funding.file) {
        allFiles.push(funding.file);
        allFilesList.push({
          name: funding.file.name,
          type: 'หลักฐานทุนภายนอก',
          size: funding.file.size
        });
      }
    });

    // ตรวจสอบว่ามีไฟล์หรือไม่
    if (allFiles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่พบเอกสารแนบ',
        text: 'กรุณาแนบไฟล์บทความอย่างน้อย 1 ไฟล์',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }

    // สร้าง PDF รวม
    let mergedPdfBlob = null;
    let mergedPdfUrl = null;
    let previewViewed = false; // ใช้ตัวแปรใน scope แทน state

    try {
      // แสดง loading ขณะรวม PDF
      Swal.fire({
        title: 'กำลังเตรียมเอกสาร...',
        html: 'กำลังรวมไฟล์ PDF ทั้งหมด',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      // กรองเฉพาะไฟล์ PDF
      const pdfFiles = allFiles.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length > 0) {
        if (pdfFiles.length > 1) {
          // รวม PDF หลายไฟล์
          mergedPdfBlob = await mergePDFs(pdfFiles);
          // แปลงเป็น File object และเก็บไว้ใน state
          const mergedFile = new File([mergedPdfBlob], 'merged_documents.pdf', { type: 'application/pdf' });
          setMergedPdfFile(mergedFile);
        } else {
          // ใช้ PDF เดียว
          mergedPdfBlob = pdfFiles[0];
          setMergedPdfFile(pdfFiles[0]);
        }
        mergedPdfUrl = URL.createObjectURL(mergedPdfBlob);
      }

      Swal.close();
    } catch (error) {
      console.error('Error creating merged PDF:', error);
      Swal.close();
      setMergedPdfFile(null);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถรวมไฟล์ PDF ได้',
        text: 'กรุณาตรวจสอบไฟล์และลองใหม่อีกครั้ง',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }

    const summaryHTML = `
      <div class="text-left space-y-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-700 mb-2">ข้อมูลบทความ</h4>
          <div class="space-y-2 text-sm">
            <p><span class="font-medium">ชื่อบทความ:</span> ${formData.article_title || '-'}</p>
            <p><span class="font-medium">วารสาร:</span> ${formData.journal_name || '-'}</p>
            <p><span class="font-medium">Quartile:</span> ${formData.journal_quartile || '-'}</p>
            <p><span class="font-medium">วันที่ตีพิมพ์:</span> ${publicationDate}</p>
            <p><span class="font-medium">DOI:</span> ${formData.doi || '-'}</p>
          </div>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-700 mb-2">ข้อมูลผู้แต่ง</h4>
          <div class="space-y-2 text-sm">
            <p><span class="font-medium">สถานะผู้แต่ง:</span> ${
              formData.author_status === 'first_author' ? 'ผู้แต่งหลัก' :
              formData.author_status === 'corresponding_author' ? 'Corresponding Author' : '-'
            }</p>
            <p><span class="font-medium">จำนวนผู้แต่งร่วม:</span> ${coauthors.length} คน</p>
            ${coauthors.length > 0 ? `
              <div class="mt-2">
                <span class="font-medium">รายชื่อผู้แต่งร่วม:</span>
                <ul class="ml-4 mt-1">
                  ${coauthors.map(author => `<li>• ${author.user_fname} ${author.user_lname}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-700 mb-2">จำนวนเงินที่ขอเบิก</h4>
          <div class="space-y-2 text-sm">
            <p><span class="font-medium">เงินรางวัลการตีพิมพ์:</span> ${formatCurrency(formData.publication_reward || 0)} บาท</p>
            <p><span class="font-medium">ค่าปรับปรุงบทความ:</span> ${formatCurrency(formData.revision_fee || 0)} บาท</p>
            <p><span class="font-medium">ค่าการตีพิมพ์:</span> ${formatCurrency(formData.publication_fee || 0)} บาท</p>
            
            ${(externalFundings && externalFundings.length > 0) ? `
              <div class="mt-3 pt-2 border-t border-green-200">
                <span class="font-medium text-green-800">รายการทุนภายนอก:</span>
                <ul class="ml-4 mt-1 space-y-1">
                  ${externalFundings.map(funding => {
                    const fundName = funding?.fundName || funding?.file?.name || 'ไม่ระบุชื่อทุน';
                    const amount = parseFloat(funding?.amount || 0);
                    return `<li class="text-xs">• ${fundName}: ${formatCurrency(amount)} บาท</li>`;
                  }).join('')}
                </ul>
                <p class="mt-2 text-sm"><span class="font-medium">รวมทุนภายนอก:</span> ${formatCurrency(formData.external_funding_amount || 0)} บาท</p>
              </div>
            ` : ''}
            
            <div class="mt-3 pt-3 border-t-2 border-green-300">
              <div class="bg-white p-3 rounded border">
                <p class="text-base font-bold text-green-800">
                  ยอดสุทธิที่เบิกจากวิทยาลัย: ${formatCurrency(formData.total_amount || 0)} บาท
                </p>
                <div class="text-xs text-gray-600 mt-1">
                  คำนวณจาก: เงินรางวัล + ค่าปรับปรุง + ค่าตีพิมพ์ - ทุนภายนอก
                </div>
                <div class="text-xs text-gray-600">
                  = ${formatCurrency(formData.publication_reward || 0)} + ${formatCurrency(formData.revision_fee || 0)} + ${formatCurrency(formData.publication_fee || 0)} - ${formatCurrency(formData.external_funding_amount || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-700 mb-2">เอกสารแนบ</h4>
          <div class="space-y-3 text-sm">
            <div>
              <p class="font-medium mb-2">ไฟล์ทั้งหมด (${allFilesList.length} ไฟล์):</p>
              <div class="bg-white p-3 rounded border max-h-32 overflow-y-auto">
                <ul class="space-y-1">
                  ${allFilesList.map(file => `
                    <li class="flex justify-between items-center text-xs">
                      <span>📄 ${file.name}</span>
                      <span class="text-gray-500">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>

            ${mergedPdfUrl ? `
              <div class="bg-blue-50 border border-blue-200 p-3 rounded">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-blue-800">📋 เอกสารรวม (PDF)</p>
                    <p class="text-xs text-blue-600">ไฟล์ PDF ทั้งหมดรวมเป็นไฟล์เดียว</p>
                  </div>
                  <button
                    id="preview-pdf-btn"
                    type="button"
                    class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    👀 ดูตัวอย่าง
                  </button>
                </div>
                <div id="preview-status" class="mt-2 text-xs">
                  <span class="text-red-600">⚠️ กรุณาดูตัวอย่างเอกสารก่อนส่งคำร้อง</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        ${formData.bank_account || formData.bank_name ? `
          <div class="bg-purple-50 p-4 rounded-lg">
            <h4 class="font-semibold text-purple-700 mb-2">ข้อมูลธนาคาร</h4>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">เลขบัญชี:</span> ${formData.bank_account || '-'}</p>
              <p><span class="font-medium">ธนาคาร:</span> ${formData.bank_name || '-'}</p>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // ใช้ลูปแทน async/await เพื่อให้ SweetAlert สามารถ update ได้
    let dialogResult = null;
    
    const showDialog = () => {
      return Swal.fire({
        title: 'ตรวจสอบข้อมูลก่อนส่งคำร้อง',
        html: summaryHTML,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ยืนยันส่งคำร้อง',
        cancelButtonText: 'ยกเลิก',
        width: '700px',
        customClass: {
          htmlContainer: 'text-left'
        },
        // เปลี่ยนเป็นการตรวจสอบแบบ dynamic
        preConfirm: () => {
          if (mergedPdfUrl && !previewViewed) {
            Swal.showValidationMessage('กรุณาดูตัวอย่างเอกสารรวมก่อนส่งคำร้อง');
            return false;
          }
          return true;
        },
        didOpen: () => {
          // เพิ่ม event listener สำหรับปุ่มดูตัวอย่าง
          const previewBtn = document.getElementById('preview-pdf-btn');
          const previewStatus = document.getElementById('preview-status');
          
          if (previewBtn && mergedPdfUrl) {
            previewBtn.addEventListener('click', () => {
              window.open(mergedPdfUrl, '_blank');
              previewViewed = true; // อัพเดตตัวแปรใน scope
              
              // อัพเดตสถานะ
              if (previewStatus) {
                previewStatus.innerHTML = '<span class="text-green-600">✅ ดูตัวอย่างเอกสารแล้ว</span>';
              }
              
              // เปลี่ยนสีปุ่ม
              previewBtn.className = 'px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors';
              previewBtn.innerHTML = '✅ ดูแล้ว';
              
              // ซ่อน validation message ถ้ามี
              const validationMessage = document.querySelector('.swal2-validation-message');
              if (validationMessage) {
                validationMessage.style.display = 'none';
              }
            });
          }
        },
        willClose: () => {
          // ลบ URL object เมื่อปิด dialog
          if (mergedPdfUrl) {
            URL.revokeObjectURL(mergedPdfUrl);
          }
        }
      });
    };

    const result = await showDialog();
    return result.isConfirmed;
  };
  
  const saveDraft = async () => {
    try {
      setSaving(true);
      
      // แสดง loading
      Swal.fire({
        title: 'กำลังบันทึกร่าง...',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      // รอเล็กน้อยเพื่อให้ UI update
      await new Promise(resolve => setTimeout(resolve, 500));

      // บันทึกข้อมูลลง localStorage
      const saved = saveDraftToLocal({
        formData,
        coauthors,
        otherDocuments
      });

      Swal.close();

      if (saved) {
        Toast.fire({
          icon: 'success',
          title: 'บันทึกร่างเรียบร้อยแล้ว',
          html: '<small>ข้อมูลจะถูกเก็บไว้ 7 วัน</small>'
        });
      } else {
        throw new Error('ไม่สามารถบันทึกข้อมูลได้');
      }
      
    } catch (error) {
      console.error('Error saving draft:', error);
      Swal.close();
      
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกร่างได้ อาจเนื่องจากพื้นที่จัดเก็บเต็ม',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setSaving(false);
    }
  };

  //ฟังก์ชัน auto-save
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (formData.article_title || formData.journal_name) {
        saveDraftToLocal({
          formData,
          coauthors,
          otherDocuments
        });
        console.log('Auto-saved draft');
      }
    }, 10000); // auto-save ทุก 30 วินาที

    return () => clearTimeout(autoSaveTimer);
  }, [formData, coauthors, otherDocuments]);

  // ฟังก์ชันลบร่าง
  const deleteDraft = async () => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบร่าง?',
      text: 'ข้อมูลที่บันทึกไว้จะถูกลบทั้งหมด',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบร่าง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      deleteDraftFromLocal();
      resetForm();
      
      Toast.fire({
        icon: 'success',
        title: 'ลบร่างเรียบร้อยแล้ว'
      });
    }
  };

// เพิ่มฟังก์ชันนี้ใน PublicationRewardForm.js ก่อน submitApplication

const debugFileStates = () => {
  console.group('=== DEBUG FILE STATES ===');
  
  console.log('1. uploadedFiles state:');
  Object.entries(uploadedFiles).forEach(([key, file]) => {
    if (file) {
      console.log(`  ${key}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
    } else {
      console.log(`  ${key}: null/undefined`);
    }
  });
  
  console.log('2. otherDocuments state:');
  if (otherDocuments && otherDocuments.length > 0) {
    otherDocuments.forEach((doc, index) => {
      const file = doc.file || doc;
      if (file) {
        console.log(`  Document ${index}:`, {
          name: file.name,
          type: file.type,
          size: file.size
        });
      } else {
        console.log(`  Document ${index}: invalid file object`, doc);
      }
    });
  } else {
    console.log('  No other documents');
  }
  
  console.log('3. externalFundings state:');
  if (externalFundings && externalFundings.length > 0) {
    externalFundings.forEach((funding, index) => {
      if (funding.file) {
        console.log(`  Funding ${index}:`, {
          name: funding.file.name,
          type: funding.file.type,
          size: funding.file.size,
          fundName: funding.fundName
        });
      } else {
        console.log(`  Funding ${index}: no file attached`, { fundName: funding.fundName });
      }
    });
  } else {
    console.log('  No external fundings');
  }
  
  console.log('4. mergedPdfFile state:');
  if (mergedPdfFile) {
    console.log('  Merged PDF exists:', {
      name: mergedPdfFile.name,
      type: mergedPdfFile.type,
      size: mergedPdfFile.size
    });
  } else {
    console.log('  No merged PDF file');
  }
  
  console.groupEnd();
};


// Updated submitApplication function in PublicationRewardForm.js

  const submitApplication = async () => {
    // ตรวจสอบข้อมูลก่อน
    if (!validateForm()) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนส่งคำร้อง',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // แสดงหน้ายืนยันข้อมูล
    const confirmed = await showSubmissionConfirmation();
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      debugFileStates();

      // แสดง loading dialog
      Swal.fire({
        title: 'กำลังส่งคำร้อง...',
        html: 'กำลังเตรียมเอกสาร...',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      let submissionId = currentSubmissionId;
      let finalFile = null;
      let fileDescription = '';

      // รวบรวมไฟล์ทั้งหมด
      const allFiles = [];
      
      // เพิ่มไฟล์บทความ
      Object.values(uploadedFiles).forEach(file => {
        if (file) {
          console.log('Adding uploaded file:', file.name, file.type, file.size);
          allFiles.push(file);
        }
      });
      
      // เพิ่มเอกสารอื่นๆ
      if (otherDocuments && otherDocuments.length > 0) {
        otherDocuments.forEach(doc => {
          const file = doc.file || doc;
          if (file) {
            console.log('Adding other document:', file.name, file.type, file.size);
            allFiles.push(file);
          }
        });
      }
      
      // เพิ่มไฟล์จาก external funding
      externalFundings.forEach(funding => {
        if (funding.file) {
          console.log('Adding external funding file:', funding.file.name, funding.file.type, funding.file.size);
          allFiles.push(funding.file);
        }
      });

      console.log('Total files collected:', allFiles.length);
      console.log('All files:', allFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));

      // ตรวจสอบว่ามีไฟล์หรือไม่
      if (allFiles.length === 0) {
        Swal.close();
        Swal.fire({
          icon: 'warning',
          title: 'ไม่พบเอกสารแนบ',
          text: 'กรุณาแนบไฟล์บทความอย่างน้อย 1 ไฟล์',
          confirmButtonColor: '#3085d6'
        });
        setLoading(false);
        return;
      }

      // ใช้ merged PDF ที่เตรียมไว้แล้ว หรือเตรียมไฟล์ใหม่
      if (mergedPdfFile) {
        finalFile = mergedPdfFile;
        fileDescription = `เอกสารรวม (${allFiles.length} ไฟล์)`;
        console.log('Using merged PDF file:', finalFile.name, finalFile.size);
      } else {
        // ใช้ไฟล์แรกหรือรวม PDF
        const pdfFiles = allFiles.filter(file => file.type === 'application/pdf');
        console.log('PDF files found:', pdfFiles.length);
        
        if (pdfFiles.length > 1) {
          try {
            console.log('Merging multiple PDF files...');
            finalFile = await mergePDFs(pdfFiles);
            fileDescription = `เอกสารรวม ${allFiles.length} ไฟล์`;
            console.log('Successfully merged PDFs into:', finalFile.name, finalFile.size);
          } catch (error) {
            console.error('Error merging PDFs:', error);
            finalFile = allFiles[0];
            fileDescription = 'ไฟล์บทความที่ตีพิมพ์';
            console.log('Using first file as fallback:', finalFile?.name);
          }
        } else if (pdfFiles.length === 1) {
          finalFile = pdfFiles[0];
          fileDescription = 'ไฟล์บทความที่ตีพิมพ์';
          console.log('Using single PDF file:', finalFile.name, finalFile.size);
        } else {
          finalFile = allFiles[0];
          fileDescription = 'ไฟล์บทความที่ตีพิมพ์';
          console.log('Using first available file (not PDF):', finalFile?.name);
        }
      }

      console.log('Final file selected:', finalFile ? {
        name: finalFile.name,
        type: finalFile.type,
        size: finalFile.size
      } : 'null');

      // Step 1: สร้าง submission ถ้ายังไม่มี
      if (!submissionId) {
        Swal.update({
          html: 'กำลังสร้างคำร้อง...'
        });

        const createResponse = await submissionAPI.create({
          submission_type: 'publication_reward',
          year_id: formData.year_id,
        });
        
        submissionId = createResponse.submission.submission_id;
        setCurrentSubmissionId(submissionId);
        console.log('Created submission:', submissionId);

        // Step 2: เพิ่ม co-authors ลง submission_users table
        if (coauthors && coauthors.length > 0) {
          Swal.update({
            html: 'กำลังเพิ่มผู้ร่วมวิจัย...'
          });

          try {
            console.log('Adding co-authors to submission_users:', coauthors);
            
            // เรียกใช้ API ใหม่สำหรับการจัดการ submission_users
            await (submissionUsersAPI || teacherSubmissionUsersAPI).setCoauthors(submissionId, coauthors);
            
            console.log('Co-authors added to submission_users successfully');
          } catch (error) {
            console.error('Error adding co-authors to submission_users:', error);
            // ไม่ให้ fail ทั้งหมด แต่แสดง warning
            console.warn('Warning: Could not add co-authors to submission_users, continuing with submission...');
          }
        }

        // Step 3: เพิ่ม publication details
        Swal.update({
          html: 'กำลังบันทึกข้อมูลบทความ...'
        });

        const publicationDate = formData.journal_year && formData.journal_month 
          ? `${formData.journal_year}-${formData.journal_month.padStart(2, '0')}-01`
          : new Date().toISOString().split('T')[0];

        await publicationDetailsAPI.add(submissionId, {
          article_title: formData.article_title,
          journal_name: formData.journal_name,
          publication_date: publicationDate,
          publication_type: formData.journal_type || 'journal',
          journal_quartile: formData.journal_quartile,
          impact_factor: parseFloat(formData.impact_factor) || null,
          doi: formData.doi || '',
          url: formData.journal_url || '',
          page_numbers: formData.journal_pages || '',
          volume_issue: formData.journal_issue || '',
          indexing: formData.article_online_db || '',
          
          // เงินรางวัลและการคำนวณ
          reward_amount: parseFloat(formData.publication_reward) || 0,
          revision_fee: parseFloat(formData.revision_fee) || 0,
          publication_fee: parseFloat(formData.publication_fee) || 0,
          external_funding_amount: parseFloat(formData.external_funding_amount) || 0,
          total_amount: parseFloat(formData.total_amount) || 0,
          
          // ข้อมูลผู้แต่ง
          author_count: coauthors.length + 1,
          is_corresponding_author: formData.author_status === 'corresponding_author',
          author_status: formData.author_status,
          
          // ข้อมูลธนาคาร
          bank_account: formData.bank_account,
          bank_name: formData.bank_name,
          phone_number: formData.phone_number,
          
          // อื่นๆ
          university_ranking: formData.university_ranking || '',
          has_university_fund: formData.has_university_fund === 'yes',
          university_fund_ref: formData.university_fund_ref || ''
        });

        // Step 4: อัปโหลดไฟล์หลัก
        Swal.update({
          html: 'กำลังอัปโหลดเอกสาร...'
        });

        // ตรวจสอบว่ามีไฟล์ที่จะอัปโหลดหรือไม่
        if (!finalFile) {
          throw new Error('ไม่พบไฟล์ที่จะอัปโหลด กรุณาแนบไฟล์บทความ');
        }

        // อัปโหลดไฟล์หลัก (ที่รวมแล้วหรือไฟล์เดียว)
        const fileResponse = await fileAPI.upload(finalFile);
        
        // ตรวจสอบผลลัพธ์การอัปโหลด
        if (!fileResponse || !fileResponse.file || !fileResponse.file.file_id) {
          throw new Error('การอัปโหลดไฟล์ล้มเหลว');
        }
        
        await documentAPI.attach(submissionId, {
          file_id: fileResponse.file.file_id,
          document_type_id: 1, // สมมติว่า 1 คือ document type สำหรับไฟล์บทความ
          description: fileDescription,
          display_order: 1
        });

        // ถ้ามีไฟล์ที่ไม่ใช่ PDF และมีหลายไฟล์ ให้แนบไฟล์ที่ไม่ใช่ PDF แยก
        if (allFiles.length > 1) {
          const nonPdfFiles = allFiles.filter(file => file.type !== 'application/pdf');
          
          if (nonPdfFiles.length > 0) {
            Swal.update({
              html: `กำลังอัปโหลดเอกสารเพิ่มเติม ${nonPdfFiles.length} ไฟล์...`
            });

            const uploadPromises = nonPdfFiles.map((file, index) => 
              fileAPI.upload(file)
                .then(response => 
                  documentAPI.attach(submissionId, {
                    file_id: response.file.file_id,
                    document_type_id: 99, // 99 สำหรับเอกสารอื่นๆ
                    description: `เอกสารเพิ่มเติม - ${file.name}`,
                    display_order: index + 2
                  })
                )
                .catch(error => {
                  console.error(`Error uploading non-PDF file ${index}:`, error);
                  // ไม่ throw error เพื่อให้ดำเนินการต่อได้
                })
            );

            await Promise.allSettled(uploadPromises);
          }
        }
      }

      // Step 5: Submit submission
      Swal.update({
        html: 'กำลังส่งคำร้อง...'
      });

      const submitResponse = await submissionAPI.submit(submissionId);
      
      // ปิด loading dialog
      Swal.close();

      // ลบ draft จาก localStorage (ถ้ามี)
      if (typeof deleteDraftFromLocal === 'function') {
        deleteDraftFromLocal();
      }

      // แสดงข้อความสำเร็จ
      await Swal.fire({
        icon: 'success',
        title: 'ส่งคำร้องสำเร็จ',
        html: `
          <div class="text-center">
            <p>คำร้องของคุณได้ถูกส่งเรียบร้อยแล้ว</p>
            <p class="text-sm text-gray-600 mt-2">เลขที่คำร้อง: ${submitResponse?.submission?.submission_number || submissionId}</p>
            
            ${coauthors.length > 0 ? `
              <div class="mt-4 p-3 bg-blue-50 rounded">
                <p class="text-sm text-blue-700">
                  <strong>ผู้ร่วมวิจัย:</strong> ${coauthors.length} คน
                </p>
                <div class="text-xs text-blue-600 mt-1">
                  ${coauthors.map(author => `• ${author.user_fname} ${author.user_lname}`).join('<br>')}
                </div>
              </div>
            ` : ''}
            
            <div class="mt-4 p-3 bg-gray-100 rounded">
              <p class="text-sm text-gray-700">
                <strong>เอกสารที่แนบ:</strong> ${fileDescription}
                ${allFiles.length > 1 && allFiles.some(f => f.type !== 'application/pdf') ? 
                  `<br><small class="text-gray-500">และเอกสารเพิ่มเติมอื่นๆ</small>` : ''}
              </p>
            </div>
            
            <div class="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <p class="text-sm text-green-700">
                <strong>ยอดเงินที่ขอเบิก:</strong> ${formatCurrency(formData.total_amount || 0)} บาท
              </p>
            </div>
          </div>
        `,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง'
      });

      // รีเซ็ตฟอร์ม
      resetForm();
      
      // Navigate ไปหน้ารายการคำร้อง (ถ้ามี prop onNavigate)
      if (onNavigate) {
        onNavigate('applications');
      }
      
    } catch (error) {
      console.error('Error submitting application:', error);
      Swal.close();
      
      // จัดการ error message
      let errorMessage = 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง';
      let errorDetail = '';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
        } else if (error.response.status === 400) {
          errorMessage = 'ข้อมูลไม่ถูกต้อง';
          errorDetail = error.response.data?.error || 'กรุณาตรวจสอบข้อมูลอีกครั้ง';
        } else if (error.response.data?.error) {
          errorDetail = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        errorDetail = 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      } else {
        errorDetail = error.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errorMessage,
        footer: errorDetail ? `<small>${errorDetail}</small>` : '',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      year_id: years.find(y => y.year === '2568')?.year_id || null,
      author_status: '',
      article_title: '',
      journal_name: '',
      journal_issue: '',
      journal_pages: '',
      journal_month: '',
      journal_year: new Date().getFullYear().toString(),
      journal_url: '',
      doi: '',
      article_online_db: '',
      journal_tier: '',
      journal_quartile: '',
      in_isi: false,
      in_scopus: false,
      article_type: '',
      journal_type: '',
      reward_amout: 0,
      total_claim: 0,
      bank_account: '',
      bank_name: '',
      phone_number: '',
      university_ranking: '',
      has_university_fund: '',
      university_fund_ref: ''
    });
    setCoauthors([]);
    setUploadedFiles({});
    setOtherDocuments([]);
    setExternalFundings([]);
    setErrors({});
    setCurrentSubmissionId(null);
    deleteDraftFromLocal();
    setMergedPdfFile(null);
  };

  if (loading && !years.length) {
    return (
      <PageLayout
        title="แบบฟอร์มขอเบิกเงินรางวัลการตีพิมพ์บทความ"
        subtitle="กำลังโหลดข้อมูล..."
        icon={Award}
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="แบบฟอร์มขอเบิกเงินรางวัลการตีพิมพ์บทความ"
      subtitle="สำหรับขอเบิกเงินรางวัลและค่าใช้จ่ายในการตีพิมพ์บทความวิชาการ"
      icon={Award}
      breadcrumbs={[
        { label: "หน้าแรก", href: "/teacher" },
        { label: "ขอเบิกเงินรางวัลการตีพิมพ์" }
      ]}
    >
      <form className="space-y-6">
        {/* ข้อมูลพื้นฐาน */}
        <SimpleCard title="ข้อมูลพื้นฐาน" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ชื่อผู้ยื่นคำร้อง - แก้ไขไม่ได้ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อผู้ยื่นคำร้อง
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {currentUser ? `${currentUser.position_name} ${currentUser.user_fname} ${currentUser.user_lname}` : 'กำลังโหลด...'}
              </div>
            </div>

            {/* ปีงบประมาณ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปีงบประมาณ <span className="text-red-500">*</span>
              </label>
              <select
                name="year_id"
                value={formData.year_id || ''}
                onChange={handleInputChange}
                className={`w-full text-gray-600 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.year_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">เลือกปีงบประมาณ</option>
                {years.map(year => (
                  <option key={year.year_id} value={year.year_id}>
                    {year.year}
                  </option>
                ))}
              </select>
              {errors.year_id && (
                <p className="text-red-500 text-sm mt-1">{errors.year_id}</p>
              )}
            </div>

            {/* สถานะผู้ยื่น */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะผู้ยื่น <span className="text-red-500">*</span>
              </label>
              <select
                name="author_status"
                value={formData.author_status}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.author_status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">เลือกสถานะ</option>
                <option value="first_author">ผู้แต่งหลัก (First Author)</option>
                <option value="corresponding_author">ผู้แต่งที่รับผิดชอบบทความ (Corresponding Author)</option>
              </select>
              {errors.author_status && (
                <p className="text-red-500 text-sm mt-1">{errors.author_status}</p>
              )}
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="เช่น 081-234-5678"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
              )}
            </div>
          </div>
        </SimpleCard>

        {/* ข้อมูลบทความ */}
        <SimpleCard title="ข้อมูลบทความ" icon={FileText}>
          <div className="space-y-4">
            {/* ชื่อบทความ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบทความ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="article_title"
                value={formData.article_title}
                onChange={handleInputChange}
                placeholder="กรอกชื่อบทความภาษาอังกฤษ"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.article_title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.article_title && (
                <p className="text-red-500 text-sm mt-1">{errors.article_title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ชื่อวารสาร */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อวารสาร <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="journal_name"
                  value={formData.journal_name}
                  onChange={handleInputChange}
                  placeholder="ชื่อวารสารที่ตีพิมพ์"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    errors.journal_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.journal_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.journal_name}</p>
                )}
              </div>

              {/* Quartile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quartile <span className="text-red-500">*</span>
                </label>
                <select
                  name="journal_quartile"
                  value={formData.journal_quartile}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    errors.journal_quartile ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="" disabled={formData.journal_quartile !== ''} hidden={formData.journal_quartile !== ''}>
                    เลือก Quartile
                  </option>
                  <option value="T5">Top 5%</option>
                  <option value="T10">Top 10%</option>
                  <option value="Q1">Quartile 1</option>
                  <option value="Q2">Quartile 2</option>
                  <option value="Q3">Quartile 3</option>
                  <option value="Q4">Quartile 4</option>
                  <option value="TCI">TCI กลุ่มที่ 1</option>
                </select>
                {errors.journal_quartile && (
                  <p className="text-red-500 text-sm mt-1">{errors.journal_quartile}</p>
                )}
              </div>

              {/* Volume/Issue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume/Issue
                </label>
                <input
                  type="text"
                  name="journal_issue"
                  value={formData.journal_issue}
                  onChange={handleInputChange}
                  placeholder="เช่น Vol.10, No.2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* หน้า */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หน้า
                </label>
                <input
                  type="text"
                  name="journal_pages"
                  value={formData.journal_pages}
                  onChange={handleInputChange}
                  placeholder="เช่น 123-145"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* เดือน/ปี */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เดือนที่ตีพิมพ์
                </label>
                <select
                  name="journal_month"
                  value={formData.journal_month}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">เลือกเดือน</option>
                  <option value="01">มกราคม</option>
                  <option value="02">กุมภาพันธ์</option>
                  <option value="03">มีนาคม</option>
                  <option value="04">เมษายน</option>
                  <option value="05">พฤษภาคม</option>
                  <option value="06">มิถุนายน</option>
                  <option value="07">กรกฎาคม</option>
                  <option value="08">สิงหาคม</option>
                  <option value="09">กันยายน</option>
                  <option value="10">ตุลาคม</option>
                  <option value="11">พฤศจิกายน</option>
                  <option value="12">ธันวาคม</option>
                </select>
              </div>

              {/* ปี */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ปีที่ตีพิมพ์
                </label>
                <input
                  type="number"
                  name="journal_year"
                  value={formData.journal_year}
                  onChange={handleInputChange}
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* DOI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DOI
              </label>
              <input
                type="text"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                placeholder="เช่น 10.1016/j.example.2023.01.001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL ของบทความ
              </label>
              <input
                type="url"
                name="journal_url"
                value={formData.journal_url}
                onChange={handleInputChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Database checkboxes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                ฐานข้อมูลที่ปรากฏ
              </label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="in_isi"
                    checked={formData.in_isi}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  ISI Web of Science
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="in_scopus"
                    checked={formData.in_scopus}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Scopus
                </label>
              </div>
            </div>
          </div>
        </SimpleCard>

        {/* ผู้ร่วมวิจัย */}
        <SimpleCard title="ผู้ร่วมวิจัย" icon={Users}>
          <div className="space-y-4">
            {/* Dropdown เลือกผู้ร่วมวิจัย */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เพิ่มผู้ร่วมวิจัย
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const userId = parseInt(e.target.value);
                  if (userId) {
                    const user = users.find(u => u.user_id === userId);
                    if (user) {
                      handleAddCoauthor(user);
                      e.target.value = ''; // Reset dropdown
                    }
                  }
                }}
              >
                <option value="">เลือกผู้ร่วมวิจัย...</option>
                {users
                  .filter(user => {
                    // กรองผู้ใช้ปัจจุบันออก
                    if (currentUser && user.user_id === currentUser.user_id) {
                      return false;
                    }
                    // กรองผู้ที่เลือกไปแล้วออก
                    if (coauthors.some(c => c.user_id === user.user_id)) {
                      return false;
                    }
                    return true;
                  })
                  .map(user => (
                    <option 
                      key={user.user_id} 
                      value={user.user_id}
                    >
                      {user.user_fname} {user.user_lname} ({user.email})
                    </option>
                  ))}
              </select>
            </div>

            {/* แสดงจำนวนผู้ร่วมวิจัยที่สามารถเลือกได้ */}
            <p className="text-xs text-gray-500">
              สามารถเลือกได้ {users.filter(u => 
                (!currentUser || u.user_id !== currentUser.user_id) && 
                !coauthors.some(c => c.user_id === u.user_id)
              ).length} คน
            </p>

            {/* รายการผู้ร่วมวิจัยที่เลือกแล้ว */}
            {coauthors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ผู้ร่วมวิจัยที่เลือก ({coauthors.length} คน)
                </label>
                <div className="space-y-2">
                  {coauthors.map((coauthor, index) => (
                    <div
                      key={coauthor.user_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {coauthor.user_fname} {coauthor.user_lname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {coauthor.email}
                          </p>
                        </div>
                      </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoauthor(index)}  // เปลี่ยนจากเดิม
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {coauthors.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Users className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                <p className="text-sm">ยังไม่มีผู้ร่วมวิจัย</p>
                <p className="text-xs text-gray-400 mt-1">กรุณาเลือกผู้ร่วมวิจัยจากรายการด้านบน</p>
              </div>
            )}
          </div>
        </SimpleCard>
        {/* การคำนวณเงินรางวัล */}
        <SimpleCard title="การคำนวณเงินรางวัล" icon={Calculator}>
            {/* การคำนวณเงินรางวัล */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เงินรางวัล (บาท)
              </label>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-semibold text-gray-800">
                  {formatCurrency(formData.publication_reward || 0)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                คำนวณอัตโนมัติจากสถานะผู้แต่งและ Quartile
              </p>
            </div>
        </SimpleCard>

        {/* การคำนวณเงินรางวัล */}
        <SimpleCard title="ค่าปรับปรุงบทความและค่าการตีพิมพ์" icon={Award}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 divide-x divide-gray-200">
            {/* ฝั่งซ้าย - ค่าปรับปรุง ค่าตีพิมพ์ และรวมเบิกจากวิทยาลัย */}
            <div className="space-y-6 lg:pr-6">
            {/* ค่าปรับปรุง */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค่าปรับปรุง (บาท)
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <input
                    type="number"
                    value={formData.revision_fee || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, revision_fee: e.target.value }));
                    }}
                    min="0"
                    placeholder="0"
                    className="text-2xl font-semibold text-gray-800 w-full bg-transparent border-none focus:outline-none"
                  />
                </div>
              </div>

              {/* ค่าตีพิมพ์ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค่าตีพิมพ์ (บาท)
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <input
                    type="number"
                    value={formData.publication_fee || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, publication_fee: e.target.value }));
                    }}
                    min="0"
                    placeholder="0"
                    className="text-2xl font-semibold text-gray-800 w-full bg-transparent border-none focus:outline-none"
                  />
                </div>
              </div>

              {/* รวมเบิกจากวิทยาลัยการคอม */}
              <div className="mt-8">
                <h4 className="text-base font-medium text-gray-900 mb-3">รวมเบิกจากวิทยาลัยการคอม</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-700">จำนวน</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(formData.total_amount || 0)}
                  </span>
                  <span className="text-sm text-gray-700">บาท</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = เงินรางวัล ({formatCurrency(formData.publication_reward || 0)}) 
                  + ค่าปรับปรุง ({formatCurrency(formData.revision_fee || 0)}) 
                  + ค่าตีพิมพ์ ({formatCurrency(formData.publication_fee || 0)}) 
                  - ทุนภายนอก ({formatCurrency(formData.external_funding_amount || 0)})
                </div>
              </div>
            </div>

            {/* ฝั่งขวา - ตารางเบิกจากนอกมหาวิทยาลัย */}
            <div className="lg:pl-6">
              <h4 className="font-medium text-gray-900 mb-4">รายการที่มหาวิทยาลัยหรือหน่วยงานภายนอกสนับสนุน</h4>
            
              {/* ตาราง */}
              <div className="overflow-hidden rounded-lg border border-blue-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border-b border-r border-blue-200 px-3 py-2 text-sm font-medium text-gray-700 text-center" style={{width: '60px'}}>
                        ลำดับ
                      </th>
                      <th className="border-b border-r border-blue-200 px-3 py-2 text-sm font-medium text-gray-700 text-center">
                        ชื่อทุน
                      </th>
                      <th className="border-b border-blue-200 px-3 py-2 text-sm font-medium text-gray-700 text-center" style={{width: '120px'}}>
                        จำนวน
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {externalFundings.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                          ยังไม่มีข้อมูล
                        </td>
                      </tr>
                    ) : (
                      externalFundings.map((funding, index) => (
                        <tr key={funding.id} className={index < externalFundings.length - 1 ? 'border-b border-blue-200' : ''}>
                          <td className="border-r border-blue-200 px-3 py-2 text-center text-sm">
                            {index + 1}
                          </td>
                          <td className="border-r border-blue-200 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">{funding.fundName || funding.file?.name || 'แนบไฟล์หลักฐาน'}</span>
                              <label className="cursor-pointer text-blue-500 hover:text-blue-700">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) => handleExternalFundingFileChange(funding.id, e.target.files[0])}
                                  className="hidden"
                                />
                                <Upload className="h-4 w-4" />
                              </label>
                              {funding.file && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = URL.createObjectURL(funding.file);
                                    window.open(url, '_blank');
                                  }}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="ดูไฟล์"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveExternalFunding(funding.id)}
                                className="text-red-500 hover:text-red-700 ml-auto"
                                title="ลบ"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={funding.amount}
                              onChange={(e) => handleExternalFundingChange(funding.id, 'amount', e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ปุ่มเพิ่มแถว */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleAddExternalFunding}
                  className="flex items-center gap-2 px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่ม
                </button>
              </div>

              {/* แสดงยอดรวม */}
              <div className="mt-4 text-right">
                <span className="text-sm text-gray-700">รวม </span> 
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency((externalFundings || []).reduce((sum, funding) => sum + (parseFloat(funding?.amount || 0)), 0))}
                </span>
                <span className="text-sm text-gray-700"> บาท</span>
              </div>
            </div>
          </div>
        </SimpleCard>

        {/* ข้อมูลธนาคาร */}
        <SimpleCard title="ข้อมูลธนาคาร" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* เลขบัญชีธนาคาร */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขบัญชีธนาคาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleInputChange}
                placeholder="กรอกเลขบัญชี"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.bank_account ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bank_account && (
                <p className="text-red-500 text-sm mt-1">{errors.bank_account}</p>
              )}
            </div>

            {/* ชื่อธนาคาร */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อธนาคาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="เช่น ธนาคารกรุงเทพ"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.bank_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bank_name && (
                <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
              )}
            </div>
          </div>
        </SimpleCard>

        {/* เอกสารแนบ */}
        <SimpleCard title="เอกสารแนบ" icon={Upload}>
          <div className="space-y-6">
            {/* เอกสารที่กำหนด */}
            {documentTypes && documentTypes.length > 0 ? (
              <>
                {documentTypes.map((docType) => {
                  // ถ้าเป็นเอกสารอื่นๆ ให้แสดงแยก
                  if (docType.name === 'เอกสารอื่นๆ') {
                    return (
                      <div key={docType.id} className="border border-gray-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          เอกสารอื่นๆ (ถ้ามี)
                        </label>
                        
                        <FileUpload
                          onFileSelect={(files) => handleFileUpload('other', files)}
                          accept=".pdf"
                          multiple={true}
                          label="other"
                        />
                      </div>
                    );
                  }
                  
                  // เอกสารประเภทอื่นๆ
                  return (
                    <div key={docType.id} className="border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {docType.name}
                        {docType.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      <FileUpload
                        onFileSelect={(files) => handleFileUpload(docType.id, files)}
                        accept=".pdf"
                        multiple={false}
                        error={errors[`file_${docType.id}`]}
                        label={`doc_${docType.id}`}
                      />
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                <p className="text-sm">กำลังโหลดประเภทเอกสาร...</p>
              </div>
            )}
          </div>
        </SimpleCard>

        {/* ข้อมูลเพิ่มเติม */}
        <SimpleCard title="ข้อมูลเพิ่มเติม" icon={FileText}>
          <div className="space-y-4">
            {/* การได้รับทุนจากมหาวิทยาลัย */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ได้รับการสนับสนุนทุนจากมหาวิทยาลัยหรือไม่?
              </label>
              <select
                name="has_university_fund"
                value={formData.has_university_fund}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">เลือก</option>
                <option value="yes">ได้รับ</option>
                <option value="no">ไม่ได้รับ</option>
              </select>
            </div>

            {/* หมายเลขอ้างอิงทุน */}
            {formData.has_university_fund === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเลขอ้างอิงทุน
                </label>
                <input
                  type="text"
                  name="university_fund_ref"
                  value={formData.university_fund_ref}
                  onChange={handleInputChange}
                  placeholder="กรอกหมายเลขอ้างอิงทุน"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* อันดับมหาวิทยาลัย */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อันดับมหาวิทยาลัย/สถาบัน (ถ้ามี)
              </label>
              <input
                type="text"
                name="university_ranking"
                value={formData.university_ranking}
                onChange={handleInputChange}
                placeholder="เช่น QS World University Rankings #500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </SimpleCard>

        {/* ปุ่มดำเนินการ */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={deleteDraft}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
          >
            <X className="h-4 w-4 inline mr-2" />
            ลบร่าง
          </button>

          <button
            type="button"
            onClick={saveDraft}
            disabled={saving || loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
          </button>

          <button
            type="button"
            onClick={submitApplication}
            disabled={loading || saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? 'กำลังส่ง...' : 'ส่งคำร้อง'}
          </button>
        </div>

        {/* คำเตือน */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">ข้อควรระวัง:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>กรุณาตรวจสอบข้อมูลให้ครบถ้วนและถูกต้องก่อนส่งคำร้อง</li>
                <li>เอกสารแนบต้องเป็นไฟล์ PDF เท่านั้น</li>
                <li>เงินรางวัลจะคำนวณอัตโนมัติตามสถานะผู้แต่งและ Quartile ของวารสาร</li>
                <li>หลังจากส่งคำร้องแล้ว จะไม่สามารถแก้ไขข้อมูลได้</li>
                <li>สามารถบันทึกร่างและกลับมาแก้ไขภายหลังได้</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}