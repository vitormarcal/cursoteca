package dev.marcal.cursoteca.course

import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class LessonDownloadWorker(
    private val service: LessonDownloadJobService,
    private val runner: YtDlpRunner,
    private val storage: LessonDownloadStorage,
) {
    @Async("lessonDownloadExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun requested(event: LessonDownloadRequested) = process(event.jobId)

    @Async("lessonDownloadExecutor")
    @EventListener(ApplicationReadyEvent::class)
    fun recover() {
        val recovery = service.recover()
        recovery.interrupted.forEach { runCatching { storage.cleanup(it.courseSlug, it.jobId) } }
        recovery.queued.forEach(::process)
    }

    fun process(jobId: Long) {
        val work = service.start(jobId) ?: return
        try {
            val output = storage.outputTemplate(work.courseSlug, jobId)
            val result = runner.run(work.url, output) { service.progress(jobId, it) }
            val relativePath = storage.validateResult(result.finalPath)
            service.complete(jobId, relativePath, result.log)
        } catch (error: Exception) {
            runCatching { storage.cleanup(work.courseSlug, jobId) }
            val log = (error as? YtDlpException)?.processLog.orEmpty()
            service.fail(jobId, error.message ?: "Download failed", log)
        }
    }
}
