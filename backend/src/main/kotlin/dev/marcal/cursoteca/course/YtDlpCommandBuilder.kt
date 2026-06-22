package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.assets.AssetsProperties
import org.springframework.stereotype.Component
import java.net.URI

@Component
class YtDlpCommandBuilder(
    private val properties: AssetsProperties,
) {
    fun build(
        url: String,
        outputTemplate: String,
    ): List<String> =
        listOf(
            properties.ytDlpExecutable,
            "--no-playlist",
            "--newline",
            "--progress-template",
            "download:progress=%(progress._percent_str)s",
            "--print",
            "after_move:filepath=%(filepath)s",
            "-o",
            outputTemplate,
            "--referer",
            referer(url),
            "-N",
            "15",
            "--format",
            "bv*[vcodec^=avc1][height<=1080]+ba/bv*[height<=1080]+ba/b[height<=1080]/best",
            "-S",
            "codec:avc,res,ext:mp4:m4a",
            "--merge-output-format",
            "mp4",
            "--remux-video",
            "mp4",
            "--postprocessor-args",
            "ffmpeg:-movflags +faststart",
            url,
        )

    fun referer(url: String): String {
        val host = URI(url).host.lowercase()
        return when {
            host == "player.vimeo.com" -> url
            host == "vimeo.com" || host.endsWith(".vimeo.com") || host == "vimeocdn.com" || host.endsWith(".vimeocdn.com") ->
                "https://player.vimeo.com/"
            else -> "https://player.hotmart.com/"
        }
    }
}
