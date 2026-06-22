package dev.marcal.cursoteca.course

import org.springframework.mock.web.MockMultipartFile
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CreateResourceFileCommandTest {
    @Test
    fun `accepts PDF and supported audio formats`() {
        val files =
            listOf(
                Triple("material.pdf", "application/pdf", "application/pdf"),
                Triple("audio.mp3", "audio/mpeg", "audio/mpeg"),
                Triple("audio.m4a", "audio/x-m4a", "audio/mp4"),
                Triple("audio.wav", "audio/wav", "audio/wav"),
                Triple("audio.ogg", "audio/ogg", "audio/ogg"),
                Triple("audio.flac", "audio/flac", "audio/flac"),
            )

        for ((name, contentType, expectedMime) in files) {
            val command =
                CreateResourceFileCommand.from(
                    "COURSE",
                    null,
                    null,
                    " Material ",
                    " Notes ",
                    MockMultipartFile("file", name, contentType, byteArrayOf(1)),
                )
            assertEquals(expectedMime, command.mimeType)
            assertEquals(name.substringAfterLast('.'), command.extension)
        }
    }

    @Test
    fun `rejects mismatched extension and MIME type`() {
        val error =
            assertFailsWith<InvalidResourceInputException> {
                CreateResourceFileCommand.from(
                    "COURSE",
                    null,
                    null,
                    "Material",
                    "",
                    MockMultipartFile("file", "malware.pdf", "application/octet-stream", byteArrayOf(1)),
                )
            }
        assertEquals("file must be a supported PDF or audio file", error.details["file"])
    }
}
