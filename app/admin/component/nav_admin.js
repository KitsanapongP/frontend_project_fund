import {
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Grid,
  Settings,
  User,
  LogOut,
} from "lucide-react";

import {
  FaBookOpen,
  FaRegClipboard,
  FaProjectDiagram,
  FaTasks,
  FaRegCalendarCheck,
  FaDatabase,
  FaBuilding,
  FaShapes,
  FaBalanceScale,
  FaUserTag,
  FaUserCircle,
  FaChartLine,
  FaRegCalendarAlt
} from "react-icons/fa";

import Link from "next/link";
import { useState, useEffect } from "react";
import Aos from "aos";
import Cookies from "js-cookie";
import "aos/dist/aos.css";
import { usePathname } from "next/navigation";
import Swal from "sweetalert2";
export default function Menu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [opendata, setOpendata] = useState(false);
  useEffect(() => {
    Aos.init({
      duration: 300,
      once: false,
    });
  }, []);
  const handleLogout = () => {
    Swal.fire({
      title: "คุณต้องการออกจากระบบหรือไม่ ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        Cookies.remove("token");
        Cookies.remove("fullname");
        Cookies.remove("id");
        window.location.href = "/";
      }
    });
  };

  // const isActive = location.pathname.startsWith("/admin");

  const activePaths = [
    "/admin/strategic",
    "/admin/actionplan",
    "/admin/project",
    "/admin/activity",
  ];

  const activemanagePaths = [
    "/admin/manage/deparment",
    "/admin/manage/type",
    "/admin/manage/principle",
    "/admin/manage/position",
  ];
  return (
    <>
      {/* แดชบอร์ด */}
      <div className="pb-40 md:ms-4 fixed ">
        <Link
          href="/admin"
          className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
            pathname === "/admin"
              ? "text-blue-500 font-semibold"
              : "text-gray-700"
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-md">แดชบอร์ด</span>
        </Link>
        <div>
          <div
            className={`flex items-center gap-2 mb-2.5 ${
              activePaths.some((path) => pathname.startsWith(path))
                ? "text-blue-500 font-semibold"
                : "text-gray-700"
            }`}
            onClick={() => setOpen(!open)}
          >
            <div className="flex items-center gap-2">
              <FaBookOpen size={20} />
              <span className="text-md">แผนยุทธศาสตร์</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-500 ms-16 md:ms-8 2xl:ms-14 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>

          {open && (
            <div className="ml-6 mt-2 space-y-1">
              {/* <Link
                href="/overview"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-500"
              >
                <Grid size={16} />
                <span>ภาพรวมระบบ</span>
              </Link> */}
              <Link
                href="/admin/strategic"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/admin/strategic")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaRegClipboard size={16} />
                <span className="text-sm">แผนยุทธศาสตร์</span>
              </Link>
              <Link
                href="/admin/actionplan"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/admin/actionplan")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaProjectDiagram size={16} />
                <span className="text-sm">แผนกลยุทธ์</span>
              </Link>
              <Link
                href="/admin/project"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname === "/admin/project"
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaTasks size={16} />
                <span className="text-sm">โครงการ</span>
              </Link>
              <Link
                href="/admin/activity"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname === "/admin/activity"
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaRegCalendarCheck size={16} />
                <span className="text-sm">กิจกรรม</span>
              </Link>
            </div>
          )}
        </div>

        <div>
          <div
            className={`flex items-center gap-2 mb-2.5 ${
              activemanagePaths.some((path) => pathname.startsWith(path))
                ? "text-blue-500 font-semibold"
                : "text-gray-700"
            }`}
            onClick={() => setOpendata(!opendata)}
          >
            <div className="flex items-center gap-2">
              <FaDatabase size={20} />
              <span className="text-md">จัดการข้อมูล</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-500 ms-16 md:ms-15 2xl:ms-19 ${
                opendata ? "rotate-180" : ""
              }`}
            />
          </div>

          {opendata && (
            <div className="ml-6 mt-2 space-y-1">
              {/* <Link
                href="/overview"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-500"
              >
                <Grid size={16} />
                <span>ภาพรวมระบบ</span>
                
              </Link> */}
              <Link
                href="/admin/manage/year"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/admin/manage/year")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaRegCalendarAlt size={16} />
                <span className="text-sm">ปีงบประมาณ</span>
              </Link>
              <Link
                href="/admin/manage/deparment"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/admin/manage/deparment")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaBuilding size={16} />
                <span className="text-sm">หน่วยงาน</span>
              </Link>
              <Link
                href="/admin/manage/type"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/admin/manage/type")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaShapes size={16} />
                <span className="text-sm">ลักษณะโครงการ </span>
              </Link>
              <Link
                href="/admin/manage/principles"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname === "/admin/manage/principles"
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaBalanceScale size={16} />
                <span className="text-sm">หลักธรรมาภิบาล</span>
              </Link>
              <Link
                href="/admin/manage/position"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname === "/admin/manage/position"
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaUserTag size={16} />
                <span className="text-sm">ตำแหน่ง</span>
              </Link>
            </div>
          )}
        </div>
        <Link
          href="/admin/okr"
          className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
            pathname === "/admin/okr"
              ? "text-blue-500 font-semibold"
              : "text-gray-700"
          }`}
        >
          <FaChartLine size={20} />
          <span className="text-md">OKR</span>
        </Link>

        <Link
          href="/admin/person"
          className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
            pathname === "/admin/person"
              ? "text-blue-500 font-semibold"
              : "text-gray-700"
          }`}
        >
          <User size={20} />
          <span className="text-md">บุคลากร</span>
        </Link>
        <button
          // href="/personnel"
          onClick={handleLogout}
          className="flex items-center  mt-2 gap-2 text-gray-700 hover:text-blue-500"
        >
          <LogOut size={20} />
          <span className="text-md">ออกจากระบบ</span>
        </button>
      </div>
    </>
  );
}
