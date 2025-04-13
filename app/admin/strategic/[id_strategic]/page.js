"use client";
import Image from "next/image";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import Menu from "../../component/nav_admin";
import Header from "../../component/header";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Grid,
  Settings,
  User,
} from "lucide-react";
import DatatableActionplan from "../../component/actionplan";

export default function HomeActionplan({ params }) {
  const searchParams = useSearchParams();
  const [strategic, setStrategic] = useState({ id: "", name: "", budget: "" });

  useEffect(() => {
    const data = sessionStorage.getItem("strategic_data");
    if (!data) {
      window.location.href = `/admin/strategic`;
    }
    if (data) {
      const parsed = JSON.parse(data);
      setStrategic(parsed);
      console.log("set strategic:", parsed);
    }
  }, []);

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
        <Header />
        <hr />
        <div className="grid grid-cols-10 gap-4 w-full min-h-screen mt-20">
          <div className="bg-gray-100 col-span-2 xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-10 xl:col-span-8  md:col-span-7  mt-5 md:mt-3 ">
            <div className="flex flex-col">
              <div className="text-lg md:text-2xl me-3 ms-4 font-bold">
                จัดการกลยุทธ์
              </div>
              <div className="text-lg md:text-2xl me-3 ms-4 ">
                {" "}
                {id_strategic} {strategic.name}
              </div>
              <div className="flex justify-between ">
                <div className="text-lg md:text-2xl  ms-4 ">
                  {" "}
                  งบประมาณ{" "}
                  {Number(strategic.budget).toLocaleString("th-TH", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{" "}
                  บาท
                </div>
                <button className="w-20 me-2 md:me-8 justify-end md:w-25 py-1.5 bg-blue-400 text-white rounded-lg hover:bg-blue-700">
                  เพิ่มข้อมูล
                </button>
              </div>
            </div>
            <div>
              {strategic.id && (
                <DatatableActionplan
                  number_strategic={id_strategic}
                  id_strategic={strategic.id}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
