"use client";
import Image from "next/image";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import Menu from "../component/nav_admin";
import Cookies from "js-cookie";
import Header from "../component/header";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Grid,
  Settings,
  User,
} from "lucide-react";
import DatatableOkr from "../componentTable/okr";
import { GetDatayearall } from "../../fetch_api/fetch_api_superadmin";
import { ModalAddActionplan } from "./modal";
export default function HomeOkr() {
  const [yearOptions, setyearOptions] = useState([
    // { value: 1, label: "2568" },
    // { value: 2, label: "2567" },
    // { value: 3, label: "2566" },
  ]);
  const [Year, setYear] = useState({
    // year_id: "2568",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const token = Cookies.get("token");
        // console.log("token : ", token);
        const res = await GetDatayearall(token);
        // console.log("year : ", res.data);
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
        year: yearOptions[0].year,
      });
    }
  }, [yearOptions]);
  const [isOpenModalAdd, setIsOpenModalAdd] = useState(false);

  const handleModalSelect = (type) => {
    if (type === "new") {
      // settype(1);
      toggleModalAdd();
      window.location = "/admin/okr/add";
    }
  };

  const toggleModalAdd = () => {
    setIsOpenModalAdd(!isOpenModalAdd); // เปลี่ยนสถานะของ modal
  };

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
                <div className="text-lg md:text-2xl me-3 ms-4">OKR</div>
                <select
                  id="year"
                  name="year"
                  value={Year.year_id ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const label = e.target.options[e.target.selectedIndex].text;
                    setYear({ ...Year, year_id: value, year_label: label });
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
              <a
                // href="/admin/okr/add"
                onClick={toggleModalAdd}
                className="w-30 me-2 md:me-8 md:w-30 py-1.5 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                เพิ่มข้อมูล
              </a>
            </div>
            <div>
              {Year.year_id !== null && (
                <DatatableOkr year_id={Year.year_id} year={Year.year} />
              )}
              {/* <DatatableProject /> */}
            </div>
          </div>
        </div>
      </div>

      <ModalAddActionplan
        isOpen={isOpenModalAdd}
        onClose={() => setIsOpenModalAdd(false)}
        onSelect={handleModalSelect}
      />
    </>
  );
}
