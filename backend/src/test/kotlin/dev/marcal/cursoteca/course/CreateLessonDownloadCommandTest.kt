package dev.marcal.cursoteca.course

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CreateLessonDownloadCommandTest {
    @Test
    fun `normalizes valid download input`() {
        val command =
            CreateLessonDownloadCommand.from(
                CreateLessonDownloadRequest(12, " Lesson 01 ", " Introduction ", " https://example.com/video "),
            )

        assertEquals(12, command.sectionId)
        assertEquals("Lesson 01", command.title)
        assertEquals("Introduction", command.description)
        assertEquals("https://example.com/video", command.url)
    }

    @Test
    fun `rejects empty title and non http url`() {
        val titleError =
            assertFailsWith<InvalidLessonInputException> {
                CreateLessonDownloadCommand.from(CreateLessonDownloadRequest(title = " ", url = "https://example.com"))
            }
        val urlError =
            assertFailsWith<InvalidLessonInputException> {
                CreateLessonDownloadCommand.from(CreateLessonDownloadRequest(title = "Lesson", url = "file:///tmp/video"))
            }

        assertEquals("title is required", titleError.details["title"])
        assertEquals("url must be a valid HTTP or HTTPS URL", urlError.details["url"])
    }
}
