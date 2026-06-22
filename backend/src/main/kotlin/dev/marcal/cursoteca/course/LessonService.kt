package dev.marcal.cursoteca.course

import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Service
class LessonService(
    private val courseRepository: CourseRepository,
    private val sectionRepository: CourseSectionRepository,
    private val lessonRepository: LessonRepository,
    private val lessonAssetStorage: LessonAssetStorage,
    private val resourceRepository: CourseResourceRepository,
) {
    @Transactional(readOnly = true)
    fun listLessons(courseId: Long): List<Lesson> {
        if (!courseRepository.existsById(courseId)) {
            throw CourseNotFoundException(courseId)
        }
        return lessonRepository.findAllByCourseIdOrderByPositionAscIdAsc(courseId)
    }

    @Transactional(readOnly = true)
    fun getLesson(
        courseId: Long,
        lessonId: Long,
    ): LessonDetailResponse {
        if (!courseRepository.existsById(courseId)) {
            throw CourseNotFoundException(courseId)
        }
        val lesson = lessonRepository.findByIdAndCourseId(lessonId, courseId) ?: throw LessonNotFoundException(lessonId)
        return lesson.toDetailResponse(resourceGroups(lesson))
    }

    @Transactional
    fun recordAccess(
        courseId: Long,
        lessonId: Long,
    ): Lesson {
        if (!courseRepository.existsById(courseId)) {
            throw CourseNotFoundException(courseId)
        }
        val lesson = lessonRepository.findByIdAndCourseId(lessonId, courseId) ?: throw LessonNotFoundException(lessonId)
        lesson.lastAccessedAt = OffsetDateTime.now()
        return lesson
    }

    @Transactional
    fun setCompletion(
        courseId: Long,
        lessonId: Long,
        completed: Boolean,
    ): Lesson {
        if (!courseRepository.existsById(courseId)) {
            throw CourseNotFoundException(courseId)
        }
        val lesson = lessonRepository.findByIdAndCourseId(lessonId, courseId) ?: throw LessonNotFoundException(lessonId)
        val now = OffsetDateTime.now()
        lesson.completedAt = if (completed) now else null
        lesson.lastAccessedAt = now
        return lesson
    }

    @Transactional
    fun updateLesson(
        courseId: Long,
        lessonId: Long,
        command: UpdateLessonCommand,
    ): Lesson {
        if (!courseRepository.existsById(courseId)) throw CourseNotFoundException(courseId)
        val lesson = lessonRepository.findByIdAndCourseId(lessonId, courseId) ?: throw LessonNotFoundException(lessonId)
        val section =
            command.sectionId?.let { sectionId ->
                sectionRepository.findByIdOrNull(sectionId)?.takeIf { it.course.id == courseId }
                    ?: throw CourseSectionNotFoundException(sectionId)
            }
        if (lesson.section?.id != section?.id) {
            lesson.position =
                if (section == null) {
                    lessonRepository.maxCoursePosition(courseId) + 1
                } else {
                    lessonRepository.maxSectionPosition(courseId, requireNotNull(section.id)) + 1
                }
            lesson.section = section
        }
        lesson.title = command.title
        lesson.description = command.description
        return lesson
    }

    @Transactional
    fun reorder(
        courseId: Long,
        sectionId: Long?,
        lessonIds: List<Long>,
    ): List<Lesson> {
        if (!courseRepository.existsById(courseId)) throw CourseNotFoundException(courseId)
        if (sectionId != null) {
            sectionRepository.findByIdOrNull(sectionId)?.takeIf { it.course.id == courseId }
                ?: throw CourseSectionNotFoundException(sectionId)
        }
        val siblings =
            if (sectionId == null) {
                lessonRepository.findAllByCourseIdAndSectionIsNullOrderByPositionAscIdAsc(courseId)
            } else {
                lessonRepository.findAllByCourseIdAndSectionIdOrderByPositionAscIdAsc(courseId, sectionId)
            }
        val expected = siblings.map { requireNotNull(it.id) }.toSet()
        if (lessonIds.size != siblings.size || lessonIds.toSet() != expected) {
            throw InvalidLessonInputException(
                mapOf("lessonIds" to "lessonIds must contain every lesson in the section exactly once"),
            )
        }
        val lessonsById = siblings.associateBy { requireNotNull(it.id) }
        lessonIds.forEachIndexed { index, id -> lessonsById.getValue(id).position = index + 1 }
        return lessonIds.map(lessonsById::getValue)
    }

    private fun resourceGroups(lesson: Lesson): LessonResourceGroupsResponse {
        val lessonResources =
            resourceRepository.findAllByLessonIdOrderByPositionAscIdAsc(requireNotNull(lesson.id)).map { it.toResponse() }
        val sectionResources =
            lesson.section
                ?.id
                ?.let(resourceRepository::findAllBySectionIdOrderByPositionAscIdAsc)
                .orEmpty()
                .map { it.toResponse() }
        val ancestors = mutableListOf<AncestorResourceGroupResponse>()
        var ancestor = lesson.section?.parent
        while (ancestor != null) {
            val resources =
                resourceRepository
                    .findAllBySectionIdOrderByPositionAscIdAsc(requireNotNull(ancestor.id))
                    .map { it.toResponse() }
            if (resources.isNotEmpty()) {
                ancestors +=
                    AncestorResourceGroupResponse(
                        section = LessonSectionResponse(requireNotNull(ancestor.id), ancestor.title, ancestor.slug),
                        resources = resources,
                    )
            }
            ancestor = ancestor.parent
        }
        val courseResources =
            resourceRepository
                .findAllByCourseIdAndScopeOrderByPositionAscIdAsc(lesson.course.id!!, ResourceScope.COURSE)
                .map { it.toResponse() }

        return LessonResourceGroupsResponse(lessonResources, sectionResources, ancestors, courseResources)
    }

    @Transactional
    fun createLesson(
        courseId: Long,
        command: CreateLessonCommand,
    ): Lesson {
        val course = courseRepository.findByIdOrNull(courseId) ?: throw CourseNotFoundException(courseId)
        val section =
            command.sectionId?.let { sectionId ->
                sectionRepository
                    .findByIdOrNull(sectionId)
                    ?.takeIf { it.course.id == courseId }
                    ?: throw CourseSectionNotFoundException(sectionId)
            }
        val position =
            if (section == null) {
                lessonRepository.maxCoursePosition(courseId) + 1
            } else {
                lessonRepository.maxSectionPosition(courseId, requireNotNull(section.id)) + 1
            }
        val storedVideo = lessonAssetStorage.saveVideo(course.slug, command.video)

        return try {
            lessonRepository.saveAndFlush(
                Lesson(
                    course = course,
                    section = section,
                    title = command.title,
                    description = command.description,
                    videoPath = storedVideo.relativePath,
                    position = position,
                ),
            )
        } catch (error: Exception) {
            lessonAssetStorage.delete(storedVideo.relativePath)
            throw error
        }
    }
}
