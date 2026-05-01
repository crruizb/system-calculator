package com.systemcalculator.user

import com.systemcalculator.tenant.Tenant
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "users")
class User(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    val tenant: Tenant,
    @Column(unique = true, nullable = false) val email: String,
    @Column var passwordHash: String? = null,
    @Column(unique = true) var googleSub: String? = null,
    @Column(nullable = false) val role: String = "owner",
    @Column(nullable = false) val createdAt: Instant = Instant.now(),
    @Column(nullable = false) var emailVerified: Boolean = false
)
