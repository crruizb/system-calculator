# Calculator View Link — Design Spec

**Date:** 2026-04-24
**Branch:** auth-dashboard

## Problem

After creating a calculator, there is no way to navigate to its public URL from the dashboard. The dashboard shows `/c/…/{slug}` because the tenant slug is not returned by the API, and there is no "View" link.

Additionally, `GET /api/calculators/{id}` does not exist, so the Edit form 404s when loading an existing calculator.

## Approach

Add `tenantSlug` to `CalculatorResponse` (Option A). The Calculator entity already holds a `Tenant` with a `slug` field, so no schema or data changes are needed. The dashboard then has everything required to build the full public URL and render a link.

## Changes

### Backend

**`CalculatorDtos.kt`**
- Add `tenantSlug: String` field to `CalculatorResponse`.

**`CalculatorService.kt`**
- Update `toResponse()` to include `calc.tenant.slug`.
- Add `getOne(user: User, id: UUID): CalculatorResponse` — calls the existing private `getOwnedCalc` helper and maps to response.

**`CalculatorController.kt`**
- Add `GET /api/calculators/{id}` endpoint that delegates to `calculatorService.getOne(user, id)`.

### Frontend

**`Dashboard.tsx`**
- Add `tenantSlug: string` to the local `Calculator` interface.
- Replace the `/c/…/{c.slug}` text with `/c/{c.tenantSlug}/{c.slug}`.
- Add a "View" anchor (`target="_blank"`) alongside the existing Edit/Delete buttons.

**`CalculatorForm.tsx`**
- No code changes needed. The edit-mode fetch `GET /api/calculators/${id}` already targets the correct URL; the missing endpoint is what caused the failure.

## Out of Scope

- Schema or migration changes
- New dependencies
- Storing tenant slug in AuthContext (Option B — deferred)
- Branding / preview within the dashboard
