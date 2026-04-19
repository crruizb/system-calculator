# Monorepo + Backend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. No commits

**Goal:** Restructure the repo into a monorepo, scaffold a Kotlin+Spring Boot backend, wire up Supabase PostgreSQL, and implement JWT auth (email/password + Google OAuth) plus the `GET /api/tenants/me` endpoint.

**Architecture:** Monorepo with `frontend/` (existing React SPA moved as-is) and `backend/` (new Gradle project). Backend uses Spring Security for stateless JWT auth, Spring Data JPA + Flyway for persistence, and Testcontainers for integration tests against a real PostgreSQL instance.

**Tech Stack:** Kotlin 2.x, Spring Boot 4.0.5, Spring Security 7, Spring Data JPA, Flyway, JJWT 0.12, Google API Client 2.x, PostgreSQL (Supabase), JUnit 6, Testcontainers, Docker, GitHub Actions

---

## File Map

### Monorepo restructure

- Move: all current root source files → `frontend/` (see Task 1)

### New backend files

```
backend/
├── build.gradle.kts
├── settings.gradle.kts
├── src/
│   ├── main/
│   │   ├── kotlin/com/systemcalculator/
│   │   │   ├── Application.kt
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.kt
│   │   │   │   └── JwtService.kt
│   │   │   ├── tenant/
│   │   │   │   ├── Tenant.kt
│   │   │   │   ├── TenantRepository.kt
│   │   │   │   └── TenantController.kt
│   │   │   ├── user/
│   │   │   │   ├── User.kt
│   │   │   │   └── UserRepository.kt
│   │   │   └── auth/
│   │   │       ├── AuthController.kt
│   │   │       ├── AuthService.kt
│   │   │       └── dto/
│   │   │           └── AuthDtos.kt
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/
│   │           └── V1__initial_schema.sql
│   └── test/
│       └── kotlin/com/systemcalculator/
│           ├── BaseIntegrationTest.kt
│           ├── auth/
│           │   └── AuthControllerTest.kt
│           └── tenant/
│               └── TenantControllerTest.kt
```

---

## Task 1: Monorepo Restructure

**Files:**

- Create: `frontend/` (move existing source files here)
- Create: `README.md` (update with monorepo instructions)

- [ ] **Step 1: Move existing source files into `frontend/`**

```bash
cd /path/to/system-calculator
mkdir frontend
# Move all source files except docs/, README.md, .git/
mv src public index.html package.json pnpm-lock.yaml \
   vite.config.ts tsconfig.json tsconfig.app.json \
   eslint.config.js .env* frontend/
```

- [ ] **Step 2: Verify frontend still builds**

```bash
cd frontend && pnpm install && pnpm run build
```

Expected: Build completes in `frontend/dist/` with no errors.

- [ ] **Step 3: Update root README.md**

Replace contents with:

```markdown
# system-calculator

Monorepo: price calculator SaaS platform.

## Structure

- `frontend/` — React SPA (Vite + TypeScript)
- `backend/` — Kotlin + Spring Boot REST API
- `docs/` — specs and implementation plans

## Quick start

### Frontend

cd frontend && pnpm install && pnpm run dev

### Backend

cd backend && ./gradlew bootRun
```

---

## Task 2: Scaffold Spring Boot Backend

**Files:**

- Create: `backend/settings.gradle.kts`
- Create: `backend/build.gradle.kts`
- Create: `backend/src/main/kotlin/com/systemcalculator/Application.kt`
- Create: `backend/src/main/resources/application.yml`

- [ ] **Step 1: Create `backend/settings.gradle.kts`**

```kotlin
rootProject.name = "system-calculator-backend"
```

- [ ] **Step 2: Create `backend/build.gradle.kts`**

```kotlin
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.3.5"
    id("io.spring.dependency-management") version "1.1.6"
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.spring") version "2.0.21"
    kotlin("plugin.jpa") version "2.0.21"
}

group = "com.systemcalculator"
version = "0.0.1-SNAPSHOT"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(21) }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.flywaydb:flyway-core")
    runtimeOnly("org.postgresql:postgresql")
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
    implementation("com.google.api-client:google-api-client:2.4.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:postgresql:1.19.8")
    testImplementation("org.testcontainers:junit-jupiter:1.19.8")
}

tasks.withType<KotlinCompile> {
    compilerOptions {
        freeCompilerArgs.add("-Xjsr305=strict")
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

- [ ] **Step 3: Create `backend/src/main/kotlin/com/systemcalculator/Application.kt`**

```kotlin
package com.systemcalculator

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class Application

fun main(args: Array<String>) {
    runApplication<Application>(*args)
}
```

- [ ] **Step 4: Create `backend/src/main/resources/application.yml`**

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true

app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: 86400000 # 24 hours
  google:
    client-id: ${GOOGLE_CLIENT_ID}
```

- [ ] **Step 5: Create `.env.example` in `backend/`**

```
DATABASE_URL=jdbc:postgresql://localhost:5432/systemcalculator
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
JWT_SECRET=change-me-to-a-256-bit-secret-in-production
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

- [ ] **Step 6: Verify the project compiles**

```bash
cd backend && ./gradlew compileKotlin
```

Expected: BUILD SUCCESSFUL

---

## Task 3: Database Schema

**Files:**

- Create: `backend/src/main/resources/db/migration/V1__initial_schema.sql`

- [ ] **Step 1: Create `V1__initial_schema.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug      VARCHAR(63) UNIQUE NOT NULL,
    name      VARCHAR(255) NOT NULL,
    plan      VARCHAR(20)  NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_sub    VARCHAR(255) UNIQUE,
    role          VARCHAR(20) NOT NULL DEFAULT 'owner',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_has_auth CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL)
);

CREATE TABLE calculators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug        VARCHAR(63) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    sheet_url   VARCHAR(2048) NOT NULL,
    settings    JSONB NOT NULL DEFAULT '{}',
    branding    JSONB NOT NULL DEFAULT '{}',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    stripe_subscription_id  VARCHAR(255),
    plan                    VARCHAR(20) NOT NULL DEFAULT 'free',
    status                  VARCHAR(20) NOT NULL DEFAULT 'active',
    current_period_end      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Task 4: JPA Entities + Repositories

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/tenant/Tenant.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/tenant/TenantRepository.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/user/User.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/user/UserRepository.kt`

- [ ] **Step 1: Create `Tenant.kt`**

```kotlin
package com.systemcalculator.tenant

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "tenants")
class Tenant(
    @Id val id: UUID = UUID.randomUUID(),
    @Column(unique = true, nullable = false) val slug: String,
    @Column(nullable = false) var name: String,
    @Column(nullable = false) var plan: String = "free",
    @Column(nullable = false) val createdAt: Instant = Instant.now()
)
```

- [ ] **Step 2: Create `TenantRepository.kt`**

```kotlin
package com.systemcalculator.tenant

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TenantRepository : JpaRepository<Tenant, UUID> {
    fun findBySlug(slug: String): Tenant?
}
```

- [ ] **Step 3: Create `User.kt`**

```kotlin
package com.systemcalculator.user

import com.systemcalculator.tenant.Tenant
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "users")
class User(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    val tenant: Tenant,
    @Column(unique = true, nullable = false) val email: String,
    @Column var passwordHash: String? = null,
    @Column(unique = true) var googleSub: String? = null,
    @Column(nullable = false) val role: String = "owner",
    @Column(nullable = false) val createdAt: Instant = Instant.now()
)
```

- [ ] **Step 4: Create `UserRepository.kt`**

```kotlin
package com.systemcalculator.user

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface UserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): User?
    fun findByGoogleSub(googleSub: String): User?
}
```

- [ ] **Step 5: Verify compilation**

```bash
cd backend && ./gradlew compileKotlin
```

Expected: BUILD SUCCESSFUL

---

## Task 5: JWT Service + Security Config

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/config/JwtService.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/config/SecurityConfig.kt`

- [ ] **Step 1: Create `JwtService.kt`**

```kotlin
package com.systemcalculator.config

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Date
import java.util.UUID

@Service
class JwtService(
    @Value("\${app.jwt.secret}") private val secret: String,
    @Value("\${app.jwt.expiration-ms}") private val expirationMs: Long
) {
    private val key by lazy { Keys.hmacShaKeyFor(secret.toByteArray()) }

    fun generateToken(userId: UUID, tenantId: UUID): String =
        Jwts.builder()
            .subject(userId.toString())
            .claim("tenantId", tenantId.toString())
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + expirationMs))
            .signWith(key)
            .compact()

    fun parseUserId(token: String): UUID =
        UUID.fromString(claims(token).subject)

    fun parseTenantId(token: String): UUID =
        UUID.fromString(claims(token)["tenantId"] as String)

    private fun claims(token: String): Claims =
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
}
```

- [ ] **Step 2: Create `SecurityConfig.kt`**

```kotlin
package com.systemcalculator.config

import com.systemcalculator.user.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
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
import org.springframework.web.filter.OncePerRequestFilter

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtService: JwtService,
    private val userRepository: UserRepository
) {
    @Bean
    fun passwordEncoder() = BCryptPasswordEncoder()

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/api/auth/**", "/api/public/**", "/api/webhooks/**").permitAll()
                it.anyRequest().authenticated()
            }
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter::class.java)
        return http.build()
    }

    @Bean
    fun jwtAuthFilter() = object : OncePerRequestFilter() {
        override fun doFilterInternal(
            request: HttpServletRequest,
            response: HttpServletResponse,
            chain: FilterChain
        ) {
            val header = request.getHeader("Authorization")
            if (header != null && header.startsWith("Bearer ")) {
                val token = header.removePrefix("Bearer ")
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
                }
            }
            chain.doFilter(request, response)
        }
    }
}
```

---

## Task 6: Auth DTOs + Service

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/auth/dto/AuthDtos.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/auth/AuthService.kt`

- [ ] **Step 1: Create `AuthDtos.kt`**

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

data class GoogleAuthRequest(
    @field:NotBlank val idToken: String,
    val tenantName: String? = null,
    val tenantSlug: String? = null
)

data class AuthResponse(val token: String)
```

- [ ] **Step 2: Create `AuthService.kt`**

```kotlin
package com.systemcalculator.auth

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.systemcalculator.auth.dto.*
import com.systemcalculator.config.JwtService
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import com.systemcalculator.user.User
import com.systemcalculator.user.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
class AuthService(
    private val tenantRepository: TenantRepository,
    private val userRepository: UserRepository,
    private val passwordEncoder: BCryptPasswordEncoder,
    private val jwtService: JwtService,
    @Value("\${app.google.client-id}") private val googleClientId: String
) {
    @Transactional
    fun register(req: RegisterRequest): AuthResponse {
        if (tenantRepository.findBySlug(req.tenantSlug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug already taken")
        if (userRepository.findByEmail(req.email) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email already registered")

        val tenant = tenantRepository.save(Tenant(slug = req.tenantSlug, name = req.tenantName))
        val user = userRepository.save(
            User(tenant = tenant, email = req.email, passwordHash = passwordEncoder.encode(req.password))
        )
        return AuthResponse(jwtService.generateToken(user.id, tenant.id))
    }

    fun login(req: LoginRequest): AuthResponse {
        val user = userRepository.findByEmail(req.email)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        if (user.passwordHash == null || !passwordEncoder.matches(req.password, user.passwordHash))
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        return AuthResponse(jwtService.generateToken(user.id, user.tenant.id))
    }

    @Transactional
    fun googleAuth(req: GoogleAuthRequest): AuthResponse {
        val verifier = GoogleIdTokenVerifier.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(listOf(googleClientId))
            .build()
        val idToken = verifier.verify(req.idToken)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token")

        val googleSub = idToken.payload.subject
        val email = idToken.payload.email

        val existingUser = userRepository.findByGoogleSub(googleSub)
            ?: userRepository.findByEmail(email)

        if (existingUser != null) {
            if (existingUser.googleSub == null) {
                existingUser.googleSub = googleSub
                userRepository.save(existingUser)
            }
            return AuthResponse(jwtService.generateToken(existingUser.id, existingUser.tenant.id))
        }

        // First-time Google login: requires tenant info
        val tenantName = req.tenantName
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantName required for first login")
        val tenantSlug = req.tenantSlug
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantSlug required for first login")

        if (tenantRepository.findBySlug(tenantSlug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug already taken")

        val tenant = tenantRepository.save(Tenant(slug = tenantSlug, name = tenantName))
        val user = userRepository.save(User(tenant = tenant, email = email, googleSub = googleSub))
        return AuthResponse(jwtService.generateToken(user.id, tenant.id))
    }
}
```

---

## Task 7: Auth Controller + Tenant Controller

**Files:**

- Create: `backend/src/main/kotlin/com/systemcalculator/auth/AuthController.kt`
- Create: `backend/src/main/kotlin/com/systemcalculator/tenant/TenantController.kt`

- [ ] **Step 1: Create `AuthController.kt`**

```kotlin
package com.systemcalculator.auth

import com.systemcalculator.auth.dto.*
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody req: RegisterRequest) = authService.register(req)

    @PostMapping("/login")
    fun login(@Valid @RequestBody req: LoginRequest) = authService.login(req)

    @PostMapping("/google")
    fun google(@Valid @RequestBody req: GoogleAuthRequest) = authService.googleAuth(req)
}
```

- [ ] **Step 2: Create `TenantController.kt`**

```kotlin
package com.systemcalculator.tenant

import com.systemcalculator.user.User
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

data class TenantResponse(val id: String, val slug: String, val name: String, val plan: String)

@RestController
@RequestMapping("/api/tenants")
class TenantController {

    @GetMapping("/me")
    fun me(@AuthenticationPrincipal user: User): TenantResponse {
        val t = user.tenant
        return TenantResponse(t.id.toString(), t.slug, t.name, t.plan)
    }
}
```

---

## Task 8: Integration Tests

**Files:**

- Create: `backend/src/test/kotlin/com/systemcalculator/BaseIntegrationTest.kt`
- Create: `backend/src/test/kotlin/com/systemcalculator/auth/AuthControllerTest.kt`
- Create: `backend/src/test/kotlin/com/systemcalculator/tenant/TenantControllerTest.kt`
- Create: `backend/src/test/resources/application-test.yml`

- [ ] **Step 1: Create `application-test.yml`**

```yaml
spring:
  datasource:
    url: ${TEST_DATASOURCE_URL:}
    username: ${TEST_DATASOURCE_USERNAME:test}
    password: ${TEST_DATASOURCE_PASSWORD:test}
  jpa:
    hibernate:
      ddl-auto: validate
app:
  jwt:
    secret: test-secret-must-be-at-least-256-bits-long-padding-here
    expiration-ms: 86400000
  google:
    client-id: test-client-id
```

- [ ] **Step 2: Create `BaseIntegrationTest.kt`**

```kotlin
package com.systemcalculator

import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
abstract class BaseIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer<Nothing>("postgres:16").apply {
            withDatabaseName("testdb")
            withUsername("test")
            withPassword("test")
        }

        @JvmStatic
        @DynamicPropertySource
        fun props(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }
}
```

- [ ] **Step 3: Write failing tests in `AuthControllerTest.kt`**

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
    fun `register creates tenant and returns JWT`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"owner@acme.com","password":"secret123","tenantName":"Acme","tenantSlug":"acme"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.token") { isNotEmpty() }
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
    fun `login with correct credentials returns JWT`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"login@test.com","password":"pass1234","tenantName":"T","tenantSlug":"login-slug"}"""
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"login@test.com","password":"pass1234"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { isNotEmpty() }
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
}
```

- [ ] **Step 4: Run tests — verify they fail (no implementation yet compiled)**

```bash
cd backend && ./gradlew test --tests "com.systemcalculator.auth.AuthControllerTest"
```

Expected: FAILED — compilation errors or Spring context not starting (DB not running yet is fine; Testcontainers will start it)

- [ ] **Step 5: Write failing tests in `TenantControllerTest.kt`**

```kotlin
package com.systemcalculator.tenant

import com.fasterxml.jackson.databind.ObjectMapper
import com.systemcalculator.BaseIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

class TenantControllerTest : BaseIntegrationTest() {

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
    fun `GET tenants-me returns tenant for authenticated user`() {
        val token = registerAndGetToken("me@test.com", "me-slug")

        mockMvc.get("/api/tenants/me") {
            header("Authorization", "Bearer $token")
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

- [ ] **Step 6: Run all tests — they should now pass**

```bash
cd backend && ./gradlew test
```

Expected: All tests PASS. Testcontainers starts a PostgreSQL container automatically.

---

## Task 9: Dockerfile + docker-compose

**Files:**

- Create: `backend/Dockerfile`
- Create: `docker-compose.yml` (repo root)
- Create: `.env.example` (repo root)

- [ ] **Step 1: Create `backend/Dockerfile`**

```dockerfile
# Stage 1: build the JAR
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
RUN ./gradlew dependencies --no-daemon
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 2: Create root `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: systemcalculator
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    env_file: .env
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/systemcalculator
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

- [ ] **Step 3: Create root `.env.example`**

```
JWT_SECRET=change-me-to-a-256-bit-secret-at-least-32-chars-long
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

- [ ] **Step 4: Verify Docker build succeeds**

```bash
docker compose build backend
```

Expected: Successfully built image with no errors.

- [ ] **Step 5: Verify full stack starts**

```bash
cp .env.example .env   # fill in JWT_SECRET
docker compose up -d
sleep 5
curl http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass1234","tenantName":"Test","tenantSlug":"test"}'
```

Expected: `{"token":"eyJ..."}` — backend started, Flyway ran migrations, register works.

```bash
docker compose down
```

---

## Task 10: GitHub Actions CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: frontend/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run build

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: 21
          distribution: temurin
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew test --no-daemon
        env:
          # Testcontainers pulls its own postgres, no env vars needed
          TESTCONTAINERS_RYUK_DISABLED: true
```

- [ ] **Step 2: Verify the workflow file is valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "Valid"
```

Expected: `Valid`

---

## Verification

1. Start the backend locally:

   ```bash
   cd backend
   cp .env.example .env   # fill in real Supabase credentials
   ./gradlew bootRun
   ```

2. Register a tenant:

   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"owner@test.com","password":"secret123","tenantName":"Test Co","tenantSlug":"testco"}'
   ```

   Expected: `{"token":"eyJ..."}`

3. Use the token to call `/api/tenants/me`:

   ```bash
   curl http://localhost:8080/api/tenants/me \
     -H "Authorization: Bearer eyJ..."
   ```

   Expected: `{"id":"...","slug":"testco","name":"Test Co","plan":"free"}`

4. Attempt unauthenticated request:

   ```bash
   curl http://localhost:8080/api/tenants/me
   ```

   Expected: 401

5. Verify frontend still works independently:
   ```bash
   cd frontend && pnpm run dev
   ```
   Expected: Dev server starts, existing calculator UI works with `VITE_SHEET_URL` in `frontend/.env`
