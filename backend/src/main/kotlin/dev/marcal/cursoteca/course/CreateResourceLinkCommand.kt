package dev.marcal.cursoteca.course

import java.net.URI

data class CreateResourceLinkRequest(
    val scope: String = "",
    val sectionId: Long? = null,
    val lessonId: Long? = null,
    val title: String = "",
    val description: String? = null,
    val url: String = "",
)

data class CreateResourceLinkCommand(
    val scope: ResourceScope,
    val sectionId: Long?,
    val lessonId: Long?,
    val title: String,
    val description: String,
    val url: String,
) {
    companion object {
        fun from(request: CreateResourceLinkRequest): CreateResourceLinkCommand {
            val scope =
                runCatching { ResourceScope.valueOf(request.scope.trim().uppercase()) }
                    .getOrElse {
                        throw invalid("scope", "scope must be COURSE, SECTION or LESSON")
                    }
            validateTarget(scope, request.sectionId, request.lessonId)

            val title = request.title.trim()
            if (title.isBlank()) throw invalid("title", "title is required")
            if (title.length > 180) throw invalid("title", "title must be at most 180 characters")

            val description = request.description.orEmpty().trim()
            if (description.length > 8000) {
                throw invalid("description", "description must be at most 8000 characters")
            }

            val url = request.url.trim()
            val uri = runCatching { URI(url) }.getOrNull()
            if (uri == null || uri.scheme !in setOf("http", "https") || uri.host.isNullOrBlank()) {
                throw invalid("url", "url must be a valid HTTP or HTTPS URL")
            }

            return CreateResourceLinkCommand(scope, request.sectionId, request.lessonId, title, description, url)
        }

        private fun validateTarget(
            scope: ResourceScope,
            sectionId: Long?,
            lessonId: Long?,
        ) {
            val valid =
                when (scope) {
                    ResourceScope.COURSE -> sectionId == null && lessonId == null
                    ResourceScope.SECTION -> sectionId != null && lessonId == null
                    ResourceScope.LESSON -> sectionId == null && lessonId != null
                }
            if (!valid) throw invalid("scope", "scope and target identifiers do not match")
        }

        private fun invalid(
            field: String,
            message: String,
        ) = InvalidResourceInputException(mapOf(field to message))
    }
}
