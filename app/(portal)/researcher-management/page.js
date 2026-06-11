// page.js
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext"; // Import useAuth มาใช้
import { normalizeRoleName } from "@/app/lib/access_routing";
// ... (import อื่นๆ เหมือนเดิม)
import Header from "./component/layout/Header";
import Navigation from "./component/layout/Navigation";
import ResearcherExpertise from "./component/ResearcherExpertise";
import SearchInstructor from "./component/SearchInstructor";
import Instructor from "./component/Instructor";

export default function ResearcherManagementPage() {
  const { user } = useAuth();
  const normalizedRole = normalizeRoleName(user?.role ?? user?.role_id);
  
  const [isOpen, setIsOpen] = useState(false);
  
  // กำหนด Default Page: ถ้าเป็น admin ให้ไปที่ search-instructor ถ้าไม่ใช่ให้ไปที่ edit-info
  const [currentPage, setCurrentPage] = useState(
    normalizedRole === "admin" ? "search-instructor" : "edit-instructor-info"
  );

  const [selectedInstructorId, setSelectedInstructorId] = useState(null);

  // ใช้ useEffect ช่วยกรณีที่ user object โหลดมาช้ากว่า component
  useEffect(() => {
    if (normalizedRole === "admin") {
      setCurrentPage("search-instructor");
    }
  }, [normalizedRole]);

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        Navigation={(props) => (
          <Navigation 
            {...props} 
            currentPage={currentPage} 
            handleNavigate={handleNavigate} 
          />
        )} 
        currentPageTitle="จัดการบุคลากร" 
      />

      <div className="flex pt-16">
       {/* <aside className="hidden md:block w-72 fixed h-full bg-white border-r overflow-y-auto">
          <div className="p-4">
             <Navigation 
               currentPage={currentPage} 
               handleNavigate={handleNavigate} 
             />
          </div>
        </aside>*/}

        <main className="flex-1 p-4 sm:p-6 lg:p-10 transition-all">
          <div className="max-w-6xl mx-auto">
            
            {/* --- เพิ่มเงื่อนไขหน้า Search สำหรับ Admin --- */}
            {currentPage === "search-instructor" && (
              <SearchInstructor onSelect={(id) => {
                // เมื่อ Admin กดปุ่ม "คลิก" ในตาราง ให้เปลี่ยนหน้าไปหน้าแก้ไขข้อมูล
                // และอาจจะเก็บ ID ไว้ใน state หรือส่งผ่าน ResearcherContent ต่อไป
                setCurrentPage("edit-instructor-info");
              }} />
            )}

            {/* หน้าแก้ไขข้อมูลหลัก */}
            {currentPage === "edit-instructor-info" && (
              <Instructor currentPage={currentPage} />
            )}

            {/* หน้าความเชี่ยวชาญ */}
            {currentPage === "expertise" && (
              <ResearcherExpertise />
            )}

            {/* หน้าเว็บไซต์ที่เกี่ยวข้อง */}
            {currentPage === "related-websites" && (
              <Instructor currentPage={currentPage} />
            )}

            {/* แจ้งเตือน Placeholder */}
            {!["edit-instructor-info", "expertise", "related-websites", "search-instructor"].includes(currentPage) && (
              <div className="flex items-center justify-center min-h-[400px] text-gray-400 bg-white rounded-3xl border-2 border-dashed">
                กำลังพัฒนาเนื้อหาส่วน {currentPage}...
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}