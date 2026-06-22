package dev.marcal.cursoteca.course

import org.springframework.web.multipart.MultipartFile
import java.nio.file.Path
import kotlin.io.path.extension

data class CreateResourceFileCommand(
    val scope: ResourceScope,
    val sectionId: Long?,
    val lessonId: Long?,
    val title: String,
    val description: String,
    val file: MultipartFile,
    val extension: String,
    val mimeType: String,
) {
    companion object {
        private val supportedTypes =
            mapOf(
                "pdf" to FileType("application/pdf", setOf("application/pdf")),
                "mp3" to FileType("audio/mpeg", setOf("audio/mpeg", "audio/mp3")),
                "m4a" to FileType("audio/mp4", setOf("audio/mp4", "audio/x-m4a")),
                "wav" to FileType("audio/wav", setOf("audio/wav", "audio/x-wav", "audio/wave")),
                "ogg" to FileType("audio/ogg", setOf("audio/ogg", "application/ogg")),
                "flac" to FileType("audio/flac", setOf("audio/flac", "audio/x-flac")),
            )

        fun from(
            scopeValue: String,
            sectionId: Long?,
            lessonId: Long?,
            titleValue: String,
            descriptionValue: String,
            file: MultipartFile,
        ): CreateResourceFileCommand {
            val scope = parseScope(scopeValue)
            validateTarget(scope, sectionId, lessonId)

            val title = titleValue.trim()
            if (title.isBlank()) throw invalid("title", "title is required")
            if (title.length > 180) throw invalid("title", "title must be at most 180 characters")
            val description = descriptionValue.trim()
            if (description.length > 8000) {
                throw invalid("description", "description must be at most 8000 characters")
            }
            if (file.isEmpty) throw invalid("file", "file is required")

            val extension =
                file.originalFilename
                    ?.let { Path.of(it).fileName.toString() }
                    ?.let { Path.of(it).extension.lowercase() }
            val type = supportedTypes[extension]
            if (type == null || file.contentType !in type.acceptedMimeTypes) {
                throw invalid("file", "file must be a supported PDF or audio file")
            }

            return CreateResourceFileCommand(
                scope,
                sectionId,
                lessonId,
                title,
                description,
                file,
                requireNotNull(extension),
                type.canonicalMimeType,
            )
        }

        private fun parseScope(value: String): ResourceScope =
            runCatching { ResourceScope.valueOf(value.trim().uppercase()) }
                .getOrElse { throw invalid("scope", "scope must be COURSE, SECTION or LESSON") }

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

        private data class FileType(
            val canonicalMimeType: String,
            val acceptedMimeTypes: Set<String>,
        )
    }
}
