import { Class } from "@/models/class.model";
import { ExamTimetable } from "@/models/exam_timetable.model";
import { ExamTerm } from "@/models/exam_term.model";
import { Subject } from "@/models/subject.model";
import { Teacher } from "@/models/teacher.model";
import { User } from "@/models/user.model";

export class ExamTimetableService {
    // Create exam timetable
    public static readonly createExamTimetable = async (
        campus_id: string,
        data: {
            exam_term_id: string;
            exam_name: string;
            class_id: string; // Single class - one timetable per class
            start_date: Date;
            end_date: Date;
            subjects: Array<{
                subject_id: string;
                exam_date: Date;
                start_time: string;
                end_time: string;
                room?: string;
                invigilator_ids?: string[];
            }>;
            meta_data?: object;
        }
    ) => {
        // Validate exam term exists
        const examTerm = await ExamTerm.findById(data.exam_term_id);
        if (!examTerm) {
            throw new Error("Exam term not found");
        }

        // Validate the class exists and belongs to the term
        const classExists = await Class.findById(data.class_id);
        if (!classExists) {
            throw new Error(`Class with ID ${data.class_id} not found`);
        }
        if (classExists.campus_id !== campus_id) {
            throw new Error(`Class with ID ${data.class_id} does not belong to this campus`);
        }

        // Check if class is in the exam term's class list
        if (!examTerm.class_ids.includes(data.class_id)) {
            throw new Error(`Class with ID ${data.class_id} is not part of this exam term`);
        }

        // Check if timetable already exists for this class and term
        const existingTimetable = await ExamTimetable.find({
            campus_id,
            exam_term_id: data.exam_term_id,
            is_deleted: false,
        });

        for (const existing of existingTimetable.rows) {
            if (existing.class_ids.includes(data.class_id)) {
                throw new Error(`Exam timetable already exists for this class in this term`);
            }
        }

        // Validate subjects exist
        for (const subject of data.subjects) {
            const subjectExists = await Subject.findById(subject.subject_id);
            if (!subjectExists) {
                throw new Error(`Subject with ID ${subject.subject_id} not found`);
            }
        }

        // Check for schedule conflicts with existing timetables for this class
        for (const existing of existingTimetable.rows) {
            if (!existing.class_ids.includes(data.class_id)) continue;

            const hasOverlap =
                (data.start_date >= existing.start_date && data.start_date <= existing.end_date) ||
                (data.end_date >= existing.start_date && data.end_date <= existing.end_date) ||
                (data.start_date <= existing.start_date && data.end_date >= existing.end_date);

            if (hasOverlap) {
                throw new Error(`Exam timetable overlaps with existing timetable: ${existing.exam_name}`);
            }
        }

        const examTimetable = await ExamTimetable.create({
            campus_id,
            exam_term_id: data.exam_term_id,
            exam_name: data.exam_name,
            class_ids: [data.class_id], // Store as array with single class
            start_date: data.start_date,
            end_date: data.end_date,
            subjects: data.subjects,
            is_published: false,
            is_active: true,
            is_deleted: false,
            meta_data: data.meta_data || {},
            created_at: new Date(),
            updated_at: new Date(),
        });

        return examTimetable;
    };

    // Get all exam timetables by campus
    public static readonly getExamTimetablesByCampus = async (campus_id: string) => {
        const examTimetables = await ExamTimetable.find({
            campus_id,
            is_deleted: false,
        });

        // Check if no results found
        if (!examTimetables || !examTimetables.rows || examTimetables.rows.length === 0) {
            return [];
        }

        // Enrich with exam term, class, and subject information
        const enrichedTimetables = await Promise.all(
            examTimetables.rows.map(async (timetable) => {
                return await this.enrichExamTimetable(timetable);
            })
        );

        return enrichedTimetables;
    };

    // Enrich exam timetable with related data
    private static readonly enrichExamTimetable = async (timetable: {
        id: string;
        campus_id: string;
        exam_term_id: string;
        exam_name: string;
        class_ids: string[];
        start_date: Date;
        end_date: Date;
        subjects: Array<{
            subject_id: string;
            exam_date: Date;
            start_time: string;
            end_time: string;
            room?: string;
            invigilator_ids?: string[];
        }>;
        is_published: boolean;
        is_active: boolean;
        is_deleted: boolean;
        meta_data: object;
        created_at: Date;
        updated_at: Date;
    }) => {
        try {
            const examTerm = await ExamTerm.findById(timetable.exam_term_id);
            const classes = await Promise.all(
                (timetable.class_ids || []).map(async (class_id: string) => {
                    try {
                        const classInfo = await Class.findById(class_id);
                        return {
                            id: class_id,
                            name: classInfo?.name || "Unknown Class",
                        };
                    } catch (error) {
                        return {
                            id: class_id,
                            name: "Unknown Class",
                        };
                    }
                })
            );

            // Enrich subjects with subject details
            const enrichedSubjects = await Promise.all(
                (timetable.subjects || []).map(
                    async (subjectSchedule: {
                        subject_id: string;
                        exam_date: Date;
                        start_time: string;
                        end_time: string;
                        room?: string;
                        invigilator_ids?: string[];
                    }) => {
                        try {
                            const subject = await Subject.findById(subjectSchedule.subject_id);
                            
                            // Enrich invigilators with teacher details
                            let invigilators: Array<{ id: string; name: string }> = [];
                            if (subjectSchedule.invigilator_ids?.length) {
                                invigilators = await Promise.all(
                                    subjectSchedule.invigilator_ids.map(async (invigilatorId: string) => {
                                        try {
                                            const teacher = await Teacher.findById(invigilatorId);
                                            if (teacher?.user_id) {
                                                const user = await User.findById(teacher.user_id);
                                                return {
                                                    id: invigilatorId,
                                                    name: user 
                                                        ? `${user.first_name} ${user.last_name}`
                                                        : "Unknown Teacher",
                                                };
                                            }
                                            return {
                                                id: invigilatorId,
                                                name: "Unknown Teacher",
                                            };
                                        } catch (error) {
                                            return {
                                                id: invigilatorId,
                                                name: "Unknown Teacher",
                                            };
                                        }
                                    })
                                );
                            }
                            
                            return {
                                ...subjectSchedule,
                                subject_code: subject?.code || "Unknown Code",
                                subject_name: subject?.name || "Unknown Subject",
                                credits: (subject?.meta_data as { credits?: number })?.credits || 0,
                                invigilators,
                            };
                        } catch (error) {
                            return {
                                ...subjectSchedule,
                                subject_code: "Unknown Code",
                                subject_name: "Unknown Subject",
                                credits: 0,
                                invigilators: [],
                            };
                        }
                    }
                )
            );

            return {
                ...timetable,
                exam_term: {
                    id: examTerm?.id,
                    name: examTerm?.name || "Unknown Term",
                    start_date: examTerm?.start_date,
                    end_date: examTerm?.end_date,
                },
                classes,
                subjects: enrichedSubjects,
            };
        } catch (error) {
            // If enrichment fails, return basic timetable data
            return {
                ...timetable,
                exam_term: {
                    id: timetable.exam_term_id,
                    name: "Unknown Term",
                    start_date: null,
                    end_date: null,
                },
                classes: (timetable.class_ids || []).map(id => ({
                    id,
                    name: "Unknown Class"
                })),
                subjects: (timetable.subjects || []).map(subject => ({
                    ...subject,
                    subject_code: "Unknown Code",
                    subject_name: "Unknown Subject",
                    credits: 0,
                    invigilators: [],
                })),
            };
        }
    };

    // Get exam timetable by ID
    public static readonly getExamTimetableById = async (id: string) => {
        const examTimetable = await ExamTimetable.findById(id);
        if (!examTimetable) {
            throw new Error("Exam timetable not found");
        }

        return await this.enrichExamTimetable(examTimetable);
    };

    // Get exam timetables by exam term
    public static readonly getExamTimetablesByExamTerm = async (exam_term_id: string) => {
        // check if exam term exists
        const examTermExists = await ExamTerm.findById(exam_term_id);
        if (!examTermExists) {
            throw new Error("Exam term not found");
        }

        const examTimetables = await ExamTimetable.find({
            exam_term_id,
            is_deleted: false,
        });

        // Check if no results found
        if (!examTimetables || !examTimetables.rows || examTimetables.rows.length === 0) {
            return [];
        }

        // Enrich with related data
        const enrichedTimetables = await Promise.all(
            examTimetables.rows.map(async (timetable) => {
                return await this.enrichExamTimetable(timetable);
            })
        );

        return enrichedTimetables;
    };

    // Get published exam timetables for students/parents
    public static readonly getPublishedExamTimetables = async (campus_id: string) => {
        const examTimetables = await ExamTimetable.find({
            campus_id,
            is_published: true,
            is_deleted: false,
        });

        // Check if no results found
        if (!examTimetables || !examTimetables.rows || examTimetables.rows.length === 0) {
            return [];
        }

        // Enrich with related data
        const enrichedTimetables = await Promise.all(
            examTimetables.rows.map(async (timetable) => {
                return await this.enrichExamTimetable(timetable);
            })
        );

        return enrichedTimetables;
    };

    // Update exam timetable
    public static readonly updateExamTimetable = async (
        id: string,
        data: {
            exam_name?: string;
            class_ids?: string[];
            start_date?: Date;
            end_date?: Date;
            subjects?: Array<{
                subject_id: string;
                exam_date: Date;
                start_time: string;
                end_time: string;
                room?: string;
                invigilator_ids?: string[];
            }>;
            is_published?: boolean;
            meta_data?: object;
        }
    ) => {
        const examTimetable = await ExamTimetable.findById(id);
        if (!examTimetable) {
            throw new Error("Exam timetable not found");
        }

        // Validate classes if provided
        if (data.class_ids) {
            for (const class_id of data.class_ids) {
                const classExists = await Class.findById(class_id);
                if (!classExists) {
                    throw new Error(`Class with ID ${class_id} not found`);
                }
            }
        }

        // Validate subjects if provided
        if (data.subjects) {
            for (const subject of data.subjects) {
                const subjectExists = await Subject.findById(subject.subject_id);
                if (!subjectExists) {
                    throw new Error(`Subject with ID ${subject.subject_id} not found`);
                }
            }
        }

        // Update fields
        if (data.exam_name !== undefined) {
            examTimetable.exam_name = data.exam_name;
        }
        if (data.class_ids !== undefined) {
            examTimetable.class_ids = data.class_ids;
        }
        if (data.start_date !== undefined) {
            examTimetable.start_date = data.start_date;
        }
        if (data.end_date !== undefined) {
            examTimetable.end_date = data.end_date;
        }
        if (data.subjects !== undefined) {
            examTimetable.subjects = data.subjects;
        }
        if (data.is_published !== undefined) {
            examTimetable.is_published = data.is_published;
        }
        if (data.meta_data !== undefined) {
            examTimetable.meta_data = data.meta_data;
        }

        examTimetable.updated_at = new Date();

        const updatedTimetable = await ExamTimetable.updateById(examTimetable.id, examTimetable);
        return updatedTimetable;
    };

    // Publish exam timetable
    public static readonly publishExamTimetable = async (id: string) => {
        const examTimetable = await ExamTimetable.findById(id);
        if (!examTimetable) {
            throw new Error("Exam timetable not found");
        }

        examTimetable.is_published = true;
        examTimetable.updated_at = new Date();

        const updatedTimetable = await ExamTimetable.updateById(id, {
            is_published: true,
            updated_at: new Date(),
        });
        return updatedTimetable;
    };

    // Unpublish exam timetable
    public static readonly unpublishExamTimetable = async (id: string) => {
        const examTimetable = await ExamTimetable.findById(id);
        if (!examTimetable) {
            throw new Error("Exam timetable not found");
        }

        examTimetable.is_published = false;
        examTimetable.updated_at = new Date();

        const updatedTimetable = await ExamTimetable.updateById(id, {
            is_published: false,
            updated_at: new Date(),
        });
        return updatedTimetable;
    };

    // Delete exam timetable (soft delete)
    public static readonly deleteExamTimetable = async (id: string) => {
        const examTimetable = await ExamTimetable.findById(id);
        if (!examTimetable) {
            throw new Error("Exam timetable not found");
        }

        examTimetable.is_deleted = true;
        examTimetable.is_active = false;
        examTimetable.updated_at = new Date();

        const updatedTimetable = await ExamTimetable.updateById(id, {
            is_deleted: true,
            is_active: false,
            updated_at: new Date(),
        });
        return updatedTimetable;
    };

    // Get exam timetable for a specific class
    public static readonly getExamTimetableByClass = async (campus_id: string, class_id: string, isAdmin: boolean = false, isSuperAdmin: boolean = false) => {
        // check if class exists
        const classExists = await Class.findById(class_id);
        if (!classExists) {
            throw new Error("Class not found");
        }

        // Security check: Verify the class belongs to the requesting user's campus
        // Super Admin has unrestricted access to all campuses
        if (!isSuperAdmin && classExists.campus_id !== campus_id) {
            throw new Error("Access denied: This class does not belong to your campus");
        }

        // For Super Admin accessing other campuses, use the class's actual campus_id
        const queryCampusId = isSuperAdmin ? classExists.campus_id : campus_id;

        // Build query - admins see all timetables, others see only published ones
        const query: {
            campus_id: string;
            is_deleted: boolean;
            is_published?: boolean;
        } = {
            campus_id: queryCampusId,
            is_deleted: false,
        };

        // Only filter by is_published for non-admin users
        if (!isAdmin) {
            query.is_published = true;
        }

        const examTimetables = await ExamTimetable.find(query);

        // Check if no results found
        if (!examTimetables || !examTimetables.rows || examTimetables.rows.length === 0) {
            return [];
        }

        const filteredTimetables = examTimetables.rows.filter((timetable) => 
            timetable.class_ids && timetable.class_ids.includes(class_id)
        );

        // Check if no filtered results
        if (filteredTimetables.length === 0) {
            return [];
        }

        // Enrich with related data
        const enrichedTimetables = await Promise.all(
            filteredTimetables.map(async (timetable) => {
                return await this.enrichExamTimetable(timetable);
            })
        );

        return enrichedTimetables;
    };

    // Check for schedule conflicts
    public static readonly checkScheduleConflicts = async (
        campus_id: string,
        exam_date: Date,
        start_time: string,
        end_time: string,
        exclude_id?: string
    ) => {
        const examTimetables = await ExamTimetable.find({
            campus_id,
            is_deleted: false,
        });

        const conflicts: Array<{
            timetable_id: string;
            exam_name: string;
            subject_name: string;
            conflicting_time: string;
        }> = [];

        // Check if no results found
        if (!examTimetables || !examTimetables.rows || examTimetables.rows.length === 0) {
            return {
                has_conflicts: false,
                conflicts: [],
            };
        }

        for (const timetable of examTimetables.rows) {
            if (exclude_id && timetable.id === exclude_id) {
                continue;
            }

            for (const subject of timetable.subjects) {
                const subjectDate = new Date(subject.exam_date);
                if (
                    subjectDate.toDateString() === exam_date.toDateString() &&
                    ((start_time >= subject.start_time && start_time < subject.end_time) ||
                        (end_time > subject.start_time && end_time <= subject.end_time) ||
                        (start_time <= subject.start_time && end_time >= subject.end_time))
                ) {
                    conflicts.push({
                        timetable_id: timetable.id,
                        exam_name: timetable.exam_name,
                        subject_name: subject.subject_name,
                        conflicting_time: `${subject.start_time} - ${subject.end_time}`,
                    });
                }
            }
        }

        return {
            has_conflicts: conflicts.length > 0,
            conflicts,
        };
    };
}
