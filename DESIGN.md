---
name: Research Fund Management Platform
description: A bilingual, multi-role university system for research funding, publication rewards, MOU, and research-output data.
colors:
  primary: "#2563eb"
  primary-deep: "#1d4ed8"
  primary-ring: "#3b82f6"
  primary-tint: "#eff6ff"
  ink-strong: "#0f172a"
  ink: "#334155"
  ink-muted: "#64748b"
  border: "#cbd5e1"
  border-subtle: "#e2e8f0"
  surface: "#ffffff"
  surface-subtle: "#f1f5f9"
  canvas: "#f5f7fb"
  success: "#16a34a"
  success-tint: "#dcfce7"
  success-ink: "#166534"
  danger: "#dc2626"
  danger-tint: "#fee2e2"
  danger-ink: "#991b1b"
  warning-tint: "#fef9c3"
  warning-ink: "#854d0e"
typography:
  display:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  headline:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  subheading:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
  title:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  pageTitle:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
  metric:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "24px"
  badge-approved:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success-ink}"
    rounded: "{rounded.sm}"
    padding: "2px 10px"
---

# Design System: Research Fund Management Platform

## Overview

**Creative North Star: "Academic Modern"**

This is a working system for a university's research office — the place where faculty submit fund applications and reward claims, staff process them, department reviewers endorse, and executives watch the numbers. The design should read like a well-run institution: clean, modern, confident, and above all *trustworthy*. A researcher filling in a claim and an executive scanning a dashboard should both feel the interface is on their side — orderly, legible, and never showing off.

It is Operate-mode software. Expression lives in precision, not decoration: consistent spacing, one calm accent, generous whitespace around dense data, and typography that stays readable across long Thai and English strings alike. The workhorse is Anuphan, a humanist sans that carries Thai and Latin with the same even texture — the single most important reason the UI feels coherent across both languages.

The system is being consolidated. Today the code mixes two neutral families (gray and slate) and reaches for gradients and a scattered set of accent colors; this document sets the target it should converge on. Depth is flat by default — surfaces are separated by hairline borders, and shadow is a response to interaction, not a permanent costume.

**Key Characteristics:**
- One calm blue accent; semantic color reserved for status meaning, not mood.
- Slate as the single neutral ramp — no parallel gray family.
- Flat surfaces divided by 1px borders; shadow appears only on hover/focus/overlay.
- Bilingual by construction — layouts survive Thai↔English length shifts.
- Data density handled with whitespace and rhythm, not boxes-within-boxes.

## Colors

A restrained palette: one blue accent over a slate neutral ramp, with semantic colors held in reserve for status only.

### Primary
- **Confident Blue** (#2563eb): The single interactive accent — primary buttons, active nav, links, selected rows, key figures. It marks *what you can act on*, so it stays scarce.
- **Deep Blue** (#1d4ed8): Pressed and hover state of the primary accent.
- **Focus Blue** (#3b82f6): Focus ring only (`box-shadow` glow), never a fill.
- **Blue Tint** (#eff6ff): Soft background for selected/hovered rows, info callouts, and quiet primary-adjacent surfaces.

### Neutral
- **Ink** (#0f172a): Primary text — headings and body at full strength.
- **Slate** (#334155): Standard body and label text.
- **Muted Slate** (#64748b): Secondary text, captions, placeholder, and de-emphasized metadata.
- **Border** (#cbd5e1): Default 1px separators around inputs, cards, and table cells.
- **Subtle Border** (#e2e8f0): Faint dividers inside dense groupings.
- **Surface** (#ffffff): Cards, tables, modals, form fields.
- **Subtle Surface** (#f1f5f9): Table headers, secondary buttons, inset zones.
- **Canvas** (#f5f7fb): The page background the whole app sits on.

### Semantic (status only)
- **Success Green** (#16a34a / tint #dcfce7 / ink #166534): Approved states, positive confirmations.
- **Danger Red** (#dc2626 / tint #fee2e2 / ink #991b1b): Rejected states, destructive actions, errors.
- **Warning** (tint #fef9c3 / ink #854d0e): Pending / awaiting-review states.

### Named Rules
**The One Accent Rule.** Blue is the only decorative color. If something is neither interactive nor a status signal, it is slate — not teal, indigo, cyan, or violet. Competing accents are the fastest way this UI slips back into looking machine-generated.

**The Status-Only Color Rule.** Green, red, and yellow carry *meaning* (approved / rejected / pending). Never use them decoratively; a green button that doesn't mean "approve" is a bug.

## Typography

**UI Font:** Anuphan (with `sans-serif` fallback) — humanist sans covering Thai + Latin evenly.
**Secondary/Display (Latin):** Raleway (loaded; use sparingly for English-only display moments, never for Thai).
**Document Font:** TH Sarabun New — reserved for generated PDF/DOCX output (official Thai document standard), **not** screen UI.

**Character:** Anuphan keeps Thai and English at the same visual weight and rhythm, so bilingual screens never feel like two fonts stitched together. Hierarchy comes from size and weight, not from switching families.

### Hierarchy
- **Display** (600, 1.5rem/24px, 1.25): Page titles, dashboard section heads.
- **Page title** (600, 1.875rem/30px, 1.25): Primary titles on spacious landing and overview surfaces.
- **Metric** (700, 2.25rem/36px, 1.15): Standalone dashboard figures only.
- **Headline** (600, 1.25rem/20px, 1.3): Card and panel titles.
- **Subheading** (600, 1.125rem/18px, 1.5): Compact section titles and prominent controls.
- **Title** (600, 1rem/16px, 1.4): Form-group and table-block labels.
- **Body** (400, 0.875rem/14px, 1.6): Default reading and data text.
- **Label** (500, 0.75rem/12px, 1.4): Field labels, badges, table headers, metadata.

### Named Rules
**The Two-Family Ceiling Rule.** Anuphan for anything a user reads on screen; TH Sarabun New only inside generated documents. No third UI typeface.

## Layout

A single-column app shell with a persistent side navigation and a fluid content area. Content sits on the **Canvas** (#f5f7fb); working material lives on white **Surface** cards. Spacing follows an 8px rhythm — `sm` 8px, `md` 16px, `lg` 24px — with 24px as the standard card padding and gutter. Dense tables and forms are given room to breathe rather than compressed; the responsive grid collapses from four columns down to one (`grid-cols-1 → md:2 → lg:3 → xl:4`). Because copy switches between Thai and English, containers size to content and wrap gracefully — never fix a control's width to a specific label length.

## Elevation & Depth

**Flat by default.** Surfaces are distinguished by 1px slate borders and background contrast (Canvas vs. Surface), not by resting shadows. Depth is a *response to interaction*, not a permanent layer.

### Shadow Vocabulary
- **Hover lift** (`box-shadow: 0 4px 12px rgba(15,23,42,0.08)`): Appears when a card or row becomes interactive under the cursor.
- **Overlay** (`box-shadow: 0 12px 32px rgba(15,23,42,0.16)`): Modals, dropdowns, popovers — things that float above the page.
- **Focus ring** (`box-shadow: 0 0 0 3px rgba(59,130,246,0.35)`): Keyboard/focus indication on inputs and buttons.

### Named Rules
**The Flat-At-Rest Rule.** A card sitting still casts no shadow — a border defines it. Shadows mean "this is hovering, floating, or focused." A resting `shadow-md` everywhere is exactly the generic look we're leaving behind.

## Shapes

Gently rounded, consistent geometry: 8px (`md`) on the vast majority of controls — buttons, inputs, cards, table containers. Small chips and badges use 6px (`sm`); large feature panels may use 12px (`lg`). Borders are hairline (1px) and slate-toned. No pill-shaped buttons, no sharp 0px corners, no decorative clipping — one radius language throughout keeps the system calm.

## Components

### Buttons
- **Shape:** Rounded (8px), no border on filled variants.
- **Primary:** Confident Blue (#2563eb) fill, white text, 8px 16px padding. The only strong-colored button on a screen — one primary action per view.
- **Hover / Focus:** Darkens to Deep Blue (#1d4ed8); focus adds the blue focus ring. No gradient, no lift-on-rest.
- **Secondary:** Subtle Surface (#f1f5f9) fill, slate text — for cancel/back and lower-priority actions.
- **Danger:** Danger Red fill, reserved for destructive confirmation.

### Cards / Containers
- **Corner:** 8px.
- **Background:** Surface white on the Canvas.
- **Shadow Strategy:** None at rest (see Elevation) — a 1px Subtle Border defines the edge; hover lift only when interactive.
- **Internal Padding:** 24px (`lg`).

### Inputs / Fields
- **Style:** White surface, 1px Border (#cbd5e1), 8px radius, 8px 16px padding.
- **Label:** Label style, slate, 8px below-gap to the field.
- **Focus:** Border shifts to Focus Blue plus a 3px blue ring; no border-color removal.
- **Error:** Danger Red border + Danger-ink helper text beneath.

### Tables
- **Header:** Subtle Surface (#f1f5f9) background, Label-style slate text.
- **Row:** 1px Subtle Border divider; hover tints to Blue Tint (#eff6ff).
- **Density:** Comfortable — vertical padding never below 8px.

### Status Badges
- **Shape:** 6px radius, 2px 10px padding, Label typography.
- **Approved:** Success tint bg / Success ink text. **Pending:** Warning tint / Warning ink. **Rejected:** Danger tint / Danger ink.

### Navigation (side)
- **Style:** Vertical list on Surface; items in slate, Body weight.
- **Active:** Blue Tint background + Confident Blue text/indicator.
- **Hover:** Subtle Surface background.

## Do's and Don'ts

### Do:
- **Do** use Confident Blue (#2563eb) as the *only* accent; everything non-interactive and non-status is slate.
- **Do** consolidate all neutrals to the slate ramp — replace stray `gray-*` usages with their slate equivalents.
- **Do** keep surfaces flat at rest and let 1px borders do the separating; add shadow only for hover, focus, and overlays.
- **Do** reserve green/red/yellow for their status meanings (approved / rejected / pending).
- **Do** size containers to content so Thai and English labels both fit without truncation.
- **Do** keep one primary button per view.

### Don't:
- **Don't** add gradients. The incumbent code has ~70 gradient usages; they are the single biggest "AI-generated" tell here and should be retired, not extended.
- **Don't** introduce new accent hues (teal, cyan, indigo, violet, emerald-as-decoration). New color = new inconsistency.
- **Don't** mix `gray-*` and `slate-*` on the same surface; pick slate.
- **Don't** put resting `shadow-md` on every card by reflex.
- **Don't** use TH Sarabun New or Raleway for on-screen Thai UI — Anuphan is the UI voice.
- **Don't** hard-code widths to a label's length; it will break in the other language.
