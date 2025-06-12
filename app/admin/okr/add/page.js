"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import Menu from "../../component/nav_admin";
import Header from "../../component/header";
import Select from "react-select";
import DataTable from "react-data-table-component";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";
import { FiEdit2 } from "react-icons/fi";
import "bootstrap-icons/font/bootstrap-icons.css";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Loading from "./loading";
import Cookies from "js-cookie";
import { GetDataunitUse } from "../../../fetch_api/fetch_api_admin";
export default function addProject() {
  const [dataAddNewokr, setdataAddNewokr] = useState({
    id: null,
    name: null,
    year: null,
    user_teacher: null,
    user_employee: null,
    start_date: "",
    end_date: "",
    goal: null,
    result: null,
    report_data: null,
    id_unit: null,
    id_year: null,
  });

  // const [selecteddeparment, setSelecteddeparment] = useState(null);

  // const handleChange = (selectedOption) => {
  //   setSelecteddeparment(selectedOption);
  // };

  // การใช้ const [isMounted, setIsMounted] = useState(false) เป็นเทคนิคสำคัญในการแก้ไขปัญหา Hydration Error
  const [isMounted, setIsMounted] = useState(false);

  // สำหรับโค้ดที่ต้องรอให้โหลดในเบราว์เซอร์ก่อน

  useEffect(() => {
    setIsMounted(true); // ตั้งค่าเป็น true เมื่อคอมโพเนนต์ถูก mount แล้วบน client
  }, []);

  useEffect(() => {
    async function fethData() {
      const token = Cookies.get("token");
      const res_unit = await GetDataunitUse(token);
      console.log(res_unit);
      const mappedunitOptions = res_unit.map((item) => ({
        value: item.unit_id,
        label: `${item.unit_name}  `,
      }));
      setOptionsUnit(mappedunitOptions);
    }
    fethData();
  }, []);
  const [optionsUnit, setOptionsUnit] = useState([]);
  useEffect(() => {
    console.log(dataAddNewokr);
  }, [dataAddNewokr]);
  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "white", // สีพื้นหลังที่ต้องการ
      borderColor: "#d1d5db", // สีของขอบ
      padding: "0.125rem", // ขนาด padding
      borderRadius: "0.375rem", // ขอบมุมโค้ง
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#ffffff", // สีพื้นหลังของ dropdown
      borderColor: "#d1d5db",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#1E90FF" : "#ffffff", // สีเมื่อเลือก option
      color: state.isSelected ? "#ffffff" : "#333333", // สีตัวอักษรเมื่อเลือก
      padding: "0.5rem", // ขนาด padding ของแต่ละ option
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af", // สีของ placeholder
    }),
  };

  const [optionsprinciples, setoptionsprinciples] = useState([
    {
      value: "1",
      label: "ไตรมาสที่ 1  ",
    },
    {
      value: "2",
      label: "ไตรมาสที่ 2  ",
    },
    {
      value: "3",
      label: "ไตรมาสที่ 3  ",
    },
    {
      value: "4",
      label: "ไตรมาสที่ 4  ",
    },
  ]);

  return (
    <>
      <Suspense fallback={<Loading />}>
        {isMounted && (
          <div className="">
            <Header />
            <hr />
            <div className="grid grid-cols-12  gap-0 w-full min-h-screen mt-20">
              <div className="bg-gray-100  xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3">
                <Menu />
              </div>
              <div className="col-span-12 xl:col-span-10  md:col-span-9 mt-5 ms-4 md:mt-3 me-4 md:me-6">
                <div className="flex flex-row items-center justify-between">
                  <div className="text-lg md:text-3xl">
                    รายงานผลการดำเนินงานตามข้อตกลงการปฏิบัติงานสู่ความเป็นเลิศ
                    (OKRs) {dataAddNewokr.year}
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-x-8 gap-y-6 mt-3">
                  <div className="col-span-12 md:col-span-6">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      OKRs :
                    </span>
                    <input
                      type="text"
                      id="nameproject"
                      className="bg-white  shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="กรุณากรอกชื่อโครงการ"
                      required
                      value={dataAddNewokr.name || ""}
                      onChange={(e) =>
                        setdataAddNewokr({
                          ...dataAddNewokr,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      ปีงบประมาณ
                    </span>
                    <input
                      type="text"
                      id="idproject"
                      className="bg-gray-50  shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="ปีงบประมาณ"
                      readOnly
                      value={dataAddNewokr.year || ""}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      ผู้รับผิดชอบระดับบริหาร/นโยบาย :
                    </span>
                    <input
                      type="text"
                      id="location"
                      className="bg-white  shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="กรุณากรอกสถานที่"
                      value={dataAddNewokr.user_teacher || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      ผู้รับผิดชอบระดับปฏิบัติการ :
                    </span>
                    <input
                      type="text"
                      id="price"
                      className="bg-white  shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="กรุณากรอกงบประมาณ"
                      value={dataAddNewokr.user_employee || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      กำหนดให้รายงานข้อมูล :
                    </span>
                    <div className="flex flex-row">
                      <div
                        id="date-range-picker"
                        date-rangepicker="true"
                        className="flex items-center"
                      >
                        <div className="relative">
                          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-500 dark:text-gray-400"
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
                            className="bg-white  xl:w-67 md:w-38 w-38 shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Select date start"
                            value={dataAddNewokr.start_date ?? ""}
                            onChange={(e) =>
                              setdataAddNewokr({
                                ...dataAddNewokr,
                                start_date: e.target.value,
                              })
                            }
                            // readOnly
                          />
                        </div>
                        <span className="mx-4 text-gray-500">to</span>
                        <div className="relative">
                          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-500 dark:text-gray-400"
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
                            className="bg-gray-50 xl:w-67 md:w-38 w-38 shadow-md  border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block  ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Select date end"
                            min={dataAddNewokr.start_date || ""}
                            disabled={!dataAddNewokr.start_date}
                            value={dataAddNewokr.end_date ?? ""}
                            onChange={(e) =>
                              setdataAddNewokr({
                                ...dataAddNewokr,
                                end_date: e.target.value,
                              })
                            }
                            // readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <label
                      htmlFor="deparment"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      ค่าเป้าหมาย :
                    </label>

                    <input
                      type="number"
                      id="price"
                      className="bg-white shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="กรุณากรอกค่าเป้าหมาย"
                      value={dataAddNewokr.goal ?? ""}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const numericValue = parseFloat(rawValue);
                        if (!isNaN(numericValue)) {
                          setdataAddNewokr((prev) => ({
                            ...prev,
                            goal: numericValue,
                          }));
                        } else {
                          setdataAddNewokr((prev) => ({
                            ...prev,
                            goal: "",
                          }));
                        }
                      }}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <label
                      htmlFor="deparment"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      ผลการดำเนินงาน :
                    </label>

                    <input
                      type="text"
                      id="price"
                      className="bg-white  shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="กรุณากรอกงบประมาณ"
                      value={
                        dataAddNewokr.result
                          ? Number(dataAddNewokr.result).toLocaleString("th-TH")
                          : ""
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, ""); // เอา , ออกก่อนเก็บ
                        if (!isNaN(rawValue)) {
                          setdataAddNewokr({
                            ...dataAddNewokr,
                            result: rawValue,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      หน่วยนับ
                    </span>

                    <Select
                      value={optionsUnit.find(
                        (item) => item.value == dataAddNewokr.id_unit
                      )}
                      onChange={(selectedOption) =>
                        setdataAddNewokr((prev) => ({
                          ...prev,
                          unit_name: selectedOption, // หรือ selectedOption.value ถ้าต้องการเก็บแค่ value
                        }))
                      }
                      options={optionsUnit}
                      getOptionLabel={(e) => e.label}
                      getOptionValue={(e) => e.value}
                      styles={customStyles}
                      className="text-sm "
                      placeholder="กรุณาเลือกหน่วยนับ"
                    />
                  </div>
                  <div className="col-span-12">
                    <label
                      htmlFor="deparment"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Link ข้อมูลรายละเอียด
                    </label>

                    <input
                      type="text"
                      id="price"
                      className="bg-white   shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="กรุณากรอกงบประมาณ"
                      required
                      value={
                        dataAddNewokr.price
                          ? Number(dataAddNewokr.price).toLocaleString("th-TH")
                          : ""
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, ""); // เอา , ออกก่อนเก็บ
                        if (!isNaN(rawValue)) {
                          setdataAddNewokr({
                            ...dataAddNewokr,
                            price: rawValue,
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="col-span-12 mt-4 flex flex-row justify-end">
                    <button
                      type="button"
                      className="bg-blue-500 text-white text-sm px-8 py-1.5 rounded-md hover:bg-blue-600"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Suspense>
    </>
  );
}
