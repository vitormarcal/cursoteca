package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.BaseIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.multipart
import org.springframework.test.web.servlet.post

class CourseSectionIntegrationTest : BaseIntegrationTest() {
	@Test
	fun `creates root section and child section`() {
		val courseId = createCourse("Section Tree Course")

		mockMvc.post("/api/courses/$courseId/sections") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"title":"Module 01","description":"Foundation topics"}"""
		}
			.andExpect {
				status { isCreated() }
				jsonPath("$.courseId") { value(courseId) }
				jsonPath("$.parentId") { doesNotExist() }
				jsonPath("$.title") { value("Module 01") }
				jsonPath("$.slug") { value("module-01") }
				jsonPath("$.position") { value(1) }
			}

		val rootId = sectionId(courseId, "Module 01")

		mockMvc.post("/api/courses/$courseId/sections") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"parentId":$rootId,"title":"Lesson Group","description":"Practice set"}"""
		}
			.andExpect {
				status { isCreated() }
				jsonPath("$.parentId") { value(rootId) }
				jsonPath("$.slug") { value("lesson-group") }
			}

		mockMvc.get("/api/courses/$courseId/sections")
			.andExpect {
				status { isOk() }
				jsonPath("$[0].title") { value("Module 01") }
				jsonPath("$[0].children[0].title") { value("Lesson Group") }
			}
	}

	@Test
	fun `generates unique slugs per sibling group`() {
		val courseId = createCourse("Sibling Slug Course")

		mockMvc.post("/api/courses/$courseId/sections") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"title":"Introduction","description":""}"""
		}
			.andExpect {
				status { isCreated() }
				jsonPath("$.slug") { value("introduction") }
			}

		mockMvc.post("/api/courses/$courseId/sections") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"title":"Introduction","description":""}"""
		}
			.andExpect {
				status { isCreated() }
				jsonPath("$.slug") { value("introduction-2") }
				jsonPath("$.position") { value(2) }
			}
	}

	@Test
	fun `rejects parent section from another course`() {
		val firstCourseId = createCourse("First Parent Course")
		val secondCourseId = createCourse("Second Parent Course")

		mockMvc.post("/api/courses/$firstCourseId/sections") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"title":"Module 01","description":""}"""
		}
			.andExpect {
				status { isCreated() }
			}

		val parentId = sectionId(firstCourseId, "Module 01")

		mockMvc.post("/api/courses/$secondCourseId/sections") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"parentId":$parentId,"title":"Invalid Child","description":""}"""
		}
			.andExpect {
				status { isNotFound() }
				jsonPath("$.code") { value(2002) }
				jsonPath("$.description") { value("Course section parent was not found.") }
				jsonPath("$.details.parentId") { value(parentId.toString()) }
			}
	}

	@Test
	fun `rejects invalid section payloads`() {
		val courseId = createCourse("Invalid Section Course")

		mockMvc.post("/api/courses/$courseId/sections") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"title":"","description":"No title"}"""
		}
			.andExpect {
				status { isBadRequest() }
				jsonPath("$.code") { value(1002) }
				jsonPath("$.description") { value("Course section input is invalid.") }
				jsonPath("$.details.title") { value("title is required") }
			}

		mockMvc.get("/api/courses/999999/sections")
			.andExpect {
				status { isNotFound() }
				jsonPath("$.code") { value(2001) }
				jsonPath("$.description") { value("Course was not found.") }
				jsonPath("$.details.identifier") { value("999999") }
			}
	}

	private fun createCourse(name: String): Int {
		val image = MockMultipartFile(
			"image",
			"cover.png",
			"image/png",
			byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47),
		)

		val result = mockMvc.multipart("/api/courses") {
			file(image)
			param("name", name)
			param("description", "A course used by section tests.")
		}
			.andExpect {
				status { isCreated() }
			}
			.andReturn()

		return Regex(""""id":(\d+)""").find(result.response.contentAsString)?.groupValues?.get(1)?.toInt()
			?: error("Course id not found in response: ${result.response.contentAsString}")
	}

	private fun sectionId(courseId: Int, title: String): Int {
		val result = mockMvc.get("/api/courses/$courseId/sections")
			.andExpect {
				status { isOk() }
			}
			.andReturn()

		val escapedTitle = Regex.escape(title)
		return Regex(""""id":(\d+),"courseId":$courseId,"parentId":null,"title":"$escapedTitle"""")
			.find(result.response.contentAsString)
			?.groupValues
			?.get(1)
			?.toInt()
			?: error("Section id not found in response: ${result.response.contentAsString}")
	}
}
