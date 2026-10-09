import { facultyFixtureDocuments, makeFacultyFixtureAPI } from '../scopus-faculty-insights/fixtures.mjs';

// Synthetic whole-page fixtures; never used by a live dashboard.
export function makeResearchTooltipAPIs(record) {
  const documents = facultyFixtureDocuments();
  const years = [2567, 2568, 2569];
  const history = years.map(year => {
    const docs = documents.filter(d => d.year_be === year);
    const row = { publication_year: year, unique_documents: docs.length, t1: 0, q1: 0, q2: 0, q3: 0, q4: 0, na: 0, tci: 0, journal: 0, conference: 0, cited_by_total: 0 };
    docs.forEach(d => { const tier = ['t1','q1','q2','q3','q4','na','conference'][d.document_id % 7]; row[tier]++; if(tier!=='conference') row.journal++; row.cited_by_total+=d.citations; });
    return row;
  });
  const person = [{user_id:1,user_name:'อาจารย์สมมติ ก',user_email:'fixture@example.invalid',user_scopus_id:'fixture-author',h_index:12,unique_documents:512,publication_rows:512,cited_by_total:1000,avg_cited_by:2,first_year:2567,latest_year:2569,active_years:3,journal_count:430,conference_count:82}];
  const summary = {
    kpi: {total_teachers_in_faculty:1,total_documents:512,total_cited_by:1000},
    faculty_quartile_history:history,faculty_quartile_history_fiscal:history,
    quality_breakdown:['t1','q1','q2','q3','q4','na'].map(key=>({value:key.toUpperCase(),label:key.toUpperCase(),total:history.reduce((sum,r)=>sum+r[key],0)})),
    aggregation_breakdown:[['Journal','journal'],['Conference Proceeding','conference']].map(([label,key])=>({value:label,label,total:history.reduce((sum,r)=>sum+r[key],0)})),
    person_summary:person,person_year_matrix:{years,year_start_be:2567,year_end_be:2569,rows:person.map(p=>({...p,year_counts:Object.fromEntries(history.map(r=>[r.publication_year,r.unique_documents]))}))},
    latest_scopus_pull_at:'2026-09-30T00:00:00Z',
  };
  const response = (method, data) => async query => {record(method,query);return {data};};
  return {
    api: {
      getScopusDashboardFilterOptions:response('filterOptions',{scopes:[{value:'faculty',label:'ระดับคณะ'},{value:'individual',label:'รายบุคคล'}],year_options:years.map(value=>({value,label:String(value)})),year_range:{min_be:2567,max_be:2569},aggregation_types:[],quality_buckets:[]}),
      getScopusDashboardSummary:response('legacySummary',summary),
      getScopusDashboardDrilldown:response('legacyDrilldown',{rows:[],total:0}),
    },
    facultyInsightsAPI:makeFacultyFixtureAPI('normal',record),
    hIndexAPI:{getFacultyHIndexGraph:response('hIndexGraph',{h_index:4,total_documents:6,available_year_min:2024,available_year_max:2026,available_years:[2024,2025,2026],points:[12,8,6,4,2,1].map((citations,i)=>({rank:i+1,citations,year:2024+i%3,title:`บทความสมมติ H-index ${i+1}`}))})},
  };
}
