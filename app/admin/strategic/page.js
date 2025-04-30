"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import Menu from "../component/nav_admin";
import Header from "../component/header";
import DatatableStrig from "../component/strategic";
import { GetDatayear } from "../../fetch_api/fetch_api_admin";
export default function HomeStrategic() {
  const [yearOptions, setyearOptions] = useState([
    // { value: 1, label: "2568" },
    // { value: 2, label: "2567" },
    // { value: 3, label: "2566" },
  ]);
  const [Year, setYear] = useState({
    year_id: null,
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
        console.log("token : ", token);
        const res = await GetDatayear(token);
        console.log("year : ", res.data);
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
        <div className="grid grid-cols-10 gap-4 w-full min-h-screen mt-20">
          <div className="bg-gray-100 col-span-2 xl:col-span-2 hidden md:block md:col-span-2 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-10 xl:col-span-8  md:col-span-8  mt-5 md:mt-3 ">
            <div className="flex flex-row justify-between">
              <div className="flex flex-row items-center ">
                <div className="text-lg md:text-2xl me-3 ">
                  จัดการยุทธศาสตร์ประจำปี พ.ศ.
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
              <button className="w-20 me-2 md:me-4 justify-end md:w-25 py-1.5 bg-blue-400 text-white rounded-lg hover:bg-blue-700">
                เพิ่มข้อมูล
              </button>
            </div>
            <div>
              {Year.year_id !== null && (
                <DatatableStrig year_id={Year.year_id} />
              )}{" "}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
