package com.systemcalculator.pdf

import com.systemcalculator.calculator.CalculatorRepository
import com.systemcalculator.subscription.SubscriptionService
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/pdf")
class PdfController(
    private val pdfService: PdfService,
    private val calculatorRepository: CalculatorRepository,
    private val subscriptionService: SubscriptionService
) {

    @PostMapping("/{tenantSlug}/{calcSlug}")
    fun generate(
        @PathVariable tenantSlug: String,
        @PathVariable calcSlug: String,
        @RequestBody req: PdfRequest
    ): ResponseEntity<ByteArray> {
        val calc = calculatorRepository.findByTenantSlugAndSlugAndIsActiveTrue(tenantSlug, calcSlug)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Calculator not found")

        if (subscriptionService.getEffectivePlan(calc.tenant) != "pro")
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "PDF export requires Pro plan")

        if (req.instances.isEmpty())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No instances provided")

        if (req.instances.size > 50)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many instances")

        val bytes = pdfService.generate(calc, req)

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"presupuesto.pdf\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(bytes)
    }
}
