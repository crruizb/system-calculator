package com.systemcalculator.auth

import com.systemcalculator.user.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface EmailVerificationRepository : JpaRepository<EmailVerification, UUID> {
    fun findByTokenHash(hash: String): EmailVerification?
    fun findByUser(user: User): EmailVerification?

    @Modifying
    @Query("DELETE FROM EmailVerification e WHERE e.user = :user")
    fun deleteByUser(user: User): Int

    @Modifying
    @Query("DELETE FROM EmailVerification e WHERE e.expiresAt < :cutoff")
    fun deleteExpired(cutoff: Instant): Int
}
