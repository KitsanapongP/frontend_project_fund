"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import Menu from "../../../component/nav";
import Header from "../../../component/header";

export default function addProject() {
  const [objectives, setObjectives] = useState([""]);

  const handleAdd = () => {
    setObjectives([...objectives, ""]);
  };

  const handleRemove = (index) => {
    const updated = [...objectives];
    updated.splice(index, 1);
    setObjectives(updated);
  };

  const handleChange = (index, value) => {
    const updated = [...objectives];
    updated[index] = value;
    setObjectives(updated);
  };
  return (
    <>
      <div className="">
        <Header />
        <hr />
        <div className="grid grid-cols-12  gap-0 w-full min-h-screen mt-20">
          <div className="bg-gray-100  xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-12 xl:col-span-10  md:col-span-9 mt-5 ms-4 md:mt-3 me-4 md:me-6">
            <div className="flex flex-row items-center justify-between">
              <div className="text-lg md:text-2xl">
                รายละเอียดกิจกรรมตามแผนปฏิบัติการ
              </div>
            </div>
            <div className="grid grid-cols-8 gap-x-8 gap-y-6 mt-3">
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ชื่อกิจกรรม
                </span>
                <input
                  type="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@flowbite.com"
                  required
                />
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  รหัสโครงการ
                </span>
                <input
                  type="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@flowbite.com"
                  readOnly
                  value={"CP1-1-1"}
                />
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  หน่วยงาน
                </span>
                <input
                  type="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@flowbite.com"
                  required
                />
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ลักษณะโครงการ
                </span>

                <div className="flex flex-row justify-start items-center">
                  <div className="flex items-center">
                    <input
                      id="default-checkbox"
                      type="checkbox"
                      value=""
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="default-checkbox"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      งานประจำ
                    </label>
                  </div>

                  <div className="ms-8 flex items-center">
                    <input
                      id="default-checkbox"
                      type="checkbox"
                      value=""
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="default-checkbox"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      งานเชิงยุทธศาสตร์
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-span-8 mt-4">
                <hr className="text-gray-200" />
              </div>
              <div className="col-span-8">
                <h2>ความสอดคล้องกับประเด็นยุทธศาสตร์</h2>
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ประเด็นยุทธศาสตร์ที่
                </span>

                <select
                  id="countries"
                  className="bg-gray-50  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option defaultValue>Choose a country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  กลยุทธ์ที่
                </span>
                <select
                  id="countries"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option defaultValue>Choose a country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <div className="col-span-8 md:col-span-4">
                <div className="flex flex-col ">
                  <div className="flex flex-row justify-between mb-2">
                    <h2>OKR </h2>
                    <button
                      type="button"
                      className=" top-9 right-2 bg-blue-500 text-white text-sm px-4 py-1 rounded-lg hover:bg-blue-600"
                    >
                      เพิ่ม
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="objective"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="OKR"
                      readOnly
                    />
                    <button
                      type="button"
                      className="absolute top-1.5 right-2 bg-blue-500 text-white text-sm px-4 py-1 rounded-lg hover:bg-blue-600"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-span-8 mt-4">
                <hr className="text-gray-200" />
              </div>
              <div className="col-span-8">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ตอบสนองตามหลักธรรมาภิบาล (สามารถระบุได้มากกว่า 1)
                </span>

                <div className="flex flex-row justify-start items-center">
                  <div className="flex items-center">
                    <input
                      id="default-checkbox"
                      type="checkbox"
                      value=""
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="default-checkbox"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      การมีส่วนร่วม
                    </label>
                  </div>

                  <div className="ms-8 flex items-center">
                    <input
                      id="default-checkbox"
                      type="checkbox"
                      value=""
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="default-checkbox"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      ความโปร่งใส
                    </label>
                  </div>
                </div>
              </div>
              <div className="col-span-8 mt-4">
                <hr className="text-gray-200" />
              </div>
              <div className="col-span-8 ">
                <label
                  htmlFor="message"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  หลักการและเหตุผล
                </label>
                <textarea
                  id="message"
                  rows="4"
                  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Write your thoughts here..."
                ></textarea>
              </div>
              <div className="col-span-8 ">
                <label
                  htmlFor="message"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  สถานที่
                </label>
                <textarea
                  id="message"
                  rows="4"
                  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Write your thoughts here..."
                ></textarea>
              </div>
              <div className="col-span-8 mt-4">
                <hr className="text-gray-200" />
              </div>
              <div className="col-span-8">
                <div className="flex flex-col ">
                  <div className="flex flex-row justify-between mb-2">
                    <h2>ตัวชี้วัด </h2>
                    <button
                      type="button"
                      className=" top-9 right-2 bg-blue-500 text-white text-sm px-4 py-1 rounded-lg hover:bg-blue-600"
                    >
                      เพิ่ม
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="objective"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="กรอกวัตถุประสงค์"
                      readOnly
                    />
                    <button
                      type="button"
                      className="absolute top-1.5 right-2 bg-blue-500 text-white text-sm px-4 py-1 rounded-lg hover:bg-blue-600"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-span-8 mt-4">
                <hr className="text-gray-200" />
              </div>
              <div className="col-span-8 md:col-span-4">
                <div className="flex flex-col ">
                  <div className="flex flex-row justify-between mb-2">
                    <h2>ผลที่คาดว่าจะได้รับ </h2>
                    <button
                      type="button"
                      onClick={handleAdd}
                      className=" top-9 right-2 bg-blue-500 text-white text-sm px-4 py-1 rounded-lg hover:bg-blue-600"
                    >
                      เพิ่ม
                    </button>
                  </div>

                  {objectives.map((value, index) => (
                    <div className="relative mb-2" key={index}>
                      <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-20 p-2.5"
                        placeholder="กรอกวัตถุประสงค์"
                        value={value}
                        onChange={(e) => handleChange(index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="absolute top-1.5 right-2 bg-red-500 text-white text-sm px-4 py-1 rounded-lg hover:bg-red-600"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-8 mt-4 flex flex-row justify-end">
                <button
                  type="button"
                  className="bg-blue-500 text-white text-sm px-4 py-1 rounded-lg hover:bg-blue-600"
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
