package com.systemcalculator.email

interface EmailSender {
    suspend fun send(to: String, subject: String, htmlBody: String)
}
