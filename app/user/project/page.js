"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import Menu from "../component/nav";
import Header from "../component/header";
import DatatableProject from "../component/project";

export default function HomeStrategic() {
  const yearOptions = [
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
          <div className="bg-gray-100 col-span-2 xl:col-span-2 hidden md:block md:col-span-2 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-10 xl:col-span-8  md:col-span-8  mt-5 md:mt-3 ">
            <div className="flex flex-row items-center justify-between">
              <div className="text-lg md:text-2xl me-3 ms-4">
                โครงการภายใต้การดูแล
              </div>
              <a
                href="/user/project/add_project"
                className="w-30 me-2 md:me-8 md:w-30 py-1.5 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                เพิ่มโครงการ
              </a>
            </div>
            <div>
              <DatatableProject />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
