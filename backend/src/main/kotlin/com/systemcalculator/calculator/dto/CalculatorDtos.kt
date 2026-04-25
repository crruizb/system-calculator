package com.systemcalculator.calculator.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

object PlanLimits {
    fun maxCalculators(plan: String): Int = when (plan) {
        "basic" -> 3
        "pro"   -> 10
        else    -> 1   // free
    }
}

data class CreateCalculatorRequest(
    @field:NotBlank val name: String,
    @field:NotBlank @field:Pattern(regexp = "^[a-z0-9-]{2,63}$") val slug: String,
    @field:NotBlank val sheetUrl: String,
    val settings: Map<String, Any> = mapOf("currency" to "€", "locale" to "es-ES"),
    val branding: Map<String, Any> = emptyMap()
)

data class UpdateCalculatorRequest(
    val name: String? = null,
    val sheetUrl: String? = null,
    val settings: Map<String, Any>? = null,
    val branding: Map<String, Any>? = null
)

data class CalculatorResponse(
    val id: String,
    val tenantSlug: String,
    val slug: String,
    val name: String,
    val sheetUrl: String,
    val settings: Map<String, Any>,
    val branding: Map<String, Any>,
    val isActive: Boolean
)

data class PublicCalculatorResponse(
    val sheetUrl: String,
    val settings: Map<String, Any>,
    val branding: Map<String, Any>   // empty map if not Pro
)
