package dev.marcal.cursoteca.course

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/courses")
class CourseController(
    private val service: CourseService,
) {
    @GetMapping
    fun list(): List<CourseResponse> = service.listCourses().map { it.toResponse() }

    @GetMapping("/{slug}")
    fun getBySlug(
        @PathVariable slug: String,
    ): CourseResponse = service.getBySlug(slug).toResponse()

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestParam("name") name: String,
        @RequestParam("description") description: String,
        @RequestPart("image") image: MultipartFile,
    ): CourseResponse = service.createCourse(CreateCourseCommand.from(name, description, image)).toResponse()
}
