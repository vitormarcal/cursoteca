package dev.marcal.cursoteca.error

data class ApiErrorResponse(
    val status: Int,
    val code: Int,
    val description: String,
    val details: Map<String, String> = emptyMap(),
)
