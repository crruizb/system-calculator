# Backend: Calculators + Stripe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. No commits

**Goal:** Implement calculator CRUD with plan enforcement, the public config endpoint used by the frontend, and Stripe billing (checkout, customer portal, webhooks).

**Architecture:** Builds on Plan 1. Calculator creation checks the tenant's active plan against limits enforced server-side. The public endpoint exposes calculator config (sheet URL + settings) and branding only for Pro tenants. Stripe integration uses the official stripe-java SDK; webhook signature is verified before processing.

**Tech Stack:** Kotlin, Spring Boot 4, Spring Data JPA, Stripe Java SDK 26.x, JUnit 6, Testcontainers (from Plan 1)

**Prerequisite:** Plan 1 fully implemented (entities, auth, security config in place).

---

## File Map

```
backend/src/main/kotlin/com/systemcalculator/
├── calculator/
│   ├── Calculator.kt
│   ├── CalculatorRepository.kt
│   ├── CalculatorService.kt
│   ├── CalculatorController.kt
│   └── dto/
│       └── CalculatorDtos.kt
├── subscription/
│   ├── Subscription.kt
│   ├── SubscriptionRepository.kt
│   └── SubscriptionService.kt
└── billing/
    ├── BillingController.kt
    └── StripeWebhookController.kt

backend/src/test/kotlin/com/systemcalculator/
├── calculator/
│   └── CalculatorControllerTest.kt
└── billing/
    └── StripeWebhookControllerTest.kt
```

---

## Task 1: Add Stripe Dependency

**Files:**

- Modify: `backend/build.gradle.kts`

- [ ] **Step 1: Add stripe-java to dependencies block**

Open `backend/build.gradle.kts` and add inside the `dependencies { }` block:

```kotlin
implementation("com.stripe:stripe-java:26.3.0")
```

- [ ] **Step 2: Add Stripe config to `application.yml`**

Add under the `app:` section in `backend/src/main/resources/application.yml`:

```yaml
app:
  # ... existing jwt and google config ...
  stripe:
    secret-key: ${STRIPE_SECRET_KEY}
    webhook-secret: ${STRIPE_WEBHOOK_SECRET}
    basic-price-id: ${STRIPE_BASIC_PRICE_ID}
    pro-price-id: ${STRIPE_PRO_PRICE_ID}
    success-url: ${APP_BASE_URL}/dashboard/billing?success=true
    cancel-url: ${APP_BASE_URL}/dashboard/billing
```

- [ ] **Step 3: Add new env vars to root `.env.example`**

Append to `.env.example`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
APP_BASE_URL=http://localhost:5173
```

- [ ] **Step 4: Verify compilation**

```bash
cd backend && ./gradlew compileKotlin
```

Expected: BUILD SUCCESSFUL

---

## Task 2: Calculator Entity + Repository

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/calculator/Calculator.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorRepository.kt`

- [ ] **Step 1: Create `Calculator.kt`**

```kotlin
package com.systemcalculator.calculator

import com.systemcalculator.tenant.Tenant
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "calculators")
class Calculator(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    val tenant: Tenant,
    @Column(nullable = false) val slug: String,
    @Column(nullable = false) var name: String,
    @Column(nullable = false) var sheetUrl: String,
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb") var settings: Map<String, Any> = emptyMap(),
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb") var branding: Map<String, Any> = emptyMap(),
    @Column(nullable = false) var isActive: Boolean = true,
    @Column(nullable = false) val createdAt: Instant = Instant.now()
)
```

- [ ] **Step 2: Create `CalculatorRepository.kt`**

```kotlin
package com.systemcalculator.calculator

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CalculatorRepository : JpaRepository<Calculator, UUID> {
    fun findByTenantIdAndIsActiveTrue(tenantId: UUID): List<Calculator>
    fun countByTenantIdAndIsActiveTrue(tenantId: UUID): Long
    fun findByTenantSlugAndSlugAndIsActiveTrue(tenantSlug: String, slug: String): Calculator?
}
```

---

## Task 3: Subscription Entity + Repository

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/subscription/Subscription.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/subscription/SubscriptionRepository.kt`

- [ ] **Step 1: Create `Subscription.kt`**

```kotlin
package com.systemcalculator.subscription

import com.systemcalculator.tenant.Tenant
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "subscriptions")
class Subscription(
    @Id val id: UUID = UUID.randomUUID(),
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    val tenant: Tenant,
    @Column var stripeSubscriptionId: String? = null,
    @Column(nullable = false) var plan: String = "free",
    @Column(nullable = false) var status: String = "active",
    @Column var currentPeriodEnd: Instant? = null,
    @Column(nullable = false) val createdAt: Instant = Instant.now()
)
```

- [ ] **Step 2: Create `SubscriptionRepository.kt`**

```kotlin
package com.systemcalculator.subscription

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface SubscriptionRepository : JpaRepository<Subscription, UUID> {
    fun findByTenantId(tenantId: UUID): Subscription?
    fun findByStripeSubscriptionId(stripeSubscriptionId: String): Subscription?
}
```

---

## Task 4: Plan Limits + Calculator DTOs

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/calculator/dto/CalculatorDtos.kt`

- [ ] **Step 1: Create `CalculatorDtos.kt`**

```kotlin
package com.systemcalculator.calculator.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

object PlanLimits {
    fun maxCalculators(plan: String): Int = when (plan) {
        "basic" -> 3
        "pro"   -> Int.MAX_VALUE
        else    -> 1   // free
    }
}

data class CreateCalculatorRequest(
    @field:NotBlank val name: String,
    @field:NotBlank @field:Pattern(regexp = "^[a-z0-9-]{2,63}$") val slug: String,
    @field:NotBlank val sheetUrl: String,
    val settings: Map<String, Any> = mapOf("currency" to "€", "locale" to "es-ES")
)

data class UpdateCalculatorRequest(
    val name: String? = null,
    val sheetUrl: String? = null,
    val settings: Map<String, Any>? = null,
    val branding: Map<String, Any>? = null
)

data class CalculatorResponse(
    val id: String,
    val slug: String,
    val name: String,
    val sheetUrl: String,
    val settings: Map<String, Any>,
    val branding: Map<String, Any>,
    val isActive: Boolean
)

data class PublicCalculatorResponse(
    val sheetUrl: String,
    val settings: Map<String, Any>,
    val branding: Map<String, Any>   // empty map if not Pro
)
```

---

## Task 5: Calculator Service

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorService.kt`

- [ ] **Step 1: Create `CalculatorService.kt`**

```kotlin
package com.systemcalculator.calculator

import com.systemcalculator.calculator.dto.*
import com.systemcalculator.user.User
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class CalculatorService(private val calculatorRepository: CalculatorRepository) {

    fun list(user: User): List<CalculatorResponse> =
        calculatorRepository.findByTenantIdAndIsActiveTrue(user.tenant.id).map { it.toResponse() }

    @Transactional
    fun create(user: User, req: CreateCalculatorRequest): CalculatorResponse {
        val plan = user.tenant.plan
        val limit = PlanLimits.maxCalculators(plan)
        val current = calculatorRepository.countByTenantIdAndIsActiveTrue(user.tenant.id)
        if (current >= limit)
            throw ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Plan '$plan' allows max $limit calculator(s). Upgrade to add more."
            )
        if (calculatorRepository.findByTenantSlugAndSlugAndIsActiveTrue(user.tenant.slug, req.slug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug '${req.slug}' already in use")

        val calc = calculatorRepository.save(
            Calculator(
                tenant = user.tenant,
                slug = req.slug,
                name = req.name,
                sheetUrl = req.sheetUrl,
                settings = req.settings
            )
        )
        return calc.toResponse()
    }

    @Transactional
    fun update(user: User, id: UUID, req: UpdateCalculatorRequest): CalculatorResponse {
        val calc = getOwnedCalc(user, id)
        req.name?.let { calc.name = it }
        req.sheetUrl?.let { calc.sheetUrl = it }
        req.settings?.let { calc.settings = it }
        req.branding?.let {
            if (user.tenant.plan != "pro")
                throw ResponseStatusException(HttpStatus.FORBIDDEN, "Branding requires Pro plan")
            calc.branding = it
        }
        return calculatorRepository.save(calc).toResponse()
    }

    @Transactional
    fun delete(user: User, id: UUID) {
        val calc = getOwnedCalc(user, id)
        calc.isActive = false
        calculatorRepository.save(calc)
    }

    fun getPublic(tenantSlug: String, calcSlug: String): PublicCalculatorResponse {
        val calc = calculatorRepository.findByTenantSlugAndSlugAndIsActiveTrue(tenantSlug, calcSlug)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Calculator not found")
        val branding = if (calc.tenant.plan == "pro") calc.branding else emptyMap()
        return PublicCalculatorResponse(calc.sheetUrl, calc.settings, branding)
    }

    private fun getOwnedCalc(user: User, id: UUID): Calculator {
        val calc = calculatorRepository.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Calculator not found")
        }
        if (calc.tenant.id != user.tenant.id)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Not your calculator")
        return calc
    }

    private fun Calculator.toResponse() = CalculatorResponse(
        id.toString(), slug, name, sheetUrl, settings, branding, isActive
    )
}
```

---

## Task 6: Calculator Controller

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/calculator/CalculatorController.kt`

- [ ] **Step 1: Create `CalculatorController.kt`**

```kotlin
package com.systemcalculator.calculator

import com.systemcalculator.calculator.dto.CreateCalculatorRequest
import com.systemcalculator.calculator.dto.UpdateCalculatorRequest
import com.systemcalculator.user.User
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
class CalculatorController(private val calculatorService: CalculatorService) {

    @GetMapping("/api/calculators")
    fun list(@AuthenticationPrincipal user: User) = calculatorService.list(user)

    @PostMapping("/api/calculators")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody req: CreateCalculatorRequest
    ) = calculatorService.create(user, req)

    @PutMapping("/api/calculators/{id}")
    fun update(
        @AuthenticationPrincipal user: User,
        @PathVariable id: UUID,
        @Valid @RequestBody req: UpdateCalculatorRequest
    ) = calculatorService.update(user, id, req)

    @DeleteMapping("/api/calculators/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@AuthenticationPrincipal user: User, @PathVariable id: UUID) =
        calculatorService.delete(user, id)

    @GetMapping("/api/public/{tenantSlug}/{calcSlug}")
    fun getPublic(@PathVariable tenantSlug: String, @PathVariable calcSlug: String) =
        calculatorService.getPublic(tenantSlug, calcSlug)
}
```

---

## Task 7: Calculator Tests

**Files:**

- Create: `backend/src/test/kotlin/com/systemcalculator/calculator/CalculatorControllerTest.kt`

- [ ] **Step 1: Write failing tests**

```kotlin
package com.systemcalculator.calculator

import com.fasterxml.jackson.databind.ObjectMapper
import com.systemcalculator.BaseIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

class CalculatorControllerTest : BaseIntegrationTest() {

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper

    private fun registerAndGetToken(email: String, slug: String): String {
        val result = mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"pass1234","tenantName":"Test","tenantSlug":"$slug"}"""
        }.andReturn()
        return objectMapper.readTree(result.response.contentAsString)["token"].asText()
    }

    @Test
    fun `create calculator and retrieve via public endpoint`() {
        val token = registerAndGetToken("calc1@test.com", "calc-tenant-1")

        mockMvc.post("/api/calculators") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"My Calc","slug":"my-calc","sheetUrl":"https://docs.google.com/spreadsheets/test"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.slug") { value("my-calc") }
        }

        mockMvc.get("/api/public/calc-tenant-1/my-calc").andExpect {
            status { isOk() }
            jsonPath("$.sheetUrl") { value("https://docs.google.com/spreadsheets/test") }
        }
    }

    @Test
    fun `free plan cannot create more than 1 calculator`() {
        val token = registerAndGetToken("calc2@test.com", "calc-tenant-2")

        mockMvc.post("/api/calculators") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Calc 1","slug":"calc-1","sheetUrl":"https://example.com/1"}"""
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/calculators") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Calc 2","slug":"calc-2","sheetUrl":"https://example.com/2"}"""
        }.andExpect { status { isForbidden() } }
    }

    @Test
    fun `delete calculator removes it from list`() {
        val token = registerAndGetToken("calc3@test.com", "calc-tenant-3")

        val createResult = mockMvc.post("/api/calculators") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"To Delete","slug":"to-delete","sheetUrl":"https://example.com"}"""
        }.andReturn()
        val id = objectMapper.readTree(createResult.response.contentAsString)["id"].asText()

        mockMvc.delete("/api/calculators/$id") {
            header("Authorization", "Bearer $token")
        }.andExpect { status { isNoContent() } }

        mockMvc.get("/api/calculators") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$") { isArray() }
            jsonPath("$.length()") { value(0) }
        }
    }

    @Test
    fun `public endpoint returns 404 for unknown calculator`() {
        mockMvc.get("/api/public/no-tenant/no-calc").andExpect {
            status { isNotFound() }
        }
    }
}
```

- [ ] **Step 2: Run tests — expect failures (entities not yet in context)**

```bash
cd backend && ./gradlew test --tests "com.systemcalculator.calculator.CalculatorControllerTest"
```

Expected: FAILED — compilation errors (Calculator entity not defined yet).

- [ ] **Step 3: Run all tests after implementing Tasks 2–6**

```bash
cd backend && ./gradlew test
```

Expected: All tests PASS.

---

## Task 8: Subscription Service + Billing Controller

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/subscription/SubscriptionService.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/billing/BillingController.kt`

- [ ] **Step 1: Create `SubscriptionService.kt`**

```kotlin
package com.systemcalculator.subscription

import com.stripe.Stripe
import com.stripe.model.checkout.Session
import com.stripe.param.checkout.SessionCreateParams
import com.stripe.model.billingportal.Session as PortalSession
import com.stripe.param.billingportal.SessionCreateParams as PortalParams
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
class SubscriptionService(
    private val subscriptionRepository: SubscriptionRepository,
    private val tenantRepository: TenantRepository,
    @Value("\${app.stripe.secret-key}") private val stripeSecretKey: String,
    @Value("\${app.stripe.basic-price-id}") private val basicPriceId: String,
    @Value("\${app.stripe.pro-price-id}") private val proPriceId: String,
    @Value("\${app.stripe.success-url}") private val successUrl: String,
    @Value("\${app.stripe.cancel-url}") private val cancelUrl: String
) {
    init { Stripe.apiKey = stripeSecretKey }

    fun createCheckoutUrl(tenant: Tenant, plan: String): String {
        val priceId = when (plan) {
            "basic" -> basicPriceId
            "pro"   -> proPriceId
            else    -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid plan: $plan")
        }
        val params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setPrice(priceId)
                    .setQuantity(1)
                    .build()
            )
            .putMetadata("tenantId", tenant.id.toString())
            .build()
        return Session.create(params).url
    }

    fun createPortalUrl(tenant: Tenant): String {
        val sub = subscriptionRepository.findByTenantId(tenant.id)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No active subscription found")
        val customerId = sub.stripeSubscriptionId
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No Stripe subscription linked")
        val stripeCustomerId = com.stripe.model.Subscription.retrieve(customerId).customer
        val params = PortalParams.builder()
            .setCustomer(stripeCustomerId)
            .setReturnUrl(cancelUrl)
            .build()
        return PortalSession.create(params).url
    }

    @Transactional
    fun handleSubscriptionUpdated(stripeSubscriptionId: String, plan: String, status: String, tenantId: String) {
        val tenant = tenantRepository.findById(java.util.UUID.fromString(tenantId)).orElseThrow {
            IllegalStateException("Tenant $tenantId not found for Stripe subscription $stripeSubscriptionId")
        }
        val sub = subscriptionRepository.findByTenantId(tenant.id)
            ?: Subscription(tenant = tenant)
        sub.stripeSubscriptionId = stripeSubscriptionId
        sub.plan = plan
        sub.status = status
        subscriptionRepository.save(sub)
        tenant.plan = if (status == "active") plan else "free"
        tenantRepository.save(tenant)
    }
}
```

- [ ] **Step 2: Create `BillingController.kt`**

```kotlin
package com.systemcalculator.billing

import com.systemcalculator.subscription.SubscriptionService
import com.systemcalculator.user.User
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/billing")
class BillingController(private val subscriptionService: SubscriptionService) {

    @GetMapping("/checkout")
    fun checkout(
        @AuthenticationPrincipal user: User,
        @RequestParam plan: String
    ) = mapOf("url" to subscriptionService.createCheckoutUrl(user.tenant, plan))

    @GetMapping("/portal")
    fun portal(@AuthenticationPrincipal user: User) =
        mapOf("url" to subscriptionService.createPortalUrl(user.tenant))
}
```

---

## Task 9: Stripe Webhook Controller

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/billing/StripeWebhookController.kt`

- [ ] **Step 1: Create `StripeWebhookController.kt`**

```kotlin
package com.systemcalculator.billing

import com.stripe.exception.SignatureVerificationException
import com.stripe.model.checkout.Session
import com.stripe.net.Webhook
import com.systemcalculator.subscription.SubscriptionService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/webhooks")
class StripeWebhookController(
    private val subscriptionService: SubscriptionService,
    @Value("\${app.stripe.webhook-secret}") private val webhookSecret: String
) {

    @PostMapping("/stripe")
    fun handleStripe(
        @RequestBody payload: String,
        request: HttpServletRequest
    ): ResponseEntity<String> {
        val sigHeader = request.getHeader("Stripe-Signature")
            ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing signature")

        val event = try {
            Webhook.constructEvent(payload, sigHeader, webhookSecret)
        } catch (e: SignatureVerificationException) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature")
        }

        when (event.type) {
            "customer.subscription.updated", "customer.subscription.created" -> {
                val sub = event.dataObjectDeserializer.`object`.orElse(null)
                    as? com.stripe.model.Subscription ?: return ResponseEntity.ok("ignored")
                val tenantId = sub.metadata["tenantId"] ?: return ResponseEntity.ok("no tenantId")
                val plan = resolvePlan(sub)
                subscriptionService.handleSubscriptionUpdated(sub.id, plan, sub.status, tenantId)
            }
            "customer.subscription.deleted" -> {
                val sub = event.dataObjectDeserializer.`object`.orElse(null)
                    as? com.stripe.model.Subscription ?: return ResponseEntity.ok("ignored")
                val tenantId = sub.metadata["tenantId"] ?: return ResponseEntity.ok("no tenantId")
                subscriptionService.handleSubscriptionUpdated(sub.id, "free", "canceled", tenantId)
            }
        }
        return ResponseEntity.ok("ok")
    }

    private fun resolvePlan(sub: com.stripe.model.Subscription): String {
        // Match the price ID from the subscription to a plan name via metadata set at checkout
        // For now derive from the subscription item price nickname or fall back to basic
        val priceId = sub.items.data.firstOrNull()?.price?.id ?: return "basic"
        return sub.metadata["plan"] ?: "basic"  // plan stored in metadata at checkout creation
    }
}
```

> **Note:** Update `SubscriptionService.createCheckoutUrl` to also store the plan in Stripe metadata:
>
> ```kotlin
> .putMetadata("tenantId", tenant.id.toString())
> .putMetadata("plan", plan)   // add this line
> ```

- [ ] **Step 2: Run all tests**

```bash
cd backend && ./gradlew test
```

Expected: All tests PASS.

---

## Verification

1. Create a calculator via dashboard (or curl) and verify the public endpoint returns it:

   ```bash
   # Register + get token (see Plan 1 verification)
   TOKEN="eyJ..."
   curl -X POST http://localhost:8080/api/calculators \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Diamond Ring","slug":"diamond-ring","sheetUrl":"https://docs.google.com/test"}'
   # → 201 with calculator JSON

   curl http://localhost:8080/api/public/testco/diamond-ring
   # → { "sheetUrl": "...", "settings": {...}, "branding": {} }
   ```

2. Verify plan enforcement (Free → 2nd calculator blocked):

   ```bash
   curl -X POST http://localhost:8080/api/calculators \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Second Calc","slug":"second","sheetUrl":"https://example.com"}'
   # → 403 with "Plan 'free' allows max 1 calculator(s)"
   ```

3. Verify Stripe checkout redirect (requires real Stripe test keys):
   ```bash
   curl "http://localhost:8080/api/billing/checkout?plan=basic" \
     -H "Authorization: Bearer $TOKEN"
   # → { "url": "https://checkout.stripe.com/..." }
   ```
