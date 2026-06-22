package dev.marcal.cursoteca.course

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

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

    @PostMapping("/files", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun createFile(
        @PathVariable courseId: Long,
        @RequestParam scope: String,
        @RequestParam(required = false) sectionId: Long?,
        @RequestParam(required = false) lessonId: Long?,
        @RequestParam title: String,
        @RequestParam(defaultValue = "") description: String,
        @RequestPart file: MultipartFile,
    ): CourseResourceResponse =
        service
            .createFile(
                courseId,
                CreateResourceFileCommand.from(scope, sectionId, lessonId, title, description, file),
            ).toResponse()
}
