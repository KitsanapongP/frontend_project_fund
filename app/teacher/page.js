// page.js
"use client";

import { useState } from "react";
import Header from "./components/header";
import Navigation from "./components/nav";
import DashboardContent from "./components/dashboard";
import ResearchFundContent from "./components/researchfund";
import UnderDevelopmentContent from "./components/develop";

export default function DashboardPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent />;
      case 'research-fund':
        return <ResearchFundContent />;
      default:
        return <UnderDevelopmentContent currentPage={currentPage} />;
    }
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
        <div className="hidden md:block w-56 bg-white border-r border-gray-300 fixed h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="p-5">
            <Navigation
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              submenuOpen={submenuOpen}
              setSubmenuOpen={setSubmenuOpen}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="md:ml-56 flex-1 p-8">
          {renderPageContent()}
        </div>
      </div>
    </div>
  );
}