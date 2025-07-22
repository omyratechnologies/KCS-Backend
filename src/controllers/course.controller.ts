import { Context } from "hono";

import { ICourseData } from "@/models/course.model";
import { ICourseAssignmentData } from "@/models/course_assignment.model";
import { ICourseAssignmentSubmissionData } from "@/models/course_assignment_submission.model";
import { ICourseContentData } from "@/models/course_content.model";
import { ICourseEnrollmentData } from "@/models/course_enrollment.model";
import { CourseService } from "@/services/course.service";

export class CourseController {
    public static readonly createCourse = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const data: Partial<ICourseData> = await ctx.req.json();

            const attendance = await CourseService.createCourse(
                campus_id,
                data
            );

            return ctx.json(attendance);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getAllCourses = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const courses = await CourseService.getAllCourses(campus_id);

            return ctx.json(courses);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getCourseById = async (ctx: Context) => {
        try {
            const { course_id } = ctx.req.param();

            const course = await CourseService.getCourseById(course_id);

            return ctx.json(course);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly updateCourse = async (ctx: Context) => {
        try {
            const { course_id } = ctx.req.param();

            const data: Partial<ICourseData> = await ctx.req.json();

            const course = await CourseService.updateCourse(course_id, data);

            return ctx.json(course);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly deleteCourse = async (ctx: Context) => {
        try {
            const { course_id } = ctx.req.param();

            const course = await CourseService.deleteCourse(course_id);

            return ctx.json(course);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly createCourseAssignment = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { course_id } = ctx.req.param();

            const data: Partial<ICourseAssignmentData> = await ctx.req.json();

            const assignment = await CourseService.createCourseAssignment(
                campus_id,
                course_id,
                data
            );

            return ctx.json(assignment);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getAllCourseAssignments = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { course_id } = ctx.req.param();

            const assignments = await CourseService.getAllCourseAssignments(
                campus_id,
                course_id
            );

            return ctx.json(assignments);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getCourseAssignmentById = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            const assignment =
                await CourseService.getCourseAssignmentById(assignment_id);

            return ctx.json(assignment);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly updateCourseAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            const data: Partial<ICourseAssignmentData> = await ctx.req.json();

            const assignment = await CourseService.updateCourseAssignment(
                assignment_id,
                data
            );

            return ctx.json(assignment);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly deleteCourseAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            const assignment =
                await CourseService.deleteCourseAssignment(assignment_id);

            return ctx.json(assignment);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly createCourseContent = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { course_id } = ctx.req.param();

            // Get simple schema data from API request
            const requestData = await ctx.req.json();
            
            // Transform simple schema to complex model schema
            const modelData: Partial<ICourseContentData> = {
                content_title: requestData.title,
                content_description: requestData.content,
                content_type: requestData.content_type === "text" ? "lesson" : requestData.content_type,
                content_format: requestData.content_type === "text" ? "text" : requestData.content_type,
                content_data: {
                    text_content: requestData.content,
                    html_content: `<p>${requestData.content}</p>`,
                    duration: 1800
                },
                access_settings: {
                    access_level: "free",
                    available_from: new Date(),
                    available_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
                },
                interaction_settings: {
                    allow_comments: true,
                    allow_notes: true,
                    allow_bookmarks: true,
                    require_completion: false
                },
                sort_order: requestData.order || 1,
                meta_data: {
                    created_by: "system",
                    tags: []
                },
                is_active: true,
                is_deleted: false
            };

            const content = await CourseService.createCourseContent(
                campus_id,
                course_id,
                modelData
            );

            // Optional: Transform response to match API format
            // Uncomment if you want consistent field names
            // const apiResponse = {
            //     id: content.id,
            //     title: content.content_title,
            //     content: content.content_description,
            //     content_type: content.content_format,
            //     order: content.sort_order,
            //     created_at: content.created_at,
            //     updated_at: content.updated_at
            // };
            // return ctx.json(apiResponse);

            return ctx.json(content);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getAllCourseContents = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { course_id } = ctx.req.param();

            const contents = await CourseService.getAllCourseContents(
                campus_id,
                course_id
            );

            return ctx.json(contents);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getCourseContentById = async (ctx: Context) => {
        try {
            const { content_id } = ctx.req.param();

            const content = await CourseService.getCourseContentById(content_id);

            return ctx.json(content);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly updateCourseContent = async (ctx: Context) => {
        try {
            const { course_id, content_id } = ctx.req.param();

            // Get simple schema data from API request
            const requestData = await ctx.req.json();
            
            // Transform simple schema to complex model schema
            const modelData: Partial<ICourseContentData> = {};
            
            if (requestData.title) {
                modelData.content_title = requestData.title;
            }
            if (requestData.content) {
                modelData.content_description = requestData.content;
                modelData.content_data = {
                    text_content: requestData.content,
                    html_content: `<p>${requestData.content}</p>`,
                    duration: 1800
                };
            }
            if (requestData.content_type) {
                modelData.content_type = requestData.content_type === "text" ? "lesson" : requestData.content_type;
                modelData.content_format = requestData.content_type === "text" ? "text" : requestData.content_type;
            }
            if (requestData.order !== undefined) {
                modelData.sort_order = requestData.order;
            }

            const content = await CourseService.updateCourseContent(
                content_id,
                modelData
            );

            // Optional: Transform response to match API format  
            // Uncomment if you want consistent field names
            // const apiResponse = {
            //     id: content.id,
            //     title: content.content_title,
            //     content: content.content_description,
            //     content_type: content.content_format,
            //     order: content.sort_order,
            //     created_at: content.created_at,
            //     updated_at: content.updated_at
            // };
            // return ctx.json(apiResponse);

            return ctx.json(content);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly deleteCourseContent = async (ctx: Context) => {
        try {
            const { content_id } = ctx.req.param();

            const content = await CourseService.deleteCourseContent(content_id);

            return ctx.json(content);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly createCourseAssignmentSubmission = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { course_id, assignment_id } = ctx.req.param();

            const data: ICourseAssignmentSubmissionData = await ctx.req.json();

            const submission =
                await CourseService.createCourseAssignmentSubmission(
                    campus_id,
                    course_id,
                    assignment_id,
                    data
                );

            return ctx.json(submission);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getAllCourseAssignmentSubmissions = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { course_id, assignment_id } = ctx.req.param();

            const submission =
                await CourseService.getAllCourseAssignmentSubmissions(
                    campus_id,
                    course_id,
                    assignment_id
                );

            return ctx.json(submission);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getCourseAssignmentSubmission = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const submission =
                await CourseService.getCourseAssignmentSubmissionById(
                    submission_id
                );

            return ctx.json(submission);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly updateCourseAssignmentSubmission = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const data: ICourseAssignmentSubmissionData = await ctx.req.json();

            const submission =
                await CourseService.updateCourseAssignmentSubmission(
                    submission_id,
                    data
                );

            return ctx.json(submission);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly deleteCourseAssignmentSubmission = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const submission =
                await CourseService.deleteCourseAssignmentSubmission(
                    submission_id
                );

            return ctx.json(submission);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly enrollInCourse = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const { course_id } = ctx.req.param();

            const {
                enrollmentData,
            }: {
                enrollmentData: Partial<ICourseEnrollmentData>;
            } = await ctx.req.json();
            const enrollment = await CourseService.enrollInCourse(
                campus_id,
                course_id,
                user_id,
                enrollmentData
            );

            return ctx.json(enrollment);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getCourseEnrollmentById = async (ctx: Context) => {
        try {
            const { enrollment_id } = ctx.req.param();

            const enrollment =
                await CourseService.getCourseEnrollmentById(enrollment_id);

            return ctx.json(enrollment);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getCourseEnrollmentByCourseId = async (
        ctx: Context
    ) => {
        try {
            const { course_id } = ctx.req.param();

            const enrollments =
                await CourseService.getCourseEnrollmentByCourseId(course_id);

            return ctx.json(enrollments);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getCourseEnrollmentByUserId = async (
        ctx: Context
    ) => {
        try {
            const { user_id } = ctx.req.param();

            const enrollments =
                await CourseService.getCourseEnrollmentByUserId(user_id);

            return ctx.json(enrollments);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly updateCourseEnrollment = async (ctx: Context) => {
        try {
            const { enrollment_id } = ctx.req.param();

            const data: Partial<ICourseEnrollmentData> = await ctx.req.json();

            const enrollment = await CourseService.updateCourseEnrollment(
                enrollment_id,
                data
            );

            return ctx.json(enrollment);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly deleteCourseEnrollment = async (ctx: Context) => {
        try {
            const { enrollment_id } = ctx.req.param();

            const enrollment =
                await CourseService.deleteCourseEnrollment(enrollment_id);

            return ctx.json(enrollment);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
}
