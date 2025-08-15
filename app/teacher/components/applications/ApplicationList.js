"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Eye, Download, FileText, ClipboardList, Plus, AlertCircle } from "lucide-react";
import { submissionAPI } from "@/app/lib/teacher_api";
import apiClient from "@/app/lib/api";
import StatusBadge from "../common/StatusBadge";
import DataTable from "../common/DataTable";
import PageLayout from "../common/PageLayout";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

export default function ApplicationList({ onNavigate }) {
  // State Management
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  
  // Filter Options
  const [years, setYears] = useState([]);
  const [statuses, setStatuses] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Load initial data
  useEffect(() => {
    loadFilterOptions();
    loadSubmissions();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (applications.length > 0) {
      filterApplications();
    }
  }, [searchTerm, statusFilter, typeFilter, yearFilter]);

  // Load filter options from API
  const loadFilterOptions = async () => {
    try {
      // Load years
      const yearsResponse = await apiClient.get('/years');
      setYears(yearsResponse.years || []);
      
      // Load statuses
      const statusResponse = await apiClient.get('/application-status');
      setStatuses(statusResponse.statuses || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
      // Use default values if API fails - อัปเดตตามข้อมูลจริงใน database
      setYears([
        { year_id: 1, year: '2566' },
        { year_id: 2, year: '2567' },
        { year_id: 3, year: '2568' }
      ]);
      setStatuses([
        { application_status_id: 1, status_name: 'รอพิจารณา' },
        { application_status_id: 2, status_name: 'อนุมัติ' },
        { application_status_id: 3, status_name: 'ปฏิเสธ' },
        { application_status_id: 4, status_name: 'ต้องการข้อมูลเพิ่มเติม' },
        { application_status_id: 5, status_name: 'ร่าง' }
      ]);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSubmissions();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentPage, typeFilter, statusFilter, yearFilter]);

  // Load submissions from API
  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        limit: limit
      };
      
      // Add filters if not "all"
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (yearFilter !== "all") params.year_id = yearFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await submissionAPI.getSubmissions(params);
      
      // Debug: Log response to check Status data
      console.log('API Response:', response);
      if (response.submissions && response.submissions.length > 0) {
        console.log('First submission Status:', response.submissions[0].Status);
        console.log('First submission status_id:', response.submissions[0].status_id);
      }
      
      // Handle response
      if (response.success) {
        setApplications(response.submissions || []);
        setFilteredApplications(response.submissions || []);
        
        // Update pagination if available
        if (response.pagination) {
          setTotalPages(response.pagination.total_pages || 1);
        }
      } else {
        throw new Error(response.error || 'Failed to load submissions');
      }
    } catch (err) {
      console.error('Error loading submissions:', err);
      setError('ไม่สามารถโหลดข้อมูลคำร้องได้ กรุณาลองใหม่อีกครั้ง');
      setApplications([]);
      setFilteredApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter applications locally
  const filterApplications = () => {
    let filtered = [...applications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => {
        const searchLower = searchTerm.toLowerCase();
        return (
          app.submission_number?.toLowerCase().includes(searchLower) ||
          app.FundApplicationDetail?.project_title?.toLowerCase().includes(searchLower) ||
          app.PublicationRewardDetail?.paper_title?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status_id?.toString() === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(app => app.submission_type === typeFilter);
    }

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(app => app.year_id?.toString() === yearFilter);
    }

    setFilteredApplications(filtered);
  };

  // Format submission type
  const formatSubmissionType = (type) => {
    const typeMap = {
      'fund_application': 'ทุนวิจัย',
      'publication_reward': 'รางวัลตีพิมพ์',
      'conference_grant': 'ทุนประชุมวิชาการ',
      'training_request': 'ทุนฝึกอบรม'
    };
    return typeMap[type] || type;
  };

  // Get project/paper title
  const getTitle = (row) => {
    if (row.submission_type === 'fund_application') {
      return row.FundApplicationDetail?.project_title || 'ไม่ระบุชื่อโครงการ';
    } else if (row.submission_type === 'publication_reward') {
      return row.PublicationRewardDetail?.paper_title || 'ไม่ระบุชื่อบทความ';
    }
    return '-';
  };

  // Get amount
  const getAmount = (row) => {
    if (row.submission_type === 'fund_application') {
      return row.FundApplicationDetail?.requested_amount || 0;
    } else if (row.submission_type === 'publication_reward') {
      return row.PublicationRewardDetail?.reward_amount || 0;
    }
    return 0;
  };

  // Table columns definition
  const columns = [
    {
      header: "เลขที่คำร้อง",
      accessor: "submission_number",
      className: "font-medium"
    },
    {
      header: "ชื่อโครงการ/บทความ",
      accessor: getTitle,
      className: "max-w-xs truncate"
    },
    {
      header: "ประเภท",
      accessor: "submission_type",
      render: (value) => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {formatSubmissionType(value)}
        </span>
      )
    },
    {
      header: "จำนวนเงิน",
      accessor: getAmount,
      render: (value) => {
        const amount = value || 0;
        return `฿${amount.toLocaleString()}`;
      }
    },
    {
      header: "สถานะ",
      accessor: (row) => {
        // Try multiple ways to get status
        if (row.Status && row.Status.status_name) {
          return row.Status.status_name;
        } else if (row.status && row.status.status_name) {
          return row.status.status_name;
        } else {
          // Fallback to status_id mapping ตามข้อมูลจริงใน database
          const statusMap = {
            1: 'รอพิจารณา',
            2: 'อนุมัติ',
            3: 'ปฏิเสธ',
            4: 'ต้องการข้อมูลเพิ่มเติม',
            5: 'ร่าง'
          };
          return statusMap[row.status_id] || 'ไม่ทราบสถานะ';
        }
      },
      render: (value, row) => (
        <StatusBadge 
          status={value} 
          statusId={row.status_id} 
        />
      )
    },
    {
      header: "วันที่ส่ง",
      accessor: "created_at",
      render: (value) => {
        if (!value) return '-';
        try {
          return new Date(value).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch (error) {
          return '-';
        }
      }
    }
  ];

  // Table actions
  const actions = [
    {
      icon: Eye,
      label: "ดูรายละเอียด",
      onClick: (row) => handleView(row.submission_id),
      className: "text-blue-600 hover:text-blue-800"
    },
    {
      icon: Download,
      label: "ดาวน์โหลด",
      onClick: (row) => handleDownload(row.submission_id),
      className: "text-green-600 hover:text-green-800"
    }
  ];

  // Handle view details
  const handleView = (submissionId) => {
    if (onNavigate) {
      onNavigate('submission-detail', { id: submissionId });
    }
  };

  // Handle download documents
  const handleDownload = async (submissionId) => {
    try {
      // Implement download logic here
      console.log('Download documents for submission:', submissionId);
    } catch (error) {
      console.error('Error downloading documents:', error);
    }
  };

  // Render loading state
  if (loading && applications.length === 0) {
    return (
      <PageLayout
        title="ประวัติการขอทุน"
        subtitle="รายการคำร้องขอทุนทั้งหมด"
        icon={ClipboardList}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Render error state
  if (error) {
    return (
      <PageLayout
        title="ประวัติการขอทุน"
        subtitle="รายการคำร้องขอทุนทั้งหมด"
        icon={ClipboardList}
      >
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadSubmissions}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="ประวัติการขอทุน"
      subtitle="รายการคำร้องขอทุนทั้งหมด"
      icon={ClipboardList}
      actions={
        <button
          onClick={() => onNavigate && onNavigate('research-fund')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          สร้างคำร้องใหม่
        </button>
      }
    >
      <Card>
        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่คำร้อง หรือชื่อโครงการ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-4">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทุกประเภท</option>
              <option value="fund_application">ทุนวิจัย</option>
              <option value="publication_reward">รางวัลตีพิมพ์</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทุกสถานะ</option>
              {statuses.map(status => (
                <option key={status.application_status_id} value={status.application_status_id}>
                  {status.status_name}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทุกปีงบประมาณ</option>
              {years.map(year => (
                <option key={year.year_id} value={year.year_id}>
                  ปี {year.year}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => {
                loadSubmissions();
                loadFilterOptions();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          </div>
        </div>

        {/* Data Table or Empty State */}
        {filteredApplications.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={filteredApplications}
              actions={actions}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    loadSubmissions();
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  ก่อนหน้า
                </button>
                <span className="px-4 py-2">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    loadSubmissions();
                  }}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={FileText}
            title="ไม่พบข้อมูลคำร้อง"
            message={searchTerm || statusFilter !== "all" || typeFilter !== "all" || yearFilter !== "all" 
              ? "ไม่พบคำร้องที่ตรงกับเงื่อนไขการค้นหา"
              : "คุณยังไม่มีคำร้องขอทุนในระบบ"}
            action={
              searchTerm || statusFilter !== "all" || typeFilter !== "all" || yearFilter !== "all" ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setYearFilter("all");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  ล้างตัวกรอง
                </button>
              ) : (
                <button
                  onClick={() => onNavigate && onNavigate('research-fund')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  สร้างคำร้องใหม่
                </button>
              )
            }
          />
        )}
      </Card>
    </PageLayout>
  );
}