package com.systemcalculator.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface RefreshTokenRepository : JpaRepository<RefreshToken, UUID> {
    fun findByTokenHash(hash: String): RefreshToken?

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :cutoff")
    fun deleteExpired(cutoff: Instant): Int

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.revoked = true AND r.createdAt < :cutoff")
    fun deleteOldRevoked(cutoff: Instant): Int
}
