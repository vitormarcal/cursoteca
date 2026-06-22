package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.BaseIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.multipart
import org.springframework.test.web.servlet.post
import java.nio.file.Files
import kotlin.test.assertEquals

class CourseResourceIntegrationTest : BaseIntegrationTest() {
    @Test
    fun `creates links in all scopes and groups inherited resources for lesson`() {
        val courseId = createCourse("Resource Course")
        val rootId = createSection(courseId, "Stage 01")
        val childId = createSection(courseId, "Module 01", rootId)
        val lessonId = createLesson(courseId, childId)

        createLink(courseId, "COURSE", "Course link")
        createLink(courseId, "SECTION", "Stage link", sectionId = rootId)
        createLink(courseId, "SECTION", "Module link", sectionId = childId)
        createLink(courseId, "LESSON", "Lesson link", lessonId = lessonId)
        createFile(courseId, "COURSE", "Course PDF", "material.pdf", "application/pdf")
            .andExpect {
                status { isCreated() }
                jsonPath("$.type") { value("FILE") }
                jsonPath("$.mimeType") { value("application/pdf") }
            }
        val audioResult =
            createFile(courseId, "LESSON", "Lesson audio", "audio.mp3", "audio/mpeg", lessonId = lessonId)
                .andExpect {
                    status { isCreated() }
                    jsonPath("$.fileUrl") { value(org.hamcrest.Matchers.endsWith(".mp3")) }
                    jsonPath("$.mimeType") { value("audio/mpeg") }
                }.andReturn()

        mockMvc
            .get("/api/courses/$courseId/lessons/$lessonId")
            .andExpect {
                status { isOk() }
                jsonPath("$.resourceGroups.lesson[0].title") { value("Lesson link") }
                jsonPath("$.resourceGroups.lesson[1].title") { value("Lesson audio") }
                jsonPath("$.resourceGroups.section[0].title") { value("Module link") }
                jsonPath("$.resourceGroups.ancestors[0].section.title") { value("Stage 01") }
                jsonPath("$.resourceGroups.ancestors[0].resources[0].title") { value("Stage link") }
                jsonPath("$.resourceGroups.course[0].title") { value("Course link") }
                jsonPath("$.resourceGroups.course[1].title") { value("Course PDF") }
            }

        val audioUrl = Regex(""""fileUrl":"([^"]+)""").find(audioResult.response.contentAsString)!!.groupValues[1]
        mockMvc.get(audioUrl).andExpect {
            status { isOk() }
            content { contentTypeCompatibleWith(MediaType.valueOf("audio/mpeg")) }
        }
        assertEquals(2L, Files.walk(assetsDir.resolve("courses/resource-course/resources")).use { it.filter(Files::isRegularFile).count() })
    }

    @Test
    fun `validates target ownership and invalid input`() {
        val firstCourseId = createCourse("First Resource Course")
        val secondCourseId = createCourse("Second Resource Course")
        val sectionId = createSection(firstCourseId, "Module")
        val lessonId = createLesson(firstCourseId, sectionId)

        createLink(secondCourseId, "SECTION", "Invalid", sectionId = sectionId)
            .andExpect {
                status { isNotFound() }
                jsonPath("$.code") { value(2003) }
            }
        createLink(secondCourseId, "LESSON", "Invalid", lessonId = lessonId)
            .andExpect {
                status { isNotFound() }
                jsonPath("$.code") { value(2004) }
            }

        mockMvc
            .post("/api/courses/$firstCourseId/resources/links") {
                contentType = MediaType.APPLICATION_JSON
                content = """{"scope":"COURSE","title":"Invalid","url":"javascript:alert(1)"}"""
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.code") { value(1005) }
                jsonPath("$.details.url") { value("url must be a valid HTTP or HTTPS URL") }
            }

        createFile(firstCourseId, "COURSE", "Invalid", "video.mp4", "video/mp4")
            .andExpect {
                status { isBadRequest() }
                jsonPath("$.code") { value(1005) }
                jsonPath("$.details.file") { value("file must be a supported PDF or audio file") }
            }
    }

    private fun createLink(
        courseId: Int,
        scope: String,
        title: String,
        sectionId: Int? = null,
        lessonId: Int? = null,
    ) = mockMvc.post("/api/courses/$courseId/resources/links") {
        contentType = MediaType.APPLICATION_JSON
        content =
            """
            {
                "scope":"$scope",
                "sectionId":${sectionId ?: "null"},
                "lessonId":${lessonId ?: "null"},
                "title":"$title",
                "description":"Description",
                "url":"https://example.com/material"
            }
            """.trimIndent()
    }

    private fun createFile(
        courseId: Int,
        scope: String,
        title: String,
        fileName: String,
        contentType: String,
        sectionId: Int? = null,
        lessonId: Int? = null,
    ) = mockMvc.multipart("/api/courses/$courseId/resources/files") {
        file(MockMultipartFile("file", fileName, contentType, byteArrayOf(1, 2, 3)))
        param("scope", scope)
        param("title", title)
        param("description", "Description")
        sectionId?.let { param("sectionId", it.toString()) }
        lessonId?.let { param("lessonId", it.toString()) }
    }

    private fun createCourse(name: String): Int {
        val result =
            mockMvc
                .multipart("/api/courses") {
                    file(MockMultipartFile("image", "cover.png", "image/png", byteArrayOf(1)))
                    param("name", name)
                    param("description", "Description")
                }.andExpect { status { isCreated() } }
                .andReturn()
        return responseId(result.response.contentAsString)
    }

    private fun createSection(
        courseId: Int,
        title: String,
        parentId: Int? = null,
    ): Int {
        val result =
            mockMvc
                .post("/api/courses/$courseId/sections") {
                    contentType = MediaType.APPLICATION_JSON
                    content = """{"parentId":${parentId ?: "null"},"title":"$title","description":""}"""
                }.andExpect { status { isCreated() } }
                .andReturn()
        return responseId(result.response.contentAsString)
    }

    private fun createLesson(
        courseId: Int,
        sectionId: Int,
    ): Int {
        val result =
            mockMvc
                .multipart("/api/courses/$courseId/lessons") {
                    file(MockMultipartFile("video", "lesson.mp4", "video/mp4", byteArrayOf(1)))
                    param("sectionId", sectionId.toString())
                    param("title", "Lesson")
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
            ?: error("Id not found: $response")
}
