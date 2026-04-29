package com.systemcalculator.auth

import com.systemcalculator.BaseIntegrationTest
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import com.systemcalculator.user.User
import com.systemcalculator.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import java.time.Instant
import java.time.temporal.ChronoUnit

class TokenCleanupJobTest : BaseIntegrationTest() {

    @Autowired lateinit var job: TokenCleanupJob
    @Autowired lateinit var repo: RefreshTokenRepository
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var tenantRepository: TenantRepository

    private lateinit var user: User

    @BeforeEach
    fun setup() {
        repo.deleteAll()
        val tenant = tenantRepository.save(Tenant(slug = "cleanup-test-${System.nanoTime()}", name = "cleanup"))
        user = userRepository.save(User(tenant = tenant, email = "cleanup-${System.nanoTime()}@test.com", passwordHash = "hash"))
    }

    @Test
    fun `deletes expired tokens`() {
        repo.save(RefreshToken(user = user, tokenHash = "expired", expiresAt = Instant.now().minus(1, ChronoUnit.DAYS)))
        repo.save(RefreshToken(user = user, tokenHash = "valid", expiresAt = Instant.now().plus(30, ChronoUnit.DAYS)))

        job.clean()

        val remaining = repo.findAll().map { it.tokenHash }
        assertEquals(listOf("valid"), remaining)
    }

    @Test
    fun `deletes revoked tokens older than 7 days`() {
        repo.save(RefreshToken(user = user, tokenHash = "old-revoked", expiresAt = Instant.now().plus(30, ChronoUnit.DAYS), revoked = true,
            createdAt = Instant.now().minus(8, ChronoUnit.DAYS)))
        repo.save(RefreshToken(user = user, tokenHash = "recent-revoked", expiresAt = Instant.now().plus(30, ChronoUnit.DAYS), revoked = true))

        job.clean()

        val remaining = repo.findAll().map { it.tokenHash }
        assertEquals(listOf("recent-revoked"), remaining)
    }

    @Test
    fun `keeps valid active tokens untouched`() {
        repo.save(RefreshToken(user = user, tokenHash = "active", expiresAt = Instant.now().plus(30, ChronoUnit.DAYS)))

        job.clean()

        assertEquals(1, repo.count())
    }
}
