"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import Menu from "../component/nav";
import DatatableStrig from "../component/strategic";

export default function Home() {
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
      <div className="mx-8">
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
          <div className="bg-gray-100 col-span-2 xl:col-span-2 md:col-span-3 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-8 xl:col-span-8  md:col-span-7  mt-3">
            <div className="flex flex-row">
              <div className="text-2xl me-3">จัดการยุทธศาสตร์ประจำปี พ.ศ.</div>
              <select
                id="year"
                name="year"
                value={Year.year_id}
                onChange={(selectoptin) => {
                  setYear({
                    ...Year,
                    year_id: selectoptin?.value ?? null,
                  });
                }}
                className="block  rounded-md p-2 bg-gray-100 border-black shadow-sm hover:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="">กรุณาเลือกปี</option>
                {yearOptions.map((data, index) => (
                  <option key={index} value={data.label}>
                    {data.label}
                  </option>
                ))}
                {/* <option value="2567">2567</option>
                <option value="2566">2566</option> */}
              </select>
            </div>
            <div>
              <DatatableStrig />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
