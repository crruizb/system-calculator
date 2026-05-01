package com.systemcalculator.config

import jakarta.annotation.PreDestroy
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class AppCoroutineScopeConfig {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    @Bean
    fun appCoroutineScope(): CoroutineScope = scope

    @PreDestroy
    fun onDestroy() = scope.cancel()
}
