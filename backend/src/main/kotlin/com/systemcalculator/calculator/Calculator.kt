package com.systemcalculator.calculator

import com.systemcalculator.tenant.Tenant
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "calculators")
class Calculator(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    val tenant: Tenant,
    @Column(nullable = false) val slug: String,
    @Column(nullable = false) var name: String,
    @Column(nullable = false) var sheetUrl: String,
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb") var settings: Map<String, Any> = emptyMap(),
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb") var branding: Map<String, Any> = emptyMap(),
    @Column(nullable = false) var isActive: Boolean = true,
    @Column(nullable = false) val createdAt: Instant = Instant.now()
)
