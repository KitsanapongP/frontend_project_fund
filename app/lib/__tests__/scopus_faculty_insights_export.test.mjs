import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFacultyInsightSheets } from '../scopus_faculty_insights_export.mjs';
import { makeFacultyFixtureSummary } from '../../dev/scopus-faculty-insights/fixtures.mjs';
import { buildXlsxBinary } from '../../(portal)/research-fund-system/admin/utils/xlsxExporter.js';

const now = new Date('2026-10-24T04:00:00Z');
const rows = sheet => [sheet.columns.map(c => c.header), ...sheet.rows.map(r => sheet.columns.map(c => r[c.key]))];
const files = binary => {
  const out = {}, view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength), decoder = new TextDecoder();
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true), nameLength = view.getUint16(offset + 26, true), extraLength = view.getUint16(offset + 28, true);
    const start = offset + 30 + nameLength + extraLength;
    out[decoder.decode(binary.slice(offset + 30, offset + 30 + nameLength))] = decoder.decode(binary.slice(start, start + size));
    offset = start + size;
  }
  return out;
};

test('exports the three cards from the filtered snapshot, including every partner and undated row', () => {
  const query = { year_start_be: '2569', year_end_be: '2569', aggregation_types: 'Journal', search_title: '=1+1' };
  const summary = makeFacultyFixtureSummary(query);
  const sheets = buildFacultyInsightSheets(summary, { query, now });
  assert.equal(sheets.length, 3);
  assert.equal(new Set(sheets.map(s => s.name)).size, 3);
  sheets.forEach(s => { assert.ok(s.name.length <= 31); assert.match(JSON.stringify(s), /ปีเริ่มต้น \(พ.ศ.\): 2569/); });
  const roleTotal = rows(sheets[0]).find(r => r[0] === 'รวมตามเงื่อนไขที่เลือก');
  assert.equal(roleTotal[1], summary.totals.total);
  assert.equal(roleTotal[2] + roleTotal[4] + roleTotal[6] + roleTotal[8], roleTotal[1]);
  assert.ok(rows(sheets[0]).some(r => r[0] === 'ไม่ระบุปี'));
  const countries = rows(sheets[1]);
  summary.totals.partners.forEach(p => {
    assert.deepEqual(countries.find(r => r[0] === p.country_name).slice(0, 3), [p.country_name, p.documents, {value:p.percent_international / 100, format:'percent'}]);
  });
});

test('independent local year selections export the selected donut and cross-tab, keeping yearly tables intact', () => {
  const summary = makeFacultyFixtureSummary();
  const sheets = buildFacultyInsightSheets(summary, { roleYear: '2567', comparisonYear: '2569', now });
  const roleRows = rows(sheets[0]), comparisonRows = rows(sheets[2]);
  const roleYear = summary.by_year.find(y => y.bucket === '2567'), crossYear = summary.by_year.find(y => y.bucket === '2569');
  assert.equal(roleRows.find(r => r[0] === 'รวม')[1], roleYear.total);
  assert.equal(roleRows.find(r => r[0] === 'รวมตามเงื่อนไขที่เลือก')[1], summary.totals.total);
  const international = comparisonRows.find(r => r[0] === 'ร่วมกับต่างประเทศ');
  assert.equal(international[9], crossYear.international.yes);
  assert.equal(international[1], crossYear.country_role.yes.first);
  assert.ok(Math.abs(international[2].value - crossYear.country_role.yes.first / crossYear.international.yes) < 1e-12);
  assert.equal(comparisonRows.find(r => r[0] === 'รวม')[9], crossYear.total);
  assert.match(JSON.stringify(comparisonRows), /ข้อมูลกราฟและตารางไขว้ · 2569/);
});

test('empty denominators stay unavailable; unknown country/role and zero counts are preserved', () => {
  const sheets = buildFacultyInsightSheets(makeFacultyFixtureSummary({}, 'empty'), { now });
  assert.equal(rows(sheets[0]).find(r => r[0] === 'รวม')[2], '—');
  assert.equal(rows(sheets[2]).find(r => r[0] === 'ยังระบุประเทศไม่ได้')[1], 0);
  assert.equal(rows(sheets[2]).find(r => r[0] === 'ยังระบุประเทศไม่ได้')[2], '—');
  assert.match(JSON.stringify(sheets[1]), /ไม่พบประเทศคู่ความร่วมมือ/);
  const unknown = buildFacultyInsightSheets(makeFacultyFixtureSummary({}, 'unknown'), {now});
  assert.equal(rows(unknown[2]).find(r => r[0] === 'ภายในประเทศ')[9], 0);
  assert.equal(rows(unknown[2]).find(r => r[0] === 'ยังระบุประเทศไม่ได้')[9], 39);
  const undated = buildFacultyInsightSheets(makeFacultyFixtureSummary(), {roleYear:'undated',comparisonYear:'undated',now});
  assert.match(JSON.stringify(undated[0]), /ข้อมูลกราฟบทบาท · ไม่ระบุปี/);
  assert.equal(rows(undated[0]).find(r=>r[0]==='รวม')[1], 7);
  assert.throws(() => buildFacultyInsightSheets(null));
});

test('downloaded workbook format has three named worksheets, styles, widths, frozen rows, percentages and safe literal text', () => {
  const sheets = buildFacultyInsightSheets(makeFacultyFixtureSummary(), {query:{search_title:'=1+1 & <text>'},now});
  const output = files(buildXlsxBinary([], [], { sheets }));
  assert.equal(Object.keys(output).filter(p => /^xl\/worksheets\/sheet\d.xml$/.test(p)).length, 3);
  sheets.forEach((s, i) => {
    assert.ok(output['xl/workbook.xml'].includes(s.name));
    const xml = output[`xl/worksheets/sheet${i + 1}.xml`];
    assert.match(xml, /state="frozen"/); assert.match(xml, /<cols>/); assert.match(xml, /<mergeCell /);
    assert.match(xml, /s="3"/); assert.match(xml, /s="5"/); assert.match(xml, /s="6"/);
    assert.match(xml, /=1\+1 &amp; &lt;text&gt;/); assert.doesNotMatch(xml, /<f[ >]/);
  });
  assert.match(output['xl/styles.xml'], /formatCode="0.0%"/);
  assert.match(output['xl/worksheets/sheet1.xml'], /s="7"><v>/);
  const legacy = files(buildXlsxBinary([{key:'link',header:'เอกสาร'}], [{link:{text:'เปิดเอกสาร',hyperlink:'https://example.com'}}]));
  assert.match(legacy['xl/worksheets/sheet1.xml'], /s="1" t="inlineStr"/);
  assert.match(legacy['xl/worksheets/_rels/sheet1.xml.rels'], /https:\/\/example.com/);
  assert.doesNotMatch(legacy['xl/worksheets/sheet1.xml'], /state="frozen"/);
});
