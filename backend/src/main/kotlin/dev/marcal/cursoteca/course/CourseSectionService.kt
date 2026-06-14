package dev.marcal.cursoteca.course

import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CourseSectionService(
	private val courseRepository: CourseRepository,
	private val sectionRepository: CourseSectionRepository,
) {
	@Transactional(readOnly = true)
	fun listTree(courseId: Long): List<CourseSectionResponse> {
		if (!courseRepository.existsById(courseId)) {
			throw CourseNotFoundException(courseId)
		}

		val sections = sectionRepository.findAllByCourseIdOrderByParentIdAscPositionAscIdAsc(courseId)
		val childrenByParent = sections.groupBy { it.parent?.id }

		fun build(parentId: Long?): List<CourseSectionResponse> = childrenByParent[parentId]
			.orEmpty()
			.sortedWith(compareBy<CourseSection> { it.position }.thenBy { it.id })
			.map { section -> section.toResponse(build(section.id)) }

		return build(null)
	}

	@Transactional
	fun createSection(courseId: Long, command: CreateCourseSectionCommand): CourseSection {
		val course = courseRepository.findByIdOrNull(courseId) ?: throw CourseNotFoundException(courseId)
		val parent = command.parentId?.let { parentId ->
			val section = sectionRepository.findByIdOrNull(parentId) ?: throw CourseSectionParentNotFoundException(parentId)
			if (section.course.id != courseId) {
				throw CourseSectionParentNotFoundException(parentId)
			}
			section
		}

		val slug = uniqueSlug(courseId, parent?.id, command.title)
		val position = if (parent == null) {
			sectionRepository.maxRootPosition(courseId) + 1
		} else {
			sectionRepository.maxChildPosition(courseId, requireNotNull(parent.id)) + 1
		}

		return sectionRepository.save(
			CourseSection(
				course = course,
				parent = parent,
				title = command.title,
				slug = slug,
				description = command.description,
				position = position,
			),
		)
	}

	private fun uniqueSlug(courseId: Long, parentId: Long?, title: String): String {
		val base = Slugifier.slugify(title)
		var candidate = base
		var suffix = 2

		while (sectionSlugExists(courseId, parentId, candidate)) {
			candidate = "$base-$suffix"
			suffix += 1
		}

		return candidate
	}

	private fun sectionSlugExists(courseId: Long, parentId: Long?, slug: String): Boolean =
		if (parentId == null) {
			sectionRepository.existsByCourseIdAndParentIsNullAndSlug(courseId, slug)
		} else {
			sectionRepository.existsByCourseIdAndParentIdAndSlug(courseId, parentId, slug)
		}
}
