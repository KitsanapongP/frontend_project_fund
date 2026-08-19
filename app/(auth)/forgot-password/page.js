"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthRecoveryShell, { AuthStatusMessage } from "@/app/components/auth/AuthRecoveryShell";
import { APIError, NetworkError, passwordAPI } from "../../lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ message: "", error: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sanitizedEmail = email.trim();
    if (!sanitizedEmail) {
      setStatus({ message: "", error: "กรุณากรอกอีเมลที่ใช้ลงทะเบียน" });
      return;
    }

    setLoading(true);
    setStatus({ message: "", error: "" });
    try {
      await passwordAPI.requestReset({ email: sanitizedEmail });
      setStatus({
        message: "หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ",
        error: "",
      });
    } catch (error) {
      const message =
        error instanceof NetworkError || error instanceof APIError
          ? error.message
          : "ไม่สามารถส่งคำขอได้ในขณะนี้";
      setStatus({ message: "", error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthRecoveryShell
      title="ลืมรหัสผ่าน"
      description="กรอกอีเมลที่ใช้กับระบบเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่"
      footer={(
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mx-auto flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      )}
    >
      {status.message ? <AuthStatusMessage type="success">{status.message}</AuthStatusMessage> : null}
      {status.error ? <AuthStatusMessage>{status.error}</AuthStatusMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">อีเมล</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="กรุณากรอกอีเมล"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              กำลังส่งคำขอ...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" aria-hidden="true" />
              ส่งลิงก์ตั้งรหัสผ่านใหม่
            </>
          )}
        </button>
      </form>
    </AuthRecoveryShell>
  );
}
