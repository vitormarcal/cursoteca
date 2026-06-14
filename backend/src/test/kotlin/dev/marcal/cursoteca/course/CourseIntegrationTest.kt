package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.BaseIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.multipart
import java.nio.file.Files
import kotlin.test.assertTrue

class CourseIntegrationTest : BaseIntegrationTest() {
    @Test
    fun `creates course with image and lists it`() {
        val image =
            MockMultipartFile(
                "image",
                "cover.png",
                "image/png",
                byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47),
            )

        mockMvc
            .multipart("/api/courses") {
                file(image)
                param("name", "Curso de Kotlin")
                param("description", "Aprenda Kotlin do zero.")
            }.andExpect {
                status { isCreated() }
                jsonPath("$.name") { value("Curso de Kotlin") }
                jsonPath("$.slug") { value("curso-de-kotlin") }
                jsonPath("$.imageUrl") { value("/assets/courses/curso-de-kotlin/image.png") }
            }

        assertTrue(Files.exists(assetsDir.resolve("courses/curso-de-kotlin/image.png")))

        val secondImage =
            MockMultipartFile(
                "image",
                "cover-2.png",
                "image/png",
                byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47),
            )

        mockMvc
            .multipart("/api/courses") {
                file(secondImage)
                param("name", "Curso de Kotlin")
                param("description", "Outra turma.")
            }.andExpect {
                status { isCreated() }
                jsonPath("$.slug") { value("curso-de-kotlin-2") }
                jsonPath("$.imageUrl") { value("/assets/courses/curso-de-kotlin-2/image.png") }
            }

        mockMvc
            .get("/api/courses")
            .andExpect {
                status { isOk() }
                content { contentTypeCompatibleWith(MediaType.APPLICATION_JSON) }
                jsonPath("$[0].name") { value("Curso de Kotlin") }
            }
    }

    @Test
    fun `requires all course fields`() {
        val image =
            MockMultipartFile(
                "image",
                "cover.png",
                "image/png",
                byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47),
            )

        mockMvc
            .multipart("/api/courses") {
                file(image)
                param("name", "")
                param("description", "Descrição")
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.code") { value(1001) }
                jsonPath("$.description") { value("Course input is invalid.") }
                jsonPath("$.details.name") { value("name is required") }
            }
    }
}
