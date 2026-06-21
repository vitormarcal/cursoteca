package dev.marcal.cursoteca.course

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CreateResourceLinkCommandTest {
    @Test
    fun `normalizes a valid lesson link`() {
        val command =
            CreateResourceLinkCommand.from(
                CreateResourceLinkRequest(
                    scope = " lesson ",
                    lessonId = 12,
                    title = " Reference ",
                    description = " Notes ",
                    url = " https://example.com/material ",
                ),
            )

        assertEquals(ResourceScope.LESSON, command.scope)
        assertEquals(12, command.lessonId)
        assertEquals("Reference", command.title)
        assertEquals("https://example.com/material", command.url)
    }

    @Test
    fun `rejects mismatched scope and target`() {
        val error =
            assertFailsWith<InvalidResourceInputException> {
                CreateResourceLinkCommand.from(
                    CreateResourceLinkRequest(
                        scope = "COURSE",
                        sectionId = 10,
                        title = "Reference",
                        url = "https://example.com",
                    ),
                )
            }

        assertEquals("scope and target identifiers do not match", error.details["scope"])
    }

    @Test
    fun `rejects unsafe or malformed URL`() {
        for (url in listOf("javascript:alert(1)", "not-a-url", "ftp://example.com/file")) {
            val error =
                assertFailsWith<InvalidResourceInputException> {
                    CreateResourceLinkCommand.from(
                        CreateResourceLinkRequest(scope = "COURSE", title = "Reference", url = url),
                    )
                }
            assertEquals("url must be a valid HTTP or HTTPS URL", error.details["url"])
        }
    }
}
