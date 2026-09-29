export function makeSummaryFixtureAPI(scenario) {
  const fixture=(p={})=>{
    const filters={year_from:2025,year_to:2026,types:['Journal'],category:'classified',confidence:['High','Medium','Preface','unknown'],quartile_mode:'t1',...p};
    const partial=scenario==='partial';
    const row=(label,year,thailand,kku,coc,extra={})=>({label,year,thailand,kku,coc,kku_pct:thailand?kku/thailand*100:null,coc_pct:kku?coc/kku*100:null,...extra});
    const yearly=[row('2025',2025,partial?null:100,partial?null:50,partial?null:20),row('2026',2026,100,50,20)];
    const total=row('รวมจากปีที่มีข้อมูล',0,partial?100:200,partial?50:100,partial?20:40);
    const categoryName='AI Algorithms and Intelligent Systems';
    const categories=yearly.map(r=>({...r,label:categoryName,category_id:1}));
    const quartiles=(filters.quartile_mode==='t1'?['T1','Q1','Q2','Q3','Q4','missing','not_applicable']:['Q1','Q2','Q3','Q4','missing','not_applicable']).map((q,i)=>row(categoryName,0,q==='T1'?40:q==='Q1'?(filters.quartile_mode==='t1'?60:100):q==='Q2'?100:0,q==='T1'?20:q==='Q1'?(filters.quartile_mode==='t1'?30:50):q==='Q2'?50:0,q==='T1'?8:q==='Q1'?(filters.quartile_mode==='t1'?12:20):q==='Q2'?20:0,{category_id:1,quartile:q}));
    const year_states=[{year:2025,status:partial?'missing':'available',observed:partial?0:100,expected:100},{year:2026,status:'partial',observed:100,expected:110}];
    const coverage={base_documents:partial?100:200,classified:partial?100:200,selected:partial?100:200,affiliation_incomplete:10,faculty_affiliation_incomplete:4,role_unknown_pairs:5,metric_fallback:120,missing_quartile:0,faculty_without_id:1};
    const faculty=[{user_id:1,name:'อาจารย์ตัวอย่าง ก',scopus_id:'111',linkable:true,total:25,first:10,corresponding:12,lead:16,co:8,unknown:1,first_pct:40,corresponding_pct:48,lead_pct:64,co_pct:32,unknown_pct:4},{user_id:2,name:'อาจารย์ตัวอย่าง ข',scopus_id:'222',linkable:true,total:25,first:0,corresponding:4,lead:4,co:17,unknown:4,first_pct:0,corresponding_pct:16,lead_pct:16,co_pct:68,unknown_pct:16},{user_id:3,name:'อาจารย์ไม่มีผลงาน',scopus_id:'333',linkable:true,total:0,first:0,corresponding:0,lead:0,co:0,unknown:0},{user_id:4,name:'อาจารย์ไม่มี Scopus ID',scopus_id:'',linkable:false,total:0,first:0,corresponding:0,lead:0,co:0,unknown:0}];
    return {applied_filters:filters,generated_at:'2026-09-30T00:00:00Z',revision:'fixture-revision',year_states,yearly,categories,quartiles,total,coverage,faculty,faculty_roles:{total:40,first:10,corresponding:16,lead:20,co:15,unknown:5}};
  };
  const response=(p)=>{if(scenario==='error')return Promise.reject(new Error('จำลอง API ผิดพลาด'));return Promise.resolve({data:fixture(p)})};
  return {
    summaryOptions:async()=>({data:{years:[2025,2026],types:['Journal','Conference Proceeding'],categories:[{id:1,name:'AI Algorithms and Intelligent Systems'}]}}),
    summary:response,summaryFaculty:response,
    summaryDocuments:async(p)=>({data:{...fixture(p),page:p.page,page_size:50,total:51,documents:[{eid:`fixture-${p.page}`,title:'ตัวอย่างผลงานสำหรับตรวจผู้เขียนทุกคน',year:2026,type:'Journal',category_id:1,category_name:'AI Algorithms and Intelligent Systems',confidence:'High',publication_name:'Fixture Journal',afids:['60017165'],affiliations_complete:true,quartile:'T1',metric_year:2025,metric_fallback:true,authors:[{seq:1,scopus_author_id:'outside',name:'ผู้เขียนนอกคณะ',role_status:'complete',first:true,corresponding:true,afids:['other'],affiliations_complete:true,eligible_user_ids:[]},{seq:2,scopus_author_id:'111',name:'อาจารย์ตัวอย่าง ก',role_status:'complete',first:false,corresponding:false,afids:['60017165'],affiliations_complete:true,eligible_user_ids:[1]}]}]}}),
    summaryExport:async()=>{const e=new Error(scenario==='revision'?'ข้อมูลเปลี่ยนแล้ว กรุณาอัปเดตรายงานก่อนส่งออก Excel':'หน้าทดสอบไม่สร้างไฟล์จริง ตรวจ XLSX จาก backend tests');e.status=scenario==='revision'?409:400;throw e},
  };
}
