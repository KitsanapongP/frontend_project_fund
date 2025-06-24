"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const Card = ({ title, children, defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  return (
    <div className="bg-white border-2 border-gray-700 rounded-lg shadow-lg mb-5">
      <div 
        className="p-5 border-b border-gray-700 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 rounded-t-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h3 className="text-lg font-bold text-gray-700">{title}</h3>
        <button className="text-gray-700 text-sm flex items-center gap-1 px-2 py-1 rounded">
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

const FundItem = ({ name, amount }) => (
  <div className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0">
    <div className="text-base text-grey-600">{name}</div>
    <div className="text-base font-bold text-green-600">{amount}</div>
  </div>
);

export default function ResearchFundContent() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl text-gray-700 border-b-4 border-blue-500 pb-2">
          💰 กองทุนวิจัย
        </h1>
        <span className="text-gray-600">เลือกปี</span>
        <select className="px-8 py-2 border-2 border-gray-700 text-base bg-white rounded font-medium text-gray-700">
            <option value="2568" className="font-medium text-gray-600">2568</option>
            <option value="2567" className="font-medium text-gray-600">2567</option>
            <option value="2566" className="font-medium text-gray-600">2566</option>
        </select>
      </div>

      <Card title="🎓 ทุนค่าครองชีพ" defaultCollapsed={true}>
        <FundItem name="1. ทุนทำวิจัยต่างประเทศ" amount="100,000 บาท/ไม่เกิน 4 ทุน" />
        <FundItem name="2. ทุนวิจัยในประเทศ" amount="100,000 บาท/ไม่เกิน 4 ทุน" />
        <FundItem name="3. ทุนเข้าร่วมการประชุมวิชาการ" amount="50,000 บาท/ไม่เกิน 6 ทุน" />
      </Card>

      <Card title="🔬 ทุนส่งเสริมวิจัย" defaultCollapsed={true}>
        <FundItem name="1. ทุนวิจัยสถาบัน" amount="20,000 บาท/ไม่เกิน 1 ทุน" />
        <FundItem name="2. ทุนวิจัยใหม่นำเสนอ" amount="20,000 บาท/ไม่เกิน 1 ทุน" />
        <FundItem name="3. ทุนวิจัยร่วมกับหน่วยงานภายนอก" amount="150,000 บาท/ไม่เกิน 2 ทุน" />
      </Card>

      <Card title="📚 ทุนพัฒนาบุคลากร" defaultCollapsed={true}>
        <FundItem name="1. ทุนอบรมเชิงปฏิบัติการ" amount="30,000 บาท/ไม่เกิน 5 ทุน" />
        <FundItem name="2. ทุนศึกษาต่อระดับปริญญาเอก" amount="200,000 บาท/ไม่เกิน 3 ทุน" />
      </Card>
    </div>
  );
}