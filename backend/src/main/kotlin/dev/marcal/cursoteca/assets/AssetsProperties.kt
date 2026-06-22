package dev.marcal.cursoteca.assets

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "cursoteca")
data class AssetsProperties(
    val assetsDir: String = "assets",
    val ytDlpExecutable: String = "yt-dlp",
)
