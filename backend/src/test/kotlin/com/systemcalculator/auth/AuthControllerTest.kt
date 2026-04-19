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
