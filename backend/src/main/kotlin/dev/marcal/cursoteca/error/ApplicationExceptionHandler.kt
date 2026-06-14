package dev.marcal.cursoteca.error

import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.multipart.support.MissingServletRequestPartException
import org.springframework.web.server.ResponseStatusException

@RestControllerAdvice
class ApplicationExceptionHandler {
    @ExceptionHandler(BusinessException::class)
    fun business(error: BusinessException): ResponseEntity<ApiErrorResponse> =
        response(
            reason = error.reason,
            details = error.details,
        )

    @ExceptionHandler(
        HttpMessageNotReadableException::class,
        MissingServletRequestParameterException::class,
        MissingServletRequestPartException::class,
    )
    fun malformed(error: Exception): ResponseEntity<ApiErrorResponse> =
        response(
            reason = ReasonEnum.MALFORMED_REQUEST,
            details = mapOf("message" to error.message.orEmpty()),
        )

    @ExceptionHandler(ResponseStatusException::class)
    fun responseStatus(error: ResponseStatusException): ResponseEntity<ApiErrorResponse> {
        val status = error.statusCode
        return ResponseEntity.status(status).body(
            ApiErrorResponse(
                status = status.value(),
                code = status.value(),
                description = error.reason ?: "Request could not be processed.",
            ),
        )
    }

    @ExceptionHandler(Exception::class)
    fun unexpected(error: Exception): ResponseEntity<ApiErrorResponse> =
        response(
            reason = ReasonEnum.INTERNAL_ERROR,
            details = mapOf("exception" to error::class.simpleName.orEmpty()),
        )

    private fun response(
        reason: ReasonEnum,
        details: Map<String, String> = emptyMap(),
    ): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(reason.httpStatus).body(
            ApiErrorResponse(
                status = reason.httpStatus.value(),
                code = reason.code,
                description = reason.description,
                details = details,
            ),
        )
}
