package dev.marcal.cursoteca.course

import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

data class LessonDownloadRequested(
    val jobId: Long,
)

data class LessonDownloadWork(
    val jobId: Long,
    val courseSlug: String,
    val url: String,
)

data class LessonDownloadRecovery(
    val interrupted: List<LessonDownloadWork>,
    val queued: List<Long>,
)

@Service
class LessonDownloadJobService(
    private val courseRepository: CourseRepository,
    private val sectionRepository: CourseSectionRepository,
    private val lessonRepository: LessonRepository,
    private val jobRepository: LessonDownloadJobRepository,
    private val publisher: ApplicationEventPublisher,
) {
    @Transactional
    fun create(
        courseId: Long,
        command: CreateLessonDownloadCommand,
    ): LessonDownloadJob {
        val course = courseRepository.findByIdOrNull(courseId) ?: throw CourseNotFoundException(courseId)
        val section =
            command.sectionId?.let { id ->
                sectionRepository.findByIdOrNull(id)?.takeIf { it.course.id == courseId } ?: throw CourseSectionNotFoundException(id)
            }
        val job = jobRepository.save(LessonDownloadJob(course, section, command.title, command.description, command.url))
        jobRepository.flush()
        publisher.publishEvent(LessonDownloadRequested(requireNotNull(job.id)))
        return job
    }

    @Transactional(readOnly = true)
    fun list(courseId: Long): List<LessonDownloadJob> {
        if (!courseRepository.existsById(courseId)) throw CourseNotFoundException(courseId)
        return jobRepository.findAllByCourseIdOrderByCreatedAtDescIdDesc(courseId)
    }

    @Transactional(readOnly = true)
    fun get(
        courseId: Long,
        jobId: Long,
    ): LessonDownloadJob = jobRepository.findByIdAndCourseId(jobId, courseId) ?: throw LessonDownloadNotFoundException(jobId)

    @Transactional
    fun start(jobId: Long): LessonDownloadWork? {
        val job = jobRepository.findByIdOrNull(jobId) ?: return null
        if (job.status != LessonDownloadStatus.QUEUED) return null
        job.status = LessonDownloadStatus.RUNNING
        job.startedAt = OffsetDateTime.now()
        return LessonDownloadWork(jobId, job.course.slug, job.sourceUrl)
    }

    @Transactional
    fun progress(
        jobId: Long,
        progress: Int,
    ) {
        jobRepository.findByIdOrNull(jobId)?.progress = progress
    }

    @Transactional
    fun complete(
        jobId: Long,
        videoPath: String,
        log: String,
    ) {
        val job = jobRepository.findByIdOrNull(jobId) ?: return
        val courseId = requireNotNull(job.course.id)
        val position =
            if (job.section == null) {
                lessonRepository.maxCoursePosition(courseId) + 1
            } else {
                lessonRepository.maxSectionPosition(courseId, requireNotNull(job.section?.id)) + 1
            }
        val lesson = lessonRepository.save(Lesson(job.course, job.section, job.title, job.description, videoPath, position))
        job.lesson = lesson
        job.status = LessonDownloadStatus.COMPLETED
        job.progress = 100
        job.log = log
        job.finishedAt = OffsetDateTime.now()
    }

    @Transactional
    fun fail(
        jobId: Long,
        message: String,
        log: String,
    ) {
        jobRepository.findByIdOrNull(jobId)?.apply {
            status = LessonDownloadStatus.FAILED
            error = message.take(4000)
            this.log = log.takeLast(20_000)
            finishedAt = OffsetDateTime.now()
        }
    }

    @Transactional
    fun recover(): LessonDownloadRecovery {
        val interrupted =
            jobRepository.findAllByStatus(LessonDownloadStatus.RUNNING).map {
                val work = LessonDownloadWork(requireNotNull(it.id), it.course.slug, it.sourceUrl)
                it.status = LessonDownloadStatus.FAILED
                it.error = "Download interrupted by application restart"
                it.finishedAt = OffsetDateTime.now()
                work
            }
        val queued = jobRepository.findAllByStatus(LessonDownloadStatus.QUEUED).map { requireNotNull(it.id) }
        return LessonDownloadRecovery(interrupted, queued)
    }
}
