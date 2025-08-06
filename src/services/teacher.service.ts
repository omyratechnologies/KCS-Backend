import { Class, IClassData } from "@/models/class.model";
import { ISubject, Subject } from "@/models/subject.model";
import { ITeacherData, Teacher } from "@/models/teacher.model";

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
                        meta_data: updatedMetaData as any,
                    });
                }
            } catch (error) {
                console.error(`Failed to update user meta_data with teacher_id: ${error}`);
                // Don't throw error here as teacher creation was successful
                // Just log the error for debugging
            }
        }

        return teacher;
    }

    // Get all teachers for a campus
    public static async getAllTeachers(campusId: string) {
        const teachers: {
            rows: ITeacherData[];
        } = await Teacher.find(
            {
                campus_id: campusId,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (teachers.rows.length === 0) {
            return [];
        }

        const resultPromises = teachers.rows.map((teacher) => {
            return this.getTeacherById(teacher.id);
        });

        const result = await Promise.all(resultPromises);
        // Filter out null results (teachers with missing user profiles)
        const validTeachers = result.filter((teacher) => teacher !== null);
        return validTeachers;
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
        } catch (error) {
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

        // Remove teacher_id from user's meta_data before deleting teacher
        if (teacher.user_id) {
            try {
                const user = await UserService.getUser(teacher.user_id);
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

                    // Remove teacher_id from meta_data
                    delete (existingMetaData as any).teacher_id;

                    // Update the user with the updated meta_data
                    await UserService.updateUsers(teacher.user_id, {
                        meta_data: existingMetaData as any,
                    });
                }
            } catch (error) {
                console.error(`Failed to remove teacher_id from user meta_data: ${error}`);
                // Don't throw error here as we still want to delete the teacher
                // Just log the error for debugging
            }
        }

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
}
