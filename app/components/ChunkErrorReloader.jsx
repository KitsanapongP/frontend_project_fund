"use client";
import { useEffect } from "react";

// กู้สถานการณ์อัตโนมัติเมื่อเจอ ChunkLoadError หลัง deploy frontend ใหม่:
// HTML เก่า (ถูก proxy แคช) ชี้ไป chunk hash เก่าที่ถูกลบตอน build -> โหลด chunk ไม่ได้
// เมื่อจับ error ประเภทนี้ได้ ให้ reload หน้า 1 ครั้งเพื่อดึง HTML สดที่ชี้ chunk ถูกต้อง
export default function ChunkErrorReloader() {
  useEffect(() => {
    // หลังกู้สำเร็จ (โหลดหน้าใหม่ผ่าน ?cb= มาแล้ว) ลบ cb ทิ้งจาก URL ให้สะอาด
    // ใช้ replaceState = แก้แถบ URL เฉย ๆ ไม่ reload ไม่ยิง request ใหม่
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("cb")) {
        url.searchParams.delete("cb");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    }

    const KEY = "__chunkReloadAt";
    const reloadOnce = () => {
      const last = +sessionStorage.getItem(KEY) || 0;
      // reload ได้ครั้งเดียวใน 10 วินาที กัน loop ถ้า HTML ที่โหลดมายังเก่าอยู่
      if (Date.now() - last < 10000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
      // เติม/แทนที่ ?cb=<timestamp> เพื่อ "cache bust" -> reverse proxy เห็นเป็น URL ใหม่
      // เลยหา HTML เก่าที่แคชไว้มาเสิร์ฟไม่ได้ ต้องไปดึงของสดจาก origin (ที่ชี้ chunk ถูก)
      // query param เดิม (เช่น ?page=researchFund) ยังอยู่ครบ แค่เพิ่ม/ทับ cb ตัวเดียว
      const url = new URL(window.location.href);
      url.searchParams.set("cb", String(Date.now()));
      window.location.replace(url.toString());
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
