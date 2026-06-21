package dev.marcal.cursoteca.course

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/courses/{courseId}/resources")
class CourseResourceController(
    private val service: CourseResourceService,
) {
    @PostMapping("/links")
    @ResponseStatus(HttpStatus.CREATED)
    fun createLink(
        @PathVariable courseId: Long,
        @RequestBody request: CreateResourceLinkRequest,
    ): CourseResourceResponse = service.createLink(courseId, CreateResourceLinkCommand.from(request)).toResponse()
}
