package com.systemcalculator.subscription

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface SubscriptionRepository : JpaRepository<Subscription, UUID> {
    fun findByTenantId(tenantId: UUID): Subscription?
    fun findByStripeSubscriptionId(stripeSubscriptionId: String): Subscription?
}
