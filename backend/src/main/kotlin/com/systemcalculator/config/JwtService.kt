package com.systemcalculator.config

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Date
import java.util.UUID

@Service
class JwtService(
    @Value("\${app.jwt.secret}") private val secret: String,
    @Value("\${app.jwt.expiration-ms}") private val expirationMs: Long
) {
    private val key by lazy { Keys.hmacShaKeyFor(secret.toByteArray()) }

    fun generateToken(userId: UUID, tenantId: UUID): String =
        Jwts.builder()
            .subject(userId.toString())
            .claim("tenantId", tenantId.toString())
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + expirationMs))
            .signWith(key)
            .compact()

    fun parseUserId(token: String): UUID =
        UUID.fromString(claims(token).subject)

    fun parseTenantId(token: String): UUID =
        UUID.fromString(claims(token)["tenantId"] as String)

    private fun claims(token: String): Claims =
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
}
