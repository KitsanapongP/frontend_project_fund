"use client";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Header from "./component/layout/Header";
import Navigation from "./component/layout/Navigation";
import ResearcherExpertise from "./component/ResearcherExpertise";
import SearchInstructor from "./component/SearchInstructor";
import Instructor from "./component/Instructor";

export default function ResearcherManagementPage() {
  const { isLoading, hasPermission } = useAuth();
  const canAccess = hasPermission("portal.card.researcher_management.access");

  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("search-instructor");
  const [selectedInstructorId, setSelectedInstructorId] = useState(null);

  if (isLoading || !canAccess) {
    return null;
  }

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
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

      <div className="portal-shell-offset flex">
        <main className="flex-1 p-4 sm:p-6 lg:p-10 transition-all">
          <div className="max-w-6xl mx-auto">

            {currentPage === "search-instructor" && (
              <SearchInstructor onSelect={(id) => {
                setCurrentPage("edit-instructor-info");
              }} />
            )}

            {currentPage === "edit-instructor-info" && (
              <Instructor currentPage={currentPage} />
            )}

            {currentPage === "expertise" && (
              <ResearcherExpertise />
            )}

            {currentPage === "related-websites" && (
              <Instructor currentPage={currentPage} />
            )}

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
