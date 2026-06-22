package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetsProperties
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class YtDlpCommandBuilderTest {
    private val builder = YtDlpCommandBuilder(AssetsProperties(ytDlpExecutable = "fake-yt-dlp"))

    @Test
    fun `builds constrained mp4 command based on poc`() {
        val command = builder.build("https://example.com/video", "/tmp/lesson.%(ext)s")

        assertEquals("fake-yt-dlp", command.first())
        assertTrue(command.containsAll(listOf("--no-playlist", "--merge-output-format", "--remux-video")))
        assertTrue(command.contains("bv*[vcodec^=avc1][height<=1080]+ba/bv*[height<=1080]+ba/b[height<=1080]/best"))
        assertEquals("ffmpeg:-movflags +faststart", command[command.indexOf("--postprocessor-args") + 1])
        assertEquals("https://player.hotmart.com/", command[command.indexOf("--referer") + 1])
        assertEquals("https://example.com/video", command.last())
    }

    @Test
    fun `selects vimeo referers`() {
        val playerUrl = "https://player.vimeo.com/video/123"

        assertEquals(playerUrl, builder.referer(playerUrl))
        assertEquals("https://player.vimeo.com/", builder.referer("https://vod.vimeocdn.com/path/video.mp4"))
    }
}
