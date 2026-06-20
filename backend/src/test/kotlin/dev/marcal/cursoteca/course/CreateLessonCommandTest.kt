package dev.marcal.cursoteca.course

import org.springframework.mock.web.MockMultipartFile
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CreateLessonCommandTest {
    @Test
    fun `normalizes valid lesson input`() {
        val video = MockMultipartFile("video", "lesson.MP4", "video/mp4", byteArrayOf(1))

        val command = CreateLessonCommand.from(12, " Lesson 01 ", " Introduction ", video)

        assertEquals(12, command.sectionId)
        assertEquals("Lesson 01", command.title)
        assertEquals("Introduction", command.description)
    }

    @Test
    fun `rejects a non mp4 video`() {
        val video = MockMultipartFile("video", "lesson.webm", "video/webm", byteArrayOf(1))

        val error =
            assertFailsWith<InvalidLessonInputException> {
                CreateLessonCommand.from(null, "Lesson 01", "", video)
            }

        assertEquals("video must be an MP4 file", error.details["video"])
    }

    @Test
    fun `rejects an empty title`() {
        val video = MockMultipartFile("video", "lesson.mp4", "video/mp4", byteArrayOf(1))

        val error =
            assertFailsWith<InvalidLessonInputException> {
                CreateLessonCommand.from(null, " ", "", video)
            }

        assertEquals("title is required", error.details["title"])
    }
}
