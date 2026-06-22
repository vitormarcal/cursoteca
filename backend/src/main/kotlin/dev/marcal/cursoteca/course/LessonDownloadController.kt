package dev.marcal.cursoteca.course

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/courses/{courseId}/lesson-downloads")
class LessonDownloadController(
    private val service: LessonDownloadJobService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun create(
        @PathVariable courseId: Long,
        @RequestBody request: CreateLessonDownloadRequest,
    ): LessonDownloadJobResponse = service.create(courseId, CreateLessonDownloadCommand.from(request)).toResponse()

    @GetMapping
    fun list(
        @PathVariable courseId: Long,
    ): List<LessonDownloadJobResponse> = service.list(courseId).map { it.toResponse() }

    @GetMapping("/{jobId}")
    fun get(
        @PathVariable courseId: Long,
        @PathVariable jobId: Long,
    ): LessonDownloadJobResponse = service.get(courseId, jobId).toResponse()
}
