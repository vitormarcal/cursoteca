package dev.marcal.cursoteca.course

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.OffsetDateTime

@Entity
@Table(name = "courses")
class Course(
    @Column(nullable = false, length = 180)
    var name: String,
    @Column(nullable = false, unique = true, length = 220)
    var slug: String,
    @Column(nullable = false, columnDefinition = "text")
    var description: String,
    @Column(name = "image_path", nullable = false, columnDefinition = "text")
    var imagePath: String,
    @Column(name = "assets_path", nullable = false, columnDefinition = "text")
    var assetsPath: String,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: OffsetDateTime

    @Column(name = "updated_at", nullable = false)
    lateinit var updatedAt: OffsetDateTime

    val imageUrl: String
        get() = "/assets/$imagePath"

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

data class CourseResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val description: String,
    val imageUrl: String,
    val continueLessonId: Long?,
    val lastAccessedAt: OffsetDateTime?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)

fun Course.toResponse(lastAccessedLesson: Lesson? = null) =
    CourseResponse(
        id = requireNotNull(id),
        name = name,
        slug = slug,
        description = description,
        imageUrl = imageUrl,
        continueLessonId = lastAccessedLesson?.id,
        lastAccessedAt = lastAccessedLesson?.lastAccessedAt,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
