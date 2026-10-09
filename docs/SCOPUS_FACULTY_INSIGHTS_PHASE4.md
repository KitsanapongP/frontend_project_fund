# Faculty research insights — Phase 4 frontend review

**READY FOR MANAGER REVIEW.** Phase 4 frontend implementation is complete on `codex/faculty-research-insights`, against accepted backend Phase 3 commit `9f2e20f`. Changes remain uncommitted for manager review. No branch switches, commits, pushes, backend edits, shared database writes, migrations/backfills, native MariaDB setup, Scopus requests, export additions, subagents, manager messages, or automations were performed.

## User-facing result

Three independently collapsible Thai cards are inserted immediately after **Faculty Quartile History**, before the existing **H-index**, in the faculty view of `/admin/research-dashboard`:

1. **ความร่วมมือระหว่างประเทศของคณะ** — yearly/total yes, no and unknown counts, with percentages using all selected unique Scopus papers including unknown as denominator; clickable foreign-country bars/counts; multi-country overlapping membership and operational dual-affiliation explanation. Confirmed foreign evidence can establish collaboration even when some other evidence is incomplete. Unknown is never reclassified as domestic.
2. **บทบาทผู้เขียนของคณะ** — yearly/total exclusive role counts and percentages plus a selectable range/year donut, in stable order/color: First, Corresponding, Co-author, unknown. The backend's First > Corresponding > Co precedence remains authoritative; the frontend does not reclassify author flags.
3. **บทบาทคณะ: ต่างประเทศและภายในประเทศ** — paired role donuts with the same order/colors and each group's own denominator, plus a fully clickable status × role table containing all 12 cells, including unknown country and unknown role. Range/year selection is local to the displayed chart/table and becomes a drilldown dimension.

Every card explicitly uses Scopus only, excluding ThaiJO/TCI. Zero denominators display an em dash. Empty graphs retain their legend and show an empty message. Accessible horizontal table regions preserve columns on small screens; SVG segments and equivalent counts/legends support keyboard activation.

The reusable component adds only three lines to the parent dashboard: import, memoized query from **appliedFilters**, and render position. Draft filters are not passed. It waits for the existing applied-summary initialization, and parent summary refreshes trigger a shared feature refresh. All three cards use one summary/revision, with no independent card requests or caches.

## Fetching and drilldown behavior

`adminAPI.getScopusFacultyInsights` and `adminAPI.getScopusFacultyInsightsDrilldown` use the existing authenticated client, passing fetch options/AbortSignal. No client/global authentication behavior was changed.

A focused pure resource store drives all three cards. It aborts superseded summary/page requests and guards results by request generation, because a transport can still complete after abort. Changing applied filters immediately clears feature summary/pages; render also checks the current query key before exposing any result. Loading, malformed-response error, permission/auth error, unavailable, empty, and retry states are explicit. Unavailable messages contain no migration/schema/backend jargon and never substitute zeros or fixtures.

Drilldowns use a Headless UI focus-trapped dialog with Escape/close support and focus restoration. They pass identical applied dashboard filters, selected dimensions, the summary revision, page and page size. Partner clicks always include `international_status=yes`. Total is the full server matching count; page sizes 10/25/50/100/200 and previous/next controls fetch server pages rather than slicing a first-200 response. Empty responses show no pages; failed page requests remove prior documents.

On 409, the store clears the shared summary, refreshes it, and restarts the same dimension on page 1 with a Thai notice. One automatic recovery attempt prevents refresh loops. Closing during successful **or failed** recovery cannot reopen the dialog. If the original trigger disappears after refresh, focus returns to the feature update control. Manual retry does not falsely report a revision change.

Document evidence shows title/year/source/EID, country/role/citations, current countries, and expandable eligible-author evidence. Flags from an unsuccessful role status are displayed as unknown rather than as current assertions. External Scopus links accept only HTTP/HTTPS without embedded credentials; DOI links are constructed from validated DOI text and encoded path segments. Unsafe schemes/relative URLs are not rendered as links.

## Changed files

| File | Purpose |
|---|---|
| `app/(portal)/research-fund-system/admin/components/research/AdminScopusResearchDashboard.js` | Three-line applied-filter/placement integration |
| `app/(portal)/research-fund-system/admin/components/research/AdminScopusFacultyInsights.js` | Reusable cards, charts/tables, resource UI and evidence dialog |
| `app/lib/admin_api.js` | Two authenticated API wrappers with options/signal support |
| `app/lib/scopus_faculty_insights.mjs` | Shared metadata/format/link helpers, response validation, cancellable summary/page/revision store |
| `app/lib/__tests__/scopus_faculty_insights.test.mjs` | 13 focused logic, race, paging, recovery and URL tests |
| `app/dev/scopus-faculty-insights/page.js` | Development-only server preview entrypoint |
| `app/dev/scopus-faculty-insights/preview-client.js` | Clearly marked fixture controls and draft/applied preview |
| `app/dev/scopus-faculty-insights/fixtures.mjs` | Coherent synthetic 512-document summary/drilldown fixtures and error/delay scenarios |
| `middleware.js` | Guard **only** this preview path before streaming; production returns HTTP 404, other routes pass through/unmatched |
| `scripts/check-faculty-insights-ui.mjs` | Reproducible fixture-only headless browser QA, rejecting non-loopback origins and blocking backend/external requests |
| `docs/faculty-insights-phase4-evidence/` | Ten fixture screenshots plus browser/production-guard JSON evidence |
| `docs/SCOPUS_FACULTY_INSIGHTS_PHASE4.md` | This handoff report |

No package, lockfile, dependency, authentication, backend or export scope changes.

## Validation

| Check | Result |
|---|---|
| `node --test` | **PASS — 84/84**, including 13 new focused tests |
| `node --test app/lib/__tests__/scopus_faculty_insights.test.mjs` | **PASS — 13/13** |
| `node node_modules/next/dist/bin/next build` | **PASS**, production compilation, build validity stage and route generation; no new dependencies |
| `node node_modules/next/dist/bin/next lint --no-cache` | **NOT RUN**: existing repo has no ESLint installation/config; command stops at the configuration prompt. No dependency/config setup was introduced solely to change this repo-wide tooling |
| Fixture-only installed headless Chrome/Playwright QA | **PASS — 15/15**, zero page errors; one incidental authentication request blocked, no backend/Scopus request sent |
| Built production server GET `/dev/scopus-faculty-insights` | **PASS — HTTP 404**, recorded in `production-guard.json` |
| `git diff --check` | **PASS** |
| Backend status | **Clean**, HEAD remains accepted `9f2e20f` |

The build's printed “Linting and checking validity of types” stage is not claimed as a standalone ESLint pass. `npm` is not on this shell's PATH, so Next/test commands were invoked directly through the available Node runtime. The provided `cua_repl` and computer-use Node runtime both failed initialization with “failed to write kernel assets … path … os error 3.” After reading the computer-use skill, visual QA used the already bundled Playwright package and installed headless Chrome. No browser/runtime software was installed.

Executed browser checks, in [browser-checks.json](faculty-insights-phase4-evidence/browser-checks.json):

1. Desktop card order and explicit fixture label.
2. Per-card collapse/expand and ARIA state.
3. Full total 512 and rows 201–400 with 200 server rows, beyond a first-200 ceiling.
4. Japan partner click matches the international yes population (236 synthetic papers).
5. Unknown-country cross-tab drills to 39 distinct synthetic papers with no asserted countries.
6. Keyboard donut activation, Escape, and focus restoration.
7. 409 refresh/restart page 1, notice, and focus fallback after trigger replacement.
8. Draft year changes leave the current summary; applying changes clears/reloads with the selected year.
9. Empty percentages are em dashes; empty drilldown has no documents/pages.
10. Unavailable 503 shows three retry states and no zero/old tables.
11. Failed second page discards first-page documents.
12. 390 × 844 mobile layout/dialog fit without document-level horizontal overflow; tables retain internal scroll regions.
13. Zero international denominator shows an empty international donut and separate state totals.
14. Unknown-only fixture keeps domestic at zero and unknown at 39.
15. A slower old year response finishes after the newer year; the newer applied-year summary remains visible.

Screenshots were also visually inspected at desktop/mobile: table alignment, chart colors/order, mobile stacking/internal table scrolling, modal height/footer, empty and unavailable states. Fixture headers/document names explicitly mark synthetic data. The actual authenticated production dashboard was not visually accessed; insertion/filter wiring was checked in source and production compilation, while component rendering/interactions used the isolated preview.

## Review evidence and reproduction

- [Desktop cards](faculty-insights-phase4-evidence/desktop.png)
- [Mobile cards](faculty-insights-phase4-evidence/mobile.png)
- [Desktop paging beyond 200](faculty-insights-phase4-evidence/desktop-paging.png)
- [Mobile drilldown](faculty-insights-phase4-evidence/mobile-drilldown.png)
- [Revision recovery](faculty-insights-phase4-evidence/revision-recovery.png)
- [Empty cards](faculty-insights-phase4-evidence/empty.png), [empty drilldown](faculty-insights-phase4-evidence/empty-drilldown.png)
- [Unavailable state](faculty-insights-phase4-evidence/unavailable.png)
- [Zero international denominator](faculty-insights-phase4-evidence/zero-international.png)
- [Unknown-only countries](faculty-insights-phase4-evidence/unknown-only.png)
- [Production guard result](faculty-insights-phase4-evidence/production-guard.json)

From frontend root, start `node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3105`, then run:

```powershell
$env:SCOPUS_UI_PLAYWRIGHT_PATH='C:\Users\supha\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
node scripts/check-faculty-insights-ui.mjs
```

The QA script requires an existing Playwright installation/Chrome. It only permits loopback HTTP and uses `/dev/scopus-faculty-insights`; it blocks all `/api/` and external requests and closes its browser. Preview APIs are injected only in that development page; the production component defaults exclusively to real authenticated wrappers. Production has both a server not-found guard and a narrowly matched pre-streaming HTTP 404 guard.

## Remaining gates

**No live end-to-end parity is claimed.** Shared migration/backfill remains unapplied, the real country endpoint remains unavailable until rollout, and native MariaDB migration/trigger/FK/locking/read-only snapshot checks remain the accepted deployment gate. These were not changed or bypassed by frontend work.

Standalone ESLint remains unconfigured in the existing frontend repo. Review and the successful production build/tests cover this change, but a dedicated ESLint setup/run would be a separate tooling decision. Browser evidence is synthetic component QA, not validation of shared data or authenticated live behavior. Both Next preview servers and the QA browser were stopped after checks.
