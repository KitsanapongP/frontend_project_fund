"use client";
import Image from "next/image";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import Menu from "../../../../component/nav";
import Header from "../../../../component/header";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import _ from "lodash";
import { useSearchParams } from "next/navigation";
import { AddDataActivitydetail } from "../../../../../fetch_api/fetch_api_user";
export default function addActivtydetail({ params }) {
  const [loading, setLoading] = useState(true);
  const [id_employee, setIdemployee] = useState(null);
  const searchParams = useSearchParams();
  const total = searchParams.get("total");
  const maxBudget = searchParams.get("maxBudget");
  const [parsed, setParsed] = useState(null);
  const [parsed_project, setParsedProject] = useState(null);
  const [parsed_strategic, setParsedStrategic] = useState(null);
  const [parsed_actionplan, setParsedActionplan] = useState(null);
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
    const data_project = sessionStorage.getItem("project_data");
    const fullname = Cookies.get("fullname");
    const id_employee = Cookies.get("id");
    try {
      if (!data || !data_project || !fullname) {
        window.location.href = `/admin/projectresponsible`;
      } else {
        setLoading(true);
        const data = sessionStorage.getItem("activitydetail_data");
        const data_project = sessionStorage.getItem("project_data");

        const parsedData = JSON.parse(data);
        const parsedProjectData = JSON.parse(data_project);

        // Set state
        setParsed(parsedData);
        setParsedProject(parsedProjectData);
        // console.log(parsedData.name);
        setdataAddsend({
          ...dataAddsend,
          id_activity: parsedData.id,
          name_activity: parsedData.name,
          id_project: parsedProjectData.id,
          name_project: parsedProjectData.name,
          id_employee: id_employee,
        });
        setOlddataAddsend({
          ...dataAddsend,
          id_activity: parsedData.id,
          name_activity: parsedData.name,
          id_project: parsedProjectData.id,
          name_project: parsedProjectData.name,
          id_employee: id_employee,
        });
        setFullname(fullname);
        setIdemployee(id_employee);
      }
    } catch (err) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        // text: ` ${newStatus === 1 ? "เปิดการใช้งาน" : "ปิดการใช้งาน"} ${row.departments_name}`,
        text: "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
        timer: 1500,
      }).then(() => {
        // window.location.reload();
        window.history.back();
      });
      // console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const report_data =
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date.getDate().toString().padStart(2, "0");

  const [OlddataAddsend, setOlddataAddsend] = useState({
    detail: "",
    station: "",
    total_price: null,
    start_date: "",
    end_date: "",
    report_data: "",
    id_employee: "",
    id_activity: "",
  });

  const [dataAddsend, setdataAddsend] = useState({
    detail: "",
    station: "",
    total_price: null,
    start_date: "",
    end_date: "",
    report_data: "",
    id_employee: "",
    id_activity: "",
  });

  const [checkActivitydetail, setcheckActivitydetail] = useState({
    detail: false,
    station: false,
    start_date: false,
    end_date: false,
    report_data: false,
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log(dataAddsend);
    // if (dataAddsend.budget > maxBudget) {
    //   Swal.fire({
    //     title: "งบประมาณเกินขีดจำกัด",
    //     text: `กรุณากรอกไม่เกิน ${maxBudget.toLocaleString()} บาท`,
    //     icon: "error",
    //     confirmButtonText: "ตกลง",
    //   });
    //   return;
    // }
    if (
      !checkActivitydetail.detail ||
      !checkActivitydetail.total_price ||
      !checkActivitydetail.start_date ||
      !checkActivitydetail.end_date ||
      !checkActivitydetail.station ||
      !checkActivitydetail.report_data
    ) {
      let missingField = "";

      if (!checkActivitydetail.detail) missingField = "รายละเอียด";
      else if (!checkActivitydetail.total_price) missingField = "จำนวนเงิน";
      else if (!checkActivitydetail.start_date) missingField = "วันที่เริ่มต้น";
      else if (!checkActivitydetail.end_date) missingField = "วันที่สิ้นสุด";
      else if (!checkActivitydetail.report_data) missingField = "ลิงก์หลักฐาน";
      else if (!checkActivitydetail.station) missingField = "สถานที่";
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: `กรุณากรอก${missingField}`,
        icon: "error",
        confirmButtonText: "ตกลง",
      });

      return;
    }
    const isValidUrl = /^https?:\/\/.+/.test(dataAddsend.report_data);
    if (!isValidUrl) {
      Swal.fire({
        title: "ลิงก์ไม่ถูกต้อง",
        text: "กรุณากรอก URL ที่ขึ้นต้นด้วย http:// หรือ https://",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
      return;
    }
    Swal.fire({
      title: "ยืนยันการบันทึกข้อมูล ?",
      text: dataAddsend ? `แก้ไขข้อมูลของ : ${dataAddsend.detail}` : "",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // console.log("Submitted Strategic Name: ", position);

        // เพิ่มหรือส่งข้อมูลกลับ
        // เช่น: onSave(position);

        if (_.isEqual(OlddataAddsend, dataAddsend)) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถแก้ไขยุทธศาสตร์เป็นค่าเดิมได้",
            icon: "error",
            confirmButtonText: "ตกลง",
          });
          return;
        }
        try {
          const token = Cookies.get("token");
          // console.log(dataAddsend)
          const response = await AddDataActivitydetail(token, dataAddsend);

          // if(response)
          // console.log(response);
          if (response) {
            Swal.fire({
              title: "อัปเดตข้อมูลสำเร็จ",
              // text: ` ${newStatus === 1 ? "เปิดการใช้งาน" : "ปิดการใช้งาน"} ${row.departments_name}`,
              text: "ข้อมูลถูกอัปเดตในระบบแล้ว",
              icon: "success",
              confirmButtonText: "ตกลง",
              timer: 1500,
            })
              .then(() => {
                // window.history.back();
                // console.log(parsed);
                const updatedParsed = {
                  ...parsed,
                  Balance:
                    response?.original?.spend_money_summary
                      ?.activity_spend_money ?? 0,
                };

                const updatedProject = {
                  ...parsed_project,
                  Balance:
                    response?.original?.spend_money_summary
                      ?.project_spend_money ?? 0,
                };

                // อัปเดต state
                setParsed(updatedParsed);

                setParsedProject(updatedProject);

                // อัปเดต sessionStorage
                sessionStorage.setItem(
                  "activitydetail_data",
                  JSON.stringify(updatedParsed)
                );
                sessionStorage.setItem(
                  "project_data",
                  JSON.stringify(updatedProject)
                );
              })
              .then(() => {
                window.location.href = `/admin/projectresponsible/project/${id_project}/${id_activity}`;
              });
          } else {
            Swal.fire({
              title: "เกิดข้อผิดพลาด",
              text: "ไม่สามารถเพิ่มข้อมูล กรุณาลองใหม่อีกครั้ง",
              icon: "error",
              confirmButtonText: "ตกลง",
            });
          }
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: err, // แสดงเฉพาะข้อความเท่านั้น
            confirmButtonText: "ตกลง",
          });
          // console.log(err);
        }

        // onClose(); // ปิด modal ถ้าต้องการ
      }
    });
  };

  function formatDecimalWithComma(value) {
    if (value === "") return "";

    const [intPart, decimalPart] = value.split(".");
    // \B = ยุทธ์ศาสตร์ที่ไม่ใช่ขอบเขตคำ
    // ?= ตรงนี้จะ match ก็ต่อเมื่อข้างหน้ามี pattern ที่กำหนด
    // \d{3} → ตัวเลข 3 ตัวติดกัน
    // (?!\d) ป้องกันการใส่คอมมาที่ท้ายสุดของตัวเลข เช่น "123," ← แบบนี้ไม่เอา
    // มองไปข้างหน้า ถ้าเจอกลุ่มตัวเลข 3 หลักขึ้นไป ที่ ไม่มีตัวเลขต่อท้ายอีก ให้ match ตรงนี้
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimalPart !== undefined
      ? `${formattedInt}.${decimalPart}`
      : formattedInt;
  }
  const [overBudget, setOverBudget] = useState(false);
  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-300"></div>
          <span className="ml-3 text-gray-300">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <div className="">
          <Header />
          <hr />
          <div className="grid grid-cols-12  gap-0 w-full min-h-screen mt-20">
            <div className="bg-gray-100  xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3">
              <Menu />
            </div>
            <div className="col-span-12 xl:col-span-10  md:col-span-9 mt-5 ms-4 md:mt-3 me-4 md:me-6">
              <div className="flex flex-row items-center justify-between">
                <div className="text-lg md:text-xl xl:text-2xl">
                  รายงานผลการดำเนินงานโครงการกิจกรรมตามแผนปฏิบัติการประจำปีงบประมาณ
                  พ.ศ. 2568
                </div>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-8 gap-x-8 gap-y-6 mt-3">
                  <div className="col-span-8 md:col-span-4">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      ภายใต้โครงการ
                    </span>
                    <input
                      type="text"
                      id="name_project"
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="name@flowbite.com"
                      readOnly
                      value={`${id_project} : ${dataAddsend.name_project}`}
                    />
                  </div>
                  <div className="col-span-8 md:col-span-4">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      ภายใต้กิจกรรม
                    </span>
                    <input
                      type="text"
                      id="name_project"
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="name@flowbite.com"
                      readOnly
                      value={`${id_activity} : ${dataAddsend.name_activity}`}
                    />
                  </div>
                  <div className="col-span-8 md:col-span-4">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      ครั้งที่
                    </span>
                    <input
                      type="text"
                      id="round"
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="name@flowbite.com"
                      readOnly
                      value={total}
                    />
                  </div>
                  <div className="col-span-8 md:col-span-4">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      วันที่รายงาน
                    </span>
                    <input
                      type="text"
                      id="email"
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="name@flowbite.com"
                      readOnly
                      value={formatted}
                    />
                  </div>
                  <div className="col-span-8 md:col-span-4">
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
                            className="xl:w-67 md:w-35 w-38  border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Select date start"
                            value={dataAddsend.start_date ?? ""}
                            onChange={(e) =>
                              setdataAddsend((prev) => ({
                                ...prev,
                                start_date: e.target.value,
                              }))
                            }
                            onBlur={() =>
                              setcheckActivitydetail({
                                ...checkActivitydetail,
                                start_date: true,
                              })
                            }
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
                            disabled={!dataAddsend.start_date}
                            className={`xl:w-67 md:w-35 w-38 ${
                              !dataAddsend.start_date
                                ? "bg-gray-100"
                                : "bg-white"
                            }   border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block  ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
                            placeholder="Select date end"
                            value={dataAddsend.end_date ?? ""}
                            min={dataAddsend.start_date || ""}
                            onChange={(e) =>
                              setdataAddsend((prev) => ({
                                ...prev,
                                end_date: e.target.value,
                              }))
                            }
                            onBlur={() =>
                              setcheckActivitydetail({
                                ...checkActivitydetail,
                                end_date: true,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-8 md:col-span-4">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      รายละเอียดดำเนินงาน
                    </span>
                    <input
                      type="text"
                      id="station"
                      className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="กรุณากรอกรายละเอียดดำเนินงาน"
                      required
                      value={dataAddsend.detail || ""}
                      onChange={(e) =>
                        setdataAddsend((prev) => ({
                          ...prev,
                          detail: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        setcheckActivitydetail({
                          ...checkActivitydetail,
                          detail: true,
                        })
                      }
                    />
                    {checkActivitydetail.detail &&
                      dataAddsend.detail === "" && (
                        <p className="mt-1 text-sm text-red-600">
                          กรุณากรอกรายละเอียดดำเนินงาน
                        </p>
                      )}
                  </div>
                  <div className="col-span-8 md:col-span-4">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      สถานที่ดำเนินงาน
                    </span>
                    <input
                      type="text"
                      id="station"
                      className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="กรุณากรอกสถานที่"
                      required
                      value={dataAddsend.station || ""}
                      onChange={(e) =>
                        setdataAddsend((prev) => ({
                          ...prev,
                          station: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        setcheckActivitydetail({
                          ...checkActivitydetail,
                          station: true,
                        })
                      }
                    />
                    {checkActivitydetail.station &&
                      dataAddsend.station === "" && (
                        <p className="mt-1 text-sm text-red-600">
                          กรุณากรอกสถานที่
                        </p>
                      )}
                  </div>
                  <div className="col-span-8 md:col-span-4">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      งบประมาณที่ใช้ดำเนินการ
                    </span>
                    <input
                      type="text"
                      id="total_price"
                      className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="กรุณากรอกจำนวนเงิน"
                      required
                      value={
                        dataAddsend.total_price
                          ? formatDecimalWithComma(dataAddsend.total_price)
                          : ""
                      }
                      onChange={(e) => {
                        // /g คือ global flag (แทนที่ทุกตัวที่ตรง ไม่ใช่แค่ตัวแรก)
                        const raw = e.target.value.replace(/,/g, ""); // เอา , ออกก่อน
                        // (\.\d{0,2})? → จุดและตัวเลขหลังจุดไม่เกิน 2 ตัว
                        // ? → ไม่ใส่จุดก็ได้
                        if (/^\d*(\.\d{0,2})?$/.test(raw)) {
                          const rawValue = parseFloat(raw || "0");
                          // console.log(maxBudget);
                          // ✅ ตรวจว่าไม่เกิน maxBudget
                          const maxBalace = parseFloat(maxBudget);
                          if (rawValue > maxBalace) {
                            setOverBudget(true); // ⚠️ เกิน
                          } else {
                            setOverBudget(false); // ✅ ปกติ
                          }

                          if (rawValue <= maxBalace) {
                            setdataAddsend((prev) => ({
                              ...prev,
                              total_price: raw,
                            }));
                          }
                        }
                      }}
                      onBlur={() =>
                        setcheckActivitydetail({
                          ...checkActivitydetail,
                          total_price: true,
                        })
                      }
                    />
                    {checkActivitydetail.total_price &&
                      parseFloat(dataAddsend.total_price) === "" && (
                        <p className="mt-1 text-sm text-red-600">
                          กรุณากรอกงบประมาณ
                        </p>
                      )}
                    {overBudget && (
                      <p className="mt-1 text-sm text-red-600">
                        งบประมาณไม่ควรเกิน {formatDecimalWithComma(maxBudget)}{" "}
                        บาท
                      </p>
                    )}
                  </div>
                  <div className="col-span-8 md:col-span-4">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      ผู้รายงานข้อมูล
                    </span>
                    <input
                      type="email"
                      id="user_report"
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="name@flowbite.com"
                      readOnly
                      value={fullname}
                    />
                  </div>

                  <div className="col-span-8">
                    <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Link ข่าว ภาพ รายละเอียด (ถ้ามี)
                    </span>
                    <input
                      type="text"
                      id="report_data"
                      className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="กรุณากรอกที่อยู่ของไฟล์ทั้งหมด"
                      required
                      value={dataAddsend.report_data || ""}
                      onChange={(e) =>
                        setdataAddsend((prev) => ({
                          ...prev,
                          report_data: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        setcheckActivitydetail({
                          ...checkActivitydetail,
                          report_data: true,
                        })
                      }
                    />
                    {checkActivitydetail.report_data &&
                      dataAddsend.report_data === "" && (
                        <p className="mt-1 text-sm text-red-600">
                          กรุณากรอกที่อยู่ของไฟล์ทั้งหมด
                        </p>
                      )}
                  </div>

                  <div className="col-span-9 mt-4 flex flex-row justify-end me-8">
                    <button
                      type="submit"
                      className="bg-blue-500 text-white text-md px-14 py-2  rounded-lg hover:bg-blue-600"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
