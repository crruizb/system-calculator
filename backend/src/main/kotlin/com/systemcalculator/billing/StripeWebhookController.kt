package com.systemcalculator.billing

import com.stripe.exception.SignatureVerificationException
import com.stripe.net.Webhook
import com.systemcalculator.subscription.SubscriptionService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Instant

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
                val sub = deserializeSubscription(event.dataObjectDeserializer)
                    ?: return ResponseEntity.ok("ignored")
                val tenantId = sub.metadata["tenantId"] ?: return ResponseEntity.ok("no tenantId")
                subscriptionService.handleSubscriptionUpdated(sub.id, resolvePlan(sub), sub.status, tenantId, periodEnd(sub), sub.cancelAtPeriodEnd == true)
            }
            "customer.subscription.deleted" -> {
                val sub = deserializeSubscription(event.dataObjectDeserializer)
                    ?: return ResponseEntity.ok("ignored")
                val tenantId = sub.metadata["tenantId"] ?: return ResponseEntity.ok("no tenantId")
                subscriptionService.handleSubscriptionUpdated(sub.id, resolvePlan(sub), "canceled", tenantId, periodEnd(sub))
            }
        }
        return ResponseEntity.ok("ok")
    }

    private fun periodEnd(sub: com.stripe.model.Subscription): Instant? {
        val epochSec = sub.items?.data?.firstOrNull()?.currentPeriodEnd ?: return null
        return Instant.ofEpochSecond(epochSec)
    }

    private fun deserializeSubscription(
        deserializer: com.stripe.model.EventDataObjectDeserializer
    ): com.stripe.model.Subscription? {
        val obj = deserializer.`object`.orElse(null)
        if (obj != null) return obj as? com.stripe.model.Subscription
        return try {
            deserializer.deserializeUnsafe() as? com.stripe.model.Subscription
        } catch (e: Exception) {
            null
        }
    }

    private fun resolvePlan(sub: com.stripe.model.Subscription): String =
        sub.metadata["plan"] ?: "basic"
}
