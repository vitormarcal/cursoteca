package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetsProperties
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.attribute.PosixFilePermissions
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class YtDlpRunnerTest {
    @TempDir
    lateinit var tempDir: Path

    @Test
    fun `captures progress and final path from process output`() {
        val executable =
            executable(
                """
            output=""
            while [ "${'$'}#" -gt 0 ]; do
              if [ "${'$'}1" = "-o" ]; then shift; output="${'$'}1"; fi
              shift
            done
            final=${'$'}(printf '%s' "${'$'}output" | sed 's/%(ext)s/mp4/')
            printf 'video' > "${'$'}final"
            echo 'progress=42.5%'
            echo "filepath=${'$'}final"
        """,
            )
        val runner = YtDlpRunner(YtDlpCommandBuilder(AssetsProperties(ytDlpExecutable = executable.toString())))
        val progress = mutableListOf<Int>()

        val result = runner.run("https://example.com/video", tempDir.resolve("lesson.%(ext)s").toString(), progress::add)

        assertEquals(listOf(42), progress)
        assertEquals(tempDir.resolve("lesson.mp4").toString(), result.finalPath)
        assertTrue(Files.isRegularFile(Path.of(result.finalPath)))
    }

    @Test
    fun `reports process failure with its log`() {
        val executable = executable("echo 'download failed'; exit 2")
        val runner = YtDlpRunner(YtDlpCommandBuilder(AssetsProperties(ytDlpExecutable = executable.toString())))

        val error =
            assertFailsWith<YtDlpException> {
                runner.run("https://example.com/video", tempDir.resolve("lesson.%(ext)s").toString()) {}
            }

        assertEquals("yt-dlp exited with code 2", error.message)
        assertTrue(error.processLog.contains("download failed"))
    }

    private fun executable(body: String): Path {
        val script = Files.createTempFile(tempDir, "fake-yt-dlp-", ".sh")
        Files.writeString(script, "#!/bin/sh\n${body.trimIndent()}\n")
        Files.setPosixFilePermissions(script, PosixFilePermissions.fromString("rwx------"))
        return script
    }
}
