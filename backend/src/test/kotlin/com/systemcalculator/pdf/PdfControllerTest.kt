package com.systemcalculator.pdf

import com.fasterxml.jackson.databind.ObjectMapper
import com.systemcalculator.BaseIntegrationTest
import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

class PdfControllerTest : BaseIntegrationTest() {

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

    private fun createCalculator(token: String, slug: String): String {
        val result = mockMvc.post("/api/calculators") {
            cookie(Cookie("token", token))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"PDF Calc","slug":"$slug","sheetUrl":"https://example.com"}"""
        }.andReturn()
        return objectMapper.readTree(result.response.contentAsString)["id"].asText()
    }

    @Test
    fun `returns 404 for unknown calculator`() {
        val body = """{"instances":[{"filters":{"X":"Y"},"price":"10.00"}],"currency":"€","locale":"es-ES"}"""
        mockMvc.post("/api/pdf/no-tenant/no-calc") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect { status { isNotFound() } }
    }

    @Test
    fun `returns 403 for free plan tenant`() {
        val token = registerAndGetCookie("pdf-free@test.com", "pdf-free-tenant")
        createCalculator(token, "pdf-free-calc")

        val body = """{"instances":[{"filters":{"Color":"Rojo"},"price":"49.99"}],"currency":"€","locale":"es-ES"}"""
        mockMvc.post("/api/pdf/pdf-free-tenant/pdf-free-calc") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect { status { isForbidden() } }
    }
}
