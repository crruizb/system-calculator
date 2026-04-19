# calc-prices

A React SPA that renders a dynamic price calculator driven by a Google Sheets CSV. No backend — all filtering happens client-side.

## Setup

```bash
pnpm install
```

Create a `.env` file at the project root:

```env
VITE_SHEET_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv
```

The sheet must have a `precio` column. All other columns become sequential filter dropdowns in the order they appear.

## Commands

```bash
pnpm run dev       # Start dev server (Vite HMR)
pnpm run build     # Production build → dist/
pnpm run preview   # Serve production build locally
pnpm run lint      # ESLint
```

## How it works

1. `useSheetData` fetches the CSV via PapaParse and caches it in `localStorage` (10-second TTL, stale-while-revalidate). Falls back to cached data on error, or to hardcoded demo data if nothing is available.
2. `PriceCalculator` reads all columns except `precio` as filter fields. Dropdowns are sequential — each one is locked until the previous is selected.
3. `getFilteredValues` narrows each dropdown to only valid combinations given current selections.
4. `matchPrice` looks for an exact row match across all filter fields and returns its `precio` value.

## Adding a new filter dimension

No code change needed — just add a column to the Google Sheet. The UI auto-generates dropdowns from the CSV headers.

## Demo mode

If `VITE_SHEET_URL` is unset or empty, the app renders with built-in demo data and shows a banner.

## Deploying

Set `VITE_SHEET_URL` in your hosting environment (Vercel, Netlify, etc.) — no code change required per client.
