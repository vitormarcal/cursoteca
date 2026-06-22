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
    private val resourceAssetStorage: CourseResourceAssetStorage,
) {
    @Transactional
    fun createLink(
        courseId: Long,
        command: CreateResourceLinkCommand,
    ): CourseResource {
        val target = resolveTarget(courseId, command.scope, command.sectionId, command.lessonId)

        return resourceRepository.save(
            CourseResource(
                course = target.course,
                section = target.section,
                lesson = target.lesson,
                type = ResourceType.LINK,
                scope = command.scope,
                title = command.title,
                description = command.description,
                url = command.url,
                filePath = null,
                mimeType = null,
                position = target.position,
            ),
        )
    }

    @Transactional
    fun createFile(
        courseId: Long,
        command: CreateResourceFileCommand,
    ): CourseResource {
        val target = resolveTarget(courseId, command.scope, command.sectionId, command.lessonId)
        val stored = resourceAssetStorage.save(target.course.slug, command.extension, command.file)
        return try {
            resourceRepository.saveAndFlush(
                CourseResource(
                    course = target.course,
                    section = target.section,
                    lesson = target.lesson,
                    type = ResourceType.FILE,
                    scope = command.scope,
                    title = command.title,
                    description = command.description,
                    url = null,
                    filePath = stored.relativePath,
                    mimeType = command.mimeType,
                    position = target.position,
                ),
            )
        } catch (error: Exception) {
            resourceAssetStorage.delete(stored.relativePath)
            throw error
        }
    }

    private fun resolveTarget(
        courseId: Long,
        scope: ResourceScope,
        sectionId: Long?,
        lessonId: Long?,
    ): ResourceTarget {
        val course = courseRepository.findByIdOrNull(courseId) ?: throw CourseNotFoundException(courseId)
        val section =
            sectionId?.let { id ->
                sectionRepository.findByIdOrNull(id)?.takeIf { it.course.id == courseId }
                    ?: throw CourseSectionNotFoundException(id)
            }
        val lesson =
            lessonId?.let { id ->
                lessonRepository.findByIdAndCourseId(id, courseId) ?: throw LessonNotFoundException(id)
            }
        val position =
            when (scope) {
                ResourceScope.COURSE -> resourceRepository.maxCoursePosition(courseId, ResourceScope.COURSE) + 1
                ResourceScope.SECTION -> resourceRepository.maxSectionPosition(requireNotNull(section?.id)) + 1
                ResourceScope.LESSON -> resourceRepository.maxLessonPosition(requireNotNull(lesson?.id)) + 1
            }
        return ResourceTarget(course, section, lesson, position)
    }

    private data class ResourceTarget(
        val course: Course,
        val section: CourseSection?,
        val lesson: Lesson?,
        val position: Int,
    )
}
