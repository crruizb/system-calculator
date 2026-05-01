package com.systemcalculator.auth

import com.systemcalculator.auth.dto.*
import com.systemcalculator.user.User
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    @Value("\${app.frontend-url}") private val frontendUrl: String,
    @Value("\${app.jwt.refresh-expiration-ms}") private val refreshExpirationMs: Long,
) {
    private val secure get() = frontendUrl.startsWith("https://")

    @PostMapping("/register")
    fun register(@Valid @RequestBody req: RegisterRequest): ResponseEntity<Void> {
        val pair = authService.register(req)
        return ResponseEntity.status(HttpStatus.CREATED)
            .header(HttpHeaders.SET_COOKIE, accessCookie(pair.accessToken).toString())
            .header(HttpHeaders.SET_COOKIE, refreshCookie(pair.refreshToken).toString())
            .build()
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody req: LoginRequest): ResponseEntity<Void> {
        val pair = authService.login(req)
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, accessCookie(pair.accessToken).toString())
            .header(HttpHeaders.SET_COOKIE, refreshCookie(pair.refreshToken).toString())
            .build()
    }

    @PostMapping("/refresh")
    fun refresh(request: HttpServletRequest): ResponseEntity<Void> {
        val raw = request.cookies?.find { it.name == "refresh_token" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val pair = authService.refresh(raw)
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, accessCookie(pair.accessToken).toString())
            .header(HttpHeaders.SET_COOKIE, refreshCookie(pair.refreshToken).toString())
            .build()
    }

    @PutMapping("/change-password")
    fun changePassword(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody req: ChangePasswordRequest,
    ): ResponseEntity<Void> {
        authService.changePassword(user, req.currentPassword, req.newPassword)
        return ResponseEntity.ok().build()
    }

    @GetMapping("/verify-email")
    fun verifyEmail(@RequestParam token: String): ResponseEntity<Void> {
        return try {
            authService.verifyEmail(token)
            ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, "$frontendUrl/dashboard?verified=true").build()
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, "$frontendUrl/login?error=invalid-token").build()
        }
    }

    @PostMapping("/resend-verification")
    fun resendVerification(@AuthenticationPrincipal user: User): ResponseEntity<Void> {
        authService.resendVerificationEmail(user)
        return ResponseEntity.ok().build()
    }

    @PostMapping("/logout")
    fun logout(request: HttpServletRequest): ResponseEntity<Void> {
        request.cookies?.find { it.name == "refresh_token" }?.value?.let { authService.revoke(it) }
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearCookie("token").toString())
            .header(HttpHeaders.SET_COOKIE, clearCookie("refresh_token").toString())
            .build()
    }

    private fun accessCookie(token: String): ResponseCookie =
        ResponseCookie.from("token", token)
            .httpOnly(true).path("/").maxAge(900).sameSite("Lax").secure(secure).build()

    private fun refreshCookie(token: String): ResponseCookie =
        ResponseCookie.from("refresh_token", token)
            .httpOnly(true).path("/api/auth").maxAge(refreshExpirationMs / 1000)
            .sameSite("Lax").secure(secure).build()

    private fun clearCookie(name: String): ResponseCookie {
        val path = if (name == "refresh_token") "/api/auth" else "/"
        return ResponseCookie.from(name, "").httpOnly(true).path(path).maxAge(0).sameSite("Lax").build()
    }
}
