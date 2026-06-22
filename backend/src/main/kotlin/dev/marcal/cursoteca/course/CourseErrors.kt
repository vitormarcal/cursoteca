package dev.marcal.cursoteca.course

import dev.marcal.cursoteca.error.BusinessException
import dev.marcal.cursoteca.error.ReasonEnum

class CourseNotFoundException(
    identifier: Any,
) : BusinessException(
        reason = ReasonEnum.COURSE_NOT_FOUND,
        details = mapOf("identifier" to identifier.toString()),
    )

class CourseSectionParentNotFoundException(
    parentId: Long,
) : BusinessException(
        reason = ReasonEnum.COURSE_SECTION_PARENT_NOT_FOUND,
        details = mapOf("parentId" to parentId.toString()),
    )

class InvalidCourseInputException(
    details: Map<String, String>,
) : BusinessException(
        reason = ReasonEnum.INVALID_COURSE_INPUT,
        details = details,
    )

class InvalidCourseSectionInputException(
    details: Map<String, String>,
) : BusinessException(
        reason = ReasonEnum.INVALID_COURSE_SECTION_INPUT,
        details = details,
    )

class CourseSectionNotFoundException(
    sectionId: Long,
) : BusinessException(
        reason = ReasonEnum.COURSE_SECTION_NOT_FOUND,
        details = mapOf("sectionId" to sectionId.toString()),
    )

class InvalidLessonInputException(
    details: Map<String, String>,
) : BusinessException(
        reason = ReasonEnum.INVALID_LESSON_INPUT,
        details = details,
    )

class LessonNotFoundException(
    lessonId: Long,
) : BusinessException(
        reason = ReasonEnum.LESSON_NOT_FOUND,
        details = mapOf("lessonId" to lessonId.toString()),
    )

class InvalidResourceInputException(
    details: Map<String, String>,
) : BusinessException(
        reason = ReasonEnum.INVALID_RESOURCE_INPUT,
        details = details,
    )

class LessonDownloadNotFoundException(
    jobId: Long,
) : BusinessException(
        reason = ReasonEnum.LESSON_DOWNLOAD_NOT_FOUND,
        details = mapOf("jobId" to jobId.toString()),
    )
