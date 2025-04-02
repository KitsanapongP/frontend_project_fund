import {
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Grid,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
export default function Menu() {
  const [open, setOpen] = useState(false);
  return (
    <>

        {/* แดชบอร์ด */}
        <Link
          href="/"
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
              className={`transition-transform duration-500 me-4 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>

          {open && (
            <div className="ml-6 mt-2 space-y-1">
              <Link
                href="/overview"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <Grid size={16} />
                <span>ภาพรวมระบบ</span>
              </Link>
              <Link
                href="/strategy"
                className="flex items-center gap-2   mb-2.5"
              >
                <Settings size={16} />
                <span>แผนยุทธศาสตร์</span>
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
 
    </>
  );
}
