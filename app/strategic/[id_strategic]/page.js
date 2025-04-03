"use client";
import Image from "next/image";
import { useState, use } from "react";
import Link from "next/link";
import Menu from "../../admin/component/nav";
import {
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Grid,
  Settings,
  User,
} from "lucide-react";
import DatatableActionplan from "../../admin/component/actionplan";

export default function HomeStrategic({ params }) {
  const [open, setOpen] = useState(false);
  const { id_strategic } = use(params);
  const chanceOptions = [
    { value: 1, label: "2568" },
    { value: 2, label: "2567" },
    { value: 3, label: "2566" },
  ];
  const [Year, setYear] = useState({
    year_id: "2568",
  });
  const columns = [
    {
      name: "ชื่อ",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "ตำแหน่ง",
      selector: (row) => row.role,
    },
  ];

  const data = [
    { id: 1, name: "สมชาย", role: "ผู้ดูแล" },
    { id: 2, name: "วิรัตน์", role: "เจ้าหน้าที่" },
  ];

  return (
    <>
      <div className="">
        <header>
          <div className="flex h-20 w-full  items-center justify-between">
            <div className="">
              <img src="/image_icon/iconcpkku.png" className="w-40" alt="" />
            </div>
            <div className="">admin</div>
          </div>
        </header>
        <hr />
        <div className="grid grid-cols-10 gap-4 w-full min-h-screen">
          <Menu />
          <div className="col-span-8 mt-3">
            <div className="flex flex-row">
              <div className="text-2xl me-3">จัดการกลยุทธ์</div>
            </div>
            <div>
              <DatatableActionplan data={id_strategic} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
