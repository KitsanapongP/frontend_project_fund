"use client";

export default function UnderDevelopmentContent({ currentPage }) {
  return (
    <div>
      <h1 className="text-3xl mb-8 text-gray-700 border-b-4 border-blue-500 pb-2">
        🚧 หน้านี้อยู่ระหว่างการพัฒนา
      </h1>
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <p className="text-lg text-gray-600">เนื้อหาของหน้า {currentPage} จะถูกเพิ่มในเร็วๆ นี้</p>
      </div>
    </div>
  );
}