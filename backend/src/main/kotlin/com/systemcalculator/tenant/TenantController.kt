package com.systemcalculator.tenant

import com.systemcalculator.user.User
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

data class TenantResponse(val id: String, val slug: String, val name: String, val plan: String)

@RestController
@RequestMapping("/api/tenants")
class TenantController {

    @GetMapping("/me")
    fun me(@AuthenticationPrincipal user: User): TenantResponse {
        val t = user.tenant
        return TenantResponse(t.id.toString(), t.slug, t.name, t.plan)
    }
}
