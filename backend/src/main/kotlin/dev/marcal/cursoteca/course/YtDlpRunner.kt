package dev.marcal.cursoteca.course

import org.springframework.stereotype.Component

data class YtDlpResult(
    val finalPath: String,
    val log: String,
)

@Component
class YtDlpRunner(
    private val commandBuilder: YtDlpCommandBuilder,
) {
    fun run(
        url: String,
        outputTemplate: String,
        onProgress: (Int) -> Unit,
    ): YtDlpResult {
        val process = ProcessBuilder(commandBuilder.build(url, outputTemplate)).redirectErrorStream(true).start()
        val log = StringBuilder()
        var finalPath: String? = null
        process.inputStream.bufferedReader().useLines { lines ->
            lines.forEach { line ->
                appendLimited(log, line)
                if (line.startsWith("progress=")) {
                    line.removePrefix("progress=").trim().removeSuffix("%").toDoubleOrNull()?.toInt()?.let {
                        onProgress(it.coerceIn(0, 100))
                    }
                }
                if (line.startsWith("filepath=")) finalPath = line.removePrefix("filepath=").trim()
            }
        }
        val exitCode = process.waitFor()
        if (exitCode != 0) throw YtDlpException("yt-dlp exited with code $exitCode", log.toString())
        return YtDlpResult(finalPath ?: throw YtDlpException("yt-dlp did not report the final path", log.toString()), log.toString())
    }

    private fun appendLimited(
        log: StringBuilder,
        line: String,
    ) {
        log.appendLine(line)
        if (log.length > 20_000) log.delete(0, log.length - 20_000)
    }
}

class YtDlpException(
    message: String,
    val processLog: String,
) : RuntimeException(message)
