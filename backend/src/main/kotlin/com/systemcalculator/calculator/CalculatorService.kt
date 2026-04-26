package com.systemcalculator.calculator

import com.systemcalculator.calculator.dto.*
import com.systemcalculator.subscription.SubscriptionService
import com.systemcalculator.user.User
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class CalculatorService(
    private val calculatorRepository: CalculatorRepository,
    private val subscriptionService: SubscriptionService
) {

    fun list(user: User): List<CalculatorResponse> =
        calculatorRepository.findByTenantIdAndIsActiveTrue(user.tenant.id).map { it.toResponse() }

    @Transactional
    fun create(user: User, req: CreateCalculatorRequest): CalculatorResponse {
        val plan = subscriptionService.getEffectivePlan(user.tenant)
        val limit = PlanLimits.maxCalculators(plan)
        val current = calculatorRepository.countByTenantIdAndIsActiveTrue(user.tenant.id)
        if (current >= limit)
            throw ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Plan '$plan' allows max $limit calculator(s). Upgrade to add more."
            )
        if (calculatorRepository.findByTenantSlugAndSlugAndIsActiveTrue(user.tenant.slug, req.slug) != null)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug '${req.slug}' already in use")

        if (req.branding.isNotEmpty() && plan != "pro")
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Branding requires Pro plan")

        val calc = try {
            calculatorRepository.save(
                Calculator(
                    tenant = user.tenant,
                    slug = req.slug,
                    name = req.name,
                    sheetUrl = req.sheetUrl,
                    settings = req.settings,
                    branding = req.branding
                )
            )
        } catch (e: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Slug '${req.slug}' already in use")
        }
        return calc.toResponse()
    }

    @Transactional
    fun update(user: User, id: UUID, req: UpdateCalculatorRequest): CalculatorResponse {
        val calc = getOwnedCalc(user, id)
        req.name?.let { calc.name = it }
        req.sheetUrl?.let { calc.sheetUrl = it }
        req.settings?.let { calc.settings = it }
        req.branding?.let {
            if (subscriptionService.getEffectivePlan(user.tenant) != "pro")
                throw ResponseStatusException(HttpStatus.FORBIDDEN, "Branding requires Pro plan")
            calc.branding = it
        }
        return calculatorRepository.save(calc).toResponse()
    }

    @Transactional
    fun delete(user: User, id: UUID) {
        val calc = getOwnedCalc(user, id)
        calc.isActive = false
        calculatorRepository.save(calc)
    }

    fun getPublic(tenantSlug: String, calcSlug: String): PublicCalculatorResponse {
        val calc = calculatorRepository.findByTenantSlugAndSlugAndIsActiveTrue(tenantSlug, calcSlug)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Calculator not found")
        val branding = if (subscriptionService.getEffectivePlan(calc.tenant) == "pro") calc.branding else emptyMap()
        return PublicCalculatorResponse(calc.sheetUrl, calc.settings, branding)
    }

    fun getOne(user: User, id: UUID): CalculatorResponse =
        getOwnedCalc(user, id).toResponse()

    private fun getOwnedCalc(user: User, id: UUID): Calculator =
        calculatorRepository.findByIdAndTenantIdAndIsActiveTrue(id, user.tenant.id)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Calculator not found")

    private fun Calculator.toResponse() = CalculatorResponse(
        id.toString(), tenant.slug, slug, name, sheetUrl, settings, branding, isActive
    )
}
