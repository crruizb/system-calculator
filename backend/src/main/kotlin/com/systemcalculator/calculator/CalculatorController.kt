package com.systemcalculator.calculator

import com.systemcalculator.calculator.dto.CreateCalculatorRequest
import com.systemcalculator.calculator.dto.UpdateCalculatorRequest
import com.systemcalculator.user.User
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
class CalculatorController(private val calculatorService: CalculatorService) {

    @GetMapping("/api/calculators")
    fun list(@AuthenticationPrincipal user: User) = calculatorService.list(user)

    @PostMapping("/api/calculators")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody req: CreateCalculatorRequest
    ) = calculatorService.create(user, req)

    @PutMapping("/api/calculators/{id}")
    fun update(
        @AuthenticationPrincipal user: User,
        @PathVariable id: UUID,
        @Valid @RequestBody req: UpdateCalculatorRequest
    ) = calculatorService.update(user, id, req)

    @DeleteMapping("/api/calculators/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@AuthenticationPrincipal user: User, @PathVariable id: UUID) =
        calculatorService.delete(user, id)

    @GetMapping("/api/public/{tenantSlug}/{calcSlug}")
    fun getPublic(@PathVariable tenantSlug: String, @PathVariable calcSlug: String) =
        calculatorService.getPublic(tenantSlug, calcSlug)
}
