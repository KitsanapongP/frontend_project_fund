import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

import {
  AddDataYear,
  EditDatadeYear,
} from "../../../fetch_api/fetch_api_admin";
import Cookies from "js-cookie";
export function ModalAddYear({ isOpen, onClose, type, data }) {
  if (!isOpen) return null;

  const [Year, setYear] = useState(data.name);
  const [OlYear, setolddpartmentName] = useState(data.name);

  const handleSubmit = async (e) => {
    e.preventDefault();

    Swal.fire({
      title: type == 1 ? "ยืนยันการบันทึกข้อมูล ?" : "ยืนยันการแก้ไขข้อมูล ?",
      text: Year ? `ชื่อปีงบประมาณ: ${Year}` : "",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // console.log("Submitted Strategic Name: ", Year);

        // เพิ่มหรือส่งข้อมูลกลับ
        // เช่น: onSave(Year);
        if (OlYear === Year) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถแก้ไขปีงบประมาณเป็นค่าเดิมได้",
            icon: "error",
            confirmButtonText: "ตกลง",
          });
          return;
        }
        try {
          const token = Cookies.get("token");

          let response;
          if (type == 1) {
            response = await AddDataYear(token, Year);
          } else {
            // console.log(data.id)
            response = await EditDatadeYear(token, Year, data.id);
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
              {type == 1 ? "เพิ่มปีงบประมาณใหม่" : "แก้ไขปีงบประมาณ"}
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
                  ชื่อปีงบประมาณ
                </label>
                <input
                  type="text"
                  name="nameStrategic"
                  id="nameStrategic"
                  className="bg-gray-0 border  border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="กรุณากรอกชื่อปีงบประมาณ"
                  required
                  value={Year}
                  onChange={(e) => {
                    // onYearChange(e.target.value);
                    setYear(e.target.value);
                  }}
                />
              </div>
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
