package com.systemcalculator.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank @field:Size(min = 8) val password: String,
    @field:NotBlank val tenantName: String,
    @field:NotBlank @field:Size(min = 2, max = 63) val tenantSlug: String
)

data class LoginRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank val password: String
)

data class GoogleAuthRequest(
    @field:NotBlank val idToken: String,
    val tenantName: String? = null,
    @field:Size(min = 2, max = 63) val tenantSlug: String? = null
)

data class AuthResponse(val token: String)
