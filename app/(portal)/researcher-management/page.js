"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { normalizeRoleName } from "@/app/lib/access_routing";
import Header from "./component/layout/Header";
import Navigation from "./component/layout/Navigation";
import ResearcherExpertise from "./component/ResearcherExpertise";
import SearchInstructor from "./component/SearchInstructor";
import Instructor from "./component/Instructor";

export default function ResearcherManagementPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const normalizedRole = normalizeRoleName(user?.role ?? user?.role_id);

  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("search-instructor");
  const [selectedInstructorId, setSelectedInstructorId] = useState(null);

  // กัน role ที่ไม่ใช่ admin ออกจากหน้านี้ทันที
  useEffect(() => {
    if (isLoading) return;
    if (normalizedRole !== "admin") {
      router.replace("/");
    }
  }, [normalizedRole, isLoading, router]);

  if (isLoading || normalizedRole !== "admin") {
    return null; // หรือ loading spinner ระหว่างเช็ค/redirect
  }

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