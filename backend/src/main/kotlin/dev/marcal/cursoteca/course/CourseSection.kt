package dev.marcal.cursoteca.course

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.OffsetDateTime

@Entity
@Table(name = "course_sections")
class CourseSection(
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "course_id", nullable = false)
	val course: Course,

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_id")
	val parent: CourseSection?,

	@Column(nullable = false, length = 180)
	var title: String,

	@Column(nullable = false, length = 220)
	var slug: String,

	@Column(nullable = false, columnDefinition = "text")
	var description: String,

	@Column(nullable = false)
	var position: Int,
) {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	var id: Long? = null

	@Column(name = "created_at", nullable = false)
	lateinit var createdAt: OffsetDateTime

	@Column(name = "updated_at", nullable = false)
	lateinit var updatedAt: OffsetDateTime

	@PrePersist
	fun prePersist() {
		val now = OffsetDateTime.now()
		createdAt = now
		updatedAt = now
	}

	@PreUpdate
	fun preUpdate() {
		updatedAt = OffsetDateTime.now()
	}
}

data class CourseSectionResponse(
	val id: Long,
	val courseId: Long,
	val parentId: Long?,
	val title: String,
	val slug: String,
	val description: String,
	val position: Int,
	val children: List<CourseSectionResponse> = emptyList(),
	val createdAt: OffsetDateTime,
	val updatedAt: OffsetDateTime,
)

fun CourseSection.toResponse(children: List<CourseSectionResponse> = emptyList()) = CourseSectionResponse(
	id = requireNotNull(id),
	courseId = requireNotNull(course.id),
	parentId = parent?.id,
	title = title,
	slug = slug,
	description = description,
	position = position,
	children = children,
	createdAt = createdAt,
	updatedAt = updatedAt,
)
