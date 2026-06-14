package dev.marcal.cursoteca.assets

import org.springframework.web.multipart.MultipartFile
import java.nio.file.Path
import kotlin.io.path.extension

private val supportedImageExtensions = setOf("jpg", "jpeg", "png", "gif", "webp")

fun MultipartFile.safeImageExtension(): String {
	val originalExtension = originalFilename
		?.let { Path.of(it).fileName.toString() }
		?.let { Path.of(it).extension.lowercase() }
		?.takeIf { it in supportedImageExtensions }

	return originalExtension ?: when (contentType) {
		"image/jpeg" -> "jpg"
		"image/png" -> "png"
		"image/gif" -> "gif"
		"image/webp" -> "webp"
		else -> "bin"
	}
}
