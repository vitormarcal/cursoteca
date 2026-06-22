package dev.marcal.cursoteca.course

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import java.util.concurrent.Executor

@Configuration
@EnableAsync
class LessonDownloadAsyncConfig {
    @Bean(name = ["lessonDownloadExecutor"])
    fun lessonDownloadExecutor(): Executor =
        ThreadPoolTaskExecutor().apply {
            corePoolSize = 1
            maxPoolSize = 1
            queueCapacity = 100
            setThreadNamePrefix("lesson-download-")
            initialize()
        }
}
