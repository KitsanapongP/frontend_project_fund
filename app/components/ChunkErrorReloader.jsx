"use client";
import { useEffect } from "react";

// กู้สถานการณ์อัตโนมัติเมื่อเจอ ChunkLoadError หลัง deploy frontend ใหม่:
// HTML เก่า (ถูก proxy แคช) ชี้ไป chunk hash เก่าที่ถูกลบตอน build -> โหลด chunk ไม่ได้
// เมื่อจับ error ประเภทนี้ได้ ให้ reload หน้า 1 ครั้งเพื่อดึง HTML สดที่ชี้ chunk ถูกต้อง
export default function ChunkErrorReloader() {
  useEffect(() => {
    const KEY = "__chunkReloadAt";
    const reloadOnce = () => {
      const last = +sessionStorage.getItem(KEY) || 0;
      // reload ได้ครั้งเดียวใน 10 วินาที กัน loop ถ้า HTML ที่โหลดมายังเก่าอยู่
      if (Date.now() - last < 10000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
    };
    const onErr = (e) => {
      const msg = (e && (e.message || (e.reason && e.reason.message))) || "";
      if (/ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported/i.test(msg)) {
        reloadOnce();
      }
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onErr);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onErr);
    };
  }, []);
  return null;
}
