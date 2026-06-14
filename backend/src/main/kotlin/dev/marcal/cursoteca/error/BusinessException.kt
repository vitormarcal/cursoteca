package dev.marcal.cursoteca.error

open class BusinessException(
    val reason: ReasonEnum,
    cause: Throwable? = null,
    val details: Map<String, String> = emptyMap(),
) : RuntimeException(reason.description, cause)
