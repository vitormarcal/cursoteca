package dev.marcal.cursoteca.error

import org.springframework.http.HttpStatus

// Error code ranges: 1xxx domain validation, 2xxx missing domain resources,
// 3xxx domain conflicts/state errors, 4xxx authorization, 9xxx technical errors.
enum class ReasonEnum(
	val httpStatus: HttpStatus,
	val code: Int,
	val description: String,
) {
	INVALID_COURSE_INPUT(
		HttpStatus.BAD_REQUEST,
		1001,
		"Course input is invalid.",
	),
	INVALID_COURSE_SECTION_INPUT(
		HttpStatus.BAD_REQUEST,
		1002,
		"Course section input is invalid.",
	),
	INVALID_ASSET_PATH(
		HttpStatus.BAD_REQUEST,
		1003,
		"Asset path must stay inside the configured assets directory.",
	),
	COURSE_NOT_FOUND(
		HttpStatus.NOT_FOUND,
		2001,
		"Course was not found.",
	),
	COURSE_SECTION_PARENT_NOT_FOUND(
		HttpStatus.NOT_FOUND,
		2002,
		"Course section parent was not found.",
	),
	MALFORMED_REQUEST(
		HttpStatus.BAD_REQUEST,
		9001,
		"Request body or parameters are malformed.",
	),
	INTERNAL_ERROR(
		HttpStatus.INTERNAL_SERVER_ERROR,
		9999,
		"An unexpected error occurred.",
	)
}
