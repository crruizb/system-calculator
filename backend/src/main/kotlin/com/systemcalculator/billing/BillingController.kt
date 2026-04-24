package com.systemcalculator.billing

import com.systemcalculator.subscription.SubscriptionService
import com.systemcalculator.user.User
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/billing")
class BillingController(private val subscriptionService: SubscriptionService) {

    @GetMapping("/checkout")
    fun checkout(
        @AuthenticationPrincipal user: User,
        @RequestParam plan: String
    ) = mapOf("url" to subscriptionService.createCheckoutUrl(user.tenant, plan))

    @GetMapping("/portal")
    fun portal(@AuthenticationPrincipal user: User) =
        mapOf("url" to subscriptionService.createPortalUrl(user.tenant))
}
