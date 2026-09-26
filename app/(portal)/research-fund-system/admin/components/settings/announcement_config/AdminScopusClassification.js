"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scopusClassificationAPI as api } from "@/app/lib/scopus_classification_api";

const sources = [
  { key: "benchmark", label: "ข้อมูลบทความระดับประเทศ", table: "scopus_benchmark_documents" },
  { key: "faculty", label: "ข้อมูลบทความของคณะ", table: "scopus_documents" },
];
const statusLabel = { running: "กำลังดำเนินการ", completed: "เสร็จสิ้น", stopped: "หยุดแล้ว", interrupted: "ขัดจังหวะ", pending: "รอดำเนินการ", processing: "กำลังจัดหมวด", preface: "รอตรวจสอบ", failed: "ไม่สำเร็จ" };

export default function AdminScopusClassification() {
  const [source, setSource] = useState("benchmark");
  const [year, setYear] = useState("");
  const [yearOptions, setYearOptions] = useState([]);
  const [scope, setScope] = useState("unprocessed");
  const [preview, setPreview] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const refreshId = useRef(0);
  const [runs, setRuns] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [itemPage, setItemPage] = useState(1);
  const [itemTotal, setItemTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const requestId = ++refreshId.current;
    try {
      const [runResponse, previewResponse] = await Promise.all([
        api.listRuns(),
        api.preview({ source, scope, page: previewPage, ...(year ? { year } : {}) }),
      ]);
      if (requestId !== refreshId.current) return;
      setError("");
      setRuns(runResponse.runs || []);
      setPreview(previewResponse);
      if (selectedId) {
        const [run, itemResponse] = await Promise.all([
          api.getRun(selectedId), api.listItems(selectedId, { page: itemPage }),
        ]);
        if (requestId === refreshId.current) {
          setSelected(run);
          setItems(itemResponse.items || []);
          setItemTotal(itemResponse.total || 0);
        }
      }
    } catch (cause) { if (requestId === refreshId.current) setError(cause.message || "ไม่สามารถโหลดข้อมูลการจัดหมวดได้"); }
  }, [source, scope, year, previewPage, selectedId, itemPage]);

  useEffect(() => {
    let current = true;
    setYearOptions([]);
    api.years({ source }).then((response) => {
      if (current) setYearOptions(response.years || []);
    }).catch((cause) => {
      if (current) setError(cause.message || "ไม่สามารถโหลดปีที่เผยแพร่ได้");
    });
    return () => { current = false; };
  }, [source]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function act(action) {
    setBusy(true); setError("");
    try {
      const result = await action();
      if (result?.run_id) { setSelectedId(result.run_id); setItemPage(1); }
      await refresh();
    } catch (cause) { setError(cause.message || "ดำเนินการไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  const active = runs.some((run) => run.status === "running");
  const processed = selected ? selected.completed + selected.failed : 0;
  const percentage = selected?.total ? Math.round(processed / selected.total * 100) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="จัดหมวดบทความด้วย AI">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">จัดหมวดบทความด้วย AI</h2>
        <p className="mt-1 text-sm text-slate-600">ใช้ชื่อบทความ บทคัดย่อ และคำสำคัญจาก Scopus เพื่อจัดหมวดข้อมูลแต่ละชุดแยกกัน ผลที่จัดหมวดไม่ได้จะแสดงเป็น “รอตรวจสอบ”</p>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="ชุดข้อมูล Scopus">
        {sources.map((option) => <button key={option.key} type="button" role="tab" aria-selected={source === option.key} onClick={() => { setSource(option.key); setYear(""); setPreviewPage(1); setPreview(null); }} className={`rounded-lg border px-4 py-2 text-sm ${source === option.key ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-300 text-slate-700"}`}>{option.label}</button>)}
      </div>
      <p className="mt-2 text-xs text-slate-500">ตาราง {sources.find((option) => option.key === source)?.table}</p>
      <div className="mt-5 flex flex-wrap items-end gap-4">
        <label className="text-sm text-slate-700">ปีที่เผยแพร่
          <select value={year} onChange={(event) => { setYear(event.target.value); setPreviewPage(1); setPreview(null); }} className="mt-1 block w-44 rounded-lg border border-slate-300 px-3 py-2">
            <option value="">ทุกปี</option>
            {yearOptions.map((option) => <option key={option.year} value={option.year}>{option.year}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-700">ขอบเขต
          <select value={scope} onChange={(event) => { setScope(event.target.value); setPreviewPage(1); setPreview(null); }} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2">
            <option value="unprocessed">เฉพาะรายการที่ยังไม่จัดหมวด</option>
            <option value="all">จัดหมวดใหม่ทุกรายการในขอบเขต</option>
          </select>
        </label>
        <button type="button" onClick={refresh} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">รีเฟรชรายการ</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className="text-sm text-slate-700">รายการที่จะจัดหมวด: <strong>{preview?.count ?? "–"}</strong></p>
        <button type="button" disabled={busy || active || !preview?.count} onClick={() => act(() => api.start({ source, scope, year: year ? Number(year) : null }))} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">เริ่มจัดหมวด</button>
      </div>
      {scope === "all" && <p className="mt-2 text-sm text-amber-700">การจัดหมวดใหม่จะแทนผลล่าสุด รวมถึงรายการที่ได้ผล “รอตรวจสอบ” โดยเก็บผลเดิมไว้ในประวัติงาน</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-900">บทความที่จะจัดหมวด</h3>
          <span className="text-sm text-slate-600">{year || "ทุกปี"} · {preview?.count ?? "–"} รายการ</span>
        </div>
        {preview && preview.documents?.length > 0 ? <>
          <ul className="divide-y divide-slate-100">
            {preview.documents.map((document) => <li key={document.id} className="px-4 py-3 text-sm">
              <span className="mr-2 text-slate-500">#{document.id}</span>
              <span className="font-medium text-slate-900">{document.title?.trim() || "ไม่มีชื่อบทความ"}</span>
              {document.doi && <span className="mt-1 block break-all text-xs text-slate-500">DOI: {document.doi}</span>}
            </li>)}
          </ul>
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3 text-sm">
            <button type="button" disabled={previewPage <= 1} onClick={() => { setPreviewPage((page) => page - 1); setPreview(null); }} className="rounded border px-3 py-1 disabled:opacity-50">ก่อนหน้า</button>
            <span>หน้า {previewPage} / {Math.max(1, Math.ceil(preview.count / preview.page_size))}</span>
            <button type="button" disabled={previewPage * preview.page_size >= preview.count} onClick={() => { setPreviewPage((page) => page + 1); setPreview(null); }} className="rounded border px-3 py-1 disabled:opacity-50">ถัดไป</button>
          </div>
        </> : <p className="px-4 py-5 text-sm text-slate-500">{preview ? "ไม่มีบทความในขอบเขตที่เลือก" : "กำลังโหลดรายชื่อบทความ..."}</p>}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold text-slate-900">ประวัติงานจัดหมวด</h3>
          <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-slate-200">
            {runs.length === 0 && <p className="p-4 text-sm text-slate-500">ยังไม่มีงานจัดหมวด</p>}
            {runs.map((run) => <button type="button" key={run.run_id} onClick={() => { setSelectedId(run.run_id); setItemPage(1); }} className={`block w-full border-b border-slate-100 p-3 text-left text-sm hover:bg-slate-50 ${selectedId === run.run_id ? "bg-blue-50" : ""}`}>
              <span className="font-medium">{sources.find((option) => option.key === run.source)?.label} · {run.publication_year || "ทุกปี"}</span>
              <span className="ml-2 text-slate-600">{statusLabel[run.status] || run.status} · {run.completed + run.failed}/{run.total}</span>
              <span className="block text-xs text-slate-500">{new Date(run.created_at).toLocaleString("th-TH")}</span>
            </button>)}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">รายละเอียดงาน</h3>
          {selected ? <div className="mt-2 rounded-lg border border-slate-200 p-4 text-sm">
            <p>{statusLabel[selected.status] || selected.status} · ดำเนินการ {processed}/{selected.total} รายการ ({percentage}%)</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${percentage}%` }} /></div>
            <p className="mt-2 text-slate-600">จัดหมวดได้ {selected.completed - selected.preface} · รอตรวจสอบ {selected.preface} · ไม่สำเร็จ {selected.failed}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selected.status === "running" && <button type="button" disabled={busy} onClick={() => act(() => api.stop(selected.run_id))} className="rounded-lg border border-amber-500 px-3 py-1.5 text-amber-800 disabled:opacity-50">หยุดหลังรายการปัจจุบัน</button>}
              {["stopped", "interrupted"].includes(selected.status) && <button type="button" disabled={busy || active} onClick={() => act(() => api.resume(selected.run_id))} className="rounded-lg border border-blue-500 px-3 py-1.5 text-blue-800 disabled:opacity-50">ดำเนินการต่อ</button>}
              {selected.failed > 0 && selected.status !== "running" && <button type="button" disabled={busy || active} onClick={() => act(() => api.retryFailed(selected.run_id))} className="rounded-lg border border-slate-400 px-3 py-1.5 disabled:opacity-50">ลองรายการที่ไม่สำเร็จอีกครั้ง</button>}
            </div>
          </div> : <p className="mt-2 text-sm text-slate-500">เลือกงานเพื่อดูผลรายบทความ</p>}
        </div>
      </div>
      {selected && <div className="mt-6 overflow-x-auto">
        <h3 className="mb-2 font-semibold text-slate-900">ผลรายบทความ</h3>
        <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-2">ID</th><th className="p-2">ชื่อบทความ</th><th className="p-2">สถานะ</th><th className="p-2">รายละเอียด</th></tr></thead><tbody>
          {items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-2">{item.document_id}</td><td className="max-w-md p-2">{item.title_snapshot || "ไม่มีชื่อบทความ"}</td><td className="p-2">{statusLabel[item.status] || item.status}</td><td className="max-w-sm break-words p-2 text-slate-600">{item.error_message || (item.result_json ? (() => { try { const result = JSON.parse(item.result_json); return `${result.primary_category_code || "–"} · ${result.confidence || "–"}`; } catch { return "–"; } })() : "–")}</td></tr>)}
        </tbody></table>
        <div className="mt-3 flex items-center gap-3 text-sm"><button type="button" disabled={itemPage <= 1} onClick={() => setItemPage((page) => page - 1)} className="rounded border px-3 py-1 disabled:opacity-50">ก่อนหน้า</button><span>หน้า {itemPage} / {Math.max(1, Math.ceil(itemTotal / 50))}</span><button type="button" disabled={itemPage * 50 >= itemTotal} onClick={() => setItemPage((page) => page + 1)} className="rounded border px-3 py-1 disabled:opacity-50">ถัดไป</button></div>
      </div>}
    </section>
  );
}
