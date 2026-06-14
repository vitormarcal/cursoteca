package dev.marcal.cursoteca.assets

import org.springframework.mock.web.MockMultipartFile
import kotlin.test.Test
import kotlin.test.assertEquals

class MultipartFileExtensionsTest {
    @Test
    fun `uses safe original image extension`() {
        val file = MockMultipartFile("image", "../cover.WEBP", "image/png", byteArrayOf(1))

        assertEquals("webp", file.safeImageExtension())
    }

    @Test
    fun `falls back to content type when original extension is not supported`() {
        val file = MockMultipartFile("image", "cover.exe", "image/jpeg", byteArrayOf(1))

        assertEquals("jpg", file.safeImageExtension())
    }

    @Test
    fun `uses bin when no supported extension or content type exists`() {
        val file = MockMultipartFile("image", "cover.exe", "image/unknown", byteArrayOf(1))

        assertEquals("bin", file.safeImageExtension())
    }
}
