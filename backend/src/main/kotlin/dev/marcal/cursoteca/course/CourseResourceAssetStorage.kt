package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetStorage
import dev.marcal.cursoteca.assets.StoredAsset
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Path
import java.util.UUID

@Component
class CourseResourceAssetStorage(
    private val assetStorage: AssetStorage,
) {
    fun save(
        courseSlug: String,
        extension: String,
        file: MultipartFile,
    ): StoredAsset = assetStorage.save(Path.of("courses", courseSlug, "resources", "${UUID.randomUUID()}.$extension"), file)

    fun delete(relativePath: String) = assetStorage.delete(Path.of(relativePath))
}
