// app/teacher/page.js - Protected Teacher Dashboard

"use client";

import { useState } from "react";
import AuthGuard from "../components/AuthGuard";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";
import DashboardContent from "./components/dashboard/DashboardContent";
import ResearchFundContent from "./components/funds/ResearchFundContent";
import ApplicationList from "./components/applications/ApplicationList";
import ApplicationForm from "./components/applications/ApplicationForm";
import UnderDevelopmentContent from "./components/common/UnderDevelopmentContent";

function TeacherPageContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedFundData, setSelectedFundData] = useState(null);

  const handleNavigate = (page, data) => {
    // ถ้าออกจากหน้า application-form ให้ล้างข้อมูลทุนที่เลือก
    if (currentPage === 'application-form' && page !== 'application-form') {
      setSelectedFundData(null);
    }
    
    setCurrentPage(page);
    
    if (data) {
      console.log("Navigate with data:", data);
      setSelectedFundData(data);
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent onNavigate={handleNavigate} />;
      case 'research-fund':
        return <ResearchFundContent onNavigate={handleNavigate} />;
      case 'applications':
        return <ApplicationList onNavigate={handleNavigate} />;
      case 'application-form':
        return <ApplicationForm selectedFund={selectedFundData} />;
      case 'profile':
        return <div className="text-gray-700 mt-6">Profile Page - Coming Soon</div>;
      case 'draft':
        return <div className="text-gray-700 mt-6">Draft Page - Coming Soon</div>;
      default:
        return <UnderDevelopmentContent currentPage={currentPage} />;
    }
  };

  const getPageTitle = () => {
    const titles = {
      'dashboard': 'Dashboard',
      'research-fund': 'กองทุนวิจัย',
      'applications': 'คำร้องของฉัน',
      'application-form': 'ยื่นคำร้องใหม่',
      'profile': 'ข้อมูลส่วนตัว',
      'draft': 'ร่างที่บันทึกไว้'
    };
    return titles[currentPage] || currentPage;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        Navigation={() => (
          <Navigation
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            handleNavigate={handleNavigate}
            submenuOpen={submenuOpen}
            setSubmenuOpen={setSubmenuOpen}
          />
        )}
      />

      <div className="flex mt-20 min-h-[calc(100vh-5rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-300 fixed h-[calc(100vh-5rem)] overflow-y-auto shadow-sm">
          <div className="p-5">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                เมนูหลัก
              </h2>
            </div>
            <Navigation
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              handleNavigate={handleNavigate}
              submenuOpen={submenuOpen}
              setSubmenuOpen={setSubmenuOpen}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="md:ml-64 flex-1">
          {/* Page Content */}
          <div className="px-8 pb-8">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherPage() {
  return (
    <AuthGuard 
      allowedRoles={[1, 'teacher']}
      requireAuth={true}
    >
      <TeacherPageContent />
    </AuthGuard>
  );
}