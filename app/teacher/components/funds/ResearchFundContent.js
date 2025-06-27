// funds/ResearchFundContent.js
"use client";

import { useState, useEffect } from "react";
import { DollarSign, Info, Users, TrendingUp, Search, Filter, ChevronDown, Funnel } from "lucide-react";
import { mockFundCategories, mockYears } from "../data/mockData";
import PageHeader from "../common/PageHeader";
import Card from "../common/Card";
import SimpleCard from "../common/SimpleCard";
import EmptyState from "../common/EmptyState";

export default function ResearchFundContent({ onNavigate }) {
  const [selectedYear, setSelectedYear] = useState("2568");
  const [fundCategories, setFundCategories] = useState([]);
  const [filteredFunds, setFilteredFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, available, full
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFundData(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, categoryFilter, fundCategories]);

  const loadFundData = (year) => {
    setLoading(true);
    setTimeout(() => {
      const filteredData = mockFundCategories.filter(cat => cat.year === year);
      setFundCategories(filteredData);
      setFilteredFunds(filteredData);
      setLoading(false);
    }, 200);
  };

  const applyFilters = () => {
    let filtered = [...fundCategories];

    // Apply filters to each category and subcategory
    filtered = filtered.map(category => ({
      ...category,
      subcategories: category.subcategories.filter(sub => {
        // Search filter
        if (searchTerm && !sub.subcategorie_name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Status filter
        const isAvailable = sub.remaining_grant > 0 && sub.remaining_budget > 0;
        if (statusFilter === "available" && !isAvailable) return false;
        if (statusFilter === "full" && isAvailable) return false;

        return true;
      })
    }));

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(cat => cat.category_id === parseInt(categoryFilter));
    }

    // Remove empty categories
    filtered = filtered.filter(cat => cat.subcategories.length > 0);

    setFilteredFunds(filtered);
  };

  const handleApply = (fund, category) => {
    if (onNavigate) {
      onNavigate('application-form', { 
        fund: fund,
        category: category 
      });
    } else {
      console.log("Apply for fund:", fund);
    }
  };

  const calculateTotalStats = (categories = fundCategories) => {
    let totalBudget = 0;
    let totalUsed = 0;
    let totalGrants = 0;
    let remainingGrants = 0;
    let availableFunds = 0;
    let fullFunds = 0;

    categories.forEach(category => {
      category.subcategories.forEach(sub => {
        totalBudget += sub.allocated_amount;
        totalUsed += sub.used_amount;
        totalGrants += sub.max_grants;
        remainingGrants += sub.remaining_grant;
        
        if (sub.remaining_grant > 0 && sub.remaining_budget > 0) {
          availableFunds++;
        } else {
          fullFunds++;
        }
      });
    });

    return { totalBudget, totalUsed, totalGrants, remainingGrants, availableFunds, fullFunds };
  };

  const stats = calculateTotalStats();
  const filteredStats = calculateTotalStats(filteredFunds);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="กองทุนวิจัย"
        subtitle="รายการทุนวิจัยที่เปิดรับสมัคร"
        icon={DollarSign}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          label="ทุนที่เปิดรับ"
          value={`${stats.availableFunds} ทุน`}
          bgColor="bg-yellow-50"
          textColor="text-yellow-800"
          icon={Users}
        />
        <StatsCard
          label="ทุนที่ปิดรับ"
          value={`${stats.fullFunds} ทุน`}
          bgColor="bg-red-50"
          textColor="text-red-800"
          percentage={stats.totalGrants > 0 ? ((stats.fullFunds / (stats.availableFunds + stats.fullFunds)) * 100).toFixed(0) : 0}
        />
      </div>

      {/* Search and Filters */}
      <SimpleCard 
        title="ตัวกรองการค้นหา"
        icon={Funnel}
        className="mb-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาชื่อทุน..."
                className="w-full pl-10 pr-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 "
            >
              <Filter size={18} />
              ตัวกรอง
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <select 
              className="w-44 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {mockYears.map(year => (
                <option key={year} value={year}>ปีงบประมาณ {year}</option>
              ))}
            </select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะทุน
                </label>
                <select
                  className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">ทุกประเภท</option>
                  {fundCategories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            </div>
          )}

          {/* Filter Summary - แสดงเสมอ */}
          <div className="text-sm text-gray-600">
            แสดง {filteredStats.availableFunds + filteredStats.fullFunds} ทุน จากทั้งหมด {stats.availableFunds + stats.fullFunds} ทุน
          </div>
        </div>
      </SimpleCard>

      {/* Fund Categories */}
      {filteredFunds.length === 0 ? (
        <EmptyState
          icon={Info}
          title="ไม่พบทุนที่ค้นหา"
          message={searchTerm || statusFilter !== "all" || categoryFilter !== "all"
            ? "ไม่พบทุนที่ตรงกับเงื่อนไขการค้นหา ลองปรับเงื่อนไขใหม่"
            : `ไม่พบข้อมูลทุนสำหรับปี ${selectedYear}`
          }
          variant="bordered"
          action={
            (searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ล้างการค้นหา
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          {filteredFunds.map(category => (
            <Card 
              key={category.category_id} 
              title={`${category.category_name} (${category.subcategories.length} ทุน)`}
              icon={DollarSign}
              collapsible={true}
              defaultCollapsed={false}
            >
              <div className="space-y-4">
                {category.subcategories.map(fund => (
                  <FundItem 
                    key={fund.subcategorie_id}
                    fund={fund}
                    category={category}
                    onApply={handleApply}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Information Box */}
      <SimpleCard 
        title="หมายเหตุ" 
        icon={Info} 
        className="mt-6"
        headerClassName="bg-blue-50"
      >
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>ผู้สมัครต้องยื่นเอกสารครบถ้วนภายในระยะเวลาที่กำหนด</li>
          <li>การพิจารณาอนุมัติขึ้นอยู่กับคณะกรรมการพิจารณาทุน</li>
          <li>ติดต่อสอบถามเพิ่มเติม: กองบริหารงานวิจัย โทร. 1234</li>
        </ul>
      </SimpleCard>
    </div>
  );
}

// StatsCard Component
function StatsCard({ label, value, bgColor, textColor, icon: Icon, percentage }) {
  return (
    <div className={`${bgColor} p-4 rounded-lg transition-all hover:shadow-md`}>
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
function FundItem({ fund, category, onApply }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH').format(amount);
  };

  const percentageUsed = fund.allocated_amount > 0 
    ? (fund.used_amount / fund.allocated_amount) * 100 
    : 0;

  const isAvailable = fund.remaining_grant > 0 && fund.remaining_budget > 0;

  return (
    <div className={`border rounded-lg p-4 hover:shadow-md transition-all ${
      !isAvailable ? 'bg-gray-50' : 'bg-white'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-base font-medium text-gray-800">
              {fund.subcategorie_name}
            </h4>
            {!isAvailable && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                ปิดรับแล้ว
              </span>
            )}
          </div>
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
          onClick={() => onApply(fund, category)}
          disabled={!isAvailable}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isAvailable 
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
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