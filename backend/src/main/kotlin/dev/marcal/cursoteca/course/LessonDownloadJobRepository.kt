package dev.marcal.cursoteca.course

import org.springframework.data.jpa.repository.JpaRepository

interface LessonDownloadJobRepository : JpaRepository<LessonDownloadJob, Long> {
    fun findAllByCourseIdOrderByCreatedAtDescIdDesc(courseId: Long): List<LessonDownloadJob>

    fun findByIdAndCourseId(
        id: Long,
        courseId: Long,
    ): LessonDownloadJob?

    fun findAllByStatus(status: LessonDownloadStatus): List<LessonDownloadJob>
}
