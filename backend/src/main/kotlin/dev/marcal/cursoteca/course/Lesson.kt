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
@Table(name = "lessons")
class Lesson(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    val course: Course,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    val section: CourseSection?,
    @Column(nullable = false, length = 180)
    var title: String,
    @Column(nullable = false, columnDefinition = "text")
    var description: String,
    @Column(name = "video_path", nullable = false, unique = true, columnDefinition = "text")
    var videoPath: String,
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

    @Column(name = "completed_at")
    var completedAt: OffsetDateTime? = null

    @Column(name = "last_accessed_at")
    var lastAccessedAt: OffsetDateTime? = null

    val videoUrl: String
        get() = "/assets/$videoPath"

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

data class LessonResponse(
    val id: Long,
    val courseId: Long,
    val sectionId: Long?,
    val title: String,
    val description: String,
    val videoUrl: String,
    val position: Int,
    val completed: Boolean,
    val completedAt: OffsetDateTime?,
    val lastAccessedAt: OffsetDateTime?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)

data class LessonSectionResponse(
    val id: Long,
    val title: String,
    val slug: String,
)

data class LessonDetailResponse(
    val id: Long,
    val courseId: Long,
    val sectionId: Long?,
    val sectionPath: List<LessonSectionResponse>,
    val resourceGroups: LessonResourceGroupsResponse,
    val title: String,
    val description: String,
    val videoUrl: String,
    val position: Int,
    val completed: Boolean,
    val completedAt: OffsetDateTime?,
    val lastAccessedAt: OffsetDateTime?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)

data class AncestorResourceGroupResponse(
    val section: LessonSectionResponse,
    val resources: List<CourseResourceResponse>,
)

data class LessonResourceGroupsResponse(
    val lesson: List<CourseResourceResponse> = emptyList(),
    val section: List<CourseResourceResponse> = emptyList(),
    val ancestors: List<AncestorResourceGroupResponse> = emptyList(),
    val course: List<CourseResourceResponse> = emptyList(),
)

fun Lesson.toResponse() =
    LessonResponse(
        id = requireNotNull(id),
        courseId = requireNotNull(course.id),
        sectionId = section?.id,
        title = title,
        description = description,
        videoUrl = videoUrl,
        position = position,
        completed = completedAt != null,
        completedAt = completedAt,
        lastAccessedAt = lastAccessedAt,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )

fun Lesson.toDetailResponse(resourceGroups: LessonResourceGroupsResponse = LessonResourceGroupsResponse()): LessonDetailResponse {
    val sectionPath = mutableListOf<LessonSectionResponse>()
    var currentSection = section
    while (currentSection != null) {
        sectionPath +=
            LessonSectionResponse(
                id = requireNotNull(currentSection.id),
                title = currentSection.title,
                slug = currentSection.slug,
            )
        currentSection = currentSection.parent
    }

    return LessonDetailResponse(
        id = requireNotNull(id),
        courseId = requireNotNull(course.id),
        sectionId = section?.id,
        sectionPath = sectionPath.reversed(),
        resourceGroups = resourceGroups,
        title = title,
        description = description,
        videoUrl = videoUrl,
        position = position,
        completed = completedAt != null,
        completedAt = completedAt,
        lastAccessedAt = lastAccessedAt,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
}
