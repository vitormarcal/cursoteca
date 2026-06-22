package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetStorage
import dev.marcal.cursoteca.assets.AssetsProperties
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse

class LessonDownloadStorageTest {
    @Test
    fun `validates mp4 in assets and cleans all partial job files`(
        @TempDir assetsDir: Path,
    ) {
        val storage = LessonDownloadStorage(AssetStorage(AssetsProperties(assetsDir.toString())))
        val output = storage.outputTemplate("course", 7)
        val mp4 = Path.of(output.replace("%(ext)s", "mp4"))
        val partial = Path.of(output.replace("%(ext)s", "f137.mp4.part"))
        Files.writeString(mp4, "video")
        Files.writeString(partial, "partial")

        assertEquals("courses/course/lessons/download-7.mp4", storage.validateResult(mp4.toString()))

        storage.cleanup("course", 7)

        assertFalse(Files.exists(mp4))
        assertFalse(Files.exists(partial))
    }

    @Test
    fun `rejects non mp4 result`(
        @TempDir assetsDir: Path,
    ) {
        val storage = LessonDownloadStorage(AssetStorage(AssetsProperties(assetsDir.toString())))
        val webm = assetsDir.resolve("lesson.webm")
        Files.writeString(webm, "video")

        assertFailsWith<IllegalStateException> { storage.validateResult(webm.toString()) }
    }
}
