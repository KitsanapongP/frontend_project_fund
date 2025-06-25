// funds/ResearchFundContent.js
"use client";

import { useState, useEffect } from "react";
import { DollarSign, Info, Users, TrendingUp } from "lucide-react";
import { mockFundCategories, mockYears } from "../data/mockData";
import PageLayout from "../common/PageLayout";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

export default function ResearchFundContent() {
  const [selectedYear, setSelectedYear] = useState("2568");
  const [fundCategories, setFundCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFundData(selectedYear);
  }, [selectedYear]);

  const loadFundData = (year) => {
    setLoading(true);
    setTimeout(() => {
      const filteredData = mockFundCategories.filter(cat => cat.year === year);
      setFundCategories(filteredData);
      setLoading(false);
    }, 500);
  };

  const handleApply = (fund) => {
    console.log("Apply for fund:", fund);
    // Navigate to application form with pre-filled data
  };

  const calculateTotalStats = () => {
    let totalBudget = 0;
    let totalUsed = 0;
    let totalGrants = 0;
    let remainingGrants = 0;

    fundCategories.forEach(category => {
      category.subcategories.forEach(sub => {
        totalBudget += sub.allocated_amount;
        totalUsed += sub.used_amount;
        totalGrants += sub.max_grants;
        remainingGrants += sub.remaining_grant;
      });
    });

    return { totalBudget, totalUsed, totalGrants, remainingGrants };
  };

  const stats = calculateTotalStats();

  const yearSelector = (
    <select 
      className="form-select w-32"
      value={selectedYear}
      onChange={(e) => setSelectedYear(e.target.value)}
    >
      {mockYears.map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  );

  return (
    <PageLayout
      title="กองทุนวิจัย"
      subtitle="รายการทุนวิจัยที่เปิดรับสมัคร"
      icon={DollarSign}
      actions={yearSelector}
      loading={loading}
      breadcrumbs={[
        { label: "หน้าแรก", href: "/teacher" },
        { label: "กองทุนวิจัย" }
      ]}
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="งบประมาณรวม"
          value={`฿${stats.totalBudget.toLocaleString()}`}
          bgColor="bg-blue-50"
          textColor="text-blue-800"
          icon={DollarSign}
        />
        <StatsCard
          label="คงเหลือ"
          value={`฿${(stats.totalBudget - stats.totalUsed).toLocaleString()}`}
          bgColor="bg-green-50"
          textColor="text-green-800"
          icon={TrendingUp}
        />
        <StatsCard
          label="ใช้ไปแล้ว"
          value={`฿${stats.totalUsed.toLocaleString()}`}
          bgColor="bg-yellow-50"
          textColor="text-yellow-800"
          percentage={stats.totalBudget > 0 ? (stats.totalUsed / stats.totalBudget * 100).toFixed(1) : 0}
        />
        <StatsCard
          label="ทุนคงเหลือ"
          value={`${stats.remainingGrants}/${stats.totalGrants}`}
          bgColor="bg-purple-50"
          textColor="text-purple-800"
          icon={Users}
        />
      </div>

      {/* Fund Categories */}
      {fundCategories.length === 0 ? (
        <EmptyState
          icon={Info}
          title="ไม่พบข้อมูลทุน"
          message={`ไม่พบข้อมูลทุนสำหรับปี ${selectedYear}`}
          variant="bordered"
        />
      ) : (
        <div className="space-y-6">
          {fundCategories.map(category => (
            <Card 
              key={category.category_id} 
              title={category.category_name}
              icon={DollarSign}
              collapsible={true}
              defaultCollapsed={false}
            >
              <div className="space-y-4">
                {category.subcategories.map(fund => (
                  <FundItem 
                    key={fund.subcategorie_id}
                    fund={fund}
                    onApply={handleApply}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Information Box */}
      <Card 
        title="ข้อมูลสำคัญ" 
        icon={Info} 
        className="mt-6"
        headerClassName="bg-blue-50"
      >
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>ผู้สมัครต้องยื่นเอกสารครบถ้วนภายในระยะเวลาที่กำหนด</li>
          <li>การพิจารณาอนุมัติขึ้นอยู่กับคณะกรรมการพิจารณาทุน</li>
          <li>ติดต่อสอบถามเพิ่มเติม: กองบริหารงานวิจัย โทร. 1234</li>
        </ul>
      </Card>
    </PageLayout>
  );
}

// StatsCard Component
function StatsCard({ label, value, bgColor, textColor, icon: Icon, percentage }) {
  return (
    <div className={`${bgColor} p-4 rounded-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-sm ${textColor} opacity-80 mb-1`}>{label}</div>
          <div className={`text-xl font-bold ${textColor}`}>{value}</div>
          {percentage && (
            <div className={`text-xs ${textColor} opacity-60 mt-1`}>
              {percentage}% ของทั้งหมด
            </div>
          )}
        </div>
        {Icon && (
          <Icon size={24} className={`${textColor} opacity-40`} />
        )}
      </div>
    </div>
  );
}

// FundItem Component
function FundItem({ fund, onApply }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH').format(amount);
  };

  const percentageUsed = fund.allocated_amount > 0 
    ? (fund.used_amount / fund.allocated_amount) * 100 
    : 0;

  const isAvailable = fund.remaining_grant > 0 && fund.remaining_budget > 0;

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-base font-medium text-gray-800 mb-2">
            {fund.subcategorie_name}
          </h4>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <DollarSign size={14} />
              วงเงิน: {formatCurrency(fund.max_amount_per_grant)} บาท/ทุน
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} />
              จำนวน: {fund.remaining_grant}/{fund.max_grants} ทุน
            </span>
          </div>
        </div>
        <button
          onClick={() => onApply(fund)}
          disabled={!isAvailable}
          className={`btn btn-sm ${
            isAvailable ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'
          }`}
        >
          {isAvailable ? 'สมัครทุน' : 'เต็มแล้ว'}
        </button>
      </div>

      {/* Budget Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>ใช้ไป: {formatCurrency(fund.used_amount)} บาท</span>
          <span>คงเหลือ: {formatCurrency(fund.remaining_budget)} บาท</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              percentageUsed > 75 ? 'bg-red-500' : 
              percentageUsed > 50 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          ใช้ไป {percentageUsed.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}