"use client";

import React, { useEffect, useState } from "react";
import { Check, FileCog, Search, X } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import { systemAPI } from "@/app/lib/api";

export const FUND_TYPE_OPTIONS = [
  {
    value: "fund_application",
    label: "ทุนทั่วไป",
    description: "ทุนส่งเสริมการวิจัยและทุนอุดหนุนกิจกรรม",
  },
  {
    value: "publication_reward",
    label: "เงินรางวัลตีพิมพ์",
    description: "เงินรางวัลและเงินสมทบผลงานเผยแพร่",
  },
];

const initialFormState = {
  document_type_name: "",
  code: "",
  required: false,
  multiple: false,
  fund_types: [],
  subcategory_scope: { mode: "all", ids: [] },
};

const DocumentTypeModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  saving = false,
}) => {
  const [formState, setFormState] = useState(initialFormState);
  const [subcategories, setSubcategories] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [scopeSearch, setScopeSearch] = useState("");
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const base = { ...initialFormState, ...(initialData || {}) };
    setFormState({
      document_type_name: base.document_type_name || "",
      code: base.code || "",
      required: Boolean(base.required),
      multiple: Boolean(base.multiple),
      fund_types:
        base.fund_type_mode === "all"
          ? FUND_TYPE_OPTIONS.map((item) => item.value)
          : base.fund_types || [],
      subcategory_scope: base.subcategory_scope || { mode: "all", ids: [] },
    });
    setSelectedYear("");
    setScopeSearch("");
    setSubcategories([]);
    setYears([]);
    setScopeLoading(true);
    setScopeError("");
    let cancelled = false;
    Promise.all([systemAPI.getSubcategories(), systemAPI.getYears()])
      .then(([funds, yearResponse]) => {
        if (cancelled) return;
        const yearList = (yearResponse?.years || [])
          .map((year) => ({
            id: Number(year.year_id),
            label: String(year.year),
          }))
          .sort((a, b) =>
            b.label.localeCompare(a.label, "th", { numeric: true })
          );
        const fundList = (funds?.subcategories || [])
          .filter((fund) => fund.form_type === "fund_application")
          .map((fund) => ({
            id: Number(fund.subcategory_id),
            yearId: Number(fund.year_id),
            name: fund.subcategory_name.trim(),
          }));
        setYears(yearList);
        setSubcategories(fundList);
        const selectedIds = base.subcategory_scope?.ids || [];
        const firstYear = yearList.find((year) =>
          fundList.some(
            (fund) => fund.yearId === year.id && selectedIds.includes(fund.id)
          )
        );
        if (firstYear) setSelectedYear(String(firstYear.id));
      })
      .catch(() => {
        if (!cancelled)
          setScopeError(
            "โหลดปีและทุนย่อยไม่สำเร็จ กรุณาปิดแล้วเปิดหน้าต่างนี้อีกครั้ง"
          );
      })
      .finally(() => {
        if (!cancelled) setScopeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialData]);

  const types = formState.fund_types;
  const enabled = types.length > 0;
  const usesGeneric = types.includes("fund_application");
  const scope = formState.subcategory_scope;
  const yearFunds = subcategories.filter(
    (fund) => fund.yearId === Number(selectedYear)
  );
  const visibleFunds = yearFunds.filter((fund) =>
    fund.name.toLowerCase().includes(scopeSearch.trim().toLowerCase())
  );
  const selectedFunds = scope.ids.map(
    (id) =>
      subcategories.find((fund) => fund.id === id) || {
        id,
        name: `ทุนที่เคยเลือก (รหัส ${id})`,
        yearId: null,
      }
  );
  const invalidScope =
    usesGeneric &&
    scope.mode !== "all" &&
    (scope.ids.length === 0 || scopeLoading || Boolean(scopeError));
  const setField = (field, value) =>
    setFormState((prev) => ({ ...prev, [field]: value }));
  const setScopeIds = (ids) =>
    setFormState((prev) => ({
      ...prev,
      subcategory_scope: { ...prev.subcategory_scope, ids },
    }));
  const toggleType = (value) =>
    setField(
      "fund_types",
      types.includes(value)
        ? types.filter((type) => type !== value)
        : [...types, value]
    );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (invalidScope) return;
    onSubmit({
      ...formState,
      document_type_name: formState.document_type_name.trim(),
      code: formState.code.trim(),
      subcategory_scope:
        scope.mode === "all" ? { mode: "all", ids: [] } : scope,
    });
  };

  return (
    <SettingsModal
      open={isOpen}
      onClose={onClose}
      size="2xl"
      bodyClassName="max-h-[72vh] overflow-y-auto px-5 py-5 sm:px-6"
      headerContent={
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <FileCog size={22} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {initialData ? "ตั้งค่าเอกสารแนบ" : "เพิ่มเอกสารแนบ"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              กำหนดการใช้งาน แล้วเลือกปีและทุนที่ต้องใช้เอกสาร
            </p>
          </div>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-700"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="document-type-settings"
            disabled={saving || invalidScope}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "กำลังบันทึก..."
              : enabled
              ? "บันทึกการตั้งค่า"
              : "บันทึกเป็นปิดใช้งาน"}
          </button>
        </>
      }
    >
      <form
        id="document-type-settings"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
            enabled
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div>
            <p
              className={`font-semibold ${
                enabled ? "text-emerald-800" : "text-amber-900"
              }`}
            >
              {enabled ? "เปิดใช้งานเอกสารนี้" : "เอกสารนี้ยังปิดใช้งาน"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {enabled
                ? "เอกสารจะแสดงตามประเภททุนและขอบเขตที่ตั้งไว้ด้านล่าง"
                : "แม้เลือกทุนไว้ เอกสารก็จะไม่แสดงจนกว่าจะเปิดใช้งาน"}
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              setField("fund_types", enabled ? [] : ["fund_application"])
            }
            className="rounded-lg border border-current bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {enabled ? "ปิดใช้งาน" : "เปิดใช้กับทุนทั่วไป"}
          </button>
        </div>

        <section className="space-y-3">
          <h3 className="font-semibold text-slate-900">ข้อมูลเอกสาร</h3>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <label className="text-sm text-slate-700">
              ชื่อเอกสาร
              <input
                required
                value={formState.document_type_name}
                onChange={(e) => setField("document_type_name", e.target.value)}
                disabled={saving}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                placeholder="ระบุชื่อเอกสาร"
              />
            </label>
            <label className="text-sm text-slate-700">
              รหัสเอกสาร
              <input
                required
                value={formState.code}
                onChange={(e) => setField("code", e.target.value)}
                disabled={saving}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formState.required}
                onChange={(e) => setField("required", e.target.checked)}
                disabled={saving}
              />
              จำเป็นต้องแนบเอกสาร
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formState.multiple}
                onChange={(e) => setField("multiple", e.target.checked)}
                disabled={saving}
              />
              อนุญาตหลายไฟล์
            </label>
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-5">
          <h3 className="font-semibold text-slate-900">ประเภททุนที่ใช้งาน</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FUND_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                  types.includes(option.value)
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={types.includes(option.value)}
                  onChange={() => toggleType(option.value)}
                  disabled={saving}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-5">
          <div>
            <h3 className="font-semibold text-slate-900">เลือกปีและทุนย่อย</h3>
            <p className="mt-1 text-sm text-slate-500">
              สำหรับทุนทั่วไปเท่านั้น เงินรางวัลตีพิมพ์ใช้รายการเอกสารร่วมกัน
            </p>
          </div>
          {!usesGeneric ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              เลือกประเภท “ทุนทั่วไป” ด้านบนเพื่อกำหนดปีและทุนย่อย
              ขอบเขตที่เคยเลือกจะยังเก็บไว้
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-slate-700">
                ใช้เอกสารกับทุนใด
                <select
                  aria-label="ขอบเขตทุนย่อย"
                  value={scope.mode}
                  onChange={(e) =>
                    setField("subcategory_scope", {
                      ...scope,
                      mode: e.target.value,
                    })
                  }
                  disabled={saving}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="all">ทุกทุนย่อย ทุกปีงบประมาณ</option>
                  <option value="include">เฉพาะทุนย่อยที่เลือก</option>
                  <option value="exclude">
                    ทุกทุนย่อย ยกเว้นรายการที่เลือก
                  </option>
                </select>
              </label>
              {scope.mode !== "all" && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-semibold text-slate-800">
                      1. เลือกปีงบประมาณ
                      <select
                        aria-label="ปีงบประมาณ"
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(e.target.value);
                          setScopeSearch("");
                        }}
                        disabled={scopeLoading || saving}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                      >
                        <option value="">เลือกปีงบประมาณ</option>
                        {years.map((year) => (
                          <option key={year.id} value={year.id}>
                            {year.label}
                            {selectedFunds.some(
                              (fund) => fund.yearId === year.id
                            )
                              ? ` — เลือกไว้ ${
                                  selectedFunds.filter(
                                    (fund) => fund.yearId === year.id
                                  ).length
                                } ทุน`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      เปลี่ยนปีเพื่อเลือกเพิ่มได้ รายการของปีอื่นจะไม่ถูกล้าง
                    </p>
                  </div>
                  {scopeLoading && (
                    <p className="text-sm text-slate-500">
                      กำลังโหลดปีและทุนย่อย...
                    </p>
                  )}
                  {scopeError && (
                    <p role="alert" className="text-sm text-red-600">
                      {scopeError}
                    </p>
                  )}
                  {selectedYear && !scopeLoading && !scopeError && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">
                          2. เลือกทุนในปี{" "}
                          {
                            years.find(
                              (year) => String(year.id) === selectedYear
                            )?.label
                          }
                        </p>
                        <button
                          type="button"
                          disabled={saving || !yearFunds.length}
                          onClick={() =>
                            setScopeIds([
                              ...new Set([
                                ...scope.ids,
                                ...yearFunds.map((fund) => fund.id),
                              ]),
                            ])
                          }
                          className="text-xs font-medium text-blue-700"
                        >
                          เลือกทั้งปี
                        </button>
                      </div>
                      <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
                        <Search size={16} className="text-slate-400" />
                        <input
                          aria-label="ค้นหาทุนในปีที่เลือก"
                          type="search"
                          value={scopeSearch}
                          onChange={(e) => setScopeSearch(e.target.value)}
                          placeholder="ค้นหาชื่อทุน เช่น 2.9"
                          className="w-full bg-transparent text-sm outline-none"
                        />
                      </label>
                      <div className="max-h-60 space-y-2 overflow-y-auto">
                        {visibleFunds.length ? (
                          visibleFunds.map((fund) => (
                            <label
                              key={fund.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                                scope.ids.includes(fund.id)
                                  ? "border-blue-300 bg-blue-50 text-blue-900"
                                  : "border-slate-200 text-slate-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={scope.ids.includes(fund.id)}
                                onChange={(e) =>
                                  setScopeIds(
                                    e.target.checked
                                      ? [...scope.ids, fund.id]
                                      : scope.ids.filter((id) => id !== fund.id)
                                  )
                                }
                                disabled={saving}
                                className="mt-1"
                              />
                              <span className="leading-relaxed">
                                {fund.name}
                              </span>
                            </label>
                          ))
                        ) : (
                          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                            ไม่พบทุนทั่วไปในรายการนี้
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                      <Check size={16} />
                      {scope.mode === "include"
                        ? "ใช้เฉพาะรายการต่อไปนี้"
                        : "ไม่ใช้กับรายการต่อไปนี้"}{" "}
                      ({scope.ids.length} ทุน)
                    </p>
                    {selectedFunds.length ? (
                      selectedFunds.map((fund) => (
                        <div
                          key={fund.id}
                          className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 text-sm"
                        >
                          <span>
                            <span className="mb-1 block text-xs font-semibold text-blue-600">
                              {fund.yearId
                                ? `ปี ${
                                    years.find(
                                      (year) => year.id === fund.yearId
                                    )?.label || fund.yearId
                                  }`
                                : "รายการเดิม"}
                            </span>
                            <span className="text-slate-700">{fund.name}</span>
                          </span>
                          <button
                            type="button"
                            aria-label={`นำ ${fund.name} ออกจากรายการที่เลือก`}
                            onClick={() =>
                              setScopeIds(
                                scope.ids.filter((id) => id !== fund.id)
                              )
                            }
                            disabled={saving}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-amber-800">
                        ยังไม่ได้เลือกทุน กรุณาเลือกปีและทุนอย่างน้อย 1 รายการ
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </form>
    </SettingsModal>
  );
};

export default DocumentTypeModal;
