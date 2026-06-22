package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.BaseIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.multipart
import org.springframework.test.web.servlet.post
import kotlin.test.assertEquals

class LessonDownloadIntegrationTest : BaseIntegrationTest() {
    @Test
    fun `queues download exposes status and records process failure`() {
        val courseId = createCourse()
        val sectionId = createSection(courseId)
        val result =
            mockMvc
                .post("/api/courses/$courseId/lesson-downloads") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        """
                        {
                            "sectionId":$sectionId,
                            "title":"Downloaded lesson",
                            "description":"Lesson description",
                            "url":"https://example.com/video"
                        }
                        """.trimIndent()
                }.andExpect {
                    status { isAccepted() }
                    jsonPath("$.courseId") { value(courseId) }
                    jsonPath("$.sectionId") { value(sectionId) }
                    jsonPath("$.lessonId") { doesNotExist() }
                    jsonPath("$.title") { value("Downloaded lesson") }
                }.andReturn()
        val jobId = responseId(result.response.contentAsString)

        waitForStatus(jobId, "FAILED")

        mockMvc
            .get("/api/courses/$courseId/lesson-downloads/$jobId")
            .andExpect {
                status { isOk() }
                jsonPath("$.status") { value("FAILED") }
                jsonPath("$.error") { value("yt-dlp exited with code 1") }
            }
        mockMvc
            .get("/api/courses/$courseId/lesson-downloads")
            .andExpect {
                status { isOk() }
                jsonPath("$[0].id") { value(jobId) }
            }
        assertEquals(0, jdbcTemplate.queryForObject("select count(*) from lessons", Int::class.java))
    }

    private fun waitForStatus(
        jobId: Int,
        expected: String,
    ) {
        repeat(100) {
            val status =
                jdbcTemplate.queryForObject(
                    "select status from lesson_download_jobs where id = ?",
                    String::class.java,
                    jobId,
                )
            if (status == expected) return
            Thread.sleep(20)
        }
        error("Job $jobId did not reach status $expected")
    }

    private fun createCourse(): Int {
        val result =
            mockMvc
                .multipart("/api/courses") {
                    file(MockMultipartFile("image", "cover.png", "image/png", byteArrayOf(1)))
                    param("name", "Download Course")
                    param("description", "Course description")
                }.andExpect { status { isCreated() } }
                .andReturn()
        return responseId(result.response.contentAsString)
    }

    private fun createSection(courseId: Int): Int {
        val result =
            mockMvc
                .post("/api/courses/$courseId/sections") {
                    contentType = MediaType.APPLICATION_JSON
                    content = """{"title":"Module 01","description":""}"""
                }.andExpect { status { isCreated() } }
                .andReturn()
        return responseId(result.response.contentAsString)
    }

    private fun responseId(response: String): Int =
        Regex(""""id":(\d+)""")
            .find(response)
            ?.groupValues
            ?.get(1)
            ?.toInt()
            ?: error("Id not found in response: $response")
}
