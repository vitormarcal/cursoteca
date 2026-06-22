package dev.marcal.cursoteca.course

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface LessonRepository : JpaRepository<Lesson, Long> {
    fun findAllByCourseIdOrderByPositionAscIdAsc(courseId: Long): List<Lesson>

    fun findAllByCourseIdAndSectionIsNullOrderByPositionAscIdAsc(courseId: Long): List<Lesson>

    fun findAllByCourseIdAndSectionIdOrderByPositionAscIdAsc(
        courseId: Long,
        sectionId: Long,
    ): List<Lesson>

    fun findByIdAndCourseId(
        id: Long,
        courseId: Long,
    ): Lesson?

    fun findAllByLastAccessedAtIsNotNullOrderByLastAccessedAtDescIdDesc(): List<Lesson>

    fun findFirstByCourseIdAndLastAccessedAtIsNotNullOrderByLastAccessedAtDescIdDesc(courseId: Long): Lesson?

    @Query(
        """
        select coalesce(max(lesson.position), 0)
        from Lesson lesson
        where lesson.course.id = :courseId
          and lesson.section is null
        """,
    )
    fun maxCoursePosition(
        @Param("courseId") courseId: Long,
    ): Int

    @Query(
        """
        select coalesce(max(lesson.position), 0)
        from Lesson lesson
        where lesson.course.id = :courseId
          and lesson.section.id = :sectionId
        """,
    )
    fun maxSectionPosition(
        @Param("courseId") courseId: Long,
        @Param("sectionId") sectionId: Long,
    ): Int
}
