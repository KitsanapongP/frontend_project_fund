// components/settings/StatusBadge.js
import React from "react";
import Swal from "sweetalert2";
import { ToggleRight, ToggleLeft } from "lucide-react";

/**
 * StatusBadge (v2)
 * - รองรับ status เป็น boolean หรือ "active"/"inactive"
 * - interactive: เปิดให้กดสลับสถานะ (default: false)
 * - confirm: ให้ badge ยืนยันเองก่อนเรียก onChange (default: false)
 * - onChange(next) : callback เมื่อยืนยันจะเปลี่ยนสถานะ
 * - activeLabel / inactiveLabel: ปรับข้อความได้
 * - disabled: ปิดการกด
 */
const StatusBadge = ({
  status,
  interactive = false,
  confirm = false,
  onChange,
  activeLabel = "เปิดใช้งาน",
  inactiveLabel = "ปิดใช้งาน",
  className = "",
  disabled = false,
}) => {
  // แปลงค่าให้เป็น boolean
  const isActive =
    typeof status === "boolean"
      ? status
      : String(status || "").toLowerCase() === "active";

  const baseClass =
    `inline-flex items-center rounded-md border text-xs font-medium ${interactive ? "min-h-11 px-3 py-2" : "px-2.5 py-1"} ` +
    (isActive
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-slate-200 bg-slate-100 text-slate-600");

  const handleClick = async () => {
    if (!interactive || disabled || !onChange) return;

    const next = !isActive;

    if (confirm) {
      const res = await Swal.fire({
        title: "ยืนยันการเปลี่ยนสถานะ?",
        text: `ต้องการ${next ? "เปิด" : "ปิด"}การใช้งานรายการนี้หรือไม่?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
          popup: "rounded-xl",
          title: "text-xl font-semibold text-slate-900",
          htmlContainer: "text-sm text-slate-600",
          actions: "gap-2",
          confirmButton: "min-h-11 rounded-lg bg-blue-600 px-5 font-medium text-white hover:bg-blue-700",
          cancelButton: "min-h-11 rounded-lg border border-slate-300 bg-white px-5 font-medium text-slate-700 hover:bg-slate-50",
        },
      });
      if (!res.isConfirmed) return;
    }

    try {
      await onChange(next);
    } catch (error) {
      console.error("Error changing status:", error);
      // แสดง error message
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถเปลี่ยนสถานะได้',
      });
    }
  };

  const content = (
    <>
      {isActive ? (
        <>
          <ToggleRight size={14} className="mr-1" />
          {activeLabel}
        </>
      ) : (
        <>
          <ToggleLeft size={14} className="mr-1" />
          {inactiveLabel}
        </>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${baseClass} ${className} ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"} `}
        disabled={disabled}
        title={isActive ? inactiveLabel : activeLabel}
      >
        {content}
      </button>
    );
  }

  return <span className={`${baseClass} ${className}`}>{content}</span>;
};

export default StatusBadge;
