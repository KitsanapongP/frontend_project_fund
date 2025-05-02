"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import Menu from "../component/nav";
import Header from "../component/header";
import { GetDatayear } from "../../fetch_api/fetch_api_user";
import DatatableProject from "../component/project";

export default function HomeStrategic() {
  const [yearOptions, setyearOptions] = useState([
    // { value: 1, label: "2568" },
    // { value: 2, label: "2567" },
    // { value: 3, label: "2566" },
  ]);
  const [Year, setYear] = useState({
    // year_id: "2568",
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
  return (
    <>
      <div className="">
        <Header />
        <hr />
        <div className="grid grid-cols-9 gap-4 w-full min-h-screen mt-20">
          <div className="bg-gray-100 col-span-2 xl:col-span-2 hidden md:block md:col-span-2 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-9 xl:col-span-7  md:col-span-7  mt-5 md:mt-3 ">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center">
                <div className="text-lg md:text-2xl me-3 ms-4">
                  โครงการภายใต้การดูแล
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
                  className="block rounded-md px-6 p-2 bg-gray-100 border-black shadow-sm hover:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  {/* <option value="">กรุณาเลือกปี</option> */}
                  {yearOptions.map((data, index) => (
                    <option key={index} value={data.year_id}>
                      {data.year}
                    </option>
                  ))}
                  {/* <option value="2567">2567</option>
                <option value="2566">2566</option> */}
                </select>
              </div>
              <a
                href="/user/project/add_project"
                className="w-30 me-2 md:me-8 md:w-30 py-1.5 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                เพิ่มโครงการ
              </a>
            </div>
            <div>
              {Year.year_id !== null && (
                <DatatableProject year_id={Year.year_id} />
              )}
              {/* <DatatableProject /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
