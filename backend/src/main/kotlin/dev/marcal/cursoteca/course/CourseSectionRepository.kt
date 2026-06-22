package dev.marcal.cursoteca.course

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface CourseSectionRepository : JpaRepository<CourseSection, Long> {
    fun findAllByCourseIdOrderByParentIdAscPositionAscIdAsc(courseId: Long): List<CourseSection>

    fun findAllByCourseIdAndParentIsNullOrderByPositionAscIdAsc(courseId: Long): List<CourseSection>

    fun findAllByCourseIdAndParentIdOrderByPositionAscIdAsc(
        courseId: Long,
        parentId: Long,
    ): List<CourseSection>

    fun existsByCourseIdAndParentIsNullAndSlug(
        courseId: Long,
        slug: String,
    ): Boolean

    fun existsByCourseIdAndParentIdAndSlug(
        courseId: Long,
        parentId: Long,
        slug: String,
    ): Boolean

    @Query(
        """
		select coalesce(max(section.position), 0)
		from CourseSection section
		where section.course.id = :courseId
		  and section.parent is null
		""",
    )
    fun maxRootPosition(
        @Param("courseId") courseId: Long,
    ): Int

    @Query(
        """
		select coalesce(max(section.position), 0)
		from CourseSection section
		where section.course.id = :courseId
		  and section.parent.id = :parentId
		""",
    )
    fun maxChildPosition(
        @Param("courseId") courseId: Long,
        @Param("parentId") parentId: Long,
    ): Int
}
