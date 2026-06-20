package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetStorage
import dev.marcal.cursoteca.assets.AssetsProperties
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertTrue

class LessonAssetStorageTest {
    @Test
    fun `stores video with generated name in course lesson directory`(
        @TempDir assetsDir: Path,
    ) {
        val storage = LessonAssetStorage(AssetStorage(AssetsProperties(assetsDir.toString())))
        val video = MockMultipartFile("video", "../unsafe name.mp4", "video/mp4", byteArrayOf(1, 2, 3))

        val stored = storage.saveVideo("curso-kotlin", video)

        assertTrue(stored.relativePath.matches(Regex("courses/curso-kotlin/lessons/[a-f0-9-]+\\.mp4")))
        assertTrue(Files.exists(assetsDir.resolve(stored.relativePath)))
    }
}
