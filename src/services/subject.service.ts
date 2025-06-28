import { ClassSubject, IClassSubjectData } from "@/models/class_subject.model";
import { ISubject, Subject } from "@/models/subject.model";

import { ClassService } from "./class.service";
import { TeacherService } from "./teacher.service";

const classService = new ClassService();

export class SubjectService {
    // Create a new subject
    public static async createSubject(
        campusId: string,
        subjectData: Partial<ISubject>
    ): Promise<ISubject> {
        const subject = await Subject.create({
            campus_id: campusId,
            ...subjectData,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
        if (!subject) {
            throw new Error("Subject not created");
        }
        return subject;
    }

    // Get all subjects for a campus
    public static async getAllSubjects(campusId: string) {
        const subjects: {
            rows: ISubject[];
        } = await Subject.find(
            {
                campus_id: campusId,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (subjects.rows.length === 0) {
            throw new Error("No subjects found");
        }

        return subjects.rows;
    }

    // Get a subject by ID
    public static async getSubjectById(id: string) {
        const subject = await Subject.findById(id);
        if (!subject) {
            throw new Error("Subject not found");
        }
        return subject;
    }

    // Update a subject
    public static async updateSubject(
        id: string,
        subjectData: Partial<ISubject>
    ) {
        const subject = await Subject.updateById(id, {
            ...subjectData,
            updated_at: new Date(),
        });
        if (!subject) {
            throw new Error("Subject not updated");
        }
        return subject;
    }

    // Delete a subject
    public static async deleteSubject(id: string) {
        const subject = await Subject.findOneAndUpdate(
            {
                id: id,
                is_deleted: false,
            },
            {
                is_deleted: true,
                updated_at: new Date(),
            }
        );
        if (!subject) {
            throw new Error("Subject not found or already deleted");
        }
        return subject;
    }

    // Get all teachers for a subject
    public static async getAllTeacherForASubjectById(subjectId: string) {
        const class_subjects: {
            rows: IClassSubjectData[];
        } = await ClassSubject.find(
            {
                subject_id: subjectId,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (class_subjects.rows.length === 0) {
            throw new Error("No class subjects found");
        }

        const resultPromises = class_subjects.rows.map((class_subject) => {
            return TeacherService.getTeacherById(class_subject.teacher_id);
        });

        const result = await Promise.all(resultPromises);
        if (!result) {
            throw new Error("No class subjects found");
        }
        return result;
    }

    // Get all classes for a subject
    public static async getAllClassesForASubjectById(subjectId: string) {
        const class_subjects: {
            rows: IClassSubjectData[];
        } = await ClassSubject.find(
            {
                subject_id: subjectId,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (class_subjects.rows.length === 0) {
            throw new Error("No class subjects found");
        }

        const resultPromises = class_subjects.rows.map((class_subject) => {
            return classService.getClassSubjectById(class_subject.id);
        });

        const result = await Promise.all(resultPromises);
        if (!result) {
            throw new Error("No class subjects found");
        }
        return result;
    }
}
