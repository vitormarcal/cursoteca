package dev.marcal.cursoteca.course

import org.springframework.web.multipart.MultipartFile

class CreateCourseCommand private constructor(
	val name: String,
	val description: String,
	val image: MultipartFile,
) {
	companion object {
		fun from(name: String, description: String, image: MultipartFile): CreateCourseCommand {
			val cleanName = requiredText(name, "name")
			val cleanDescription = requiredText(description, "description")

			if (image.isEmpty) {
				throw invalid("image", "image is required")
			}
			if (!image.contentType.orEmpty().startsWith("image/")) {
				throw invalid("image", "image must be an image file")
			}

			return CreateCourseCommand(
				name = cleanName,
				description = cleanDescription,
				image = image,
			)
		}

		private fun requiredText(value: String, field: String): String {
			val clean = value.trim()
			if (clean.isBlank()) {
				throw invalid(field, "$field is required")
			}
			return clean
		}

		private fun invalid(field: String, message: String) = InvalidCourseInputException(
			mapOf(field to message),
		)
	}
}
