"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#7F77DD] transition cursor-pointer">
      <ArrowLeft size={16} /> กลับไปหน้าค้นหา
    </button>
  );
}
