# Donut selection and partner-country feedback — ready for manager review

Clicking a donut segment or its legend now selects the role in the chart instead of opening a paper drilldown. The selected role stays highlighted after pointer leave, and the center keeps its count, percentage and denominator. Clicking the same role again returns to the total. This applies to all three donuts. Table count buttons and partner-country rows still open paper drilldowns.

## Final behavior

- Hover and keyboard focus preview a role without changing the persistent selection. Leaving the preview restores the selected role. A repeat click immediately shows the total even while the control remains hovered/focused.
- Enter and Space select/toggle the role. Segment and matching legend expose the same `aria-pressed` state, with full role/count/percentage labels and a shared denominator description. Legend selection has a border/background; keyboard segment focus has a curved halo following the actual arc. The SVG path has no rectangular focus outline.
- Changing the local year selector resets that chart to its new total. The two comparison charts keep independent selections. Applied cohort, filters, percentages, role precedence and summary/store/API behavior are unchanged.
- Country buttons retain their country and international-status dimensions. They now have a pointer cursor, a chevron, stronger hover background/border, a visible keyboard focus outline/background and touch press feedback. Their minimum height remains 44px.
- Detailed Hint content is retained, with action instructions updated to distinguish chart selection from table/country drilldowns. The small footer explains the repeat-click toggle.

## Changes relative to accepted frontend `4e89c82`

| File (frontend-relative) | Change |
| --- | --- |
| `app/(portal)/research-fund-system/admin/components/research/FacultyRoleDonut.js` | Local persistent selection, repeat-click toggle, shared pressed state, count/percentage previews and shape-aware focus halo |
| `app/(portal)/research-fund-system/admin/components/research/FacultyInsights.module.css` | Remove path outline and show the arc halo only for visible keyboard focus |
| `app/(portal)/research-fund-system/admin/components/research/AdminScopusFacultyInsights.js` | Remove all chart drilldown callbacks, reset chart selection on local year change and strengthen country-row affordance |
| `app/lib/scopus_faculty_insight_hints.mjs` | Accurate selection/drilldown and center-value explanations |
| `scripts/check-faculty-insights-compact-ui.mjs` | Selection/no-request assertions for all three charts, pointer/keyboard/touch and retained table/country drilldown checks; new evidence directory and settled screenshots |
| `scripts/check-faculty-insights-ui.mjs` | Replace obsolete keyboard chart-drilldown expectation with selection/no-request/focus-retention check |
| This report and `docs/scopus-donut-polish-evidence/` | Current verification evidence; prior-round artifacts preserved |

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| `node --test` | **94 passed**, 0 failed/skipped | Full frontend unit suite |
| Compact/selection browser suite | **12 passed**, 0 page errors | [Results](scopus-donut-polish-evidence/faculty/browser-checks.json) |
| Existing faculty browser suite | **15 passed**, 0 page errors | [Results](scopus-donut-polish-evidence/faculty-regression/browser-checks.json) |
| Existing search/modal/Hint browser suite | **8 passed**, 0 page errors | [Results](scopus-donut-polish-evidence/refinement-regression/browser-checks.json) |
| Production build | **Passed** compile, type/lint checks and static generation | [Build output](scopus-donut-polish-evidence/production-build.txt) |
| `git diff --check` | **Passed** | No whitespace/conflict-marker errors |

The **35 browser checks** use installed Chrome and loopback synthetic fixtures, blocking backend `/api/` and non-loopback browser requests. The focused checks assert that chart interactions produce no modal and no additional recorded API request, test every role's actual arc hit target in the main donut and actual arcs in both comparison donuts, linked pressed states, persistent selection, preview restoration, repeat-click reset, Enter/Space, touch, local year reset, reduced motion, bounded responsive layouts, neutral/empty data, table dimensions/focus restoration and country count/focus parity. The existing suites also retain full-population search, paging, revision recovery, expanded details, errors and detailed touch/keyboard Hint coverage.

During screenshot reruns, Next development routing hit transient 404s and then a stale generated webpack cache error. Only the worker's loopback previews were stopped; the generated workspace `.next` cache was cleared, and the final focused run passed from a clean preview. Its screenshots were buffered outside Next's watched folder, then moved into the evidence folder after the preview stopped. The subsequent production build passed. This was a preview-tooling issue; the final artifacts contain passing results. This round does not claim a new live backend/shared-data E2E run.

## Screenshots reviewed

- [Desktop cards](scopus-donut-polish-evidence/faculty/desktop.png)
- [Keyboard focus follows the arc](scopus-donut-polish-evidence/faculty/desktop-keyboard-arc-focus.png)
- [Persistent selected role](scopus-donut-polish-evidence/faculty/desktop-selected-role.png)
- [Country row keyboard feedback and chevron](scopus-donut-polish-evidence/faculty/desktop-country-focus.png)
- [Mobile cards](scopus-donut-polish-evidence/faculty/mobile.png)
- [Mobile selected role](scopus-donut-polish-evidence/faculty/mobile-selected-role.png)
- [Mobile country rows](scopus-donut-polish-evidence/faculty/mobile-country-rows.png)
- [Mobile table-count drilldown](scopus-donut-polish-evidence/faculty/mobile-drilldown.png)
- [Mobile detailed Hint](scopus-donut-polish-evidence/faculty/mobile-hint.png)

All changes remain uncommitted on `codex/faculty-research-insights`, with frontend HEAD `4e89c82` and backend HEAD `9018b2d`. Backend working tree is clean. No database/schema/backend change, harvest, commit, push, deployment or serving application restart occurred. All worker-owned loopback previews are stopped, and the temporary evidence folder was removed after transfer. The remaining step is manager review and its commit decision.
