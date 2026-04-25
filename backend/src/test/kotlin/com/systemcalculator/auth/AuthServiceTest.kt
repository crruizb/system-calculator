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
        val firstSlug = authService.generateUniqueSlug("taken@example.com")
        assertEquals("taken", firstSlug)

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
