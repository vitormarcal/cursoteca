package dev.marcal.cursoteca.course

import org.springframework.web.multipart.MultipartFile
import java.nio.file.Path
import kotlin.io.path.extension

data class CreateLessonCommand(
    val sectionId: Long?,
    val title: String,
    val description: String,
    val video: MultipartFile,
) {
    companion object {
        fun from(
            sectionId: Long?,
            title: String,
            description: String,
            video: MultipartFile,
        ): CreateLessonCommand {
            val cleanTitle = title.trim()
            if (cleanTitle.isBlank()) {
                throw InvalidLessonInputException(mapOf("title" to "title is required"))
            }
            if (cleanTitle.length > 180) {
                throw InvalidLessonInputException(mapOf("title" to "title must be at most 180 characters"))
            }

            val cleanDescription = description.trim()
            if (cleanDescription.length > 8000) {
                throw InvalidLessonInputException(
                    mapOf("description" to "description must be at most 8000 characters"),
                )
            }

            if (video.isEmpty) {
                throw InvalidLessonInputException(mapOf("video" to "video is required"))
            }
            val extension =
                video.originalFilename
                    ?.let { Path.of(it).fileName.toString() }
                    ?.let { Path.of(it).extension.lowercase() }
            if (extension != "mp4" || video.contentType != "video/mp4") {
                throw InvalidLessonInputException(mapOf("video" to "video must be an MP4 file"))
            }

            return CreateLessonCommand(sectionId, cleanTitle, cleanDescription, video)
        }
    }
}
