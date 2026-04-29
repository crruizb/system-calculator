package com.systemcalculator.auth

import com.systemcalculator.tenant.Tenant
import com.systemcalculator.user.User
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken
import org.springframework.security.oauth2.core.user.OAuth2User
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
        `when`(authService.issueTokenPair(userStub)).thenReturn(TokenPair("jwt-token", "refresh-token"))

        val handler = GoogleOAuth2SuccessHandler(authService, frontendUrl, 2592000000L)
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
