package com.systemcalculator.auth

import com.systemcalculator.user.User
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "email_verifications")
class EmailVerification(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,
    @Column(nullable = false, unique = true) val tokenHash: String,
    @Column(nullable = false) val expiresAt: Instant,
    @Column(nullable = false) val createdAt: Instant = Instant.now()
)
