package com.systemcalculator.tenant

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TenantRepository : JpaRepository<Tenant, UUID> {
    fun findBySlug(slug: String): Tenant?
}
