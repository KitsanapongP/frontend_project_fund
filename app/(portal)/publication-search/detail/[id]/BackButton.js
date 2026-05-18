"use client";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#7F77DD] transition cursor-pointer">
      <ArrowLeft size={16} /> กลับไปหน้าค้นหา
    </button>
  );
}
