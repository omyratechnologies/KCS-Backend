import { Course, ICourseData } from "@/models/course.model";
import {
    CourseAssignment,
    ICourseAssignmentData,
} from "@/models/course_assignment.model";
import {
    CourseAssignmentSubmission,
    ICourseAssignmentSubmissionData,
} from "@/models/course_assignment_submission.model";
import {
    CourseContent,
    ICourseContentData,
} from "@/models/course_content.model";
import {
    CourseEnrollment,
    ICourseEnrollmentData,
} from "@/models/course_enrollment.model";

export class CourseService {
    // create course
    public static async createCourse(
        campus_id: string,
        courseData: Partial<ICourseData>
    ): Promise<ICourseData> {
        return await Course.create({
            ...courseData,
            campus_id: campus_id,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // get all courses
    public static async getAllCourses(
        campus_id: string
    ): Promise<ICourseData[]> {
        const courses: { rows: ICourseData[] } = await Course.find(
            {
                campus_id,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!courses) throw new Error("Courses not found");

        return courses.rows;
    }

    // get course by id
    public static async getCourseById(course_id: string): Promise<ICourseData> {
        const course: ICourseData = await Course.findById(course_id);

        if (!course) throw new Error("Course not found");

        return course;
    }

    // update course
    public static async updateCourse(
        course_id: string,
        courseData: Partial<ICourseData>
    ): Promise<ICourseData> {
        const course: ICourseData = await Course.updateById(course_id, {
            ...courseData,
            updated_at: new Date(),
        });

        if (!course) throw new Error("Course not updated");

        return course;
    }

    // delete course
    public static async deleteCourse(course_id: string): Promise<ICourseData> {
        const course: ICourseData = await Course.updateById(course_id, {
            is_deleted: true,
        });

        if (!course) throw new Error("Course not deleted");

        return course;
    }

    // create course assignment
    public static async createCourseAssignment(
        campus_id: string,
        course_id: string,
        assignmentData: Partial<ICourseAssignmentData>
    ): Promise<ICourseAssignmentData> {
        return await CourseAssignment.create({
            ...assignmentData,
            campus_id: campus_id,
            course_id: course_id,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // get all course assignments
    public static async getAllCourseAssignments(
        campus_id: string,
        course_id: string
    ): Promise<ICourseAssignmentData[]> {
        const assignments: { rows: ICourseAssignmentData[] } =
            await CourseAssignment.find(
                {
                    campus_id,
                    course_id,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

        if (!assignments) throw new Error("Assignments not found");

        return assignments.rows;
    }

    // get course assignment by id
    public static async getCourseAssignmentById(
        assignment_id: string
    ): Promise<ICourseAssignmentData> {
        const assignment: ICourseAssignmentData =
            await CourseAssignment.findById(assignment_id);

        if (!assignment) throw new Error("Assignment not found");

        return assignment;
    }

    // update course assignment
    public static async updateCourseAssignment(
        assignment_id: string,
        assignmentData: Partial<ICourseAssignmentData>
    ): Promise<ICourseAssignmentData> {
        const assignment: ICourseAssignmentData =
            await CourseAssignment.updateById(assignment_id, {
                ...assignmentData,
                updated_at: new Date(),
            });

        if (!assignment) throw new Error("Assignment not updated");

        return assignment;
    }

    // delete course assignment
    public static async deleteCourseAssignment(
        assignment_id: string
    ): Promise<ICourseAssignmentData> {
        const assignment: ICourseAssignmentData =
            await CourseAssignment.updateById(assignment_id, {
                is_deleted: true,
            });

        if (!assignment) throw new Error("Assignment not deleted");

        return assignment;
    }

    // create course assignment submission
    public static async createCourseAssignmentSubmission(
        campus_id: string,
        course_id: string,
        assignment_id: string,
        submissionData: Partial<ICourseAssignmentSubmissionData>
    ): Promise<ICourseAssignmentSubmissionData> {
        return await CourseAssignmentSubmission.create({
            ...submissionData,
            campus_id: campus_id,
            course_id: course_id,
            assignment_id: assignment_id,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // get all course assignment submissions
    public static async getAllCourseAssignmentSubmissions(
        campus_id: string,
        course_id: string,
        assignment_id: string
    ): Promise<ICourseAssignmentSubmissionData[]> {
        const submissions: { rows: ICourseAssignmentSubmissionData[] } =
            await CourseAssignmentSubmission.find(
                {
                    campus_id,
                    course_id,
                    assignment_id,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

        if (!submissions) throw new Error("Submissions not found");

        return submissions.rows;
    }

    // get course assignment submission by id
    public static async getCourseAssignmentSubmissionById(
        submission_id: string
    ): Promise<ICourseAssignmentSubmissionData> {
        const submission: ICourseAssignmentSubmissionData =
            await CourseAssignmentSubmission.findById(submission_id);

        if (!submission) throw new Error("Submission not found");

        return submission;
    }

    // update course assignment submission
    public static async updateCourseAssignmentSubmission(
        submission_id: string,
        submissionData: Partial<ICourseAssignmentSubmissionData>
    ): Promise<ICourseAssignmentSubmissionData> {
        const submission: ICourseAssignmentSubmissionData =
            await CourseAssignmentSubmission.updateById(submission_id, {
                ...submissionData,
                updated_at: new Date(),
            });

        if (!submission) throw new Error("Submission not updated");

        return submission;
    }

    // delete course assignment submission
    public static async deleteCourseAssignmentSubmission(
        submission_id: string
    ): Promise<ICourseAssignmentSubmissionData> {
        const submission: ICourseAssignmentSubmissionData =
            await CourseAssignmentSubmission.updateById(submission_id, {
                is_deleted: true,
            });

        if (!submission) throw new Error("Submission not deleted");

        return submission;
    }

    // create course content
    public static async createCourseContent(
        campus_id: string,
        course_id: string,
        contentData: Partial<ICourseContentData>
    ): Promise<ICourseContentData> {
        const content: ICourseContentData = await CourseContent.create({
            ...contentData,
            campus_id,
            course_id,
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (!content) throw new Error("Content not created");

        return content;
    }

    // get all course contents
    public static async getAllCourseContents(
        campus_id: string,
        course_id: string
    ): Promise<ICourseContentData[]> {
        const contents: {
            rows: ICourseContentData[];
        } = await CourseContent.find(
            {
                campus_id,
                course_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!contents) throw new Error("Contents not found");

        return contents.rows;
    }

    // get course content by id
    public static async getCourseContentById(
        content_id: string
    ): Promise<ICourseContentData> {
        const content: ICourseContentData =
            await CourseContent.findById(content_id);

        if (!content) throw new Error("Content not found");

        return content;
    }

    // update course content
    public static async updateCourseContent(
        content_id: string,
        contentData: Partial<ICourseContentData>
    ): Promise<ICourseContentData> {
        const content: ICourseContentData = await CourseContent.updateById(
            content_id,
            {
                ...contentData,
                updated_at: new Date(),
            }
        );

        if (!content) throw new Error("Content not updated");

        return content;
    }

    // delete course content
    public static async deleteCourseContent(
        content_id: string
    ): Promise<ICourseContentData> {
        const content: ICourseContentData = await CourseContent.updateById(
            content_id,
            {
                is_deleted: true,
            }
        );

        if (!content) throw new Error("Content not deleted");

        return content;
    }

    // enroll in course
    public static async enrollInCourse(
        campus_id: string,
        course_id: string,
        user_id: string,
        enrollmentData: Partial<ICourseEnrollmentData>
    ): Promise<ICourseEnrollmentData> {
        return await CourseEnrollment.create({
            user_id,
            ...enrollmentData,
            campus_id,
            course_id,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // get course enrollment by id
    public static async getCourseEnrollmentById(
        enrollment_id: string
    ): Promise<ICourseEnrollmentData> {
        const enrollment: ICourseEnrollmentData =
            await CourseEnrollment.findById(enrollment_id);

        if (!enrollment) throw new Error("Enrollment not found");

        return enrollment;
    }

    // get course enrollment by course id
    public static async getCourseEnrollmentByCourseId(
        course_id: string
    ): Promise<ICourseEnrollmentData[]> {
        const enrollments: {
            rows: ICourseEnrollmentData[];
        } = await CourseEnrollment.find(
            {
                course_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!enrollments) throw new Error("Enrollments not found");

        return enrollments.rows;
    }

    // get course enrollment by user id
    public static async getCourseEnrollmentByUserId(
        user_id: string
    ): Promise<ICourseEnrollmentData[]> {
        const enrollments: {
            rows: ICourseEnrollmentData[];
        } = await CourseEnrollment.find(
            {
                user_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!enrollments) throw new Error("Enrollments not found");

        return enrollments.rows;
    }

    // update course enrollment
    public static async updateCourseEnrollment(
        enrollment_id: string,
        enrollmentData: Partial<ICourseEnrollmentData>
    ): Promise<ICourseEnrollmentData> {
        const enrollment: ICourseEnrollmentData =
            await CourseEnrollment.updateById(enrollment_id, {
                ...enrollmentData,
                updated_at: new Date(),
            });

        if (!enrollment) throw new Error("Enrollment not updated");

        return enrollment;
    }

    // delete course enrollment
    public static async deleteCourseEnrollment(
        enrollment_id: string
    ): Promise<ICourseEnrollmentData> {
        const enrollment: ICourseEnrollmentData =
            await CourseEnrollment.updateById(enrollment_id, {
                is_deleted: true,
            });
        if (!enrollment) throw new Error("Enrollment not updated");

        return enrollment;
    }
}
