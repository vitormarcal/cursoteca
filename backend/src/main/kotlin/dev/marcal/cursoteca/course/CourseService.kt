package dev.marcal.cursoteca.course

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CourseService(
    private val repository: CourseRepository,
    private val courseAssetStorage: CourseAssetStorage,
) {
    fun listCourses(): List<Course> = repository.findAllByOrderByCreatedAtDescIdDesc()

    fun getBySlug(slug: String): Course = repository.findBySlug(slug) ?: throw CourseNotFoundException(slug)

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
