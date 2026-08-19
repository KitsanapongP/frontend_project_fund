"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Home, LogOut, ShieldX } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleGoToLogin = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleGoHome = () => {
    router.replace("/");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 sm:px-6">
      <section
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white"
        aria-labelledby="unauthorized-title"
      >
        <header className="border-b border-red-200 bg-red-50 px-6 py-7 text-center sm:px-8 sm:py-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700">
            <ShieldX className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 id="unauthorized-title" className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-red-900 sm:text-base">
            บัญชีนี้ไม่มีสิทธิ์เปิดหน้าที่ร้องขอ
          </p>
        </header>

        <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p className="font-medium text-amber-950">ตรวจสอบบัญชีหรือสิทธิ์การใช้งาน</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                ลองกลับหน้าหลักเพื่อเลือกเมนูที่ใช้งานได้ หรือติดต่อผู้ดูแลระบบหากคุณควรมีสิทธิ์ในหน้านี้
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleGoHome}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            >
              <Home className="h-5 w-5" aria-hidden="true" />
              กลับหน้าหลัก
            </button>

            <button
              type="button"
              onClick={handleGoToLogin}
              disabled={isLoggingOut}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingOut ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-200 border-t-red-700" aria-hidden="true" />
                  กำลังออกจากระบบ...
                </>
              ) : (
                <>
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                  ออกจากระบบ
                </>
              )}
            </button>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-xs leading-relaxed text-slate-600 sm:px-8">
          การกลับหน้าหลักจะไม่เปลี่ยนสิทธิ์ของบัญชี หากต้องการเปลี่ยนบัญชีให้เลือก “ออกจากระบบ”
        </footer>
      </section>
    </main>
  );
}
