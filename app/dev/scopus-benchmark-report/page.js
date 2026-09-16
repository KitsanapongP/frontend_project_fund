"use client";

// DEV-ONLY harness: renders the REAL executive report component with clearly
// labelled FIXTURE data (no live API, no auth) so layout / responsive / print /
// state handling can be reviewed. Never linked from the app. Numbers are invented.
// The fixture builders live in ./fixtures.mjs (pure JS) so this harness and the
// evidence generator (scripts/gen-scopus-benchmark-evidence.mjs) share ONE dataset.
import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import ScopusBenchmarkDashboard from "../../(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard";
import { buildApi, SCENARIOS } from "./fixtures.mjs";

function initialScenario() {
  if (typeof window === "undefined") return "normal";
  const value = new URLSearchParams(window.location.search).get("scenario");
  return SCENARIOS.some(([key]) => key === value) ? value : "normal";
}

export default function DevScopusBenchmarkReport() {
  const [scenario, setScenario] = useState(initialScenario);
  const api = useMemo(() => buildApi(scenario), [scenario]);

  // Harness-only: ?open=1 expands the optional <details> so the print appendix
  // (break-before: page) can be captured. Not part of the report component.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("open") !== "1") return;
    const timer = setTimeout(() => {
      document.querySelectorAll("#scopus-report-root details").forEach((element) => {
        element.open = true;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [scenario]);
  // Dev-only harness: never reachable in a production build even if shipped.
  if (process.env.NODE_ENV === "production") return notFound();

  return (
    <div style={{ background: "#f5f7fb", minHeight: "100vh", padding: 24 }}>
      <div className="no-print" style={{ maxWidth: 1280, margin: "0 auto 16px" }}>
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e", marginBottom: 12 }}>
          หน้านี้เป็น <b>harness สำหรับตรวจเลย์เอาต์เท่านั้น</b> · ข้อมูลทั้งหมดเป็น <b>ตัวเลขสมมติ (fixture)</b> ไม่ใช่ข้อมูลจริง · ใช้ component จริงของรายงาน
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SCENARIOS.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setScenario(key)}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: scenario === key ? "#2563eb" : "#fff", color: scenario === key ? "#fff" : "#334155", fontSize: 13, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <ScopusBenchmarkDashboard key={scenario} api={api} onGoSetup={() => {}} />
      </div>
    </div>
  );
}
