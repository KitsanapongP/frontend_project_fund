// common/UnderDevelopmentContent.js
"use client";

import { Construction } from "lucide-react";
import PageLayout from "./PageLayout";
import { EmptyStateIllustration } from "./EmptyState";

export default function UnderDevelopmentContent({ currentPage }) {
  return (
    <PageLayout
      title={currentPage}
      subtitle="หน้านี้อยู่ระหว่างการพัฒนา"
      icon={Construction}
    >
      <div className="bg-white rounded-lg shadow-sm p-8">
        <EmptyStateIllustration
          illustrationType="no-data"
          title="🚧 อยู่ระหว่างการพัฒนา"
          message={`หน้า ${currentPage} จะพร้อมใช้งานเร็วๆ นี้ กรุณาติดตามอัพเดทจากทีมพัฒนา`}
          action={
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-secondary"
            >
              ย้อนกลับ
            </button>
          }
        />
      </div>
    </PageLayout>
  );
}