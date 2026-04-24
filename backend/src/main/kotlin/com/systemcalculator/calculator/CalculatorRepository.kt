package com.systemcalculator.calculator

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CalculatorRepository : JpaRepository<Calculator, UUID> {
    fun findByTenantIdAndIsActiveTrue(tenantId: UUID): List<Calculator>
    fun countByTenantIdAndIsActiveTrue(tenantId: UUID): Long
    fun findByTenantSlugAndSlugAndIsActiveTrue(tenantSlug: String, slug: String): Calculator?
    fun findByIdAndTenantIdAndIsActiveTrue(id: UUID, tenantId: UUID): Calculator?
}
