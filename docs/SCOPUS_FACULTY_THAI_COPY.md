# Faculty insights — Thai editorial and accessibility polish

The three faculty cards now use natural Thai descriptions and short, organised explanations with narrow bold emphasis. Default donut centers say **ผลงานทั้งหมด**. The redundant center note and visible click-instruction footer are removed. Percentage explanations name the actual total for each graph, including the foreign and domestic groups, while retaining the accessible denominator description.

## Review state

- Date: 2026-10-06, Bangkok.
- Frontend base: `e04b29f`, branch `codex/faculty-research-insights`. Changes remain uncommitted.
- Backend working tree is clean. No backend/schema/database change, harvest, commit, push or deployment in this round.
- The user's running frontend and backend were not stopped or restarted. Their serving `.next` directory was not cleared or used for worker preview/build output.

## Copy and semantics

All nine hint groups were reviewed: scope, international groups, partner countries, author roles, role year, comparison year, donut reading/selection, country/role cross-table and search.

- Roles lead with **หนึ่งผลงานนับครั้งเดียว**, even with several faculty authors or affiliations. A verified faculty First author takes priority. Corresponding and Co-author require complete, consistent role information and no higher-priority faculty role. The priority prevents duplicate counts and does not rank authors' importance.
- Incomplete or conflicting role information remains unknown when a faculty First author cannot be verified. It is not automatically Co-author. The explanations use the latest verified information and distinguish absence of corresponding-author evidence from proof that no corresponding author exists.
- Foreign collaboration requires at least one verified foreign affiliation. Domestic classification requires complete country information and no foreign affiliation. Incomplete/unverified information is not silently treated as domestic. A single author with faculty and foreign affiliations can establish international collaboration.
- Row percentages include unknown groups in the row's total. Each comparison donut uses its own group total. Partner-country percentages use international papers only. Partner counts overlap across countries, and bar lengths are relative to the largest country's count rather than directly representing percentages.
- Scope and year descriptions distinguish applied dashboard conditions from local chart-year selection, including undated papers. Search still covers the complete clicked group before paging, preserves its conditions, starts at page one when searching/clearing, and does not change summary totals.
- User-facing XML/status codes, flag terminology, draft/revision jargon and semicolons are removed from the hints. Paper details show a natural Thai role-check status rather than raw status codes. Displayed Thailand country names become **ประเทศไทย** without altering their keys or membership.

Visible chart copy now reads:

| Chart | Percentage explanation |
| --- | --- |
| Faculty roles | `ร้อยละคิดจากผลงานทั้งหมด N ผลงาน` |
| International | `ร้อยละคิดจากผลงานที่ร่วมกับต่างประเทศทั้งหมด N ผลงาน` |
| Domestic | `ร้อยละคิดจากผลงานภายในประเทศทั้งหมด N ผลงาน` |

The denominator keeps its ID and remains referenced by both segment and legend controls. Selection, repeat-click reset, hover/focus preview, count/percentage calculations, palette, keyboard halo and drilldown requests are unchanged. Click instructions remain inside the donut tooltip.

The shared `Hint` accepts structured text fragments for narrow `<strong>` emphasis through normal React text rendering. It does not parse HTML or use `dangerouslySetInnerHTML`. Existing Benchmark plain-string paragraphs and structured sections with string bullets retain their rendering and accessibility.

## Changed files

Paths are frontend-relative.

| File | Purpose |
| --- | --- |
| `app/lib/scopus_faculty_insight_hints.mjs` | Rewrite every faculty hint group with clear Thai and safe emphasis fragments |
| `app/(portal)/research-fund-system/admin/components/research/AdminScopusFacultyInsights.js` | Natural descriptions/condition labels, contextual graph denominators, Thai country/status presentation |
| `app/(portal)/research-fund-system/admin/components/research/FacultyRoleDonut.js` | Total center label, remove redundant notes/footer, accessible contextual denominator |
| `app/(portal)/research-fund-system/admin/components/research/report/Hint.js` | Safe inline emphasis, preserving legacy string callers |
| `scripts/check-faculty-insights-thai-copy.mjs` | New desktop/mobile hint/copy/accessibility and Benchmark compatibility checks |
| `scripts/check-faculty-insights-compact-ui.mjs`, `scripts/check-faculty-insights-ui.mjs`, `scripts/check-faculty-insights-refinement-ui.mjs` | Match approved new labels and explanations in existing regressions |
| `scripts/check-faculty-native-ui.mjs` | Keep future native harness labels compatible, not run against a database this round |
| `scripts/prepare-faculty-copy-preview.mjs` | Reproducible isolated source snapshot with separate cache and existing dependencies |
| This report and `docs/faculty-thai-copy-evidence/` | Current review evidence, preserving prior-round artifacts |

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Full frontend unit suite | **94 passed**, zero failed/skipped | [Unit output](faculty-thai-copy-evidence/unit-tests.txt) |
| Thai copy/Hint checks | **9 passed**, zero page errors | [Results](faculty-thai-copy-evidence/copy/browser-checks.json) |
| Compact chart/selection regressions | **12 passed**, zero page errors | [Results](faculty-thai-copy-evidence/compact-regression/browser-checks.json) |
| Existing faculty regressions | **15 passed**, zero page errors | [Results](faculty-thai-copy-evidence/faculty-regression/browser-checks.json) |
| Existing search/modal/Hint regressions | **8 passed**, zero page errors | [Results](faculty-thai-copy-evidence/refinement-regression/browser-checks.json) |
| Isolated full application production build | **Passed** compilation, type/lint checks and static generation | [Build output](faculty-thai-copy-evidence/production-build.txt) |
| `git diff --check` | **Passed** | No whitespace/conflict-marker errors |

The **44 browser checks** use installed Chrome, loopback synthetic fixtures and blocked backend/non-loopback browser requests. Every visible faculty hint was opened on desktop and mobile and checked for bounded wrapping, safe emphasis and plain Thai. Checks also cover accessible graph denominators, total-label fit, unchanged counts/percentages, independent local years, selection without extra API/modal, keyboard/touch, table/country drilldowns, paging/search beyond 200, recovery/errors and both legacy Benchmark Hint text formats. These are UI regression checks, not a new live backend or shared-data E2E run.

## Isolation and reproduction

`node scripts/prepare-faculty-copy-preview.mjs` copies application/public source and project configuration into `G:\works-fund-project\.scopus-thai-copy-preview-e04b29f`. It reuses the installed dependencies through a junction and does **not** copy `.env` or the serving `.next` directory. The helper refuses an existing non-empty directory without its ownership marker.

The worker preview used port **3116** and only the isolated copy's `.next`. Source/config hashes were checked against the edited originals before the production build. The preview was stopped after browser verification. Production compilation ran in the same isolated directory with its own output. The source snapshot and build cache are retained for reproducibility. No serving application process or cache was stopped, cleared or repurposed. Because deployment environment files were deliberately excluded, the build validates the full source with the project's configuration and default environment values, not a deployment against the user's live settings.

Browser scripts accept `SCOPUS_UI_ORIGIN=http://127.0.0.1:3116`, the existing `SCOPUS_UI_PLAYWRIGHT_PATH`, and `SCOPUS_UI_EVIDENCE_DIR` to keep results separate from accepted evidence.

## Screenshots

- [Desktop cards](faculty-thai-copy-evidence/copy/desktop.png)
- [Desktop author-role explanation](faculty-thai-copy-evidence/copy/desktop-role-hint.png)
- [Desktop international explanation](faculty-thai-copy-evidence/copy/desktop-international-hint.png)
- [Desktop country overlap and percentages](faculty-thai-copy-evidence/copy/desktop-partners-hint.png)
- [Desktop country/role comparison explanation](faculty-thai-copy-evidence/copy/desktop-cross-hint.png)
- [Mobile cards](faculty-thai-copy-evidence/copy/mobile.png)
- [Mobile role rules](faculty-thai-copy-evidence/copy/mobile-role-hint.png)
- [Mobile incomplete/conflicting information and row percentages](faculty-thai-copy-evidence/copy/mobile-role-unknown-hint.png)
- [Mobile international denominator](faculty-thai-copy-evidence/copy/mobile-international-chart.png)
- [Mobile domestic denominator](faculty-thai-copy-evidence/copy/mobile-domestic-chart.png)
- [Mobile search explanation](faculty-thai-copy-evidence/copy/mobile-search-hint.png)
- [Benchmark structured strings](faculty-thai-copy-evidence/copy/benchmark-structured-hint.png)
- [Benchmark legacy plain string](faculty-thai-copy-evidence/copy/benchmark-plain-string-hint.png)

Ready for manager review. No commit or runtime activation has been performed.
