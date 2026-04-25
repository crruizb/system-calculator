# Google OAuth2 + Cookie Auth Design

**Date:** 2026-04-25
**Branch:** calculator-page

## Problem

Google Sign-In is broken because `VITE_GOOGLE_CLIENT_ID` in the frontend `.env` is a placeholder. Beyond fixing the immediate issue, the architecture has two problems worth correcting together:

1. The client ID should not live in the frontend bundle or env file.
2. JWT tokens stored in `localStorage` and sent as `Authorization: Bearer` headers are vulnerable to XSS. HttpOnly cookies are the more secure storage for JWTs.

## Approach

Replace the current Google Identity Services (GIS) browser-side flow with Spring Security's OAuth2 Client (authorization code flow). At the same time, switch the entire auth system — login, register, and Google OAuth — from returning tokens in the response body to setting `HttpOnly` cookies. The frontend never handles a raw JWT.

## Architecture

### Auth flows

**Login / Register:**
1. Frontend POSTs credentials.
2. Backend verifies, issues JWT as `HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` cookie.
3. Returns `200`/`201` with no body.
4. Frontend navigates to `/dashboard`.

**Google OAuth:**
1. Frontend navigates to `/oauth2/authorization/google` (Spring Security).
2. Spring redirects to Google consent screen.
3. Google redirects to `/login/oauth2/code/google` (Spring callback).
4. Spring exchanges code for tokens; `GoogleOAuth2SuccessHandler` runs.
5. Handler finds user by `googleSub` → by `email` → or creates new.
   - New user: tenant slug auto-generated from email local part (before `@`): lowercase, dots replaced with `-`, any non-alphanumeric-or-dash char removed, truncated to 63 chars (`cristian.ruiz@gmail.com` → `cristian-ruiz`). If the slug is taken, append `-2`, `-3`, … up to `-10` before failing.
6. Handler sets HttpOnly cookie, redirects to `${FRONTEND_URL}/dashboard`.

**Session restore on page reload:**
`AuthContext` calls `GET /api/tenants/me` on mount. `200` → logged in, `401` → not. No localStorage involved.

**Logout:**
Frontend calls `POST /api/auth/logout`. Backend clears the cookie. Frontend sets `isLoggedIn = false` and navigates to `/login`. On failure, frontend clears local state anyway — cookie expires after 24h.

**OAuth errors:**
Google rejects auth or user cancels → Spring redirects to `/login?error`. Login page shows "Sign in with Google failed, please try again."

### Cookie settings

| Flag | Value |
|------|-------|
| HttpOnly | yes |
| SameSite | Lax |
| Path | / |
| Max-Age | 86400 (24 h) |
| Secure | yes when `FRONTEND_URL` starts with `https://` |

`SameSite=Lax` provides CSRF protection for cross-origin top-level navigations. CSRF is kept disabled in Spring Security (unchanged from current config).

## Backend Changes

### `build.gradle.kts`
- Add `spring-boot-starter-oauth2-client`.
- Remove `com.google.api-client:google-api-client` (no longer needed).

### `application.yml`
- Replace `app.google.client-id` with:
  ```yaml
  spring:
    security:
      oauth2:
        client:
          registration:
            google:
              client-id: ${GOOGLE_CLIENT_ID}
              client-secret: ${GOOGLE_CLIENT_SECRET}
              scope: openid, email, profile
  ```
- Add `app.frontend-url: ${FRONTEND_URL:http://localhost:5173}`.

### `SecurityConfig.kt`
- JWT filter reads from `token` cookie instead of `Authorization` header.
- Add `.oauth2Login { it.successHandler(googleSuccessHandler) }`.
- Add `.logout { logoutUrl("/api/auth/logout"); deleteCookies("token"); logoutSuccessHandler → 200 }`.
- Permit `/oauth2/**` and `/login/oauth2/**`.
- CORS: replace wildcard origin with `${FRONTEND_URL}` (required for `credentials: include`).

### `GoogleOAuth2SuccessHandler.kt` (new)
- Implements `AuthenticationSuccessHandler`.
- Extracts `sub` and `email` from Spring's `OAuth2User`.
- Finds user by `googleSub` → `email` → creates new.
- New user: generates slug from email prefix, deduplicates.
- Sets HttpOnly cookie, redirects to `${frontendUrl}/dashboard`.

### `AuthService.kt`
- `register()` and `login()` return raw JWT `String` — controller sets the cookie.
- Remove `googleAuth()`, `GoogleIdTokenVerifier`, `googleClientId`.

### `AuthController.kt`
- `register()` sets cookie, returns `201` with no body.
- `login()` sets cookie, returns `200` with no body.
- Remove `POST /api/auth/google`.
- Add `POST /api/auth/logout` (clears cookie, returns `200`).

### `AuthDtos.kt`
- Remove `AuthResponse`.
- Remove `GoogleAuthRequest`.

## Frontend Changes

### `src/api/client.ts`
- Both `apiFetch` and `apiFetchAuth` add `credentials: 'include'`.
- `apiFetchAuth` drops the `token` parameter — cookie sent automatically by the browser.
- All call sites remove the `token` argument.

### `src/context/AuthContext.tsx`
- Replace `token: string | null` with `isLoggedIn: boolean | null` (`null` = still checking on mount).
- On mount: call `GET /api/tenants/me` — `200` sets `isLoggedIn = true`, `401` sets `false`.
- Expose `markLoggedIn()`: sets `isLoggedIn = true` synchronously — called by Login/Register after a successful POST before navigating to `/dashboard`.
- `logout()`: calls `POST /api/auth/logout`, sets `isLoggedIn = false`.
- While `isLoggedIn` is `null`, the app renders a full-screen loading spinner instead of any route.
- Remove all `localStorage` usage.

### `src/pages/Login.tsx`
- Replace `GoogleSignInButton` with `<a href="/oauth2/authorization/google">` styled as a button.
- `handleSubmit`: POST to `/api/auth/login`, no token in response — call `markLoggedIn()` then navigate to `/dashboard` on success.
- Show error message if `?error` is present in the URL (OAuth failure redirect).

### `src/pages/Register.tsx`
- Remove `?googleToken` search param handling entirely.
- `handleSubmit`: POST to `/api/auth/register`, no token in response — call `markLoggedIn()` then navigate to `/dashboard` on success.

### `src/pages/Dashboard.tsx` and `src/pages/CalculatorForm.tsx`
- Remove `token` argument from all `apiFetchAuth` calls.

### `index.html`
- Remove the Google GIS `<script>` tag.

### `frontend/.env`
- Remove `VITE_GOOGLE_CLIENT_ID`.

## Testing

### Backend

**`AuthControllerTest`**
- `register` test: assert `token` cookie is set in response (not `$.token` in body), status `201`.
- `login` test: assert `token` cookie is set, status `200`.
- Add `logout` test: register → login → logout → assert cookie is cleared.

**`CalculatorControllerTest`**
- Rename `registerAndGetToken` → `registerAndGetCookie`: extracts `response.getCookie("token")?.value`.
- All requests use `cookie(Cookie("token", value))` instead of `Authorization` header.

**`GoogleOAuth2SuccessHandler` unit test** (new)
- Mock `OAuth2User` with various email/sub combinations.
- Verify slug generation: `cristian.ruiz@gmail.com` → `cristian-ruiz`.
- Verify slug deduplication: collision → `cristian-ruiz-2`.
- Verify cookie is set with correct flags.
- Verify redirect URL points to `${frontendUrl}/dashboard`.

### Frontend

**`AuthContext` test**
- Mock `apiFetch` for `GET /api/tenants/me`: `200` → `isLoggedIn = true`; `401` → `isLoggedIn = false`.

**`Login` test**
- Assert "Sign in with Google" renders as a link with `href="/oauth2/authorization/google"`.
- Assert `?error` in URL shows error message.

**`Register` test**
- Remove the `?googleToken` test case.
- Update mock: `apiFetch` returns `undefined` (no token in body).

## Out of Scope

- Refresh tokens / token rotation.
- Remember-me / persistent sessions beyond 24h.
- Allowing users to rename their auto-generated tenant slug (can be done as a separate settings feature).
- Other OAuth providers (GitHub, etc.).
