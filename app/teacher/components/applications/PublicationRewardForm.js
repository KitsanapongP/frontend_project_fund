// app/teacher/components/applications/PublicationRewardForm.js - Complete Version with Submission Management API
"use client";

import { useState, useEffect } from "react";
import { Award, Upload, Users, FileText, Plus, X, Save, Send, AlertCircle, Search, Eye } from "lucide-react";
import PageLayout from "../common/PageLayout";
import SimpleCard from "../common/SimpleCard";
import { systemAPI } from '../../../lib/api';
import { publicationFormAPI, publicationRewardAPI } from '../../../lib/publication_api';
import { authAPI } from '../../../lib/api';

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

export default function PublicationRewardForm() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [years, setYears] = useState([]);
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

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
    publication_reward: 0,
    editor_fee: '',
    publication_fee: '',
    publication_fee_university: '',
    publication_fee_college: '',
    total_claim: 0,
    total_claim_college: 0,
    
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
  }, []);

  // Calculate total claim amount
  useEffect(() => {
    const reward = parseFloat(formData.publication_reward) || 0;
    const universityFee = parseFloat(formData.publication_fee_university) || 0;
    const collegeFee = parseFloat(formData.publication_fee_college) || 0;
    
    setFormData(prev => ({
      ...prev,
      total_claim: reward + universityFee + collegeFee
    }));
  }, [formData.publication_reward, formData.publication_fee_university, formData.publication_fee_college]);

  // Calculate total from college (ค่าปรับปรุง + ค่าตีพิมพ์ - รวมเบิกจากนอก)
  useEffect(() => {
    const reward = parseFloat(formData.publication_reward) || 0;
    const pubFee = parseFloat(publicationFee) || 0;
    const externalTotal = externalFundings.reduce((sum, funding) => sum + (parseFloat(funding.amount) || 0), 0);
    
    const collegeTotal = reward + pubFee - externalTotal;
    
    setFormData(prev => ({
      ...prev,
      total_claim_college: collegeTotal > 0 ? collegeTotal : 0
    }));
  }, [formData.publication_reward, publicationFee, externalFundings]);

  // Calculate reward based on author status and quartile
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

  const calculateReward = (authorStatus, quartile) => {
    // Reward calculation logic based on author status and journal quartile
    const rewardRates = {
      'first_author': {
        'Q1': 50000,
        'Q2': 40000,
        'Q3': 30000,
        'Q4': 20000
      },
      'corresponding_author': {
        'Q1': 50000,
        'Q2': 40000,
        'Q3': 30000,
        'Q4': 20000
      },
      'co_author': {
        'Q1': 25000,
        'Q2': 20000,
        'Q3': 15000,
        'Q4': 10000
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

  const handleRemoveCoauthor = (user) => {
    setCoauthors(prev => prev.filter(c => c.user_id !== user.user_id));
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

  const handleExternalFundingFileChange = (id, file) => {
    if (file && file.type === 'application/pdf') {
      // อัพเดตไฟล์ในตาราง
      setExternalFundings(externalFundings.map(funding => 
        funding.id === id ? { ...funding, file: file } : funding
      ));
      
      // เพิ่มไฟล์ไปที่เอกสารอื่นๆ ด้วย
      const newDoc = {
        id: Date.now(),
        name: file.name,
        file: file,
        type: 'external_funding'
      };
      setOtherDocuments([...otherDocuments, newDoc]);
    } else {
      alert('กรุณาเลือกไฟล์ PDF เท่านั้น');
    }
  };

  const handleFileUpload = (documentTypeId, files) => {
    if (files && files.length > 0) {
      if (documentTypeId === 'other') {
        // สำหรับเอกสารอื่นๆ เก็บทั้งหมดเป็น array
        setOtherDocuments(files);
      } else {
        // สำหรับเอกสารที่กำหนด เก็บเฉพาะไฟล์แรก
        setUploadedFiles(prev => ({
          ...prev,
          [documentTypeId]: files[0]
        }));
      }

      // Clear error
      if (errors[`file_${documentTypeId}`]) {
        setErrors(prev => ({ ...prev, [`file_${documentTypeId}`]: '' }));
      }
    }
  };

  const removeFile = (documentTypeId) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[documentTypeId];
      return updated;
    });
  };

  const removeOtherDocument = (index) => {
    setOtherDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.author_status) newErrors.author_status = 'กรุณาเลือกสถานะผู้ยื่น';
    if (!formData.article_title.trim()) newErrors.article_title = 'กรุณากรอกชื่อบทความ';
    if (!formData.journal_name.trim()) newErrors.journal_name = 'กรุณากรอกชื่อวารสาร';
    if (!formData.journal_quartile) newErrors.journal_quartile = 'กรุณาเลือก Quartile';
    if (!formData.bank_account.trim()) newErrors.bank_account = 'กรุณากรอกเลขที่บัญชีธนาคาร';
    if (!formData.bank_name.trim()) newErrors.bank_name = 'กรุณากรอกชื่อธนาคาร';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'กรุณากรอกเบอร์โทรศัพท์';
    
    // Validate journal year
    const currentYear = new Date().getFullYear();
    const journalYear = parseInt(formData.journal_year);
    if (!journalYear || journalYear < 1900 || journalYear > currentYear + 5) {
      newErrors.journal_year = 'กรุณากรอกปีที่ถูกต้อง';
    }

    // Validate required documents
    const requiredDocTypes = documentTypes.filter(doc => doc.is_required);
    requiredDocTypes.forEach(docType => {
      if (!uploadedFiles[docType.document_type_id]) {
        newErrors[`file_${docType.document_type_id}`] = `กรุณาอัปโหลด${docType.document_name}`;
      }
    });

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDraft = async () => {
    try {
      setSaving(true);

      const applicationData = {
        submission_type: 'publication_reward',
        year_id: formData.year_id,
        ...formData,
        uploadedFiles,
        otherDocuments,
        coauthors: coauthors.map(c => c.user_id),
        isDraft: true
      };

      if (currentSubmissionId) {
        await submissionAPI.updateSubmission(currentSubmissionId, applicationData);
        alert('บันทึกร่างเรียบร้อยแล้ว');
      } else {
        const response = await publicationRewardAPI.createApplication(applicationData);
        setCurrentSubmissionId(response.submission.submission_id);
        alert('บันทึกร่างเรียบร้อยแล้ว');
      }

    } catch (error) {
      console.error('Error saving draft:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกร่าง: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setSaving(false);
    }
  };

  const submitApplication = async () => {
    if (!validateForm()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);

      const applicationData = {
        submission_type: 'publication_reward',
        year_id: formData.year_id,
        ...formData,
        uploadedFiles,
        otherDocuments,
        coauthors: coauthors.map(c => c.user_id),
        isDraft: false
      };

      let submissionId = currentSubmissionId;

      if (!submissionId) {
        const response = await publicationRewardAPI.createApplication(applicationData);
        submissionId = response.submission.submission_id;
      }

      await publicationRewardAPI.submitApplication(submissionId);
      
      alert('ส่งคำร้องเรียบร้อยแล้ว');
      resetForm();
      
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำร้อง: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
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
      publication_reward: 0,
      editor_fee: '',
      publication_fee: '',
      publication_fee_university: '',
      publication_fee_college: '',
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
    setErrors({});
    setCurrentSubmissionId(null);
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
        { label: "เลือกคำร้อง" },
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
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
                <option value="co_author">ผู้แต่งร่วม (Co-author)</option>
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
                  <option value="">เลือก Quartile</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
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
                  <option value="มกราคม">มกราคม</option>
                  <option value="กุมภาพันธ์">กุมภาพันธ์</option>
                  <option value="มีนาคม">มีนาคม</option>
                  <option value="เมษายน">เมษายน</option>
                  <option value="พฤษภาคม">พฤษภาคม</option>
                  <option value="มิถุนายน">มิถุนายน</option>
                  <option value="กรกฎาคม">กรกฎาคม</option>
                  <option value="สิงหาคม">สิงหาคม</option>
                  <option value="กันยายน">กันยายน</option>
                  <option value="ตุลาคม">ตุลาคม</option>
                  <option value="พฤศจิกายน">พฤศจิกายน</option>
                  <option value="ธันวาคม">ธันวาคม</option>
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
                        onClick={() => handleRemoveCoauthor(coauthor)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="ลบผู้ร่วมวิจัย"
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
        <SimpleCard title="การคำนวณเงินรางวัล" icon={Award}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 divide-x divide-gray-200">
            {/* ฝั่งซ้าย - ค่าปรับปรุง ค่าตีพิมพ์ และรวมเบิกจากวิทยาลัย */}
            <div className="space-y-6 lg:pr-6">
              {/* ค่าปรับปรุง */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค่าปรับปรุง (บาท)
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-semibold text-gray-800">
                    {formData.publication_reward.toLocaleString()}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  คำนวณอัตโนมัติจากสถานะผู้แต่งและ Quartile
                </p>
              </div>

              {/* ค่าตีพิมพ์ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค่าตีพิมพ์ (บาท)
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-semibold text-gray-800">
                    {publicationFee.toLocaleString()}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  คำนวณอัตโนมัติตามเงื่อนไข
                </p>
              </div>

              {/* รวมเบิกจากวิทยาลัยการคอม */}
              <div className="mt-8">
                <h4 className="text-base font-medium text-gray-900 mb-3">รวมเบิกจากวิทยาลัยการคอม</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-700">จำนวน</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {(formData.total_claim_college || 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-700">บาท</span>
                </div>
              </div>
            </div>

            {/* ฝั่งขวา - ตารางเบิกจากนอกมหาวิทยาลัย */}
            <div className="lg:pl-6">
              <h4 className="font-medium text-gray-900 mb-4">เบิกจากนอกมหาวิทยาลัย</h4>
              
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
                              <span className="text-gray-700">{funding.fundName || 'แนบไฟล์หลักฐาน'}</span>
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
                  {externalFundings.reduce((sum, funding) => sum + (parseFloat(funding.amount) || 0), 0).toLocaleString()}
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