package com.systemcalculator.email

import com.systemcalculator.user.User
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class EmailService(
    private val emailSender: EmailSender,
    @Value("\${app.frontend-url}") private val frontendUrl: String,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    suspend fun sendVerificationEmail(user: User, rawToken: String) {
        val link = "$frontendUrl/verify-email?token=$rawToken"
        emailSender.send(user.email, "Verify your email address", buildTestHtml(link))
        log.info("Sent verification email to {}", user.email)
    }

    private fun buildHtml(link: String) = """
        <!DOCTYPE html>
        <html>
        <body style="font-family:sans-serif;color:#111;max-width:480px;margin:40px auto;padding:0 24px">
          <h2 style="margin-bottom:8px">Confirm your email</h2>
          <p>Click the button below to activate your account. This link expires in 24 hours.</p>
          <p>
            <a href="$link"
               style="display:inline-block;padding:12px 24px;background:#818cf8;
                      color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
              Verify email
            </a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:32px">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </body>
        </html>
    """.trimIndent()

    private fun buildTestHtml(link: String) = """
        This is a test email from Prexario.
        
        Thanks
    """.trimIndent()
}
