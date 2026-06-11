"use client";
import { ExternalLink } from "lucide-react";

export default function ResearcherLinks({ formData, handleInputChange }) {
  // ประกาศฟิลด์ตามโครงสร้างและชื่อ Key ที่ใช้จริงในระบบ
  const linkFields = [
    { key: "scopus_id", label: "Link Scopus", placeholder: "ระบุ Scopus Author ID (เช่น 6506313...)" },
    { key: "scholar_author_id", label: "Link Google Scholar", placeholder: "ระบุ Google Scholar ID (เช่น GsfOlmYAAAAJ)" },
    { key: "thaijo_author_id", label: "Link TCI / ThaiJO", placeholder: "ระบุ ThaiJO Author ID (เช่น social13-971)" },
  ];

  // ฟังก์ชันสำหรับแปลง ID ให้เป็น URL ฉบับสมบูรณ์ก่อนเปิดเว็บ
  const getFullUrl = (key, value) => {
    if (!value) return "#";
    
    // ถ้าผู้ใช้เผลอกรอกมาเป็น URL เต็มอยู่แล้ว ให้ส่งกลับไปตรงๆ
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    const cleanId = value.trim();

    switch (key) {
      case "scopus_id": {
        // ล้างคำว่า SCOPUS_ID: ออกถ้ามี
        const scopusClean = cleanId.replace(/^SCOPUS_ID:/i, "").trim();
        return `https://www.scopus.com/authid/detail.uri?authorId=${scopusClean}`;
      }
        
      case "scholar_author_id":
        return `https://scholar.google.com/citations?user=${cleanId}&hl=th`;
        
      case "thaijo_author_id": {
      const cleanId = value.trim();
      
      //ใช้ลิงก์รูปแบบจริงตามหน้าเว็บกลางของ ThaiJO ได้ทันที
      return `https://www.tci-thaijo.org/en/authors/${cleanId}`;
    }
        
      default:
        return "#";
    }
  };

  return (
    <div className="w-full transition-all">
      {/* ปรับเป็น Grid เพื่อให้ยืดหดกางเท่ากับกล่องข้อมูลส่วนตัวด้านบน */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        {linkFields.map((field) => (
          <div key={field.key} className="flex flex-col space-y-1.5 w-full">
            {/* ส่วนป้ายกำกับ (Label) + ไอคอนเปิดลิงก์ภายนอก */}
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-gray-500 tracking-wide">
                {field.label}
              </label>
              
              {/* แสดงปุ่มลิงก์ภายนอกเมื่อมีข้อมูลอยู่ใน Input */}
              {formData[field.key] && (
                <a 
                  href={getFullUrl(field.key, formData[field.key])} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-600 transition-colors p-0.5 rounded"
                  title="เปิดลิงก์ในหน้าต่างใหม่"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* ช่องกรอกข้อมูล (Input) */}
            <div className="relative flex items-center w-full">
              <input
                type="text"
                value={formData[field.key] || ""}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-white border border-gray-200 text-sm font-medium text-gray-800 placeholder:text-gray-300 rounded-xl px-4 py-2.5 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-50/50 shadow-inner-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}