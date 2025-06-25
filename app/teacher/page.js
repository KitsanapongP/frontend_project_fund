"use client";

import { useState } from "react";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";
import DashboardContent from "./components/dashboard/DashboardContent";
import ResearchFundContent from "./components/funds/ResearchFundContent";
import ApplicationList from "./components/applications/ApplicationList";
import ApplicationForm from "./components/applications/ApplicationForm";
import UnderDevelopmentContent from "./components/common/UnderDevelopmentContent";

export default function TeacherPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent />;
      case 'research-fund':
        return <ResearchFundContent />;
      case 'applications':
        return <ApplicationList />;
      case 'application-form':
        return <ApplicationForm />;
      case 'profile':
        return <UnderDevelopmentContent currentPage="ข้อมูลส่วนตัว" />;
      case 'draft':
        return <UnderDevelopmentContent currentPage="ร่างที่บันทึกไว้" />;
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
              submenuOpen={submenuOpen}
              setSubmenuOpen={setSubmenuOpen}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="md:ml-64 flex-1">
          {/* Page Header */}
          <div className="bg-white shadow-sm px-8 py-4 mb-6">
            <h1 className="text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h1>
          </div>
          
          {/* Page Content */}
          <div className="px-8 pb-8">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </div>
  );
}