"use client";

import { useState, useEffect } from "react";
import { Upload, X, AlertCircle, Save, Send, FileText, Bold, Italic, List, ListOrdered, Link2, Image as ImageIcon, Heading1, Quote } from "lucide-react";
import { mockFundCategories, mockDocumentTypes } from "../data/mockData";
import PageLayout from "../common/PageLayout";
import Card from "../common/Card";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Cookies from 'js-cookie';

// Tiptap Menu Bar Component
const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
        }`}
      >
        <Heading1 size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('bold') ? 'bg-gray-200' : ''
        }`}
      >
        <Bold size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('italic') ? 'bg-gray-200' : ''
        }`}
      >
        <Italic size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('bulletList') ? 'bg-gray-200' : ''
        }`}
      >
        <List size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('orderedList') ? 'bg-gray-200' : ''
        }`}
      >
        <ListOrdered size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('blockquote') ? 'bg-gray-200' : ''
        }`}
      >
        <Quote size={18} />
      </button>
      
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('link') ? 'bg-gray-200' : ''
        }`}
      >
        <Link2 size={18} />
      </button>
    </div>
  );
};

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
  const [showFundInfo, setShowFundInfo] = useState(false);
  const [originalFundSelection, setOriginalFundSelection] = useState(null);
  const [otherDocuments, setOtherDocuments] = useState([]);

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: formData.project_description,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData(prev => ({ ...prev, project_description: html }));
      
      // Clear error when user starts typing
      if (errors.project_description && html && html !== '<p></p>') {
        setErrors(prev => ({ ...prev, project_description: "" }));
      }
    },
  });

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
        
        // Store original selection for comparison
        setOriginalFundSelection({
          category_id: category.category_id.toString(),
          subcategory_id: selectedFund.fund.subcategorie_id.toString()
        });
        
        // Show fund info
        setShowFundInfo(true);
      }
    }
  }, [selectedFund]);

  // โหลดข้อมูลจาก cookies เมื่อ component mount
  useEffect(() => {
    const savedDraft = Cookies.get('applicationDraft');
    if (savedDraft && !selectedFund) { // โหลดจาก cookie ถ้าไม่ได้มาจากการเลือกทุน
      try {
        const draftData = JSON.parse(savedDraft);
        setFormData(draftData.formData || {});
        // ไม่โหลดไฟล์จาก cookie เพราะ File object ไม่สามารถ serialize ได้
        
        // ถ้ามี category_id ให้โหลด category ด้วย
        if (draftData.formData.category_id) {
          const category = mockFundCategories.find(c => 
            c.category_id === parseInt(draftData.formData.category_id)
          );
          setSelectedCategory(category);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

    // บันทึกร่างอัตโนมัติเมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    // Debounce เพื่อไม่ให้บันทึกบ่อยเกินไป
    const timeoutId = setTimeout(() => {
      if (formData.project_title || formData.project_description) {
        const draftData = {
          formData,
          savedAt: new Date().toISOString()
        };
        Cookies.set('applicationDraft', JSON.stringify(draftData), { expires: 7 }); // เก็บ 7 วัน
      }
    }, 1000); // รอ 1 วินาทีหลังจากหยุดพิมพ์

    return () => clearTimeout(timeoutId);
  }, [formData]);

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
    
    // Hide fund info if user changes from original selection
    if (originalFundSelection && categoryId !== originalFundSelection.category_id) {
      setShowFundInfo(false);
    }
  };

  const handleSubcategoryChange = (e) => {
    const subcategoryId = e.target.value;
    setFormData(prev => ({ ...prev, subcategory_id: subcategoryId }));
    
    // Clear error when user starts typing
    if (errors.subcategory_id) {
      setErrors(prev => ({ ...prev, subcategory_id: "" }));
    }
    
    // Hide fund info if user changes from original selection
    if (originalFundSelection && subcategoryId !== originalFundSelection.subcategory_id) {
      setShowFundInfo(false);
    }
  };

  // แก้ไขฟังก์ชัน handleFileUpload
  const handleFileUpload = (documentTypeId, files) => {
    if (files && files.length > 0) {
      // ถ้าเป็นเอกสารอื่นๆ (id = 3)
      if (documentTypeId === 3) {
        const newFiles = Array.from(files);
        setOtherDocuments(prev => [...prev, ...newFiles]);
      } else {
        // เอกสารอื่นๆ ยังคงเป็นไฟล์เดียว
        setUploadedFiles(prev => ({
          ...prev,
          [documentTypeId]: files[0]
        }));
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

  // เพิ่มฟังก์ชันลบไฟล์เอกสารอื่นๆ
  const removeOtherDocument = (index) => {
    setOtherDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.project_title) newErrors.project_title = "กรุณากรอกชื่อโครงการ";
    if (!formData.project_description || formData.project_description === '<p></p>') {
      newErrors.project_description = "กรุณากรอกรายละเอียดโครงการ";
    }
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

  // แก้ไข handleSubmit
  const handleSubmit = (isDraft = false) => {
    if (!isDraft && !validateForm()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // รวมเอกสารอื่นๆ เข้ากับ uploadedFiles
    const allFiles = {
      ...uploadedFiles,
      otherDocuments: otherDocuments
    };

    console.log("Form Data:", formData);
    console.log("Uploaded Files:", allFiles);
    console.log("Is Draft:", isDraft);

    if (isDraft) {
      // บันทึกร่างใน cookies
      const draftData = {
        formData,
        savedAt: new Date().toISOString()
      };
      Cookies.set('applicationDraft', JSON.stringify(draftData), { expires: 7 });
      alert("บันทึกร่างเรียบร้อยแล้ว");
    } else {
      // ถ้าส่งคำร้องสำเร็จ ให้ลบ draft
      Cookies.remove('applicationDraft');
      alert("ส่งคำร้องเรียบร้อยแล้ว");
      
      // Reset form
      setFormData({
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
      setUploadedFiles({});
      setOtherDocuments([]);
      setSelectedCategory(null);
      
      // Clear editor
      if (editor) {
        editor.commands.setContent('');
      }
    }
  };

  // เพิ่มฟังก์ชันลบร่าง
  const clearDraft = () => {
    if (confirm("ต้องการลบร่างที่บันทึกไว้หรือไม่?")) {
      Cookies.remove('applicationDraft');
      alert("ลบร่างเรียบร้อยแล้ว");
      window.location.reload();
    }
  };

  return (
    <PageLayout
      title="แบบฟอร์มยื่นขอทุน"
      subtitle="กรอกข้อมูลเพื่อยื่นขอทุนวิจัย"
      icon={FileText}
      breadcrumbs={[
        { label: "หน้าแรก", href: "/teacher" },
        { label: "ยื่นคำร้อง" },
      ]}
    >
      <form className="space-y-6">
        {/* แสดงข้อความถ้ามีร่างที่บันทึกไว้ */}
        {Cookies.get('applicationDraft') && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6 flex justify-between items-center">
            <div>
              <p className="text-yellow-900 font-medium">มีร่างที่บันทึกไว้</p>
              <p className="text-sm text-yellow-700">ระบบได้โหลดข้อมูลร่างล่าสุดของคุณ</p>
            </div>
            <button
              type="button"
              onClick={clearDraft}
              className="text-yellow-600 hover:text-yellow-800 text-sm underline"
            >
              ลบร่าง
            </button>
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
                className={`w-full px-4 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.project_title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="กรอกชื่อโครงการ"
              />
              {errors.project_title && (
                <p className="text-red-500 text-sm mt-1">{errors.project_title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปีงบประมาณ <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="2568">2568</option>
                <option value="2567">2567</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภททุน <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleCategoryChange}
                className={`w-full px-4 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.category_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- เลือกประเภททุน --</option>
                {mockFundCategories.map(category => (
                  <option key={`${category.category_id}-${category.year}`} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภททุนย่อย <span className="text-red-500">*</span>
              </label>
              <select
                name="subcategory_id"
                value={formData.subcategory_id}
                onChange={handleSubcategoryChange}
                disabled={!selectedCategory}
                className={`w-full px-4 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.subcategory_id ? 'border-red-500' : 'border-gray-300'
                } ${!selectedCategory ? 'bg-gray-100' : ''}`}
              >
                <option value="">-- เลือกประเภททุนย่อย --</option>
                {selectedCategory?.subcategories.map(sub => {
                  const isAvailable = sub.remaining_grant > 0 && sub.remaining_budget > 0;
                  return (
                    <option 
                      key={sub.subcategorie_id} 
                      value={sub.subcategorie_id}
                      disabled={!isAvailable}
                      className={!isAvailable ? 'text-gray-400' : ''}
                    >
                      {sub.subcategorie_name} 
                      {isAvailable 
                        ? ` (เหลือ ${sub.remaining_grant} ทุน)`
                        : ' (เต็มแล้ว)'
                      }
                    </option>
                  );
                })}
              </select>
              {errors.subcategory_id && (
                <p className="text-red-500 text-sm mt-1">{errors.subcategory_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนเงินที่ขอ (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="requested_amount"
                value={formData.requested_amount}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.requested_amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.requested_amount && (
                <p className="text-red-500 text-sm mt-1">{errors.requested_amount}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียดโครงการ <span className="text-red-500">*</span>
              </label>
              <div className={`text-gray-700 border rounded-lg overflow-hidden ${
                errors.project_description ? 'border-red-500' : 'border-gray-300'
              }`}>
                <MenuBar editor={editor} />
                <EditorContent 
                  editor={editor} 
                  className="text-gray-700 prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
                />
              </div>
              {errors.project_description && (
                <p className="text-red-500 text-sm mt-1">{errors.project_description}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Document Upload */}
        <Card title="เอกสารประกอบ" collapsible={false}>
          
          <div className="space-y-4">
            {mockDocumentTypes.map(docType => {
              // ถ้าเป็นเอกสารอื่นๆ (id = 6)
              if (docType.id === 3) {
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
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        multiple
                        onChange={(e) => {
                          handleFileUpload(docType.id, e.target.files);
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

              // เอกสารอื่นๆ นอกจาก id = 6 แสดงแบบเดิม (ไฟล์เดียว)
              return (
                <div key={docType.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between text-gray-700 mb-2">
                    <label className="font-medium">
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
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex gap-2 ">
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

      {/* Add custom styles for Tiptap */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 200px;
        }
        
        .ProseMirror:focus {
          outline: none;
        }
        
        .ProseMirror p {
          margin: 0 0 1rem 0;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0 0 1rem 0;
        }
        
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          margin: 0 0 0.75rem 0;
          font-weight: 600;
        }
        
        .ProseMirror h2 {
          font-size: 1.5rem;
        }
        
        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 0 0 1rem 0;
          color: #6b7280;
        }
        
        .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .ProseMirror-focused {
          outline: none;
        }
      `}</style>
    </PageLayout>
  );
}