package dev.marcal.cursoteca.course

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
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

enum class ResourceType { LINK, FILE }

enum class ResourceScope { COURSE, SECTION, LESSON }

@Entity
@Table(name = "resources")
class CourseResource(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    val course: Course,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    val section: CourseSection?,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    val lesson: Lesson?,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val type: ResourceType,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val scope: ResourceScope,
    @Column(nullable = false, length = 180)
    var title: String,
    @Column(nullable = false, columnDefinition = "text")
    var description: String,
    @Column(columnDefinition = "text")
    var url: String?,
    @Column(name = "file_path", unique = true, columnDefinition = "text")
    var filePath: String?,
    @Column(name = "mime_type", length = 180)
    var mimeType: String?,
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

data class CourseResourceResponse(
    val id: Long,
    val courseId: Long,
    val sectionId: Long?,
    val lessonId: Long?,
    val type: ResourceType,
    val scope: ResourceScope,
    val title: String,
    val description: String,
    val url: String?,
    val fileUrl: String?,
    val mimeType: String?,
    val position: Int,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)

fun CourseResource.toResponse() =
    CourseResourceResponse(
        id = requireNotNull(id),
        courseId = requireNotNull(course.id),
        sectionId = section?.id,
        lessonId = lesson?.id,
        type = type,
        scope = scope,
        title = title,
        description = description,
        url = url,
        fileUrl = filePath?.let { "/assets/$it" },
        mimeType = mimeType,
        position = position,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
