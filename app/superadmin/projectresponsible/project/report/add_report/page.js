"use client";
import Image from "next/image";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import Menu from "../../../component/nav";
import Header from "../../../component/header";
import Cookies from "js-cookie";
export default function addActivtydetail({ params }) {
  const [projectData, setprojectData] = useState({
    id: "",
    number: "",
    name: "",
    budget: "",
  });
  const [activityData, setactivityData] = useState({
    id: "",
    number: "",
    name: "",
    budget: "",
  });

  const [dataAddsend, setdataAddsend] = useState({
    station: "",
    total_price: 0,
    url: "",
  });
  const [fullname, setFullname] = useState("");
  const { id_strategic, id_actionplan, id_project, id_activity } = use(params);
  const date = new Date();
  const formatted =
    date.getDate().toString().padStart(2, "0") +
    "/" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "/" +
    date.getFullYear();

  useEffect(() => {
    const data = sessionStorage.getItem("activitydetail_data");
    const data_activity = sessionStorage.getItem("project_data");
    const fullname = Cookies.get("fullname");

    if (!data || !data_activity || !fullname) {
      window.location.href = `/user/project`;
    } else {
      setprojectData(JSON.parse(data));
      setactivityData(JSON.parse(data_activity));
      setFullname(fullname);
    }
  }, []);

  return (
    <>
      <div className="">
        <Header />
        <hr />
        <div className="grid grid-cols-9 gap-4 w-full min-h-screen mt-20">
          <div className="bg-gray-100 col-span-2 xl:col-span-2 hidden md:block md:col-span-2 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-9 xl:col-span-8  md:col-span-7  mt-5 md:mt-3 ms-8 md:ms-0 me-4">
            <div className="flex flex-row items-center justify-between">
              <div className="text-lg md:text-xl xl:text-2xl">
                รายงานผลการดำเนินงานโครงการกิจกรรมตามแผนปฏิบัติการประจำปีงบประมาณ
                พ.ศ. 2568
              </div>
            </div>
            <div className="grid grid-cols-8 gap-x-8 gap-y-6 mt-3">
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ภายใต้โครงการ
                </span>
                <input
                  type="text"
                  id="name_project"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@flowbite.com"
                  readOnly
                  value={`${id_project} : ${activityData.name}`}
                />
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ภายใต้กิจกรรม
                </span>
                <input
                  type="text"
                  id="name_project"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@flowbite.com"
                  readOnly
                  value={`${id_activity} : ${projectData.name}`}
                />
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ครั้งที่
                </span>
                <input
                  type="text"
                  id="round"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@flowbite.com"
                  readOnly
                  value={"1"}
                />
              </div>
              <div className="col-span-8 md:col-span-4">
                <div className="flex flex-col ">
                  <div className="flex flex-row justify-between mb-0.5">
                    <h2>วันที่ดำเนินการ </h2>
                  </div>

                  <div className="flex flex-row">
                    <div
                      id="date-range-picker"
                      date-rangepicker="true"
                      className="flex items-center"
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                          <svg
                            className="w-3 md:w-4 h-4 text-gray-500 dark:text-gray-400"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                          </svg>
                        </div>
                        <input
                          id="datepicker-range-start"
                          name="start"
                          type="date"
                          className="bg-gray-50 ps-6 md:ps-8 xl:ps-10 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Select date start"
                        />
                      </div>
                      <span className="mx-2 text-gray-500">to</span>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                          <svg
                            className="w-3 md:w-4 h-4 text-gray-500 dark:text-gray-400"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                          </svg>
                        </div>
                        <input
                          id="datepicker-range-end"
                          name="end"
                          type="date"
                          className="bg-gray-50  ps-6 md:ps-8 xl:ps-10  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Select date end"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  สถานที่ดำเนินงาน
                </span>
                <input
                  type="text"
                  id="station"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="กรุณากรอกสถานที่"
                  required
                  value={dataAddsend.station || ""}
                  onChange={(e) =>
                    setdataAddsend({ ...dataAddsend, station: e.target.value })
                  }
                />
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  งบประมาณ
                </span>
                <input
                  type="number"
                  id="total_price"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="กรุณากรอกจำนวนเงิน"
                  required
                  value={dataAddsend.total_price || 0}
                  onChange={(e) =>
                    setdataAddsend({
                      ...dataAddsend,
                      total_price: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ผู้รายงานข้อมูล
                </span>
                <input
                  type="email"
                  id="user_report"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@flowbite.com"
                  readOnly
                  value={fullname}
                />
              </div>

              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  วันที่รายงาน
                </span>
                <input
                  type="text"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@flowbite.com"
                  readOnly
                  value={formatted}
                />
              </div>
              <div className="col-span-8">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Link ข่าว ภาพ รายละเอียด (ถ้ามี)
                </span>
                <input
                  type="text"
                  id="url"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="กรุณากรอกที่อยู่ของไฟล์ทั้งหมด"
                  required
                  value={dataAddsend.url || ""}
                  onChange={(e) =>
                    setdataAddsend({ dataAddsend, url: e.target.value })
                  }
                />
              </div>

              <div className="col-span-9 mt-4 flex flex-row justify-end me-8">
                <button
                  type="button"
                  className="bg-blue-500 text-white text-md px-14 py-2  rounded-lg hover:bg-blue-600"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
