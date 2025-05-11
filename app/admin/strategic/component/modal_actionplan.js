import React, { useState, useEffect } from "react";

// ตรวจสอบให้แน่ใจว่า export ฟังก์ชันคอมโพเนนต์ถูกต้อง
// In component/modal.js
import Select from "react-select";

export function ModalAddActionplan({ isOpen, onClose, onSelect }) {
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
            คุณต้องการเพิ่มกลยุทธ์ใหม่ ?
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
            สร้างกลยุทธ์ใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
export function ModalAddActionplanNew({
  isOpen,
  onClose,
  selectedOption,
  handleChange,
  onActionplanNameChange,
  options,
}) {
  if (!isOpen) return null;

  const [actionplanName,setActionplanName] = useState("")
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
      backgroundColor: state.isSelected ? "#4caf50" : "#ffffff", // สีเมื่อเลือก option
      color: state.isSelected ? "#ffffff" : "#333333", // สีตัวอักษรเมื่อเลือก
      padding: "0.5rem", // ขนาด padding ของแต่ละ option
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af", // สีของ placeholder
    }),
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // ทำสิ่งที่ต้องการเมื่อ submit form เช่น ส่งค่ากลับไปให้ parent หรือ api
    console.log("Submitted Strategic Name: ", actionplanName);
    // onClose() // ถ้าต้องการปิด modal หลังจาก submit
  };
  return (
    <div
      id="popup-modal"
      tabIndex="-1"
      className="fixed top-0 left-0 w-full h-full bg-gray-500/60 bg-opacity-50 z-50 flex justify-center items-center"
    >
      <div
        data-aos="fade-down"
        className="relative p-4 w-full max-w-md max-h-full"
      >
        <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              เพิ่มกลยุทธ์ใหม่
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
                  ชื่อกลยุทธ์
                </label>
                <input
                  type="text"
                  name="nameStrategic"
                  id="nameStrategic"
                  className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="กรุณากรอกชื่อยุทธศาสตร์"
                  required
                  value={actionplanName}
                    onChange={(e)=>{
                        onActionplanNameChange(e.target.value)
                        setActionplanName(e.target.value)
                    }}
                />
              </div>
              <div>
                <label
                  htmlFor="nameStrategic"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  ยุทธศาสตร์
                </label>
                <Select
                  value={selectedOption} // กำหนดค่าให้กับ Select
                  onChange={handleChange} // เมื่อมีการเลือก
                  options={options} // ตัวเลือกทั้งหมด
                  styles={customStyles}
                  className="text-sm"
                  placeholder="กรุณาเลือกยุทธศาสตร์" // ข้อความ placeholder
                />
              </div>

              <button
                type="submit"
                className="w-full text-white bg-green-600 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              >
                เพิ่มกลยุทธ์
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
