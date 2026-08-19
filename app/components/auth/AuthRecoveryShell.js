import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthStatusMessage({ type = "error", children }) {
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const classes = isSuccess
    ? "border-green-200 bg-green-50 text-green-800"
    : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 text-sm leading-relaxed ${classes}`} role={isSuccess ? "status" : "alert"}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export default function AuthRecoveryShell({ title, description, children, footer }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 sm:px-6">
      <section className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="auth-recovery-title">
        <header className="border-b border-blue-100 bg-blue-50 px-6 py-7 text-center sm:px-8">
          <div className="flex items-center justify-center gap-5">
            <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="กลับหน้าหลัก">
              <Image
                src="/image_icon/iconcpkku.png"
                alt="วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น"
                width={150}
                height={72}
                className="h-14 w-auto object-contain"
                priority
              />
            </Link>
            <span className="h-12 w-px bg-blue-200" aria-hidden="true" />
            <Image
              src="/image_icon/fund_cpkku_logo.png"
              alt="ระบบกองทุนวิจัย"
              width={72}
              height={72}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <h1 id="auth-recovery-title" className="mt-5 text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-blue-950/80">{description}</p>
        </header>

        <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">{children}</div>
        {footer ? <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">{footer}</footer> : null}
      </section>
    </main>
  );
}
