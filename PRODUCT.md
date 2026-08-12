# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal multi-role platform serving all roles roughly equally — no single dominant persona. Every role authenticates through one shared login (with forgot / reset password) and lands in the surfaces its role permits.

- **Members** (researchers / faculty): submit research-fund applications and publication-reward claims; track their own submission status and notifications.
- **Department reviewers**: review and endorse submissions from their department before they advance.
- **Admins / staff**: process applications, approve or reject, configure fund types and master data, run imports/exports.
- **Executives**: view organization-wide dashboards and analytics for oversight and high-level approval.

The system must serve each role's distinct task well rather than optimizing for one.

## Product Purpose

A single centralized platform for a university's research-funding and research-output operations. It consolidates what would otherwise be separate systems into one: research-fund application workflow, publication-reward claims, MOU / collaboration management, researcher master data, and Scopus-based publication data and dashboards. Success means every role completes its work — submit, review, approve, oversee — in one place, without switching tools or re-entering data.

## Positioning

Not a market product; an internal institutional system. Its distinguishing value is breadth of integration — fund workflow, reward claims, MOU/OKR, researcher management, and external Scopus publication data behind one login and one role model — rather than any single best-of-breed feature.

## Operating Context

- Web app (Next.js App Router), used primarily on desktop by university staff and faculty during administrative work.
- End-to-end approval workflows with multiple stages and roles (submit → department review → admin → executive).
- Data-heavy surfaces: tables (DataTables / react-data-table), charts (ApexCharts), rich-text editing (TipTap / CKEditor), document generation (docx, pdf-lib), file upload and export.
- Integrates external Scopus publication data for researcher output and executive dashboards.

## Capabilities and Constraints

Confirmed modules (all implemented in the running codebase):

- Research fund system — member / admin / executive / department-review flows.
- Publication-reward claims.
- MOU management — activities, types, OKR, notifications, dashboards.
- Researcher management — researchers, instructors, sources, weights, courses, audit.
- Publication search & detail (Scopus).
- Supporting pages — external fund, content, links.

Constraints future work must preserve:

- **Bilingual (Thai + English)** UI is a hard requirement — layouts, typography, and components must handle both scripts and the length differences between languages.
- The multi-role permission model is product truth — role determines which surfaces and actions are available.
- Existing stack: Next.js + React with a mix of Tailwind, Bootstrap, and Flowbite currently in use (a known source of visual inconsistency to reconcile, not a mandate to keep all three).

Explicitly undecided (do not invent):

- Whether a specific institution's brand (name, colors, logo) is binding. The team did not bind the system to one during init; treat brand identity as open until confirmed.

## Evidence on Hand

- A real, running codebase implementing every module above (routes under `app/(portal)/...`).
- No marketing content, testimonials, pricing, licensing, or external claims — this is internal software; future work must not fabricate any of these.

## Product Principles

1. **One system, many roles** — every role's core task must be completable here without leaving; no role is a second-class citizen.
2. **Clarity over expression** — this is Operate-mode software; scanability, consistency, and correct data density outrank decoration.
3. **Bilingual by construction** — never assume Thai-only or English-only; design for both scripts and for text that changes length between languages.
4. **Preserve the workflow of record** — approval stages, roles, and data relationships are product truth; refinements must not break them.

## Accessibility & Inclusion

Bilingual Thai/English support is a confirmed inclusion requirement. No other specific standard was established during init; WCAG 2.1 AA is adopted as a sensible baseline for an institutional tool (assumed, not mandated — confirm if a formal standard applies).
