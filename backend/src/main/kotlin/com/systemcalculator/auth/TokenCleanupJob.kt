package com.systemcalculator.auth

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit

@Component
class TokenCleanupJob(private val refreshTokenRepository: RefreshTokenRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(cron = "0 0 3 * * *") // daily at 03:00
    @Transactional
    fun clean() {
        val now = Instant.now()
        val expired = refreshTokenRepository.deleteExpired(now)
        val revoked = refreshTokenRepository.deleteOldRevoked(now.minus(7, ChronoUnit.DAYS))
        log.info("Token cleanup: deleted {} expired, {} old-revoked", expired, revoked)
    }
}
