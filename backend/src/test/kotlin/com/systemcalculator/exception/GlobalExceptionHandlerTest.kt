package com.systemcalculator.exception

import com.systemcalculator.BaseIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

class GlobalExceptionHandlerTest : BaseIntegrationTest() {

    @Autowired lateinit var mockMvc: MockMvc

    @Test
    fun `duplicate slug registration returns structured error response`() {
        val body = """{"email":"a@test.com","password":"secret123","tenantName":"T","tenantSlug":"dup-test-slug"}"""

        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"b@test.com","password":"secret123","tenantName":"T","tenantSlug":"dup-test-slug"}"""
        }.andExpect {
            status { isConflict() }
            jsonPath("$.status") { value(409) }
            jsonPath("$.error") { value("409 CONFLICT") }
            jsonPath("$.message") { value("Slug already taken") }
            jsonPath("$.timestamp") { exists() }
        }
    }

    @Test
    fun `login with wrong password returns structured error response`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"wrong-pw@test.com","password":"correct1","tenantName":"T","tenantSlug":"wrong-pw-slug"}"""
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"wrong-pw@test.com","password":"bad"}"""
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.status") { value(401) }
            jsonPath("$.error") { value("401 UNAUTHORIZED") }
            jsonPath("$.message") { value("Invalid credentials") }
            jsonPath("$.timestamp") { exists() }
        }
    }
}
