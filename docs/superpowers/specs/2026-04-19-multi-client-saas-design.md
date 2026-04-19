# Multi-Client SaaS Design: system-calculator

## Context

The current project is a React SPA price calculator driven by a Google Sheets CSV, configured via a single `VITE_SHEET_URL` env var. The goal is to turn it into a SaaS platform where multiple clients self-sign-up, each connecting their own Google Sheet(s) and getting shareable public calculator URLs. Monetization via monthly subscription tiers (Free / Basic / Pro). Backend in Kotlin + Spring Boot, database on Supabase PostgreSQL, frontend is the existing React SPA extended.

---

## Monorepo Structure

```
system-calculator/
├── frontend/          # existing React SPA (files moved here)
├── backend/           # new Kotlin + Spring Boot API (Gradle)
├── docs/
│   └── superpowers/
│       └── specs/
└── README.md
```

---

## Section 1: Architecture

**Frontend** (React SPA, this repo extended)
- Routes: `/`, `/login`, `/register`, `/dashboard`, `/dashboard/new`, `/dashboard/{id}`, `/dashboard/billing`, `/c/{tenantSlug}/{calcSlug}`
- Public calculator at `/c/{tenant}/{calc}` fetches config from API, then fetches CSV client-side (same as today)

**Backend** (Kotlin + Spring Boot)
- REST API: auth (JWT), tenant CRUD, calculator CRUD, plan enforcement, Stripe integration
- Supabase used only as hosted PostgreSQL via JDBC/JPA — no Supabase SDK

**Database** (Supabase PostgreSQL)

---

## Section 2: Data Model

```sql
tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR UNIQUE NOT NULL,   -- used in URLs: /c/acme/...
  name         VARCHAR NOT NULL,
  plan         VARCHAR NOT NULL DEFAULT 'free',
  created_at   TIMESTAMP DEFAULT now()
)

users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants ON DELETE CASCADE,
  email         VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,                           -- nullable: not set for Google OAuth users
  google_sub    VARCHAR UNIQUE,                    -- Google unique user ID, null for email/password users
  role          VARCHAR NOT NULL DEFAULT 'owner'   -- 'owner' | 'member'
)

calculators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants ON DELETE CASCADE,
  slug        VARCHAR NOT NULL,
  name        VARCHAR NOT NULL,
  sheet_url   VARCHAR NOT NULL,
  settings    JSONB NOT NULL DEFAULT '{}',    -- { currency, locale }
  branding    JSONB NOT NULL DEFAULT '{}',    -- { primaryColor, logo, companyName }
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP DEFAULT now(),
  UNIQUE(tenant_id, slug)
)

subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID REFERENCES tenants ON DELETE CASCADE UNIQUE,
  stripe_subscription_id VARCHAR,
  plan                   VARCHAR NOT NULL DEFAULT 'free',
  status                 VARCHAR NOT NULL DEFAULT 'active',  -- 'active' | 'canceled' | 'past_due'
  current_period_end     TIMESTAMP
)
```

---

## Section 3: API Endpoints

### Public (no auth)
```
POST  /api/auth/register                          # creates tenant + owner user, returns JWT
POST  /api/auth/login                             # returns JWT
POST  /api/auth/google                            # exchanges Google ID token for app JWT (creates tenant+user on first login)
GET   /api/public/{tenantSlug}/{calcSlug}         # returns { sheetUrl, settings, branding } for public calculator page
```

### Protected (JWT Bearer)
```
GET    /api/calculators                           # list tenant's calculators
POST   /api/calculators                           # create (enforces plan limit)
PUT    /api/calculators/{id}                      # update
DELETE /api/calculators/{id}                      # delete
GET    /api/billing/checkout                      # returns Stripe checkout session URL
GET    /api/billing/portal                        # returns Stripe customer portal URL
GET    /api/tenants/me                            # get current tenant info
```

### Webhooks
```
POST  /api/webhooks/stripe                        # handle subscription.updated, subscription.deleted
```

---

## Section 4: Plan Tiers

| Plan  | Price   | Calculators | Custom Branding | Watermark |
|-------|---------|-------------|-----------------|-----------|
| Free  | €0      | 1           | No              | Yes       |
| Basic | ~€15/mo | 3           | No              | No        |
| Pro   | ~€49/mo | Unlimited   | Yes (color, logo, companyName) | No |

Plan limits enforced in `POST /api/calculators` — rejects if tenant is at limit.

---

## Section 5: Frontend Changes

### What stays the same
- `src/utils/filters.ts` — all filter/price matching logic unchanged
- `src/components/PriceCalculator.tsx`, `FilterSelect.tsx`, `PriceDisplay.tsx`, `PriceSummary.tsx` — core calculator UI unchanged (props only added)

### What changes

1. **Repo restructure**: all current files move into `frontend/`

2. **`VITE_SHEET_URL` removed**: replaced by new hook `useTenantCalculator(tenantSlug, calcSlug)` that calls `GET /api/public/{tenantSlug}/{calcSlug}` and returns `{ sheetUrl, settings, branding }`. `sheetUrl` passed into existing `useSheetData`.

3. **Currency + locale become props**: `PriceDisplay.tsx` currently hardcodes `"€"` and `"es-ES"`. These become props driven by `settings.currency` and `settings.locale` from the API response.

4. **Branding (Pro only)**:
   - `branding.primaryColor` applied as CSS custom property override (`--color-gold`) on the calculator page
   - `branding.logo` replaces the diamond icon in the header
   - `branding.companyName` replaces the platform name in the calculator header

5. **Watermark (Free plan)**: small "Powered by [Platform]" footer on the public calculator page. Hidden on Basic+.

6. **Auth**: login/register pages include a "Sign in with Google" button (Google Identity Services JS SDK). On success, the Google ID token is sent to `POST /api/auth/google` which verifies it server-side and returns an app JWT.

7. **New pages**:
   - `/` — marketing/landing page
   - `/login`, `/register` — auth forms
   - `/dashboard` — lists tenant's calculators with edit/delete
   - `/dashboard/new` — create calculator (name, slug, sheet URL, settings)
   - `/dashboard/{id}` — edit calculator
   - `/dashboard/billing` — current plan, upgrade/manage via Stripe portal link

---

## Section 6: Public Calculator Flow (end-to-end)

1. User visits `/c/acme/diamond-ring`
2. `useTenantCalculator("acme", "diamond-ring")` calls `GET /api/public/acme/diamond-ring`
3. API returns `{ sheetUrl, settings: { currency: "€", locale: "es-ES" }, branding: { companyName: "Acme Jewels", primaryColor: "#c9a84c", logo: null } }`
4. `useSheetData(sheetUrl)` fetches CSV from Google Sheets client-side (unchanged)
5. Calculator renders with Acme branding (Pro) or platform branding (Free/Basic)

---

## Verification

1. **Register flow**: POST `/api/auth/register` → tenant + user created in DB → JWT returned → dashboard accessible
2. **Calculator create + public view**: create calculator via dashboard → visit `/c/{slug}/{calcSlug}` → price calculator loads with correct data
3. **Plan enforcement**: on Free plan, attempt to create 2nd calculator → API returns 403
4. **Branding**: Pro tenant → `primaryColor` applied to CSS variable → calculator shows company name
5. **Watermark**: Free tenant public calculator shows "Powered by" footer; Basic does not
6. **Stripe**: click upgrade → redirected to Stripe checkout → webhook updates `subscriptions` table → plan limit increases
