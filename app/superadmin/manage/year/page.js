"use client";
import Image from "next/image";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import Menu from "../../component/nav_admin";
import Cookies from "js-cookie";
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
import { GetDatayear } from "../../../fetch_api/fetch_api_admin";
import DatatableYear from "../../componentTable/year";
import { ModalAddYear } from "../modal/modal_year";

export default function Homeprinciples() {

  const [isOpenModalAdd, setIsOpenModalAdd] = useState(false);
  const [type, settype] = useState(null);
  const [data, setdata] = useState({
    id: null,
    name: null,
  });

  const toggleModalAdd = () => {
    settype(1);
    setdata((prev) => ({
      ...prev,
      name: "",
    }));
    setIsOpenModalAdd(!isOpenModalAdd); // เปลี่ยนสถานะของ modal
  };

  const toggleModalEdit = (newname, id) => {
    settype(2);
    console.log(newname);
    setdata((prev) => ({
      ...prev,
      id: id,
      name: newname,
    }));
    setIsOpenModalAdd(!isOpenModalAdd); // เปลี่ยนสถานะของ modal
  };

  useEffect(() => {
    // กด esc แล้วปืด
    console.log(isOpenModalAdd);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isOpenModalAdd) {
          toggleModalAdd(); // ปิด Modal ถ้าเปิดอยู่
        }
      }
    };
    // handleKeyDown คือฟังก์ชันที่ฟัง event การกดปุ่มบนคีย์บอร์ด (เช่น Escape)
    document.addEventListener("keydown", handleKeyDown);

    // ใช้ลบ event listener เพื่อป้องกันปัญหา memory leak หรือ event ถูกเรียกซ้ำซ้อน
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpenModalAdd]);

  return (
    <>
      <div className="">
        <Header />
        <hr />
        <div className="grid grid-cols-12  gap-0 w-full min-h-screen mt-20">
          <div className="bg-gray-100  xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-12 xl:col-span-10  md:col-span-9 mt-5 ms-4 md:mt-3 me-4 md:me-6">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center">
                <div className="text-lg md:text-2xl me-3">ปีงบประมาณทั้งหมด</div>
              </div>
              <button
                onClick={toggleModalAdd}
                className="w-30 me-2 md:me-8 md:w-30 py-1.5 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                เพิ่มข้อมูล
              </button>
            </div>
            <div>
              <DatatableYear   onEdit={toggleModalEdit}/>
              {/* <DatatableProject /> */}
            </div>
          </div>
        </div>
      </div>
      <ModalAddYear
        isOpen={isOpenModalAdd}
        onClose={() => setIsOpenModalAdd(false)}
        type={type}
        data={data}
      />
    </>
  );
}
