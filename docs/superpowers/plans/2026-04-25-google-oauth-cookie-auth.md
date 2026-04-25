# Google OAuth2 + Cookie Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken GIS browser-side Google login and localStorage JWT storage with Spring Security OAuth2 authorization-code flow and full HttpOnly-cookie auth for all login paths.

**Architecture:** Spring Security's `oauth2Login()` handles the Google redirect flow; a custom `GoogleOAuth2SuccessHandler` finds/creates the user and sets an HttpOnly cookie. Login and register endpoints drop `AuthResponse` from the body and set the same cookie instead. The frontend calls `GET /api/tenants/me` on mount to restore auth state; no token is ever stored in JavaScript.

**Tech Stack:** Spring Security 6 OAuth2 Client, `ResponseCookie` (Spring Web), Vitest + React Testing Library, MockMvc Kotlin DSL.

---

## File Map

**Backend — modified**

- `backend/build.gradle.kts` — swap google-api-client for oauth2-client
- `backend/src/main/resources/application.yml` — add OAuth2 registration + frontend-url, remove google.client-id
- `backend/src/main/kotlin/com/systemcalculator/auth/dto/AuthDtos.kt` — remove `AuthResponse`, `GoogleAuthRequest`
- `backend/src/main/kotlin/com/systemcalculator/auth/AuthService.kt` — return `String` from register/login, remove googleAuth, add `findOrCreateGoogleUser` + `generateUniqueSlug` + `generateToken`
- `backend/src/main/kotlin/com/systemcalculator/auth/AuthController.kt` — set cookie + no body, remove google endpoint, add logout
- `backend/src/main/kotlin/com/systemcalculator/config/SecurityConfig.kt` — cookie filter, IF_REQUIRED sessions, oauth2Login wired, updated CORS

**Backend — new**

- `backend/src/main/kotlin/com/systemcalculator/auth/GoogleOAuth2SuccessHandler.kt`
- `backend/src/test/kotlin/com/systemcalculator/auth/AuthServiceTest.kt`
- `backend/src/test/kotlin/com/systemcalculator/auth/GoogleOAuth2SuccessHandlerTest.kt`

**Backend — tests modified**

- `backend/src/test/kotlin/com/systemcalculator/auth/AuthControllerTest.kt` — cookie assertions, add logout test
- `backend/src/test/kotlin/com/systemcalculator/calculator/CalculatorControllerTest.kt` — `registerAndGetCookie`, cookie-based requests
- `backend/src/test/kotlin/com/systemcalculator/tenant/TenantControllerTest.kt` — same

**Frontend — modified**

- `frontend/src/api/client.ts` — `credentials: 'include'`, drop `token` param from `apiFetchAuth`
- `frontend/src/context/AuthContext.tsx` — `isLoggedIn: boolean | null`, session restore on mount, `markLoggedIn()`, cookie logout
- `frontend/src/components/ProtectedRoute.tsx` — handle null loading state
- `frontend/src/pages/Login.tsx` — anchor for Google, no token in response
- `frontend/src/pages/Register.tsx` — no googleToken search param
- `frontend/src/pages/Dashboard.tsx` — no token arg to `apiFetchAuth`
- `frontend/src/pages/CalculatorForm.tsx` — no token arg to `apiFetchAuth`
- `frontend/index.html` — remove GIS script tag
- `frontend/.env` — remove `VITE_GOOGLE_CLIENT_ID`

**Frontend — tests modified**

- `frontend/src/test/context/AuthContext.test.tsx` — full rewrite
- `frontend/src/test/pages/Login.test.tsx` — update assertions
- `frontend/src/test/pages/Dashboard.test.tsx` — remove localStorage setup
- `frontend/src/test/pages/CalculatorForm.test.tsx` — remove localStorage setup

---

### Task 1: Backend — swap dependency + update config

**Files:**

- Modify: `backend/build.gradle.kts`
- Modify: `backend/src/main/resources/application.yml`

- [ ] **Step 1: Edit `build.gradle.kts`**

Replace:

```
implementation("com.google.api-client:google-api-client:2.4.0")
```

With:

```
implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
```

- [ ] **Step 2: Edit `application.yml`**

Replace the `app.google` section and add OAuth2 registration + frontend-url. Final file:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/systemcalculator}
    username: ${DATABASE_USERNAME:postgres}
    password: ${DATABASE_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid, email, profile

app:
  jwt:
    secret: ${JWT_SECRET:change-me-to-a-256-bit-secret-in-production}
    expiration-ms: 86400000 # 24 hours
  frontend-url: ${FRONTEND_URL:http://localhost:5173}
  stripe:
    secret-key: ${STRIPE_SECRET_KEY:aaa}
    webhook-secret: ${STRIPE_WEBHOOK_SECRET:aaa}
    basic-price-id: ${STRIPE_BASIC_PRICE_ID:aaa}
    pro-price-id: ${STRIPE_PRO_PRICE_ID:aaa}
    success-url: ${APP_BASE_URL:aaa}/dashboard/billing?success=true
    cancel-url: ${APP_BASE_URL:aaa}/dashboard/billing
```

- [ ] **Step 3: Compile-check**

```bash
cd backend && ./gradlew compileKotlin
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add backend/build.gradle.kts backend/src/main/resources/application.yml
git commit -m "chore: swap google-api-client for spring oauth2-client, add frontend-url config"
```

---

### Task 2: Backend — cookie auth for login/register (TDD)

**Files:**

- Modify: `backend/src/test/kotlin/com/systemcalculator/auth/AuthControllerTest.kt`
- Modify: `backend/src/main/kotlin/com/systemcalculator/auth/dto/AuthDtos.kt`
- Modify: `backend/src/main/kotlin/com/systemcalculator/auth/AuthService.kt`
- Modify: `backend/src/main/kotlin/com/systemcalculator/auth/AuthController.kt`

- [ ] **Step 1: Rewrite `AuthControllerTest.kt` with cookie assertions**

```kotlin
package com.systemcalculator.auth

import com.systemcalculator.BaseIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

class AuthControllerTest : BaseIntegrationTest() {

    @Autowired lateinit var mockMvc: MockMvc

    @Test
    fun `register creates tenant and sets token cookie`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"owner@acme.com","password":"secret123","tenantName":"Acme","tenantSlug":"acme"}"""
        }.andExpect {
            status { isCreated() }
            cookie { exists("token") }
            cookie { httpOnly("token", true) }
        }
    }

    @Test
    fun `register with duplicate slug returns 409`() {
        val body = """{"email":"a@test.com","password":"secret123","tenantName":"T","tenantSlug":"dup-slug"}"""
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON; content = body
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"b@test.com","password":"secret123","tenantName":"T","tenantSlug":"dup-slug"}"""
        }.andExpect { status { isConflict() } }
    }

    @Test
    fun `login with correct credentials sets token cookie`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"login@test.com","password":"pass1234","tenantName":"T","tenantSlug":"login-slug"}"""
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"login@test.com","password":"pass1234"}"""
        }.andExpect {
            status { isOk() }
            cookie { exists("token") }
            cookie { httpOnly("token", true) }
        }
    }

    @Test
    fun `login with wrong password returns 401`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"wrong@test.com","password":"correct1","tenantName":"T","tenantSlug":"wrong-slug"}"""
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"wrong@test.com","password":"wrong"}"""
        }.andExpect { status { isUnauthorized() } }
    }

    @Test
    fun `logout clears token cookie`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"logout@test.com","password":"pass1234","tenantName":"T","tenantSlug":"logout-slug"}"""
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/auth/logout").andExpect {
            status { isOk() }
            cookie { maxAge("token", 0) }
        }
    }
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && ./gradlew test --tests "com.systemcalculator.auth.AuthControllerTest"
```

Expected: multiple FAILED (cookie assertions fail, google compile errors)

- [ ] **Step 3: Update `AuthDtos.kt` — remove `AuthResponse` and `GoogleAuthRequest`**

```kotlin
package com.systemcalculator.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank @field:Size(min = 8) val password: String,
    @field:NotBlank val tenantName: String,
    @field:NotBlank @field:Size(min = 2, max = 63) val tenantSlug: String
)

data class LoginRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank val password: String
)
```

- [ ] **Step 4: Update `AuthService.kt` — return String, remove Google logic**

```kotlin
package com.systemcalculator.auth

import com.systemcalculator.auth.dto.*
import com.systemcalculator.config.JwtService
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import com.systemcalculator.user.User
import com.systemcalculator.user.UserRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
class AuthService(
    private val tenantRepository: TenantRepository,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
) {
    @Transactional
    fun register(req: RegisterRequest): String {
        if (tenantRepository.findBySlug(req.tenantSlug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug already taken")
        if (userRepository.findByEmail(req.email) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email already registered")
        return try {
            val tenant = tenantRepository.save(Tenant(slug = req.tenantSlug, name = req.tenantName))
            val user = userRepository.save(
                User(tenant = tenant, email = req.email, passwordHash = passwordEncoder.encode(req.password))
            )
            jwtService.generateToken(user.id, tenant.id)
        } catch (e: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email or slug already registered")
        }
    }

    fun login(req: LoginRequest): String {
        val user = userRepository.findByEmail(req.email)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        if (user.passwordHash == null || !passwordEncoder.matches(req.password, user.passwordHash))
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        return jwtService.generateToken(user.id, user.tenant.id)
    }

    @Transactional
    fun findOrCreateGoogleUser(googleSub: String, email: String): User {
        val existingUser = userRepository.findByGoogleSub(googleSub)
            ?: userRepository.findByEmail(email)
        if (existingUser != null) {
            if (existingUser.googleSub == null) {
                existingUser.googleSub = googleSub
                userRepository.save(existingUser)
            }
            return existingUser
        }
        val slug = generateUniqueSlug(email)
        val tenant = tenantRepository.save(Tenant(slug = slug, name = slug))
        return userRepository.save(User(tenant = tenant, email = email, googleSub = googleSub))
    }

    fun generateUniqueSlug(email: String): String {
        val base = email.substringBefore('@')
            .lowercase()
            .replace('.', '-')
            .replace(Regex("[^a-z0-9-]"), "")
            .take(63)
        if (tenantRepository.findBySlug(base) == null) return base
        for (n in 2..10) {
            val candidate = "${base.take(60)}-$n"
            if (tenantRepository.findBySlug(candidate) == null) return candidate
        }
        throw ResponseStatusException(HttpStatus.CONFLICT, "Could not generate unique slug")
    }

    fun generateToken(user: User): String = jwtService.generateToken(user.id, user.tenant.id)
}
```

- [ ] **Step 5: Update `AuthController.kt` — cookie responses, remove google endpoint, add logout**

```kotlin
package com.systemcalculator.auth

import com.systemcalculator.auth.dto.*
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    @Value("\${app.frontend-url}") private val frontendUrl: String
) {
    @PostMapping("/register")
    fun register(@Valid @RequestBody req: RegisterRequest): ResponseEntity<Void> {
        val token = authService.register(req)
        return ResponseEntity.status(HttpStatus.CREATED)
            .header(HttpHeaders.SET_COOKIE, buildCookie(token).toString())
            .build()
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody req: LoginRequest): ResponseEntity<Void> {
        val token = authService.login(req)
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, buildCookie(token).toString())
            .build()
    }

    @PostMapping("/logout")
    fun logout(): ResponseEntity<Void> {
        val clear = ResponseCookie.from("token", "")
            .httpOnly(true).path("/").maxAge(0).sameSite("Lax").build()
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clear.toString())
            .build()
    }

    private fun buildCookie(token: String): ResponseCookie =
        ResponseCookie.from("token", token)
            .httpOnly(true)
            .path("/")
            .maxAge(86400)
            .sameSite("Lax")
            .secure(frontendUrl.startsWith("https://"))
            .build()
}
```

- [ ] **Step 6: Run AuthControllerTest — expect it to pass except cookie-filter-related ones**

```bash
cd backend && ./gradlew test --tests "com.systemcalculator.auth.AuthControllerTest"
```

Expected: `register creates tenant and sets token cookie` PASSES; others may fail due to JWT filter still reading Bearer header (fixed in Task 3).

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/kotlin/com/systemcalculator/auth/ \
        backend/src/test/kotlin/com/systemcalculator/auth/AuthControllerTest.kt
git commit -m "feat: login/register set HttpOnly cookie instead of returning token in body"
```

---

### Task 3: Backend — JWT filter reads cookie + update SecurityConfig + update integration tests

**Files:**

- Modify: `backend/src/main/kotlin/com/systemcalculator/config/SecurityConfig.kt`
- Modify: `backend/src/test/kotlin/com/systemcalculator/calculator/CalculatorControllerTest.kt`
- Modify: `backend/src/test/kotlin/com/systemcalculator/tenant/TenantControllerTest.kt`

- [ ] **Step 1: Update `SecurityConfig.kt`**

Full replacement:

```kotlin
package com.systemcalculator.config

import com.systemcalculator.auth.GoogleOAuth2SuccessHandler
import com.systemcalculator.user.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.OncePerRequestFilter

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtService: JwtService,
    private val userRepository: UserRepository,
    private val googleOAuth2SuccessHandler: GoogleOAuth2SuccessHandler,
    @Value("\${app.frontend-url}") private val frontendUrl: String
) {
    companion object {
        private val log = LoggerFactory.getLogger(SecurityConfig::class.java)
    }

    @Bean
    fun passwordEncoder() = BCryptPasswordEncoder()

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { }
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/api/auth/**",
                    "/api/public/**",
                    "/api/webhooks/**",
                    "/oauth2/**",
                    "/login/oauth2/**"
                ).permitAll()
                it.anyRequest().authenticated()
            }
            .exceptionHandling {
                it.authenticationEntryPoint { _, response, _ ->
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")
                }
            }
            .oauth2Login { it.successHandler(googleOAuth2SuccessHandler) }
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter::class.java)
        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration().apply {
            allowedOrigins = listOf(frontendUrl)
            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = true
        }
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", config)
        }
    }

    @Bean
    fun jwtAuthFilter() = object : OncePerRequestFilter() {
        override fun doFilterInternal(
            request: HttpServletRequest,
            response: HttpServletResponse,
            chain: FilterChain
        ) {
            val token = request.cookies?.find { it.name == "token" }?.value
            if (token != null) {
                runCatching {
                    val userId = jwtService.parseUserId(token)
                    val tenantId = jwtService.parseTenantId(token)
                    val user = userRepository.findById(userId).orElse(null)
                    if (user != null) {
                        val auth = UsernamePasswordAuthenticationToken(
                            user, null,
                            listOf(SimpleGrantedAuthority("ROLE_${user.role.uppercase()}"))
                        )
                        auth.details = tenantId
                        SecurityContextHolder.getContext().authentication = auth
                    }
                }.onFailure { log.debug("Invalid JWT token: {}", it.message) }
            }
            chain.doFilter(request, response)
        }
    }
}
```

- [ ] **Step 2: Update `CalculatorControllerTest.kt` — cookie-based auth**

Full replacement:

```kotlin
package com.systemcalculator.calculator

import com.fasterxml.jackson.databind.ObjectMapper
import com.systemcalculator.BaseIntegrationTest
import jakarta.servlet.http.Cookie
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

    private fun registerAndGetCookie(email: String, slug: String): String {
        val result = mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"pass1234","tenantName":"Test","tenantSlug":"$slug"}"""
        }.andReturn()
        return result.response.getCookie("token")?.value
            ?: error("token cookie not set after register")
    }

    @Test
    fun `create calculator and retrieve via public endpoint`() {
        val token = registerAndGetCookie("calc1@test.com", "calc-tenant-1")

        mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
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
        val token = registerAndGetCookie("calc2@test.com", "calc-tenant-2")

        mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Calc 1","slug":"calc-1","sheetUrl":"https://example.com/1"}"""
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Calc 2","slug":"calc-2","sheetUrl":"https://example.com/2"}"""
        }.andExpect { status { isForbidden() } }
    }

    @Test
    fun `delete calculator removes it from list`() {
        val token = registerAndGetCookie("calc3@test.com", "calc-tenant-3")

        val createResult = mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"To Delete","slug":"to-delete","sheetUrl":"https://example.com"}"""
        }.andReturn()
        val id = objectMapper.readTree(createResult.response.contentAsString)["id"].asText()

        mockMvc.delete("/api/calculators/$id") {
            cookie(Cookie("token", token))
        }.andExpect { status { isNoContent() } }

        mockMvc.get("/api/calculators") {
            cookie(Cookie("token", token))
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

    @Test
    fun `list calculators includes tenantSlug`() {
        val token = registerAndGetCookie("calc5@test.com", "calc-tenant-5")

        mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Listed","slug":"listed","sheetUrl":"https://example.com"}"""
        }.andExpect { status { isCreated() } }

        mockMvc.get("/api/calculators") {
            cookie(Cookie("token", token))
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].tenantSlug") { value("calc-tenant-5") }
        }
    }

    @Test
    fun `get single calculator by id returns tenantSlug`() {
        val token = registerAndGetCookie("calc6@test.com", "calc-tenant-6")

        val createResult = mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Single","slug":"single","sheetUrl":"https://example.com"}"""
        }.andReturn()
        val id = objectMapper.readTree(createResult.response.contentAsString)["id"].asText()

        mockMvc.get("/api/calculators/$id") {
            cookie(Cookie("token", token))
        }.andExpect {
            status { isOk() }
            jsonPath("$.tenantSlug") { value("calc-tenant-6") }
            jsonPath("$.slug") { value("single") }
        }
    }
}
```

- [ ] **Step 3: Update `TenantControllerTest.kt` — cookie-based auth**

Full replacement:

```kotlin
package com.systemcalculator.tenant

import com.fasterxml.jackson.databind.ObjectMapper
import com.systemcalculator.BaseIntegrationTest
import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

class TenantControllerTest : BaseIntegrationTest() {

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper

    private fun registerAndGetCookie(email: String, slug: String): String {
        val result = mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"pass1234","tenantName":"Test","tenantSlug":"$slug"}"""
        }.andReturn()
        return result.response.getCookie("token")?.value
            ?: error("token cookie not set after register")
    }

    @Test
    fun `GET tenants-me returns tenant for authenticated user`() {
        val token = registerAndGetCookie("me@test.com", "me-slug")

        mockMvc.get("/api/tenants/me") {
            cookie(Cookie("token", token))
        }.andExpect {
            status { isOk() }
            jsonPath("$.slug") { value("me-slug") }
            jsonPath("$.plan") { value("free") }
        }
    }

    @Test
    fun `GET tenants-me without token returns 401`() {
        mockMvc.get("/api/tenants/me").andExpect {
            status { isUnauthorized() }
        }
    }
}
```

- [ ] **Step 4: Create stub `GoogleOAuth2SuccessHandler.kt` so the project compiles**

Create `backend/src/main/kotlin/com/systemcalculator/auth/GoogleOAuth2SuccessHandler.kt`:

```kotlin
package com.systemcalculator.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component

@Component
class GoogleOAuth2SuccessHandler(
    private val authService: AuthService,
    @Value("\${app.frontend-url}") private val frontendUrl: String
) : AuthenticationSuccessHandler {
    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        response.sendRedirect("$frontendUrl/dashboard")
    }
}
```

- [ ] **Step 5: Run all backend tests**

```bash
cd backend && ./gradlew test
```

Expected: `BUILD SUCCESSFUL` — all tests pass including the new cookie-based ones.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/kotlin/com/systemcalculator/config/SecurityConfig.kt \
        backend/src/main/kotlin/com/systemcalculator/auth/GoogleOAuth2SuccessHandler.kt \
        backend/src/test/kotlin/com/systemcalculator/calculator/CalculatorControllerTest.kt \
        backend/src/test/kotlin/com/systemcalculator/tenant/TenantControllerTest.kt
git commit -m "feat: JWT filter reads token cookie; SecurityConfig wires oauth2Login"
```

---

### Task 4: Backend — GoogleOAuth2SuccessHandler + AuthService Google methods (TDD)

**Files:**

- Create: `backend/src/test/kotlin/com/systemcalculator/auth/AuthServiceTest.kt`
- Create: `backend/src/test/kotlin/com/systemcalculator/auth/GoogleOAuth2SuccessHandlerTest.kt`
- Modify: `backend/src/main/kotlin/com/systemcalculator/auth/GoogleOAuth2SuccessHandler.kt`

- [ ] **Step 1: Create `AuthServiceTest.kt` for slug generation**

```kotlin
package com.systemcalculator.auth

import com.systemcalculator.BaseIntegrationTest
import com.systemcalculator.tenant.TenantRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class AuthServiceTest : BaseIntegrationTest() {

    @Autowired lateinit var authService: AuthService
    @Autowired lateinit var tenantRepository: TenantRepository

    @Test
    fun `generateUniqueSlug converts dots to dashes and strips special chars`() {
        val slug = authService.generateUniqueSlug("cristian.ruiz@gmail.com")
        assertEquals("cristian-ruiz", slug)
    }

    @Test
    fun `generateUniqueSlug deduplicates by appending number`() {
        authService.generateUniqueSlug("taken@example.com").also { base ->
            // create a tenant with the base slug to force collision
            val firstSlug = authService.generateUniqueSlug("taken@example.com")
            // register a user to actually persist the first slug
        }
        // Register to occupy "taken" slug
        val firstSlug = authService.generateUniqueSlug("taken@example.com")
        assertEquals("taken", firstSlug)

        // Occupy the slug by registering
        com.systemcalculator.tenant.Tenant(slug = firstSlug, name = firstSlug).also {
            tenantRepository.save(it)
        }

        val second = authService.generateUniqueSlug("taken@example.com")
        assertEquals("taken-2", second)
    }

    @Test
    fun `generateUniqueSlug truncates local part to 63 chars`() {
        val longEmail = "a".repeat(70) + "@example.com"
        val slug = authService.generateUniqueSlug(longEmail)
        assert(slug.length <= 63) { "slug too long: $slug" }
    }
}
```

- [ ] **Step 2: Create `GoogleOAuth2SuccessHandlerTest.kt`**

```kotlin
package com.systemcalculator.auth

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.verify
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken
import org.springframework.security.oauth2.core.user.OAuth2User
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.user.User
import java.util.UUID

class GoogleOAuth2SuccessHandlerTest {

    private val tenantStub = Tenant(slug = "cristian-ruiz", name = "cristian-ruiz")
    private val userStub = User(
        id = UUID.randomUUID(),
        tenant = tenantStub,
        email = "cristian.ruiz@gmail.com",
        googleSub = "sub123"
    )

    private fun buildHandler(frontendUrl: String = "http://localhost:5173"): Triple<GoogleOAuth2SuccessHandler, AuthService, MockHttpServletResponse> {
        val authService = mock(AuthService::class.java)
        `when`(authService.findOrCreateGoogleUser("sub123", "cristian.ruiz@gmail.com")).thenReturn(userStub)
        `when`(authService.generateToken(userStub)).thenReturn("jwt-token")

        val handler = GoogleOAuth2SuccessHandler(authService, frontendUrl)
        val response = MockHttpServletResponse()
        return Triple(handler, authService, response)
    }

    private fun buildAuthentication(sub: String, email: String): OAuth2AuthenticationToken {
        val oauth2User = mock(OAuth2User::class.java)
        `when`(oauth2User.getAttribute<String>("sub")).thenReturn(sub)
        `when`(oauth2User.getAttribute<String>("email")).thenReturn(email)
        return mock(OAuth2AuthenticationToken::class.java).also {
            `when`(it.principal).thenReturn(oauth2User)
        }
    }

    @Test
    fun `sets HttpOnly token cookie`() {
        val (handler, _, response) = buildHandler()
        handler.onAuthenticationSuccess(
            MockHttpServletRequest(),
            response,
            buildAuthentication("sub123", "cristian.ruiz@gmail.com")
        )
        val cookieHeader = response.getHeader("Set-Cookie") ?: ""
        assertTrue(cookieHeader.contains("token=jwt-token"), "expected token value in $cookieHeader")
        assertTrue(cookieHeader.contains("HttpOnly"), "expected HttpOnly in $cookieHeader")
        assertTrue(cookieHeader.contains("SameSite=Lax"), "expected SameSite=Lax in $cookieHeader")
    }

    @Test
    fun `redirects to frontendUrl-dashboard`() {
        val (handler, _, response) = buildHandler("http://localhost:5173")
        handler.onAuthenticationSuccess(
            MockHttpServletRequest(),
            response,
            buildAuthentication("sub123", "cristian.ruiz@gmail.com")
        )
        assertTrue(response.redirectedUrl == "http://localhost:5173/dashboard")
    }

    @Test
    fun `sets Secure flag when frontendUrl is https`() {
        val (handler, _, response) = buildHandler("https://app.example.com")
        handler.onAuthenticationSuccess(
            MockHttpServletRequest(),
            response,
            buildAuthentication("sub123", "cristian.ruiz@gmail.com")
        )
        val cookieHeader = response.getHeader("Set-Cookie") ?: ""
        assertTrue(cookieHeader.contains("Secure"), "expected Secure in $cookieHeader")
    }
}
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd backend && ./gradlew test --tests "com.systemcalculator.auth.GoogleOAuth2SuccessHandlerTest" \
                              --tests "com.systemcalculator.auth.AuthServiceTest"
```

Expected: FAILED — handler still returns stub redirect, cookie assertions fail.

- [ ] **Step 4: Implement `GoogleOAuth2SuccessHandler.kt`**

Full replacement:

```kotlin
package com.systemcalculator.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component

@Component
class GoogleOAuth2SuccessHandler(
    private val authService: AuthService,
    @Value("\${app.frontend-url}") private val frontendUrl: String
) : AuthenticationSuccessHandler {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oauth2User = authentication.principal as OAuth2User
        val googleSub = oauth2User.getAttribute<String>("sub")!!
        val email = oauth2User.getAttribute<String>("email")!!

        val user = authService.findOrCreateGoogleUser(googleSub, email)
        val token = authService.generateToken(user)

        val cookie = ResponseCookie.from("token", token)
            .httpOnly(true)
            .path("/")
            .maxAge(86400)
            .sameSite("Lax")
            .secure(frontendUrl.startsWith("https://"))
            .build()

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
        response.sendRedirect("$frontendUrl/dashboard")
    }
}
```

- [ ] **Step 5: Run all backend tests**

```bash
cd backend && ./gradlew test
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/kotlin/com/systemcalculator/auth/GoogleOAuth2SuccessHandler.kt \
        backend/src/main/kotlin/com/systemcalculator/auth/AuthService.kt \
        backend/src/test/kotlin/com/systemcalculator/auth/AuthServiceTest.kt \
        backend/src/test/kotlin/com/systemcalculator/auth/GoogleOAuth2SuccessHandlerTest.kt
git commit -m "feat: GoogleOAuth2SuccessHandler sets cookie and auto-generates tenant slug"
```

---

### Task 5: Frontend — client.ts + AuthContext.tsx + ProtectedRoute.tsx (TDD)

**Files:**

- Modify: `frontend/src/test/context/AuthContext.test.tsx`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Rewrite `AuthContext.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import * as client from "../../api/client";

function TestConsumer() {
  const { isLoggedIn, markLoggedIn, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">
        {isLoggedIn === null ? "loading" : isLoggedIn ? "in" : "out"}
      </span>
      <button onClick={markLoggedIn}>Mark Logged In</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state on mount before auth check completes", async () => {
    vi.spyOn(client, "apiFetch").mockReturnValue(new Promise(() => {}));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("status").textContent).toBe("loading");
  });

  it("sets isLoggedIn=true when GET /api/tenants/me returns 200", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("in"),
    );
  });

  it("sets isLoggedIn=false when GET /api/tenants/me returns 401", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(
      new Error("401 Unauthorized"),
    );
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("out"),
    );
  });

  it("markLoggedIn sets isLoggedIn=true synchronously", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(new Error("401"));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("out"),
    );
    await userEvent.click(screen.getByText("Mark Logged In"));
    expect(screen.getByTestId("status").textContent).toBe("in");
  });

  it("logout calls POST /api/auth/logout and sets isLoggedIn=false", async () => {
    const fetchSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValueOnce({ slug: "my-tenant", plan: "free" }) // session restore
      .mockResolvedValueOnce(undefined); // logout
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("in"),
    );
    await userEvent.click(screen.getByText("Logout"));
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("out"),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd frontend && pnpm vitest run src/test/context/AuthContext.test.tsx
```

Expected: FAILED — `isLoggedIn`/`markLoggedIn` do not exist yet.

- [ ] **Step 3: Update `client.ts`**

```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function apiFetchAuth<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, options);
}
```

- [ ] **Step 4: Update `AuthContext.tsx`**

```tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiFetch } from "../api/client";

interface AuthContextValue {
  isLoggedIn: boolean | null;
  markLoggedIn: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch("/api/tenants/me")
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  function markLoggedIn() {
    setIsLoggedIn(true);
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsLoggedIn(false);
    }
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, markLoggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

- [ ] **Step 5: Update `ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export function ProtectedRoute() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn === null)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}
```

- [ ] **Step 6: Run AuthContext tests**

```bash
cd frontend && pnpm vitest run src/test/context/AuthContext.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/api/client.ts \
        frontend/src/context/AuthContext.tsx \
        frontend/src/components/ProtectedRoute.tsx \
        frontend/src/test/context/AuthContext.test.tsx
git commit -m "feat: AuthContext uses cookie-based session restore; apiFetchAuth drops token param"
```

---

### Task 6: Frontend — Login.tsx + Register.tsx + tests

**Files:**

- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Register.tsx`
- Modify: `frontend/src/test/pages/Login.test.tsx`

- [ ] **Step 1: Update `Login.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { Login } from "../../pages/Login";
import * as client from "../../api/client";

function renderLogin(search = "/login") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[search]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders email and password fields", () => {
    vi.spyOn(client, "apiFetch").mockReturnValue(new Promise(() => {}));
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders Google sign-in as a link to /oauth2/authorization/google", () => {
    vi.spyOn(client, "apiFetch").mockReturnValue(new Promise(() => {}));
    renderLogin();
    const link = screen.getByRole("link", { name: /sign in with google/i });
    expect(link).toHaveAttribute("href", "/oauth2/authorization/google");
  });

  it("redirects to /dashboard on successful login", async () => {
    vi.spyOn(client, "apiFetch")
      .mockResolvedValueOnce(new Error("401")) // session restore → not logged in
      .mockResolvedValueOnce(undefined); // POST /api/auth/login
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "test@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pass1234");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText("Dashboard")).toBeInTheDocument(),
    );
  });

  it("shows error message on failed login", async () => {
    vi.spyOn(client, "apiFetch")
      .mockRejectedValueOnce(new Error("401")) // session restore
      .mockRejectedValueOnce(new Error("401 Invalid credentials")); // login attempt
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "bad@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument(),
    );
  });

  it("shows OAuth error message when ?error is in URL", () => {
    vi.spyOn(client, "apiFetch").mockReturnValue(new Promise(() => {}));
    renderLogin("/login?error");
    expect(screen.getByText(/sign in with google failed/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run Login tests to confirm they fail**

```bash
cd frontend && pnpm vitest run src/test/pages/Login.test.tsx
```

Expected: FAILED — Google link not found, `markLoggedIn` not called.

- [ ] **Step 3: Update `Login.tsx`**

```tsx
import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { markLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasOAuthError = searchParams.has("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      markLoggedIn();
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg.replace(/^\d+\s/, ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-md p-8 bg-[var(--color-surface)] rounded-2xl shadow-xl">
        <h1 className="font-display text-3xl text-center mb-8">Sign In</h1>

        {hasOAuthError && (
          <p className="mb-4 text-red-400 text-sm text-center">
            Sign in with Google failed, please try again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6">
          <a
            href="/oauth2/authorization/google"
            className="flex items-center justify-center w-full py-3 rounded-lg border border-[var(--color-gold)]/30 text-sm hover:bg-[var(--color-gold)]/10 transition-colors"
          >
            Sign in with Google
          </a>
        </div>

        <div className="mt-4 text-center text-sm text-[var(--color-text-primary)]/60">
          No account?{" "}
          <Link
            to="/register"
            className="text-[var(--color-gold)] hover:underline"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `Register.tsx`**

```tsx
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function Register() {
  const { markLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, tenantName, tenantSlug }),
      });
      markLoggedIn();
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg.replace(/^\d+\s/, ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-md p-8 bg-[var(--color-surface)] rounded-2xl shadow-xl">
        <h1 className="font-display text-3xl text-center mb-8">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div>
            <label htmlFor="tenantName" className="block text-sm mb-1">
              Company Name
            </label>
            <input
              id="tenantName"
              type="text"
              required
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div>
            <label htmlFor="tenantSlug" className="block text-sm mb-1">
              URL Slug{" "}
              <span className="text-[var(--color-text-primary)]/40 text-xs">
                (e.g. acme-jewels)
              </span>
            </label>
            <input
              id="tenantSlug"
              type="text"
              required
              pattern="^[a-z0-9-]{2,63}$"
              value={tenantSlug}
              onChange={(e) =>
                setTenantSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                )
              }
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
            {tenantSlug && (
              <p className="text-xs mt-1 text-[var(--color-text-primary)]/40">
                Your calculator URL: /c/{tenantSlug}/...
              </p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[var(--color-text-primary)]/60">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[var(--color-gold)] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run Login tests**

```bash
cd frontend && pnpm vitest run src/test/pages/Login.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Login.tsx \
        frontend/src/pages/Register.tsx \
        frontend/src/test/pages/Login.test.tsx
git commit -m "feat: Login uses server-side Google OAuth link; Register drops googleToken flow"
```

---

### Task 7: Frontend — Dashboard, CalculatorForm, cleanup

**Files:**

- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/pages/CalculatorForm.tsx`
- Modify: `frontend/src/test/pages/Dashboard.test.tsx`
- Modify: `frontend/src/test/pages/CalculatorForm.test.tsx`
- Modify: `frontend/index.html`
- Modify: `frontend/.env`

- [ ] **Step 1: Update `Dashboard.tsx` — drop `token` arg**

```tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetchAuth } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Calculator {
  id: string;
  name: string;
  slug: string;
  tenantSlug: string;
  sheetUrl: string;
  settings: Record<string, unknown>;
  branding: Record<string, unknown>;
  isActive: boolean;
}

export function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetchAuth<Calculator[]>("/api/calculators")
      .then(setCalculators)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await apiFetchAuth(`/api/calculators/${id}`, { method: "DELETE" });
    setCalculators((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading…</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">My Calculators</h1>
        <div className="flex gap-3">
          <Link
            to="/dashboard/billing"
            className="text-sm text-[var(--color-gold)] hover:underline"
          >
            Billing
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)]"
          >
            Sign out
          </button>
        </div>
      </div>

      <Link
        to="/dashboard/new"
        className="inline-block mb-6 px-5 py-2.5 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors"
      >
        + New Calculator
      </Link>

      {calculators.length === 0 && (
        <p className="text-[var(--color-text-primary)]/50 text-center mt-12">
          No calculators yet. Create one to get started.
        </p>
      )}

      <ul className="space-y-3">
        {calculators.map((c) => (
          <li
            key={c.id}
            className="p-4 bg-[var(--color-surface)] rounded-xl flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-[var(--color-text-primary)]/50">
                /c/{c.tenantSlug}/{c.slug}
              </p>
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
              <Link
                to={`/dashboard/${c.id}`}
                className="text-sm text-[var(--color-gold)] hover:underline"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Update `CalculatorForm.tsx` — drop `token` arg**

```tsx
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetchAuth } from "../api/client";

export function CalculatorForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [currency, setCurrency] = useState("€");
  const [locale, setLocale] = useState("es-ES");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    apiFetchAuth<{
      name: string;
      slug: string;
      sheetUrl: string;
      settings: { currency: string; locale: string };
    }>(`/api/calculators/${id}`).then((c) => {
      setName(c.name);
      setSlug(c.slug);
      setSheetUrl(c.sheetUrl);
      setCurrency(c.settings.currency ?? "€");
      setLocale(c.settings.locale ?? "es-ES");
    });
  }, [id, isEdit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const body = { name, slug, sheetUrl, settings: { currency, locale } };
    try {
      if (isEdit) {
        await apiFetchAuth(`/api/calculators/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetchAuth("/api/calculators", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message.replace(/^\d+\s/, "")
          : "Save failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-8">
      <div className="w-full max-w-lg bg-[var(--color-surface)] rounded-2xl p-8 shadow-xl">
        <h1 className="font-display text-3xl mb-8">
          {isEdit ? "Edit Calculator" : "New Calculator"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-1">
              Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          {!isEdit && (
            <div>
              <label htmlFor="slug" className="block text-sm mb-1">
                Slug
              </label>
              <input
                id="slug"
                required
                pattern="^[a-z0-9-]{2,63}$"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  )
                }
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          )}
          <div>
            <label htmlFor="sheetUrl" className="block text-sm mb-1">
              Google Sheet URL
            </label>
            <input
              id="sheetUrl"
              type="url"
              required
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="currency" className="block text-sm mb-1">
                Currency symbol
              </label>
              <input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="locale" className="block text-sm mb-1">
                Locale (e.g. es-ES)
              </label>
              <input
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `Dashboard.test.tsx` — remove localStorage setup**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { Dashboard } from "../../pages/Dashboard";
import * as client from "../../api/client";

function renderDashboard() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/new" element={<div>New Calculator</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows list of calculators", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([
      {
        id: "1",
        name: "Diamond Ring",
        slug: "diamond-ring",
        tenantSlug: "my-tenant",
        sheetUrl: "https://example.com",
        settings: {},
        branding: {},
        isActive: true,
      },
    ]);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Diamond Ring")).toBeInTheDocument(),
    );
  });

  it("shows view link pointing to public calculator url", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([
      {
        id: "1",
        name: "Diamond Ring",
        slug: "diamond-ring",
        tenantSlug: "my-tenant",
        sheetUrl: "https://example.com",
        settings: {},
        branding: {},
        isActive: true,
      },
    ]);
    renderDashboard();
    const viewLink = await screen.findByRole("link", { name: /view/i });
    expect(viewLink).toHaveAttribute("href", "/c/my-tenant/diamond-ring");
  });

  it("shows empty state when no calculators", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([]);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/no calculators/i)).toBeInTheDocument(),
    );
  });

  it("navigates to create page on link click", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([]);
    renderDashboard();
    await userEvent.click(
      await screen.findByRole("link", { name: /new calculator/i }),
    );
    expect(screen.getByText("New Calculator")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Update `CalculatorForm.test.tsx` — remove localStorage setup**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { CalculatorForm } from "../../pages/CalculatorForm";
import * as client from "../../api/client";

function renderCreate() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/dashboard/new"]}>
        <Routes>
          <Route path="/dashboard/new" element={<CalculatorForm />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("CalculatorForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits create form and redirects to dashboard", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue({
      id: "1",
      name: "Test",
      slug: "test",
      tenantSlug: "my-tenant",
      sheetUrl: "https://example.com",
      settings: {},
      branding: {},
      isActive: true,
    });
    renderCreate();

    await userEvent.type(screen.getByLabelText(/name/i), "My Calc");
    await userEvent.type(screen.getByLabelText(/slug/i), "my-calc");
    await userEvent.type(
      screen.getByLabelText(/sheet url/i),
      "https://docs.google.com/test",
    );
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() =>
      expect(screen.getByText("Dashboard")).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 5: Remove Google GIS script from `index.html`**

Remove the line:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

- [ ] **Step 6: Remove `VITE_GOOGLE_CLIENT_ID` from `frontend/.env`**

Remove the line:

```
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

- [ ] **Step 7: Run all frontend tests**

```bash
cd frontend && pnpm vitest run
```

Expected: all tests PASS.

- [ ] **Step 8: Run lint**

```bash
cd frontend && pnpm run lint
```

Expected: no errors.
