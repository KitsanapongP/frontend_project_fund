import ResultCard from "./ResultCard";
import { ArrowUp, ArrowDown, ArrowUpDown, SearchX, Filter, Download } from "lucide-react";

function SkeletonCard({ tab }) {
  const isStudent = tab === 'student';
  const skeletonClass = "h-5 bg-gray-200 rounded animate-pulse";

  return (
    <div className="group flex flex-col md:flex-row gap-4 p-5">
      <div className="hidden md:flex flex-col items-center justify-center w-[40px] shrink-0">
        <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="flex-1 space-y-2.5">
        <div className={`${skeletonClass} w-3/4`} />
        <div className="flex gap-1.5">
          <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
      {!isStudent && (
        <>
          <div className="flex flex-col items-center justify-center w-full md:w-[60px]">
            <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col items-center justify-center w-full md:w-[110px]">
            <div className="h-5 w-14 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col items-center justify-center w-full md:w-[90px]">
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </>
      )}
      {isStudent && (
        <>
          <div className="flex flex-col items-center justify-center w-full md:w-[180px]">
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col items-center justify-center w-full md:w-[110px]">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </>
      )}
      <div className="flex flex-col items-center justify-center w-full md:w-[110px]">
        <div className="h-5 w-14 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className={`flex flex-col items-center justify-center w-full ${isStudent ? 'md:w-[120px]' : 'md:w-[200px]'} gap-1.5`}>
        <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
        <div className="h-5 w-14 bg-gray-200 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

function EmptyState({ hasQuery }) {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
        {hasQuery ? <SearchX size={28} className="text-gray-400" /> : <Filter size={28} className="text-gray-400" />}
      </div>
      <div>
        <p className="text-base font-semibold text-gray-600">
          {hasQuery ? 'ไม่พบผลงานที่ค้นหา' : 'ยังไม่มีผลงาน'}
        </p>
        <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
          {hasQuery
            ? 'ลองเปลี่ยนคำค้นหา หรือลดจำนวนตัวกรองที่เลือกไว้'
            : 'ลองเลือกแหล่งข้อมูล หรือพิมพ์คำค้นหาเพื่อเริ่มค้นหาผลงาน'}
        </p>
      </div>
    </div>
  );
}

function SortHeader({ label, field, currentField, direction, onSort, className }) {
  const isActive = currentField === field;
  return (
    <button onClick={() => onSort(field)} className={`inline-flex items-center justify-center gap-0.5 hover:text-gray-700 transition cursor-pointer ${className || ''}`}>
      {label}
      <span className="flex flex-col leading-none">
        <ArrowUp size={8} className={isActive && direction === 'ASC' ? 'text-gray-700' : 'text-gray-300'} />
        <ArrowDown size={8} className={isActive && direction === 'DESC' ? 'text-gray-700' : 'text-gray-300'} style={{ marginTop: -1 }} />
      </span>
    </button>
  );
}

export default function ResultList({ results, total, page, onPageChange, loading, query, tab, sortField, sortDirection, onSort, onExport }) {
  const totalPages = Math.ceil(total / 10);

  const isSortActive = sortField !== 'published_at' || sortDirection !== 'DESC';

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === 'DESC') {
        onSort(field, 'ASC');
      } else {
        onSort('published_at', 'DESC');
      }
    } else {
      onSort(field, 'DESC');
    }
  };

  const clearSort = () => onSort('published_at', 'DESC');

  return (
    <div>
      <div className="mb-6 px-5 py-3 bg-gray-50 rounded-xl flex items-center justify-between">
        <span className="text-sm text-gray-600">
          พบทั้งหมด <span key={total} className="font-bold text-gray-800 animate-in">{total}</span> รายการ
          {query && <span> สำหรับ "<span className="font-medium text-gray-700">{query}</span>"</span>}
        </span>
        <div className="flex items-center gap-2">
          {isSortActive && (
            <button onClick={clearSort} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition cursor-pointer whitespace-nowrap">
              <ArrowUpDown size={12} /> ล้างการเรียง
            </button>
          )}
          <button
            onClick={onExport}
            disabled={total === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Download size={14} />
            ส่งออกเป็น CSV
          </button>
        </div>
      </div>

      <div id="result-table-header" />
      {tab === "student" ? (
        <div className="hidden md:flex px-5 py-3 gap-4 bg-gray-50/50 rounded-t-xl border-x border-t border-gray-100 text-xs font-bold text-gray-500">
          <div className="w-[40px] text-center">ลำดับ</div>
          <div className="flex-1">ชื่อเรื่อง</div>
          <div className="w-[180px] text-center">อาจารย์ที่ปรึกษา</div>
          <div className="w-[110px] text-center">
            <SortHeader label="ภาคีเคลือข่าย" field="track_id" currentField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="w-[110px] text-center">
            <SortHeader label="ปี ค.ศ. (พ.ศ.)" field="publication_year" currentField={sortField} direction={sortDirection} onSort={handleSort} onClear={clearSort} />
          </div>
          <div className="w-[120px] text-center">แหล่งที่มา</div>
        </div>
      ) : (
        <div className="hidden md:flex px-5 py-3 gap-4 bg-gray-50/50 rounded-t-xl border-x border-t border-gray-100 text-xs font-bold text-gray-500">
          <div className="w-[40px] text-center">ลำดับ</div>
          <div className="flex-1">ชื่อเรื่อง</div>
          <div className="w-[60px] text-center">
            <SortHeader label="Cited by" field="cited_by" currentField={sortField} direction={sortDirection} onSort={handleSort} onClear={clearSort} />
          </div>
          <div className="w-[110px] text-center">
            <SortHeader label="คุณภาพวารสาร" field="journal_quartile" currentField={sortField} direction={sortDirection} onSort={handleSort} onClear={clearSort} />
          </div>
          <div className="w-[90px] text-center">ประเภทผลงาน</div>
          <div className="w-[110px] text-center">
            <SortHeader label="ปี ค.ศ. (พ.ศ.)" field="publication_year" currentField={sortField} direction={sortDirection} onSort={handleSort} onClear={clearSort} />
          </div>
          <div className="w-[200px] text-center">แหล่งที่มา</div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-b-xl shadow-sm divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} tab={tab} />)
        ) : results.length === 0 ? (
          <EmptyState hasQuery={!!query} />
        ) : (
          results.map((item, idx) => <ResultCard key={item.id} item={item} tab={tab} query={query} index={(page - 1) * 10 + idx + 1} />)
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} 
            className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition">
            ก่อนหน้า
          </button>
          <span className="text-sm text-gray-500 font-medium">หน้า {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} 
            className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition">
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
