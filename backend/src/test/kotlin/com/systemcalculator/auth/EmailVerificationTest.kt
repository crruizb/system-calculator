package com.systemcalculator.auth

import com.systemcalculator.BaseIntegrationTest
import jakarta.servlet.http.Cookie
import org.hamcrest.Matchers.containsString
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.security.MessageDigest
import java.sql.Timestamp
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

class EmailVerificationTest : BaseIntegrationTest() {

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var jdbcTemplate: JdbcTemplate

    private fun register(email: String, slug: String): String {
        val result = mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"pass1234","tenantName":"T","tenantSlug":"$slug"}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return result.response.getCookie("token")?.value ?: error("No token cookie")
    }

    private fun userId(email: String): UUID =
        jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", UUID::class.java, email)

    private fun sha256(input: String): String =
        MessageDigest.getInstance("SHA-256")
            .digest(input.toByteArray())
            .joinToString("") { "%02x".format(it) }

    private fun insertToken(email: String, rawToken: String, expiresAt: Instant = Instant.now().plus(24, ChronoUnit.HOURS)) {
        val uid = userId(email)
        jdbcTemplate.update("DELETE FROM email_verifications WHERE user_id = ?", uid)
        jdbcTemplate.update(
            "INSERT INTO email_verifications(id, user_id, token_hash, expires_at) VALUES (gen_random_uuid(), ?, ?, ?)",
            uid, sha256(rawToken), Timestamp.from(expiresAt)
        )
    }

    private fun tokenCount(email: String): Long =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM email_verifications WHERE user_id = ?",
            Long::class.java, userId(email)
        )

    private fun isVerified(email: String): Boolean =
        jdbcTemplate.queryForObject(
            "SELECT email_verified FROM users WHERE email = ?",
            Boolean::class.java, email
        )

    @Test
    fun `register creates email_verified=false and saves verification token`() {
        register("reg-ev@evtest.com", "ev-reg-1")
        assert(!isVerified("reg-ev@evtest.com")) { "User should not be verified after register" }
        assert(tokenCount("reg-ev@evtest.com") == 1L) { "One verification token should be saved" }
    }

    @Test
    fun `unverified user cannot create calculator - returns 403 EMAIL_NOT_VERIFIED`() {
        val token = register("unverified@evtest.com", "ev-unverified-1")

        mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"C","slug":"cc","sheetUrl":"https://example.com"}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.message") { value("EMAIL_NOT_VERIFIED") }
        }
    }

    @Test
    fun `valid token verifies user and redirects to dashboard`() {
        register("verify-ok@evtest.com", "ev-valid-1")
        insertToken("verify-ok@evtest.com", "known-valid-token-xyz")

        mockMvc.get("/api/auth/verify-email?token=known-valid-token-xyz").andExpect {
            status { is3xxRedirection() }
            header { string("Location", containsString("/dashboard?verified=true")) }
        }

        assert(isVerified("verify-ok@evtest.com")) { "User should be verified after clicking link" }
        assert(tokenCount("verify-ok@evtest.com") == 0L) { "Verification token should be deleted after use" }
    }

    @Test
    fun `verified user can create calculator`() {
        val token = register("verified@evtest.com", "ev-verified-1")
        jdbcTemplate.update("UPDATE users SET email_verified = true WHERE email = ?", "verified@evtest.com")

        mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"C","slug":"ev-c1","sheetUrl":"https://example.com"}"""
        }.andExpect { status { isCreated() } }
    }

    @Test
    fun `invalid token redirects to login with error`() {
        mockMvc.get("/api/auth/verify-email?token=completely-bogus-token-123").andExpect {
            status { is3xxRedirection() }
            header { string("Location", containsString("/login?error=invalid-token")) }
        }
    }

    @Test
    fun `expired token redirects to login with error`() {
        register("expired@evtest.com", "ev-expired-1")
        insertToken("expired@evtest.com", "expired-token-abc", Instant.now().minus(1, ChronoUnit.HOURS))

        mockMvc.get("/api/auth/verify-email?token=expired-token-abc").andExpect {
            status { is3xxRedirection() }
            header { string("Location", containsString("/login?error=invalid-token")) }
        }

        assert(!isVerified("expired@evtest.com")) { "User should not be verified with expired token" }
    }

    @Test
    fun `resend verification replaces old token with new one`() {
        val token = register("resend@evtest.com", "ev-resend-1")
        assert(tokenCount("resend@evtest.com") == 1L)

        mockMvc.post("/api/auth/resend-verification") {
            cookie(Cookie("token", token))
        }.andExpect { status { isOk() } }

        // old deleted, new inserted — still exactly one
        assert(tokenCount("resend@evtest.com") == 1L) { "Should have exactly one token after resend" }
    }

    @Test
    fun `resend verification on already-verified user returns 400`() {
        val token = register("already-verified@evtest.com", "ev-already-1")
        jdbcTemplate.update("UPDATE users SET email_verified = true WHERE email = ?", "already-verified@evtest.com")

        mockMvc.post("/api/auth/resend-verification") {
            cookie(Cookie("token", token))
        }.andExpect { status { isBadRequest() } }
    }

    @Test
    fun `resend verification requires authentication`() {
        mockMvc.post("/api/auth/resend-verification")
            .andExpect { status { isUnauthorized() } }
    }

    @Test
    fun `tenants me returns emailVerified false for new user`() {
        val token = register("me-unverified@evtest.com", "ev-me-1")

        mockMvc.get("/api/tenants/me") {
            cookie(Cookie("token", token))
        }.andExpect {
            status { isOk() }
            jsonPath("$.emailVerified") { value(false) }
        }
    }

    @Test
    fun `tenants me returns emailVerified true after verification`() {
        val token = register("me-verified@evtest.com", "ev-me-2")
        jdbcTemplate.update("UPDATE users SET email_verified = true WHERE email = ?", "me-verified@evtest.com")

        mockMvc.get("/api/tenants/me") {
            cookie(Cookie("token", token))
        }.andExpect {
            status { isOk() }
            jsonPath("$.emailVerified") { value(true) }
        }
    }
}
