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

enum class LessonDownloadStatus { QUEUED, RUNNING, COMPLETED, FAILED }

@Entity
@Table(name = "lesson_download_jobs")
class LessonDownloadJob(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    val course: Course,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    val section: CourseSection?,
    @Column(nullable = false, length = 180)
    val title: String,
    @Column(nullable = false, columnDefinition = "text")
    val description: String,
    @Column(name = "source_url", nullable = false, columnDefinition = "text")
    val sourceUrl: String,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    var lesson: Lesson? = null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: LessonDownloadStatus = LessonDownloadStatus.QUEUED

    @Column(nullable = false)
    var progress: Int = 0

    @Column(nullable = false, columnDefinition = "text")
    var log: String = ""

    @Column(columnDefinition = "text")
    var error: String? = null

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: OffsetDateTime

    @Column(name = "started_at")
    var startedAt: OffsetDateTime? = null

    @Column(name = "finished_at")
    var finishedAt: OffsetDateTime? = null

    @Column(name = "updated_at", nullable = false)
    lateinit var updatedAt: OffsetDateTime

    @PrePersist fun prePersist() {
        val now = OffsetDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate fun preUpdate() {
        updatedAt = OffsetDateTime.now()
    }
}

data class LessonDownloadJobResponse(
    val id: Long,
    val courseId: Long,
    val sectionId: Long?,
    val lessonId: Long?,
    val title: String,
    val description: String,
    val sourceUrl: String,
    val status: LessonDownloadStatus,
    val progress: Int,
    val log: String,
    val error: String?,
    val createdAt: OffsetDateTime,
    val startedAt: OffsetDateTime?,
    val finishedAt: OffsetDateTime?,
    val updatedAt: OffsetDateTime,
)

fun LessonDownloadJob.toResponse() =
    LessonDownloadJobResponse(
        requireNotNull(id),
        requireNotNull(course.id),
        section?.id,
        lesson?.id,
        title,
        description,
        sourceUrl,
        status,
        progress,
        log,
        error,
        createdAt,
        startedAt,
        finishedAt,
        updatedAt,
    )
