package com.systemcalculator.auth

import com.systemcalculator.auth.dto.*
import com.systemcalculator.config.JwtService
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import com.systemcalculator.user.User
import com.systemcalculator.user.UserRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
class AuthService(
    private val tenantRepository: TenantRepository,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
) {
    @Transactional
    fun register(req: RegisterRequest): String {
        if (tenantRepository.findBySlug(req.tenantSlug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug already taken")
        if (userRepository.findByEmail(req.email) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email already registered")
        return try {
            val tenant = tenantRepository.save(Tenant(slug = req.tenantSlug, name = req.tenantName))
            val user = userRepository.save(
                User(tenant = tenant, email = req.email, passwordHash = passwordEncoder.encode(req.password))
            )
            jwtService.generateToken(user.id, tenant.id)
        } catch (e: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email or slug already registered")
        }
    }

    fun login(req: LoginRequest): String {
        val user = userRepository.findByEmail(req.email)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        if (user.passwordHash == null || !passwordEncoder.matches(req.password, user.passwordHash))
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        return jwtService.generateToken(user.id, user.tenant.id)
    }

    @Transactional
    fun findOrCreateGoogleUser(googleSub: String, email: String): User {
        val existingUser = userRepository.findByGoogleSub(googleSub)
            ?: userRepository.findByEmail(email)
        if (existingUser != null) {
            if (existingUser.googleSub == null) {
                existingUser.googleSub = googleSub
                userRepository.save(existingUser)
            }
            return existingUser
        }
        val slug = generateUniqueSlug(email)
        val tenant = tenantRepository.save(Tenant(slug = slug, name = slug))
        return userRepository.save(User(tenant = tenant, email = email, googleSub = googleSub))
    }

    fun generateUniqueSlug(email: String): String {
        val base = email.substringBefore('@')
            .lowercase()
            .replace('.', '-')
            .replace(Regex("[^a-z0-9-]"), "")
            .take(63)
        if (tenantRepository.findBySlug(base) == null) return base
        for (n in 2..10) {
            val candidate = "${base.take(60)}-$n"
            if (tenantRepository.findBySlug(candidate) == null) return candidate
        }
        throw ResponseStatusException(HttpStatus.CONFLICT, "Could not generate unique slug")
    }

    fun generateToken(user: User): String = jwtService.generateToken(user.id, user.tenant.id)
}
