import {
    LayoutDashboard,
    BookOpen,
    ChevronDown,
    Grid,
    Settings,
    User,
    LogOut
  } from "lucide-react";
  import Link from "next/link";
  import { useState, useEffect } from "react";
  import Aos from "aos";
  import "aos/dist/aos.css";
  export default function Menu() {
    const [open, setOpen] = useState(false);
    useEffect(() => {
      Aos.init({
        duration: 300,
        once: false,
      });
    }, []);
    return (
      <>
        {/* แดชบอร์ด */}
        <div className="pb-40 md:ms-4 fixed ">
          <Link
            href="/user"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 mb-2.5 "
          >
            <LayoutDashboard size={20} />
            <span className="">แดชบอร์ด</span>
          </Link>
          <div>
            <div
              className="flex items-center justify-between  mb-2.5 cursor-pointer hover:text-blue-600"
              onClick={() => setOpen(!open)}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={20} />
                <span>แผนยุทธศาสตร์</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform duration-500 ms-16 md:ms-24 ${
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
                  className="flex items-center gap-2   mb-2.5"
                >
                  <Settings size={16} />
                  <span>โครงการ</span>
                </Link>
              </div>
            )}
          </div>
  
          <Link
            href="/personnel"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
          >
            <User size={20} />
            <span>บุคลากร</span>
          </Link>
          <Link
            href="/personnel"
            className="flex items-center  mt-2 gap-2 text-gray-700 hover:text-blue-600"
          >
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </Link>
        </div>
      </>
    );
  }
  