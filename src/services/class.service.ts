import { Assignment, IAssignmentData } from "@/models/assignment.model";
import {
    AssignmentSubmission,
    IAssignmentSubmission,
} from "@/models/assignment_submission.model";
import { Class, IClassData } from "@/models/class.model";
import { ClassSubject, IClassSubjectData } from "@/models/class_subject.model";
import { ISubject, Subject } from "@/models/subject.model";
import { IUser } from "@/models/user.model";

import { TeacherService } from "./teacher.service";
import { UserService } from "./users.service";

export class ClassService {
    public async getClassById(id: string) {
        try {
            const classData = await Class.findById(id);

            if (!classData) {
                throw new Error("Class not found");
            }

            const classInChargesIds = classData.class_in_charge;
            const classStudentsIds = classData.student_ids;
            const classTeacherId = classData.class_teacher_id;

            // Get all students in the class
            const classSubjects = await this.getAllSubjectsByClassId(id);

            // Get class teacher
            const classTeacher =
                await TeacherService.getTeacherById(classTeacherId);

            // Get all class in charges
            const classInCharges =
                await this.getAllClassInChargesByIds(classInChargesIds);
            const classStudents =
                await this.getAllClassStudentsByIds(classStudentsIds);

            return {
                ...classData,
                class_teacher: classTeacher,
                class_in_charge: classInCharges,
                students: classStudents,
                subjects: classSubjects,
            };
        } catch (error) {
            console.error("Error fetching class by ID:", error);
            return null;
        }
    }

    public async getAllClassByCampusId(
        campusId: string
    ): Promise<IClassData[]> {
        try {
            const classes: {
                rows: IClassData[];
            } = await Class.find(
                {
                    campus_id: campusId,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (classes.rows.length === 0) {
                throw new Error("No classes found");
            }

            return classes.rows;
        } catch (error) {
            console.error("Error fetching classes by campus ID:", error);
            return [];
        }
    }

    public async createClass(
        campus_id: string,
        classData: {
            name: string;
            class_teacher_id: string;
            student_ids: string[];
            student_count: number;
            academic_year: string;
            class_in_charge: string[];
        }
    ): Promise<IClassData> {
        try {
            const newClass = await Class.create({
                campus_id,
                ...classData,
                meta_data: {},
                is_active: true,
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });
            if (!newClass) {
                throw new Error("Failed to create class");
            }

            const teacher = await TeacherService.getTeacherById(
                classData.class_teacher_id
            );

            // append class to teacher's classes
            if (teacher) {
                teacher.classes.push(newClass.id);
                await TeacherService.updateTeacher(teacher.id, {
                    classes: teacher.classes,
                });
            }

            // append class to students' classes in metadata
            for (const studentId of classData.student_ids) {
                const student = await UserService.getUser(studentId);
                if (student) {
                    if (!student.meta_data) {
                        student.meta_data = {};
                    }
                    // Ensure meta_data has a 'classes' property as an array
                    if (!(student.meta_data as { classes?: string[] }).classes) {
                        (student.meta_data as { classes?: string[] }).classes = [];
                    }
                    (student.meta_data as { classes: string[] }).classes = [
                        ...(student.meta_data as { classes: string[] }).classes,
                        newClass.id,
                    ];
                    await UserService.updateUsers(student.id, {
                        meta_data: JSON.stringify(student.meta_data),
                    });
                }
            }

            return newClass;
        } catch (error) {
            console.error("Error creating class:", error);
            throw error;
        }
    }

    public async updateClass(
        id: string,
        classData: Partial<IClassData>
    ): Promise<IClassData | null> {
        try {
            const updatedClass = await Class.findOneAndUpdate(
                {
                    id,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    ...classData,
                    updated_at: new Date(),
                },
                { new: true }
            );

            // if teacher is updated, update the teacher's classes
            if (classData.class_teacher_id) {
                const teacher = await TeacherService.getTeacherById(
                    classData.class_teacher_id
                );
                if (teacher) {
                    // Remove the class from the old teacher's classes
                    const oldTeacher = await TeacherService.getTeacherById(
                        updatedClass.class_teacher_id
                    );
                    if (oldTeacher) {
                        oldTeacher.classes = oldTeacher.classes.filter(
                            (classId) => classId !== updatedClass.id
                        );
                        await TeacherService.updateTeacher(oldTeacher.id, {
                            classes: oldTeacher.classes,
                        });
                    }
                    // Add the class to the new teacher's classes
                    teacher.classes.push(updatedClass.id);
                    await TeacherService.updateTeacher(teacher.id, {
                        classes: teacher.classes,
                    });
                }
            }

            // if students are updated, update the students' classes in metadata
            if (classData.student_ids) {
                // Remove the class from the old students' classes
                const oldStudentIds = updatedClass.student_ids || [];
                for (const studentId of oldStudentIds) {
                    const student = await UserService.getUser(studentId);
                    if (student) {
                        if (!student.meta_data) {
                            student.meta_data = {};
                        }
                        // Ensure meta_data has a 'classes' property as an array
                        if (
                            !(student.meta_data as { classes?: string[] })
                                .classes
                        ) {
                            (student.meta_data as { classes?: string[] }).classes =
                                [];
                        }
                        (student.meta_data as { classes: string[] }).classes =
                            (student.meta_data as { classes: string[] }).classes.filter(
                                (classId) => classId !== updatedClass.id
                            );
                        await UserService.updateUsers(student.id, {
                            meta_data: JSON.stringify(student.meta_data),
                        });
                    }
                }
                // Add the class to the new students' classes
                for (const studentId of classData.student_ids) {
                    const student = await UserService.getUser(studentId);
                    if (student) {
                        if (!student.meta_data) {
                            student.meta_data = {};
                        }
                        // Ensure meta_data has a 'classes' property as an array
                        if (
                            !(student.meta_data as { classes?: string[] })
                                .classes
                        ) {
                            (student.meta_data as { classes?: string[] }).classes =
                                [];
                        }
                        (student.meta_data as { classes: string[] }).classes = [
                            ...(student.meta_data as { classes: string[] }).classes,
                            updatedClass.id,
                        ];
                        await UserService.updateUsers(student.id, {
                            meta_data: JSON.stringify(student.meta_data),
                        });
                    }
                }
            }

            if (!updatedClass) {
                throw new Error("Class not found");
            }

            return updatedClass;
        } catch (error) {
            console.error("Error updating class:", error);
            return null;
        }
    }

    // Delete
    public async deleteClass(id: string): Promise<IClassData | null> {
        try {
            const deletedClass = await Class.findOneAndUpdate(
                {
                    id,
                    is_deleted: false,
                },
                {
                    is_active: false,
                    is_deleted: true,
                    updated_at: new Date(),
                },
                { new: true }
            );

            if (!deletedClass) {
                throw new Error("Class not found");
            }

            return deletedClass;
        } catch (error) {
            console.error("Error deleting class:", error);
            return null;
        }
    }

    // Get all subjects for a class
    public async getAllSubjectsByClassId(classId: string): Promise<ISubject[]> {
        try {
            const subjects: {
                rows: IClassSubjectData[];
            } = await ClassSubject.find(
                {
                    class_id: classId,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (subjects.rows.length === 0) {
                return [];
            }

            const subjectIds = subjects.rows.map(
                (subject) => subject.subject_id
            );
            const uniqueSubjectIds = [...new Set(subjectIds)];
            const subjectPromises = uniqueSubjectIds.map(async (subjectId) => {
                return await Subject.findById(subjectId);
            });

            const subjectData = await Promise.all(subjectPromises);
            return subjectData.filter((subject) => subject !== null);
        } catch (error) {
            console.error("Error fetching subjects by class ID:", error);
            return [];
        }
    }

    // Get all classes for a subject
    public async getAllClassesBySubjectId(
        subjectId: string
    ): Promise<IClassData[]> {
        try {
            const classes: {
                rows: IClassSubjectData[];
            } = await ClassSubject.find(
                {
                    subject_id: subjectId,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (classes.rows.length === 0) {
                throw new Error("No classes found for this subject");
            }

            const classIds = classes.rows.map(
                (classSubject) => classSubject.class_id
            );
            const uniqueClassIds = [...new Set(classIds)];
            const classPromises = uniqueClassIds.map(async (classId) => {
                return await Class.findById(classId);
            });

            const classData = await Promise.all(classPromises);
            return classData.filter((classItem) => classItem !== null);
        } catch (error) {
            console.error("Error fetching classes by subject ID:", error);
            return [];
        }
    }

    // Get all class subjects for a class
    public async getAllClassSubjectsByClassId(
        classId: string
    ): Promise<IClassSubjectData[]> {
        try {
            const classSubjects: {
                rows: IClassSubjectData[];
            } = await ClassSubject.find(
                {
                    class_id: classId,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (classSubjects.rows.length === 0) {
                throw new Error("No class subjects found for this class");
            }

            return classSubjects.rows;
        } catch (error) {
            console.error("Error fetching class subjects by class ID:", error);
            return [];
        }
    }

    // Create class subject
    public async createClassSubject(
        campus_id: string,
        class_id: string,
        classSubjectData: {
            subject_id: string;
            teacher_id: string;
        }
    ): Promise<IClassSubjectData> {
        try {
            const newClassSubject = await ClassSubject.create({
                campus_id,
                class_id,
                ...classSubjectData,
                created_at: new Date(),
                updated_at: new Date(),
            });

            if (!newClassSubject) {
                throw new Error("Failed to create class subject");
            }

            const teacher = await TeacherService.getTeacherById(
                classSubjectData.teacher_id
            );

            // append class to teacher's subjects
            if (teacher) {
                teacher.subjects.push(classSubjectData.subject_id);
                await TeacherService.updateTeacher(teacher.id, {
                    subjects: teacher.subjects,
                });
            }

            return newClassSubject;
        } catch (error) {
            console.error("Error creating class subject:", error);
            throw error;
        }
    }

    // Update class subject
    public async updateClassSubject(
        id: string,
        classSubjectData: Partial<IClassSubjectData>
    ): Promise<IClassSubjectData | null> {
        try {
            const updatedClassSubject = await ClassSubject.findOneAndUpdate(
                {
                    id,
                },
                {
                    ...classSubjectData,
                    updated_at: new Date(),
                },
                { new: true }
            );

            if (!updatedClassSubject) {
                throw new Error("Class subject not found");
            }

            return updatedClassSubject;
        } catch (error) {
            console.error("Error updating class subject:", error);
            return null;
        }
    }

    // Delete class subject
    public async deleteClassSubject(id: string) {
        try {
            const deletedClassSubject = await ClassSubject.removeById(id);

            if (!deletedClassSubject) {
                throw new Error("Class subject not found");
            }

            return deletedClassSubject;
        } catch (error) {
            console.error("Error deleting class subject:", error);
            throw new Error("Error deleting class subject");
        }
    }

    // Get class subject by ID
    public async getClassSubjectById(
        id: string
    ): Promise<IClassSubjectData | null> {
        try {
            const classSubject = await ClassSubject.findById(id);

            if (!classSubject) {
                throw new Error("Class subject not found");
            }

            return classSubject;
        } catch (error) {
            console.error("Error fetching class subject by ID:", error);
            return null;
        }
    }

    // Get all class in charges by IDs
    public async getAllClassInChargesByIds(ids: string[]): Promise<IUser[]> {
        try {
            const classInCharges = await Promise.all(
                ids.map(async (id) => {
                    return await UserService.getUser(id);
                })
            );

            return classInCharges.filter(
                (classInCharge) => classInCharge !== null
            );
        } catch (error) {
            console.error("Error fetching class in charges by IDs:", error);
            return [];
        }
    }

    // Get all class students by IDs
    public async getAllClassStudentsByIds(ids: string[]): Promise<IUser[]> {
        try {
            const classStudents = await Promise.all(
                ids.map(async (id) => {
                    return await UserService.getUser(id);
                })
            );

            return classStudents.filter(
                (classStudent) => classStudent !== null
            );
        } catch (error) {
            console.error("Error fetching class students by IDs:", error);
            return [];
        }
    }

    // Get all assignments by class ID
    public async getAllAssignmentsByClassId(
        classId: string
    ): Promise<IAssignmentData[]> {
        try {
            const assignments: {
                rows: IAssignmentData[];
            } = await Assignment.find(
                { class_id: classId },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            return assignments.rows;
        } catch (error) {
            console.error("Error fetching assignments by class ID:", error);
            return [];
        }
    }

    // Get assignment by ID
    public async getAssignmentById(
        id: string
    ): Promise<IAssignmentData | null> {
        try {
            return await Assignment.findById(id);
        } catch (error) {
            console.error("Error fetching assignment by ID:", error);
            return null;
        }
    }

    // Create assignment
    public async createAssignment(
        campus_id: string,
        class_id: string,
        assignmentData: Partial<IAssignmentData>
    ): Promise<IAssignmentData | null> {
        try {
            const assignment = await Assignment.create({
                campus_id,
                class_id,
                ...assignmentData,
                created_at: new Date(),
                updated_at: new Date(),
            });
            
            console.log("Assignment created successfully:", assignment);
            return assignment;
        } catch (error) {
            console.error("Error creating assignment:", error);
            throw error; // Re-throw the error instead of returning null
        }
    }

    // update assignment
    public async updateAssignment(
        id: string,
        assignmentData: Partial<IAssignmentData>
    ): Promise<IAssignmentData | null> {
        try {
            return await Assignment.updateById(id, assignmentData);
        } catch (error) {
            console.error("Error updating assignment:", error);
            return null;
        }
    }

    // delete assignment
    public async deleteAssignment(id: string): Promise<boolean> {
        try {
            await Assignment.findByIdAndDelete(id);

            return true;
        } catch (error) {
            console.error("Error deleting assignment:", error);
            return false;
        }
    }

    // Get assignment submission by ID
    public async getAssignmentSubmissionById(
        id: string
    ): Promise<IAssignmentSubmission | null> {
        try {
            return await AssignmentSubmission.findById(id);
        } catch (error) {
            console.error("Error fetching assignment submission by ID:", error);
            return null;
        }
    }

    // create a assignment submission
    public async createAssignmentSubmission(
        assignment_id: string,
        assignmentSubmissionData: Partial<IAssignmentSubmission>
    ): Promise<IAssignmentSubmission | null> {
        try {
            return await AssignmentSubmission.create({
                assignment_id,
                ...assignmentSubmissionData,
                created_at: new Date(),
                updated_at: new Date(),
            });
        } catch (error) {
            console.error("Error creating assignment submission:", error);
            return null;
        }
    }

    // get assignment submission by assignment id
    public async getAssignmentSubmissionByAssignmentId(
        assignmentId: string
    ): Promise<IAssignmentSubmission[]> {
        try {
            const assignmentSubmissions: {
                rows: IAssignmentSubmission[];
            } = await AssignmentSubmission.find(
                {
                    assignment_id: assignmentId,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (assignmentSubmissions.rows.length === 0) {
                throw new Error(
                    "No assignment submissions found for this assignment"
                );
            }

            return assignmentSubmissions.rows;
        } catch (error) {
            console.error(
                "Error fetching assignment submissions by assignment ID:",
                error
            );
            return [];
        }
    }

    // update assignment submission
    public async deleteAssignmentSubmission(id: string): Promise<boolean> {
        try {
            await AssignmentSubmission.findByIdAndDelete(id);

            return true;
        } catch (error) {
            console.error("Error deleting assignment submission:", error);
            return false;
        }
    }

    // get all assignment submissions by user id
    public async getAssignmentSubmissionsByUserId(
        userId: string
    ): Promise<IAssignmentSubmission[]> {
        try {
            const assignmentSubmissions: {
                rows: IAssignmentSubmission[];
            } = await AssignmentSubmission.find(
                { user_id: userId },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (assignmentSubmissions.rows.length === 0) {
                throw new Error(
                    "No assignment submissions found for this user"
                );
            }

            return assignmentSubmissions.rows;
        } catch (error) {
            console.error(
                "Error fetching assignment submissions by user ID:",
                error
            );
            return [];
        }
    }

    // get all assignment submissions by class id
    public async getAssignmentSubmissionsByClassId(
        classId: string
    ): Promise<IAssignmentSubmission[]> {
        try {
            const assignmentSubmissions: {
                rows: IAssignmentSubmission[];
            } = await AssignmentSubmission.find(
                { class_id: classId },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (assignmentSubmissions.rows.length === 0) {
                throw new Error(
                    "No assignment submissions found for this class"
                );
            }

            return assignmentSubmissions.rows;
        } catch (error) {
            console.error(
                "Error fetching assignment submissions by class ID:",
                error
            );
            return [];
        }
    }

    public async getClassesByStudentId(studentId: string): Promise<IClassData[]> {
        try {
            // First, let's try with the correct Ottoman syntax for array contains
            const classes: {
                rows: IClassData[];
            } = await Class.find(
                {
                    student_ids: studentId,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (classes.rows.length === 0) {
                // If no results found, try alternative approach
                console.log("No classes found with simple contains, trying alternative query");
                
                // Get all active classes and filter manually
                const allClasses: {
                    rows: IClassData[];
                } = await Class.find(
                    {
                        is_active: true,
                        is_deleted: false,
                    },
                    {
                        sort: {
                            updated_at: "DESC",
                        },
                    }
                );

                const filteredClasses = allClasses.rows.filter(classItem => 
                    classItem.student_ids && classItem.student_ids.includes(studentId)
                );

                if (filteredClasses.length === 0) {
                    throw new Error("No classes found for this student");
                }

                return filteredClasses;
            }

            return classes.rows;
        } catch (error) {
            console.error("Error fetching classes by student user ID:", error);
            return [];
        }
    }
}
