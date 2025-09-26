"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Save, RefreshCw, Calendar as CalendarIcon, Clock } from "lucide-react";
import systemConfigAPI from "../../../lib/system_config_api";

/** ไทย: แปลงวันที่ ISO เป็นรูปแบบไทยอ่านง่าย (ปี พ.ศ., เดือนแบบคำ, เวลา HH:mm) */
function formatThaiFull(dtStr) {
  if (!dtStr) return "-";
  try {
    const d = new Date(dtStr);
    const fmt = new Intl.DateTimeFormat("th-TH-u-nu-latn", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return fmt.format(d);
  } catch {
    return dtStr;
  }
}

/** สำหรับ input[type=datetime-local] */
function toLocalInput(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  } catch {
    return "";
  }
}
const toISOOrNull = (s) => (s ? new Date(s).toISOString() : null);

export default function SystemConfigSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSlot, setSavingSlot] = useState(null);

  const [form, setForm] = useState({
    current_year: "",
    start_date: "",
    end_date: "",
    main_annoucement: "",
    reward_announcement: "",
    activity_support_announcement: "",
    conference_announcement: "",
    service_announcement: "",
  });

  const [windowInfo, setWindowInfo] = useState(null);
  const [annList, setAnnList] = useState([]);

  const toast = (icon, title) =>
    Swal.fire({ toast: true, position: "top-end", timer: 2400, showConfirmButton: false, icon, title });

  const slotByKey = {
    main_annoucement: "main",
    reward_announcement: "reward",
    activity_support_announcement: "activity_support",
    conference_announcement: "conference",
    service_announcement: "service",
  };

  async function loadAnnouncements() {
    try {
      const data = await systemConfigAPI.listAnnouncements();
      const items = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
      setAnnList(Array.isArray(items) ? items : []);
    } catch (e) {
      setAnnList([]);
    }
  }

  async function loadConfig() {
    try {
      const raw = await systemConfigAPI.getAdmin();
      const normalized = systemConfigAPI.normalizeWindow(raw);
      setForm((f) => ({
        ...f,
        current_year: normalized.current_year ?? "",
        start_date: normalized.start_date ? toLocalInput(normalized.start_date) : "",
        end_date: normalized.end_date ? toLocalInput(normalized.end_date) : "",
        main_annoucement: normalized.main_annoucement ?? "",
        reward_announcement: normalized.reward_announcement ?? "",
        activity_support_announcement: normalized.activity_support_announcement ?? "",
        conference_announcement: normalized.conference_announcement ?? "",
        service_announcement: normalized.service_announcement ?? "",
      }));

      const win = await systemConfigAPI.getWindow();
      setWindowInfo(win);
    } catch (e) {
      toast("error", e.message || "เกิดข้อผิดพลาดในการโหลด");
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadAnnouncements(), loadConfig()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!String(form.current_year || "").trim()) {
      toast("warning", "กรุณาระบุปีงบประมาณปัจจุบัน");
      return;
    }
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      toast("warning", "วันเปิดต้องไม่เกินวันปิด");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        current_year: String(form.current_year).trim(),
        start_date: toISOOrNull(form.start_date),
        end_date: toISOOrNull(form.end_date),
      };
      await systemConfigAPI.updateWindow(payload);
      toast("success", "บันทึกปีงบประมาณ & ช่วงเวลา สำเร็จ");
      await loadConfig();
    } catch (e) {
      toast("error", e.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnnouncement = async (valueKey) => {
    const slot = slotByKey[valueKey];
    if (!slot) {
      toast("error", "ไม่พบช่องประกาศที่ต้องการบันทึก");
      return;
    }
    const id = form[valueKey] ? Number(form[valueKey]) : null;
    setSavingSlot(valueKey);
    try {
      await systemConfigAPI.setAnnouncement(slot, id);
      toast("success", "บันทึกประกาศสำเร็จ");
      await loadConfig();
    } catch (e) {
      toast("error", e.message || "เกิดข้อผิดพลาดในการบันทึกประกาศ");
    } finally {
      setSavingSlot(null);
    }
  };

  const renderAnnSelect = (label, valueKey) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <select
          value={form[valueKey] ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [valueKey]: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600"
        >
          <option value="">— ไม่ระบุ —</option>
          {annList?.map?.((a) => (
            <option key={a.announcement_id ?? a.id} value={(a.announcement_id ?? a.id)}>
              {a.title ?? a.name ?? `ประกาศ #${a.announcement_id ?? a.id}`}
            </option>
          ))}
        </select>
        <button
          onClick={() => handleSaveAnnouncement(valueKey)}
          disabled={savingSlot === valueKey}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          title="บันทึกประกาศช่องนี้"
        >
          <Save size={16} />
          {savingSlot === valueKey ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );

  const prettyWindowRange = (() => {
    const s = form.start_date ? new Date(form.start_date).toISOString() : null;
    const e = form.end_date ? new Date(form.end_date).toISOString() : null;
    if (!s && !e) return "ไม่กำหนดช่วงเวลา (เปิดตลอด)";
    if (s && e) return `ตั้งแต่ ${formatThaiFull(s)} ถึง ${formatThaiFull(e)}`;
    if (s && !e) return `ตั้งแต่ ${formatThaiFull(s)} ถึง ไม่มีกำหนด`;
    if (!s && e) return `ตั้งแต่ ไม่มีกำหนด ถึง ${formatThaiFull(e)}`;
    return "-";
  })();

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-b border-gray-300">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ตั้งค่าระบบ</h2>
          <p className="text-sm text-gray-600">กำหนดปีงบประมาณ ช่วงเวลาเปิด–ปิด และประกาศหลักเกณฑ์</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setLoading(true);
              Promise.all([loadAnnouncements(), loadConfig()]).finally(() => setLoading(false));
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            <RefreshCw size={16} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Left: ปีงบประมาณ + Window */}
        <section className="space-y-4">
          <div className="rounded-lg border border-gray-300 p-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-base font-semibold text-gray-900 mb-0">ปีงบประมาณปัจจุบัน</label>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "กำลังบันทึก..." : "บันทึก ปีงบประมาณ & ช่วงเวลา"}
                </button>
              </div>
              <input
                type="text"
                value={form.current_year}
                onChange={(e) => setForm((f) => ({ ...f, current_year: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                placeholder="เช่น 2568"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">วัน-เวลา เปิดรับคำร้อง</label>
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-gray-500" />
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">วัน-เวลา ปิดรับคำร้อง</label>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" />
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-700 mt-4">
              ช่วงเวลาที่ตั้งค่า: <span className="font-medium">{prettyWindowRange}</span>
            </div>

            <div className="mt-3 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
              <div>สถานะโดยรวม:{" "}
                <span className={"px-2 py-0.5 rounded-full text-white " + (windowInfo?.is_open_effective ? "bg-green-600" : "bg-gray-500")}>
                  {windowInfo?.is_open_effective ? "เปิด (effective)" : "ปิด (effective)"}
                </span>
              </div>
              <div className="mt-1">เวลาระบบ: {windowInfo?.now ? formatThaiFull(windowInfo.now) : "-"}</div>
            </div>
          </div>
        </section>

        {/* Right: ประกาศที่ใช้งาน (บันทึกแยก) */}
        <section className="space-y-4">
          <div className="rounded-lg border border-gray-300 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">ประกาศที่ใช้งาน</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {renderAnnSelect("ประกาศหลักเกณฑ์การใช้จ่ายเงินกองทุน", "main_annoucement")}
              {renderAnnSelect("ประกาศขอใช้เงินกองทุนวิจัยฯ ทุนอุดหนุนกิจกรรม", "reward_announcement")}
              {renderAnnSelect("ประกาศขอใช้เงินกองทุนวิจัยฯ ทุนส่งเสริมวิจัย ", "activity_support_announcement")}
              {renderAnnSelect("ประกาศประชุมวิชาการ", "conference_announcement")}
              {renderAnnSelect("ประกาศบริการวิชาการ", "service_announcement")}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
