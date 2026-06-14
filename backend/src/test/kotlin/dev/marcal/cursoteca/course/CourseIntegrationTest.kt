package dev.marcal.cursoteca.course

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.multipart
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.assertTrue

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class CourseIntegrationTest {
	@Autowired
	lateinit var mockMvc: MockMvc

	@Test
	fun `creates course with image and lists it`() {
		val image = MockMultipartFile(
			"image",
			"cover.png",
			"image/png",
			byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47),
		)

		mockMvc.multipart("/api/courses") {
			file(image)
			param("name", "Curso de Kotlin")
			param("description", "Aprenda Kotlin do zero.")
		}
			.andExpect {
				status { isCreated() }
				jsonPath("$.name") { value("Curso de Kotlin") }
				jsonPath("$.slug") { value("curso-de-kotlin") }
				jsonPath("$.imageUrl") { value("/assets/courses/curso-de-kotlin/image.png") }
			}

		assertTrue(Files.exists(assetsDir.resolve("courses/curso-de-kotlin/image.png")))

		val secondImage = MockMultipartFile(
			"image",
			"cover-2.png",
			"image/png",
			byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47),
		)

		mockMvc.multipart("/api/courses") {
			file(secondImage)
			param("name", "Curso de Kotlin")
			param("description", "Outra turma.")
		}
			.andExpect {
				status { isCreated() }
				jsonPath("$.slug") { value("curso-de-kotlin-2") }
				jsonPath("$.imageUrl") { value("/assets/courses/curso-de-kotlin-2/image.png") }
			}

		mockMvc.get("/api/courses")
			.andExpect {
				status { isOk() }
				content { contentTypeCompatibleWith(MediaType.APPLICATION_JSON) }
				jsonPath("$[0].name") { value("Curso de Kotlin") }
			}
	}

	@Test
	fun `requires all course fields`() {
		mockMvc.multipart("/api/courses") {
			param("name", "")
			param("description", "Descrição")
		}
			.andExpect {
				status { isBadRequest() }
			}
	}

	companion object {
		@Container
		val postgres = PostgreSQLContainer("postgres:17-alpine")

		val assetsDir: Path = Files.createTempDirectory("cursoteca-assets-test")

		@JvmStatic
		@DynamicPropertySource
		fun databaseProperties(registry: DynamicPropertyRegistry) {
			registry.add("spring.datasource.url", postgres::getJdbcUrl)
			registry.add("spring.datasource.username", postgres::getUsername)
			registry.add("spring.datasource.password", postgres::getPassword)
			registry.add("cursoteca.assets-dir") { assetsDir.toString() }
		}
	}
}
