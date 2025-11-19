import { ClassSubject, IClassSubjectData } from "@/models/class_subject.model";
import { Class } from "@/models/class.model";
import { ISubject, Subject } from "@/models/subject.model";

import { ClassService } from "./class.service";
import { TeacherService } from "./teacher.service";

const classService = new ClassService();

export class SubjectService {
    // Create a new subject
    public static async createSubject(campusId: string, subjectData: Partial<ISubject>): Promise<ISubject> {
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
    public static async updateSubject(id: string, subjectData: Partial<ISubject>) {
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

    // Get all subject assignments for a campus
    public static async getAllSubjectAssignments(campusId: string, filters?: {
        search?: string;
        academic_year?: string;
        class_id?: string;
        subject_id?: string;
        teacher_id?: string;
    }) {
        const query: any = {
            campus_id: campusId,
        };

        // Apply filters
        if (filters?.academic_year) {
            query.academic_year = filters.academic_year;
        }
        if (filters?.class_id) {
            query.class_id = filters.class_id;
        }
        if (filters?.subject_id) {
            query.subject_id = filters.subject_id;
        }
        if (filters?.teacher_id) {
            query.teacher_id = filters.teacher_id;
        }

        const class_subjects: {
            rows: IClassSubjectData[];
        } = await ClassSubject.find(query, {
            sort: {
                updated_at: "DESC",
            },
        });

        if (class_subjects.rows.length === 0) {
            return [];
        }

        // Populate subject, class, and teacher details
        const assignments = await Promise.all(
            class_subjects.rows.map(async (assignment) => {
                try {
                    const [subject, classData, teacher] = await Promise.all([
                        Subject.findById(assignment.subject_id).catch(() => null),
                        Class.findById(assignment.class_id).catch(() => null),
                        TeacherService.getTeacherById(assignment.teacher_id).catch(() => null),
                    ]);

                    const result = {
                        id: assignment.id,
                        subject: subject ? {
                            id: subject.id,
                            name: subject.name,
                            code: subject.code,
                        } : null,
                        class: classData ? {
                            id: classData.id,
                            name: classData.name,
                        } : null,
                        teacher: teacher ? {
                            id: teacher.id,
                            name: `${teacher.teacher_profile.first_name} ${teacher.teacher_profile.last_name}`,
                            email: teacher.teacher_profile.email,
                        } : null,
                        academic_year: assignment.academic_year,
                        created_at: assignment.created_at,
                        updated_at: assignment.updated_at,
                    };

                    // Apply search filter if provided
                    if (filters?.search) {
                        const searchLower = filters.search.toLowerCase();
                        const matchesSearch = 
                            result.subject?.name?.toLowerCase().includes(searchLower) ||
                            result.subject?.code?.toLowerCase().includes(searchLower) ||
                            result.class?.name?.toLowerCase().includes(searchLower) ||
                            result.teacher?.name?.toLowerCase().includes(searchLower) ||
                            result.academic_year?.toLowerCase().includes(searchLower);
                        
                        return matchesSearch ? result : null;
                    }

                    return result;
                } catch (error) {
                    console.error("Error processing assignment:", error);
                    return null;
                }
            })
        );

        // Filter out null results
        return assignments.filter(Boolean);
    }
}
