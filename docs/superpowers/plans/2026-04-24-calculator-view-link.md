# Calculator View Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "View" link on the dashboard that opens each calculator's public URL, and expose `GET /api/calculators/{id}` so the Edit form loads correctly.

**Architecture:** Add `tenantSlug` to `CalculatorResponse` by reading it from the `Calculator` entity's already-loaded `Tenant`. Add a `getOne` service method backed by the existing `getOwnedCalc` helper. Wire a new controller endpoint. Update the Dashboard to show the full URL and a "View" anchor.

**Tech Stack:** Spring Boot 3 / Kotlin / MockMvc (backend); React / Vitest / React Testing Library (frontend)

---

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/main/kotlin/com/systemcalculator/calculator/dto/CalculatorDtos.kt` |
| Modify | `backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorService.kt` |
| Modify | `backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorController.kt` |
| Modify | `backend/src/test/kotlin/com/systemcalculator/calculator/CalculatorControllerTest.kt` |
| Modify | `frontend/src/pages/Dashboard.tsx` |
| Modify | `frontend/src/test/pages/Dashboard.test.tsx` |

---

## Task 1: Backend — expose `tenantSlug` and `GET /api/calculators/{id}`

**Files:**
- Modify: `backend/src/test/kotlin/com/systemcalculator/calculator/CalculatorControllerTest.kt`
- Modify: `backend/src/main/kotlin/com/systemcalculator/calculator/dto/CalculatorDtos.kt`
- Modify: `backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorService.kt`
- Modify: `backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorController.kt`

- [ ] **Step 1: Add two failing tests to `CalculatorControllerTest.kt`**

  Append these two test methods inside the `CalculatorControllerTest` class (before the closing `}`):

  ```kotlin
  @Test
  fun `list calculators includes tenantSlug`() {
      val token = registerAndGetToken("calc5@test.com", "calc-tenant-5")

      mockMvc.post("/api/calculators") {
          header("Authorization", "Bearer $token")
          contentType = MediaType.APPLICATION_JSON
          content = """{"name":"Listed","slug":"listed","sheetUrl":"https://example.com"}"""
      }.andExpect { status { isCreated() } }

      mockMvc.get("/api/calculators") {
          header("Authorization", "Bearer $token")
      }.andExpect {
          status { isOk() }
          jsonPath("$[0].tenantSlug") { value("calc-tenant-5") }
      }
  }

  @Test
  fun `get single calculator by id returns tenantSlug`() {
      val token = registerAndGetToken("calc6@test.com", "calc-tenant-6")

      val createResult = mockMvc.post("/api/calculators") {
          header("Authorization", "Bearer $token")
          contentType = MediaType.APPLICATION_JSON
          content = """{"name":"Single","slug":"single","sheetUrl":"https://example.com"}"""
      }.andReturn()
      val id = objectMapper.readTree(createResult.response.contentAsString)["id"].asText()

      mockMvc.get("/api/calculators/$id") {
          header("Authorization", "Bearer $token")
      }.andExpect {
          status { isOk() }
          jsonPath("$.tenantSlug") { value("calc-tenant-6") }
          jsonPath("$.slug") { value("single") }
      }
  }
  ```

- [ ] **Step 2: Run tests to confirm they fail**

  ```bash
  cd backend && ./gradlew test --tests "com.systemcalculator.calculator.CalculatorControllerTest" 2>&1 | tail -20
  ```

  Expected: two new tests fail — one with `No value at JSON path "$[0].tenantSlug"`, the other with `Status expected:<200> but was:<405>` (no endpoint yet).

- [ ] **Step 3: Add `tenantSlug` to `CalculatorResponse` in `CalculatorDtos.kt`**

  Replace the existing `CalculatorResponse` data class:

  ```kotlin
  data class CalculatorResponse(
      val id: String,
      val tenantSlug: String,
      val slug: String,
      val name: String,
      val sheetUrl: String,
      val settings: Map<String, Any>,
      val branding: Map<String, Any>,
      val isActive: Boolean
  )
  ```

- [ ] **Step 4: Update `toResponse()` and add `getOne()` in `CalculatorService.kt`**

  Replace the private `toResponse` extension at the bottom of the class:

  ```kotlin
  private fun Calculator.toResponse() = CalculatorResponse(
      id.toString(), tenant.slug, slug, name, sheetUrl, settings, branding, isActive
  )
  ```

  Add `getOne` as a new public method (anywhere before `getOwnedCalc`):

  ```kotlin
  fun getOne(user: User, id: UUID): CalculatorResponse =
      getOwnedCalc(user, id).toResponse()
  ```

- [ ] **Step 5: Add `GET /api/calculators/{id}` to `CalculatorController.kt`**

  Add this method inside `CalculatorController`, after the existing `list` mapping:

  ```kotlin
  @GetMapping("/api/calculators/{id}")
  fun getOne(@AuthenticationPrincipal user: User, @PathVariable id: UUID) =
      calculatorService.getOne(user, id)
  ```

- [ ] **Step 6: Run all calculator tests**

  ```bash
  cd backend && ./gradlew test --tests "com.systemcalculator.calculator.CalculatorControllerTest" 2>&1 | tail -20
  ```

  Expected: all tests pass (including the two new ones).

- [ ] **Step 7: Run full test suite to check for regressions**

  ```bash
  cd backend && ./gradlew test 2>&1 | tail -20
  ```

  Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 8: Commit**

  ```bash
  git add backend/src/main/kotlin/com/systemcalculator/calculator/dto/CalculatorDtos.kt \
          backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorService.kt \
          backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorController.kt \
          backend/src/test/kotlin/com/systemcalculator/calculator/CalculatorControllerTest.kt
  git commit -m "feat: add tenantSlug to CalculatorResponse and GET /api/calculators/{id}"
  ```

---

## Task 2: Frontend — View link on Dashboard

**Files:**
- Modify: `frontend/src/test/pages/Dashboard.test.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Add a failing test and update mock data in `Dashboard.test.tsx`**

  The existing mock data in the file is missing `tenantSlug`. Update every existing mock payload **and** add a new test:

  Replace the mock payload in `shows list of calculators`:
  ```tsx
  vi.spyOn(client, 'apiFetchAuth').mockResolvedValue([
    { id: '1', name: 'Diamond Ring', slug: 'diamond-ring', tenantSlug: 'my-tenant', sheetUrl: 'https://example.com', settings: {}, branding: {}, isActive: true },
  ])
  ```

  Add this new test inside `describe('Dashboard', ...)`:
  ```tsx
  it('shows view link pointing to public calculator url', async () => {
    vi.spyOn(client, 'apiFetchAuth').mockResolvedValue([
      { id: '1', name: 'Diamond Ring', slug: 'diamond-ring', tenantSlug: 'my-tenant', sheetUrl: 'https://example.com', settings: {}, branding: {}, isActive: true },
    ])
    renderDashboard()
    const viewLink = await screen.findByRole('link', { name: /view/i })
    expect(viewLink).toHaveAttribute('href', '/c/my-tenant/diamond-ring')
  })
  ```

- [ ] **Step 2: Run the frontend tests to confirm the new test fails**

  ```bash
  cd /home/cruiz/dev/system-calculator/frontend && pnpm test --reporter=verbose 2>&1 | grep -A5 "Dashboard"
  ```

  Expected: `shows view link pointing to public calculator url` fails with `Unable to find an accessible element with the role "link" and name /view/i`.

- [ ] **Step 3: Update `Dashboard.tsx`**

  Replace the `Calculator` interface:

  ```tsx
  interface Calculator {
    id: string
    name: string
    slug: string
    tenantSlug: string
    sheetUrl: string
    settings: Record<string, unknown>
    branding: Record<string, unknown>
    isActive: boolean
  }
  ```

  Replace the `<li>` block inside `calculators.map(...)`:

  ```tsx
  <li key={c.id} className="p-4 bg-[var(--color-surface)] rounded-xl flex items-center justify-between">
    <div>
      <p className="font-semibold">{c.name}</p>
      <p className="text-sm text-[var(--color-text-primary)]/50">/c/{c.tenantSlug}/{c.slug}</p>
    </div>
    <div className="flex gap-3">
      <a
        href={`/c/${c.tenantSlug}/${c.slug}`}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)]"
      >
        View
      </a>
      <Link to={`/dashboard/${c.id}`} className="text-sm text-[var(--color-gold)] hover:underline">Edit</Link>
      <button
        onClick={() => handleDelete(c.id)}
        className="text-sm text-red-400 hover:text-red-300"
      >
        Delete
      </button>
    </div>
  </li>
  ```

- [ ] **Step 4: Run all frontend tests**

  ```bash
  cd /home/cruiz/dev/system-calculator/frontend && pnpm test 2>&1 | tail -20
  ```

  Expected: all tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/pages/Dashboard.tsx \
          frontend/src/test/pages/Dashboard.test.tsx
  git commit -m "feat: show full public URL and View link on dashboard"
  ```
