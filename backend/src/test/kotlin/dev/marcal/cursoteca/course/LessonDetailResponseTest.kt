package dev.marcal.cursoteca.course

import java.time.OffsetDateTime
import kotlin.test.Test
import kotlin.test.assertEquals

class LessonDetailResponseTest {
    @Test
    fun `builds section path from root to current section`() {
        val course = course(1)
        val root = section(10, course, null, "Stage", "stage")
        val child = section(11, course, root, "Module", "module")
        val now = OffsetDateTime.now()
        val lesson =
            Lesson(
                course = course,
                section = child,
                title = "Lesson 01",
                description = "Introduction",
                videoPath = "courses/sample/lessons/video.mp4",
                position = 1,
            ).apply {
                id = 20
                createdAt = now
                updatedAt = now
            }

        val response = lesson.toDetailResponse()

        assertEquals(listOf("Stage", "Module"), response.sectionPath.map { it.title })
        assertEquals(listOf(10L, 11L), response.sectionPath.map { it.id })
    }

    private fun course(id: Long) =
        Course(
            name = "Sample course",
            slug = "sample-course",
            description = "Description",
            imagePath = "courses/sample-course/image.png",
            assetsPath = "courses/sample-course",
        ).apply { this.id = id }

    private fun section(
        id: Long,
        course: Course,
        parent: CourseSection?,
        title: String,
        slug: String,
    ) = CourseSection(course, parent, title, slug, "", 1).apply { this.id = id }
}
