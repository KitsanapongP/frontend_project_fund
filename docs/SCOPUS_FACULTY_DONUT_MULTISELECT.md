# Faculty donut multi-selection and rotation

Review base: frontend `05d3805`, backend `9018b2d`, branch `codex/faculty-research-insights`.

## Delivered behavior

All three role donuts independently toggle multiple roles from either their legend or actual SVG arcs. Selected arcs stay highlighted and other arcs dim. The center sums selected counts and calculates the percentage from that combined count and the graph's own total, rounding once. With no selected roles it shows the full total, including during hover or focus. The supplied example is **20 + 82 of 226 = 102, 45.1%**.

Hover or focus does not replace a selected aggregate or its highlights. Keyboard focus on an unselected arc still has the existing shape-following halo. Enter and Space toggle only the focused role, and Escape clears all roles when an arc or legend control has focus. `aria-pressed` is synchronized across the arc and legend; a polite, atomic status announces the combined role names, count, percentage and denominator.

Blank clicks inside the donut frame clear its selection, including unpainted ring interior, outer SVG space and frame padding. Heading, center and denominator text are protected. Buttons, SVG role controls, Hint triggers and portal content are protected from bubbling clears. Clicking outside the frame does not clear it. Each chart retains its existing local-year/new-summary reset behavior. Zero-count legends remain selectable; zero totals show an em dash for selected percentages.

The whole distribution starts at `-(First + Corresponding) / total * 180` degrees. Because the existing SVG conversion subtracts 90 degrees, the theoretical midpoint of the combined First/Corresponding span sits at twelve o'clock. Clockwise order remains First → Corresponding → Co-author → Unknown, each span remains `count / total * 360`, and the existing small visual gaps remain. No hemisphere constraint or span distortion is introduced. A zero top pair or zero total starts at zero; a full-circle role has no artificial gap.

Thai tooltips explain multi-selection, aggregation, repeat-toggle, blank-frame clear and keyboard use. The removed instruction footer stays removed. Tables, country drilldowns, filtering and paging keep their existing behavior.

## Files

- `app/(portal)/research-fund-system/admin/components/research/FacultyRoleDonut.js`: selection state, protected clear, summary accessibility and rotated SVG rendering.
- `app/lib/scopus_faculty_donut.mjs`: shared, directly tested aggregation and angle calculations.
- `app/lib/scopus_faculty_insight_hints.mjs`: natural Thai selection instructions.
- Development fixture files: coherent 226-paper asymmetric and 512-paper full-circle scenarios, without backend data.
- New `scripts/check-faculty-donut-multiselect-ui.mjs` and six calculation tests; existing compact/copy checks updated for the intended center behavior and added status element.
- Snapshot helper accepts a validated hidden directory name so this round does not overwrite earlier snapshots or evidence.

## Verification

- **100 unit tests PASS**, including six new tests for aggregate rounding, role order, asymmetric geometry, year changes, zero and full-circle cases. See [unit log](faculty-donut-multi-evidence/unit-tests.txt).
- **55 browser checks PASS**, zero page errors: 11 new multi-selection checks, 12 compact/layout checks, 9 Thai-copy checks, 15 faculty regressions and 8 refinement regressions. Per-suite JSON is under `faculty-donut-multi-evidence/{multiselect,compact,copy,regression,refinement}`.
- New browser checks exercise actual rotated path midpoints, combined highlighted sets, hover/focus stability, per-role removal, text/Hint/portal isolation, three kinds of blank clear, independent charts, Enter/Space/Escape, local year and summary resets, touch on arcs and legends in all three charts, and zero/full-circle targets.
- Existing regressions verify table/year/country drilldown dimensions, full-population search/paging, applied-filter scope and stale-response handling. Chart selection makes no drilldown request and opens no dialog.
- All browser work uses the loopback synthetic fixture. External and `/api/` requests are blocked. The application shell's attempted `/api/v1/profile` reads are recorded as blocked, never sent to a backend. This is not a new live-data E2E claim.
- Desktop and 390px mobile captures for two selected roles in **each** donut are under `faculty-donut-multi-evidence/multiselect/desktop-two-selected-rotation-{1,2,3}.png` and `mobile-two-selected-rotation-{1,2,3}.png`. Reviewed captures have readable legends/denominators and no horizontal mobile overflow. The main chart displays 102 / 45.1%; the international and domestic charts use their own 104 and 105 denominators.
- **Isolated production build PASS**: compilation, lint/type checks, static generation and build traces completed successfully. See [build log](faculty-donut-multi-evidence/production-build.txt).

## Runtime and scope

Preview and build use `G:\works-fund-project\.scopus-donut-multi-preview-05d3805` with a separate `.next`, no copied environment file, and a dependency junction. Six source/config fingerprints match the frontend. Only the verified worker preview on port 3118 was stopped before building. The user's frontend on 3000 and backend on 8080 were not stopped, restarted or used for these checks; their serving cache was not cleaned or built into.

Backend remains clean at `9018b2d`. No backend, database, commit, push or deployment operations were performed. Historical review reports and evidence were preserved. Changes remain uncommitted for manager review.
