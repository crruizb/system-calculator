package com.systemcalculator.config

import com.systemcalculator.email.EmailSender
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary

@TestConfiguration
class TestEmailSenderConfig {
    @Bean
    @Primary
    fun emailSender(): EmailSender = object : EmailSender {
        override suspend fun send(to: String, subject: String, htmlBody: String) {
            // no-op — prevents real HTTP calls to Resend in tests
        }
    }
}
