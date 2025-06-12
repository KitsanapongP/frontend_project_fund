import React, { useState, useEffect } from "react";

import _ from "lodash";
import Swal from "sweetalert2";
// ตรวจสอบให้แน่ใจว่า export ฟังก์ชันคอมโพเนนต์ถูกต้อง
// In component/modal.js
import Select from "react-select";
import Cookies from "js-cookie";

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
            คุณต้องการเพิ่ม OKR ใหม่ ?
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
            สร้าง OKR ใหม่
          </button>
        </div>
      </div>
    </div>
  );
}