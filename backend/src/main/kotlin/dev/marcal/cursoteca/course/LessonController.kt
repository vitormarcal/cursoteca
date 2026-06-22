package dev.marcal.cursoteca.course

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/courses/{courseId}/lessons")
class LessonController(
    private val service: LessonService,
) {
    @GetMapping
    fun list(
        @PathVariable courseId: Long,
    ): List<LessonResponse> = service.listLessons(courseId).map { it.toResponse() }

    @GetMapping("/{lessonId}")
    fun get(
        @PathVariable courseId: Long,
        @PathVariable lessonId: Long,
    ): LessonDetailResponse = service.getLesson(courseId, lessonId)

    @PostMapping("/{lessonId}/access")
    fun recordAccess(
        @PathVariable courseId: Long,
        @PathVariable lessonId: Long,
    ): LessonResponse = service.recordAccess(courseId, lessonId).toResponse()

    @PatchMapping("/{lessonId}")
    fun update(
        @PathVariable courseId: Long,
        @PathVariable lessonId: Long,
        @RequestBody request: UpdateLessonRequest,
    ): LessonResponse = service.updateLesson(courseId, lessonId, UpdateLessonCommand.from(request)).toResponse()

    @PutMapping("/order")
    fun reorder(
        @PathVariable courseId: Long,
        @RequestBody request: ReorderLessonsRequest,
    ): List<LessonResponse> = service.reorder(courseId, request.sectionId, request.lessonIds).map { it.toResponse() }

    @PatchMapping("/{lessonId}/completion")
    fun setCompletion(
        @PathVariable courseId: Long,
        @PathVariable lessonId: Long,
        @RequestBody request: LessonCompletionRequest,
    ): LessonResponse = service.setCompletion(courseId, lessonId, request.completed).toResponse()

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @PathVariable courseId: Long,
        @RequestParam(required = false) sectionId: Long?,
        @RequestParam title: String,
        @RequestParam(defaultValue = "") description: String,
        @RequestPart video: MultipartFile,
    ): LessonResponse =
        service
            .createLesson(courseId, CreateLessonCommand.from(sectionId, title, description, video))
            .toResponse()
}

data class LessonCompletionRequest(
    val completed: Boolean,
)
