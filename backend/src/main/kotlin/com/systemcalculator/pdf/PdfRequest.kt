package com.systemcalculator.pdf

data class PdfInstanceRequest(
    val filters: Map<String, String> = emptyMap(),
    val price: String? = null
)

data class PdfRequest(
    val instances: List<PdfInstanceRequest> = emptyList(),
    val currency: String = "€",
    val locale: String = "es-ES"
)
