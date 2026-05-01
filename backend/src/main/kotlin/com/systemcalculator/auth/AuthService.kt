package com.systemcalculator.auth

import com.systemcalculator.auth.dto.*
import com.systemcalculator.config.JwtService
import com.systemcalculator.email.EmailService
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import com.systemcalculator.user.User
import com.systemcalculator.user.UserRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import org.springframework.beans.factory.annotation.Value
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager
import org.springframework.web.server.ResponseStatusException
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Base64

data class TokenPair(val accessToken: String, val refreshToken: String)

@Service
class AuthService(
    private val tenantRepository: TenantRepository,
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val emailVerificationRepository: EmailVerificationRepository,
    private val emailService: EmailService,
    private val appScope: CoroutineScope,
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
            val rawToken = generateSecureToken()
            emailVerificationRepository.save(
                EmailVerification(
                    user = user,
                    tokenHash = hashToken(rawToken),
                    expiresAt = Instant.now().plus(24, ChronoUnit.HOURS)
                )
            )
            sendAfterCommit(user, rawToken)
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
            }
            // Google has verified ownership of this email
            if (!existingUser.emailVerified) {
                existingUser.emailVerified = true
                emailVerificationRepository.findByUser(existingUser)?.let {
                    emailVerificationRepository.delete(it)
                }
            }
            return userRepository.save(existingUser)
        }
        val slug = generateUniqueSlug(email)
        val tenant = tenantRepository.save(Tenant(slug = slug, name = slug))
        return userRepository.save(
            User(tenant = tenant, email = email, googleSub = googleSub, emailVerified = true)
        )
    }

    @Transactional
    fun verifyEmail(rawToken: String) {
        val hash = hashToken(rawToken)
        val record = emailVerificationRepository.findByTokenHash(hash)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired token")
        if (record.expiresAt.isBefore(Instant.now()))
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired token")
        record.user.emailVerified = true
        userRepository.save(record.user)
        emailVerificationRepository.delete(record)
    }

    @Transactional
    fun resendVerificationEmail(user: User) {
        if (user.emailVerified)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already verified")
        emailVerificationRepository.deleteByUser(user)
        val rawToken = generateSecureToken()
        emailVerificationRepository.save(
            EmailVerification(
                user = user,
                tokenHash = hashToken(rawToken),
                expiresAt = Instant.now().plus(24, ChronoUnit.HOURS)
            )
        )
        sendAfterCommit(user, rawToken)
    }

    fun issueTokenPair(user: User): TokenPair {
        val accessToken = jwtService.generateToken(user.id, user.tenant.id)
        val rawRefresh = generateSecureToken()
        val hash = hashToken(rawRefresh)
        val expiresAt = Instant.now().plusMillis(refreshExpirationMs)
        refreshTokenRepository.save(RefreshToken(user = user, tokenHash = hash, expiresAt = expiresAt))
        return TokenPair(accessToken, rawRefresh)
    }

    @Transactional
    fun changePassword(user: User, currentPassword: String, newPassword: String) {
        if (user.passwordHash == null)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No password set for this account")
        if (!passwordEncoder.matches(currentPassword, user.passwordHash))
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Current password incorrect")
        user.passwordHash = passwordEncoder.encode(newPassword)
        userRepository.save(user)
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

    private fun sendAfterCommit(user: User, rawToken: String) {
        TransactionSynchronizationManager.registerSynchronization(object : TransactionSynchronization {
            override fun afterCommit() {
                appScope.launch { emailService.sendVerificationEmail(user, rawToken) }
            }
        })
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
