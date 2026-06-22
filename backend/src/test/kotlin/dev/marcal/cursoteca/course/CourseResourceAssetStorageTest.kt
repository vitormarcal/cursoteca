package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetStorage
import dev.marcal.cursoteca.assets.AssetsProperties
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertTrue

class CourseResourceAssetStorageTest {
    @Test
    fun `stores resource with generated name inside course`(
        @TempDir assetsDir: Path,
    ) {
        val storage = CourseResourceAssetStorage(AssetStorage(AssetsProperties(assetsDir.toString())))
        val file = MockMultipartFile("file", "../unsafe.pdf", "application/pdf", byteArrayOf(1))

        val stored = storage.save("sample-course", "pdf", file)

        assertTrue(stored.relativePath.matches(Regex("courses/sample-course/resources/[a-f0-9-]+\\.pdf")))
        assertTrue(Files.exists(assetsDir.resolve(stored.relativePath)))
    }
}
