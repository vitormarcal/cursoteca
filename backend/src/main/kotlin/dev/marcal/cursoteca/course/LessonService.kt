package dev.marcal.cursoteca.course

import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class LessonService(
    private val courseRepository: CourseRepository,
    private val sectionRepository: CourseSectionRepository,
    private val lessonRepository: LessonRepository,
    private val lessonAssetStorage: LessonAssetStorage,
) {
    @Transactional(readOnly = true)
    fun listLessons(courseId: Long): List<Lesson> {
        if (!courseRepository.existsById(courseId)) {
            throw CourseNotFoundException(courseId)
        }
        return lessonRepository.findAllByCourseIdOrderByPositionAscIdAsc(courseId)
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
