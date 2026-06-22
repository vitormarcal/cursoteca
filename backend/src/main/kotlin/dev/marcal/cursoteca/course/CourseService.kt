package dev.marcal.cursoteca.course

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CourseService(
    private val repository: CourseRepository,
    private val lessonRepository: LessonRepository,
    private val courseAssetStorage: CourseAssetStorage,
) {
    @Transactional(readOnly = true)
    fun listCourses(): List<CourseResponse> {
        val latestLessons =
            lessonRepository
                .findAllByLastAccessedAtIsNotNullOrderByLastAccessedAtDescIdDesc()
                .distinctBy { requireNotNull(it.course.id) }
                .associateBy { requireNotNull(it.course.id) }
        return repository
            .findAllByOrderByCreatedAtDescIdDesc()
            .sortedWith(
                compareByDescending<Course> { latestLessons.containsKey(it.id) }
                    .thenByDescending { latestLessons[it.id]?.lastAccessedAt }
                    .thenByDescending { it.createdAt },
            ).map { it.toResponse(latestLessons[it.id]) }
    }

    @Transactional(readOnly = true)
    fun getBySlug(slug: String): CourseResponse {
        val course = repository.findBySlug(slug) ?: throw CourseNotFoundException(slug)
        val lesson =
            lessonRepository
                .findFirstByCourseIdAndLastAccessedAtIsNotNullOrderByLastAccessedAtDescIdDesc(
                    requireNotNull(course.id),
                )
        return course.toResponse(lesson)
    }

    @Transactional
    fun createCourse(command: CreateCourseCommand): Course {
        val slug = uniqueSlug(command.name)
        val assetsPath = courseAssetStorage.createCourseDirectory(slug)
        val image = courseAssetStorage.saveCoverImage(slug, command.image)

        return repository.save(
            Course(
                name = command.name,
                slug = slug,
                description = command.description,
                imagePath = image.relativePath,
                assetsPath = assetsPath,
            ),
        )
    }

    private fun uniqueSlug(name: String): String {
        val base = Slugifier.slugify(name)
        var candidate = base
        var suffix = 2

        while (repository.existsBySlug(candidate)) {
            candidate = "$base-$suffix"
            suffix += 1
        }

        return candidate
    }
}
