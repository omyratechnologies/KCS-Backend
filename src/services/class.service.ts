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

            return {
                ...classData,
                // only send response teacher data (Name, email, phone) to response
                class_teacher: classData.teacher_ids
                    ? await Promise.all(classData.teacher_ids.map(async (teacherId) => {
                        const teacher = await TeacherService.getTeacherById(teacherId);
                        if (!teacher) {
                            throw new Error(`Teacher with ID ${teacherId} not found`);
                        }
                        return {
                            id: teacher.id,
                            user_type: teacher.teacher_profile.user_type,
                            name: `${teacher.teacher_profile.first_name} ${teacher.teacher_profile.last_name}`,
                            email: teacher.teacher_profile.email,
                            phone: teacher.teacher_profile.phone,
                        };
                    }))
                    : [],
                // only send response student data (Name, email, phone) to response
                class_students: classData.student_ids
                    ? await Promise.all(classData.student_ids.map(async (studentId) => {
                        const student = await UserService.getUser(studentId);
                        if (!student) {
                            throw new Error(`Student with ID ${studentId} not found`);
                        }
                        return {
                            id: student.id,
                            user_type: student.user_type,
                            name: `${student.first_name} ${student.last_name}`,
                            email: student.email,
                            phone: student.phone,
                        };
                    }))
                    : [],
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
            teacher_ids: string[];
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

            // If class teacher is provided, append class to teacher's classes
            if (classData.class_teacher_id) {
                const teacher = await TeacherService.getTeacherById(
                    classData.class_teacher_id
                );
                if (teacher) {
                    // Ensure teacher's classes is an array
                    if (!teacher.classes) {
                        teacher.classes = [];
                    }
                    // Append the new class to the teacher's classes
                    teacher.classes.push(newClass.id);
                    await TeacherService.updateTeacher(teacher.id, {
                        classes: teacher.classes,
                    });
                } else {
                    console.warn(
                        `Teacher with ID ${classData.class_teacher_id} not found`
                    );
                }
            }
            // append class from classData.teacher_ids & classData.class_teacher_id to teacher's classes
            if (classData.teacher_ids) {
                for (const teacherId of classData.teacher_ids) {
                    const teacher = await TeacherService.getTeacherById(teacherId);
                    if (teacher) {
                        if (!teacher.classes) {
                            teacher.classes = [];
                        }
                        teacher.classes.push(newClass.id);
                        await TeacherService.updateTeacher(teacher.id, {
                            classes: teacher.classes,
                        });
                    } else {
                        console.warn(`Teacher with ID ${teacherId} not found`);
                    }
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

            // append class from classData.teacher_ids & classData.class_teacher_id to teacher's classes
            if (classData.teacher_ids) {
                for (const teacherId of classData.teacher_ids) {
                    const teacher = await TeacherService.getTeacherById(teacherId);
                    if (teacher) {
                        if (!teacher.classes) {
                            teacher.classes = [];
                        }
                        // Check if the class is already in the teacher's classes
                        if (!teacher.classes.includes(id)) {
                            teacher.classes.push(id);
                            await TeacherService.updateTeacher(teacher.id, {
                                classes: teacher.classes,
                            });
                        }
                    } else {
                        console.warn(`Teacher with ID ${teacherId} not found`);
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

    // Get all students by class ID
    public async getStudentsByClassId(classId: string): Promise<{
        id: string;
        user_id: string;
        name: string;
    }[]> {
        try {
            // Get the class data
            const classData = await Class.findById(classId);

            if (!classData) {
                throw new Error("Class not found");
            }

            if (!classData.is_active || classData.is_deleted) {
                throw new Error("Class is not active or has been deleted");
            }

            // Check if class has students
            if (!classData.student_ids || classData.student_ids.length === 0) {
                return [];
            }

            // Get all students data
            const students = await Promise.all(
                classData.student_ids.map(async (studentId) => {
                    try {
                        const student = await UserService.getUser(studentId);
                        if (!student) {
                            console.warn(`Student with ID ${studentId} not found`);
                            return null;
                        }
                        return {
                            id: student.id,
                            user_id: student.user_id, // Assuming user_id is the same as id
                            name: `${student.first_name} ${student.last_name}`,
                        };
                    } catch (error) {
                        console.warn(`Error fetching student with ID ${studentId}:`, error);
                        return null;
                    }
                })
            );

            // Filter out null values and return the results
            return students.filter(student => student !== null) as {
                id: string;
                user_id: string;
                name: string;
            }[];
        } catch (error) {
            console.error("Error fetching students by class ID:", error);
            throw error;
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

    public async getAllAssignmentByUserId(
        userId: string
    ): Promise<IAssignmentData[]> {
        try {
            const assignments: {
                rows: IAssignmentData[];
            } = await Assignment.find(
                { user_id: userId },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (assignments.rows.length === 0) {
                throw new Error("No assignments found for this user");
            }

            return assignments.rows;
        } catch (error) {
            console.error("Error fetching assignments by user ID:", error);
            return [];
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
            // Validate required fields
            if (!assignmentSubmissionData.campus_id) {
                throw new Error("campus_id is required for assignment submission");
            }
            if (!assignmentSubmissionData.user_id) {
                throw new Error("user_id is required for assignment submission");
            }

            const submissionData: any = {
                assignment_id,
                campus_id: assignmentSubmissionData.campus_id,
                user_id: assignmentSubmissionData.user_id,
                submission_date: assignmentSubmissionData.submission_date || new Date(),
                meta_data: assignmentSubmissionData.meta_data || {},
                created_at: new Date(),
                updated_at: new Date(),
            };

            // Add optional fields if provided
            if (assignmentSubmissionData.grade !== undefined) {
                submissionData.grade = assignmentSubmissionData.grade;
            }
            if (assignmentSubmissionData.feedback !== undefined) {
                submissionData.feedback = assignmentSubmissionData.feedback;
            }

            const result = await AssignmentSubmission.create(submissionData);
            
            if (!result) {
                throw new Error("Failed to create assignment submission");
            }

            return result;
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

    // Assign students to class
    public async assignStudentsToClass(
        classId: string,
        studentIds: string[]
    ): Promise<IClassData | null> {
        try {
            // Validate class exists
            const existingClass = await Class.findById(classId);
            if (!existingClass) {
                throw new Error("Class not found");
            }

            if (!existingClass.is_active || existingClass.is_deleted) {
                throw new Error("Class is not active or has been deleted");
            }

            // Validate student IDs exist and are valid
            const validStudents: string[] = [];
            for (const studentId of studentIds) {
                const student = await UserService.getUser(studentId);
                if (!student) {
                    throw new Error(`Student with ID ${studentId} not found`);
                }
                if (student.user_type !== "Student") {
                    throw new Error(`User with ID ${studentId} is not a student`);
                }
                if (!student.is_active || student.is_deleted) {
                    throw new Error(`Student with ID ${studentId} is not active`);
                }
                validStudents.push(studentId);
            }

            // Get current student IDs to prevent duplicates
            const currentStudentIds = existingClass.student_ids || [];
            const duplicateStudents = validStudents.filter(studentId => 
                currentStudentIds.includes(studentId)
            );

            if (duplicateStudents.length > 0) {
                throw new Error(`Students with IDs ${duplicateStudents.join(", ")} are already assigned to this class`);
            }

            // Merge new student IDs with existing ones
            const updatedStudentIds = [...currentStudentIds, ...validStudents];

            // Update class with new student IDs
            const updatedClass = await Class.findOneAndUpdate(
                {
                    id: classId,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    student_ids: updatedStudentIds,
                    student_count: updatedStudentIds.length,
                    updated_at: new Date(),
                },
                { new: true }
            );

            if (!updatedClass) {
                throw new Error("Failed to update class");
            }

            // Update each student's meta_data to include the class
            for (const studentId of validStudents) {
                const student = await UserService.getUser(studentId);
                if (student) {
                    // Parse meta_data if it's a string, otherwise use as object
                    let currentMetaData: any = {};
                    if (student.meta_data) {
                        if (typeof student.meta_data === "string") {
                            try {
                                currentMetaData = JSON.parse(student.meta_data);
                            } catch {
                                currentMetaData = {};
                            }
                        } else {
                            currentMetaData = student.meta_data;
                        }
                    }
                    
                    const currentClasses = currentMetaData.classes || [];
                    
                    // Check if class is already assigned to avoid duplicates
                    if (!currentClasses.includes(classId)) {
                        const updatedClasses = [...currentClasses, classId];
                        const updatedMetaData = {
                            ...currentMetaData,
                            classes: updatedClasses
                        };
                        
                        await UserService.updateUsers(student.id, {
                            meta_data: JSON.stringify(updatedMetaData),
                        });
                    }
                }
            }

            return updatedClass;
        } catch (error) {
            console.error("Error assigning students to class:", error);
            throw error;
        }
    }

    // Assign teachers to class
    public async assignTeachersToClass(
        classId: string,
        teacherIds: string[]
    ): Promise<IClassData | null> {
        try {
            // Validate class exists
            const existingClass = await Class.findById(classId);
            if (!existingClass) {
                throw new Error("Class not found");
            }

            if (!existingClass.is_active || existingClass.is_deleted) {
                throw new Error("Class is not active or has been deleted");
            }

            // Validate teacher IDs exist and are valid
            const validTeachers: string[] = [];
            for (const teacherId of teacherIds) {
                const teacher = await TeacherService.getTeacherById(teacherId);
                if (!teacher) {
                    throw new Error(`Teacher with ID ${teacherId} not found`);
                }
                validTeachers.push(teacherId);
            }

            // Get current teacher IDs to prevent duplicates
            const currentTeacherIds = existingClass.teacher_ids || [];
            const duplicateTeachers = validTeachers.filter(teacherId => 
                currentTeacherIds.includes(teacherId)
            );

            if (duplicateTeachers.length > 0) {
                throw new Error(`Teachers with IDs ${duplicateTeachers.join(", ")} are already assigned to this class`);
            }

            // Merge new teacher IDs with existing ones
            const updatedTeacherIds = [...currentTeacherIds, ...validTeachers];

            // Update class with new teacher IDs
            const updatedClass = await Class.findOneAndUpdate(
                {
                    id: classId,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    teacher_ids: updatedTeacherIds,
                    updated_at: new Date(),
                },
                { new: true }
            );

            if (!updatedClass) {
                throw new Error("Failed to update class");
            }

            // Update each teacher's classes array
            for (const teacherId of validTeachers) {
                const teacher = await TeacherService.getTeacherById(teacherId);
                if (teacher) {
                    if (!teacher.classes) {
                        teacher.classes = [];
                    }
                    
                    if (!teacher.classes.includes(classId)) {
                        teacher.classes.push(classId);
                        await TeacherService.updateTeacher(teacher.id, {
                            classes: teacher.classes,
                        });
                    }
                }
            }

            return updatedClass;
        } catch (error) {
            console.error("Error assigning teachers to class:", error);
            throw error;
        }
    }

    // Remove students from class
    public async removeStudentsFromClass(
        classId: string,
        studentIds: string[]
    ): Promise<IClassData | null> {
        try {
            // Validate class exists
            const existingClass = await Class.findById(classId);
            if (!existingClass) {
                throw new Error("Class not found");
            }

            if (!existingClass.is_active || existingClass.is_deleted) {
                throw new Error("Class is not active or has been deleted");
            }

            // Get current student IDs
            const currentStudentIds = existingClass.student_ids || [];
            const studentsNotInClass = studentIds.filter(studentId => 
                !currentStudentIds.includes(studentId)
            );

            if (studentsNotInClass.length > 0) {
                throw new Error(`Students with IDs ${studentsNotInClass.join(", ")} are not assigned to this class`);
            }

            // Remove student IDs from class
            const updatedStudentIds = currentStudentIds.filter(studentId => 
                !studentIds.includes(studentId)
            );

            // Update class
            const updatedClass = await Class.findOneAndUpdate(
                {
                    id: classId,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    student_ids: updatedStudentIds,
                    student_count: updatedStudentIds.length,
                    updated_at: new Date(),
                },
                { new: true }
            );

            if (!updatedClass) {
                throw new Error("Failed to update class");
            }

            return updatedClass;
        } catch (error) {
            console.error("Error removing students from class:", error);
            throw error;
        }
    }

    // Remove teachers from class
    public async removeTeachersFromClass(
        classId: string,
        teacherIds: string[]
    ): Promise<IClassData | null> {
        try {
            // Validate class exists
            const existingClass = await Class.findById(classId);
            if (!existingClass) {
                throw new Error("Class not found");
            }

            if (!existingClass.is_active || existingClass.is_deleted) {
                throw new Error("Class is not active or has been deleted");
            }

            // Get current teacher IDs
            const currentTeacherIds = existingClass.teacher_ids || [];
            const teachersNotInClass = teacherIds.filter(teacherId => 
                !currentTeacherIds.includes(teacherId)
            );

            if (teachersNotInClass.length > 0) {
                throw new Error(`Teachers with IDs ${teachersNotInClass.join(", ")} are not assigned to this class`);
            }

            // Remove teacher IDs from class
            const updatedTeacherIds = currentTeacherIds.filter(teacherId => 
                !teacherIds.includes(teacherId)
            );

            // Update class
            const updatedClass = await Class.findOneAndUpdate(
                {
                    id: classId,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    teacher_ids: updatedTeacherIds,
                    updated_at: new Date(),
                },
                { new: true }
            );

            if (!updatedClass) {
                throw new Error("Failed to update class");
            }

            // Update each teacher's classes array
            for (const teacherId of teacherIds) {
                const teacher = await TeacherService.getTeacherById(teacherId);
                if (teacher && teacher.classes) {
                    const updatedClasses = teacher.classes.filter(id => id !== classId);
                    await TeacherService.updateTeacher(teacher.id, {
                        classes: updatedClasses,
                    });
                }
            }

            return updatedClass;
        } catch (error) {
            console.error("Error removing teachers from class:", error);
            throw error;
        }
    }

    // Get all assignments from all classes by campus
    public async getAllAssignmentsFromAllClasses(
        campusId: string
    ): Promise<IAssignmentData[]> {
        try {
            const assignments: {
                rows: IAssignmentData[];
            } = await Assignment.find(
                { campus_id: campusId },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            return assignments.rows;
        } catch (error) {
            console.error("Error fetching all assignments from all classes:", error);
            return [];
        }
    }

    // Get all students by academic year filtered by class_id
    public async getStudentsByYearAndClassId(
        campus_id: string,
        academic_year: string,
        class_id?: string
    ): Promise<{
        students: IUser[];
        academic_year: string;
        total_students: number;
        classes_included: IClassData[];
    }> {
        try {
            const classesQuery: any = {
                campus_id,
                academic_year,
                is_active: true,
                is_deleted: false,
            };

            // If class_id is provided, filter by specific class
            if (class_id) {
                classesQuery.id = class_id;
            }

            // Get classes for the specified academic year (and optionally specific class)
            const classes: {
                rows: IClassData[];
            } = await Class.find(classesQuery, {
                sort: {
                    name: "ASC",
                },
            });

            if (classes.rows.length === 0) {
                throw new Error(
                    class_id 
                        ? `No class found with ID: ${class_id} for academic year: ${academic_year}`
                        : `No classes found for academic year: ${academic_year}`
                );
            }

            // Collect all unique student IDs from all classes
            const studentIds = new Set<string>();
            for (const classData of classes.rows) {
                if (classData.student_ids && classData.student_ids.length > 0) {
                    for (const studentId of classData.student_ids) {
                        studentIds.add(studentId);
                    }
                }
            }

            if (studentIds.size === 0) {
                return {
                    students: [],
                    academic_year,
                    total_students: 0,
                    classes_included: classes.rows,
                };
            }

            // Get detailed student information
            const studentsData = await Promise.all(
                [...studentIds].map(async (studentId) => {
                    try {
                        return await UserService.getUser(studentId);
                    } catch (error) {
                        console.warn(`Failed to get student data for ID: ${studentId}`, error);
                        return null;
                    }
                })
            );

            // Filter out null values (failed to fetch students)
            const validStudents = studentsData.filter(student => student !== null) as IUser[];

            // Sort students by name
            validStudents.sort((a, b) => {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });

            return {
                students: validStudents,
                academic_year,
                total_students: validStudents.length,
                classes_included: classes.rows,
            };
        } catch (error) {
            console.error("Error fetching students by year and class ID:", error);
            throw error;
        }
    }

    // Get students grouped by class for a specific academic year
    public async getStudentsGroupedByClassForYear(
        campus_id: string,
        academic_year: string
    ): Promise<{
        academic_year: string;
        total_students: number;
        total_classes: number;
        classes: Array<{
            class_info: IClassData;
            students: IUser[];
            student_count: number;
        }>;
    }> {
        try {
            // Get all classes for the academic year
            const classes: {
                rows: IClassData[];
            } = await Class.find(
                {
                    campus_id,
                    academic_year,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    sort: {
                        name: "ASC",
                    },
                }
            );

            if (classes.rows.length === 0) {
                throw new Error(`No classes found for academic year: ${academic_year}`);
            }

            // Get students for each class
            const classesWithStudents = await Promise.all(
                classes.rows.map(async (classData) => {
                    let students: IUser[] = [];
                    
                    if (classData.student_ids && classData.student_ids.length > 0) {
                        const studentsData = await Promise.all(
                            classData.student_ids.map(async (studentId) => {
                                try {
                                    return await UserService.getUser(studentId);
                                } catch (error) {
                                    console.warn(`Failed to get student data for ID: ${studentId}`, error);
                                    return null;
                                }
                            })
                        );
                        
                        students = studentsData.filter(student => student !== null) as IUser[];
                        
                        // Sort students by name
                        students.sort((a, b) => {
                            const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                            const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                            return nameA.localeCompare(nameB);
                        });
                    }

                    return {
                        class_info: classData,
                        students,
                        student_count: students.length,
                    };
                })
            );

            // Calculate total students across all classes
            const totalStudents = classesWithStudents.reduce(
                (total, classWithStudents) => total + classWithStudents.student_count,
                0
            );

            return {
                academic_year,
                total_students: totalStudents,
                total_classes: classes.rows.length,
                classes: classesWithStudents,
            };
        } catch (error) {
            console.error("Error fetching students grouped by class for year:", error);
            throw error;
        }
    }

    // Get all unique academic years for a campus
    public async getAcademicYearsByCampus(campus_id: string): Promise<string[]> {
        try {
            const classes: {
                rows: IClassData[];
            } = await Class.find(
                {
                    campus_id,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    sort: {
                        academic_year: "DESC",
                    },
                }
            );

            if (classes.rows.length === 0) {
                return [];
            }

            // Get unique academic years
            const academicYears = [...new Set(classes.rows.map(classData => classData.academic_year))];
            
            return academicYears.sort().reverse(); // Most recent first
        } catch (error) {
            console.error("Error fetching academic years:", error);
            return [];
        }
    }

    // Grade an assignment submission
    public async gradeAssignmentSubmission(
        submission_id: string,
        grade: number,
        feedback?: string
    ): Promise<IAssignmentSubmission> {
        try {
            const submission = await AssignmentSubmission.findById(submission_id);
            
            if (!submission) {
                throw new Error("Assignment submission not found");
            }

            const updatedSubmission = await AssignmentSubmission.updateById(submission_id, {
                grade,
                feedback: feedback || submission.feedback,
                updated_at: new Date()
            });

            if (!updatedSubmission) {
                throw new Error("Failed to update assignment submission");
            }

            return updatedSubmission;
        } catch (error) {
            console.error("Error grading assignment submission:", error);
            throw error;
        }
    }

    // Get student assignments with submission status and grades
    public async getStudentAssignmentsWithSubmissions(
        student_id: string,
        campus_id: string
    ): Promise<Array<{
        assignment: IAssignmentData;
        submission: IAssignmentSubmission | null;
        status: string;
        class_info: {
            id: string;
            name: string;
            academic_year: string;
        };
    }>> {
        try {
            // First, get all classes the student is enrolled in
            const studentClasses: {
                rows: IClassData[];
            } = await Class.find({
                campus_id,
                student_ids: { $in: [student_id] },
                is_active: true,
                is_deleted: false,
            });

            if (studentClasses.rows.length === 0) {
                return [];
            }

            const assignments: Array<{
                assignment: IAssignmentData;
                submission: IAssignmentSubmission | null;
                status: string;
                class_info: {
                    id: string;
                    name: string;
                    academic_year: string;
                };
            }> = [];

            // For each class, get all assignments and check submission status
            for (const classData of studentClasses.rows) {
                const classAssignments: {
                    rows: IAssignmentData[];
                } = await Assignment.find({
                    campus_id,
                    class_id: classData.id,
                    is_active: true,
                    is_deleted: false,
                });

                for (const assignment of classAssignments.rows) {
                    // Check if student has submitted this assignment
                    const submission: {
                        rows: IAssignmentSubmission[];
                    } = await AssignmentSubmission.find({
                        assignment_id: assignment.id,
                        user_id: student_id,
                    });

                    let status = "not_submitted";
                    let submissionData: IAssignmentSubmission | null = null;

                    if (submission.rows.length > 0) {
                        submissionData = submission.rows[0];
                        
                        // Check if assignment is overdue
                        const currentDate = new Date();
                        const dueDate = new Date(assignment.due_date);
                        
                        if (submissionData.grade !== null && submissionData.grade !== undefined) {
                            status = "graded";
                        } else if (currentDate > dueDate) {
                            status = "overdue";
                        } else {
                            status = "submitted";
                        }
                    } else {
                        // Check if assignment is overdue
                        const currentDate = new Date();
                        const dueDate = new Date(assignment.due_date);
                        
                        if (currentDate > dueDate) {
                            status = "overdue";
                        }
                    }

                    assignments.push({
                        assignment,
                        submission: submissionData,
                        status,
                        class_info: {
                            id: classData.id,
                            name: classData.name,
                            academic_year: classData.academic_year
                        }
                    });
                }
            }

            // Sort by assignment due date (newest first)
            assignments.sort((a, b) => {
                const dateA = new Date(a.assignment.due_date);
                const dateB = new Date(b.assignment.due_date);
                return dateB.getTime() - dateA.getTime();
            });

            return assignments;
        } catch (error) {
            console.error("Error fetching student assignments with submissions:", error);
            throw error;
        }
    }

    // Update an assignment submission (for resubmission)
    public async updateAssignmentSubmission(
        submission_id: string,
        updateData: Partial<{
            submission_date: string;
            meta_data: object;
        }>
    ): Promise<IAssignmentSubmission> {
        try {
            const submission = await AssignmentSubmission.findById(submission_id);
            
            if (!submission) {
                throw new Error("Assignment submission not found");
            }

            const updatedSubmission = await AssignmentSubmission.updateById(submission_id, {
                ...updateData,
                submission_date: updateData.submission_date ? new Date(updateData.submission_date) : submission.submission_date,
                updated_at: new Date()
            });

            if (!updatedSubmission) {
                throw new Error("Failed to update assignment submission");
            }

            return updatedSubmission;
        } catch (error) {
            console.error("Error updating assignment submission:", error);
            throw error;
        }
    }

    // Get assignments due soon for a student
    public async getAssignmentsDueSoon(
        student_id: string,
        campus_id: string,
        daysAhead: number = 7
    ): Promise<Array<{
        assignment: IAssignmentData;
        days_until_due: number;
        is_submitted: boolean;
        class_info: {
            id: string;
            name: string;
            academic_year: string;
        };
    }>> {
        try {
            // Get current date and future date
            const currentDate = new Date();
            const futureDate = new Date();
            futureDate.setDate(currentDate.getDate() + daysAhead);

            // Get all classes the student is enrolled in
            const studentClasses: {
                rows: IClassData[];
            } = await Class.find({
                campus_id,
                student_ids: { $in: [student_id] },
                is_active: true,
                is_deleted: false,
            });

            if (studentClasses.rows.length === 0) {
                return [];
            }

            const dueSoonAssignments: Array<{
                assignment: IAssignmentData;
                days_until_due: number;
                is_submitted: boolean;
                class_info: {
                    id: string;
                    name: string;
                    academic_year: string;
                };
            }> = [];

            // For each class, get assignments due within the specified days
            for (const classData of studentClasses.rows) {
                const classAssignments: {
                    rows: IAssignmentData[];
                } = await Assignment.find({
                    campus_id,
                    class_id: classData.id,
                    is_active: true,
                    is_deleted: false,
                    due_date: {
                        $gte: currentDate.toISOString(),
                        $lte: futureDate.toISOString()
                    }
                });

                for (const assignment of classAssignments.rows) {
                    // Check if student has submitted this assignment
                    const submission: {
                        rows: IAssignmentSubmission[];
                    } = await AssignmentSubmission.find({
                        assignment_id: assignment.id,
                        user_id: student_id,
                    });

                    const isSubmitted = submission.rows.length > 0;
                    
                    // Calculate days until due
                    const dueDate = new Date(assignment.due_date);
                    const timeDiff = dueDate.getTime() - currentDate.getTime();
                    const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    dueSoonAssignments.push({
                        assignment,
                        days_until_due: daysUntilDue,
                        is_submitted: isSubmitted,
                        class_info: {
                            id: classData.id,
                            name: classData.name,
                            academic_year: classData.academic_year
                        }
                    });
                }
            }

            // Sort by days until due (most urgent first)
            dueSoonAssignments.sort((a, b) => a.days_until_due - b.days_until_due);

            return dueSoonAssignments;
        } catch (error) {
            console.error("Error fetching assignments due soon:", error);
            throw error;
        }
    }
}
