package dev.marcal.cursoteca.course

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CourseRepository : JpaRepository<Course, Long> {
	fun existsBySlug(slug: String): Boolean

	fun findAllByOrderByCreatedAtDescIdDesc(): List<Course>
}
