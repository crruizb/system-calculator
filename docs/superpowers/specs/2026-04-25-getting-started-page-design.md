# Getting Started Page — Design Spec

**Date:** 2026-04-25
**Branch:** improve-ui

## Goal

Public page at `/guide` that walks a new user through three steps: creating the Google Sheet, publishing it as CSV, and creating their first calculator. Removes the current "where do I get this URL?" friction at the CalculatorForm.

---

## Routing & File

- New file: `frontend/src/pages/GettingStarted.tsx`
- Public route added to `App.tsx`: `<Route path="/guide" element={<GettingStarted />} />`
- No auth required.

---

## Language / i18n

- Content stored in a single `content` object at the top of the file, keyed by locale (`en` | `es`).
- Active locale driven by `?lang=es` query param; defaults to `en`.
- No i18n library introduced now — the structure makes swapping one in a one-file change.
- A small `EN | ES` pill toggle in the page body sets the query param.

---

## Page Structure

Reuses the same shell as Landing:
- Same `data-theme` + `useTheme` pattern
- Same header (logo, "Sign in", theme toggle, "Get started free" CTA)
- Same footer
- Same CSS custom properties (`--color-gold`, `--color-surface`, etc.)

Body: three full-width step sections, then a CTA section.

---

## Steps

### Step 1 — Create your Google Sheet

**Text:** Explain the sheet format rules:
- Must have a `precio` column (the result).
- Every other column becomes a filter dropdown, in column order.
- Each unique combination of values in a row maps to one price.

**Visual:** Reuse `SheetMockup` component from `Landing.tsx` (extract to shared component or duplicate).

**Layout:** text left, visual right on desktop; stacked on mobile.

---

### Step 2 — Publish it as CSV

**Text:** Step-by-step:
1. File → Share → Publish to web
2. Select the sheet tab
3. Choose "Comma-separated values (.csv)" format
4. Click Publish → copy the URL

**Visual:** Static JSX mockup of the Google Sheets "Publish to web" dialog — grey toolbar, dropdown showing "Comma-separated values (.csv)", a URL field with a sample CSV URL, a "Publish" button. No real image; pure JSX matching the `SheetMockup` style.

**Layout:** text right, visual left on desktop (alternating); stacked on mobile.

---

### Step 3 — Create your calculator

**Text:** In the dashboard, click "+ New Calculator", paste the CSV URL, give it a name, click Create. Your calculator is live at `/c/{tenant}/{slug}`.

**Visual:** Reuse `CalculatorMockup` component from `Landing.tsx`.

**Layout:** text left, visual right on desktop; stacked on mobile.

---

## CTA Section

Below the three steps: centered heading "Ready to try it?" + "Create your first calculator" button → `/register`.

---

## Step Visual Style

- Step number displayed as large muted numeral (`01`, `02`, `03`) in uppercase tracking style matching Landing's section labels.
- Each step is a full-width section separated by `border-top: 1px solid var(--color-border-line)`.
- Alternating text/visual layout: step 1 = text-left, step 2 = text-right, step 3 = text-left.

---

## Linking

| Location | Change |
|---|---|
| Landing nav | Add "Guide" link between "Sign in" and the theme toggle |
| Dashboard empty state | Replace plain text with text + `<Link to='/guide'>See how to set up your sheet →</Link>` |
| CalculatorForm Sheet URL label | Add `<a href='/guide' target='_blank'>How do I get this URL?</a>` below the label |

---

## Shared Components

`SheetMockup` and `CalculatorMockup` currently live inline in `Landing.tsx`. Options:
- **Extract** both to `frontend/src/components/` and import from both Landing and GettingStarted.
- **Duplicate** them in GettingStarted.

Extraction is cleaner and avoids drift. The implementation plan should extract both.

---

## Constraints

- No new dependencies.
- Matches existing dark/light theme via CSS vars.
- No backend changes.
- No frontend test suite configured — no tests required.
