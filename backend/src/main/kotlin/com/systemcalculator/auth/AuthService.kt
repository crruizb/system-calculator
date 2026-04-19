package com.systemcalculator.auth

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.systemcalculator.auth.dto.*
import com.systemcalculator.config.JwtService
import com.systemcalculator.tenant.Tenant
import com.systemcalculator.tenant.TenantRepository
import com.systemcalculator.user.User
import com.systemcalculator.user.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.dao.DataIntegrityViolationException
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
    @Value("\${app.google.client-id}") private val googleClientId: String
) {
    private val googleVerifier by lazy {
        GoogleIdTokenVerifier.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(listOf(googleClientId))
            .build()
    }

    @Transactional
    fun register(req: RegisterRequest): AuthResponse {
        if (tenantRepository.findBySlug(req.tenantSlug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug already taken")
        if (userRepository.findByEmail(req.email) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email already registered")

        return try {
            val tenant = tenantRepository.save(Tenant(slug = req.tenantSlug, name = req.tenantName))
            val user = userRepository.save(
                User(tenant = tenant, email = req.email, passwordHash = passwordEncoder.encode(req.password))
            )
            AuthResponse(jwtService.generateToken(user.id, tenant.id))
        } catch (e: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email or slug already registered")
        }
    }

    fun login(req: LoginRequest): AuthResponse {
        val user = userRepository.findByEmail(req.email)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        if (user.passwordHash == null || !passwordEncoder.matches(req.password, user.passwordHash))
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        return AuthResponse(jwtService.generateToken(user.id, user.tenant.id))
    }

    @Transactional
    fun googleAuth(req: GoogleAuthRequest): AuthResponse {
        val idToken = googleVerifier.verify(req.idToken)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token")

        val googleSub = idToken.payload.subject
        val email = idToken.payload.email

        val existingUser = userRepository.findByGoogleSub(googleSub)
            ?: userRepository.findByEmail(email)

        if (existingUser != null) {
            if (existingUser.googleSub == null) {
                existingUser.googleSub = googleSub
                userRepository.save(existingUser)
            }
            return AuthResponse(jwtService.generateToken(existingUser.id, existingUser.tenant.id))
        }

        val tenantName = req.tenantName
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantName required for first login")
        val tenantSlug = req.tenantSlug
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantSlug required for first login")

        if (tenantRepository.findBySlug(tenantSlug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug already taken")

        val tenant = tenantRepository.save(Tenant(slug = tenantSlug, name = tenantName))
        val user = userRepository.save(User(tenant = tenant, email = email, googleSub = googleSub))
        return AuthResponse(jwtService.generateToken(user.id, tenant.id))
    }
}
