package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetStorage
import dev.marcal.cursoteca.assets.StoredAsset
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Path
import java.util.UUID

@Component
class LessonAssetStorage(
    private val assetStorage: AssetStorage,
) {
    fun saveVideo(
        courseSlug: String,
        video: MultipartFile,
    ): StoredAsset = assetStorage.save(videoPath(courseSlug), video)

    fun delete(relativePath: String) = assetStorage.delete(Path.of(relativePath))

    private fun videoPath(courseSlug: String): Path = Path.of("courses", courseSlug, "lessons", "${UUID.randomUUID()}.mp4")
}
