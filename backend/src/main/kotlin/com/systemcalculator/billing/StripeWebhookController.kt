package com.systemcalculator.billing

import com.stripe.exception.SignatureVerificationException
import com.stripe.net.Webhook
import com.systemcalculator.subscription.SubscriptionService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/webhooks")
class StripeWebhookController(
    private val subscriptionService: SubscriptionService,
    @Value("\${app.stripe.webhook-secret}") private val webhookSecret: String
) {

    @PostMapping("/stripe", consumes = ["application/json", "text/plain", "application/*"])
    fun handleStripe(
        @RequestBody payload: String,
        request: HttpServletRequest
    ): ResponseEntity<String> {
        val sigHeader = request.getHeader("Stripe-Signature")
            ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing signature")

        val event = try {
            Webhook.constructEvent(payload, sigHeader, webhookSecret)
        } catch (e: SignatureVerificationException) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature")
        }

        when (event.type) {
            "customer.subscription.updated", "customer.subscription.created" -> {
                val sub = event.dataObjectDeserializer.`object`.orElse(null)
                    as? com.stripe.model.Subscription ?: return ResponseEntity.ok("ignored")
                val tenantId = sub.metadata["tenantId"] ?: return ResponseEntity.ok("no tenantId")
                val plan = resolvePlan(sub)
                subscriptionService.handleSubscriptionUpdated(sub.id, plan, sub.status, tenantId)
            }
            "customer.subscription.deleted" -> {
                val sub = event.dataObjectDeserializer.`object`.orElse(null)
                    as? com.stripe.model.Subscription ?: return ResponseEntity.ok("ignored")
                val tenantId = sub.metadata["tenantId"] ?: return ResponseEntity.ok("no tenantId")
                subscriptionService.handleSubscriptionUpdated(sub.id, "free", "canceled", tenantId)
            }
        }
        return ResponseEntity.ok("ok")
    }

    private fun resolvePlan(sub: com.stripe.model.Subscription): String {
        return sub.metadata["plan"] ?: "basic"
    }
}
