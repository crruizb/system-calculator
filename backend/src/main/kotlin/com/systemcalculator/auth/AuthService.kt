package com.systemcalculator.auth

import com.systemcalculator.auth.dto.*
import com.systemcalculator.config.JwtService
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import com.systemcalculator.user.User
import com.systemcalculator.user.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.Base64

data class TokenPair(val accessToken: String, val refreshToken: String)

@Service
class AuthService(
    private val tenantRepository: TenantRepository,
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    @Value("\${app.jwt.refresh-expiration-ms}") private val refreshExpirationMs: Long,
) {
    @Transactional
    fun register(req: RegisterRequest): TokenPair {
        if (tenantRepository.findBySlug(req.tenantSlug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug already taken")
        if (userRepository.findByEmail(req.email) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email already registered")
        return try {
            val tenant = tenantRepository.save(Tenant(slug = req.tenantSlug, name = req.tenantName))
            val user = userRepository.save(
                User(tenant = tenant, email = req.email, passwordHash = passwordEncoder.encode(req.password))
            )
            issueTokenPair(user)
        } catch (e: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email or slug already registered")
        }
    }

    fun login(req: LoginRequest): TokenPair {
        val user = userRepository.findByEmail(req.email)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        if (user.passwordHash == null || !passwordEncoder.matches(req.password, user.passwordHash))
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        return issueTokenPair(user)
    }

    @Transactional
    fun refresh(rawToken: String): TokenPair {
        val hash = hashToken(rawToken)
        val stored = refreshTokenRepository.findByTokenHash(hash)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token")
        if (stored.revoked || stored.expiresAt.isBefore(Instant.now()))
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked")

        stored.revoked = true
        refreshTokenRepository.save(stored)

        return issueTokenPair(stored.user)
    }

    @Transactional
    fun revoke(rawToken: String) {
        val hash = hashToken(rawToken)
        val stored = refreshTokenRepository.findByTokenHash(hash) ?: return
        stored.revoked = true
        refreshTokenRepository.save(stored)
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

    fun issueTokenPair(user: User): TokenPair {
        val accessToken = jwtService.generateToken(user.id, user.tenant.id)
        val rawRefresh = generateSecureToken()
        val hash = hashToken(rawRefresh)
        val expiresAt = Instant.now().plusMillis(refreshExpirationMs)
        refreshTokenRepository.save(RefreshToken(user = user, tokenHash = hash, expiresAt = expiresAt))
        return TokenPair(accessToken, rawRefresh)
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

    private fun generateSecureToken(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun hashToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(token.toByteArray()).joinToString("") { "%02x".format(it) }
    }
}
