package com.systemcalculator.tenant

import com.systemcalculator.subscription.SubscriptionService
import com.systemcalculator.user.User
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

data class TenantResponse(
    val id: String,
    val slug: String,
    val name: String,
    val plan: String,
    val hasPassword: Boolean,
)

data class UpdateTenantRequest(
    @field:NotBlank @field:Size(max = 100) val name: String,
    @field:NotBlank @field:Size(min = 2, max = 63)
    @field:Pattern(regexp = "^[a-z0-9-]{2,63}$") val slug: String,
)

@RestController
@RequestMapping("/api/tenants")
class TenantController(
    private val subscriptionService: SubscriptionService,
    private val tenantRepository: TenantRepository,
) {

    @GetMapping("/me")
    fun me(@AuthenticationPrincipal user: User): TenantResponse {
        val t = user.tenant
        return TenantResponse(
            t.id.toString(), t.slug, t.name,
            subscriptionService.getEffectivePlan(t),
            user.passwordHash != null,
        )
    }

    @PutMapping("/me")
    @Transactional
    fun updateMe(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody req: UpdateTenantRequest,
    ): TenantResponse {
        val t = user.tenant
        if (req.slug != t.slug && tenantRepository.findBySlug(req.slug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug already taken")
        t.slug = req.slug
        t.name = req.name
        val saved = tenantRepository.save(t)
        return TenantResponse(
            saved.id.toString(), saved.slug, saved.name,
            subscriptionService.getEffectivePlan(saved),
            user.passwordHash != null,
        )
    }
}
