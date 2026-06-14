package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetStorage
import dev.marcal.cursoteca.assets.StoredAsset
import dev.marcal.cursoteca.assets.safeImageExtension
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Path

@Component
class CourseAssetStorage(
    private val assetStorage: AssetStorage,
) {
    fun createCourseDirectory(slug: String): String = assetStorage.createDirectory(courseDirectory(slug))

    fun saveCoverImage(
        slug: String,
        image: MultipartFile,
    ): StoredAsset {
        val imageFileName = "image.${image.safeImageExtension()}"
        return assetStorage.save(courseDirectory(slug).resolve(imageFileName), image)
    }

    private fun courseDirectory(slug: String): Path = Path.of("courses", slug)
}
