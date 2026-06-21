package dev.marcal.cursoteca.course

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface CourseResourceRepository : JpaRepository<CourseResource, Long> {
    fun findAllByCourseIdAndScopeOrderByPositionAscIdAsc(
        courseId: Long,
        scope: ResourceScope,
    ): List<CourseResource>

    fun findAllBySectionIdOrderByPositionAscIdAsc(sectionId: Long): List<CourseResource>

    fun findAllByLessonIdOrderByPositionAscIdAsc(lessonId: Long): List<CourseResource>

    @Query("select coalesce(max(r.position), 0) from CourseResource r where r.course.id = :courseId and r.scope = :scope")
    fun maxCoursePosition(
        @Param("courseId") courseId: Long,
        @Param("scope") scope: ResourceScope,
    ): Int

    @Query("select coalesce(max(r.position), 0) from CourseResource r where r.section.id = :sectionId")
    fun maxSectionPosition(
        @Param("sectionId") sectionId: Long,
    ): Int

    @Query("select coalesce(max(r.position), 0) from CourseResource r where r.lesson.id = :lessonId")
    fun maxLessonPosition(
        @Param("lessonId") lessonId: Long,
    ): Int
}
