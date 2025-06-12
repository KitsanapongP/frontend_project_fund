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
import "aos/dist/aos.css";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import Swal from "sweetalert2";
export default function Menu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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

  const activePaths = ["/user/project", "/user/activity"];

  return (
    <>
      {/* แดชบอร์ด */}
      <div className="pb-40 md:ms-4 fixed ">
        <Link
          href="/user"
          className={`flex items-center gap-2 mb-2.5 hover:text-blue-500 ${
            pathname === "/user"
              ? "text-blue-500 font-semibold"
              : "text-gray-700"
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="">แดชบอร์ด</span>
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
            <div className="flex items-center  gap-2">
              <BookOpen size={20} />
              <span>งานที่รับผิดชอบ</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-500 ms-16 md:ms-4 xl:ms-12 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>

          {open && (
            <div className="ml-6 mt-2 space-y-1">
              {/* <Link
                  href="/overview"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                >
                  <Grid size={16} />
                  <span>ภาพรวมระบบ</span>
                </Link> */}
              <Link
                href="/user/project"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/user/project")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <Settings size={16} />
                <span>โครงการ</span>
              </Link>
              <Link
                href="/user/activity"
                className={`flex items-center gap-2   mb-2.5 
                  ${
                    pathname.startsWith("/user/activity")
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700"
                  }
                  `}
              >
                <Settings size={16} />
                <span>กิจกรรม</span>
              </Link>
            </div>
          )}
        </div>

        {/* <Link
            href="/personnel"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
          >
            <User size={20} />
            <span>บุคลากร</span>
          </Link> */}
        <button
          onClick={handleLogout}
          className="flex items-center  mt-2 gap-2 text-gray-700 hover:text-blue-600"
        >
          <LogOut size={20} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </>
  );
}
