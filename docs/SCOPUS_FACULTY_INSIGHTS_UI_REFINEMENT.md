# Faculty insights UI refinement — 2026-10-05

The faculty drilldown now follows `ScopusBenchmarkDocumentDialog.js`: wide white panel, search toolbar, sticky blue table header, expandable details and page controls. Search applies to the entire clicked group before pagination. The role selector sits above both the yearly table and donut, and detailed explanations use the existing Benchmark `report/Hint.js` unchanged.

## Behavior and semantics

Search supports literal case-insensitive partial text in title, DOI, EID, Scopus ID, publication name and names of eligible faculty authors. The field and tooltip list these fields explicitly. It searches every selected paper, including papers beyond page 200. Search/clear resets page 1; paging/page size retains the term. Group count and matched count are displayed separately. Clicked year/country/international/role dimensions and applied global filters remain fixed, and search does not change the dashboard summary. During a 409 summary refresh the search buttons wait for a usable summary; users may still type.

The store sends `drilldown_search` only when nonempty, preserves it through retry/409 recovery, and validates the returned scope/search. Generation guards and abort signals prevent an older search, page, clear, filter change or close from being overwritten. A revision conflict refreshes the three summary cards and reopens the same selection/search on page 1 once; repeated conflicts show an error.

The role-year selector changes only its donut; the yearly table still covers the full applied range. The comparison selector changes both comparison donuts and the cross-tab. Desktop table/donut top edges align; narrower screens stack them. Tables scroll inside their containers. Expanded details on mobile stay within the visible dialog after horizontal scrolling to the Details button. Headless UI retains focus trapping/Escape/trigger-focus restoration, and external links still reject unsafe schemes and credentials.

Tooltips provide sections for source/cohort, filters/years, unique counts, country classification and partial/dual affiliations, all-paper percentages, overlapping partner countries and their denominator, exclusive First → Corresponding → Co-author classification, trustworthy current XML checks, unknown/no_correspondence caveats, each donut's own denominator, selector scope and cross-tab intersections. Focus previews, click/touch pins, and Escape/outside click closes the same Benchmark hint component. Main card descriptions stay concise.

## Checks and evidence

- `node --test`: **87 PASS** (including 16 faculty insight tests). Added full-population search at paper 401, combined dimensions, clear/page reset, fixed summary/revision, race/close protection and search retention through 409.
- `scripts/check-faculty-insights-ui.mjs`: **15 PASS**, zero page errors. Existing paging over 200, partner parity, unknown separation, keyboard donut/focus, 409, applied-versus-draft filters, empty/503/page errors, mobile and late responses.
- `scripts/check-faculty-insights-refinement-ui.mjs`: **8 PASS**, zero page errors. Desktop top-edge alignment, selector scope, keyboard/pinned structured hints, expandable details/safe links, paper 401 search, combined cross-tab dimensions, partner search, mobile viewport/tooltips/detail bounds.
- Both browser harnesses use loopback synthetic fixtures, block backend/external requests, and write screenshots after closing the browser. Buffering prevents development HMR from interrupting checks. The root layout's profile request is intercepted and aborted; no backend request is allowed through.
- `node node_modules/next/dist/bin/next build`: **PASS**, including compilation and all 36 static pages. Output: [production-build.txt](faculty-insights-ui-refinement-evidence/production-build.txt). The initial sandbox attempt failed fetching the existing Sarabun Google Font; the same build passed with required network access.
- Backend normal and full isolated SQLite controller/service/routes suites: PASS. Backend search field/Unicode-bound and real-handler full-group tests are described in `fund-management-api/docs/SCOPUS_FACULTY_INSIGHTS_UI_REFINEMENT.md`.

Visual evidence in `docs/faculty-insights-ui-refinement-evidence/`:

- [Desktop cards](faculty-insights-ui-refinement-evidence/desktop.png), [role alignment](faculty-insights-ui-refinement-evidence/desktop-role-alignment.png), [role tooltip](faculty-insights-ui-refinement-evidence/desktop-role-tooltip.png).
- [Benchmark-style expanded dialog](faculty-insights-ui-refinement-evidence/desktop-modal-details.png), [search beyond 200](faculty-insights-ui-refinement-evidence/desktop-search-beyond-200.png).
- [Mobile cards](faculty-insights-ui-refinement-evidence/mobile.png), [touch tooltip](faculty-insights-ui-refinement-evidence/mobile-country-tooltip.png), [search dialog](faculty-insights-ui-refinement-evidence/mobile-modal-search.png), [visible expanded metadata](faculty-insights-ui-refinement-evidence/mobile-modal-details.png).
- [Refinement checks](faculty-insights-ui-refinement-evidence/browser-checks.json), [regression checks](faculty-insights-ui-refinement-evidence/regression/browser-checks.json), plus regression empty/error/revision/mobile screenshots.

Reproduce with the installed Playwright/Chrome and `SCOPUS_UI_PLAYWRIGHT_PATH` pointing to that installation. Start `node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3105`, run the two browser scripts sequentially, then stop that own preview before `node node_modules/next/dist/bin/next build`. No dependency installation is required.

## Changed frontend files

1. `app/(portal)/research-fund-system/admin/components/research/AdminScopusFacultyInsights.js`: layout, hints and Benchmark-style searchable dialog.
2. `app/lib/scopus_faculty_insight_hints.mjs`: structured Thai explanations.
3. `app/lib/scopus_faculty_insights.mjs`: local search, paging/recovery and response scope validation.
4. `app/lib/__tests__/scopus_faculty_insights.test.mjs`: search/race/recovery coverage.
5. `app/dev/scopus-faculty-insights/fixtures.mjs`: full-population local search and Scopus ID fixtures.
6. `scripts/check-faculty-insights-refinement-ui.mjs`: focused browser assertions/screenshots.
7. `scripts/check-faculty-insights-ui.mjs`: row selectors, separate regression evidence and buffered captures.
8. `scripts/check-faculty-native-ui.mjs`: row selectors and structured-role-hint assertion kept compatible; **native MariaDB browser harness was not rerun in this task**.
9. This report and new evidence directory. Historical Phase 4/5 evidence was preserved.

No shared TEST/production schema or data writes, harvesting, commit/push or deployment occurred. The serving backend was not restarted. These new screenshots are explicitly synthetic; current real TEST rollout evidence remains the previously accepted backend report/commit `78a5ae0`. The UI search requires the updated backend endpoint when a serving release is deployed.
