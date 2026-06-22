package dev.marcal.cursoteca.course

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/courses/{courseId}/sections")
class CourseSectionController(
    private val service: CourseSectionService,
) {
    @GetMapping
    fun list(
        @PathVariable courseId: Long,
    ): List<CourseSectionResponse> = service.listTree(courseId)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @PathVariable courseId: Long,
        @RequestBody request: CreateCourseSectionRequest,
    ): CourseSectionResponse = service.createSection(courseId, CreateCourseSectionCommand.from(request)).toResponse()

    @PatchMapping("/{sectionId}")
    fun update(
        @PathVariable courseId: Long,
        @PathVariable sectionId: Long,
        @RequestBody request: UpdateCourseSectionRequest,
    ): CourseSectionResponse = service.updateSection(courseId, sectionId, UpdateCourseSectionCommand.from(request)).toResponse()

    @PutMapping("/order")
    fun reorder(
        @PathVariable courseId: Long,
        @RequestBody request: ReorderCourseSectionsRequest,
    ): List<CourseSectionResponse> = service.reorder(courseId, request.parentId, request.sectionIds)
}
