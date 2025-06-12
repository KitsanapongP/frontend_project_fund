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
  FaRegCalendarAlt,
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
  const [openresponsible, setOpenresponsible] = useState(false);
  const [role, setRole] = useState(false);
  useEffect(() => {
    Aos.init({
      duration: 300,
      once: false,
    });
    const role = Cookies.get("role");
    console.log(role);
    setRole(role);
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

  // const isActive = location.pathname.startsWith("/superadmin");

  const activePaths = [
    "/superadmin/strategic",
    "/superadmin/actionplan",
    "/superadmin/project",
    "/superadmin/activity",
  ];

  const activemanagePaths = [
    "/superadmin/manage/deparment",
    "/superadmin/manage/type",
    "/superadmin/manage/principle",
    "/superadmin/manage/position",
  ];

  const projectresponsiblePaths = [
    "/superadmin/project/deparment",
    "/superadmin/project/type",
    "/superadmin/project/principle",
    "/superadmin/project/position",
  ];
  return (
    <>
      {/* แดชบอร์ด */}
      <div className="pb-40 md:ms-4 fixed ">
        <Link
          href="/superadmin"
          className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
            pathname === "/superadmin"
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
              activePaths.some((path) =>
                new RegExp(`^${path}(\\/|$)`).test(pathname)
              )
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
              className={`transition-transform duration-500 ms-16 md:ms-8 2xl:ms-12 ${
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
                href="/superadmin/strategic"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/superadmin/strategic")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaRegClipboard size={16} />
                <span className="text-sm">แผนยุทธศาสตร์</span>
              </Link>
              <Link
                href="/superadmin/actionplan"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/superadmin/actionplan")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaProjectDiagram size={16} />
                <span className="text-sm">แผนกลยุทธ์</span>
              </Link>
              <Link
                href="/superadmin/project"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname === "/superadmin/project"
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <FaTasks size={16} />
                <span className="text-sm">โครงการ</span>
              </Link>
              <Link
                href="/superadmin/activity"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname === "/superadmin/activity"
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
              activePaths.some((path) =>
                pathname.startsWith("/superadmin/projectresponsible")
              )
                ? "text-blue-500 font-semibold"
                : "text-gray-700"
            }`}
            onClick={() => setOpenresponsible(!openresponsible)}
          >
            <div className="flex items-center  gap-2">
              <BookOpen size={20} />
              <span>งานที่รับผิดชอบ</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-500 ms-16 md:ms-8 xl:ms-12 ${
                openresponsible ? "rotate-180" : ""
              }`}
            />
          </div>

          {openresponsible && (
            <div className="ml-6 mt-2 space-y-1">
              {/* <Link
                  href="/overview"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                >
                  <Grid size={16} />
                  <span>ภาพรวมระบบ</span>
                </Link> */}
              <Link
                href="/superadmin/projectresponsible/project"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith(
                      "/superadmin/projectresponsible/project"
                    )
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <Settings size={16} />
                <span className="text-sm">โครงการ</span>
              </Link>
              <Link
                href="/superadmin/projectresponsible/activity"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith(
                      "/superadmin/projectresponsible/activity"
                    )
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <Settings size={16} />
                <span className="text-sm">กิจกรรม</span>
              </Link>
            </div>
          )}
        </div>
        {role && role === "2" && (
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
                className={`transition-transform duration-500 ms-16 md:ms-15 2xl:ms-17 ${
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
                  href="/superadmin/manage/year"
                  className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/superadmin/manage/year")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
                >
                  <FaRegCalendarAlt size={16} />
                  <span className="text-sm">ปีงบประมาณ</span>
                </Link>
                <Link
                  href="/superadmin/manage/deparment"
                  className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/superadmin/manage/deparment")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
                >
                  <FaBuilding size={16} />
                  <span className="text-sm">หน่วยงาน</span>
                </Link>
                <Link
                  href="/superadmin/manage/type"
                  className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/superadmin/manage/type")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
                >
                  <FaShapes size={16} />
                  <span className="text-sm">ลักษณะโครงการ </span>
                </Link>
                <Link
                  href="/superadmin/manage/principles"
                  className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname === "/superadmin/manage/principles"
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
                >
                  <FaBalanceScale size={16} />
                  <span className="text-sm">หลักธรรมาภิบาล</span>
                </Link>
                <Link
                  href="/superadmin/manage/position"
                  className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname === "/superadmin/manage/position"
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
        )}
        {role && role === "2" && (
          <Link
            href="/superadmin/okr"
            className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
              pathname.startsWith("/superadmin/okr")
                ? "text-blue-500 font-semibold"
                : "text-gray-700"
            }`}
          >
            <FaChartLine size={20} />
            <span className="text-md">OKR</span>
          </Link>
        )}
        {role && role === "2" && (
          <Link
            href="/superadmin/person"
            className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
              pathname.startsWith("/superadmin/person")
                ? "text-blue-500 font-semibold"
                : "text-gray-700"
            }`}
          >
            <User size={20} />
            <span className="text-md">บุคลากร</span>
          </Link>
        )}
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
