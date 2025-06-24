"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const StatCard = ({ number, label, gradient }) => (
  <div className={`${gradient} text-white p-6 rounded-lg shadow-lg`}>
    <div className="text-4xl font-bold mb-1">{number}</div>
    <div className="text-sm opacity-90">{label}</div>
  </div>
);

const Card = ({ title, children, defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  return (
    <div className="bg-white border-2 border-gray-700 rounded-lg shadow-lg mb-5">
      <div 
        className="p-5 border-b border-gray-700 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 rounded-t-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h3 className="text-lg font-bold text-gray-700">{title}</h3>
        <button className="text-red-600 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50">
          <ChevronDown className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>
      {!collapsed && (
        <div className="p-6 text-gray-600">
          {children}
        </div>
      )}
    </div>
  );
};

export default function DashboardContent() {
  return (
    <div>
      <h1 className="text-3xl mb-8 text-gray-700 border-b-4 border-blue-500 pb-2">
        📊 Dashboard - ภาพรวมระบบ
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard number="125" label="คำร้องทั้งหมด" gradient="bg-gradient-to-br from-blue-500 to-purple-500" />
        <StatCard number="89" label="อนุมัติแล้ว" gradient="bg-gradient-to-br from-green-500 to-blue-500" />
        <StatCard number="43" label="รอพิจารณา" gradient="bg-gradient-to-br from-pink-400 to-violet-500" />
        <StatCard number="13" label="ไม่อนุมัติ" gradient="bg-gradient-to-br from-red-500 to-pink-500" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-xl mb-4 text-gray-700">📈 สถิติการใช้งานรายเดือน</h3>
        <div className="h-72 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-lg">
          กราฟแสดงสถิติการใช้งาน (Chart.js หรือ D3.js จะแสดงที่นี่)
        </div>
      </div>

      <Card title="🔔 ประกาศล่าสุด">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
          <strong>ประกาศ:</strong> เปิดรับสมัครทุนวิจัยประจำปี 2568 ตั้งแต่วันที่ 1 กรกฎาคม - 31 สิงหาคม 2568
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <strong>อัพเดท:</strong> ระบบได้รับการปรับปรุงใหม่ เพิ่มฟีเจอร์การติดตามสถานะคำร้องแบบ Real-time
        </div>
      </Card>
    </div>
  );
}