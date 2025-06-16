import { Class, IClassData } from "@/models/class.model";
import { ISubject, Subject } from "@/models/subject.model";
import { ITeacherData, Teacher } from "@/models/teacher.model";

import { UserService } from "./users.service";

export class TeacherService {
    // Create a new teacher
    public static async createTeacher(
        campusId: string,
        teacherData: Partial<ITeacherData>
    ): Promise<ITeacherData> {
        const teacher = await Teacher.create({
            campus_id: campusId,
            ...teacherData,
            created_at: new Date(),
            updated_at: new Date(),
        });
        if (!teacher) {
            throw new Error("Teacher not created");
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
            throw new Error("No teachers found");
        }

        const resultPromises = teachers.rows.map((teacher) => {
            return this.getTeacherById(teacher.id);
        });

        const result = await Promise.all(resultPromises);
        if (!result) {
            throw new Error("No teachers found");
        }
        return result;
    }

    // Get a teacher by ID
    public static async getTeacherById(id: string) {
        const teacher = await Teacher.findById(id);

        if (!teacher) {
            throw new Error("Teacher not found");
        }

        const teacher_profile = await UserService.getUser(teacher.user_id);
        if (!teacher_profile) {
            throw new Error("Teacher profile not found");
        }

        const teacher_subjects = await this.getAllSubjectsByTeacherId(
            teacher.id
        );
        if (!teacher_subjects) {
            throw new Error("Teacher subjects not found");
        }
        const teacher_classes = await this.getAllClassesByTeacherId(teacher.id);
        if (!teacher_classes) {
            throw new Error("Teacher classes not found");
        }

        return {
            ...teacher,
            teacher_profile,
            teacher_subjects,
            teacher_classes,
        };
    }

    // Update a teacher
    public static async updateTeacher(
        id: string,
        teacherData: Partial<ITeacherData>
    ) {
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

        const deletedTeacher = await Teacher.removeById(id);
        if (!deletedTeacher) {
            throw new Error("Teacher not deleted");
        }

        return deletedTeacher;
    }

    // Get all classes by teacher ID
    public static async getAllClassesByTeacherId(
        teacherId: string
    ): Promise<IClassData[]> {
        const teacher = await Teacher.findById(teacherId);

        const classIds = teacher.classes;

        const classPromises = classIds.map(async (classId) => {
            return await Class.findById(classId);
        });
        const classData = await Promise.all(classPromises);
        return classData.filter((classItem) => classItem !== null);
    }

    // Get all subjects by teacher ID
    public static async getAllSubjectsByTeacherId(
        teacherId: string
    ): Promise<ISubject[]> {
        const teacher = await Teacher.findById(teacherId);

        const subjectIds = teacher.subjects;
        const subjectPromises = subjectIds.map(async (subjectId) => {
            return await Subject.findById(subjectId);
        });

        const subjectData = await Promise.all(subjectPromises);
        return subjectData.filter((subject) => subject !== null);
    }
}
