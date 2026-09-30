"use client";

import { useState } from 'react';
import Hint from './report/Hint';
import SummarySortHeader from './report/SummarySortHeader';
import { CountButton, ReportPanel } from './report/SummaryReportPrimitives';
import { nextSummarySort, sortSummaryRows, qualityLabel, summaryHints, presentationRows, hasNonJournalTypes } from '@/app/lib/scopus_benchmark_summary.mjs';

const pct=value=>value==null?'—':`${Number(value).toFixed(1)}%`;
const cell='border-b border-slate-200 px-3 py-2.5 text-sm';
const ratioHint={title:'สัดส่วนระหว่างระดับ',lines:['KKU / Thailand = ผลงาน KKU ÷ ผลงาน Thailand × 100','COC / Thailand = ผลงาน COC ÷ ผลงาน Thailand × 100','COC / KKU = ผลงาน COC ÷ ผลงาน KKU × 100','ใช้ยอดหลังกรองเดียวกัน ตัวหารเป็นศูนย์แสดงขีด (—)']};
const stageHint={title:'ผลกระทบจากการกรอง',lines:['เริ่มจากผลงานไม่ซ้ำในฐาน Thailand ภายในช่วงปีที่เลือก','ใช้ตัวกรองสะสมตามลำดับ: ประเภทผลงาน → Category → Confidence','% คงเหลือ = ยอดในขั้นนั้น ÷ ยอดก่อนกรองของระดับเดียวกัน × 100 ไม่หารด้วยขั้นก่อนหน้า','ยอดสุดท้ายตรงกับตารางรายปี Category และ Quartile; ตัวกรองที่เลือกทั้งหมดอาจทำให้ยอดบางขั้นไม่เปลี่ยน']};

function ComparisonTable({title,rows,total,kind,onDetail}) {
  const [sort,setSort]=useState(null);
  const firstKey=kind==='year'?'year':kind==='quartile'?'quartile':'label';
  const firstLabel=kind==='year'?'ปี ค.ศ.':kind==='quartile'?'Quartile':'Category';
  const mapped=presentationRows(rows);
  const displayed=[...sortSummaryRows(mapped,sort),...presentationRows(total?[total]:[])];
  const headers=[['thailand','Thailand'],['kku','KKU'],['coc','COC'],['kku_pct',<>KKU /<br/>Thailand</>],['coc_thailand_pct',<>COC /<br/>Thailand</>],['coc_pct',<>COC /<br/>KKU</>]];
  return <ReportPanel title={title} hint={kind==='quartile'?[summaryHints.quartile,summaryHints.missingQuartile,summaryHints.notApplicable,ratioHint]:[summaryHints.thailand,summaryHints.kku,summaryHints.coc,ratioHint]} className="h-full">
    <div className="overflow-x-auto"><table className={`w-full border-collapse ${kind==='category'?'min-w-[660px]':'min-w-[600px]'}`}>
      <thead className="bg-blue-100 text-blue-900"><tr>
        <SummarySortHeader column={firstKey} label={firstLabel} sort={sort} onSort={key=>setSort(current=>nextSummarySort(current,key))} align="left" className={`${cell} text-left ${kind==='category'?'w-[36%]':''}`}/>
        {headers.map(([key,label])=><SummarySortHeader key={key} column={key} label={label} sortLabel={key==='kku_pct'?'KKU / Thailand':key==='coc_thailand_pct'?'COC / Thailand':key==='coc_pct'?'COC / KKU':label} sort={sort} onSort={key=>setSort(current=>nextSummarySort(current,key))} className={`${cell} text-right`}/>)}
      </tr></thead>
      <tbody>{displayed.map((row,index)=>{
        const isTotal=!!total&&index===displayed.length-1;
        const label=isTotal?row.label:kind==='quartile'?qualityLabel[row.quartile]:row.label;
        const query=isTotal?{}:kind==='year'?{year:row.year}:kind==='category'?{document_category:row.category_id||0}:{quartile:row.quartile};
        return <tr key={isTotal?'total':`${row.year||0}:${row.category_id||0}:${row.quartile||''}`} className={`${isTotal?'bg-blue-50 font-semibold':index%2?'bg-slate-50':'bg-white'} hover:bg-blue-50`}>
          <th scope="row" className={`${cell} text-left ${isTotal?'font-semibold':'font-normal'}`}>{label}</th>
          {['thailand','kku','coc'].map(level=><td key={level} className={`${cell} text-right tabular-nums`}><CountButton value={row[level]} onClick={()=>onDetail({level,...query},`${title} · ${label}`)}/></td>)}
          {['kku_pct','coc_thailand_pct','coc_pct'].map(key=><td key={key} className={`${cell} text-right tabular-nums`}>{pct(row[key])}</td>)}
        </tr>;
      })}</tbody>
    </table></div>
  </ReportPanel>;
}

export default function ScopusBenchmarkPresentation({data,onDetail}) {
  const {presentation}=data;
  if(!presentation)return <p role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">ยังโหลดสรุปเปรียบเทียบไม่ได้ กรุณาอัปเดตรายงาน</p>;
  const before=presentation.steps[0];
  const total=presentationRows([data.total])[0];
  const headline=[['Thailand ก่อนกรอง',before?.thailand,{level:'thailand',...stageQuery(before)}],['Thailand หลังกรอง',total.thailand,{level:'thailand'}],['KKU หลังกรอง',total.kku,{level:'kku'}],['COC หลังกรอง',total.coc,{level:'coc'}]];
  return <div className="space-y-4">
    <section aria-label="ยอดสรุปเปรียบเทียบ" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <dl className="grid grid-cols-2 divide-x divide-slate-200 md:grid-cols-4 xl:grid-cols-7">
        {headline.map(([label,value,query])=><div key={label} className="min-w-0 px-4 py-4"><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums"><CountButton value={value} onClick={()=>onDetail(query,label)}/></dd></div>)}
        {[['KKU / Thailand',total.kku_pct],['COC / Thailand',total.coc_thailand_pct],['COC / KKU',total.coc_pct]].map(([label,value])=><div key={label} className="min-w-0 px-4 py-4"><dt className="inline-flex items-center gap-1 text-xs text-slate-600">{label}<Hint label={label} text={ratioHint}/></dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{pct(value)}</dd></div>)}
      </dl>
    </section>
    <div className="summary-paired-grid grid gap-4">
      <ReportPanel title="ผลกระทบจากการกรอง" hint={stageHint} className="h-full">
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse">
          <thead className="bg-blue-100 text-blue-900"><tr><th scope="col" className={`${cell} text-left`}>ขั้นตอน</th>{['Thailand','KKU','COC'].map(level=><th scope="col" key={level} className={`${cell} text-right`}>{level}</th>)}{['Thailand','KKU','COC'].map(level=><th scope="col" key={`${level}-retained`} className={`${cell} text-right`}>{level}<span className="block text-xs font-normal">% คงเหลือ</span></th>)}</tr></thead>
          <tbody>{presentation.steps.map((step,index)=><tr key={step.key} className={index===3?'bg-blue-50 font-semibold':index%2?'bg-slate-50':'bg-white'}><th scope="row" className={`${cell} text-left ${index===3?'font-semibold':'font-normal'}`}>{step.label}</th>{['thailand','kku','coc'].map(level=><td key={level} className={`${cell} text-right tabular-nums`}><CountButton value={step[level]} onClick={()=>onDetail({level,...stageQuery(step)},step.label)}/></td>)}{['thailand','kku','coc'].map(level=><td key={`${level}-retained`} className={`${cell} text-right tabular-nums`}>{pct(step[`${level}_retained`])}</td>)}</tr>)}</tbody>
        </table></div>
      </ReportPanel>
      <ComparisonTable title="จำนวนผลงานตามปี" rows={data.yearly} total={data.total} kind="year" onDetail={onDetail}/>
    </div>
    <div className="grid gap-4">
      <ComparisonTable title="Category รวมช่วงปี" rows={presentation.categories} total={data.total} kind="category" onDetail={onDetail}/>
      <ComparisonTable title="Quartile รวมช่วงปี" rows={presentation.quartiles.filter(row=>row.quartile!=='not_applicable'||hasNonJournalTypes(data.applied_filters.types.join(',')))} total={data.total} kind="quartile" onDetail={onDetail}/>
    </div>
    <style jsx>{`
      @container scopus-summary (min-width: 1000px) {
        .summary-paired-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
    `}</style>
  </div>;
}

function stageQuery(step) {
  if(!step)return {};
  return {...step.filters,types:step.filters.types.join(','),confidence:step.filters.confidence.join(','),report_view:''};
}
