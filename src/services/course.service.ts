import { nanoid } from "napi-nanoid";

import { Course, ICourseData } from "@/models/course.model";
import { CourseCertificate } from "@/models/course_certificate.model";
import { CourseEnrollment, ICourseEnrollmentData } from "@/models/course_enrollment.model";
import { CourseLecture, ICourseLectureData } from "@/models/course_lecture.model";
import { CourseProgress, ICourseProgressData } from "@/models/course_progress.model";
import { CourseSection, ICourseSectionData } from "@/models/course_section.model";
import { User } from "@/models/user.model";

export class CourseService {
    // ==================== HELPER METHODS ====================

    /**
     * Find course by ID - using find instead of findById for better compatibility
     */
    private static async findCourseById(course_id: string, campus_id?: string): Promise<ICourseData | null> {
        try {
            const query: { id: string; campus_id?: string } = { id: course_id };
            if (campus_id) {
                query.campus_id = campus_id;
            }

            const result = await Course.find(query);
            return result.rows && result.rows.length > 0 ? result.rows[0] : null;
        } catch {
            // Error finding course by ID
            return null;
        }
    }

    /**
     * Update course by ID - using find and replace for better compatibility
     */
    private static async updateCourseById(
        course_id: string,
        updateData: Partial<ICourseData>,
        campus_id?: string
    ): Promise<ICourseData | null> {
        const query: { id: string; campus_id?: string } = { id: course_id };
        if (campus_id) {
            query.campus_id = campus_id;
        }

        const existingResult = await Course.find(query);
        if (!existingResult.rows || existingResult.rows.length === 0) {
            throw new Error("Course not found for update");
        }

        const existing = existingResult.rows[0];
        const updated = { ...existing, ...updateData };

        // Use replaceById for Ottoman compatibility
        return await Course.replaceById(course_id, updated);
    }

    // ==================== COURSE MANAGEMENT ====================

    /**
     * Create a new course
     */
    static async createCourse(campus_id: string, created_by: string, courseData: Partial<ICourseData>) {
        try {
            // Sync prerequisites and requirements fields
            if (courseData.prerequisites && !courseData.requirements) {
                courseData.requirements = courseData.prerequisites;
            } else if (courseData.requirements && !courseData.prerequisites) {
                courseData.prerequisites = courseData.requirements;
            }

            const course = await Course.create({
                id: nanoid(),
                campus_id,
                created_by,
                last_updated_by: created_by,
                status: "draft",
                rating: 0,
                rating_count: 0,
                enrollment_count: 0,
                completion_count: 0,
                version: 1,
                ...courseData,
                created_at: new Date(),
                updated_at: new Date(),
            });

            return {
                success: true,
                data: course,
                message: "Course created successfully",
            };
        } catch (error) {
            throw new Error(`Failed to create course: ${error}`);
        }
    }

    /**
     * Get courses with advanced filtering and pagination
     */
    static async getCourses(
        campus_id: string,
        filters: {
            page?: number;
            limit?: number;
            status?: string;
            category?: string;
            difficulty_level?: string;
            price_range?: string;
            search_query?: string;
            instructor_id?: string;
            class_id?: string;
            is_featured?: boolean;
            sort_by?: string;
            sort_order?: "asc" | "desc";
        } = {}
    ) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                category,
                difficulty_level,
                price_range,
                search_query,
                instructor_id,
                class_id,
                is_featured,
                sort_by = "created_at",
                sort_order = "desc",
            } = filters;

            // Pagination
            const skip = (page - 1) * limit;

            // Get all courses for campus first, then apply filters in JavaScript
            const allCoursesQuery = await Course.find({ campus_id });
            let courses = allCoursesQuery.rows;

            // Apply filters in JavaScript for better compatibility
            if (status) {
                courses = courses.filter((course) => course.status === status);
            }
            if (category) {
                courses = courses.filter((course) => course.category === category);
            }
            if (difficulty_level) {
                courses = courses.filter((course) => course.difficulty_level === difficulty_level);
            }
            if (class_id) {
                courses = courses.filter((course) => course.class_id === class_id);
            }
            if (is_featured !== undefined) {
                courses = courses.filter((course) => course.is_featured === is_featured);
            }
            if (instructor_id) {
                courses = courses.filter(
                    (course) => course.instructor_ids && course.instructor_ids.includes(instructor_id)
                );
            }

            // Price range filter
            if (price_range) {
                const [min, max] = price_range.split("-").map(Number);
                if (!isNaN(min) && !isNaN(max)) {
                    courses = courses.filter((course) => course.price >= min && course.price <= max);
                } else if (price_range === "free") {
                    courses = courses.filter((course) => course.price === 0);
                } else if (price_range === "paid") {
                    courses = courses.filter((course) => course.price > 0);
                }
            }

            // Search functionality
            if (search_query) {
                const searchRegex = new RegExp(search_query, "i");
                courses = courses.filter(
                    (course) =>
                        searchRegex.test(course.title) ||
                        searchRegex.test(course.description) ||
                        (course.tags && course.tags.some((tag) => searchRegex.test(tag)))
                );
            }

            const totalCourses = courses.length;

            // Sort courses
            courses.sort((a, b) => {
                let aValue = a[sort_by];
                let bValue = b[sort_by];

                if (sort_by === "created_at" || sort_by === "updated_at") {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                }

                if (sort_order === "asc") {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            // Apply pagination
            const paginatedCourses = courses.slice(skip, skip + limit);

            // Ensure prerequisites field is populated for backward compatibility
            const coursesWithPrerequisites = paginatedCourses.map(course => ({
                ...course,
                prerequisites: course.prerequisites || course.requirements || [],
            }));

            // Get course statistics
            const stats = await this.getCourseStatistics(campus_id);

            return {
                success: true,
                data: {
                    courses: coursesWithPrerequisites,
                    pagination: {
                        current_page: page,
                        per_page: limit,
                        total_items: totalCourses,
                        total_pages: Math.ceil(totalCourses / limit),
                        has_next: page < Math.ceil(totalCourses / limit),
                        has_previous: page > 1,
                    },
                    filters_applied: {
                        status,
                        category,
                        difficulty_level,
                        price_range,
                        search_query,
                    },
                    summary: stats,
                },
                message: "Courses retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get courses: ${error}`);
        }
    }

    /**
     * Get course statistics
     */
    static async getCourseStatistics(campus_id: string) {
        try {
            const allCourses = await Course.find({ campus_id });
            const courses = allCourses.rows;

            return {
                total_courses: courses.length,
                published_courses: courses.filter((c) => c.status === "published").length,
                draft_courses: courses.filter((c) => c.status === "draft").length,
                featured_courses: courses.filter((c) => c.is_featured).length,
                free_courses: courses.filter((c) => c.price === 0).length,
                paid_courses: courses.filter((c) => c.price > 0).length,
            };
        } catch (error) {
            throw new Error(`Failed to get course statistics: ${error}`);
        }
    }

    /**
     * Get course by ID with detailed information
     * Returns ONLY course data - no enrollment information
     */
    static async getCourseById(course_id: string, campus_id: string) {
        try {
            // Use find with id filter instead of findById for better compatibility with different ID formats
            const courseResults = await Course.find({
                id: course_id,
                campus_id,
            });
            if (!courseResults.rows || courseResults.rows.length === 0) {
                throw new Error("Course not found");
            }

            const courseResult = courseResults.rows[0];

            // Get course sections and lectures
            const sectionsResult = await CourseSection.find({
                course_id,
                campus_id,
                is_published: true,
            });

            const sections = sectionsResult.rows.sort((a, b) => a.section_order - b.section_order);

            // Get lectures for each section
            const sectionsWithLectures = await Promise.all(
                sections.map(async (section) => {
                    const lecturesResult = await CourseLecture.find({
                        section_id: section.id,
                        is_published: true,
                    });

                    const lectures = lecturesResult.rows.sort((a, b) => a.lecture_order - b.lecture_order);

                    // Return lectures without any user progress - keep course data clean
                    return {
                        ...section,
                        lectures: lectures,
                        lecture_count: lectures.length,
                        total_duration_minutes: lectures.reduce(
                            (sum, lecture) => sum + lecture.estimated_duration_minutes,
                            0
                        ),
                    };
                })
            );

            // Get instructor details
            const instructorDetails = await Promise.all(
                courseResult.instructor_ids.map(async (instructor_id) => {
                    try {
                        const userResults = await User.find({
                            id: instructor_id,
                        });
                        const userResult = userResults.rows && userResults.rows.length > 0 ? userResults.rows[0] : null;
                        return userResult
                            ? {
                                  id: userResult.id,
                                  name: `${userResult.first_name} ${userResult.last_name}`,
                                  email: userResult.email,
                                  profile_image: userResult.meta_data?.profile_image,
                              }
                            : null;
                    } catch {
                        return null;
                    }
                })
            );

            return {
                success: true,
                data: {
                    ...courseResult,
                    prerequisites: courseResult.prerequisites || courseResult.requirements || [],
                    sections: sectionsWithLectures,
                    total_sections: sections.length,
                    total_lectures: sectionsWithLectures.reduce((sum, section) => sum + section.lectures.length, 0),
                    total_duration_minutes: sectionsWithLectures.reduce(
                        (sum, section) => sum + section.total_duration_minutes,
                        0
                    ),
                    instructors: instructorDetails.filter(Boolean),
                    // REMOVED: enrollment_info - keep course and enrollment data separate
                },
                message: "Course retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get course: ${error}`);
        }
    }

    /**
     * Update course
     */
    static async updateCourse(course_id: string, campus_id: string, user_id: string, updateData: Partial<ICourseData>) {
        try {
            const existingCourse = await this.findCourseById(course_id, campus_id);
            if (!existingCourse) {
                throw new Error("Course not found");
            }

            // Sync prerequisites and requirements fields
            if (updateData.prerequisites && !updateData.requirements) {
                updateData.requirements = updateData.prerequisites;
            } else if (updateData.requirements && !updateData.prerequisites) {
                updateData.prerequisites = updateData.requirements;
            }

            const updatedCourse = await this.updateCourseById(
                course_id,
                {
                    ...updateData,
                    last_updated_by: user_id,
                    version: existingCourse.version + 1,
                    updated_at: new Date(),
                },
                campus_id
            );

            return {
                success: true,
                data: updatedCourse,
                message: "Course updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update course: ${error}`);
        }
    }

    /**
     * Publish course
     */
    static async publishCourse(course_id: string, campus_id: string, user_id: string) {
        try {
            const course = await this.findCourseById(course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Validate course has required content before publishing
            const sectionsResult = await CourseSection.find({
                course_id,
                is_published: true,
            });
            if (sectionsResult.rows.length === 0) {
                throw new Error("Course must have at least one published section to be published");
            }

            const lecturesResult = await CourseLecture.find({
                course_id,
                is_published: true,
            });
            if (lecturesResult.rows.length === 0) {
                throw new Error("Course must have at least one published lecture to be published");
            }

            const updatedCourse = await this.updateCourseById(
                course_id,
                {
                    status: "published",
                    last_updated_by: user_id,
                    updated_at: new Date(),
                },
                campus_id
            );

            return {
                success: true,
                data: updatedCourse,
                message: "Course published successfully",
            };
        } catch (error) {
            throw new Error(`Failed to publish course: ${error}`);
        }
    }

    /**
     * Delete course (soft delete by archiving)
     */
    static async deleteCourse(course_id: string, campus_id: string, user_id: string) {
        try {
            const course = await this.findCourseById(course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Check if course has active enrollments
            const enrollmentsResult = await CourseEnrollment.find({
                course_id,
                enrollment_status: "active",
            });

            if (enrollmentsResult.rows.length > 0) {
                throw new Error("Cannot delete course with active enrollments. Archive it instead.");
            }

            await this.updateCourseById(
                course_id,
                {
                    status: "archived",
                    last_updated_by: user_id,
                    updated_at: new Date(),
                },
                campus_id
            );

            return {
                success: true,
                message: "Course archived successfully",
            };
        } catch (error) {
            throw new Error(`Failed to delete course: ${error}`);
        }
    }

    // ==================== SECTION MANAGEMENT ====================

    /**
     * Create course section
     */
    static async createCourseSection(course_id: string, campus_id: string, sectionData: Partial<ICourseSectionData>) {
        try {
            // Verify course exists
            const course = await this.findCourseById(course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            const section = await CourseSection.create({
                id: nanoid(),
                course_id,
                campus_id,
                ...sectionData,
                created_at: new Date(),
                updated_at: new Date(),
            });

            return {
                success: true,
                data: section,
                message: "Course section created successfully",
            };
        } catch (error) {
            throw new Error(`Failed to create course section: ${error}`);
        }
    }

    /**
     * Get section by ID with detailed information
     */
    static async getSectionById(section_id: string, campus_id: string, user_id?: string) {
        try {
            // Get section details
            const sectionResult = await CourseSection.find({
                id: section_id,
                campus_id,
            });

            if (!sectionResult.rows || sectionResult.rows.length === 0) {
                throw new Error("Section not found");
            }

            const section = sectionResult.rows[0];

            // Get course details to verify access
            const course = await this.findCourseById(section.course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Get lectures for this section
            const lecturesResult = await CourseLecture.find({
                section_id: section.id,
                is_published: true,
            });

            const lectures = lecturesResult.rows.sort((a, b) => a.lecture_order - b.lecture_order);

            // If user is provided, get their progress for each lecture
            let lecturesWithProgress = lectures;
            if (user_id) {
                lecturesWithProgress = await Promise.all(
                    lectures.map(async (lecture) => {
                        const progressResult = await CourseProgress.find({
                            user_id,
                            lecture_id: lecture.id,
                        });

                        const progress = progressResult.rows[0];
                        return {
                            ...lecture,
                            user_progress: progress
                                ? {
                                      progress_status: progress.progress_status,
                                      completion_percentage: progress.completion_percentage,
                                      last_accessed_at: progress.last_accessed_at,
                                      resume_position_seconds: progress.resume_position_seconds,
                                  }
                                : null,
                        };
                    })
                );
            }

            return {
                success: true,
                data: {
                    ...section,
                    course_details: {
                        id: course.id,
                        title: course.title,
                        status: course.status,
                    },
                    lectures: lecturesWithProgress,
                    lecture_count: lectures.length,
                    total_duration_minutes: lectures.reduce(
                        (sum, lecture) => sum + lecture.estimated_duration_minutes,
                        0
                    ),
                },
                message: "Section retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get section: ${error}`);
        }
    }

    /**
     * Update course section
     */
    static async updateCourseSection(
        section_id: string,
        campus_id: string,
        user_id: string,
        updateData: Partial<ICourseSectionData>
    ) {
        try {
            // Get existing section
            const sectionResult = await CourseSection.find({
                id: section_id,
                campus_id,
            });

            if (!sectionResult.rows || sectionResult.rows.length === 0) {
                throw new Error("Section not found");
            }

            const existingSection = sectionResult.rows[0];

            // Verify course exists and user has permission
            const course = await this.findCourseById(existingSection.course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Update section
            const updatedSection = await CourseSection.updateById(section_id, {
                ...updateData,
                updated_at: new Date(),
            });

            return {
                success: true,
                data: updatedSection,
                message: "Section updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update section: ${error}`);
        }
    }

    /**
     * Delete course section (soft delete by archiving)
     */
    static async deleteCourseSection(section_id: string, campus_id: string, _user_id: string) {
        try {
            // Get existing section
            const sectionResult = await CourseSection.find({
                id: section_id,
                campus_id,
            });

            if (!sectionResult.rows || sectionResult.rows.length === 0) {
                throw new Error("Section not found");
            }

            const section = sectionResult.rows[0];

            // Verify course exists
            const course = await this.findCourseById(section.course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Check if section has lectures
            const lecturesResult = await CourseLecture.find({
                section_id: section.id,
            });

            if (lecturesResult.rows.length > 0) {
                // Archive all lectures in this section first
                const archiveLecturePromises = lecturesResult.rows.map((lecture) =>
                    CourseLecture.updateById(lecture.id, {
                        is_published: false,
                        is_archived: true,
                        updated_at: new Date(),
                    })
                );

                await Promise.all(archiveLecturePromises);
            }

            // Archive the section
            await CourseSection.updateById(section_id, {
                is_published: false,
                is_archived: true,
                updated_at: new Date(),
            });

            return {
                success: true,
                message: "Section archived successfully",
            };
        } catch (error) {
            throw new Error(`Failed to delete section: ${error}`);
        }
    }

    /**
     * Update section order
     */
    static async updateSectionOrder(
        course_id: string,
        campus_id: string,
        sectionOrders: Array<{ id: string; section_order: number }>
    ) {
        try {
            const updatePromises = sectionOrders.map(({ id, section_order }) =>
                CourseSection.updateById(id, {
                    section_order,
                    updated_at: new Date(),
                })
            );

            await Promise.all(updatePromises);

            return {
                success: true,
                message: "Section order updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update section order: ${error}`);
        }
    }

    // ==================== LECTURE MANAGEMENT ====================

    /**
     * Get lecture by ID with detailed information
     */
    static async getLectureById(lecture_id: string, campus_id: string, user_id?: string) {
        try {
            // Get lecture details
            const lectureResult = await CourseLecture.find({
                id: lecture_id,
                campus_id,
            });

            if (!lectureResult.rows || lectureResult.rows.length === 0) {
                throw new Error("Lecture not found");
            }

            const lecture = lectureResult.rows[0];

            // Get section details
            const sectionResult = await CourseSection.find({
                id: lecture.section_id,
            });

            const section = sectionResult.rows[0];

            // Get course details
            const course = await this.findCourseById(lecture.course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Get user progress if user is provided
            let userProgress: ICourseProgressData | null = null;
            if (user_id) {
                const progressResult = await CourseProgress.find({
                    user_id,
                    lecture_id: lecture.id,
                });

                const progress = progressResult.rows[0];
                userProgress = progress
                    ? ({
                          progress_status: progress.progress_status,
                          completion_percentage: progress.completion_percentage,
                          last_accessed_at: progress.last_accessed_at,
                          resume_position_seconds: progress.resume_position_seconds,
                          watch_time_seconds: progress.watch_time_seconds,
                          notes: progress.notes,
                          interaction_data: progress.interaction_data,
                      } as unknown as ICourseProgressData)
                    : null;
            }

            return {
                success: true,
                data: {
                    ...lecture,
                    course_details: {
                        id: course.id,
                        title: course.title,
                        status: course.status,
                    },
                    section_details: section
                        ? {
                              id: section.id,
                              title: section.title,
                              section_order: section.section_order,
                          }
                        : null,
                    user_progress: userProgress,
                },
                message: "Lecture retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get lecture: ${error}`);
        }
    }

    /**
     * Update course lecture
     */
    static async updateCourseLecture(
        lecture_id: string,
        campus_id: string,
        user_id: string,
        updateData: Partial<ICourseLectureData>
    ) {
        try {
            // Get existing lecture
            const lectureResult = await CourseLecture.find({
                id: lecture_id,
                campus_id,
            });

            if (!lectureResult.rows || lectureResult.rows.length === 0) {
                throw new Error("Lecture not found");
            }

            const existingLecture = lectureResult.rows[0];

            // Verify course exists and user has permission
            const course = await this.findCourseById(existingLecture.course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Update lecture
            const updatedLecture = await CourseLecture.updateById(lecture_id, {
                ...updateData,
                updated_at: new Date(),
            });

            return {
                success: true,
                data: updatedLecture,
                message: "Lecture updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update lecture: ${error}`);
        }
    }

    /**
     * Delete course lecture (soft delete by archiving)
     */
    static async deleteCourseLecture(lecture_id: string, campus_id: string, _user_id: string) {
        try {
            // Get existing lecture
            const lectureResult = await CourseLecture.find({
                id: lecture_id,
                campus_id,
            });

            if (!lectureResult.rows || lectureResult.rows.length === 0) {
                throw new Error("Lecture not found");
            }

            const lecture = lectureResult.rows[0];

            // Verify course exists
            const course = await this.findCourseById(lecture.course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Check if there are any user progress records for this lecture
            const progressResult = await CourseProgress.find({
                lecture_id: lecture.id,
            });

            if (progressResult.rows.length > 0) {
                // Don't actually delete if users have progress, just archive
                await CourseLecture.updateById(lecture_id, {
                    is_published: false,
                    is_archived: true,
                    updated_at: new Date(),
                });
            } else {
                // Can safely archive since no user progress exists
                await CourseLecture.updateById(lecture_id, {
                    is_published: false,
                    is_archived: true,
                    updated_at: new Date(),
                });
            }

            return {
                success: true,
                message: "Lecture archived successfully",
            };
        } catch (error) {
            throw new Error(`Failed to delete lecture: ${error}`);
        }
    }

    /**
     * Create course lecture
     */
    static async createCourseLecture(section_id: string, campus_id: string, lectureData: Partial<ICourseLectureData>) {
        try {
            // Verify section exists
            const section = await CourseSection.findById(section_id);
            if (!section || section.campus_id !== campus_id) {
                throw new Error("Course section not found");
            }

            const lecture = await CourseLecture.create({
                id: nanoid(),
                course_id: section.course_id,
                section_id,
                campus_id,
                ...lectureData,
                created_at: new Date(),
                updated_at: new Date(),
            });

            return {
                success: true,
                data: lecture,
                message: "Course lecture created successfully",
            };
        } catch (error) {
            throw new Error(`Failed to create course lecture: ${error}`);
        }
    }

    /**
     * Update lecture order within section
     */
    static async updateLectureOrder(
        section_id: string,
        campus_id: string,
        lectureOrders: Array<{ id: string; lecture_order: number }>
    ) {
        try {
            const updatePromises = lectureOrders.map(({ id, lecture_order }) =>
                CourseLecture.updateById(id, {
                    lecture_order,
                    updated_at: new Date(),
                })
            );

            await Promise.all(updatePromises);

            return {
                success: true,
                message: "Lecture order updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update lecture order: ${error}`);
        }
    }

    // ==================== ENROLLMENT MANAGEMENT ====================

    /**
     * Enroll user in course
     */
    static async enrollInCourse(
        course_id: string,
        user_id: string,
        campus_id: string,
        enrollmentData: Partial<ICourseEnrollmentData> = {}
    ) {
        try {
            // Check if course exists and is published
            const course = await this.findCourseById(course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            if (course.status !== "published") {
                throw new Error("Can only enroll in published courses");
            }

            // Check if user is already enrolled
            const existingEnrollment = await CourseEnrollment.find({
                course_id,
                user_id,
            });

            if (existingEnrollment.rows.length > 0) {
                throw new Error("User is already enrolled in this course");
            }

            // Check enrollment limits
            if (course.max_enrollments) {
                const currentEnrollments = await CourseEnrollment.find({
                    course_id,
                    enrollment_status: { $in: ["active", "completed"] },
                });

                if (currentEnrollments.rows.length >= course.max_enrollments) {
                    throw new Error("Course enrollment limit reached");
                }
            }

            // Check enrollment dates
            const now = new Date();
            if (course.enrollment_start_date && now < new Date(course.enrollment_start_date)) {
                throw new Error("Enrollment has not started yet");
            }
            if (course.enrollment_end_date && now > new Date(course.enrollment_end_date)) {
                throw new Error("Enrollment period has ended");
            }

            // Get total lectures count
            const lecturesResult = await CourseLecture.find({
                course_id,
                is_published: true,
            });
            const totalLectures = lecturesResult.rows.length;

            // Create enrollment
            const enrollment = await CourseEnrollment.create({
                id: nanoid(),
                course_id,
                user_id,
                campus_id,
                enrollment_type: enrollmentData.enrollment_type || "free",
                enrollment_status: "active",
                progress_percentage: 0,
                enrollment_date: now,
                payment_status: course.price > 0 ? "pending" : "completed",
                certificate_issued: false,
                access_details: {
                    total_lectures: totalLectures,
                    completed_lectures: 0,
                    completed_lecture_ids: [],
                    bookmarked_lectures: [],
                    notes_count: 0,
                    quiz_attempts: 0,
                    assignment_submissions: 0,
                },
                enrollment_source: enrollmentData.enrollment_source || "web",
                meta_data: enrollmentData.meta_data || {},
                created_at: now,
                updated_at: now,
            });

            // Update course enrollment count
            await this.updateCourseById(course_id, {
                enrollment_count: course.enrollment_count + 1,
                updated_at: now,
            });

            return {
                success: true,
                data: enrollment,
                message: "Successfully enrolled in course",
            };
        } catch (error) {
            throw new Error(`Failed to enroll in course: ${error}`);
        }
    }

    /**
     * Get user's enrollment for a specific course
     */
    static async getUserCourseEnrollment(course_id: string, user_id: string, campus_id: string) {
        try {
            // Check if course exists
            const course = await this.findCourseById(course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Find user's enrollment
            const enrollmentResult = await CourseEnrollment.find({
                course_id,
                user_id,
                campus_id,
            });

            if (!enrollmentResult.rows || enrollmentResult.rows.length === 0) {
                throw new Error("User is not enrolled in this course");
            }

            const enrollment = enrollmentResult.rows[0];

            // Get total lectures and completed count for progress calculation
            const lecturesResult = await CourseLecture.find({
                course_id,
                is_published: true,
            });
            const totalLectures = lecturesResult.rows.length;

            // Calculate time remaining based on watch progress
            const progressResult = await CourseProgress.find({
                course_id,
                user_id,
            });
            const totalWatchTime = progressResult.rows.reduce((sum, p) => sum + p.watch_time_seconds, 0);
            const estimatedRemainingHours =
                course && course.estimated_duration_hours
                    ? Math.max(0, course.estimated_duration_hours - totalWatchTime / 3600)
                    : 0;

            return {
                success: true,
                data: {
                    ...enrollment,
                    course_details: {
                        id: course.id,
                        title: course.title,
                        thumbnail: course.thumbnail,
                        category: course.category,
                        difficulty_level: course.difficulty_level,
                        estimated_duration_hours: course.estimated_duration_hours,
                        rating: course.rating,
                    },
                    progress_details: {
                        total_lectures: totalLectures,
                        completed_lectures: enrollment.access_details?.completed_lectures || 0,
                        time_remaining_hours: estimatedRemainingHours,
                        total_watch_time_hours: totalWatchTime / 3600,
                    },
                },
                message: "Course enrollment retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get course enrollment: ${error}`);
        }
    }

    /**
     * Get user's enrolled courses
     */
    static async getUserEnrolledCourses(
        user_id: string,
        campus_id: string,
        filters: {
            status?: string;
            progress?: string;
            page?: number;
            limit?: number;
        } = {}
    ) {
        try {
            const { status, progress, page = 1, limit = 20 } = filters;

            // Build query conditions
            const queryConditions: { user_id: string; campus_id: string; enrollment_status?: string } = { user_id, campus_id };
            if (status) {
                queryConditions.enrollment_status = status;
            }

            const enrollmentsResult = await CourseEnrollment.find(queryConditions);
            let enrollments = enrollmentsResult.rows;

            // Filter by progress if specified
            if (progress) {
                switch (progress) {
                    case "not_started": {
                        enrollments = enrollments.filter((e) => e.progress_percentage === 0);

                        break;
                    }
                    case "in_progress": {
                        enrollments = enrollments.filter(
                            (e) => e.progress_percentage > 0 && e.progress_percentage < 100
                        );

                        break;
                    }
                    case "completed": {
                        enrollments = enrollments.filter((e) => e.progress_percentage === 100);

                        break;
                    }
                    // No default
                }
            }

            // Pagination
            const skip = (page - 1) * limit;
            const paginatedEnrollments = enrollments.slice(skip, skip + limit);

            // Get course details for each enrollment
            const enrollmentsWithCourses = await Promise.all(
                paginatedEnrollments.map(async (enrollment) => {
                    const course = await this.findCourseById(enrollment.course_id);

                    // Get total lectures and completed count for progress calculation
                    const lecturesResult = await CourseLecture.find({
                        course_id: enrollment.course_id,
                        is_published: true,
                    });
                    const totalLectures = lecturesResult.rows.length;

                    // Calculate time remaining based on watch progress
                    const progressResult = await CourseProgress.find({
                        course_id: enrollment.course_id,
                        user_id: enrollment.user_id,
                    });
                    const totalWatchTime = progressResult.rows.reduce((sum, p) => sum + p.watch_time_seconds, 0);
                    const estimatedRemainingHours =
                        course && course.estimated_duration_hours
                            ? Math.max(0, course.estimated_duration_hours - totalWatchTime / 3600)
                            : 0;

                    return {
                        ...enrollment,
                        course_details: course
                            ? {
                                  title: course.title,
                                  thumbnail: course.thumbnail,
                                  category: course.category,
                                  difficulty_level: course.difficulty_level,
                                  estimated_duration_hours: course.estimated_duration_hours,
                                  rating: course.rating,
                                  total_lectures: totalLectures,
                                  completed_lectures: enrollment.access_details?.completed_lectures || 0,
                                  time_remaining_hours: estimatedRemainingHours,
                                  last_updated: course.updated_at,
                              }
                            : null,
                    };
                })
            );
            return {
                success: true,
                data: {
                    enrollments: enrollmentsWithCourses,
                    pagination: {
                        current_page: page,
                        per_page: limit,
                        total_items: enrollments.length,
                        total_pages: Math.ceil(enrollments.length / limit),
                        has_next: page < Math.ceil(enrollments.length / limit),
                        has_previous: page > 1,
                    },
                },
                message: "Enrolled courses retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get enrolled courses: ${error}`);
        }
    }

    /**
     * Update course progress
     */
    static async updateCourseProgress(
        course_id: string,
        lecture_id: string,
        user_id: string,
        campus_id: string,
        progressData: Partial<ICourseProgressData>
    ) {
        try {
            // Check if user is enrolled
            const enrollmentResult = await CourseEnrollment.find({
                course_id,
                user_id,
                enrollment_status: "active",
            });

            if (enrollmentResult.rows.length === 0) {
                throw new Error("User is not enrolled in this course");
            }

            // Get or create progress record
            const existingProgressResult = await CourseProgress.find({
                user_id,
                lecture_id,
            });

            let progress;
            const now = new Date();

            if (existingProgressResult.rows.length === 0) {
                // Create new progress record
                progress = await CourseProgress.create({
                    id: nanoid(),
                    course_id,
                    user_id,
                    lecture_id,
                    campus_id,
                    progress_status: "not_started",
                    watch_time_seconds: 0,
                    total_duration_seconds: 0,
                    completion_percentage: 0,
                    first_accessed_at: now,
                    last_accessed_at: now,
                    interaction_data: {
                        play_count: 0,
                        pause_count: 0,
                        seek_count: 0,
                        speed_changes: 0,
                        quality_changes: 0,
                        fullscreen_toggles: 0,
                        notes_taken: 0,
                        bookmarked: false,
                        liked: false,
                    },
                    notes: [],
                    device_info: {
                        device_type: "web",
                    },
                    meta_data: {},
                    created_at: now,
                    updated_at: now,
                    ...progressData,
                });
            } else {
                // Update existing progress
                const existingProgress = existingProgressResult.rows[0];
                progress = await CourseProgress.updateById(existingProgress.id, {
                    ...progressData,
                    last_accessed_at: now,
                    updated_at: now,
                });
            }

            // Update enrollment progress if lecture is completed
            if (progressData.progress_status === "completed") {
                await this.updateEnrollmentProgress(course_id, user_id);
            }

            return {
                success: true,
                data: progress,
                message: "Progress updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update progress: ${error}`);
        }
    }

    /**
     * Update overall enrollment progress
     */
    private static async updateEnrollmentProgress(course_id: string, user_id: string) {
        try {
            // Get all lectures in the course
            const lecturesResult = await CourseLecture.find({
                course_id,
                is_published: true,
                is_mandatory: true,
            });
            const totalMandatoryLectures = lecturesResult.rows.length;

            // Get completed lectures
            const completedProgressResult = await CourseProgress.find({
                course_id,
                user_id,
                progress_status: "completed",
            });
            const completedLectures = completedProgressResult.rows.length;

            // Calculate progress percentage
            const progressPercentage =
                totalMandatoryLectures > 0 ? Math.round((completedLectures / totalMandatoryLectures) * 100) : 0;

            // Determine enrollment status
            let enrollmentStatus = "active";
            let completionDate: Date | null = null;

            if (progressPercentage >= 100) {
                enrollmentStatus = "completed";
                completionDate = new Date();
            }

            // Update enrollment
            const enrollment = await CourseEnrollment.find({
                course_id,
                user_id,
            });
            if (enrollment.rows.length > 0) {
                await CourseEnrollment.updateById(enrollment.rows[0].id, {
                    progress_percentage: progressPercentage,
                    enrollment_status: enrollmentStatus,
                    completion_date: completionDate,
                    access_details: {
                        ...enrollment.rows[0].access_details,
                        completed_lectures: completedLectures,
                        completed_lecture_ids: completedProgressResult.rows.map((p) => p.lecture_id),
                    },
                    updated_at: new Date(),
                });

                // If course is completed, generate certificate if enabled
                if (progressPercentage >= 100) {
                    const course = await this.findCourseById(course_id);
                    if (course && course.is_certificate_enabled) {
                        await this.generateCourseCertificate(course_id, user_id, enrollment.rows[0].id);
                    }

                    // Update course completion count
                    if (course) {
                        await this.updateCourseById(course_id, {
                            completion_count: course.completion_count + 1,
                            updated_at: new Date(),
                        });
                    }
                }
            }
        } catch {
            // Failed to update enrollment progress
        }
    }

    /**
     * Generate course certificate
     */
    private static async generateCourseCertificate(course_id: string, user_id: string, enrollment_id: string) {
        const course = await this.findCourseById(course_id);
            // Note: User and CourseEnrollment may also need similar fixes if they have ID format issues
            const userResult = await User.find({ id: user_id });
            const user = userResult.rows && userResult.rows.length > 0 ? userResult.rows[0] : null;

            const enrollmentResult = await CourseEnrollment.find({
                id: enrollment_id,
            });
            const enrollment =
                enrollmentResult.rows && enrollmentResult.rows.length > 0 ? enrollmentResult.rows[0] : null;

            if (!course || !user || !enrollment) {
                throw new Error("Missing required data for certificate generation");
            }

            const certificateNumber = `CERT-${course.campus_id}-${course_id.slice(0, 8)}-${user_id.slice(0, 8)}-${Date.now()}`;
            const verificationCode = nanoid().slice(0, 16).toUpperCase();

            const certificate = await CourseCertificate.create({
                id: nanoid(),
                course_id,
                user_id,
                enrollment_id,
                campus_id: course.campus_id,
                certificate_number: certificateNumber,
                certificate_type: "completion",
                status: "generated",
                issue_date: new Date(),
                grade: enrollment.grade,
                completion_time_hours: enrollment.completion_time_hours || 0,
                skills_acquired: course.learning_objectives,
                certificate_data: {
                    template_id: course.certificate_template_id || "default",
                    template_version: "1.0",
                    verification_url: `${process.env.FRONTEND_URL}/verify-certificate/${verificationCode}`,
                },
                verification_details: {
                    verification_code: verificationCode,
                    is_verifiable: true,
                    verification_link: `${process.env.FRONTEND_URL}/verify-certificate/${verificationCode}`,
                    issuer_details: {
                        institution_name: "KCS Learning Platform",
                        instructor_name: `${user.first_name} ${user.last_name}`,
                        instructor_credentials: "",
                    },
                },
                recipient_details: {
                    full_name: `${user.first_name} ${user.last_name}`,
                    email: user.email,
                    student_id: user.id,
                },
                course_details: {
                    course_title: course.title,
                    course_duration_hours: course.estimated_duration_hours || 0,
                    completion_percentage: 100,
                    skills_covered: course.learning_objectives,
                    learning_outcomes_achieved: course.learning_objectives,
                },
                delivery_status: {
                    email_sent: false,
                    download_count: 0,
                    shared_count: 0,
                },
                meta_data: {},
                created_at: new Date(),
                updated_at: new Date(),
            });

            // Update enrollment with certificate info
            await CourseEnrollment.updateById(enrollment_id, {
                certificate_issued: true,
                certificate_id: certificate.id,
                certificate_issued_at: new Date(),
                updated_at: new Date(),
            });

            return certificate;
    }

    /**
     * Get detailed course progress with lecture completion status (like Udemy)
     */
    static async getCourseProgressDetails(course_id: string, user_id: string, campus_id: string) {
        try {
            // Verify enrollment
            const enrollmentResult = await CourseEnrollment.find({
                course_id,
                user_id,
                campus_id,
            });

            if (enrollmentResult.rows.length === 0) {
                throw new Error("User is not enrolled in this course");
            }

            const enrollment = enrollmentResult.rows[0];
            const course = await this.findCourseById(course_id, campus_id);

            if (!course) {
                throw new Error("Course not found");
            }

            // Get sections with detailed progress
            const sectionsResult = await CourseSection.find({
                course_id,
                campus_id,
                is_published: true,
            });

            const sections = sectionsResult.rows.sort((a, b) => a.section_order - b.section_order);

            const sectionsWithProgress = await Promise.all(
                sections.map(async (section) => {
                    const lecturesResult = await CourseLecture.find({
                        section_id: section.id,
                        is_published: true,
                    });

                    const lectures = lecturesResult.rows.sort((a, b) => a.lecture_order - b.lecture_order);

                    const lecturesWithProgress = await Promise.all(
                        lectures.map(async (lecture) => {
                            const progressResult = await CourseProgress.find({
                                user_id,
                                lecture_id: lecture.id,
                            });

                            const progress = progressResult.rows[0];
                            const isCompleted = progress?.progress_status === "completed";
                            const watchPercentage = progress?.completion_percentage || 0;

                            return {
                                id: lecture.id,
                                title: lecture.title,
                                lecture_type: lecture.lecture_type,
                                estimated_duration_minutes: lecture.estimated_duration_minutes,
                                is_mandatory: lecture.is_mandatory,
                                is_preview: lecture.is_preview,
                                lecture_order: lecture.lecture_order,
                                resources_count: lecture.resources?.length || 0,
                                // Progress details (like Udemy)
                                is_completed: isCompleted,
                                watch_percentage: watchPercentage,
                                watch_time_seconds: progress?.watch_time_seconds || 0,
                                last_accessed_at: progress?.last_accessed_at,
                                resume_position_seconds: progress?.resume_position_seconds || 0,
                                is_bookmarked: progress?.interaction_data?.bookmarked || false,
                                notes_count: progress?.notes?.length || 0,
                                // Status indicators
                                status: isCompleted ? "completed" : watchPercentage > 0 ? "in_progress" : "not_started",
                            };
                        })
                    );

                    const sectionProgress = {
                        total_lectures: lectures.length,
                        completed_lectures: lecturesWithProgress.filter((l) => l.is_completed).length,
                        total_duration_minutes: lectures.reduce((sum, l) => sum + l.estimated_duration_minutes, 0),
                        watched_duration_minutes: Math.round(
                            lecturesWithProgress.reduce((sum, l) => sum + l.watch_time_seconds / 60, 0)
                        ),
                    };

                    return {
                        id: section.id,
                        title: section.title,
                        description: section.description,
                        section_order: section.section_order,
                        lectures: lecturesWithProgress,
                        progress: sectionProgress,
                        completion_percentage:
                            sectionProgress.total_lectures > 0
                                ? Math.round(
                                      (sectionProgress.completed_lectures / sectionProgress.total_lectures) * 100
                                  )
                                : 0,
                    };
                })
            );

            // Calculate overall progress
            const totalLectures = sectionsWithProgress.reduce((sum, s) => sum + s.progress.total_lectures, 0);
            const completedLectures = sectionsWithProgress.reduce((sum, s) => sum + s.progress.completed_lectures, 0);
            const totalWatchTime = sectionsWithProgress.reduce(
                (sum, s) => sum + s.progress.watched_duration_minutes,
                0
            );
            const estimatedTotalTime = sectionsWithProgress.reduce(
                (sum, s) => sum + s.progress.total_duration_minutes,
                0
            );

            return {
                success: true,
                data: {
                    course_info: {
                        id: course.id,
                        title: course.title,
                        description: course.description,
                        thumbnail: course.thumbnail,
                        category: course.category,
                        difficulty_level: course.difficulty_level,
                        rating: course.rating,
                        instructor_names: course.instructor_ids, // TODO: Get actual names
                        last_updated: course.updated_at,
                    },
                    enrollment_info: {
                        enrollment_date: enrollment.enrollment_date,
                        enrollment_status: enrollment.enrollment_status,
                        progress_percentage: enrollment.progress_percentage,
                        certificate_issued: enrollment.certificate_issued,
                        certificate_id: enrollment.certificate_id,
                    },
                    progress_summary: {
                        total_lectures: totalLectures,
                        completed_lectures: completedLectures,
                        completion_percentage:
                            totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0,
                        total_duration_minutes: estimatedTotalTime,
                        watched_duration_minutes: totalWatchTime,
                        estimated_remaining_minutes: Math.max(0, estimatedTotalTime - totalWatchTime),
                        time_to_completion: this.calculateTimeToCompletion(totalWatchTime, estimatedTotalTime),
                    },
                    sections: sectionsWithProgress,
                    next_lecture: this.findNextLecture(sectionsWithProgress),
                    bookmarked_lectures: sectionsWithProgress
                        .flatMap((s) => s.lectures)
                        .filter((l) => l.is_bookmarked)
                        .map((l) => ({
                            id: l.id,
                            title: l.title,
                            section_title: sectionsWithProgress.find((s) => s.lectures.includes(l))?.title,
                        })),
                },
                message: "Course progress details retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get course progress details: ${error}`);
        }
    }

    /**
     * Helper method to calculate estimated time to completion
     */
    private static calculateTimeToCompletion(watchedMinutes: number, totalMinutes: number) {
        if (totalMinutes === 0) {
            return "N/A";
        }

        const remainingMinutes = Math.max(0, totalMinutes - watchedMinutes);
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;

        if (hours === 0) {
            return `${minutes}min`;
        }
        if (minutes === 0) {
            return `${hours}hr`;
        }
        return `${hours}hr ${minutes}min`;
    }

    /**
     * Helper method to find next lecture to watch
     */
    private static findNextLecture(sections: Array<{ lectures: Array<{ progress_status?: string; id: string; title: string }> }>) {
        for (const section of sections) {
            for (const lecture of section.lectures) {
                const lec = lecture as unknown as { progress_status?: string; id: string; title: string; status?: string; resume_position_seconds?: number; estimated_duration_minutes?: number };
                if (lec.progress_status === "not_started" || lec.progress_status === "in_progress") {
                    const sec = section as unknown as { title?: string };
                    return {
                        lecture_id: lec.id,
                        lecture_title: lec.title,
                        section_title: sec.title || "Unknown Section",
                        resume_position_seconds: lec.resume_position_seconds || 0,
                        estimated_duration_minutes: lec.estimated_duration_minutes || 0,
                    };
                }
            }
        }
        return null; // All lectures completed
    }

    /**
     * Set learning schedule and reminders (like Udemy's schedule feature)
     */
    static async setLearningSchedule(
        user_id: string,
        course_id: string,
        scheduleData: {
            target_completion_date?: Date;
            daily_study_minutes?: number;
            study_days?: string[]; // ["monday", "tuesday", etc.]
            reminder_time?: string; // "19:00"
            timezone?: string;
            send_reminders?: boolean;
        }
    ) {
        try {
            // Verify enrollment
            const enrollmentResult = await CourseEnrollment.find({
                course_id,
                user_id,
            });

            if (enrollmentResult.rows.length === 0) {
                throw new Error("User is not enrolled in this course");
            }

            const enrollment = enrollmentResult.rows[0];
            const course = await this.findCourseById(course_id);

            // Calculate recommended schedule based on course duration
            let recommendedDailyMinutes = scheduleData.daily_study_minutes;
            if (!recommendedDailyMinutes && scheduleData.target_completion_date && course) {
                const daysUntilTarget = Math.ceil(
                    (new Date(scheduleData.target_completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const totalMinutesRemaining = (course.estimated_duration_hours || 0) * 60;
                const studyDaysPerWeek = scheduleData.study_days?.length || 5;
                const totalStudyDays = Math.floor((daysUntilTarget / 7) * studyDaysPerWeek);

                recommendedDailyMinutes = totalStudyDays > 0 ? Math.ceil(totalMinutesRemaining / totalStudyDays) : 30; // Default 30 minutes
            }

            // Update enrollment with learning schedule
            const updatedEnrollment = await CourseEnrollment.updateById(enrollment.id, {
                learning_schedule: {
                    target_completion_date: scheduleData.target_completion_date,
                    daily_study_minutes: recommendedDailyMinutes || 30,
                    study_days: scheduleData.study_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
                    reminder_time: scheduleData.reminder_time || "19:00",
                    timezone: scheduleData.timezone || "UTC",
                    send_reminders: scheduleData.send_reminders !== false,
                    created_at: new Date(),
                    last_reminder_sent: null,
                },
                updated_at: new Date(),
            });

            return {
                success: true,
                data: {
                    learning_schedule: (updatedEnrollment as unknown as { learning_schedule?: Record<string, unknown> }).learning_schedule,
                    recommendations: {
                        daily_study_minutes: recommendedDailyMinutes,
                        estimated_completion_date: scheduleData.target_completion_date,
                        total_study_sessions: scheduleData.target_completion_date
                            ? Math.ceil(
                                  ((course?.estimated_duration_hours || 0) * 60) / (recommendedDailyMinutes || 30)
                              )
                            : null,
                    },
                },
                message: "Learning schedule set successfully",
            };
        } catch (error) {
            throw new Error(`Failed to set learning schedule: ${error}`);
        }
    }

    /**
     * Get learning statistics and achievements (like Udemy insights)
     */
    static async getLearningStatistics(
        user_id: string,
        campus_id: string,
        timeframe: "week" | "month" | "year" = "month"
    ) {
        try {
            const endDate = new Date();
            const startDate = new Date();

            switch (timeframe) {
                case "week": {
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                }
                case "month": {
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                }
                case "year": {
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                }
            }

            // Get user's progress records
            const progressResult = await CourseProgress.find({
                user_id,
                campus_id,
                updated_at: { $gte: startDate, $lte: endDate },
            });
            const progressRecords = progressResult.rows;

            // Get user's enrollments
            const enrollmentsResult = await CourseEnrollment.find({
                user_id,
                campus_id,
            });
            const enrollments = enrollmentsResult.rows;

            // Calculate statistics
            const totalWatchTime = progressRecords.reduce((sum, p) => sum + p.watch_time_seconds, 0);
            const uniqueLectures = new Set(progressRecords.map((p) => p.lecture_id)).size;
            const completedLectures = progressRecords.filter((p) => p.progress_status === "completed").length;
            const coursesInProgress = enrollments.filter(
                (e) => e.enrollment_status === "active" && e.progress_percentage > 0 && e.progress_percentage < 100
            ).length;
            const coursesCompleted = enrollments.filter((e) => e.enrollment_status === "completed").length;

            // Calculate streaks and consistency
            const dailyActivity: Array<{
                date: Date;
                minutes: number;
                lectures_watched: number;
                lectures_completed: number;
            }> = this.calculateDailyActivity(progressRecords, startDate, endDate);
            const currentStreak = this.calculateCurrentStreak(dailyActivity);
            const longestStreak = this.calculateLongestStreak(dailyActivity);

            return {
                success: true,
                data: {
                    timeframe,
                    period: {
                        start_date: startDate,
                        end_date: endDate,
                    },
                    statistics: {
                        total_watch_time_hours: Math.round((totalWatchTime / 3600) * 10) / 10,
                        total_watch_time_minutes: Math.round(totalWatchTime / 60),
                        unique_lectures_watched: uniqueLectures,
                        lectures_completed: completedLectures,
                        courses_in_progress: coursesInProgress,
                        courses_completed: coursesCompleted,
                        average_daily_minutes: Math.round(
                            totalWatchTime /
                                60 /
                                Math.max(
                                    1,
                                    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                                )
                        ),
                    },
                    engagement: {
                        current_streak_days: currentStreak,
                        longest_streak_days: longestStreak,
                        active_days: dailyActivity.filter((d) => d.minutes > 0).length,
                        consistency_percentage: Math.round(
                            (dailyActivity.filter((d) => d.minutes > 0).length / dailyActivity.length) * 100
                        ),
                    },
                    daily_activity: dailyActivity,
                    achievements: this.calculateAchievements(enrollments, progressRecords, totalWatchTime),
                },
                message: "Learning statistics retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get learning statistics: ${error}`);
        }
    }

    /**
     * Helper methods for learning statistics
     */
    private static calculateDailyActivity(
        progressRecords: Array<{ updated_at: Date; watch_time_seconds: number; progress_status?: string }>,
        startDate: Date,
        endDate: Date
    ): Array<{
        date: Date;
        minutes: number;
        lectures_watched: number;
        lectures_completed: number;
    }> {
        const dailyActivity: Array<{
            date: Date;
            minutes: number;
            lectures_watched: number;
            lectures_completed: number;
        }> = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);

            const dayProgress = progressRecords.filter((p) => {
                const updateDate = new Date(p.updated_at);
                return updateDate >= dayStart && updateDate <= dayEnd;
            });

            const watchTime = dayProgress.reduce((sum, p) => sum + p.watch_time_seconds, 0);

            dailyActivity.push({
                date: new Date(currentDate),
                minutes: Math.round(watchTime / 60),
                lectures_watched: dayProgress.length,
                lectures_completed: dayProgress.filter((p) => p.progress_status === "completed").length,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dailyActivity;
    }

    private static calculateCurrentStreak(dailyActivity: Array<{ minutes: number }>) {
        let streak = 0;
        for (let i = dailyActivity.length - 1; i >= 0; i--) {
            if (dailyActivity[i].minutes > 0) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    private static calculateLongestStreak(dailyActivity: Array<{ minutes: number }>) {
        let longestStreak = 0;
        let currentStreak = 0;

        for (const day of dailyActivity) {
            if (day.minutes > 0) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        return longestStreak;
    }

    private static calculateAchievements(
        enrollments: Array<{ enrollment_status: string }>,
        progressRecords: Array<{ progress_status?: string }>,
        totalWatchTime: number
    ): Array<{
        type: string;
        title: string;
        description: string;
    }> {
        const achievements: Array<{
            type: string;
            title: string;
            description: string;
        }> = [];

        // Time-based achievements
        const totalHours = totalWatchTime / 3600;
        if (totalHours >= 1) {
            achievements.push({
                type: "time",
                title: "First Hour",
                description: "Completed 1 hour of learning",
            });
        }
        if (totalHours >= 10) {
            achievements.push({
                type: "time",
                title: "Dedicated Learner",
                description: "Completed 10 hours of learning",
            });
        }
        if (totalHours >= 50) {
            achievements.push({
                type: "time",
                title: "Learning Machine",
                description: "Completed 50 hours of learning",
            });
        }

        // Course completion achievements
        const completedCourses = enrollments.filter((e) => e.enrollment_status === "completed").length;
        if (completedCourses >= 1) {
            achievements.push({
                type: "completion",
                title: "Course Finisher",
                description: "Completed your first course",
            });
        }
        if (completedCourses >= 5) {
            achievements.push({
                type: "completion",
                title: "Multi-Course Master",
                description: "Completed 5 courses",
            });
        }

        // Lecture completion achievements
        const completedLectures = progressRecords.filter((p) => p.progress_status === "completed").length;
        if (completedLectures >= 10) {
            achievements.push({
                type: "progress",
                title: "Lecture Lover",
                description: "Completed 10 lectures",
            });
        }
        if (completedLectures >= 50) {
            achievements.push({
                type: "progress",
                title: "Content Consumer",
                description: "Completed 50 lectures",
            });
        }

        return achievements;
    }

    // ==================== ANALYTICS ====================

    /**
     * Get course analytics
     */
    static async getCourseAnalytics(course_id: string, campus_id: string) {
        try {
            const course = await this.findCourseById(course_id, campus_id);
            if (!course) {
                throw new Error("Course not found");
            }

            // Get enrollment analytics
            const enrollmentsResult = await CourseEnrollment.find({
                course_id,
            });
            const enrollments = enrollmentsResult.rows;

            const activeEnrollments = enrollments.filter((e) => e.enrollment_status === "active").length;
            const completedEnrollments = enrollments.filter((e) => e.enrollment_status === "completed").length;
            const completionRate = enrollments.length > 0 ? (completedEnrollments / enrollments.length) * 100 : 0;

            // Get progress analytics
            const progressResult = await CourseProgress.find({ course_id });
            const progressRecords = progressResult.rows;

            const totalWatchTime = progressRecords.reduce((sum, p) => sum + p.watch_time_seconds, 0);
            const averageSessionDuration =
                progressRecords.length > 0
                    ? progressRecords.reduce((sum, p) => sum + p.watch_time_seconds, 0) / progressRecords.length / 60
                    : 0;

            // Get lecture performance
            const lecturesResult = await CourseLecture.find({ course_id });
            const lectures = lecturesResult.rows;

            const lecturePerformance = await Promise.all(
                lectures.map(async (lecture) => {
                    const lectureProgressResult = await CourseProgress.find({
                        lecture_id: lecture.id,
                    });
                    const lectureProgress = lectureProgressResult.rows;

                    const viewCount = lectureProgress.length;
                    const completionRate =
                        viewCount > 0
                            ? (lectureProgress.filter((p) => p.progress_status === "completed").length / viewCount) *
                              100
                            : 0;
                    const averageWatchTime =
                        viewCount > 0
                            ? lectureProgress.reduce((sum, p) => sum + p.completion_percentage, 0) / viewCount
                            : 0;

                    return {
                        lecture_id: lecture.id,
                        lecture_title: lecture.title,
                        lecture_type: lecture.lecture_type,
                        view_count: viewCount,
                        completion_rate: completionRate,
                        average_watch_time_percentage: averageWatchTime,
                        dropout_rate: 100 - completionRate,
                        engagement_score: (completionRate + averageWatchTime) / 2,
                    };
                })
            );

            return {
                success: true,
                data: {
                    course_overview: {
                        total_enrollments: enrollments.length,
                        active_enrollments: activeEnrollments,
                        completed_enrollments: completedEnrollments,
                        completion_rate: completionRate,
                        average_completion_time_hours:
                            enrollments.length > 0
                                ? enrollments.reduce((sum, e) => sum + (e.completion_time_hours || 0), 0) /
                                  enrollments.length
                                : 0,
                        average_rating: course.rating,
                        total_revenue: enrollments.reduce(
                            (sum, e) => sum + (e.enrollment_type === "paid" ? course.price : 0),
                            0
                        ),
                    },
                    engagement_metrics: {
                        total_watch_time_hours: totalWatchTime / 3600,
                        average_session_duration_minutes: averageSessionDuration,
                        video_completion_rate:
                            lecturePerformance
                                .filter((l) => l.lecture_type === "video")
                                .reduce((sum, l) => sum + l.completion_rate, 0) /
                                lecturePerformance.filter((l) => l.lecture_type === "video").length || 0,
                        quiz_attempt_rate: 0, // TODO: Calculate from quiz data
                        assignment_submission_rate: 0, // TODO: Calculate from assignment data
                        discussion_participation_rate: 0, // TODO: Calculate from discussion data
                    },
                    content_performance: lecturePerformance,
                    student_progress: enrollments.slice(0, 50).map((enrollment) => ({
                        user_id: enrollment.user_id,
                        student_name: "Student", // TODO: Get from user data
                        enrollment_date: enrollment.enrollment_date,
                        progress_percentage: enrollment.progress_percentage,
                        last_accessed: enrollment.last_accessed_at,
                        completion_status: enrollment.enrollment_status,
                        grade: enrollment.grade,
                    })),
                    time_series_data: {
                        daily_enrollments: [], // TODO: Implement time series data
                        weekly_engagement: [],
                    },
                },
                message: "Course analytics retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get course analytics: ${error}`);
        }
    }

    // ==================== REAL-TIME & AUTOMATED TRACKING SERVICES ====================

    /**
     * Update real-time lecture progress with enhanced automation
     */
    static async updateRealtimeProgress(
        course_id: string,
        lecture_id: string,
        user_id: string,
        campus_id: string,
        progressData: Partial<ICourseProgressData> & { current_time?: number; total_duration?: number; is_focused?: boolean; playback_speed?: number; buffer_health?: number }
    ) {
        try {
            // Check if user is enrolled
            const enrollmentResult = await CourseEnrollment.find({
                course_id,
                user_id,
                enrollment_status: "active",
            });

            if (enrollmentResult.rows.length === 0) {
                throw new Error("User is not enrolled in this course");
            }

            // Get or create progress record
            const existingProgressResult = await CourseProgress.find({
                user_id,
                lecture_id,
            });

            let progress;
            const now = new Date();

            // Calculate enhanced metrics
            const currentTime = progressData.current_time || 0;
            const totalDuration = progressData.total_duration || 1;
            const watchPercentage = (currentTime / totalDuration) * 100;
            const isNearCompletion = watchPercentage >= 95;
            const engagementScore = currentTime > 0 && totalDuration > 0 ? this.calculateEngagementScore({ current_time: currentTime, total_duration: totalDuration, is_focused: progressData.is_focused, playback_speed: progressData.playback_speed, buffer_health: progressData.buffer_health }) : 0;

            if (existingProgressResult.rows.length === 0) {
                // Create new progress record with enhanced tracking
                const extendedData = progressData as unknown as { is_playing?: boolean; quality?: string };
                progress = await CourseProgress.create({
                    id: nanoid(),
                    course_id,
                    user_id,
                    lecture_id,
                    campus_id,
                    progress_status: watchPercentage > 0 ? "in_progress" : "not_started",
                    watch_time_seconds: Math.max(0, currentTime),
                    total_duration_seconds: totalDuration,
                    completion_percentage: Math.min(100, watchPercentage),
                    first_accessed_at: now,
                    last_accessed_at: now,
                    resume_position_seconds: currentTime,
                    interaction_data: {
                        play_count: extendedData.is_playing ? 1 : 0,
                        pause_count: 0,
                        seek_count: 0,
                        speed_changes: 0,
                        quality_changes: 0,
                        fullscreen_toggles: 0,
                        notes_taken: 0,
                        bookmarked: false,
                        liked: false,
                        engagement_score: engagementScore,
                        focus_percentage: progressData.is_focused ? 100 : 50,
                        playback_speed: progressData.playback_speed || 1,
                    },
                    notes: [],
                    device_info: {
                        device_type: "web",
                        connection_quality: (progressData.buffer_health || 0) > 80 ? "good" : (progressData.buffer_health || 0) > 50 ? "fair" : "poor",
                    },
                    meta_data: {
                        auto_tracking_enabled: true,
                        quality_metrics: {
                            buffer_health: progressData.buffer_health || 100,
                            quality_level: extendedData.quality || "auto",
                        },
                    },
                    created_at: now,
                    updated_at: now,
                });
            } else {
                // Update existing progress with smart logic
                const existingProgress = existingProgressResult.rows[0];
                const newWatchTime = Math.max(existingProgress.watch_time_seconds, progressData.current_time || 0);
                
                progress = await CourseProgress.updateById(existingProgress.id, {
                    progress_status: isNearCompletion ? "completed" : "in_progress",
                    watch_time_seconds: newWatchTime,
                    completion_percentage: Math.min(100, watchPercentage),
                    last_accessed_at: now,
                    resume_position_seconds: progressData.current_time || existingProgress.resume_position_seconds,
                    interaction_data: {
                        ...existingProgress.interaction_data,
                        engagement_score: engagementScore,
                        focus_percentage: progressData.is_focused ? 100 : 50,
                        playback_speed: progressData.playback_speed || existingProgress.interaction_data.playback_speed,
                    },
                    updated_at: now,
                });
            }

            // Auto-complete if criteria met
            if (isNearCompletion && progress.progress_status !== "completed") {
                await this.autoCompleteIfCriteriaMet(course_id, lecture_id, user_id, progress);
            }

            return {
                success: true,
                data: {
                    ...progress,
                    auto_completion_triggered: isNearCompletion,
                    engagement_score: engagementScore,
                    recommendations: await this.getNextLectureRecommendation(course_id, lecture_id, user_id),
                },
                message: "Real-time progress updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update real-time progress: ${error}`);
        }
    }

    /**
     * Update batch progress data for offline sync
     */
    static async updateBatchProgress(
        course_id: string,
        user_id: string,
        campus_id: string,
        batchData: { updates: Array<{ lecture_id: string; progress_data: Partial<ICourseProgressData> }> }
    ) {
        try {
            const results: Array<{
                lecture_id: string;
                success: boolean;
                data?: Record<string, unknown>;
                error?: string;
            }> = [];
            
            for (const update of batchData.updates) {
                const extendedUpdate = update as unknown as { lecture_id: string; time_watched_seconds?: number; total_duration?: number };
                try {
                    const result = await this.updateRealtimeProgress(
                        course_id,
                        extendedUpdate.lecture_id,
                        user_id,
                        campus_id,
                        {
                            current_time: extendedUpdate.time_watched_seconds || 0,
                            total_duration: extendedUpdate.total_duration || 0,
                            is_focused: true,
                            playback_speed: 1,
                        }
                    );
                    results.push({ lecture_id: update.lecture_id, success: true, data: result.data });
                } catch (error) {
                    results.push({ 
                        lecture_id: update.lecture_id, 
                        success: false, 
                        error: error instanceof Error ? error.message : "Unknown error" 
                    });
                }
            }

            // Update enrollment progress
            await this.updateEnrollmentProgress(course_id, user_id);

            return {
                success: true,
                data: {
                    batch_results: results,
                    successful_updates: results.filter(r => r.success).length,
                    failed_updates: results.filter(r => !r.success).length,
                    session_id: (batchData as unknown as { session_id?: string }).session_id || "unknown",
                },
                message: "Batch progress updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update batch progress: ${error}`);
        }
    }

    /**
     * Get auto-completion status and configuration
     */
    static async getAutoCompletionStatus(course_id: string, campus_id: string) {
        try {
            const courseResult = await Course.findById(course_id);
            
            if (!courseResult || courseResult.campus_id !== campus_id) {
                throw new Error("Course not found");
            }

            const course = courseResult;
            const metaData = course.meta_data as unknown as { auto_completion_config?: Record<string, unknown> };
            const config = metaData?.auto_completion_config || {
                auto_completion_enabled: true,
                minimum_engagement_percentage: 75,
                smart_detection_enabled: true,
                auto_progression_enabled: false,
                completion_notification_enabled: true,
                analytics_tracking_level: "detailed",
            };

            return {
                success: true,
                data: {
                    course_id,
                    auto_completion_config: config,
                    course_completion_criteria: {
                        total_lectures: 0, // Will be calculated
                        mandatory_lectures: 0,
                        optional_lectures: 0,
                        estimated_duration_hours: course.estimated_duration_hours,
                    },
                    tracking_features: {
                        real_time_progress: true,
                        engagement_scoring: true,
                        smart_bookmarks: true,
                        adaptive_recommendations: true,
                        completion_predictions: true,
                    },
                },
                message: "Auto-completion status retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get auto-completion status: ${error}`);
        }
    }

    /**
     * Update auto-completion configuration
     */
    static async updateAutoCompletionConfig(
        course_id: string,
        campus_id: string,
        user_id: string,
        configData: Partial<{ auto_completion_enabled: boolean; minimum_engagement_percentage: number; smart_detection_enabled: boolean }>
    ) {
        try {
            const courseResult = await Course.findById(course_id);
            
            if (!courseResult || courseResult.campus_id !== campus_id) {
                throw new Error("Course not found");
            }

            // Check permissions (admin, course creator, or instructor)
            const course = courseResult;
            const hasPermission = course.created_by === user_id || course.instructor_ids.includes(user_id);
            
            if (!hasPermission) {
                throw new Error("Insufficient permissions to update auto-completion config");
            }

            const updatedCourse = await Course.updateById(course_id, {
                meta_data: {
                    ...course.meta_data,
                    auto_completion_config: {
                        ...course.meta_data?.auto_completion_config,
                        ...configData,
                        last_updated_by: user_id,
                        last_updated_at: new Date(),
                    },
                },
                updated_at: new Date(),
            });

            return {
                success: true,
                data: {
                    course_id,
                    updated_config: updatedCourse.meta_data?.auto_completion_config,
                },
                message: "Auto-completion configuration updated successfully",
            };
        } catch (error) {
            throw new Error(`Failed to update auto-completion config: ${error}`);
        }
    }

    /**
     * Get personalized learning analytics
     */
    static async getLearningAnalytics(
        _course_id: string,
        _user_id: string,
        _campus_id: string,
        _timeframe: string
    ) {
        try {
            // Check enrollment
            const enrollmentResult = await CourseEnrollment.find({
                course_id: _course_id,
                user_id: _user_id,
                enrollment_status: "active",
            });

            if (enrollmentResult.rows.length === 0) {
                throw new Error("User is not enrolled in this course");
            }

            const enrollment = enrollmentResult.rows[0];

            // Get progress data
            const progressResult = await CourseProgress.find({ course_id: _course_id, user_id: _user_id });
            const progressData = progressResult.rows;

            // Calculate metrics
            const totalWatchTime = progressData.reduce((sum, p) => sum + p.watch_time_seconds, 0);
            const completedLectures = progressData.filter(p => p.progress_status === "completed").length;
            
            // Get course lectures for total count
            const lecturesResult = await CourseLecture.find({ course_id: _course_id, is_published: true });
            const totalCourseLectures = lecturesResult.rows.length;

            const engagementScore = this.calculateOverallEngagementScore(progressData);
            const consistencyScore = this.calculateConsistencyScore(progressData);
            const attentionScore = this.calculateAttentionScore(progressData);

            return {
                success: true,
                data: {
                    user_id: _user_id,
                    course_id: _course_id,
                    overall_progress: {
                        completion_percentage: enrollment.progress_percentage,
                        time_spent_hours: Math.round((totalWatchTime / 3600) * 10) / 10,
                        lectures_completed: completedLectures,
                        total_lectures: totalCourseLectures,
                        current_streak_days: await this.calculateLearningStreak(_user_id, _course_id),
                        longest_streak_days: await this.calculateUserLongestStreak(_user_id, _course_id),
                        estimated_completion_date: this.estimateCompletionDate(enrollment, progressData),
                    },
                    engagement_metrics: {
                        average_session_duration_minutes: this.calculateAverageSessionDuration(progressData),
                        total_sessions: progressData.length,
                        engagement_score: engagementScore,
                        attention_span_score: attentionScore,
                        consistency_score: consistencyScore,
                        interaction_frequency: this.calculateInteractionFrequency(progressData),
                    },
                    learning_patterns: {
                        preferred_time_slots: this.identifyPreferredTimeSlots(progressData),
                        average_playback_speed: this.calculateAveragePlaybackSpeed(progressData),
                        most_replayed_sections: this.findMostReplayedSections(progressData),
                        difficulty_preferences: ["intermediate"], // TODO: Implement difficulty analysis
                        device_preferences: this.identifyDevicePreferences(progressData),
                    },
                    predictions: {
                        completion_likelihood: this.predictCompletionLikelihood(enrollment, progressData),
                        at_risk_of_dropping: this.assessDropoutRisk(enrollment, progressData),
                        recommended_study_schedule: this.generateStudySchedule(_user_id, _course_id, progressData),
                        next_optimal_session_time: this.predictOptimalStudyTime(progressData),
                    },
                },
                message: "Learning analytics retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get learning analytics: ${error}`);
        }
    }

    /**
     * Get AI-powered smart recommendations
     */
    static async getSmartRecommendations(
        course_id: string,
        user_id: string,
        campus_id: string,
        _recommendationType: string
    ) {
        try {
            // Get user progress and analytics
            const analyticsResult = await this.getLearningAnalytics(course_id, user_id, campus_id, "month");
            const analytics = analyticsResult.data;

            // Get next lectures
            const nextLectures = await this.getNextRecommendedLectures(course_id, user_id);

            return {
                success: true,
                data: {
                    next_recommended_lectures: nextLectures,
                    optimal_study_time: {
                        recommended_session_length_minutes: this.getOptimalSessionLength(analytics),
                        break_recommendations: this.generateBreakRecommendations(analytics),
                        best_time_to_study: this.getBestStudyTime(analytics),
                    },
                    personalized_tips: this.generatePersonalizedTips(analytics),
                    adaptive_content: {
                        suggested_playback_speed: analytics.learning_patterns.average_playback_speed,
                        content_difficulty_adjustment: this.suggestDifficultyAdjustment(analytics),
                        additional_resources: this.suggestAdditionalResources(course_id, analytics),
                    },
                },
                message: "Smart recommendations retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get smart recommendations: ${error}`);
        }
    }

    /**
     * Auto-progress to next lecture based on completion criteria
     */
    static async autoProgressToNext(course_id: string, user_id: string, campus_id: string) {
        try {
            // Get current progress
            const progressResult = await CourseProgress.find({ 
                course_id, 
                user_id,
                progress_status: "completed" 
            });

            if (progressResult.rows.length === 0) {
                throw new Error("No completed lectures found");
            }

            // Find next lecture
            const nextLecture = await this.findNextAvailableLecture(course_id, user_id);
            
            if (!nextLecture) {
                return {
                    success: true,
                    data: {
                        message: "Course completed! No more lectures available.",
                        course_completed: true,
                    },
                    message: "Course completion detected",
                };
            }

            // Create progress record for next lecture
            const nextProgress = await CourseProgress.create({
                id: nanoid(),
                course_id,
                user_id,
                lecture_id: nextLecture?.lecture_id || "unknown",
                campus_id,
                progress_status: "not_started",
                watch_time_seconds: 0,
                total_duration_seconds: 0,
                completion_percentage: 0,
                first_accessed_at: new Date(),
                last_accessed_at: new Date(),
                interaction_data: {
                    play_count: 0,
                    pause_count: 0,
                    seek_count: 0,
                    speed_changes: 0,
                    quality_changes: 0,
                    fullscreen_toggles: 0,
                    notes_taken: 0,
                    bookmarked: false,
                    liked: false,
                },
                notes: [],
                device_info: { device_type: "web" },
                meta_data: { auto_progressed: true },
                created_at: new Date(),
                updated_at: new Date(),
            });

            return {
                success: true,
                data: {
                    next_lecture: nextLecture,
                    progress_created: nextProgress,
                    auto_progressed: true,
                },
                message: "Auto-progressed to next lecture successfully",
            };
        } catch (error) {
            throw new Error(`Failed to auto-progress to next lecture: ${error}`);
        }
    }

    /**
     * Get detailed watch time analytics
     */
    static async getWatchTimeAnalytics(
        course_id: string,
        user_id: string,
        campus_id: string,
        granularity: string
    ) {
        try {
            const progressResult = await CourseProgress.find({ course_id, user_id });
            const progressData = progressResult.rows;

            const analytics = this.processWatchTimeData(progressData, granularity);

            return {
                success: true,
                data: {
                    total_watch_time_seconds: (analytics as { totalWatchTime: number }).totalWatchTime,
                    total_watch_time_hours: Math.round(((analytics as { totalWatchTime: number }).totalWatchTime / 3600) * 10) / 10,
                    average_session_duration_minutes: analytics.averageSessionDuration,
                    watch_time_by_period: analytics.watchTimeByPeriod,
                    engagement_patterns: analytics.engagementPatterns,
                    completion_velocity: analytics.completionVelocity,
                    predicted_completion_time: analytics.predictedCompletionTime,
                    watch_quality_metrics: analytics.qualityMetrics,
                },
                message: "Watch time analytics retrieved successfully",
            };
        } catch (error) {
            throw new Error(`Failed to get watch time analytics: ${error}`);
        }
    }

    // ==================== HELPER METHODS ====================

    private static calculateEngagementScore(progressData: { current_time: number; is_focused?: boolean; playback_speed?: number; buffer_health?: number; total_duration: number }): number {
        let score = 0;
        
        // Base score from watch time
        if (progressData.current_time > 0) {
            score += 20;
        }
        
        // Focus bonus
        if (progressData.is_focused) {
            score += 20;
        }
        
        // Playback speed consideration
        if (progressData.playback_speed && progressData.playback_speed >= 0.75 && progressData.playback_speed <= 1.5) {
            score += 20;
        }
        
        // Buffer health (connection quality)
        if (progressData.buffer_health && progressData.buffer_health > 80) {
            score += 20;
        } else if (progressData.buffer_health && progressData.buffer_health > 50) {
            score += 10;
        }
        
        // Completion percentage
        const completionPct = (progressData.current_time / progressData.total_duration) * 100;
        if (completionPct > 80) {
            score += 20;
        } else if (completionPct > 50) {
            score += 10;
        }
        
        return Math.min(100, score);
    }

    private static async autoCompleteIfCriteriaMet(
        _course_id: string,
        lecture_id: string,
        _user_id: string,
        progress: { completion_percentage: number }
    ): Promise<void> {
        // Get lecture completion criteria
        const lectureResult = await CourseLecture.findById(lecture_id);
        
        if (!lectureResult) {
            return;
        }
        
        const criteria = lectureResult.completion_criteria || {};
        const minWatchPercentage = criteria.minimum_watch_percentage || 80;
        
        if (progress.completion_percentage >= minWatchPercentage) {
            const progressWithId = progress as unknown as { id: string };
            await CourseProgress.updateById(progressWithId.id, {
                progress_status: "completed",
                completed_at: new Date(),
                updated_at: new Date(),
            });
        }
    }

    private static async getNextLectureRecommendation(
        _course_id: string,
        _current_lecture_id: string,
        _user_id: string
    ): Promise<{ has_next: boolean; next_lecture_id: string; estimated_duration_minutes: number; difficulty_level: string }> {
        // Implementation for getting next lecture recommendation
        return {
            has_next: true,
            next_lecture_id: "next_lecture_id",
            estimated_duration_minutes: 15,
            difficulty_level: "medium",
        };
    }

    // Additional helper methods would be implemented here...
    private static calculateOverallEngagementScore(progressData: Array<{ engagement_score?: number }>): number {
        if (progressData.length === 0) {
            return 0;
        }
        
        const avgEngagement = progressData.reduce((sum, p) => {
            const progressWithInteraction = p as unknown as { engagement_score?: number; interaction_data?: { engagement_score?: number } };
            return sum + (progressWithInteraction.interaction_data?.engagement_score || progressWithInteraction.engagement_score || 0);
        }, 0) / progressData.length;
        
        return Math.round(avgEngagement);
    }

    private static calculateConsistencyScore(_progressData: Array<Record<string, unknown>>): number {
        // Implementation for consistency score calculation
        return 75; // Placeholder
    }

    private static calculateAttentionScore(_progressData: Array<Record<string, unknown>>): number {
        // Implementation for attention score calculation
        return 80; // Placeholder
    }

    private static async calculateLearningStreak(_user_id: string, _course_id: string): Promise<number> {
        // Implementation for learning streak calculation
        return 5; // Placeholder
    }

    private static async calculateUserLongestStreak(_user_id: string, _course_id: string): Promise<number> {
        // Implementation for longest streak calculation
        return 12; // Placeholder
    }

    private static estimateCompletionDate(_enrollment: Record<string, unknown>, _progressData: Array<Record<string, unknown>>): string {
        // Implementation for completion date estimation
        const now = new Date();
        now.setDate(now.getDate() + 30); // Estimate 30 days
        return now.toISOString();
    }

    private static calculateAverageSessionDuration(_progressData: Array<Record<string, unknown>>): number {
        // Implementation for average session duration
        return 25; // Placeholder: 25 minutes
    }

    private static calculateInteractionFrequency(_progressData: Array<Record<string, unknown>>): number {
        // Implementation for interaction frequency
        return 8.5; // Placeholder
    }

    private static identifyPreferredTimeSlots(_progressData: Array<Record<string, unknown>>): string[] {
        // Implementation for time slot identification
        return ["09:00-11:00", "19:00-21:00"]; // Placeholder
    }

    private static calculateAveragePlaybackSpeed(_progressData: Array<Record<string, unknown>>): number {
        // Implementation for average playback speed
        return 1.25; // Placeholder
    }

    private static findMostReplayedSections(_progressData: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
        // Implementation for most replayed sections
        return []; // Placeholder
    }

    private static identifyDevicePreferences(_progressData: Array<Record<string, unknown>>): string[] {
        // Implementation for device preferences
        return ["web", "mobile"]; // Placeholder
    }

    private static predictCompletionLikelihood(_enrollment: Record<string, unknown>, _progressData: Array<Record<string, unknown>>): number {
        // Implementation for completion likelihood prediction
        return 85; // Placeholder: 85% likelihood
    }

    private static assessDropoutRisk(_enrollment: Record<string, unknown>, _progressData: Array<Record<string, unknown>>): boolean {
        // Implementation for dropout risk assessment
        return false; // Placeholder
    }

    private static generateStudySchedule(_user_id: string, _course_id: string, _progressData: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
        // Implementation for study schedule generation
        return []; // Placeholder
    }

    private static predictOptimalStudyTime(_progressData: Array<Record<string, unknown>>): string {
        // Implementation for optimal study time prediction
        const now = new Date();
        now.setHours(19, 0, 0, 0); // 7 PM
        return now.toISOString();
    }

    private static async getNextRecommendedLectures(_course_id: string, _user_id: string): Promise<Array<Record<string, unknown>>> {
        // Implementation for next recommended lectures
        return []; // Placeholder
    }

    private static getOptimalSessionLength(_analytics: Record<string, unknown>): number {
        // Implementation for optimal session length
        return 30; // Placeholder: 30 minutes
    }

    private static generateBreakRecommendations(_analytics: Record<string, unknown>): Array<Record<string, unknown>> {
        // Implementation for break recommendations
        return [
            {
                after_minutes: 25,
                break_duration_minutes: 5,
                activity_suggestion: "Take a short walk or stretch",
            },
        ];
    }

    private static getBestStudyTime(_analytics: Record<string, unknown>): string {
        // Implementation for best study time
        return "19:00-20:00"; // Placeholder
    }

    private static generatePersonalizedTips(_analytics: Record<string, unknown>): Array<Record<string, unknown>> {
        // Implementation for personalized tips
        return [
            {
                tip_type: "engagement",
                message: "Try taking notes during videos to improve retention",
                action_items: ["Use the note-taking feature", "Review notes after each session"],
                priority: "medium",
            },
        ];
    }

    private static suggestDifficultyAdjustment(_analytics: Record<string, unknown>): string {
        // Implementation for difficulty adjustment suggestion
        return "same"; // Placeholder
    }

    private static suggestAdditionalResources(_course_id: string, _analytics: Record<string, unknown>): Array<Record<string, unknown>> {
        // Implementation for additional resources suggestion
        return []; // Placeholder
    }

    private static async findNextAvailableLecture(_course_id: string, _user_id: string): Promise<Record<string, unknown> | null> {
        // Implementation for finding next lecture
        return null; // Placeholder
    }

    private static processWatchTimeData(progressData: Array<{ watch_time_seconds: number }>, _granularity: string): Record<string, unknown> {
        // Implementation for processing watch time data
        return {
            totalWatchTime: progressData.reduce((sum, p) => sum + p.watch_time_seconds, 0),
            averageSessionDuration: 25,
            watchTimeByPeriod: [],
            engagementPatterns: {},
            completionVelocity: 1.2,
            predictedCompletionTime: "30 days",
            qualityMetrics: {},
        };
    }
}