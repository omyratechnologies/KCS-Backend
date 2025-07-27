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
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();

            // Get week-based content data from API request
            const requestData = await ctx.req.json();
            
            // Validate required fields
            if (!requestData.title || !requestData.contents || !Array.isArray(requestData.contents)) {
                return ctx.json(
                    { message: "Missing required fields: title, contents array" },
                    400
                );
            }

            const createdContents: ICourseContentData[] = [];
            
            // Process each content item in the array
            for (let i = 0; i < requestData.contents.length; i++) {
                const contentItem = requestData.contents[i];
                
                // Transform each content item to model schema
                const modelData: Partial<ICourseContentData> = {
                    content_title: contentItem.title,
                    content_description: contentItem.description || requestData.description,
                    content_type: CourseController.mapContentType(contentItem.content_type),
                    content_format: CourseController.mapContentFormat(contentItem.content_type),
                    content_data: CourseController.transformContentData(contentItem.content_type, contentItem.content_data),
                    access_settings: {
                        access_level: requestData.access_settings?.access_level || "free",
                        available_from: requestData.access_settings?.available_from 
                            ? new Date(requestData.access_settings.available_from) 
                            : new Date(),
                        available_until: requestData.access_settings?.available_until 
                            ? new Date(requestData.access_settings.available_until)
                            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    },
                    interaction_settings: {
                        allow_comments: requestData.interaction_settings?.allow_comments ?? true,
                        allow_notes: requestData.interaction_settings?.allow_notes ?? true,
                        allow_bookmarks: requestData.interaction_settings?.allow_bookmarks ?? true,
                        require_completion: requestData.interaction_settings?.require_completion ?? false
                    },
                    sort_order: (requestData.order || 1) * 100 + i, // Week order * 100 + content index
                    meta_data: {
                        created_by: user_id || "system",
                        tags: requestData.meta_data?.tags || []
                    },
                    is_active: true,
                    is_deleted: false
                };

                const content = await CourseService.createCourseContent(
                    campus_id,
                    course_id,
                    modelData
                );

                createdContents.push(content);
            }

            // Return week-based response
            const response = {
                week_title: requestData.title,
                week_description: requestData.description,
                week_order: requestData.order || 1,
                contents_count: createdContents.length,
                contents: createdContents.map(content => ({
                    id: content.id,
                    title: content.content_title,
                    description: content.content_description,
                    content_type: content.content_format,
                    content_data: content.content_data,
                    order: content.sort_order,
                    created_at: content.created_at,
                    updated_at: content.updated_at
                }))
            };

            return ctx.json(response);
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

    // Helper method to map content types
    private static mapContentType(contentType: string): "lesson" | "quiz" | "assignment" | "resource" | "assessment" | "interactive" {
        switch (contentType) {
            case "text":
                return "lesson";
            case "video":
                return "lesson";
            case "resource":
                return "resource";
            default:
                return "lesson";
        }
    }

    // Helper method to map content format
    private static mapContentFormat(contentType: string): "text" | "video" | "audio" | "document" | "presentation" | "interactive" {
        switch (contentType) {
            case "text":
                return "text";
            case "video":
                return "video";
            case "resource":
                return "document";
            default:
                return "text";
        }
    }

    // Helper method to transform content data based on type
    private static transformContentData(contentType: string, contentData: any): any {
        switch (contentType) {
            case "text":
                return {
                    text_content: contentData.text_content,
                    html_content: `<p>${contentData.text_content}</p>`,
                    duration: contentData.duration || 1800
                };
            case "video":
                return {
                    video_url: contentData.video_url,
                    duration: contentData.video_duration,
                    thumbnail_url: contentData.thumbnail_url,
                    file_size: contentData.file_size
                };
            case "resource":
                return {
                    document_url: contentData.resources_url,
                    file_size: contentData.resources_size,
                    duration: 0
                };
            default:
                return contentData;
        }
    }

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
