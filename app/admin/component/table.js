"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Grid,
  Settings,
  User,
} from "lucide-react";
import dynamic from 'next/dynamic';

import 'datatables.net-dt/css/dataTables.dataTables.css';
const DataTable = dynamic(
  async () => {
    const dtReact = import('datatables.net-react');
    const dtNet = import(`datatables.net-dt`);

    const [reactMod, dtNetMod] = await Promise.all([dtReact, dtNet]);

    reactMod.default.use(dtNetMod.default);
    return reactMod.default;
  },
  { ssr: false }
);


export default function Home() {
  const [open, setOpen] = useState(false);
  const chanceOptions = [
    { value: 1, label: "2568" },
    { value: 2, label: "2567" },
    { value: 3, label: "2566" },
  ];
  const [Year, setYear] = useState({
    year_id: "2568",
  });
  // const columns = [
  //   {
  //     name: "ชื่อ",
  //     selector: (row) => row.name,
  //     sortable: true,
  //   },
  //   {
  //     name: "ตำแหน่ง",
  //     selector: (row) => row.role,
  //   },
  // ];

  const [tableData, setTableData] = useState([
    ['Tiger Nixon', 'System Architect'],
    ['Garrett Winters', 'Accountant'],
  ]);

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
          <div className="bg-gray-100 col-span-2 pt-4 ps-3">
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
          </div>
          <div className="col-span-8 mt-3">
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
                {chanceOptions.map((data, index) => (
                  <option key={index} value={data.label}>
                    {data.label}
                  </option>
                ))}
                {/* <option value="2567">2567</option>
                <option value="2566">2566</option> */}
              </select>
            </div>
            <div>
              <DataTable data={tableData} className="display">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                  </tr>
                </thead>
              </DataTable>
              {/* <DataTable
                columns={columns}
                data={data}
                pagination
                highlightOnHover
                responsive
                striped
              /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
