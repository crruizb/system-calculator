package com.systemcalculator.tenant

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "tenants")
class Tenant(
    @Id val id: UUID = UUID.randomUUID(),
    @Column(unique = true, nullable = false) val slug: String,
    @Column(nullable = false) var name: String,
    @Column(nullable = false) var plan: String = "free",
    @Column(nullable = false) val createdAt: Instant = Instant.now()
)
