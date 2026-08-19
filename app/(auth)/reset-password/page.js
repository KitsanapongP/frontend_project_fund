"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import AuthRecoveryShell, { AuthStatusMessage } from "@/app/components/auth/AuthRecoveryShell";
import { APIError, NetworkError, passwordAPI } from "../../lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [status, setStatus] = useState({ message: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams?.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      setStatus((current) => ({ ...current, error: "" }));
    } else {
      setStatus({ message: "", error: "ไม่พบโทเคนสำหรับตั้งรหัสผ่านใหม่ กรุณาตรวจสอบลิงก์อีกครั้ง" });
    }
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: "", error: "" });

    if (!token.trim()) {
      setStatus({ message: "", error: "ไม่พบโทเคนสำหรับตั้งรหัสผ่านใหม่ กรุณาเปิดลิงก์จากอีเมลอีกครั้ง" });
      return;
    }
    if (form.new_password.length < 8) {
      setStatus({ message: "", error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" });
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setStatus({ message: "", error: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน" });
      return;
    }

    setLoading(true);
    try {
      await passwordAPI.resetPassword({
        token: token.trim(),
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });
      setForm({ new_password: "", confirm_password: "" });
      setToken("");
      await Swal.fire({
        icon: "success",
        title: "ตั้งรหัสผ่านใหม่เรียบร้อย",
        text: "คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที",
        confirmButtonText: "กลับไปหน้าเข้าสู่ระบบ",
        confirmButtonColor: "#2563eb",
      });
      router.replace("/login");
    } catch (error) {
      let message =
        error instanceof NetworkError || error instanceof APIError
          ? error.message
          : "ไม่สามารถตั้งรหัสผ่านใหม่ได้ในขณะนี้";
      if (error instanceof APIError && error.status === 400 && /expired/i.test(error.message || "")) {
        message = "ลิงก์สำหรับตั้งรหัสผ่านนี้หมดอายุแล้ว กรุณาขอรับลิงก์ใหม่อีกครั้ง";
      }
      setStatus({ message: "", error: message });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
      <button
        type="button"
        onClick={() => router.push("/forgot-password")}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        ขอรับลิงก์ใหม่
      </button>
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        กลับไปหน้าเข้าสู่ระบบ
      </button>
    </div>
  );

  return (
    <AuthRecoveryShell
      title="ตั้งรหัสผ่านใหม่"
      description="กำหนดรหัสผ่านใหม่จากลิงก์ที่ได้รับทางอีเมล"
      footer={footer}
    >
      {status.message ? <AuthStatusMessage type="success">{status.message}</AuthStatusMessage> : null}
      {status.error ? <AuthStatusMessage>{status.error}</AuthStatusMessage> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="token" className="mb-2 block text-sm font-medium text-slate-700">โทเคนสำหรับตั้งรหัสผ่านใหม่</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              id="token"
              name="token"
              type="text"
              readOnly
              value={token}
              className="min-h-12 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 py-3 pl-11 pr-4 text-slate-600"
              placeholder="ระบบจะกรอกโทเคนอัตโนมัติจากลิงก์ที่ได้รับ"
              aria-describedby="token-help"
            />
          </div>
          <p id="token-help" className="mt-2 text-xs leading-relaxed text-slate-500">
            ระบบอ่านโทเคนจากลิงก์โดยอัตโนมัติ หากลิงก์หมดอายุโปรดขอรับลิงก์ใหม่
          </p>
        </div>

        <PasswordField
          id="new_password"
          label="รหัสผ่านใหม่"
          value={form.new_password}
          visible={showNewPassword}
          onChange={handleChange}
          onToggle={() => setShowNewPassword((current) => !current)}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm_password"
          label="ยืนยันรหัสผ่านใหม่"
          value={form.confirm_password}
          visible={showConfirmPassword}
          onChange={handleChange}
          onToggle={() => setShowConfirmPassword((current) => !current)}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading || !token}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              กำลังตั้งรหัสผ่านใหม่...
            </>
          ) : (
            <>
              <KeyRound className="h-5 w-5" aria-hidden="true" />
              ตั้งรหัสผ่านใหม่
            </>
          )}
        </button>
      </form>
    </AuthRecoveryShell>
  );
}

function PasswordField({ id, label, value, visible, onChange, onToggle, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          placeholder={`กรุณากรอก${label}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          aria-label={`${visible ? "ซ่อน" : "แสดง"}${label}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
