package com.systemcalculator.subscription

import com.stripe.Stripe
import com.stripe.model.checkout.Session
import com.stripe.param.checkout.SessionCreateParams
import com.stripe.model.billingportal.Session as PortalSession
import com.stripe.param.billingportal.SessionCreateParams as PortalParams
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
class SubscriptionService(
    private val subscriptionRepository: SubscriptionRepository,
    private val tenantRepository: TenantRepository,
    @Value("\${app.stripe.secret-key}") private val stripeSecretKey: String,
    @Value("\${app.stripe.basic-price-id}") private val basicPriceId: String,
    @Value("\${app.stripe.pro-price-id}") private val proPriceId: String,
    @Value("\${app.stripe.success-url}") private val successUrl: String,
    @Value("\${app.stripe.cancel-url}") private val cancelUrl: String
) {
    init { Stripe.apiKey = stripeSecretKey }

    fun createCheckoutUrl(tenant: Tenant, plan: String): String {
        val priceId = when (plan) {
            "basic" -> basicPriceId
            "pro"   -> proPriceId
            else    -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid plan: $plan")
        }
        val params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setPrice(priceId)
                    .setQuantity(1)
                    .build()
            )
            .putMetadata("tenantId", tenant.id.toString())
            .putMetadata("plan", plan)
            .build()
        return Session.create(params).url
    }

    fun createPortalUrl(tenant: Tenant): String {
        val sub = subscriptionRepository.findByTenantId(tenant.id)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No active subscription found")
        val customerId = sub.stripeSubscriptionId
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No Stripe subscription linked")
        val stripeCustomerId = com.stripe.model.Subscription.retrieve(customerId).customer
        val params = PortalParams.builder()
            .setCustomer(stripeCustomerId)
            .setReturnUrl(cancelUrl)
            .build()
        return PortalSession.create(params).url
    }

    @Transactional
    fun handleSubscriptionUpdated(stripeSubscriptionId: String, plan: String, status: String, tenantId: String) {
        val tenant = tenantRepository.findById(java.util.UUID.fromString(tenantId)).orElseThrow {
            IllegalStateException("Tenant $tenantId not found for Stripe subscription $stripeSubscriptionId")
        }
        val sub = subscriptionRepository.findByTenantId(tenant.id)
            ?: Subscription(tenant = tenant)
        sub.stripeSubscriptionId = stripeSubscriptionId
        sub.plan = plan
        sub.status = status
        subscriptionRepository.save(sub)
        tenant.plan = if (status == "active") plan else "free"
        tenantRepository.save(tenant)
    }
}
