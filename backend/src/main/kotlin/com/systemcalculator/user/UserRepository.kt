package com.systemcalculator.user

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface UserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): User?
    fun findByGoogleSub(googleSub: String): User?
}
