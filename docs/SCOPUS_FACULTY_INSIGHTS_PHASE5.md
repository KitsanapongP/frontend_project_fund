# Faculty research insights — Phase 5 frontend integration

**READY FOR MANAGER REVIEW.** Eight browser checks passed against actual API handlers/auth/permission middleware backed by disposable local MariaDB 10.11.16. The component uses its default authenticated `adminAPI` wrappers. No production fixture fallback, shared write or deployment was introduced.

The backend [Phase 5 report](../../fund-management-api/docs/SCOPUS_FACULTY_INSIGHTS_PHASE5.md) contains native foundation/API/filter/snapshot results, synthetic cost/EXPLAIN scale, limitations and migration/backfill rollout sequence. Backend baseline `9f2e20f`; frontend baseline `10f7644`. Changes are uncommitted for review.

The Thai explanation now states Corresponding counts only papers without a faculty First, and precedence prevents duplicate counting rather than ranking importance. Existing current-role/unknown behavior is preserved.

Evidence:

- [Browser checks/sanitized requests](faculty-insights-phase5-evidence/browser-checks.json): 8 passes, 15 real API responses, zero page errors/external requests. Database-backed active session, 246 documents, 200 + 46 paging, Japan parity, unknown evidence, real SQL mutation/409 reset to page one, draft/applied BE year, actual zero-result year, mobile width/safe links.
- [Desktop](faculty-insights-phase5-evidence/native-desktop.png), [page two beyond 200](faculty-insights-phase5-evidence/native-page-two.png), [revision recovery](faculty-insights-phase5-evidence/native-revision-recovery.png), [mobile](faculty-insights-phase5-evidence/native-mobile.png). Desktop/mobile screenshots visually inspected.
- [Production guard](faculty-insights-phase5-evidence/production-guard.json): both developer QA paths return 404; `/research-fund-system/admin/research-dashboard` returns 200. The latter checks the route shell, not authenticated shared data.

`node --test`: **84/84 PASS**. Production build: **PASS**, nonfatal webpack cache EPERM warnings. Standalone ESLint remains unconfigured from Phase 4. No dependencies changed. Both repository whitespace checks passed.

Production insertion/filter wiring was reviewed: cards follow Faculty Quartile History, precede H-index and receive `filterToQueryParams(appliedFilters)` plus existing summary readiness/refresh. Accepted parent-dashboard lines were not changed. Browser integration renders the real component in the marked dev page rather than the entire shared-data dashboard. Prior Phase 4 fixture checks cover other error/race/focus scenarios; those are not native backend checks.

## Reproduce native frontend handshake

First start the approved portable server/empty schemas and backend native harness with `SCOPUS_NATIVE_UI_HANDSHAKE_PATH` as described in its Phase 5 report. After it writes the manifest, run from frontend:

```powershell
$m=Get-Content 'G:\works-fund-project\.phase5-mariadb\ui-handshake.json' -Raw | ConvertFrom-Json
if ($m.api_origin -notmatch '^http://127\.0\.0\.1:\d+$' -or -not $m.fixture_only) { throw 'Unsafe native fixture manifest' }
$env:NEXT_PUBLIC_API_URL=$m.api_origin+'/api/v1'
$env:NEXT_TELEMETRY_DISABLED='1'
node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3106
```

In a second frontend shell, with existing bundled Playwright/Chrome:

```powershell
$env:SCOPUS_UI_PLAYWRIGHT_PATH='C:\Users\supha\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:SCOPUS_NATIVE_UI_HANDSHAKE_PATH='G:\works-fund-project\.phase5-mariadb\ui-handshake.json'
node scripts/check-faculty-native-ui.mjs
```

The script requires guarded runtime path, fixture flag and loopback origins. It seeds only the disposable JWT into its own browser; real middleware validates DB session/user/permission. External traffic is blocked and no token/auth header is saved. A protected mutation endpoint exists **only in Go's httptest server**, to change/restore one fixture citation and produce a real stale revision. It is not registered in production routes.

The harness waits for a fresh `.done` result, then completes snapshot/cost/missing-schema tests and cleanup. Never point these scripts at shared services. After this run browser/frontend servers/own portable MariaDB were stopped and temporary synthetic token files removed. Stopped runtime remains outside the repositories.
