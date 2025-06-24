"use client";

import { HiMenu } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";

export default function Header({ isOpen, setIsOpen, Navigation }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-50 shadow">
      <div className="flex h-20 w-full items-center justify-between">
        <div className="ml-8">
          <div className="w-40 h-12 bg-gray-50">
            <img src="/image_icon/iconcpkku.png" alt="Logo" />
          </div>
        </div>

        <div className="flex flex-row items-center">
          <div className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-400 hidden md:block"></div>
            <div className="hidden md:block md:me-6 font-medium">ชื่อผู้ใช้งาน</div>
          </div>
          <button
            type="button"
            className={`${
              !isOpen ? "block" : "hidden"
            } inline-flex items-center justify-center me-4 ms-3 p-2 w-10 h-10 text-sm text-gray-500 rounded-lg
        md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <HiMenu className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-gray-200/50 z-40"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="absolute top-0 pt-5 right-0 h-screen z-50 w-64 bg-white shadow p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-3">
                <button onClick={() => setIsOpen(false)}>
                  <RxCross2 className="w-7 h-7 text-gray-600 hover:text-red-500" />
                </button>
              </div>
              <Navigation />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}