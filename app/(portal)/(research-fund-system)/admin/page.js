// app/admin/page.js - Admin Dashboard

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import AuthGuard from "../../../components/AuthGuard";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";
import DashboardContent from "./components/dashboard/DashboardContent";
import ResearchFundContent from "./components/funds/ResearchFundContent";
import PromotionFundContent from "./components/funds/PromotionFundContent";
import FundSettingsContent from "./components/settings";
import ProjectsContent from "./components/projects/ProjectsContent";
import UnderDevelopmentContent from "./components/common/UnderDevelopmentContent";
import SubmissionsManagement from "./components/submissions/SubmissionsManagement";
import LegacySubmissionManager from "./components/submissions/legacy/LegacySubmissionManager";
import AdminAcademicImports from "./components/settings/announcement_config/AdminAcademicImports";
import AdminScopusResearchSearch from "./components/research/AdminScopusResearchSearch";
import AdminScopusResearchDashboard from "./components/research/AdminScopusResearchDashboard";
import ApprovalRecords from "./components/approves/ApprovalRecords";
import AdminNotificationCenter from "./components/notifications/NotificationCenter";
import AdminImportExportPage from "./components/import-export/AdminImportExportPage";
import AdminAccessControlPage from "./components/access-control/AdminAccessControlPage";
import GenericFundApplicationForm from "../member/components/applications/GenericFundApplicationForm";
import PublicationRewardForm from "../member/components/applications/PublicationRewardForm";

const IMPORT_TAB_MAP = {
  'publications-import': 'scholar',
  'scopus-import': 'scopus',
  'kku-people-scraper': 'kku-profile',
};

const PAGE_PERMISSION_BY_ID = {
  dashboard: "ui.page.admin.dashboard.view",
  "research-dashboard": "ui.page.admin.research_dashboard.view",
  "research-fund": "ui.page.admin.research_fund.view",
  "promotion-fund": "ui.page.admin.promotion_fund.view",
  "applications-list": "ui.page.admin.applications.view",
  "scopus-research-search": "ui.page.admin.scopus.view",
  "fund-settings": "ui.page.admin.fund_settings.view",
  projects: "ui.page.admin.projects.view",
  "approval-records": "ui.page.admin.approval_records.view",
  "import-export": "ui.page.admin.import_export.view",
  "academic-imports": "ui.page.admin.academic_imports.view",
  "access-control": "ui.page.admin.access_control.view",
};

function AdminPageContent({ initialPage = 'dashboard', basePath = '/admin' }) {
  const { user, hasPermission } = useAuth();
  const rawRole = user?.role_id ?? user?.role;
  const normalizedRole = typeof rawRole === 'string' ? rawRole.toLowerCase() : rawRole;
  const numericRole = Number(rawRole);
  const isExecutive = normalizedRole === 5 || normalizedRole === 'executive' || numericRole === 5;
  const hasPermissionSnapshot = Array.isArray(user?.permissions) && user.permissions.length > 0;
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [importTab, setImportTab] = useState('scholar');
  const [selectedFundData, setSelectedFundData] = useState(null);
  const [currentMode, setCurrentMode] = useState(null);
  const pathname = usePathname();

  const canViewPage = useCallback((pageId) => {
    if (isExecutive) {
      return pageId === "dashboard" || pageId === "applications-list";
    }

    const requiredPermission = PAGE_PERMISSION_BY_ID[pageId];
    if (!requiredPermission) {
      return true;
    }
    if (!hasPermissionSnapshot) {
      return true;
    }

    if (pageId === "dashboard" && hasPermission("dashboard.view.admin")) {
      return true;
    }

    return hasPermission(requiredPermission);
  }, [hasPermission, hasPermissionSnapshot, isExecutive]);

  const normalizePage = useCallback((page) => {
    const canonicalPage = IMPORT_TAB_MAP[page] ? 'academic-imports' : page;
    const allowedPages = isExecutive
      ? ['dashboard', 'applications-list']
      : [
          'dashboard',
          'research-dashboard',
          'research-fund',
          'promotion-fund',
          'applications-list',
          'scopus-research-search',
          'legacy-submissions',
          'fund-settings',
          'projects',
          'approval-records',
          'academic-imports',
          'import-export',
          'access-control',
          'notifications',
          'generic-fund-application',
          'publication-reward-form',
        ];

    const permissionFilteredPages = allowedPages.filter(canViewPage);
    const preferredFallbackOrder = [
      'dashboard',
      'research-dashboard',
      'research-fund',
      'promotion-fund',
      'applications-list',
      'scopus-research-search',
      'fund-settings',
      'projects',
      'approval-records',
      'import-export',
      'academic-imports',
      'access-control',
    ];
    const fallbackPage =
      preferredFallbackOrder.find((item) => permissionFilteredPages.includes(item)) ||
      permissionFilteredPages[0] ||
      'dashboard';

    return permissionFilteredPages.includes(canonicalPage) ? canonicalPage : fallbackPage;
  }, [canViewPage, isExecutive]);

  const pageFromPath = useCallback(
    (path) => {
      if (typeof path !== 'string') return 'dashboard';

      const segments = path.split('/').filter(Boolean);

      const rootSegment = String(basePath || '/admin').replace(/^\//, '').split('/')[0] || 'admin';
      if (segments[0] !== rootSegment) return 'dashboard';
      return normalizePage(segments[1] || 'dashboard');
    },
    [basePath, normalizePage]
  );

  const syncPathWithPage = useCallback(
    (page, { replace = false } = {}) => {
      if (typeof window === 'undefined') return;

      const normalized = normalizePage(page);
      const normalizedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
      const targetPath = `${normalizedBasePath}/${normalized}`;

      if (window.location.pathname === targetPath) return;

      const method = replace ? 'replaceState' : 'pushState';
      window.history[method]({ page: normalized }, '', targetPath);
    },
    [basePath, normalizePage]
  );

  useEffect(() => {
    const normalized = normalizePage(initialPage);
    const initialTab = IMPORT_TAB_MAP[initialPage];

    if (normalized === 'academic-imports' && initialTab) {
      setImportTab(initialTab);
    }

    setCurrentPage(normalized);
    syncPathWithPage(normalized, { replace: true });
  }, [initialPage, normalizePage, syncPathWithPage]);

  useEffect(() => {
    const pageFromUrl = pageFromPath(pathname);
    const normalized = normalizePage(pageFromUrl);
    const initialTab = IMPORT_TAB_MAP[pageFromUrl];

    if (normalized === 'academic-imports' && initialTab) {
      setImportTab(initialTab);
    }

    setCurrentPage(normalized);
  }, [normalizePage, pageFromPath, pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const pageFromUrl = pageFromPath(window.location.pathname);
      const normalized = normalizePage(pageFromUrl);
      const initialTab = IMPORT_TAB_MAP[pageFromUrl];

      if (normalized === 'academic-imports' && initialTab) {
        setImportTab(initialTab);
      }

      setCurrentPage(normalized);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [normalizePage, pageFromPath]);

  const handleNavigate = (page, data = null, options = {}) => {
    const normalized = normalizePage(page);

    if (normalized === 'academic-imports' && IMPORT_TAB_MAP[page]) {
      setImportTab(IMPORT_TAB_MAP[page]);
    }

    const nextMode = options.mode ?? null;
    setCurrentMode(nextMode);
    setCurrentPage(normalized);
    syncPathWithPage(normalized);

    if (data) {
      setSelectedFundData(data);
      try {
        window.sessionStorage.setItem('admin_selected_fund', JSON.stringify(data));
      } catch (err) {
        console.warn('Unable to persist selected fund data:', err);
      }
    } else if (!['generic-fund-application', 'publication-reward-form'].includes(normalized)) {
      setSelectedFundData(null);
      try {
        window.sessionStorage.removeItem('admin_selected_fund');
      } catch {}
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent onNavigate={handleNavigate} basePath={basePath} />;
      case 'research-dashboard':
        return <AdminScopusResearchDashboard />;
      case 'research-fund':
        return <ResearchFundContent onNavigate={handleNavigate} />;
      case 'promotion-fund':
        return <PromotionFundContent onNavigate={handleNavigate} />;
      case 'generic-fund-application':
        return (
          <GenericFundApplicationForm
            onNavigate={handleNavigate}
            subcategoryData={selectedFundData}
            readOnly
          />
        );
      case 'publication-reward-form':
        return (
          <PublicationRewardForm
            onNavigate={handleNavigate}
            categoryId={selectedFundData?.category_id}
            yearId={selectedFundData?.year_id}
            submissionId={selectedFundData?.submissionId}
            originPage={selectedFundData?.originPage}
            mode={currentMode}
            readOnly
          />
        );
      case 'applications-list':
        return <SubmissionsManagement currentPage={handleNavigate} />;
      case 'scopus-research-search':
        return <AdminScopusResearchSearch onNavigate={handleNavigate} />;
      case 'legacy-submissions':
        return <LegacySubmissionManager />;
      case 'fund-settings':
        return <FundSettingsContent onNavigate={handleNavigate} />;
      case 'projects':
        return <ProjectsContent />;
      case 'approval-records':
        return <ApprovalRecords currentPage={handleNavigate} />;
      case 'import-export':
        return <AdminImportExportPage />;
      case 'academic-imports':
        return <AdminAcademicImports initialTab={importTab} />;
      case 'access-control':
        return <AdminAccessControlPage />;
      case 'notifications':
        return <AdminNotificationCenter />;
      default:
        return <UnderDevelopmentContent currentPage={currentPage} />;
    }
  };

  const getPageTitle = () => {
      const titles = {
        'dashboard': 'แดชบอร์ดผู้ดูแลระบบ',
        'research-dashboard': 'แดชบอร์ดงานวิจัย',
        'research-fund': 'ทุนส่งเสริมงานวิจัย',
        'promotion-fund': 'ทุนอุดหนุนกิจกรรม',
        'applications-list': 'รายการการขอทุน',
        'scopus-research-search': 'ค้นหางานวิจัย',
        'legacy-submissions': 'จัดการคำร้อง (ข้อมูลเก่า)',
        'fund-settings': 'ตั้งค่าทุน',
        'projects': 'จัดการโครงการ',
        'approval-records': 'บันทึกข้อมูลการอนุมัติทุน',
        'import-export': 'นำเข้า / ส่งออก',
        'academic-imports': 'ข้อมูลผลงานวิชาการ / Academic Data Import',
        'access-control': 'จัดการสิทธิ์การเข้าถึง',
        'scopus-research-search': 'ค้นหางานวิจัย',
        'notifications': 'การแจ้งเตือน'
    };
    return titles[currentPage] || currentPage;
  };

  const navigationMenu = (
    <Navigation
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      handleNavigate={handleNavigate}
      submenuOpen={submenuOpen}
      setSubmenuOpen={setSubmenuOpen}
      isExecutive={isExecutive}
    />
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        currentPageTitle={getPageTitle()}
        Navigation={navigationMenu}
      />

      <div className="flex min-h-[calc(100vh-5rem)] mt-24 sm:mt-20">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-300 fixed h-[calc(100vh-5rem)] overflow-y-auto shadow-sm">
          <div className="p-5">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                เมนูหลัก
              </h2>
            </div>
            <Navigation
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              handleNavigate={handleNavigate}
              submenuOpen={submenuOpen}
              setSubmenuOpen={setSubmenuOpen}
              isExecutive={isExecutive}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="md:ml-64 flex-1 min-w-0 overflow-x-auto">
          {/* Page Content */}
          <div className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AdminPageContent };

export default function AdminPage() {
  return (
    <AuthGuard 
      allowedRoles={[3, 'admin']}
      allowedPermissions={['ui.page.admin.dashboard.view', 'dashboard.view.admin']}
      requireAuth={true}
    >
      <AdminPageContent />
    </AuthGuard>
  );
}
