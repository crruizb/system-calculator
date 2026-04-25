package com.systemcalculator.auth

import com.systemcalculator.auth.dto.*
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    @Value("\${app.frontend-url}") private val frontendUrl: String
) {
    @PostMapping("/register")
    fun register(@Valid @RequestBody req: RegisterRequest): ResponseEntity<Void> {
        val token = authService.register(req)
        return ResponseEntity.status(HttpStatus.CREATED)
            .header(HttpHeaders.SET_COOKIE, buildCookie(token).toString())
            .build()
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody req: LoginRequest): ResponseEntity<Void> {
        val token = authService.login(req)
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, buildCookie(token).toString())
            .build()
    }

    @PostMapping("/logout")
    fun logout(): ResponseEntity<Void> {
        val clear = ResponseCookie.from("token", "")
            .httpOnly(true).path("/").maxAge(0).sameSite("Lax").build()
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clear.toString())
            .build()
    }

    private fun buildCookie(token: String): ResponseCookie =
        ResponseCookie.from("token", token)
            .httpOnly(true)
            .path("/")
            .maxAge(86400)
            .sameSite("Lax")
            .secure(frontendUrl.startsWith("https://"))
            .build()
}
