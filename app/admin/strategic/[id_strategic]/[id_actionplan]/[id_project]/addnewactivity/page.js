"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import Menu from "../../../../../component/nav_admin";
import Header from "../../../../../component/header";
import Select from "react-select";
import DataTable from "react-data-table-component";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";
import { FiEdit2 } from "react-icons/fi";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function addActivity() {
  const [dataAddNewProject, setdataAddNewProject] = useState({
    id_project: "",
    name: "",
    deparment: null,
    year: null,
    strategic: null,
    actionplan: null,
    project: null,
  });
  // const [selecteddeparment, setSelecteddeparment] = useState(null);
  const [optionsDeparment, setOptionsDeparment] = useState([
    { value: "D1", label: "IT" },
    { value: "D2", label: "AI" },
    { value: "D3", label: "CS" },
  ]);

  const [optionsYear, setoptionsYear] = useState([
    { value: "1", label: "2567" },
    { value: "2", label: "2568" },
    { value: "3", label: "2569" },
  ]);

  const [optionsStrategic, setoptionsStrategic] = useState([
    { value: "S1", label: "S1 : ยุทธศาสตร์ด้านการจัดการศึกษา" },
    { value: "S2", label: "S2 : ยุทธศาสตร์ด้านการวิจัย" },
    {
      value: "S3",
      label: "S3 : ยุทธศาสตร์ด้านการบริการวิชาการเพื่อสร้างประโยชน์ให้สังคม",
    },
  ]);

  const [optionsActionplan, setoptionsActionplan] = useState([
    {
      value: "A1",
      label:
        "A1 : การพัฒนาหลักสูตรใหม่ (New Curriculum) เพื่อสร้างอาชีพใหม่ตามความต้องการของสังคม",
    },
    {
      value: "A2",
      label: "A2 : การพัฒนาหลักสูตรสู่กระบวนทัศน์ใหม่ (Learning paradigm)",
    },
    {
      value: "A3",
      label: "A3 : การจัดการศึกษาตลอดชีวิต (Lifelong Education)",
    },
  ]);

  const [optionsProject, setoptionsProject] = useState([
    {
      value: "P1",
      label:
        "P1 : การพัฒนาหลักสูตรใหม่ (New Curriculum) เพื่อสร้างอาชีพใหม่ตามความต้องการของสังคม",
    },
    {
      value: "P2",
      label: "P2 : การพัฒนาหลักสูตรสู่กระบวนทัศน์ใหม่ (Learning paradigm)",
    },
    {
      value: "P3",
      label: "P3 : การจัดการศึกษาตลอดชีวิต (Lifelong Education)",
    },
  ]);

  const [optionsprinciples, setoptionsprinciples] = useState([
    {
      value: "PP1",
      label: "A1 : การพัฒนาหลักสูตรใหม่ ",
    },
    {
      value: "PP2",
      label: "A2 : การพัฒนา",
    },
    {
      value: "PP3",
      label: "A3 : การจัดการ",
    },
    {
      value: "PP4",
      label: "A4 : การจัดการศึกษา)",
    },
  ]);

  // const handleChange = (selectedOption) => {
  //   setSelecteddeparment(selectedOption);
  // };

  // การใช้ const [isMounted, setIsMounted] = useState(false) เป็นเทคนิคสำคัญในการแก้ไขปัญหา Hydration Error
  const [isMounted, setIsMounted] = useState(false);

  // สำหรับโค้ดที่ต้องรอให้โหลดในเบราว์เซอร์ก่อน

  useEffect(() => {
    setIsMounted(true); // ตั้งค่าเป็น true เมื่อคอมโพเนนต์ถูก mount แล้วบน client
  }, []);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "#f9fafb", // สีพื้นหลังที่ต้องการ
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

  const [SecrchData, setSecrchData] = useState([
    {
      id: "OKR1",
      name: "dsds",
    },
    {
      id: "OKR2",
      name: "dsdwwwwws",
    },
  ]);

  const columns = [
    {
      name: "ข้อ",
      selector: (row) => row.id,
      sortable: true,
    },
    {
      name: "ชื่อ",
      selector: (row) => row.name,
      sortable: true,
      wrap: true,
    },
    {
      name: "จัดการ",
      cell: (row) => (
        <>
          <div style={{ padding: "5px" }}>
            <button
              className="rounded border-gray-200 p-2 hover:bg-gray-100 group"
              onClick={() => {
                // เก็บข้อมูลที่ต้องส่งไว้ใน sessionStorage
                sessionStorage.setItem(
                  "strategic_data",
                  JSON.stringify({
                    name: row.strategic_name,
                    budget: row.budget,
                  })
                );

                // เปลี่ยนหน้า
                window.location.href = `/admin/strategic/${row.strategic_number}`;
              }}
            >
              <FiEdit2 className="text-xl text-gray-500 group-hover:text-black" />
            </button>
          </div>
          <div style={{ padding: "5px" }}>
            {" "}
            <button
              className="rounded border-gray-200 p-2 hover:bg-gray-100  group"
              onClick={() => handleDelete(row)} // เรียกใช้ฟังก์ชัน handleDelete เมื่อกดปุ่ม
            >
              <i className="bi bi-trash text-xl group-hover:text-red-500"></i>{" "}
            </button>
          </div>
        </>
      ),
      ignoreRowClick: true,
    },
  ];

  const customStylesTable = {
    headCells: {
      style: {
        backgroundColor: "#f0f0f0", // สีพื้นหลังหัวตาราง
        color: "#1f2937", // สีตัวอักษร (เทาเข้ม)
        fontWeight: "bold",
        fontSize: "14px",
      },
    },
  };

  const [editorData, setEditorData] = useState("");

  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    setEditorData(data);
  };

  return (
    <>
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
                  แบบฟอร์มโครงการตามแผนปฏิบัติการ วิทยาลัยการคอมพิวเตอร์
                  มหาวิทยาลัยขอนแก่น
                </div>
              </div>
              <div className="grid grid-cols-12 gap-x-8 gap-y-6 mt-3">
                <div className="col-span-12 md:col-span-6">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    ชื่อโครงการ
                  </span>
                  <input
                    type="text"
                    id="nameproject"
                    className="bg-gray-50  shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="กรุณากรอกชื่อโครงการ"
                    required
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    รหัสโครงการ
                  </span>
                  <input
                    type="text"
                    id="idproject"
                    className="bg-gray-50  shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="กรุณากรอกรหัสโครงการ"
                    readOnly
                    value={"1"}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    สถานที่
                  </span>
                  <input
                    type="text"
                    id="location"
                    className="bg-gray-50  shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="กรุณากรอกสถานที่"
                    readOnly
                    value=""
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    ระยะเวลาดำเนินการ
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
                          className="bg-gray-50  xl:w-67 md:w-38 w-35 shadow-md border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Select date start"
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
                          className="bg-gray-50 xl:w-67 md:w-38 w-35 shadow-md  border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block  ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Select date end"
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
                    หน่วยงานรับผิดชอบ
                  </label>

                  <Select
                    id="deparment"
                    value={optionsDeparment.find(
                      (option) => option.value === dataAddNewProject.deparment
                    )}
                    // value={dataAddNewProject.deparment || ""}
                    onChange={(e) => {
                      console.log("Selected Value:", e.value);
                      setdataAddNewProject({
                        ...dataAddNewProject,
                        deparment: e.value,
                      });
                    }}
                    options={optionsDeparment}
                    styles={customStyles}
                    className="text-sm shadow-md"
                    placeholder="กรุณาเลือกหน่วยงานรับผิดชอบ"
                    instanceId="deparment-select" // Add this line to fix duplicate IDs
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label
                    htmlFor="deparment"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    ปีงบประมาณ
                  </label>

                  <Select
                    id="idYear"
                    value={optionsYear.find(
                      (option) => option.value === dataAddNewProject.year
                    )}
                    onChange={(e) => {
                      setdataAddNewProject({
                        ...dataAddNewProject,
                        deparment: e.value,
                      });
                    }}
                    options={optionsYear}
                    styles={customStyles}
                    className="text-sm shadow-md"
                    placeholder="กรุณาเลือกปีงบประมาณ"
                    instanceId="deparment-select" // Add this line to fix duplicate IDs
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    ลักษณะโครงการ
                  </span>

                  <div className="flex flex-row justify-start items-center">
                    <div className="flex items-center">
                      <input
                        id="regular-checkbox"
                        type="checkbox"
                        value=""
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label
                        htmlFor="regular-checkbox"
                        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                      >
                        งานประจำ
                      </label>
                    </div>

                    <div className="ms-8 flex items-center">
                      <input
                        id="strategic-checkbox"
                        type="checkbox"
                        value=""
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label
                        htmlFor="strategic-checkbox"
                        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                      >
                        งานเชิงยุทธศาสตร์
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-span-12">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    ตอบสนองตามหลักธรรมาภิบาล (สามารถระบุได้มากกว่า 1)
                  </span>

                  <div className="grid grid-cols-12 gap-2">
                    {optionsprinciples.map((val) => {
                      return (
                        <div
                          key={val.value}
                          className="flex items-center col-span-12 md:col-span-3 xl:col-span-2"
                        >
                          <input
                            id={`checkbox-${val.value}`}
                            type="checkbox"
                            value=""
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label
                            htmlFor={`checkbox-${val.value}`}
                            className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                          >
                            {val.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="col-span-12 mt-4">
                  <hr className="text-gray-200" />
                </div>
                <div className="col-span-12">
                  <h2>ความสอดคล้องกับประเด็นยุทธศาสตร์</h2>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    ประเด็นยุทธศาสตร์
                  </span>
                  <Select
                    id="strategic"
                    value={optionsStrategic.find(
                      (option) => option.value === dataAddNewProject.strategic
                    )}
                    onChange={(e) => {
                      setdataAddNewProject({
                        ...dataAddNewProject,
                        strategic: e.value,
                      });
                    }}
                    options={optionsStrategic}
                    styles={customStyles}
                    className="text-sm shadow-md"
                    placeholder="กรุณาเลือกปีงบประมาณ"
                    instanceId="strategic-select" // Add this line to fix duplicate IDs
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    กลยุทธ์
                  </span>
                  <Select
                    id="actionplan"
                    value={optionsActionplan.find(
                      (option) => option.value === dataAddNewProject.actionplan
                    )}
                    onChange={(e) => {
                      setdataAddNewProject({
                        ...dataAddNewProject,
                        actionplan: e.value,
                      });
                    }}
                    options={optionsActionplan}
                    styles={customStyles}
                    className={`text-sm shadow-md ${
                      dataAddNewProject.strategic === null
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                    placeholder="กรุณาเลือกกลยุทธ์"
                    isDisabled={dataAddNewProject.strategic === null}
                    instanceId="strategic-select" // Add this line to fix duplicate IDs
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    ภายใต้โครงการ
                  </span>
                  <Select
                    id="actionplan"
                    value={optionsProject.find(
                      (option) => option.value === dataAddNewProject.project
                    )}
                    onChange={(e) => {
                      setdataAddNewProject({
                        ...dataAddNewProject,
                        project: e.value,
                      });
                    }}
                    options={optionsProject}
                    styles={customStyles}
                    className={`text-sm shadow-md ${
                      dataAddNewProject.actionplan === null
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                    placeholder="กรุณาเลือกกลยุทธ์"
                    isDisabled={dataAddNewProject.actionplan === null}
                    instanceId="strategic-select" // Add this line to fix duplicate IDs
                  />
                </div>

                <div className="col-span-12">
                  <div className="flex flex-col ">
                    <div className="flex flex-row justify-between mb-2">
                      <h2>OKR </h2>
                      <button
                        type="button"
                        className=" top-9 right-2 bg-blue-500 text-white text-sm px-8 py-1.5 rounded-md hover:bg-blue-600"
                      >
                        เพิ่ม
                      </button>
                    </div>

                    <div className="relative">
                      {" "}
                      <div className="bg-white rounded-md border border-gray-200 shadow-md mt-3 ">
                        <DataTable
                          columns={columns}
                          data={SecrchData}
                          customStyles={customStylesTable}
                          fixedHeaderScrollHeight="100%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* <div className="col-span-12 mt-4">
                  <hr className="text-gray-200" />
                </div> */}

                <div className="col-span-12 mt-4">
                  <hr className="text-gray-200" />
                </div>
                <div className="col-span-12 ">
                  <label
                    htmlFor="message"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    หลักการและเหตุผล
                  </label>
                  {/* <CKEditor
                    editor={ClassicEditor}
                    data={editorData}
                    onChange={handleEditorChange}
                  /> */}
                </div>
                <div className="col-span-12">
                  <div className="flex flex-col ">
                    <div className="flex flex-row justify-between mb-2">
                      <h2>วัตถุประสงค์ </h2>
                      <button
                        type="button"
                        className=" top-9 right-2 bg-blue-500 text-white text-sm px-8 py-1.5 rounded-md hover:bg-blue-600"
                      >
                        เพิ่ม
                      </button>
                    </div>

                    <div className="relative">
                      <div className="bg-white rounded-md border border-gray-200 shadow-md mt-3 ">
                        <DataTable
                          columns={columns}
                          data={SecrchData}
                          customStyles={customStylesTable}
                          fixedHeaderScrollHeight="100%"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 mt-4">
                  <hr className="text-gray-200" />
                </div>
                <div className="col-span-12">
                  <div className="flex flex-col ">
                    <div className="flex flex-row justify-between mb-2">
                      <h2>ตัวชี้วัด </h2>
                      <button
                        type="button"
                        className=" top-9 right-2 bg-blue-500 text-white text-sm px-8 py-1.5 rounded-md hover:bg-blue-600"
                      >
                        เพิ่ม
                      </button>
                    </div>

                    <div className="relative">
                      <div className="bg-white rounded-md border border-gray-200 shadow-md mt-3 ">
                        <DataTable
                          columns={columns}
                          data={SecrchData}
                          customStyles={customStylesTable}
                          fixedHeaderScrollHeight="100%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 mt-4">
                  <hr className="text-gray-200" />
                </div>
                <div className="col-span-12">
                  <div className="flex flex-col ">
                    <div className="flex flex-row justify-between mb-2">
                      <h2>ผลที่คาดว่าจะได้รับ </h2>
                      <button
                        type="button"
                        className=" top-9 right-2 bg-blue-500 text-white text-sm px-8 py-1.5 rounded-md hover:bg-blue-600"
                      >
                        เพิ่ม
                      </button>
                    </div>

                    <div className="relative">
                      <div className="bg-white rounded-md border border-gray-200 shadow-md mt-3 ">
                        <DataTable
                          columns={columns}
                          data={SecrchData}
                          customStyles={customStylesTable}
                          fixedHeaderScrollHeight="100%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 mt-4">
                  <hr className="text-gray-200" />
                </div>
                <div className="col-span-12">
                  <div className="flex flex-col ">
                    <div className="flex flex-row justify-between mb-2">
                      <h2>
                        ปัญหาอุปสรรค
                        และแนวทางการปรับปรุงการดำเนินงานในรอบปีที่ผ่านมา{" "}
                      </h2>
                      <button
                        type="button"
                        className=" top-9 right-2 bg-blue-500 text-white text-sm px-8 py-1.5 rounded-md hover:bg-blue-600"
                      >
                        เพิ่ม
                      </button>
                    </div>

                    <div className="relative">
                      <div className="bg-white rounded-md border border-gray-200 shadow-md mt-3 ">
                        <DataTable
                          columns={columns}
                          data={SecrchData}
                          customStyles={customStylesTable}
                          fixedHeaderScrollHeight="100%"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 mt-4">
                  <hr className="text-gray-200" />
                </div>
                <div className="col-span-12">
                  <div className="flex flex-col ">
                    <div className="flex flex-row justify-between mb-2">
                      <h2>ผู้รับผิดชอบระดับปฏิบัติ </h2>
                      <button
                        type="button"
                        className=" top-9 right-2 bg-blue-500 text-white text-sm px-8 py-1.5 rounded-md hover:bg-blue-600"
                      >
                        เพิ่ม
                      </button>
                    </div>

                    <div className="relative">
                      <div className="bg-white rounded-md border border-gray-200 shadow-md mt-3 ">
                        <DataTable
                          columns={columns}
                          data={SecrchData}
                          customStyles={customStylesTable}
                          fixedHeaderScrollHeight="100%"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 mt-4">
                  <hr className="text-gray-200" />
                </div>
                <div className="col-span-12">
                  <div className="flex flex-col ">
                    <div className="flex flex-row justify-between mb-2">
                      <h2>ผู้รับผิดชอบระดับนโยบาย / บริหาร </h2>
                      <button
                        type="button"
                        className=" top-9 right-2 bg-blue-500 text-white text-sm px-8 py-1.5 rounded-md hover:bg-blue-600"
                      >
                        เพิ่ม
                      </button>
                    </div>

                    <div className="relative">
                      <div className="bg-white rounded-md border border-gray-200 shadow-md mt-3 ">
                        <DataTable
                          columns={columns}
                          data={SecrchData}
                          customStyles={customStylesTable}
                          fixedHeaderScrollHeight="100%"
                        />
                      </div>
                    </div>
                  </div>
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
    </>
  );
}
