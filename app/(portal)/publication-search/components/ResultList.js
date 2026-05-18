import ResultCard from "./ResultCard";
import { ArrowUp, ArrowDown, SearchX, Filter } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-5 animate-pulse">
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-5/6" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-100 rounded" />
          <div className="h-5 w-20 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="flex flex-row md:flex-col gap-3 md:w-[60px] items-center justify-center">
        <div className="h-8 w-10 bg-gray-100 rounded" />
      </div>
      <div className="hidden md:flex flex-col items-center justify-center w-[90px]">
        <div className="h-8 w-16 bg-gray-100 rounded" />
      </div>
      <div className="hidden md:flex flex-col items-center justify-center w-[60px]">
        <div className="h-4 w-8 bg-gray-100 rounded" />
      </div>
      <div className="hidden md:flex flex-col items-center justify-center w-[90px]">
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="hidden md:flex flex-col items-center justify-center w-[110px]">
        <div className="h-8 w-20 bg-gray-100 rounded" />
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

export default function ResultList({ results, total, page, onPageChange, loading, query, tab, sortField, sortDirection, onSort }) {
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
          พบทั้งหมด <span className="font-bold text-gray-800">{total}</span> รายการ
          {query && <span> สำหรับ "<span className="font-medium text-gray-700">{query}</span>"</span>}
        </span>
        {isSortActive && (
          <button onClick={clearSort} className="text-xs text-gray-400 hover:text-red-500 transition cursor-pointer ml-auto">
            ✕ ล้างการเรียง
          </button>
        )}
      </div>

      {tab === "student" ? (
        <div className="hidden md:flex px-5 py-3 gap-4 bg-gray-50/50 rounded-t-xl border-x border-t border-gray-100 text-xs font-bold text-gray-500">
          <div className="w-[40px] text-center">ลำดับ</div>
          <div className="flex-1">เรื่อง</div>
          <div className="w-[120px] text-center">อาจารย์ที่ปรึกษา</div>
          <div className="w-[110px] text-center">
            <SortHeader label="คณะ/วิทยาลัย" field="track_id" currentField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="w-[110px] text-center">
            <SortHeader label="ปี ค.ศ. (พ.ศ.)" field="publication_year" currentField={sortField} direction={sortDirection} onSort={handleSort} onClear={clearSort} />
          </div>
          <div className="w-[90px] text-center">แหล่งที่มา</div>
          <div className="w-[110px] text-center">รายละเอียด</div>
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
          <div className="w-[90px] text-center">แหล่งที่มา</div>
          <div className="w-[110px] text-center">รายละเอียด</div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-b-xl shadow-sm divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
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
