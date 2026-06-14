package dev.marcal.cursoteca.assets

import dev.marcal.cursoteca.error.BusinessException
import dev.marcal.cursoteca.error.ReasonEnum
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class AssetStorageTest {
	@Test
	fun `saves file inside assets root`(@TempDir assetsDir: Path) {
		val storage = AssetStorage(AssetsProperties(assetsDir.toString()))
		val file = MockMultipartFile("file", "cover.png", "image/png", byteArrayOf(1, 2, 3))

		val stored = storage.save(Path.of("courses/kotlin/image.png"), file)

		assertEquals("courses/kotlin/image.png", stored.relativePath)
		assertTrue(Files.exists(assetsDir.resolve("courses/kotlin/image.png")))
	}

	@Test
	fun `rejects traversal outside assets root`(@TempDir assetsDir: Path) {
		val storage = AssetStorage(AssetsProperties(assetsDir.toString()))
		val file = MockMultipartFile("file", "cover.png", "image/png", byteArrayOf(1))

		val error = assertFailsWith<BusinessException> {
			storage.save(Path.of("../outside.png"), file)
		}
		assertEquals(ReasonEnum.INVALID_ASSET_PATH, error.reason)
	}
}
