import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
// ตรวจสอบให้แน่ใจว่า export ฟังก์ชันคอมโพเนนต์ถูกต้อง
// In component/modal.js
import Select from "react-select";
import _ from "lodash";

import {
  AddDataStrategic,
  EditDataStrategic,
} from "../../../fetch_api/fetch_api_admin";
import Cookies from "js-cookie";
export function ModalAddStrategic({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div
      id="popup-modal"
      tabIndex="-1"
      className="fixed top-0 left-0 w-full h-full bg-gray-500/60 bg-opacity-50 z-50 flex justify-center items-center"
    >
      <div
        data-aos="fade-down"
        className="relative p-6 w-full max-w-md max-h-full bg-white rounded-lg shadow-sm"
      >
        <button
          type="button"
          className="absolute top-3 right-3 text-gray-400 cursor-pointer"
          onClick={onClose}
        >
          <svg
            className="w-4 h-4 cursor-pointer"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
        </button>

        <div className="text-center">
          <svg
            className="mx-auto mb-4 text-yellow-400 w-12 h-12"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.529 9.988a2.502 2.502 0 1 1 5 .191A2.441 2.441 0 0 1 12 12.582V14m-.01 3.008H12M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>

          <h3 className="mb-5 text-lg font-normal text-gray-500">
            คุณต้องการเพิ่มยุทธ์ศาสตร์ใหม่ ?
          </h3>

          <button
            onClick={onClose}
            type="button"
            className="text-white bg-blue-600 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 me-4"
          >
            เลือกจากปีก่อน
          </button>
          <button
            // onClick={onClose}
            onClick={() => onSelect("new")}
            type="button"
            className="text-white bg-orange-500 hover:bg-orange-600 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            สร้างยุทธ์ศาสตร์ใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
export function ModalAddStrategicNew({
  isOpen,
  onClose,
  onStrategicNameChange,
  yearall,

  type,
  data,
}) {
  if (!isOpen) return null;
  const [strategicName, setStrategicName] = useState({
    id: data.strategic_id,
    name: data.name,
    number: data.number,
    budget: data.budget,
    id_year: data.id_year,
  });
  const handleChange = (e) => {
    setStrategicName(e.target.value); // อัปเดตค่า NameStrategic
    onStrategicNameChange(e.target.value);
  };
  const [Oldstrategic, setoldstrategic] = useState({
    id: data.strategic_id,
    name: data.name,
    number: data.number,
    budget: data.budget,
    id_year: data.id_year,
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(type);
    Swal.fire({
      title: type == 1 ? "ยืนยันการบันทึกข้อมูล ?" : "ยืนยันการแก้ไขข้อมูล ?",
      text: strategicName ? `ชื่อยุทธ์ศาสตร์: ${strategicName.name}` : "",
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

        if (_.isEqual(Oldstrategic, strategicName)) {
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

          let response;
          if (type === 1) {
            response = await AddDataStrategic(token, strategicName);
          } else {
            console.log(strategicName);
            response = await EditDataStrategic(token, strategicName);
          }

          // if(response)
          console.log(response);
          if (response) {
            Swal.fire({
              title: "อัปเดตข้อมูลสำเร็จ",
              // text: ` ${newStatus === 1 ? "เปิดการใช้งาน" : "ปิดการใช้งาน"} ${row.departments_name}`,
              text: "ข้อมูลถูกอัปเดตในระบบแล้ว",
              icon: "success",
              confirmButtonText: "ตกลง",
              timer: 1500,
            }).then(() => {
              window.location.reload();
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
          console.log(err);
        }

        // onClose(); // ปิด modal ถ้าต้องการ
      }
    });
  };
  const yearOptions = yearall.map((item) => ({
    label: item.year.toString(), // เช่น "2568"
    value: item.year_id, // เช่น 1
  }));
  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "#f9fafb", // สีพื้นหลังที่ต้องการ
      borderColor: "#d1d5db", // สีของขอบ
      padding: "0.125rem", // ขนาด padding
      borderRadius: "0.375rem", // ขอบมุมโค้ง
      width: "100%",
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
    container: (provided) => ({
      ...provided,
      width: "100%",
    }),
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
  return (
    <div
      id="popup-modal"
      tabIndex="-1"
      className="fixed top-0 left-0  w-full h-full bg-gray-500/60 bg-opacity-50 z-50 flex justify-center items-center"
    >
      <div
        data-aos="fade-down"
        className="relative p-4 w-full max-w-xl max-h-full"
      >
        <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {type === 1 ? "เพิ่มยุทธศาสตร์ใหม่" : "แก้ไขยุทธศาสตร์"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="authentication-modal"
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          <div className="p-4 md:p-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="nameStrategic"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  ชื่อยุทธศาสตร์
                </label>
                <input
                  type="text"
                  name="nameStrategic"
                  id="nameStrategic"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="กรุณากรอกชื่อยุทธศาสตร์"
                  required
                  value={strategicName.name || ""}
                  onChange={(e) =>
                    setStrategicName({
                      ...strategicName,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-row gap-8">
                <div className="flex-1">
                  <label
                    htmlFor="numberStrategic"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    รหัสยุทธศาสตร์
                  </label>
                  <input
                    type="text"
                    name="numberStrategic"
                    id="numberStrategic"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="กรุณากรอกรหัสยุทธศาสตร์"
                    required
                    value={strategicName.number || "S"}
                    onChange={(e) => {
                      let input = e.target.value;

                      // ถ้าผู้ใช้ลบ S ออก ให้เติมกลับ แล้วเก็บเฉพาะตัวเลขหลัง S
                      if (!input.startsWith("S")) {
                        input = "S" + input.replace(/[^0-9]/g, "");
                      } else {
                        // slice(1) ตัด S ออก และ "123abc".replace(/\D/g, "") // ได้: "123" \D คือ เอาเฉพาะตัวเลข
                        const numericPart = input.slice(1).replace(/\D/g, ""); // ลบที่ไม่ใช่ตัวเลข
                        input = "S" + numericPart;
                      }
                      setStrategicName({
                        ...strategicName,
                        number: input,
                      });
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="budget"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    งบประมาณ
                  </label>
                  <input
                    type="text"
                    name="budget"
                    id="budget"
                    className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="กรุณากรอกงบประมาณ"
                    required
                    value={
                      strategicName.budget
                        ? formatDecimalWithComma(strategicName.budget)
                        : ""
                    }
                    onChange={(e) => {
                      // /g คือ global flag (แทนที่ทุกตัวที่ตรง ไม่ใช่แค่ตัวแรก)
                      const raw = e.target.value.replace(/,/g, ""); // เอา , ออกก่อน
                      // (\.\d{0,2})? → จุดและตัวเลขหลังจุดไม่เกิน 2 ตัว
                      // ? → ไม่ใส่จุดก็ได้
                      if (/^\d*(\.\d{0,2})?$/.test(raw)) {
                        // ตรวจว่าเป็นตัวเลขเท่านั้น
                        setStrategicName({
                          ...strategicName,
                          budget: raw,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              {type === 1 && (
                <div className="flex-1">
                  <label
                    htmlFor="id_year"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    ปีงบประมาณ
                  </label>
                  <Select
                    id="id_year"
                    value={yearOptions.find(
                      (option) => option.value === strategicName.id_year
                    )}
                    onChange={(e) => {
                      console.log("Selected Value:", e.value);
                      setStrategicName({
                        ...strategicName,
                        id_year: e.value,
                      });
                    }}
                    options={yearOptions}
                    styles={customStyles}
                    className="text-sm shadow-md w-full"
                    placeholder="กรุณาเลือกปีงบประมาณ"
                    instanceId="year-select"
                  />
                </div>
              )}
              <div className="flex justify-end gap-4 mt-10">
                <button
                  type="submit"
                  className="text-white bg-green-600 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                >
                  ยืนยัน
                </button>
                <button
                  onClick={onClose}
                  className="text-white bg-gray-600 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
