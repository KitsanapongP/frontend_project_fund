// PublicationRewardForm.js - ฟอร์มขอเบิกเงินรางวัลการตีพิมพ์บทความ
"use client";

import { useState, useEffect } from "react";
import { Save, Send, Award, Plus, X, AlertCircle, Upload, Users, FileText, DollarSign } from "lucide-react";
import PageLayout from "../common/PageLayout";
import SimpleCard from "../common/SimpleCard";
import { publicationAPI, publicationFormAPI } from '../../../lib/publication_api';

// แก้ไข fetchUsers function
const fetchUsers = async () => {
  try {
    const response = await publicationFormAPI.getUsers();
    return response.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// แก้ไข fetchDocumentTypes function
const fetchDocumentTypes = async () => {
  try {
    const response = await publicationFormAPI.getDocumentTypes();
    return response.document_types || [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    // Fallback to default document types
    return [
      { id: 1, code: 'qsw_ranking', name: 'QS WUR 1-400', required: false },
      { id: 2, code: 'full_reprint', name: 'Full reprint (บทความตีพิมพ์)', required: true },
      { id: 3, code: 'scopus_isi', name: 'Scopus-ISI (หลักฐานการจัดอันดับ)', required: true },
      { id: 4, code: 'bank_book', name: 'สำเนาบัญชีธนาคาร', required: true },
      { id: 5, code: 'payment_exchange', name: 'Payment / Exchange rate', required: false },
      { id: 6, code: 'page_charge_invoice', name: 'Page charge Invoice', required: false },
      { id: 7, code: 'page_charge_receipt', name: 'Page charge Receipt', required: false },
      { id: 8, code: 'editor_invoice', name: 'Manuscript Editor Invoice', required: false },
      { id: 9, code: 'editor_receipt', name: 'Manuscript Receipt', required: false },
      { id: 10, code: 'review_response', name: 'Review Response (Special issue)', required: false },
      { id: 11, code: 'other', name: 'เอกสารอื่นๆ', required: false, multiple: true }
    ];
  }
};

// Constants
const authorPositions = [
  { id: 'corresponding_author', name: 'Corresponding Author' },
  { id: 'first_author', name: 'First Author' },
  { id: 'co_author', name: 'Co-Author' }
];

const journalQuartiles = ['Top 5%','Top 10%','Q1', 'Q2', 'Q3', 'Q4','TCI (กลุ่ม 1)'];
const articleTypes = ['Original Research Article', 'Review Article', 'Letter', 'Editorial'];
const journalTypes = ['Regular Issue', 'Special Issue'];
const bankNames = ['กรุงไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'กสิกรไทย', 'กรุงศรีอยุธยา'];

// คำนวณเงินรางวัลตามสถานะและ Quartile
const calculateReward = (authorStatus, quartile) => {
  const rates = {
    'corresponding_author': { 'Q1': 50000, 'Q2': 40000, 'Q3': 30000, 'Q4': 20000 },
    'first_author': { 'Q1': 40000, 'Q2': 32000, 'Q3': 24000, 'Q4': 16000 },
    'co_author': { 'Q1': 25000, 'Q2': 20000, 'Q3': 15000, 'Q4': 10000 }
  };
  
  return rates[authorStatus]?.[quartile] || 0;
};

// Component สำหรับ upload file
const FileUploadField = ({ docType, files, onUpload, onRemove, error }) => {
  // ตรวจสอบว่าเป็น multiple files หรือไม่
  const isMultiple = docType.multiple === true || docType.multiple === 1 || docType.code === 'other' || docType.id === 11;
  const fileList = isMultiple ? (files || []) : (files ? [files] : []);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-gray-700">
          {docType.name}
          {docType.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* แสดงไฟล์ที่อัปโหลดแล้ว */}
      {fileList.length > 0 && (
        <div className="space-y-2 mb-3">
          {fileList.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-2 text-green-600">
                <Upload size={16} />
                <span className="text-sm">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(docType.id, isMultiple ? index : null)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ปุ่มเลือกไฟล์ - แสดงเสมอสำหรับ multiple files หรือเมื่อยังไม่มีไฟล์ */}
      {(isMultiple || fileList.length === 0) && (
        <div>
          <input
            type="file"
            id={`file-${docType.id}`}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple={isMultiple}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUpload(docType.id, e.target.files, isMultiple);
              }
              // Reset input value เพื่อให้สามารถเลือกไฟล์เดิมได้อีกครั้ง
              e.target.value = '';
            }}
          />
          <label
            htmlFor={`file-${docType.id}`}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            <span>{isMultiple ? 'เพิ่มไฟล์' : 'เลือกไฟล์'}</span>
          </label>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default function PublicationRewardForm() {
  const [users, setUsers] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherDocuments, setOtherDocuments] = useState([]);
  const [formData, setFormData] = useState({
    // ข้อมูลผู้ขอเบิก
    author_status: '',
    
    // ข้อมูลบทความ
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
    
    // ข้อมูลการเบิก
    publication_reward: 0,
    editor_fee: '',
    publication_fee: '',
    publication_fee_university: '',
    publication_fee_college: '',
    total_claim: 0,
    
    // ข้อมูลอื่นๆ
    university_ranking: '',
    bank_account: '',
    bank_name: '',
    phone_number: '',
    has_university_fund: '',
    university_fund_ref: ''
  });

  const [coauthors, setCoauthors] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [showCoauthorSelector, setShowCoauthorSelector] = useState(false);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [usersData, docTypesData] = await Promise.all([
        fetchUsers(),
        fetchDocumentTypes()
      ]);
      setUsers(usersData);
      setDocumentTypes(docTypesData);
      setLoading(false);
    };
    loadData();
  }, []);

  // คำนวณยอดรวมเบิก
  useEffect(() => {
    const reward = parseFloat(formData.publication_reward) || 0;
    const universityFee = parseFloat(formData.publication_fee_university) || 0;
    const collegeFee = parseFloat(formData.publication_fee_college) || 0;
    
    setFormData(prev => ({
      ...prev,
      total_claim: reward + universityFee + collegeFee
    }));
  }, [formData.publication_reward, formData.publication_fee_university, formData.publication_fee_college]);

  // คำนวณเงินรางวัลเมื่อเปลี่ยนสถานะหรือ Quartile
  useEffect(() => {
    if (formData.author_status && formData.journal_quartile) {
      const reward = calculateReward(formData.author_status, formData.journal_quartile);
      setFormData(prev => ({ ...prev, publication_reward: reward }));
    }
  }, [formData.author_status, formData.journal_quartile]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddCoauthor = (userId) => {
    const user = users.find(u => u.user_id === userId);
    if (user && !coauthors.find(c => c.user_id === userId)) {
      setCoauthors(prev => [...prev, user]);
    }
  };

  const handleRemoveCoauthor = (userId) => {
    setCoauthors(prev => prev.filter(c => c.user_id !== userId));
  };

  const handleFileUpload = (documentTypeId, files, isMultiple) => {
    if (files && files.length > 0) {
      // ถ้าเป็นเอกสารอื่นๆ (id = 11 หรือ code = 'other')
      if (documentTypeId === 11 || isMultiple) {
        const newFiles = Array.from(files);
        setOtherDocuments(prev => [...prev, ...newFiles]);
      } else {
        // เอกสารอื่นๆ ยังคงเป็นไฟล์เดียว
        setUploadedFiles(prev => ({
          ...prev,
          [documentTypeId]: files[0]
        }));
      }
      
      // Clear error when file is uploaded
      if (errors[`doc_${documentTypeId}`]) {
        setErrors(prev => ({ ...prev, [`doc_${documentTypeId}`]: "" }));
      }
    }
  };

  const removeOtherDocument = (index) => {
    setOtherDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeFile = (documentTypeId) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[documentTypeId];
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.author_status) newErrors.author_status = "กรุณาเลือกสถานะผู้ยื่น";
    if (!formData.article_title) newErrors.article_title = "กรุณากรอกชื่อบทความ";
    if (!formData.journal_name) newErrors.journal_name = "กรุณากรอกชื่อวารสาร";
    if (!formData.journal_quartile) newErrors.journal_quartile = "กรุณาเลือก Quartile";
    if (!formData.bank_account) newErrors.bank_account = "กรุณากรอกเลขบัญชีธนาคาร";
    if (!formData.bank_name) newErrors.bank_name = "กรุณากรอกชื่อธนาคาร";
    if (!formData.phone_number) newErrors.phone_number = "กรุณากรอกเบอร์โทรศัพท์";
    
    // Check required documents
    const requiredDocs = documentTypes.filter(doc => doc.required);
    requiredDocs.forEach(doc => {
      if (!uploadedFiles[doc.id] || (Array.isArray(uploadedFiles[doc.id]) && uploadedFiles[doc.id].length === 0)) {
        newErrors[`doc_${doc.id}`] = `กรุณาแนบ${doc.name}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validateForm()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      // แสดง loading
      setLoading(true);
      
      // เตรียม FormData สำหรับส่งไฟล์
      const formDataToSend = new FormData();
      
      // เพิ่มข้อมูลฟอร์ม
      const submitData = {
        author_status: formData.author_status,
        article_title: formData.article_title,
        journal_name: formData.journal_name,
        journal_issue: formData.journal_issue,
        journal_pages: formData.journal_pages,
        journal_month: formData.journal_month,
        journal_year: formData.journal_year,
        journal_url: formData.journal_url,
        doi: formData.doi,
        article_online_db: formData.article_online_db,
        journal_tier: formData.journal_tier,
        journal_quartile: formData.journal_quartile,
        in_isi: formData.in_isi,
        in_scopus: formData.in_scopus,
        article_type: formData.article_type,
        journal_type: formData.journal_type,
        editor_fee: parseFloat(formData.editor_fee) || 0,
        publication_fee_university: parseFloat(formData.publication_fee_university) || 0,
        publication_fee_college: parseFloat(formData.publication_fee_college) || 0,
        university_ranking: formData.university_ranking,
        bank_account: formData.bank_account,
        bank_name: formData.bank_name,
        phone_number: formData.phone_number,
        has_university_fund: formData.has_university_fund,
        university_fund_ref: formData.university_fund_ref,
        coauthors: coauthors.map(c => c.user_id),
        status: isDraft ? 'draft' : 'submitted'
      };
      
      // ส่งข้อมูลเป็น JSON string
      formDataToSend.append('data', JSON.stringify(submitData));
      
      // เพิ่มไฟล์เอกสารทั่วไป
      Object.entries(uploadedFiles).forEach(([docTypeId, file]) => {
        if (file) {
          formDataToSend.append(`doc_${docTypeId}`, file);
        }
      });
      
      // เพิ่มไฟล์เอกสารอื่นๆ (multiple files)
      if (otherDocuments.length > 0) {
        otherDocuments.forEach((file, index) => {
          formDataToSend.append(`doc_11_${index}`, file);
        });
      }

      // Log for debugging
      console.log('Submitting form data:', submitData);
      console.log('Files to upload:', {
        singleFiles: Object.keys(uploadedFiles).length,
        otherDocuments: otherDocuments.length
      });
      
      // ส่งข้อมูลไปยัง API
      const response = await publicationAPI.create(formDataToSend);
      
      // แสดงข้อความสำเร็จ
      alert(isDraft ? "บันทึกร่างเรียบร้อยแล้ว" : "ส่งคำร้องเรียบร้อยแล้ว");
      
      // ถ้าไม่ใช่ draft ให้ redirect ไปหน้ารายการ
      if (!isDraft) {
        // ใช้ Next.js router
        // import { useRouter } from 'next/navigation';
        // const router = useRouter();
        // router.push('/teacher/applications');
        
        // หรือ reset form
        resetForm();
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      
      // แสดง error message ที่เจาะจงกว่า
      let errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      
      if (error.response) {
        // Error from server
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.request) {
        // Network error
        errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      university_ranking: '',
      bank_account: '',
      bank_name: '',
      phone_number: '',
      has_university_fund: '',
      university_fund_ref: ''
    });
    setCoauthors([]);
    setUploadedFiles({});
    setOtherDocuments([]);
    setErrors({});
  };

  return (
    <PageLayout
      title="แบบฟอร์มขอเบิกเงินรางวัลการตีพิมพ์บทความ"
      subtitle="สำหรับขอเบิกเงินรางวัลและค่าใช้จ่ายในการตีพิมพ์บทความวิชาการ"
      icon={Award}
      breadcrumbs={[
        { label: "หน้าแรก", href: "/teacher" },
        { label: "เลือกคำร้อง" },
        { label: "ขอเบิกเงินรางวัลการตีพิมพ์" },
      ]}
    >
      <form className="space-y-6">
        {/* ข้อมูลผู้ขอเบิก */}
        <SimpleCard title="ข้อมูลผู้ขอเบิก" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะผู้ยื่น <span className="text-red-500">*</span>
              </label>
              <select
                name="author_status"
                value={formData.author_status}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.author_status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- เลือกสถานะ --</option>
                {authorPositions.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                ))}
              </select>
              {errors.author_status && (
                <p className="text-red-500 text-sm mt-1">{errors.author_status}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ผู้ร่วม (Co-authors)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="px-4 py-2 text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                    {coauthors.length > 0 ? (
                      <span className="text-sm">{coauthors.length} คนที่เลือกแล้ว</span>
                    ) : (
                      <span className="text-sm text-gray-500">ยังไม่ได้เลือก</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCoauthorSelector(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Plus size={16} className="inline mr-1" />
                  เพิ่ม
                </button>
              </div>

              {/* รายชื่อ Co-authors */}
              {coauthors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {coauthors.map(coauthor => (
                    <div key={coauthor.user_id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm">{coauthor.user_fname} {coauthor.user_lname}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoauthor(coauthor.user_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SimpleCard>

        {/* ข้อมูลบทความ */}
        <SimpleCard title="ข้อมูลบทความ" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบทความ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="article_title"
                value={formData.article_title}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.article_title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="กรอกชื่อบทความ"
              />
              {errors.article_title && (
                <p className="text-red-500 text-sm mt-1">{errors.article_title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ตีพิมพ์ในวารสาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="journal_name"
                value={formData.journal_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.journal_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ชื่อวารสาร"
              />
              {errors.journal_name && (
                <p className="text-red-500 text-sm mt-1">{errors.journal_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ฉบับที่/หน้า
              </label>
              <input
                type="text"
                name="journal_issue"
                value={formData.journal_issue}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="เช่น ฉบับที่ 10 หน้า 126240-124"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เดือน/ปี
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="journal_month"
                  value={formData.journal_month}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="เดือน"
                />
                <input
                  type="text"
                  name="journal_year"
                  value={formData.journal_year}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="ปี"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL วารสาร
              </label>
              <input
                type="url"
                name="journal_url"
                value={formData.journal_url}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DOI
              </label>
              <input
                type="text"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="10.1109/ACCESS.2024.xxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระดับวารสาร (Quartile) <span className="text-red-500">*</span>
              </label>
              <select
                name="journal_quartile"
                value={formData.journal_quartile}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.journal_quartile ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- เลือก Quartile --</option>
                {journalQuartiles.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {errors.journal_quartile && (
                <p className="text-red-500 text-sm mt-1">{errors.journal_quartile}</p>
              )}
            </div>

            <div className="md:col-span-2 flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="in_isi"
                  checked={formData.in_isi}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">อยู่ในฐานข้อมูล ISI</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="in_scopus"
                  checked={formData.in_scopus}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">อยู่ในฐานข้อมูล SCOPUS</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทบทความ
              </label>
              <select
                name="article_type"
                value={formData.article_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- เลือกประเภท --</option>
                {articleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทวารสาร
              </label>
              <select
                name="journal_type"
                value={formData.journal_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- เลือกประเภท --</option>
                {journalTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </SimpleCard>

        {/* ข้อมูลการเบิก */}
        <SimpleCard title="ข้อมูลการเบิก" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เงินรางวัลการตีพิมพ์
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="publication_reward"
                  value={formData.publication_reward}
                  disabled
                  className="w-full px-4 py-2 pr-12 text-gray-500 border border-gray-300 rounded-lg bg-gray-50"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">บาท</span>
              </div>
              {formData.author_status && formData.journal_quartile && (
                <p className="text-xs text-gray-500 mt-1">
                  คำนวณอัตโนมัติตามสถานะและ Quartile
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าตอบแทนผู้ปรับปรุงบทความ
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="editor_fee"
                  value={formData.editor_fee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pr-12 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">บาท</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าธรรมเนียมการตีพิมพ์ที่ได้รับจากการสนับสนุนมหาวิทยาลัย
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="publication_fee_university"
                  value={formData.publication_fee_university}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pr-12 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">บาท</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าธรรมเนียมการตีพิมพ์ที่ขอส่วนต่างจากวิทยาลัยคอมพิวเตอร์
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="publication_fee_college"
                  value={formData.publication_fee_college}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pr-12 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">บาท</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รวมเบิก
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="total_claim"
                  value={formData.total_claim}
                  disabled
                  className="w-full px-4 py-2 pr-12 text-gray-500 border border-gray-300 rounded-lg bg-yellow-50 font-semibold text-lg"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">บาท</span>
              </div>
            </div>
          </div>
        </SimpleCard>

        {/* ข้อมูลอื่นๆ */}
        <SimpleCard title="ข้อมูลอื่นๆ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ลำดับของมหาวิทยาลัย 1-400
              </label>
              <input
                type="text"
                name="university_ranking"
                value={formData.university_ranking}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="เช่น 401"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขบัญชีธนาคาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.bank_account ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0000000000"
              />
              {errors.bank_account && (
                <p className="text-red-500 text-sm mt-1">{errors.bank_account}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อธนาคาร <span className="text-red-500">*</span>
              </label>
              <select
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.bank_name ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- เลือกธนาคาร --</option>
                {bankNames.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              {errors.bank_name && (
                <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทร <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0800000000"
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ผ่านการขอทุน/พิจารณาจากมหาวิทยาลัยขอนแก่นมาแล้วหรือยัง
              </label>
              <select
                name="has_university_fund"
                value={formData.has_university_fund}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- เลือก --</option>
                <option value="yes">ผ่านมาแล้ว</option>
                <option value="no">ยังไม่ผ่าน</option>
              </select>
            </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="เช่น KKU-1369"
                />
              </div>
            )}
          </div>
        </SimpleCard>

        <SimpleCard title="เอกสารประกอบ" icon={Upload}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentTypes.map(docType => {
              // ถ้าเป็นเอกสารอื่นๆ (id = 11 หรือ code = 'other')
              if (docType.id === 11 || docType.code === 'other') {
                return (
                  <div key={docType.id} className="border rounded-lg p-4">
                    <div className="mb-2">
                      <label className="font-medium text-gray-700">
                        {docType.name}
                      </label>
                    </div>

                    {/* แสดงไฟล์ที่อัพโหลดแล้ว */}
                    {otherDocuments.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {otherDocuments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-2 text-green-600">
                              <Upload size={16} />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeOtherDocument(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ปุ่มเพิ่มไฟล์ */}
                    <div>
                      <input
                        type="file"
                        id={`file-${docType.id}`}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => {
                          handleFileUpload(docType.id, e.target.files, true);
                          // Reset input value เพื่อให้สามารถเลือกไฟล์เดิมได้อีกครั้ง
                          e.target.value = '';
                        }}
                      />
                      <label
                        htmlFor={`file-${docType.id}`}
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        onClick={() => {
                          // Force reset input before opening file dialog
                          const input = document.getElementById(`file-${docType.id}`);
                          if (input) input.value = '';
                        }}
                      >
                        <Upload size={16} />
                        <span>เพิ่มไฟล์</span>
                      </label>
                      <span className="text-sm text-gray-600 ml-2">
                        (สามารถเลือกได้หลายไฟล์)
                      </span>
                    </div>
                  </div>
                );
              }

              // เอกสารอื่นๆ นอกจาก id = 11 แสดงแบบเดิม (ไฟล์เดียว)
              return (
                <div key={docType.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-gray-700">
                      {docType.name} {docType.required && <span className="text-red-500">*</span>}
                    </label>
                    {uploadedFiles[docType.id] && (
                      <button
                        type="button"
                        onClick={() => removeFile(docType.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>

                  {uploadedFiles[docType.id] ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Upload size={16} />
                      <span className="text-sm">{uploadedFiles[docType.id].name}</span>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id={`file-${docType.id}`}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(docType.id, e.target.files, false)}
                      />
                      <label
                        htmlFor={`file-${docType.id}`}
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Upload size={16} />
                        <span>เลือกไฟล์</span>
                      </label>
                    </div>
                  )}
                  
                  {errors[`doc_${docType.id}`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`doc_${docType.id}`]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </SimpleCard>

        {/* ปุ่มยื่นคำร้อง */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            <Save size={18} />
            {loading ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Send size={18} />
            {loading ? 'กำลังส่ง...' : 'ส่งคำร้อง'}
          </button>
        </div>
      </form>

      {/* Modal เลือก Co-authors */}
      {showCoauthorSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">เลือกผู้ร่วม (Co-authors)</h3>
            <div className="space-y-2">
              {users.map(user => (
                <label key={user.user_id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coauthors.some(c => c.user_id === user.user_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleAddCoauthor(user.user_id);
                      } else {
                        handleRemoveCoauthor(user.user_id);
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="text-sm">{user.user_fname} {user.user_lname}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCoauthorSelector(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}