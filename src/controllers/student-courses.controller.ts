import { Context } from "hono";
import { CourseService } from "@/services/course.service";
import { StudentCoursesService } from "../services/student-courses.service";

export class StudentCoursesController {
    
    /**
     * Get comprehensive student course report
     * GET /api/course/student/me - for authenticated student
     * GET /api/course/student/{student_id} - for admin access
     */
    public static readonly getStudentCourseReport = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const authenticated_user_id = ctx.get("user_id");
            const user_role = ctx.get("user_type");
            
            // Get student_id from params or use authenticated user
            const { student_id } = ctx.req.param();
            const target_student_id = student_id || authenticated_user_id;
            
            // Permission check: students can only access their own data
            if (student_id && student_id !== authenticated_user_id && !["admin", "teacher", "principal"].includes(user_role)) {
                return ctx.json({
                    success: false,
                    message: "Access denied. You can only view your own course data."
                }, 403);
            }
            
            // Get query parameters for filtering
            const { course_id, include_analytics, include_progress, include_grades } = ctx.req.query();
            
            const report = await StudentCoursesService.getStudentCourseReport(
                campus_id,
                target_student_id,
                {
                    course_id,
                    include_analytics: include_analytics === "true",
                    include_progress: include_progress === "true", 
                    include_grades: include_grades === "true"
                }
            );
            
            return ctx.json({
                success: true,
                data: report,
                message: "Student course report retrieved successfully"
            });
            
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve student course report"
            }, 500);
        }
    };
    
    /**
     * Get courses with various filters for students
     * GET /api/courses/ - all available courses
     * GET /api/courses/?available - courses student can enroll in
     * GET /api/courses/?enrolled - courses student is enrolled in
     * GET /api/courses/?in_progress - courses currently being taken
     * GET /api/courses/?completed - completed courses
     */
    public static readonly getStudentCourses = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            
            // Get filter parameters
            const { 
                available, 
                enrolled, 
                in_progress, 
                completed, 
                category,
                search,
                page = "1",
                limit = "10"
            } = ctx.req.query();
            
            // Determine filter type
            let filterType: "all" | "available" | "enrolled" | "in_progress" | "completed" = "all";
            if (available !== undefined) filterType = "available";
            else if (enrolled !== undefined) filterType = "enrolled";
            else if (in_progress !== undefined) filterType = "in_progress";
            else if (completed !== undefined) filterType = "completed";
            
            const courses = await StudentCoursesService.getFilteredCourses(
                campus_id,
                user_id,
                {
                    filter_type: filterType,
                    category,
                    search,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            );
            
            return ctx.json({
                success: true,
                data: courses,
                message: `${filterType.replace("_", " ")} courses retrieved successfully`
            });
            
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve courses"
            }, 500);
        }
    };
    
    /**
     * Get student's course dashboard summary
     * GET /api/course/student/dashboard
     */
    public static readonly getStudentDashboard = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            
            const dashboard = await StudentCoursesService.getStudentDashboard(
                campus_id,
                user_id
            );
            
            return ctx.json({
                success: true,
                data: dashboard,
                message: "Student dashboard retrieved successfully"
            });
            
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve dashboard"
            }, 500);
        }
    };
    
    /**
     * Quick enroll in a course
     * POST /api/courses/{course_id}/enroll
     */
    public static readonly quickEnrollInCourse = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            
            // Default enrollment data for quick enrollment
            const enrollmentData = {
                enrollment_date: new Date(),
                is_completed: false,
                is_graded: false,
                grade_data: [],
                overall_grade: 0,
                meta_data: {
                    enrollment_type: "self_enrolled",
                    enrollment_method: "quick_enroll"
                }
            };
            
            const enrollment = await CourseService.enrollInCourse(
                campus_id,
                course_id,
                user_id,
                enrollmentData
            );
            
            return ctx.json({
                success: true,
                data: enrollment,
                message: "Successfully enrolled in course"
            });
            
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to enroll in course"
            }, 500);
        }
    };
}
