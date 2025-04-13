"use client";
import Image from "next/image";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import Menu from "../../../component/nav_admin";
import Header from "../../../component/header";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Grid,
  Settings,
  User,
} from "lucide-react";
import DatatableProject from "../../../component/project";

export default function HomeProject({ params }) {
  const searchParams = useSearchParams();
  const [Project, setProject] = useState({ id: "", name: "", budget: "" });
  const [open, setOpen] = useState(false);
  const { id_strategic, id_actionplan } = use(params);

  useEffect(() => {
    const data = sessionStorage.getItem("actionplan_data");
    if (!data) {
      window.location.href = `/admin/strategic`;
    }
    console.log(data);
    if (data) {
      const par_data = JSON.parse(data);
      setProject(par_data);
    }
  }, []);

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
                จัดการโครงการ
              </div>
              <div className="text-lg md:text-2xl me-3 ms-4 ">
                {" "}
                {id_actionplan} {Project.name}
              </div>
              <div className="flex justify-between ">
                <div className="text-lg md:text-2xl  ms-4 ">
                  {" "}
                  งบประมาณ{" "}
                  {Number(Project.budget).toLocaleString("th-TH", {
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
              {Project.id && (
                <DatatableProject
                  id_action={Project.id}
                  val={{ id_strategic, id_actionplan }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
