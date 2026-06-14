package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetStorage
import dev.marcal.cursoteca.assets.AssetsProperties
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class CourseAssetStorageTest {
    @Test
    fun `creates course directory and stores cover image in course layout`(
        @TempDir assetsDir: Path,
    ) {
        val storage = CourseAssetStorage(AssetStorage(AssetsProperties(assetsDir.toString())))
        val image = MockMultipartFile("image", "cover.png", "image/png", byteArrayOf(1, 2, 3))

        val courseDirectory = storage.createCourseDirectory("curso-kotlin")
        val storedImage = storage.saveCoverImage("curso-kotlin", image)

        assertEquals("courses/curso-kotlin", courseDirectory)
        assertEquals("courses/curso-kotlin/image.png", storedImage.relativePath)
        assertTrue(Files.exists(assetsDir.resolve("courses/curso-kotlin/image.png")))
    }
}
