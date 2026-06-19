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

const ALLOWED_ROLES = ["admin", "academic_designer"];

export default function ResearcherManagementPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const normalizedRole = normalizeRoleName(user?.role ?? user?.role_id);

  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("search-instructor");
  const [selectedInstructorId, setSelectedInstructorId] = useState(null);

  useEffect(() => {
    if (isLoading) return;
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      router.replace("/");
    }
  }, [normalizedRole, isLoading, router]);

  if (isLoading || !ALLOWED_ROLES.includes(normalizedRole)) {
    return null;
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