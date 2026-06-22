package dev.marcal.cursoteca.course

import java.net.URI

data class CreateLessonDownloadRequest(
    val sectionId: Long? = null,
    val title: String = "",
    val description: String? = null,
    val url: String = "",
)

data class CreateLessonDownloadCommand(
    val sectionId: Long?,
    val title: String,
    val description: String,
    val url: String,
) {
    companion object {
        fun from(request: CreateLessonDownloadRequest): CreateLessonDownloadCommand {
            val title = request.title.trim()
            if (title.isBlank()) throw InvalidLessonInputException(mapOf("title" to "title is required"))
            if (title.length > 180) throw InvalidLessonInputException(mapOf("title" to "title must be at most 180 characters"))
            val description = request.description.orEmpty().trim()
            val url = request.url.trim()
            val uri = runCatching { URI(url) }.getOrNull()
            if (uri == null || uri.scheme !in setOf("http", "https") || uri.host.isNullOrBlank()) {
                throw InvalidLessonInputException(mapOf("url" to "url must be a valid HTTP or HTTPS URL"))
            }
            return CreateLessonDownloadCommand(request.sectionId, title, description, url)
        }
    }
}
