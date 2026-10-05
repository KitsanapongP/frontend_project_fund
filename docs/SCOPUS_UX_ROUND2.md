# Scopus UX round 2 — ready for manager review

The Benchmark summary, presentation and legacy report keep started reads alive across internal tab switches. Returning to a pending tab joins its existing promise; returning after success uses the cache for its applied filters. The faculty cards now appear in the order roles → international → comparison, with compact tables, larger interactive donuts and responsive legends.

## Review state

- Frontend base: `1a88711`; backend base: `9018b2d`.
- Both repositories remain on `codex/faculty-research-insights`.
- Changes are uncommitted. Backend working tree is clean.
- No database access/writes, harvest, schema change, commit, push or deployment in this round. The worker's loopback preview was stopped after verification.

## Benchmark behavior

`createSummaryLoader` owns completed responses and one pending request per mounted stream. Loading the same pending key updates its receiver and returns the same promise. Success is cached; failure is retryable. Abort plus a generation guard rejects late results even when the transport ignores abort.

Visibility gates the start of a read, not its cancellation. Summary overview/faculty, presentation and legacy comparison/insights therefore complete while hidden. Unvisited streams remain lazy. Applied-filter/window changes stop obsolete pending requests, while completed results remain reusable by their keys. API replacement, explicit refresh and unmount clear the relevant local caches. There is no global cache. Detail closing, export cancellation and setup/harvest lifecycle retain their cancellation behavior.

Summary loading/error state is keyed by stream and applied context so a hidden overview completion cannot stop the faculty loading indicator. Legacy refresh context is updated before synchronous cache delivery, preserving the requirement that both successful reads belong to the current refresh range. Selecting a single legacy report year can widen its trend window and legitimately start a different comparison request.

## Faculty layout and interaction

- Card headers, padding and table cells are smaller; data text remains 13px, labels/selectors 14px and supporting percentages 12px. Count controls have 32px targets and donut legends 48px targets.
- At a faculty container width of at least 1000px, the roles table sits beside its donut and the international table sits left of partner countries. Narrower containers stack. Table overflow stays within its labelled, keyboard-focusable region.
- Each donut uses a container query: at least 440px gives compact legends on the left and a larger chart on the right; smaller cards put the chart above a two-column legend. The comparison card retains its two group charts and its separate year selector.
- All three use First `#245b78`, Corresponding `#14857e`, Co-author `#bd6a24` and unknown `#7b8b9b`. Each mark has at least 3:1 contrast against the light chart surface. Text and role labels accompany color; unknown stays neutral.
- Actual SVG arc paths replace overlapping dashed circles. Hover/focus links the corresponding legend and segment, dims the other roles, and shows count, percentage and group denominator in the center. Enter/Space, pointer and touch retain the correct drilldown dimensions. Empty groups show an em dash and no misleading segment. Motion transitions run only when reduced motion is not requested.
- Detailed explanation content and year-selector semantics remain intact. A touch regression found that focus preview could open the shared Hint portal before the tap click, redirecting that click. Touch now opens/pins on click; mouse pointer hover and keyboard focus still preview. Escape/outside click dismissal remains available.

## Changed files

Paths below are relative to the frontend repository.

| Files | Purpose |
| --- | --- |
| `app/lib/scopus_benchmark_summary.mjs` | Per-stream pending join, success cache and explicit cancellation |
| `app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkSummary.js` | Visibility-independent read lifecycle and stream-specific status |
| `app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js` | Legacy read lifecycle and refresh context |
| `app/(portal)/research-fund-system/admin/components/research/AdminScopusFacultyInsights.js` | Reorder and compact cards/tables/partners |
| `app/(portal)/research-fund-system/admin/components/research/FacultyInsights.module.css` | Responsive container layouts |
| `app/(portal)/research-fund-system/admin/components/research/FacultyRoleDonut.js` | Shared interactive arcs, legends and accessible denominator |
| `app/lib/scopus_faculty_insights.mjs` | Shared palette and concise legend labels |
| `app/(portal)/research-fund-system/admin/components/research/report/Hint.js` | Reliable touch opening while retaining mouse/keyboard previews |
| `app/dev/scopus-benchmark-summary/page.js` | Development-only held/late/retry request and mount lifecycle fixture |
| `app/lib/__tests__/scopus_benchmark_summary.test.mjs`, `app/lib/__tests__/scopus_faculty_insights.test.mjs` | Loader lifecycle and palette regression checks |
| `scripts/check-scopus-benchmark-tab-lifecycle.mjs`, `scripts/check-faculty-insights-compact-ui.mjs` | New browser verification |
| `scripts/check-faculty-insights-ui.mjs`, `scripts/check-faculty-insights-refinement-ui.mjs` | Optional evidence output directory to preserve prior-round artifacts |
| This report and `docs/scopus-ux-round2-evidence/` | Current verification evidence |

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| `node --test` | **94 passed**, 0 failed/skipped | All frontend unit tests; includes 15 Benchmark summary checks |
| Benchmark lifecycle browser script | **9 passed**, 0 page errors | [Request lifecycle results](scopus-ux-round2-evidence/benchmark/browser-checks.json) |
| Compact faculty browser script | **11 passed**, 0 page errors | [Layout/interaction results](scopus-ux-round2-evidence/faculty/browser-checks.json) |
| Existing faculty browser suite | **15 passed**, 0 page errors | [Regression results](scopus-ux-round2-evidence/faculty-regression/browser-checks.json) |
| Existing refinement browser suite | **8 passed**, 0 page errors | [Search/modal/Hint results](scopus-ux-round2-evidence/refinement-regression/browser-checks.json) |
| `next build` | **Passed** compilation, type/lint validation and static generation | [Production build output](scopus-ux-round2-evidence/production-build.txt) |
| `git diff --check` | **Passed** | No whitespace/conflict-marker errors |

The 43 browser checks use installed Chrome and loopback synthetic fixtures only, with backend `/api/` and non-loopback requests blocked. They cover pending and cached tab return, lazy streams, obsolete filters, explicit refresh, late aborted results, failure retry, unmount/remount, detail close, print-style visibility, real arc hit targets, hover/focus, keyboard/touch, reduced motion, responsive overflow, unknown/zero data, full-population search beyond 200, paging, revision recovery and safe modal details. Screenshots were visually reviewed with the project's Sarabun font. These are component/UI regression checks, not a new live backend or shared-data E2E run.

## Screenshots

- [Desktop — all three cards](scopus-ux-round2-evidence/faculty/desktop.png)
- [Roles table and larger donut](scopus-ux-round2-evidence/faculty/desktop-roles.png)
- [Linked legend/segment with count and denominator](scopus-ux-round2-evidence/faculty/desktop-linked-focus.png)
- [International table and partners](scopus-ux-round2-evidence/faculty/desktop-international.png)
- [Tablet stacking](scopus-ux-round2-evidence/faculty/tablet.png)
- [Mobile — all three cards](scopus-ux-round2-evidence/faculty/mobile.png)
- [Mobile drilldown](scopus-ux-round2-evidence/faculty/mobile-drilldown.png)
- [Mobile detailed Hint after dialog close](scopus-ux-round2-evidence/faculty/mobile-hint.png)
- [Mobile empty data](scopus-ux-round2-evidence/faculty/mobile-empty.png)
- [Benchmark cached summary](scopus-ux-round2-evidence/benchmark/completed-summary-cache.png)
- [Benchmark cached legacy report](scopus-ux-round2-evidence/benchmark/completed-legacy-cache.png)
- [Benchmark mobile summary](scopus-ux-round2-evidence/benchmark/mobile-summary.png)
- [Benchmark mobile legacy report](scopus-ux-round2-evidence/benchmark/mobile-legacy.png)

The remaining step is manager review and the manager's commit decision. Runtime activation remains separate.
