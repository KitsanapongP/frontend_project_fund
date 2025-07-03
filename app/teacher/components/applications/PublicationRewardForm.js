// PublicationRewardForm.js - ฟอร์มขอเบิกเงินรางวัลการตีพิมพ์
import { useState, useEffect } from "react";
import { Save, Send, Award, Plus, X, AlertCircle, Upload, Users, FileText, DollarSign } from "lucide-react";
import PageLayout from "../common/PageLayout";
import Card from "../common/Card";

// Mock data - ในระบบจริงจะดึงจาก API
const mockUsers = [
  { user_id: 1, user_fname: "สมชาย", user_lname: "ใจดี", email: "somchai@university.ac.th" },
  { user_id: 2, user_fname: "สุดา", user_lname: "รักเรียน", email: "suda@university.ac.th" },
  { user_id: 3, user_fname: "วิชัย", user_lname: "เก่งกาจ", email: "wichai@university.ac.th" }
];

const documentTypes = [
  { id: 'qsw_ranking', name: 'QS WUR 1-400', required: false },
  { id: 'full_reprint', name: 'Full reprint (บทความตีพิมพ์)', required: true },
  { id: 'scopus_isi', name: 'Scopus-ISI (หลักฐานการจัดอันดับ)', required: true },
  { id: 'bank_book', name: 'สำเนาบัญชีธนาคาร', required: true },
  { id: 'payment_exchange', name: 'Payment / Exchange rate', required: false },
  { id: 'page_charge_invoice', name: 'Page charge Invoice', required: false },
  { id: 'page_charge_receipt', name: 'Page charge Receipt', required: false },
  { id: 'editor_invoice', name: 'Manuscript Editor Invoice', required: false },
  { id: 'editor_receipt', name: 'Manuscript Receipt', required: false },
  { id: 'review_response', name: 'Review Response (Special issue)', required: false },
  { id: 'other', name: 'เอกสารอื่นๆ', required: false }
];

// คำนวณเงินรางวัลตามสถานะและ Quartile
const calculateReward = (authorStatus, quartile) => {
  const rates = {
    'first_author': { 'Q1': 100000, 'Q2': 75000, 'Q3': 50000, 'Q4': 25000 },
    'corresponding_author': { 'Q1': 50000, 'Q2': 30000, 'Q3': 15000, 'Q4': 7500 },
    'co_author': { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 }
  };
  
  return rates[authorStatus]?.[quartile] || 0;
};

export default function PublicationRewardForm() {
  const [formData, setFormData] = useState({
    // ข้อมูลผู้ขอ
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
    article_online_date: '',
    
    // ระดับวารสาร
    journal_tier: '',
    journal_quartile: '',
    in_isi: false,
    in_scopus: false,
    article_type: '',
    journal_type: '',
    
    // ข้อมูลการเงิน
    publication_reward: 0,
    editor_fee: 0,
    publication_fee_university: 0,
    publication_fee_college: 0,
    
    // ข้อมูลอื่นๆ
    university_ranking: '',
    bank_account: '',
    bank_name: '',
    phone_number: '',
    has_university_fund: false,
    university_fund_ref: ''
  });

  const [coauthors, setCoauthors] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [showCoauthorSelector, setShowCoauthorSelector] = useState(false);

  // คำนวณเงินรางวัลอัตโนมัติ
  useEffect(() => {
    if (formData.author_status && formData.journal_quartile) {
      const reward = calculateReward(formData.author_status, formData.journal_quartile);
      setFormData(prev => ({
        ...prev,
        publication_reward: reward,
        total_amount: reward + prev.publication_fee_university + prev.publication_fee_college
      }));
    }
  }, [formData.author_status, formData.journal_quartile]);

  // คำนวณยอดรวมเมื่อค่าต่างๆ เปลี่ยน
  useEffect(() => {
    const total = parseFloat(formData.publication_reward || 0) + 
                  parseFloat(formData.publication_fee_university || 0) + 
                  parseFloat(formData.publication_fee_college || 0);
    setFormData(prev => ({ ...prev, total_amount: total }));
  }, [formData.publication_reward, formData.publication_fee_university, formData.publication_fee_college]);

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
    const user = mockUsers.find(u => u.user_id === userId);
    if (user && !coauthors.find(c => c.user_id === userId)) {
      setCoauthors(prev => [...prev, user]);
    }
    setShowCoauthorSelector(false);
  };

  const handleRemoveCoauthor = (userId) => {
    setCoauthors(prev => prev.filter(c => c.user_id !== userId));
  };

  const handleFileUpload = (documentType, files) => {
    if (files && files[0]) {
      setUploadedFiles(prev => ({
        ...prev,
        [documentType]: files[0]
      }));
    }
  };

  const removeFile = (documentType) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[documentType];
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
      if (!uploadedFiles[doc.id]) {
        newErrors[`doc_${doc.id}`] = `กรุณาแนบ${doc.name}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (isDraft = false) => {
    if (!isDraft && !validateForm()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const submitData = {
      ...formData,
      coauthors: coauthors.map(c => c.user_id),
      status: isDraft ? 'draft' : 'submitted'
    };

    console.log("Submit Data:", submitData);
    console.log("Uploaded Files:", uploadedFiles);

    alert(isDraft ? "บันทึกร่างเรียบร้อยแล้ว" : "ส่งคำร้องเรียบร้อยแล้ว");
  };

  return (
    <PageLayout
      title="แบบฟอร์มขอเบิกเงินรางวัลการตีพิมพ์"
      subtitle="สำหรับขอเบิกเงินรางวัลการตีพิมพ์บทความวิจัย"
      icon={Award}
      breadcrumbs={[
        { label: "หน้าแรก", href: "/teacher" },
        { label: "ยื่นคำร้อง" },
        { label: "ขอเบิกเงินรางวัลการตีพิมพ์" }
      ]}
    >
      <form className="space-y-6">
        {/* ข้อมูลผู้ขอและผู้ร่วมวิจัย */}
        <Card title="ข้อมูลผู้ขอและผู้ร่วมวิจัย" icon={Users}>
          <div className="space-y-4">
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
                <option value="">-- เลือกสถานะ --</option>
                <option value="first_author">First Author</option>
                <option value="corresponding_author">Corresponding Author</option>
                <option value="co_author">Co-author</option>
              </select>
              {errors.author_status && (
                <p className="text-red-500 text-sm mt-1">{errors.author_status}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ผู้ร่วมวิจัย
              </label>
              <div className="space-y-2">
                {coauthors.map(author => (
                  <div key={author.user_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">{author.user_fname} {author.user_lname}</span>
                      <span className="text-sm text-gray-600 ml-2">({author.email})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoauthor(author.user_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
                
                {showCoauthorSelector ? (
                  <div className="bg-white border rounded-lg p-3">
                    <select
                      onChange={(e) => handleAddCoauthor(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue=""
                    >
                      <option value="">-- เลือกผู้ร่วมวิจัย --</option>
                      {mockUsers.filter(u => !coauthors.find(c => c.user_id === u.user_id)).map(user => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.user_fname} {user.user_lname} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCoauthorSelector(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus size={16} />
                    เพิ่มผู้ร่วมวิจัย
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ข้อมูลบทความ */}
        <Card title="ข้อมูลบทความ" icon={FileText}>
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.article_title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.article_title && (
                <p className="text-red-500 text-sm mt-1">{errors.article_title}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อวารสาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="journal_name"
                value={formData.journal_name}
                onChange={handleInputChange}
                placeholder="เช่น IEEE ACCESS"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.journal_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.journal_name && (
                <p className="text-red-500 text-sm mt-1">{errors.journal_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ฉบับที่
              </label>
              <input
                type="text"
                name="journal_issue"
                value={formData.journal_issue}
                onChange={handleInputChange}
                placeholder="เช่น 10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หน้าที่
              </label>
              <input
                type="text"
                name="journal_pages"
                value={formData.journal_pages}
                onChange={handleInputChange}
                placeholder="เช่น 126240-124"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เดือน
              </label>
              <select
                name="journal_month"
                value={formData.journal_month}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- เลือกเดือน --</option>
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปี
              </label>
              <input
                type="text"
                name="journal_year"
                value={formData.journal_year}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL วารสาร
              </label>
              <input
                type="url"
                name="journal_url"
                value={formData.journal_url}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Online Date
              </label>
              <input
                type="date"
                name="article_online_date"
                value={formData.article_online_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

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
                <option value="">-- เลือก Quartile --</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
              {errors.journal_quartile && (
                <p className="text-red-500 text-sm mt-1">{errors.journal_quartile}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระดับวารสาร
              </label>
              <select
                name="journal_tier"
                value={formData.journal_tier}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- เลือกระดับ --</option>
                <option value="Tier 1">Tier 1</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Tier 3">Tier 3</option>
                <option value="Tier 4">Tier 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทบทความ
              </label>
              <select
                name="article_type"
                value={formData.article_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- เลือกประเภท --</option>
                <option value="Original research article">Original research article</option>
                <option value="Review article">Review article</option>
                <option value="Short communication">Short communication</option>
                <option value="Letter">Letter</option>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- เลือกประเภท --</option>
                <option value="Regular issue">Regular issue</option>
                <option value="Special issue">Special issue</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="in_isi"
                  checked={formData.in_isi}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">อยู่ในฐานข้อมูล ISI</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="in_scopus"
                  checked={formData.in_scopus}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">อยู่ในฐานข้อมูล SCOPUS</span>
              </label>
            </div>
          </div>
        </Card>

        {/* ข้อมูลการเงิน */}
        <Card title="ข้อมูลการเงิน" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เงินรางวัลการตีพิมพ์ (บาท)
              </label>
              <input
                type="number"
                name="publication_reward"
                value={formData.publication_reward}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">คำนวณอัตโนมัติตามสถานะและ Quartile</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าตอบแทนผู้ปรับปรุงบทความ (บาท)
              </label>
              <input
                type="number"
                name="editor_fee"
                value={formData.editor_fee}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าธรรมเนียมที่ได้รับจากมหาวิทยาลัย (บาท)
              </label>
              <input
                type="number"
                name="publication_fee_university"
                value={formData.publication_fee_university}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าธรรมเนียมที่ขอส่วนต่างจากวิทยาลัย (บาท)
              </label>
              <input
                type="number"
                name="publication_fee_college"
                value={formData.publication_fee_college}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รวมเบิก (บาท)
              </label>
              <input
                type="number"
                value={formData.total_amount}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-green-50 font-bold text-lg"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_university_fund"
                  checked={formData.has_university_fund}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  ผ่านการขอทุน/พิจารณาจากมหาวิทยาลัยขอนแก่นมาแล้ว
                </span>
              </label>
            </div>

            {formData.has_university_fund && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเลขอ้างอิงทุน
                </label>
                <input
                  type="text"
                  name="university_fund_ref"
                  value={formData.university_fund_ref}
                  onChange={handleInputChange}
                  placeholder="เช่น KKU-1369"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </Card>

        {/* ข้อมูลธนาคาร */}
        <Card title="ข้อมูลการรับเงิน">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขบัญชีธนาคาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.bank_account ? 'border-red-500' : 'border-gray-300'
                }`}
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.bank_name ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- เลือกธนาคาร --</option>
                <option value="กรุงไทย">กรุงไทย</option>
                <option value="กรุงเทพ">กรุงเทพ</option>
                <option value="กสิกรไทย">กสิกรไทย</option>
                <option value="ไทยพาณิชย์">ไทยพาณิชย์</option>
                <option value="กรุงศรีอยุธยา">กรุงศรีอยุธยา</option>
              </select>
              {errors.bank_name && (
                <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ลำดับของมหาวิทยาลัย 1-400
              </label>
              <input
                type="text"
                name="university_ranking"
                value={formData.university_ranking}
                onChange={handleInputChange}
                placeholder="เช่น 401"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* อัพโหลดเอกสาร */}
        <Card title="เอกสารประกอบ" icon={Upload}>
          <div className="space-y-4">
            {documentTypes.map(docType => (
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
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(docType.id, e.target.files)}
                    />
                    <label
                      htmlFor={`file-${docType.id}`}
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex gap-2">
            <AlertCircle className="text-blue-600" size={20} />
            <p className="text-sm text-blue-700">
              รองรับไฟล์นามสกุล .pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png ขนาดไม่เกิน 10 MB
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="btn btn-secondary"
          >
            <Save size={20} />
            บันทึกร่าง
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="btn btn-primary"
          >
            <Send size={20} />
            ส่งคำร้อง
          </button>
        </div>
      </form>
    </PageLayout>
  );
}