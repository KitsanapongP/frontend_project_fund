"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import Header from "../../component/layout/Header";
import Navigation from "../../component/layout/Navigation";
import Instructor from "../../component/Instructor"; 

export default function EditInstructorPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id; 

  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("profile");

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
    setIsOpen(false);
  };

  //เปลี่ยนชื่อฟังก์ชันให้ตรงกับที่น้าต้องการใช้งาน
  const handleBackToPortal = () => {
    router.push("/"); 
  };

  //เพิ่มฟังก์ชันช่วยเรนเดอร์โครงสร้างพร้อมปุ่มย้อนกลับสไตล์ Capsule
  const renderContentWithBack = (content) => (
      <div className="space-y-3">
        <button
          onClick={handleBackToPortal}
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          <ArrowLeft size={16} className="me-2" />
          กลับหน้าหลัก
        </button>
        {content}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
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
        currentPageTitle="แก้ไขข้อมูลอาจารย์"
      />

      <div className="flex pt-16">
        
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
              
            {/*เรียกใช้ renderContentWithBack ครอบเงื่อนไขการแสดงผล Content ด้านล่างแทนปุ่มเก่า */}
            {renderContentWithBack(
              <>
                {["profile", "education", "project", "expertise", "research", "property", "textbooks"].includes(currentPage) ? (
                  <Instructor
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    targetUserId={id}
                  />
                ) : (
                  <div className="flex items-center justify-center min-h-[400px] text-gray-400 bg-white rounded-3xl border-2 border-dashed">
                    กำลังพัฒนาเนื้อหาส่วน {currentPage}...
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}