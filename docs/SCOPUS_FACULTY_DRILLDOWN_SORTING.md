# Faculty insights drilldown sorting

Branch in both repositories: `codex/faculty-drilldown-sorting`. Frontend base: `4cc66f8fd47ea8f7be23643a4b9d5234b7c14541`; backend base: `2644d67a6531a66442986a9fd16b4450c98fae3d`. Both repositories were clean on `main` before branching. Changes remain uncommitted for manager review.

## Result and scope

The faculty insights document dialog now has clickable sort buttons for **ชื่อผลงาน**, **ปี พ.ศ.**, **ความร่วมมือ / ประเทศ**, and **บทบาทคณะ**. The details column remains an expansion action. Clicking a new column starts ascending; clicking it again toggles descending. Direction arrows and `aria-sort` reflect the selection, and Thai accessible button names describe the next action. Headers remain available during a page request so a newer click immediately supersedes an older request. A visible note explains that sorting covers all matching documents before pagination and that unavailable values remain last.

Sorting is performed by the backend over the entire selected and searched population before slicing a page. The browser only sends the requested field and direction; it never sorts the current page. Default requests omit both sort parameters and retain the existing document ID ascending order. Opening a new drilldown starts with that default.

## Exact ordering semantics

All text keys are trimmed and lowercased with Go's Unicode lowercase conversion, then compared in Unicode code-point order. This is lexical ordering rather than Thai dictionary collation or natural numeric sorting within a title. Equal keys always use **document ID ascending**, including when the main direction is descending. Missing/unknown values are always after known values in either direction and tie by document ID.

| Field | Ascending key and missing rule |
| --- | --- |
| `title` | Publication title, case-insensitive. A null, empty or whitespace-only title is missing. The existing EID fallback remains visible but does not turn a missing title into a known sort key. |
| `year` | Numeric publication year. Sorting CE is equivalent to sorting the displayed BE year because their offset is constant. Undated documents remain last. |
| `collaboration` | First the displayed Thai status, then the displayed country list joined with comma and space. Ascending known statuses are `ภายในประเทศ` then `ร่วมกับต่างประเทศ`; descending reverses that order. Country names use the existing returned/displayed list order, including `Thailand` displayed as `ประเทศไทย`. Unknown status, non-current country evidence or an empty country list makes the whole composite unavailable and puts it last. Countries are not rearranged and stale evidence is not used for sorting. |
| `faculty_role` | Displayed English labels: `Co-author`, `Corresponding author`, `First author` in ascending order; reverse in descending. `ยังระบุบทบาทไม่ได้` and unrecognized roles are unavailable and remain last. |

The API accepts the pair `sort_field=title|year|collaboration|faculty_role` and `sort_direction=asc|desc`. Either parameter alone, empty supplied values, unknown fields, non-lowercase directions and injection-shaped values return HTTP 400 with the existing `invalid_insight_dimension` error code. Omitting both retains backward-compatible defaults. Responses retain the existing `sort` string (`document_id_asc` by default) and add `sort_field`/`sort_direction` echoes. The frontend rejects a requested sorted response that silently reports the default order.

The existing read-only snapshot is still loaded and hashed in document ID order. Only a separate matching slice is reordered after revision validation, dimensions and local search. No SQL sort expressions use request input. There are no added database queries, migrations, permission changes, counting changes or summary filter changes. Sorting adds O(n log n) comparison work and O(n) precomputed keys over the already-loaded matching population.

## State and interactions

- Sort changes reset to page 1 while preserving applied filters, clicked dimensions, local search, page size and label.
- Page navigation, page-size changes, search, clearing search and retry retain the selected sort.
- HTTP 409 recovery refreshes the shared summary using only its applied filters, then reopens the same search/dimensions/page size/sort at page 1. Recovery remains bounded to one automatic attempt.
- Abort signals and the existing page/summary generation guards ignore late results and late revision conflicts. Closing the dialog aborts pending sorting.
- Sorting resets vertical scroll and expanded evidence, while retaining horizontal table position so the selected right-hand header stays visible on mobile.
- Existing counts, detail expansion, safe links, donut selections and modal focus/closing behavior remain intact.

The permissions merge was inspected. The old integration guard fixture assumed admin role alone was enough; it now supplies effective permissions and verifies both teacher/admin roles with and without the required dashboard grant. Only that test changed, not middleware or routes.

## Verification and evidence

Browser checks use the development-only faculty fixture page with 512 synthetic records and blocked API requests. Backend integration tests use isolated SQLite fixtures with 246 eligible records. Their title examples deliberately place first sorted records beyond default page 200, include case-insensitive ties and null/blank titles, and check coverage across pages without duplicates. These tests do not claim live Scopus totals or MariaDB performance measurements.

| Verification | Result | Evidence |
| --- | --- | --- |
| Frontend `node --test` | 120 passed, 0 failed, including six new sorting/state tests | [Log](faculty-drilldown-sort-evidence/unit-tests.txt) |
| New desktop/mobile sorting tour | 8 passed, 0 page errors | [Checks and capture list](faculty-drilldown-sort-evidence/browser-checks.json) |
| Existing faculty refinement/modal/search regression | 8 passed, 0 page errors | [Checks](faculty-drilldown-sort-evidence/refinement-regression/browser-checks.json) |
| Backend controllers/models/services/routes/insights CLI regression, CGO disabled | Passed; models compile | [Log](../../fund-management-api/docs/faculty-drilldown-sort-evidence/backend-regression.txt) |
| Backend full `insight_integration` controllers/services/routes suite, GOARCH=386 with installed GCC | Passed | [Log](../../fund-management-api/docs/faculty-drilldown-sort-evidence/backend-integration.txt) |
| Isolated production build, including lint/type checks and 37 static pages | Passed, exit 0 | [Log](faculty-drilldown-sort-evidence/production-build.txt) |

The browser tour covers every field in both directions, page reset and coverage, beyond-page-200 sorting, ties/missing values, search plus year/international/role dimensions, page size, rapid clicks, 409 recovery, error retry, keyboard activation, mobile touch, contained horizontal scrolling and visible sort indicators. Backend tests separately verify strict allowlisting, Unicode/case ties, numeric years, composite country/status keys, global missing-last behavior, all fields and both directions, default compatibility, full searched population before paging, and unchanged summary revision.

Visual review included [desktop title ascending](faculty-drilldown-sort-evidence/desktop-title-ascending.png), [desktop descending last page](faculty-drilldown-sort-evidence/desktop-title-descending-last-page.png), [desktop role descending](faculty-drilldown-sort-evidence/desktop-role-descending.png), [mobile title ascending](faculty-drilldown-sort-evidence/mobile-title-ascending.png) and [mobile role ascending with horizontal position retained](faculty-drilldown-sort-evidence/mobile-role-ascending.png). Additional [mobile full-page context](faculty-drilldown-sort-evidence/mobile-full-page.png), [revision recovery](faculty-drilldown-sort-evidence/desktop-revision-recovery.png), [search/dimensions](faculty-drilldown-sort-evidence/desktop-search-dimensions.png) and [retry](faculty-drilldown-sort-evidence/desktop-sort-retry.png) captures are included.

## Reproduction and boundaries

Use `SCOPUS_PREVIEW_NAME=.scopus-sort-preview-4cc66f8` with `node scripts/prepare-faculty-copy-preview.mjs` from the frontend. The owned sibling snapshot omits environment files and links installed dependencies. Stop an owned preview before re-syncing its app source. Start the snapshot on a free loopback port, set `SCOPUS_UI_ORIGIN` and `SCOPUS_UI_PLAYWRIGHT_PATH`, then run `node scripts/check-faculty-drilldown-sort-ui.mjs`. For the existing regression script, set `SCOPUS_UI_EVIDENCE_DIR` to preserve earlier captures. Stop the owned preview before building the snapshot.

Backend commands are `CGO_ENABLED=0 go test ./controllers ./models ./services ./routes ./cmd/scopus-core-insights -count=1` and `GOARCH=386 CGO_ENABLED=1 CC=F:\MinGW\bin\gcc.exe go test -tags insight_integration ./controllers ./services ./routes -count=1`. The installed compiler is 32-bit. Initial restricted mock-server/compiler attempts failed; the documented compiler configuration and allowed local-test access passed. No dependency was installed.

The user's services on ports 3000 and 8080 were not stopped or restarted, and their serving cache was not modified. Verification used only the owned preview on 3121 and its separate `.next`. No live database writes, deploy, push or commit was performed. Earlier evidence and reports remain untouched. Manager acceptance and commit remain outstanding.
