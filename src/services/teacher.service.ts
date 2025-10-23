import { Class, IClassData } from "@/models/class.model";
import { ISubject, Subject } from "@/models/subject.model";
import { ITeacherData, Teacher } from "@/models/teacher.model";
import { ClassSubject } from "@/models/class_subject.model";
import { Timetable } from "@/models/time_table.model";
import { Assignment } from "@/models/assignment.model";
import { Meeting } from "@/models/meeting.model";
import infoLogs, { LogTypes } from "@/libs/logger";

import { UserService } from "./users.service";

export class TeacherService {
    // Create a new teacher
    public static async createTeacher(campusId: string, teacherData: Partial<ITeacherData>): Promise<ITeacherData> {
        const teacher = await Teacher.create({
            campus_id: campusId,
            ...teacherData,
            created_at: new Date(),
            updated_at: new Date(),
        });
        if (!teacher) {
            throw new Error("Teacher not created");
        }

        // Update the user's meta_data with the teacher_id
        if (teacherData.user_id) {
            try {
                const user = await UserService.getUser(teacherData.user_id);
                if (user) {
                    // Parse existing meta_data if it's a string, otherwise use as object
                    let existingMetaData = {};
                    if (typeof user.meta_data === "string") {
                        try {
                            existingMetaData = JSON.parse(user.meta_data);
                        } catch {
                            existingMetaData = {};
                        }
                    } else if (user.meta_data && typeof user.meta_data === "object") {
                        existingMetaData = user.meta_data;
                    }

                    // Add teacher_id to meta_data
                    const updatedMetaData = {
                        ...existingMetaData,
                        teacher_id: teacher.id,
                    };

                    // Update the user with the new meta_data (will be converted to JSON string by validation)
                    await UserService.updateUsers(teacherData.user_id, {
                        // biome-ignore lint/suspicious/noExplicitAny: meta_data can be any JSON-serializable type
                        meta_data: updatedMetaData as any,
                    });
                }
            } catch (error) {
                infoLogs(`Failed to update user meta_data with teacher_id: ${error}`, LogTypes.ERROR, "TEACHER_SERVICE");
                // Don't throw error here as teacher creation was successful
                // Just log the error for debugging
            }
        }

        return teacher;
    }

    // Get all teachers for a campus with pagination and filters
    public static async getAllTeachers(
        campusId: string,
        filters: {
            page?: number;
            limit?: number;
            search?: string;
            user_id?: string;
            email?: string;
            name?: string;
            is_active?: boolean;
            class_id?: string;
            from?: Date;
            to?: Date;
            sort_by?: string;
            sort_order?: "asc" | "desc";
        } = {}
    ) {
        const {
            page = 1,
            limit = 20,
            search,
            user_id,
            email,
            name,
            is_active,
            class_id,
            from,
            to,
            sort_by = "updated_at",
            sort_order = "desc",
        } = filters;

        const teachers: {
            rows: ITeacherData[];
        } = await Teacher.find(
            {
                campus_id: campusId,
            },
            {
                sort: {
                    [sort_by]: sort_order === "asc" ? "ASC" : "DESC",
                },
            }
        );

        if (teachers.rows.length === 0) {
            return {
                teachers: [],
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total_items: 0,
                    total_pages: 0,
                    has_next: false,
                    has_previous: false,
                },
            };
        }

        // Get full teacher details
        const resultPromises = teachers.rows.map((teacher) => {
            return this.getTeacherById(teacher.id);
        });

        const result = await Promise.all(resultPromises);
        // Filter out null results (teachers with missing user profiles)
        const validTeachers = result.filter((teacher): teacher is NonNullable<typeof teacher> => teacher !== null);

        // Apply filters
        let filteredTeachers = validTeachers;

        if (user_id) {
            filteredTeachers = filteredTeachers.filter((t) => t.user_id === user_id);
        }

        if (email) {
            filteredTeachers = filteredTeachers.filter((t) => 
                t.teacher_profile?.email?.toLowerCase().includes(email.toLowerCase())
            );
        }

        if (name) {
            const nameLower = name.toLowerCase();
            filteredTeachers = filteredTeachers.filter((t) => {
                const fullName = `${t.teacher_profile?.first_name || ''} ${t.teacher_profile?.last_name || ''}`.toLowerCase();
                return fullName.includes(nameLower) || 
                       t.teacher_profile?.first_name?.toLowerCase().includes(nameLower) ||
                       t.teacher_profile?.last_name?.toLowerCase().includes(nameLower);
            });
        }

        if (is_active !== undefined) {
            filteredTeachers = filteredTeachers.filter((t) => t.teacher_profile?.is_active === is_active);
        }

        if (class_id) {
            filteredTeachers = filteredTeachers.filter((t) => 
                t.classes && Array.isArray(t.classes) && t.classes.includes(class_id)
            );
        }

        // Date range filtering
        if (from) {
            filteredTeachers = filteredTeachers.filter((t) => {
                const createdAt = new Date(t.created_at);
                return createdAt >= from;
            });
        }

        if (to) {
            filteredTeachers = filteredTeachers.filter((t) => {
                const createdAt = new Date(t.created_at);
                // Include the entire day by setting time to end of day
                const endOfDay = new Date(to);
                endOfDay.setHours(23, 59, 59, 999);
                return createdAt <= endOfDay;
            });
        }

        if (search) {
            const searchLower = search.toLowerCase();
            filteredTeachers = filteredTeachers.filter((t) => {
                const fullName = `${t.teacher_profile?.first_name || ''} ${t.teacher_profile?.last_name || ''}`.toLowerCase();
                return fullName.includes(searchLower) ||
                       t.teacher_profile?.email?.toLowerCase().includes(searchLower) ||
                       t.teacher_profile?.user_id?.toLowerCase().includes(searchLower) ||
                       t.teacher_profile?.phone?.includes(search);
            });
        }

        const totalTeachers = filteredTeachers.length;

        // Apply pagination
        const skip = (page - 1) * limit;
        const paginatedTeachers = filteredTeachers.slice(skip, skip + limit);

        return {
            teachers: paginatedTeachers,
            pagination: {
                current_page: page,
                per_page: limit,
                total_items: totalTeachers,
                total_pages: Math.ceil(totalTeachers / limit),
                has_next: page < Math.ceil(totalTeachers / limit),
                has_previous: page > 1,
            },
        };
    }

    // Get a teacher by ID
    public static async getTeacherById(id: string) {
        const teacher = await Teacher.findById(id);

        if (!teacher) {
            throw new Error("Teacher not found");
        }

        let teacher_profile;
        try {
            teacher_profile = await UserService.getUser(teacher.user_id);
        } catch {
            // Teacher exists but user profile is missing - skip this teacher
            return null;
        }

        if (!teacher_profile) {
            return null;
        }

        const teacher_subjects = await this.getAllSubjectsByTeacherId(teacher.id);
        const teacher_classes = await this.getAllClassesByTeacherId(teacher.id);

        return {
            ...teacher,
            teacher_profile,
            teacher_subjects,
            teacher_classes,
        };
    }

    // Update a teacher
    public static async updateTeacher(id: string, teacherData: Partial<ITeacherData>) {
        const teacher = await Teacher.findById(id);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        const updatedTeacher = await Teacher.updateById(id, {
            ...teacherData,
            updated_at: new Date(),
        });

        if (!updatedTeacher) {
            throw new Error("Teacher not updated");
        }

        return updatedTeacher;
    }

    // Delete a teacher
    public static async deleteTeacher(id: string) {
        const teacher = await Teacher.findById(id);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // ============================================================
        // CASCADE DELETION: Remove all teacher relations
        // ============================================================

        try {
            // 1. Remove teacher from Classes (class_teacher_id and teacher_ids array)
            // Note: Fetch all classes and filter in code since Ottoman $or with $in may not work as expected
            const allClasses = await Class.find({
                is_deleted: false
            });

            if (allClasses.rows && allClasses.rows.length > 0) {
                for (const classItem of allClasses.rows) {
                    // Check if this class references the teacher
                    const hasTeacherAsClassTeacher = classItem.class_teacher_id === id;
                    const hasTeacherInArray = classItem.teacher_ids && classItem.teacher_ids.includes(id);

                    if (!hasTeacherAsClassTeacher && !hasTeacherInArray) {
                        continue; // Skip this class, no updates needed
                    }

                    const updates: Partial<IClassData> = {
                        updated_at: new Date()
                    };

                    // Clear class_teacher_id if it matches the deleted teacher
                    if (hasTeacherAsClassTeacher) {
                        updates.class_teacher_id = "";
                    }

                    // Remove teacher from teacher_ids array
                    if (hasTeacherInArray) {
                        updates.teacher_ids = classItem.teacher_ids.filter(tid => tid !== id);
                    }

                    await Class.updateById(classItem.id, updates);
                }
            }

            // 2. Delete ClassSubject entries for this teacher
            const classSubjects = await ClassSubject.find({
                teacher_id: id
            });

            if (classSubjects.rows && classSubjects.rows.length > 0) {
                for (const classSubject of classSubjects.rows) {
                    await ClassSubject.removeById(classSubject.id);
                }
            }

            // 3. Delete Timetable entries for this teacher
            const timetableEntries = await Timetable.find({
                teacher_id: id,
                is_deleted: false
            });

            if (timetableEntries.rows && timetableEntries.rows.length > 0) {
                for (const timetableEntry of timetableEntries.rows) {
                    await Timetable.updateById(timetableEntry.id, {
                        is_deleted: true,
                        updated_at: new Date()
                    });
                }
            }

            // 4. Mark Assignments created by this teacher as deleted (soft delete)
            // Assignments use user_id which is the teacher's user_id
            if (teacher.user_id) {
                const assignments = await Assignment.find({
                    user_id: teacher.user_id
                });

                if (assignments.rows && assignments.rows.length > 0) {
                    for (const assignment of assignments.rows) {
                        // Soft delete to preserve student submissions
                        await Assignment.updateById(assignment.id, {
                            meta_data: {
                                ...assignment.meta_data,
                                deleted_teacher_id: id,
                                deletion_timestamp: new Date().toISOString(),
                                deletion_reason: "Teacher account deleted"
                            },
                            updated_at: new Date()
                        });
                    }
                }

                // 5. Mark Meetings created by this teacher
                const meetings = await Meeting.find({
                    creator_id: teacher.user_id,
                    is_deleted: false
                });

                if (meetings.rows && meetings.rows.length > 0) {
                    for (const meeting of meetings.rows) {
                        await Meeting.updateById(meeting.id, {
                            is_deleted: true,
                            meeting_status: "cancelled",
                            updated_at: new Date()
                        });
                    }
                }
            }

            // 6. Remove teacher_id from user's meta_data
            if (teacher.user_id) {
                try {
                    const user = await UserService.getUser(teacher.user_id);
                    if (user) {
                        // Parse existing meta_data if it's a string, otherwise use as object
                        let existingMetaData: Record<string, unknown> = {};
                        if (typeof user.meta_data === "string") {
                            try {
                                existingMetaData = JSON.parse(user.meta_data);
                            } catch {
                                existingMetaData = {};
                            }
                        } else if (user.meta_data && typeof user.meta_data === "object") {
                            existingMetaData = user.meta_data as Record<string, unknown>;
                        }

                        // Remove teacher_id from meta_data
                        delete existingMetaData.teacher_id;

                        // Update the user with the updated meta_data
                        await UserService.updateUsers(teacher.user_id, {
                            // biome-ignore lint/suspicious/noExplicitAny: meta_data can be any JSON-serializable type
                            meta_data: existingMetaData as any
                        });
                    }
                } catch (userError) {
                    // Log but don't throw - we still want to delete the teacher
                    infoLogs(`Failed to remove teacher_id from user meta_data: ${userError}`, LogTypes.ERROR, "TEACHER_SERVICE");
                }
            }

        } catch (cascadeError) {
            // Log cascade deletion errors but continue with teacher deletion
            infoLogs(`Cascade deletion warnings for teacher ${id}: ${cascadeError}`, LogTypes.ERROR, "TEACHER_SERVICE");
        }

        // Finally, delete the teacher record
        const deletedTeacher = await Teacher.removeById(id);
        if (!deletedTeacher) {
            throw new Error("Teacher not deleted");
        }

        return deletedTeacher;
    }

    // Get all classes by teacher ID
    public static async getAllClassesByTeacherId(teacherId: string): Promise<IClassData[]> {
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.classes || teacher.classes.length === 0) {
            return [];
        }

        const classIds = teacher.classes;

        const classPromises = classIds.map(async (classId) => {
            return await Class.findById(classId);
        });
        const classData = await Promise.all(classPromises);
        return classData.filter((classItem) => classItem !== null);
    }

    // Get all subjects by teacher ID
    public static async getAllSubjectsByTeacherId(teacherId: string): Promise<ISubject[]> {
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.subjects || teacher.subjects.length === 0) {
            return [];
        }

        const subjectIds = teacher.subjects;
        const subjectPromises = subjectIds.map(async (subjectId) => {
            return await Subject.findById(subjectId);
        });

        const subjectData = await Promise.all(subjectPromises);
        return subjectData.filter((subject) => subject !== null);
    }

    // Get teacher by user ID
    public static async getTeacherByUserId(userId: string): Promise<ITeacherData | null> {
        const teachers: {
            rows: ITeacherData[];
        } = await Teacher.find({
            user_id: userId
        });

        if (teachers.rows.length === 0) {
            return null;
        }

        return teachers.rows[0];
    }
}