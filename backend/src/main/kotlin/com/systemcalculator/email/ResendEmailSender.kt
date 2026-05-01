package com.systemcalculator.email

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class ResendEmailSender(
    @Value("\${app.resend.api-key}") private val apiKey: String,
    @Value("\${app.resend.from-email}") private val fromEmail: String,
) : EmailSender {

    private val log = LoggerFactory.getLogger(javaClass)

    private val client = RestClient.builder()
        .baseUrl("https://api.resend.com")
        .defaultHeader("Authorization", "Bearer $apiKey")
        .build()

    override suspend fun send(to: String, subject: String, htmlBody: String) {
        withContext(Dispatchers.IO) {
            runCatching {
                client.post()
                    .uri("/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(mapOf("from" to fromEmail, "to" to listOf(to),
                                "subject" to subject, "html" to htmlBody))
                    .retrieve()
                    .toBodilessEntity()
            }.onFailure { log.error("Failed to send email to {}: {}", to, it.message) }
        }
    }
}
