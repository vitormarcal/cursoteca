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
import kotlin.test.assertFalse

class LessonIntegrationTest : BaseIntegrationTest() {
    @Test
    fun `uploads lessons to course and section and lists them`() {
        val courseId = createCourse("Lesson Course")
        val sectionId = createSection(courseId, "Module 01")

        val courseLessonResult =
            uploadLesson(courseId, "Course introduction", null)
                .andExpect {
                    status { isCreated() }
                    jsonPath("$.courseId") { value(courseId) }
                    jsonPath("$.sectionId") { doesNotExist() }
                    jsonPath("$.position") { value(1) }
                    jsonPath("$.videoUrl") { value(org.hamcrest.Matchers.matchesPattern("/assets/courses/lesson-course/lessons/.+\\.mp4")) }
                }.andReturn()

        val videoUrl =
            Regex(""""videoUrl":"([^"]+)""")
                .find(courseLessonResult.response.contentAsString)
                ?.groupValues
                ?.get(1)
                ?: error("Video URL not found in response")
        mockMvc
            .get(videoUrl)
            .andExpect {
                status { isOk() }
                content { contentTypeCompatibleWith(MediaType.valueOf("video/mp4")) }
                content { bytes(byteArrayOf(0, 0, 0, 24)) }
            }

        val sectionLessonResult =
            uploadLesson(courseId, "First class", sectionId)
                .andExpect {
                    status { isCreated() }
                    jsonPath("$.sectionId") { value(sectionId) }
                    jsonPath("$.title") { value("First class") }
                    jsonPath("$.description") { value("Lesson description") }
                    jsonPath("$.position") { value(1) }
                }.andReturn()
        val sectionLessonId = responseId(sectionLessonResult.response.contentAsString)

        mockMvc
            .get("/api/courses/$courseId/lessons/$sectionLessonId")
            .andExpect {
                status { isOk() }
                jsonPath("$.id") { value(sectionLessonId) }
                jsonPath("$.courseId") { value(courseId) }
                jsonPath("$.sectionPath[0].id") { value(sectionId) }
                jsonPath("$.sectionPath[0].title") { value("Module 01") }
                jsonPath("$.title") { value("First class") }
            }

        mockMvc
            .get("/api/courses/$courseId/lessons")
            .andExpect {
                status { isOk() }
                jsonPath("$[0].title") { value("Course introduction") }
                jsonPath("$[1].title") { value("First class") }
            }

        val storedVideoCount =
            Files.walk(assetsDir.resolve("courses/lesson-course/lessons")).use { paths ->
                paths.filter(Files::isRegularFile).count()
            }
        assertEquals(2L, storedVideoCount)
    }

    @Test
    fun `rejects section from another course before storing video`() {
        val firstCourseId = createCourse("First Lesson Course")
        val secondCourseId = createCourse("Second Lesson Course")
        val sectionId = createSection(firstCourseId, "Module 01")

        uploadLesson(secondCourseId, "Invalid lesson", sectionId)
            .andExpect {
                status { isNotFound() }
                jsonPath("$.code") { value(2003) }
                jsonPath("$.details.sectionId") { value(sectionId.toString()) }
            }

        assertFalse(Files.exists(assetsDir.resolve("courses/second-lesson-course/lessons")))
    }

    @Test
    fun `rejects invalid lesson input and missing course`() {
        val courseId = createCourse("Invalid Lesson Course")
        val invalidVideo = MockMultipartFile("video", "lesson.webm", "video/webm", byteArrayOf(1))

        mockMvc
            .multipart("/api/courses/$courseId/lessons") {
                file(invalidVideo)
                param("title", "Lesson")
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.code") { value(1004) }
                jsonPath("$.details.video") { value("video must be an MP4 file") }
            }

        mockMvc
            .get("/api/courses/999999/lessons")
            .andExpect {
                status { isNotFound() }
                jsonPath("$.code") { value(2001) }
            }
    }

    @Test
    fun `does not expose lesson through another course`() {
        val ownerCourseId = createCourse("Lesson Owner Course")
        val anotherCourseId = createCourse("Another Course")
        val lessonResult =
            uploadLesson(ownerCourseId, "Private lesson", null)
                .andExpect { status { isCreated() } }
                .andReturn()
        val lessonId = responseId(lessonResult.response.contentAsString)

        mockMvc
            .get("/api/courses/$anotherCourseId/lessons/$lessonId")
            .andExpect {
                status { isNotFound() }
                jsonPath("$.code") { value(2004) }
                jsonPath("$.details.lessonId") { value(lessonId.toString()) }
            }

        mockMvc
            .get("/api/courses/$ownerCourseId/lessons/999999")
            .andExpect {
                status { isNotFound() }
                jsonPath("$.code") { value(2004) }
            }
    }

    private fun uploadLesson(
        courseId: Int,
        title: String,
        sectionId: Int?,
    ) = mockMvc.multipart("/api/courses/$courseId/lessons") {
        file(MockMultipartFile("video", "lesson.mp4", "video/mp4", byteArrayOf(0, 0, 0, 24)))
        param("title", title)
        param("description", "Lesson description")
        sectionId?.let { param("sectionId", it.toString()) }
    }

    private fun createCourse(name: String): Int {
        val result =
            mockMvc
                .multipart("/api/courses") {
                    file(MockMultipartFile("image", "cover.png", "image/png", byteArrayOf(1)))
                    param("name", name)
                    param("description", "Course description")
                }.andExpect {
                    status { isCreated() }
                }.andReturn()

        return responseId(result.response.contentAsString)
    }

    private fun createSection(
        courseId: Int,
        title: String,
    ): Int {
        val result =
            mockMvc
                .post("/api/courses/$courseId/sections") {
                    contentType = MediaType.APPLICATION_JSON
                    content = """{"title":"$title","description":""}"""
                }.andExpect {
                    status { isCreated() }
                }.andReturn()

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
