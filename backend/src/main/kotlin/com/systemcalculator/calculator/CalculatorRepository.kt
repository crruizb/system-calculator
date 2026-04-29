package com.systemcalculator.calculator

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CalculatorRepository : JpaRepository<Calculator, UUID> {
    fun countByTenantIdAndIsActiveTrue(tenantId: UUID): Long
    fun findByTenantSlugAndSlugAndIsActiveTrue(tenantSlug: String, slug: String): Calculator?
    fun findByTenantId(tenantId: UUID): List<Calculator>
    fun findByIdAndTenantId(id: UUID, tenantId: UUID): Calculator?
    fun findByTenantSlugAndSlug(tenantSlug: String, slug: String): Calculator?
}
