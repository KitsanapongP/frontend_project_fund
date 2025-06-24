"use client";

import { 
  LayoutDashboard,
  ChevronDown,
  FileText,
  DollarSign,
  LogOut,
  HandHelping 
} from "lucide-react";

export default function Navigation({ 
  currentPage, 
  setCurrentPage, 
  submenuOpen, 
  setSubmenuOpen 
}) {
  return (
    <nav className="pb-40 md:ms-4 fixed">
      <button
        onClick={() => setCurrentPage('dashboard')}
        className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
          currentPage === 'dashboard' ? 'text-blue-500 font-semibold' : 'text-gray-700'
        }`}
      >
        <LayoutDashboard size={20} />
        <span>แดชบอร์ด</span>
      </button>
      
      <button
        onClick={() => setCurrentPage('research-fund')}
        className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
          currentPage === 'research-fund' ? 'text-blue-500 font-semibold' : 'text-gray-700'
        }`}
      >
        <DollarSign size={20} />
        <span>กองทุนวิจัย</span>
      </button>

      <div>
        <div
          className={`flex items-center mb-2.5 cursor-pointer ${
            ['project', 'activity'].includes(currentPage) ? 'text-blue-500 font-semibold' : 'text-gray-700'
          }`}
          onClick={() => setSubmenuOpen(!submenuOpen)}
        >
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <span>ยื่นคำร้อง</span>
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform duration-500 ms-2 ${
              submenuOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {submenuOpen && (
          <div className="ml-6 mt-2 space-y-1">
            <button
              onClick={() => setCurrentPage('project')}
              className={`flex items-center gap-2 mb-2.5 ${
                currentPage === 'project' ? 'text-blue-500 font-semibold' : 'text-gray-700'
              }`}
            >
              <FileText size={16} />
              <span>แบบฟอร์ม</span>
            </button>
            <button
              onClick={() => setCurrentPage('activity')}
              className={`flex items-center gap-2 mb-2.5 ${
                currentPage === 'activity' ? 'text-blue-500 font-semibold' : 'text-gray-700'
              }`}
            >
              <HandHelping size={16} />
              <span>ส่งคำร้อง</span>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => alert('ออกจากระบบแล้ว')}
        className="flex items-center mt-2 gap-2 text-gray-700 hover:text-blue-600"
      >
        <LogOut size={20} />
        <span>ออกจากระบบ</span>
      </button>
    </nav>
  );
}