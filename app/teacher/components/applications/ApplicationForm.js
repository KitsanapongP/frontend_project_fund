"use client";

import { useState, useEffect } from "react";
import { Upload, X, AlertCircle, Save, Send, FileText } from "lucide-react";
import { mockFundCategories, mockDocumentTypes } from "../data/mockData";
import Card from "../common/Card";
import PageHeader from "../common/PageHeader";

export default function ApplicationForm({ selectedFund }) {
  const [formData, setFormData] = useState({
    project_title: "",
    project_description: "",
    year: "2568",
    category_id: "",
    subcategory_id: "",
    requested_amount: "",
    project_duration: "",
    expected_outcomes: "",
    budget_details: ""
  });

  const [uploadedFiles, setUploadedFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Set initial values when selectedFund is provided
  useEffect(() => {
    if (selectedFund && selectedFund.fund) {
      // Find the category from mockFundCategories
      const category = mockFundCategories.find(cat => 
        cat.subcategories.some(sub => sub.subcategorie_id === selectedFund.fund.subcategorie_id)
      );
      
      if (category) {
        setSelectedCategory(category);
        setFormData(prev => ({
          ...prev,
          year: category.year,
          category_id: category.category_id.toString(),
          subcategory_id: selectedFund.fund.subcategorie_id.toString(),
          requested_amount: selectedFund.fund.max_amount_per_grant.toString()
        }));
      }
    }
  }, [selectedFund]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const category = mockFundCategories.find(c => c.category_id === parseInt(categoryId));
    setSelectedCategory(category);
    setFormData(prev => ({ 
      ...prev, 
      category_id: categoryId,
      subcategory_id: "" 
    }));
  };

  const handleFileUpload = (documentTypeId, files) => {
    if (files && files[0]) {
      setUploadedFiles(prev => ({
        ...prev,
        [documentTypeId]: files[0]
      }));
    }
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
    
    if (!formData.project_title) newErrors.project_title = "กรุณากรอกชื่อโครงการ";
    if (!formData.project_description) newErrors.project_description = "กรุณากรอกรายละเอียดโครงการ";
    if (!formData.category_id) newErrors.category_id = "กรุณาเลือกประเภททุน";
    if (!formData.subcategory_id) newErrors.subcategory_id = "กรุณาเลือกประเภททุนย่อย";
    if (!formData.requested_amount) newErrors.requested_amount = "กรุณากรอกจำนวนเงินที่ขอ";
    
    // Check required documents
    const requiredDocs = mockDocumentTypes.filter(doc => doc.required);
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

    console.log("Form Data:", formData);
    console.log("Uploaded Files:", uploadedFiles);
    console.log("Is Draft:", isDraft);

    // In real app, would send to API
    alert(isDraft ? "บันทึกร่างเรียบร้อยแล้ว" : "ส่งคำร้องเรียบร้อยแล้ว");
  };

  return (
    <div>
    <PageHeader
      title="แบบฟอร์มยื่นขอทุน"
      subtitle="กรอกข้อมูลเพื่อยื่นขอทุนวิจัย"
      icon={FileText}
    />
      <form className="space-y-6">
        {/* Show info if fund was pre-selected */}
        {selectedFund && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-900 font-medium">ทุนที่เลือก:</p>
            <p className="text-blue-700">{selectedFund.fund.subcategorie_name}</p>
            <p className="text-sm text-blue-600 mt-1">
              ข้อมูลได้ถูกกรอกอัตโนมัติแล้ว คุณสามารถแก้ไขได้ตามต้องการ
            </p>
          </div>
        )}

        {/* Basic Information */}
        <Card title="ข้อมูลโครงการ" collapsible={false}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อโครงการ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="project_title"
                value={formData.project_title}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-600 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.project_title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="กรอกชื่อโครงการ"
              />
              {errors.project_title && (
                <p className="text-red-500 text-sm mt-1">{errors.project_title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">
                ปีงบประมาณ <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="2568">2568</option>
                <option value="2567">2567</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">
                ประเภททุน <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleCategoryChange}
                className={`w-full px-4 py-2 text-gray-600 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.category_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- เลือกประเภททุน --</option>
                {mockFundCategories.map(category => (
                  <option key={`category-${category.category_id}-${category.year}`} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">
                ประเภททุนย่อย <span className="text-red-500">*</span>
              </label>
              <select
                name="subcategory_id"
                value={formData.subcategory_id}
                onChange={handleInputChange}
                disabled={!selectedCategory}
                className={`w-full px-4 py-2 border text-gray-600 rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.subcategory_id ? 'border-red-500' : 'border-gray-300'
                } ${!selectedCategory ? 'bg-gray-100' : ''}`}
              >
                <option value="">-- เลือกประเภททุนย่อย --</option>
                {selectedCategory?.subcategories.map(sub => (
                  <option key={sub.subcategorie_id} value={sub.subcategorie_id}>
                    {sub.subcategorie_name} (เหลือ {sub.remaining_grant} ทุน)
                  </option>
                ))}
              </select>
              {errors.subcategory_id && (
                <p className="text-red-500 text-sm mt-1">{errors.subcategory_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">
                จำนวนเงินที่ขอ (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="requested_amount"
                value={formData.requested_amount}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.requested_amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.requested_amount && (
                <p className="text-red-500 text-sm mt-1">{errors.requested_amount}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 font-medium mb-2">
                รายละเอียดโครงการ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="project_description"
                value={formData.project_description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.project_description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="อธิบายรายละเอียดโครงการ วัตถุประสงค์ และประโยชน์ที่คาดว่าจะได้รับ"
              />
              {errors.project_description && (
                <p className="form-error">{errors.project_description}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Document Upload */}
        <Card title="เอกสารประกอบ" collapsible={false}>
          
          <div className="space-y-4">
            {mockDocumentTypes.map(docType => (
              <div key={docType.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-700 flex">
                    {docType.name} {docType.required && <span className="text-red-500">*</span>}
                  </label>
                  {uploadedFiles[docType.id] && (
                    <button
                      type="button"
                      onClick={() => removeFile(docType.id)}
                      className="text-red-500 hover:text-red-700 "
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
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => handleFileUpload(docType.id, e.target.files)}
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
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex gap-2">
            <AlertCircle className="text-blue-600" size={20} />
            <p className="text-sm text-blue-700">
              รองรับไฟล์นามสกุล .pdf, .doc, .docx, .xls, .xlsx ขนาดไม่เกิน 10 MB
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
    </div>
  );
}