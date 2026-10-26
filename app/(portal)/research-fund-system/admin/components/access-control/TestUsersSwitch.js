"use client";

export default function TestUsersSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-11 shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${checked
        ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
        : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"}`}
    >
      <span aria-hidden="true" className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${checked ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-slate-200"}`}>
        <span className={`absolute left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
      <span>Test User</span>
    </button>
  );
}
