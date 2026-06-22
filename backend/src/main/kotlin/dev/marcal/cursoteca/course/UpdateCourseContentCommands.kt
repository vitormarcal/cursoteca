package dev.marcal.cursoteca.course

data class UpdateCourseSectionRequest(
    val title: String = "",
    val description: String = "",
)

data class UpdateCourseSectionCommand(
    val title: String,
    val description: String,
) {
    companion object {
        fun from(request: UpdateCourseSectionRequest): UpdateCourseSectionCommand {
            val title = request.title.trim()
            if (title.isBlank()) throw InvalidCourseSectionInputException(mapOf("title" to "title is required"))
            if (title.length > 180) {
                throw InvalidCourseSectionInputException(mapOf("title" to "title must be at most 180 characters"))
            }
            val description = request.description.trim()
            if (description.length > 8000) {
                throw InvalidCourseSectionInputException(
                    mapOf("description" to "description must be at most 8000 characters"),
                )
            }
            return UpdateCourseSectionCommand(title, description)
        }
    }
}

data class ReorderCourseSectionsRequest(
    val parentId: Long? = null,
    val sectionIds: List<Long> = emptyList(),
)

data class UpdateLessonRequest(
    val sectionId: Long? = null,
    val title: String = "",
    val description: String = "",
)

data class UpdateLessonCommand(
    val sectionId: Long?,
    val title: String,
    val description: String,
) {
    companion object {
        fun from(request: UpdateLessonRequest): UpdateLessonCommand {
            val title = request.title.trim()
            if (title.isBlank()) throw InvalidLessonInputException(mapOf("title" to "title is required"))
            if (title.length > 180) {
                throw InvalidLessonInputException(mapOf("title" to "title must be at most 180 characters"))
            }
            val description = request.description.trim()
            if (description.length > 8000) {
                throw InvalidLessonInputException(mapOf("description" to "description must be at most 8000 characters"))
            }
            return UpdateLessonCommand(request.sectionId, title, description)
        }
    }
}

data class ReorderLessonsRequest(
    val sectionId: Long? = null,
    val lessonIds: List<Long> = emptyList(),
)
