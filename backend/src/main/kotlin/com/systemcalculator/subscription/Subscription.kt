package com.systemcalculator.subscription

import com.systemcalculator.tenant.Tenant
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "subscriptions")
class Subscription(
    @Id val id: UUID = UUID.randomUUID(),
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    val tenant: Tenant,
    @Column var stripeSubscriptionId: String? = null,
    @Column(nullable = false) var plan: String = "free",
    @Column(nullable = false) var status: String = "active",
    @Column var currentPeriodEnd: Instant? = null,
    @Column(nullable = false) val createdAt: Instant = Instant.now()
)
