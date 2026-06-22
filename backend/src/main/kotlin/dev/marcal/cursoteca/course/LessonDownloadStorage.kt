package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetStorage
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path

@Component
class LessonDownloadStorage(
    private val assetStorage: AssetStorage,
) {
    fun outputTemplate(
        courseSlug: String,
        jobId: Long,
    ): String {
        val directory = Path.of("courses", courseSlug, "lessons")
        assetStorage.createDirectory(directory)
        return assetStorage.resolve(directory.resolve("download-$jobId.%(ext)s")).toString()
    }

    fun validateResult(rawPath: String): String {
        val path = Path.of(rawPath).toAbsolutePath().normalize()
        if (!Files.isRegularFile(path) || path.fileName
                .toString()
                .substringAfterLast('.', "")
                .lowercase() != "mp4"
        ) {
            throw IllegalStateException("yt-dlp did not produce a valid MP4 file")
        }
        return assetStorage.relativePath(path)
    }

    fun cleanup(
        courseSlug: String,
        jobId: Long,
    ) {
        val directory = assetStorage.resolve(Path.of("courses", courseSlug, "lessons"))
        if (!Files.isDirectory(directory)) return
        Files.list(directory).use { paths ->
            paths.filter { it.fileName.toString().startsWith("download-$jobId.") }.forEach(Files::deleteIfExists)
        }
    }
}
