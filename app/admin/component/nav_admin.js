import {
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Grid,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Aos from "aos";
import Cookies from "js-cookie";
import "aos/dist/aos.css";
import { usePathname } from "next/navigation";
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
    Cookies.remove("token"); // แค่นี้พอ ไม่ต้องส่งค่าอื่น
    Cookies.remove("fullname");
    Cookies.remove("id");
    window.location.href = "/"; // เปลี่ยนหน้า หรือ redirect ออกหลัง logout
  };
  // const isActive = location.pathname.startsWith("/admin");

  const activePaths = [
    "/admin/strategic",
    "/admin/actionplan",
    "/admin/project",
    "/admin/activity",
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
              <BookOpen size={20} />
              <span className="text-md">แผนยุทธศาสตร์</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-500 ms-16 md:ms-12 ${
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
                <Settings size={16} />
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
                <Settings size={16} />
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
                <Settings size={16} />
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
                <Settings size={16} />
                <span className="text-sm">กิจกรรม</span>
              </Link>
            </div>
          )}
        </div>

        <div>
          <div
            className={`flex items-center gap-2 mb-2.5 ${
              activePaths.some((path) => pathname.startsWith(path))
                ? "text-blue-500 font-semibold"
                : "text-gray-700"
            }`}
            onClick={() => setOpendata(!opendata)}
          >
            <div className="flex items-center gap-2">
              <BookOpen size={20} />
              <span className="text-md">จัดการข้อมูล</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-500 ms-16 md:ms-18 ${
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
                href="/admin/strategic"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/admin/strategic")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <Settings size={16} />
                <span  className="text-sm">หน่วยงาน</span>
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
                <Settings size={16} />
                <span className="text-sm">ลักษณะโครงการ </span>
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
                <Settings size={16} />
                <span className="text-sm">หลักธรรมาภิบาล</span>
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
                <Settings size={16} />
                <span className="text-sm">กิจกรรม</span>
              </Link>
            </div>
          )}
        </div>
        <Link
          href="/admin/person"
          className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
            pathname === "/admin/person"
              ? "text-blue-500 font-semibold"
              : "text-gray-700"
          }`}
        >
          <User size={20} />
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
