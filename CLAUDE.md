# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (root directory)

```bash
pnpm run dev       # Start dev server (Vite HMR)
pnpm run build     # Production build → dist/
pnpm run preview   # Serve production build locally
pnpm run lint      # ESLint
```

No frontend test suite is configured.

### Backend (`backend/` directory)

```bash
./gradlew bootRun                          # Start Spring Boot dev server
./gradlew build                            # Full build (compile + test + jar)
./gradlew compileKotlin compileTestKotlin  # Compile only (fast check)
./gradlew test                             # Run tests
```

## Architecture

This is a monorepo containing:

- **Frontend** (root): A React SPA that renders a dynamic price calculator driven by a Google Sheets CSV.
- **Backend** (`backend/`): A Spring Boot (Kotlin) REST API with PostgreSQL, JWT authentication, multi-tenancy, and Flyway migrations.

### Frontend data flow

1. `useSheetData` (hook) fetches the CSV from a public Google Sheets URL via PapaParse.
2. Data is cached in `localStorage` (10-second TTL) with stale-while-revalidate. Falls back to cached data on error, or to hardcoded `DEMO_DATA` if nothing is available.
3. `PriceCalculator` (the only meaningful component) reads all columns except `precio` as filter fields. Filters are sequential: each dropdown is locked until the previous one is selected.
4. `getFilteredValues` (utils/filters.js) narrows each dropdown's options to only valid combinations given current selections.
5. `matchPrice` looks for an exact row match across all filter fields and returns its `precio` value.

**Configuring the data source:**
Set `VITE_SHEET_URL` in a `.env` file at the project root (or in your deployment environment) to the CSV export URL of the client's sheet. The sheet must have a `precio` column; all other columns become filter dropdowns in column order.

**Adding a new column/dimension:**
No code change needed — just add the column to the Google Sheet. The UI auto-generates dropdowns from the CSV headers.

### Backend architecture

- Spring Boot 3 / Kotlin / JPA (Hibernate) with PostgreSQL
- JWT-based stateless authentication; tenant ID stored in `auth.details` for multi-tenant isolation
- Flyway manages schema migrations (`backend/src/main/resources/db/migration/`)
- CORS is configured to allow all origins (suitable for development; tighten for production)
