# Research and Scopus Benchmark tooltip standardization

Review status: ready for manager review. Changes are uncommitted on `codex/faculty-research-insights`, based on frontend `5243829aa28e9b0e9dd79e9cf2f08d0bcdfe5fcf`. Backend remains unchanged at `9018b2d8f220fa89eb7dba533554407442bc57a0`.

## Result

The full research dashboard and every Scopus Benchmark tab now use `research/report/Hint.js` for explanatory help. Legacy overview formula bubbles, native person H-index explanations, the two faculty H-index popovers, missing Scopus ID help, and setup step help use the same panel as the faculty insight cards. Existing Benchmark explanations use natural Thai sections, bullets, and safe, narrow bold emphasis.

The shared component provides a 32 × 32 px info trigger, a white bordered panel with 16 px padding, 12 px text and 19.5 px line height, a maximum width of 360 px, and viewport-bounded scrolling. Hover and keyboard focus preview the text. Click or touch pins it. Clicking inside the panel preserves it; outside click or Escape closes it. Moving from the trigger into the portal remains usable. Opening another explanation leaves one panel, and hiding a retained Benchmark tab dismisses its panel.

Buttons expose accessible labels, expanded state, description and control links, and visible keyboard focus. Help inside the faculty document dialog is portaled into its actual dialog panel, preserving the focus trap. The first Escape closes help; the next closes the dialog. Escape on a focused donut control still clears the chart selection when unrelated help is pinned.

## Inventory and disposition

Paths below are relative to `app/(portal)/research-fund-system/admin/components/research/` unless stated otherwise. Repeated instances reuse the listed definitions.

| Surface and component | Explanatory variants found | Result |
| --- | --- | --- |
| Research overview, `AdminScopusResearchDashboard.js` | Ten local absolute hover/focus formula panels | Replaced with shared Hint; long labels wrap while the trigger remains visible in sticky table columns. |
| Research person summary and person year matrix, same component | Two native `title` H-index explanations with decorative help icons | Replaced with shared Hint; clicking help does not sort the header or fetch data. |
| Research faculty cards, `AdminScopusFacultyInsights.js` and `FacultyRoleDonut.js` | Existing shared hints for scope, roles, year selection, country counts, donut values and cross-tab definitions | Retained definitions and unified shared behavior. Dialog portal container added. |
| Research faculty H-index, `AdminScopusFacultyHIndex.js` | Two local click-only absolute popovers: definition and graph usage | Replaced with shared Hint and safe structured Thai text. |
| Research legacy document type, quartile, source, sponsor, history and internal collaboration cards | No additional divergent explanatory panels in the remaining cards | Inspected and included in full-page evidence; functional data hovers and visible text retained. |
| Benchmark summary overview and faculty subview, `ScopusBenchmarkSummary.js` | Thirteen shared definitions: Thailand, KKU, COC, percentages, roles, co-author, unknown, units, quartile, missing quartile, not applicable, visibility, zero | Thai copy rewritten using safe fragments; distinct data rules retained. Missing Scopus ID native explanation replaced with visible Hint. Category/Quartile card instances retained. |
| Benchmark presentation, `ScopusBenchmarkPresentation.js` within the summary wrapper | Shared wrapper explanations plus divergent ratio and filter-stage prose | Ratios and stage denominators now use shared structured definitions. All comparison tables retain their own counting semantics. |
| Benchmark analytical, `ScopusBenchmarkDashboard.js`, `report/ComparisonTable.js` | Two KPI and two table explanations for T1–Q2 and international collaboration | Shared structured sections. Printable `HINT_T1Q2` and `HINT_INTL` strings derive from the same fragments. |
| Benchmark setup, `AdminScopusBenchmark.js` | Setup step headings and a separate full HelpModal | Two step headings use Hint. The complete ordered setup guide remains a modal. |

### Exact exclusions preserved

- Apex chart hovers for document type and quartile, and the custom faculty H-index article hover, are live value tooltips. Their data, positions, and selection behavior remain intact. Scoped `ResearchTooltips.module.css` aligns Apex typography and white/slate styling; H-index custom padding and text styling match. A real interior H-index marker was verified to show article rank, title, citations and year.
- `report/TrendCharts.js` SVG yearly-value titles and `report/QualityTypeDetails.js` tier/count titles remain native data hovers.
- Abbreviation expansions such as `TH`/Thailand, role/international abbreviations, and useful full or truncated legend labels remain native titles.
- Export, zoom, reset, count-click action titles, and the disabled print reason in `ReportHeader` remain functional purpose labels.
- Visible methodology, details, source notes, data evidence and status explanations remain visible content. The two analytical metric notes share the tooltip fragments while remaining printable strings.
- Setup HelpModal remains a full guide with ordered steps rather than being compressed into tooltip content.
- Unrelated research search and member pages are outside this change.

## Semantic and behavior preservation

No counting algorithm, filter condition, endpoint, request parameter, drilldown predicate, chart selection model or backend code was changed. Six overview formulas previously omitted `N/A` from their explanation even though existing calculations include it. Their displayed formulas now include `N/A`; numerical calculations remain unchanged. Replacing spaced division slashes with `÷` leaves the slash in `N/A` intact.

The descriptions preserve official cumulative person H-index versus imported, deduplicated faculty H-index. Benchmark summary/presentation retains overlapping First/Corresponding roles, union deduplication, its co-author/unknown policy, roster restrictions, affiliation codes, and the absence of an employment-start filter. Faculty insight roles retain their separate exclusive categories and existing predicates. Journal classification fallback remains the latest complete eligible prior year, never a future year. T1 remains percentile 90–100 and does not overlap Quartile rows in split mode. Missing Quartile and non-journal not-applicable remain separate.

Presentation retained-share percentages still divide by each level's pre-filter baseline, not the immediately preceding stage. Analytical T1–Q2 shares use classified journals as denominator. Analytical international shares exclude unknown affiliation countries and refer to affiliation country, not nationality. Zero and unavailable data remain distinct.

Optional API props in the research dashboard and H-index component provide a read-only development fixture seam. Production defaults use the original API objects and request parameters. The new `/dev/scopus-research-tooltips` page returns not-found outside development. Fixtures use coherent synthetic legacy history, individual/year matrix and faculty records; the H-index example is an explicitly separate graph dataset. No live totals are claimed.

## Verification

All saved browser runs used isolated previews, synthetic fixtures, and blocked backend requests. They do not validate live Scopus data completeness. The user's frontend on port 3000 and backend on port 8080 remained running; their source `.next`, environment files and backend were not changed. The owned preview on port 3119 was stopped before building the snapshot.

| Check | Result | Evidence |
| --- | --- | --- |
| Existing unit suite, `node --test` | 100 passed, 0 failed | [Log](research-tooltip-evidence/unit-tests.txt) |
| Full research/Benchmark tooltip tour | 22 passed; 143 tooltip visits across desktop and touch/mobile; 0 page errors | [Checks and label-level coverage](research-tooltip-evidence/standardization/browser-checks.json) |
| Faculty Thai copy and canonical help | 9 passed | [Checks](research-tooltip-evidence/faculty-copy/browser-checks.json) |
| Donut multiselect and tooltip interactions | 11 passed | [Checks](research-tooltip-evidence/donut-regression/browser-checks.json) |
| Benchmark retained-tab lifecycle | 9 passed | [Checks](research-tooltip-evidence/benchmark-regression/browser-checks.json) |
| Compact layout regression | 12 passed | [Checks](research-tooltip-evidence/compact/browser-checks.json) |
| Faculty integration regression | 15 passed | [Checks](research-tooltip-evidence/faculty-regression/browser-checks.json) |
| Faculty refinement regression | 8 passed | [Checks](research-tooltip-evidence/refinement/browser-checks.json) |
| Isolated Next production build, including lint/type checks and 37 static pages | Passed, exit 0 | [Build log](research-tooltip-evidence/production-build.txt) |

Browser total: **86 passed**. The full-page tour covers all ten legacy formula labels on desktop and mobile, both person H-index headers, both faculty H-index explanations, all Benchmark tabs and both summary subviews. Conditional faculty/mobile rendering produces fewer simultaneous triggers than desktop; the dedicated faculty copy suite separately covers all nine faculty explanation groups on mobile. The tour also verifies safe text and literal HTML compatibility, consistent dimensions/styles, viewport bounds, pin/hover/focus/touch behavior, chart Escape behavior, dialog containment, retained-tab dismissal, and unchanged help/drilldown request behavior.

### Full-page screenshots

| Page/view | Desktop | Mobile |
| --- | --- | --- |
| Research faculty, including legacy overview/history and H-index | [Full page](research-tooltip-evidence/standardization/research-faculty-desktop-full.png) | [Full page](research-tooltip-evidence/standardization/research-faculty-mobile-full.png) |
| Research individual summary and year matrix | [Full page](research-tooltip-evidence/standardization/research-person-desktop-full.png) | [Full page](research-tooltip-evidence/standardization/research-person-mobile-full.png) |
| Benchmark summary overview | [Full page](research-tooltip-evidence/standardization/benchmark-summary-desktop-full.png) | [Full page](research-tooltip-evidence/standardization/benchmark-summary-mobile-full.png) |
| Benchmark faculty summary | [Full page](research-tooltip-evidence/standardization/benchmark-faculty-desktop-full.png) | [Full page](research-tooltip-evidence/standardization/benchmark-faculty-mobile-full.png) |
| Benchmark presentation | [Full page](research-tooltip-evidence/standardization/benchmark-presentation-desktop-full.png) | [Full page](research-tooltip-evidence/standardization/benchmark-presentation-mobile-full.png) |
| Benchmark analytical | [Full page](research-tooltip-evidence/standardization/benchmark-analytical-desktop-full.png) | [Full page](research-tooltip-evidence/standardization/benchmark-analytical-mobile-full.png) |
| Benchmark setup | [Full page](research-tooltip-evidence/standardization/benchmark-setup-desktop-full.png) | [Full page](research-tooltip-evidence/standardization/setup-mobile-full.png) |

Representative contextual captures were visually inspected: [mobile overview formula](research-tooltip-evidence/standardization/research-faculty-mobile-viewport-formula.png), [mobile person H-index](research-tooltip-evidence/standardization/research-person-mobile-viewport-help.png), [mobile missing Scopus ID](research-tooltip-evidence/standardization/benchmark-faculty-mobile-viewport-missing-id.png), [presentation desktop](research-tooltip-evidence/standardization/benchmark-presentation-desktop-viewport-help.png), and [mobile setup](research-tooltip-evidence/standardization/setup-mobile-viewport-help.png). The panel crop and context filenames are recorded in the tour JSON capture manifest. Earlier historical evidence remains preserved.

## Reproduction

From the frontend directory, use `SCOPUS_PREVIEW_NAME=.scopus-tooltip-preview-5243829` with `node scripts/prepare-faculty-copy-preview.mjs`. This copies app/public/config into an owned sibling snapshot, links installed dependencies, and omits environment files. Stop an owned preview before re-syncing its source. Start Next on a free isolated port, set `SCOPUS_UI_ORIGIN` and `SCOPUS_UI_PLAYWRIGHT_PATH`, and run `node scripts/check-research-tooltips-ui.mjs`. The regression scripts accept the same origin; `check-scopus-benchmark-tab-lifecycle.mjs` accepts `SCOPUS_UI_EVIDENCE_DIR` to preserve historical captures. Run `node --test` in the source repository and `node node_modules/next/dist/bin/next build` in the stopped snapshot for independent verification.

No commit, push, deployment, database write, or setup action was performed. Manager review and commit remain outstanding.
