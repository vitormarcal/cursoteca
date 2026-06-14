package dev.marcal.cursoteca.assets

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption

data class StoredAsset(
	val relativePath: String,
)

@Component
class AssetStorage(
	private val properties: AssetsProperties,
) {
	private val root: Path
		get() = Path.of(properties.assetsDir).toAbsolutePath().normalize()

	fun createDirectory(relativePath: Path): String {
		val directory = resolveInsideRoot(relativePath)
		Files.createDirectories(directory)
		return relativePath.normalize().toString()
	}

	fun save(relativePath: Path, file: MultipartFile): StoredAsset {
		val destination = resolveInsideRoot(relativePath)
		Files.createDirectories(destination.parent)
		file.inputStream.use { input ->
			Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING)
		}
		return StoredAsset(relativePath = relativePath.normalize().toString())
	}

	private fun resolveInsideRoot(relativePath: Path): Path {
		if (relativePath.isAbsolute) {
			throw invalidAssetPath()
		}

		val resolved = root.resolve(relativePath).normalize()
		if (!resolved.startsWith(root)) {
			throw invalidAssetPath()
		}
		return resolved
	}

	private fun invalidAssetPath() = ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid asset path")
}
