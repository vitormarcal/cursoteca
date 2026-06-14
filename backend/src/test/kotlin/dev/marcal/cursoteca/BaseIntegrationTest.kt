package dev.marcal.cursoteca

import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.testcontainers.containers.PostgreSQLContainer
import java.nio.file.Files
import java.nio.file.Path
import java.util.Comparator

@SpringBootTest
@AutoConfigureMockMvc
abstract class BaseIntegrationTest {
	@Autowired
	lateinit var mockMvc: MockMvc

	@Autowired
	lateinit var jdbcTemplate: JdbcTemplate

	@BeforeEach
	fun resetIntegrationState() {
		jdbcTemplate.execute("truncate table course_sections, courses restart identity cascade")
		resetAssetsDirectory()
	}

	private fun resetAssetsDirectory() {
		Files.createDirectories(assetsDir)
		Files.list(assetsDir).use { children ->
			children.forEach { child ->
				Files.walk(child).use { paths ->
					paths.sorted(Comparator.reverseOrder()).toList().forEach { path ->
						Files.deleteIfExists(path)
					}
				}
			}
		}
	}

	companion object {
		val postgres = PostgreSQLContainer("postgres:17-alpine").apply {
			start()
		}

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
