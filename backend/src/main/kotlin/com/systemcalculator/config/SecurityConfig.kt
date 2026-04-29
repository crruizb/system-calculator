package com.systemcalculator.config

import com.systemcalculator.auth.GoogleOAuth2SuccessHandler
import com.systemcalculator.user.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.OncePerRequestFilter

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtService: JwtService,
    private val userRepository: UserRepository,
    private val googleOAuth2SuccessHandler: GoogleOAuth2SuccessHandler,
    @Value("\${app.frontend-url}") private val frontendUrl: String
) {
    companion object {
        private val log = LoggerFactory.getLogger(SecurityConfig::class.java)
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { }
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/logout",
                    "/api/auth/refresh",
                    "/api/public/**",
                    "/api/webhooks/**",
                    "/oauth2/**",
                    "/login/oauth2/**"
                ).permitAll()
                it.anyRequest().authenticated()
            }
            .exceptionHandling {
                it.authenticationEntryPoint { _, response, _ ->
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")
                }
            }
            .oauth2Login { it.successHandler(googleOAuth2SuccessHandler) }
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter::class.java)
        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration().apply {
            allowedOrigins = listOf(frontendUrl)
            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = true
        }
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", config)
        }
    }

    @Bean
    fun jwtAuthFilter() = object : OncePerRequestFilter() {
        override fun doFilterInternal(
            request: HttpServletRequest,
            response: HttpServletResponse,
            chain: FilterChain
        ) {
            val token = request.cookies?.find { it.name == "token" }?.value
            if (token != null) {
                runCatching {
                    val userId = jwtService.parseUserId(token)
                    val tenantId = jwtService.parseTenantId(token)
                    val user = userRepository.findById(userId).orElse(null)
                    if (user != null) {
                        val auth = UsernamePasswordAuthenticationToken(
                            user, null,
                            listOf(SimpleGrantedAuthority("ROLE_${user.role.uppercase()}"))
                        )
                        auth.details = tenantId
                        SecurityContextHolder.getContext().authentication = auth
                    }
                }.onFailure { log.debug("Invalid JWT token: {}", it.message) }
            }
            chain.doFilter(request, response)
        }
    }
}
