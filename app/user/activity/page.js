"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import Menu from "../component/nav";
import Header from "../component/header";
import { GetDatayear } from "../../fetch_api/fetch_api_user";
import DatatableProject from "../component/activity_user";
import { ModalAddActivity } from "../component/modal_activity";
import { useRouter } from "next/navigation";

export default function HomeActivity() {
    const router = useRouter();
  const [yearOptions, setyearOptions] = useState([]);
  const [isOpenModalAdd, setIsOpenModalAdd] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [Year, setYear] = useState({
    // year_id: "2568",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const token = Cookies.get("token");
        const res = await GetDatayear(token);
        setyearOptions(res.data);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    fetchData();
  }, []);
  useEffect(() => {
    if (yearOptions.length > 0 && !Year.year_id) {
      setYear({
        ...Year,
        year_id: yearOptions[0].year_id,
      });
    }
  }, [yearOptions]);

  const toggleModalAdd = () => {
    setIsOpenModalAdd(!isOpenModalAdd); // เปลี่ยนสถานะของ modal
  };
  const handleModalSelect = (type) => {
    if (type === "new") {
      toggleModalAdd();
      router.push(`./activity/add_activity`);
    }
  };

  useEffect(() => {
    // กด esc แล้วปืด
    // console.log(isOpenModalAddNew);
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
                <div className="text-lg md:text-2xl me-3 ms-4">
                  กิจกรรมภายใต้การดูแล
                </div>
                <select
                  id="year"
                  name="year"
                  value={Year.year_id ?? ""}
                  onChange={(e) => {
                    setYear({
                      ...Year,
                      year_id: e.target.value,
                    });
                  }}
                  className="block rounded-md px-4 py-2 bg-gray-100 border border-gray-300 shadow-sm hover:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                  style={{
                    appearance: "none",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.75em",
                    paddingRight: "3rem",
                  }}
                >
                  {yearOptions.map((data, index) => (
                    <option key={index} value={data.year_id}>
                      {data.year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  data-modal-target="popup-modal"
                  data-modal-toggle="popup-modal"
                  onClick={toggleModalAdd}
                  className="w-22 justify-end md:w-25 py-1.5 bg-blue-400 text-white rounded-lg hover:bg-blue-700"
                >
                  เพิ่มข้อมูล
                </button>
              </div>
            </div>
            <div>
              {Year.year_id !== null && (
                <DatatableProject
                  year_id={Year.year_id}
                  onTotalChange={setTotalRows}
                />
              )}
              {/* <DatatableProject /> */}
            </div>
          </div>
        </div>
      </div>

      <ModalAddActivity
        isOpen={isOpenModalAdd}
        onClose={() => setIsOpenModalAdd(false)}
        onSelect={handleModalSelect}
      />
    </>
  );
}
