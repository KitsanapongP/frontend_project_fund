"use client";

import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

export default function SummarySortHeader({ column, label, sortLabel, sort, onSort, className = '', align = 'right', compact = false }) {
  const active = sort?.key === column;
  const direction = active ? sort.direction : null;
  const Icon = direction === 'asc' ? ChevronUp : direction === 'desc' ? ChevronDown : ArrowUpDown;
  return <th scope="col" aria-sort={active ? direction === 'asc' ? 'ascending' : 'descending' : 'none'} className={className}>
    <button type="button" onClick={()=>onSort(column)} aria-label={`เรียง ${sortLabel || label} ${direction === 'desc' ? 'จากน้อยไปมาก' : direction === 'asc' ? 'จากมากไปน้อย' : 'สลับลำดับ'}`} className={`inline-flex w-full items-center rounded py-1 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${compact?'gap-0.5':'gap-1'} ${align === 'left' ? 'justify-start text-left' : 'justify-end text-right'}`}>
      <span className="min-w-0">{label}</span><Icon size={compact?10:12} aria-hidden="true" className={`shrink-0 ${active ? 'text-blue-700' : 'text-blue-800'}`}/>
    </button>
  </th>;
}
