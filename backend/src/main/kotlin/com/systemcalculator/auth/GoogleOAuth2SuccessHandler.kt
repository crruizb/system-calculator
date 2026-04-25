package com.systemcalculator.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component

@Component
class GoogleOAuth2SuccessHandler(
    private val authService: AuthService,
    @Value("\${app.frontend-url}") private val frontendUrl: String
) : AuthenticationSuccessHandler {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oauth2User = authentication.principal as OAuth2User
        val googleSub = oauth2User.getAttribute<String>("sub")!!
        val email = oauth2User.getAttribute<String>("email")!!

        val user = authService.findOrCreateGoogleUser(googleSub, email)
        val token = authService.generateToken(user)

        val cookie = ResponseCookie.from("token", token)
            .httpOnly(true)
            .path("/")
            .maxAge(86400)
            .sameSite("Lax")
            .secure(frontendUrl.startsWith("https://"))
            .build()

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
        response.sendRedirect("$frontendUrl/dashboard")
    }
}
