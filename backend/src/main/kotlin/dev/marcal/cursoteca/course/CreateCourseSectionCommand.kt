package dev.marcal.cursoteca.course

data class CreateCourseSectionRequest(
    val parentId: Long? = null,
    val title: String = "",
    val description: String = "",
)

data class CreateCourseSectionCommand(
    val parentId: Long?,
    val title: String,
    val description: String,
) {
    companion object {
        fun from(request: CreateCourseSectionRequest): CreateCourseSectionCommand {
            val title = request.title.trim()
            if (title.isBlank()) {
                throw InvalidCourseSectionInputException(mapOf("title" to "title is required"))
            }
            if (title.length > 180) {
                throw InvalidCourseSectionInputException(mapOf("title" to "title must be at most 180 characters"))
            }

            val description = request.description.trim()
            if (description.length > 8000) {
                throw InvalidCourseSectionInputException(
                    mapOf("description" to "description must be at most 8000 characters"),
                )
            }

            return CreateCourseSectionCommand(
                parentId = request.parentId,
                title = title,
                description = description,
            )
        }
    }
}
