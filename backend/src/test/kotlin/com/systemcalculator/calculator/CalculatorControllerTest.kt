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
}
