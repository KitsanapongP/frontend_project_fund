"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import Menu from "../../component/nav";
import Header from "../../component/header";

export default function addProject() {
  return (
    <>
      <div className="">
        <Header />
        <hr />
        <div className="grid grid-cols-10 gap-4 w-full min-h-screen mt-20">
          <div className="bg-gray-100 col-span-2 xl:col-span-2 hidden md:block md:col-span-2 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-10 xl:col-span-8  md:col-span-8  mt-5 md:mt-3 ms-8 md:ms-0 me-8">
            <div className="flex flex-row items-center justify-between">
              <div className="text-lg md:text-2xl">
                แบบฟอร์มโครงการตามแผนปฏิบัติการ
              </div>
            </div>
            <div className="grid grid-cols-8 gap-x-8 gap-y-6 mt-3">
              <div className="col-span-8 md:col-span-4">
                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  ชื่อโครงการ
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
              <div className="col-span-8 md:col-span-4">
                <div className="flex flex-col ">
                  <div className="flex flex-row justify-between mb-2">
                    <h2>วัตถุประสงค์ </h2>
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
              <div className="col-span-8 md:col-span-4">
                <div className="flex flex-col ">
                  <div className="flex flex-row justify-between mb-2">
                    <h2>ระยะเวลาดำเนินการ </h2>
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
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Select date start"
                        />
                      </div>
                      <span className="mx-8 text-gray-500">to</span>
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
                          className="bg-gray-50  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Select date end"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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

              <div className="col-span-8 md:col-span-4">
                <div className="flex flex-col ">
                  <div className="flex flex-row justify-between mb-2">
                    <h2>
                      ปัญหาอุปสรรค
                      และแนวทางการปรับปรุงการดำเนินงานในรอบปีที่ผ่านมา{" "}
                    </h2>
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
