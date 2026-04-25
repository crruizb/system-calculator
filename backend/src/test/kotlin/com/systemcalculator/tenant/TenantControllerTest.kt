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
