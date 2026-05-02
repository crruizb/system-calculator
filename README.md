# Prexario (system-calculator)

A SaaS price calculator platform. Users can create, customize and publish interactive price calculators, embed them on their own sites, and manage subscriptions.

## Tech Stack

### Frontend

- **React 19** + **TypeScript**
- **Vite** (build tool & dev server)
- **Tailwind CSS v4**
- **React Router v7**
- **TanStack Query (React Query)** v5
- **i18next** + **react-i18next** (internationalization)
- **Axios** (HTTP client)
- **PapaParse** (CSV import)
- **Vitest** + **Testing Library** + **jsdom** (testing)
- **ESLint** v9 with TypeScript support

### Backend

- **Kotlin 2.0.21** on **JVM 21**
- **Spring Boot 3.3.5**
  - Spring Web (REST API)
  - Spring Security + OAuth2 Client
  - Spring Data JPA
  - Spring Validation
- **PostgreSQL 16** (database)
- **Flyway** (database migrations)
- **JJWT** (JWT tokens)
- **Stripe Java SDK** (payments & subscriptions)
- **OpenPDF + Flying Saucer** (PDF generation)
- **Kotlinx Coroutines**
- **Testcontainers** (integration testing)

### DevOps

- **Docker** multi-stage build (backend)
- **Docker Compose** (local PostgreSQL + backend orchestration)
- **GitHub Actions** CI/CD
- **DockerHub** image registry

## Features

- **Authentication**: email/password registration with email verification, Google OAuth2 SSO, JWT access tokens + refresh tokens
- **Tenant system**: multi-tenant architecture with slug-based public URLs
- **Calculator builder**: create and edit price calculators with dynamic pricing logic
- **Public calculators**: share calculators via `/c/:tenantSlug/:calcSlug`
- **CSV import**: bulk import calculator data
- **PDF export**: generate branded PDF quotes from calculators
- **Subscriptions**: Stripe-powered billing with Basic / Pro plans
- **Embed mode**: calculators can be embedded on external sites
- **Dark/light theme**: full theming support
- **Responsive UI**: mobile-first design with Tailwind CSS
- **i18n ready**: internationalization infrastructure in place

## Project Structure

```
system-calculator/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── api/           # Axios client, TanStack Query hooks
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth & Theme providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── i18n/          # Translation files
│   │   ├── pages/         # Route-level pages
│   │   ├── test/          # Unit & integration tests
│   │   └── utils/         # Helpers
│   ├── public/            # Static assets
│   └── Dockerfile (none, static build)
├── backend/               # Spring Boot application
│   ├── src/main/kotlin/com/systemcalculator/
│   │   ├── auth/          # Auth controllers, JWT, OAuth2, email verification
│   │   ├── billing/       # Stripe webhooks & billing endpoints
│   │   ├── calculator/    # Calculator domain (entity, service, controller, DTOs)
│   │   ├── config/        # Security, JWT service, coroutine scope
│   │   ├── email/         # Email abstraction & Resend implementation
│   │   ├── exception/     # Global exception handling
│   │   ├── pdf/           # PDF generation service
│   │   ├── subscription/  # Stripe subscription entity & service
│   │   ├── tenant/        # Tenant entity & controller
│   │   └── user/          # User entity & repository
│   ├── src/main/resources/
│   │   └── db/migration/  # Flyway migrations (V1..V4)
│   ├── src/test/          # Backend tests
│   └── Dockerfile         # Multi-stage Docker build
├── .github/workflows/
│   └── ci.yml             # GitHub Actions: lint, test, build, docker push
├── docker-compose.yml     # Local orchestration
├── .env.example           # Root env template
└── docs/                  # Specs & implementation plans
```

## Environment Variables

Copy `.env.example` to `.env` (root) and `backend/.env.example` to `backend/.env`, then fill in your secrets.

### Root `.env`

| Variable                | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `JWT_SECRET`            | 256-bit secret for signing JWTs                           |
| `GOOGLE_CLIENT_ID`      | Google OAuth2 client ID                                   |
| `STRIPE_SECRET_KEY`     | Stripe secret key (`sk_test_...` or `sk_live_...`)        |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret                            |
| `STRIPE_BASIC_PRICE_ID` | Stripe Price ID for Basic plan                            |
| `STRIPE_PRO_PRICE_ID`   | Stripe Price ID for Pro plan                              |
| `APP_BASE_URL`          | Public URL of the frontend (e.g. `http://localhost:5173`) |
| `PREX_BACKEND_BASE_URL` | Public URL of the backend (e.g. `http://localhost:8080`)  |

### Backend `.env` / Spring Boot Config

| Variable                     | Description                             | Default                                             |
| ---------------------------- | --------------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`               | JDBC URL for PostgreSQL                 | `jdbc:postgresql://localhost:5432/systemcalculator` |
| `DATABASE_USERNAME`          | DB user                                 | `postgres`                                          |
| `DATABASE_PASSWORD`          | DB password                             | `postgres`                                          |
| `PREX_JWT_SECRET`            | JWT signing secret                      | `change-me...`                                      |
| `PREX_GOOGLE_CLIENT_ID`      | Google OAuth2 client ID                 | —                                                   |
| `PREX_GOOGLE_CLIENT_SECRET`  | Google OAuth2 client secret             | —                                                   |
| `PREX_STRIPE_SECRET_KEY`     | Stripe secret key                       | —                                                   |
| `PREX_STRIPE_WEBHOOK_SECRET` | Stripe webhook secret                   | —                                                   |
| `PREX_STRIPE_BASIC_PRICE_ID` | Stripe Basic price ID                   | —                                                   |
| `PREX_STRIPE_PRO_PRICE_ID`   | Stripe Pro price ID                     | —                                                   |
| `PREX_FRONTEND_URL`          | Frontend URL                            | `http://localhost:5173`                             |
| `PREX_BACKEND_BASE_URL`      | Backend URL                             | `http://localhost:8080`                             |
| `PREX_RESEND_API_KEY`        | Resend API key for transactional emails | —                                                   |
| `PREX_RESEND_FROM_EMAIL`     | Sender email address                    | —                                                   |

### Frontend Environment

The frontend uses Vite environment variables:

| File              | Variable       | Description                                                |
| ----------------- | -------------- | ---------------------------------------------------------- |
| `.env`            | `VITE_API_URL` | API base URL (empty for proxy mode)                        |
| `.env.production` | `VITE_API_URL` | Production API URL (e.g. `https://api.prexario.dpdns.org`) |

## Quick Start

### Prerequisites

- Node.js 20+ + pnpm 9+
- Java 21 (Temurin recommended)
- Docker & Docker Compose (for local database)
- Gradle (or use the bundled wrapper)

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

This starts PostgreSQL 16 on port `5432` with database `systemcalculator`.

### 2. Start the Backend

```bash
cd backend
./gradlew bootRun
```

The API will be available at `http://localhost:8080`.

### 3. Start the Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

The dev server will be available at `http://localhost:5173`.

The Vite dev proxy forwards `/api`, `/oauth2` and `/login/oauth2` to the backend automatically.

### 4. Run Everything with Docker Compose

```bash
# Create a .env file with the required variables first
docker compose up --build
```

This builds the backend image and starts both PostgreSQL and the backend service.

## Testing

### Frontend

```bash
cd frontend
pnpm run test          # Run tests once
pnpm run test:watch    # Run in watch mode
pnpm run lint          # ESLint check
```

### Backend

```bash
cd backend
./gradlew test         # Unit & integration tests (uses Testcontainers)
```

## CI / CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

1. **Frontend job**: checkout → pnpm install → lint → build
2. **Backend job**: checkout → setup Java 21 → run Gradle tests
3. **Docker job** (only on `main` push): build & push Docker image to DockerHub as `prexario`

Required repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## Deployment Notes

- **Backend**: the provided `Dockerfile` uses a multi-stage build (JDK → JRE) producing a minimal Alpine-based image exposing port `8080`.
- **Frontend**: build a static bundle with `pnpm run build` and serve the `dist/` folder with any static host (Nginx, CDN, etc.).
- **Database**: Flyway runs automatically on startup; migrations are in `backend/src/main/resources/db/migration/`.
- **Stripe Webhooks**: configure your Stripe webhook endpoint to point to `POST /api/webhooks/stripe`.
