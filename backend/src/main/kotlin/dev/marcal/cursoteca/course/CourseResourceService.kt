package dev.marcal.cursoteca.course

import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CourseResourceService(
    private val courseRepository: CourseRepository,
    private val sectionRepository: CourseSectionRepository,
    private val lessonRepository: LessonRepository,
    private val resourceRepository: CourseResourceRepository,
) {
    @Transactional
    fun createLink(
        courseId: Long,
        command: CreateResourceLinkCommand,
    ): CourseResource {
        val course = courseRepository.findByIdOrNull(courseId) ?: throw CourseNotFoundException(courseId)
        val section =
            command.sectionId?.let { id ->
                sectionRepository.findByIdOrNull(id)?.takeIf { it.course.id == courseId }
                    ?: throw CourseSectionNotFoundException(id)
            }
        val lesson =
            command.lessonId?.let { id ->
                lessonRepository.findByIdAndCourseId(id, courseId) ?: throw LessonNotFoundException(id)
            }
        val position =
            when (command.scope) {
                ResourceScope.COURSE -> resourceRepository.maxCoursePosition(courseId, ResourceScope.COURSE) + 1
                ResourceScope.SECTION -> resourceRepository.maxSectionPosition(requireNotNull(section?.id)) + 1
                ResourceScope.LESSON -> resourceRepository.maxLessonPosition(requireNotNull(lesson?.id)) + 1
            }

        return resourceRepository.save(
            CourseResource(
                course = course,
                section = section,
                lesson = lesson,
                type = ResourceType.LINK,
                scope = command.scope,
                title = command.title,
                description = command.description,
                url = command.url,
                filePath = null,
                mimeType = null,
                position = position,
            ),
        )
    }
}
