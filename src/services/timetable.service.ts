import { ITimetable, Timetable } from "@/models/time_table.model";
import { Subject } from "@/models/subject.model";
import { Teacher } from "@/models/teacher.model";
import { Class } from "@/models/class.model";
import { User } from "@/models/user.model";

export class TimetableService {
    // Create
    public static readonly createTimetableBulk = async (
        campus_id: string,
        class_id: string,
        timetableData: {
            subject_id: string;
            teacher_id: string;
            day: string;
            start_time: string;
            end_time: string;
            meta_data: string;
        }[]
    ) => {
        for (const data of timetableData) {
            await Timetable.create({
                campus_id,
                class_id,
                ...data,
                is_active: true,
                is_deleted: false,
                is_suspended: false,
                is_adjourned: false,
                is_cancelled: false,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        return "Timetable created successfully";
    };

    // Read by Campus ID and Class ID
    public static readonly getTimetableByCampusAndClass = async (
        campus_id: string,
        class_id: string
    ) => {
        const data: {
            rows: ITimetable[];
        } = await Timetable.find(
            {
                campus_id,
                class_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        // Enrich timetable data with subject names and teacher names
        const enrichedTimetable = await Promise.all(
            data.rows.map(async (timetableItem) => {
                try {
                    // Fetch subject information
                    const subject = await Subject.findById(timetableItem.subject_id);
                    
                    // Fetch teacher information
                    const teacher = await Teacher.findById(timetableItem.teacher_id);
                    let teacherName = "Unknown Teacher";
                    
                    if (teacher?.user_id) {
                        const user = await User.findById(teacher.user_id);
                        if (user) {
                            teacherName = `${user.first_name} ${user.last_name}`.trim();
                        }
                    }
                    
                    return {
                        ...timetableItem,
                        subject_name: subject?.name || "Unknown Subject",
                        teacher_name: teacherName,
                    };
                } catch (error) {
                    return {
                        ...timetableItem,
                        subject_name: "Unknown Subject",
                        teacher_name: "Unknown Teacher",
                    };
                }
            })
        );

        return enrichedTimetable;
    };

    // Read by Campus ID and Teacher ID
    public static readonly getTimetableByCampusAndTeacher = async (
        campus_id: string,
        teacher_id: string
    ) => {
        const data: {
            rows: ITimetable[];
        } = await Timetable.find(
            {
                campus_id,
                teacher_id,
                is_deleted: false,
            },
            {
                sort: {
                    day: "ASC",
                    start_time: "ASC",
                },
            }
        );

        // Enrich timetable data with subject names
        const enrichedTimetable = await Promise.all(
            data.rows.map(async (timetableItem) => {
                try {
                    const subject = await Subject.findById(timetableItem.subject_id);
                    const classInfo = await Class.findById(timetableItem.class_id);
                    return {
                        ...timetableItem,
                        class_name: classInfo?.name || "Unknown Class",
                        subject_name: subject?.name || "Unknown Subject",
                    };
                } catch (error) {
                    return {
                        ...timetableItem,
                        class_name: "Unknown Class",
                        subject_name: "Unknown Subject",
                    };
                }
            })
        );

        return enrichedTimetable;
    };

    // Update by ID
    public static readonly updateTimetableById = async (
        id: string,
        data: Partial<ITimetable>
    ) => {
        return await Timetable.updateById(id, {
            ...data,
            updated_at: new Date(),
        });
    };

    // Delete by ID
    public static readonly deleteTimetableById = async (id: string) => {
        return await Timetable.updateById(id, {
            is_deleted: true,
            updated_at: new Date(),
        });
    }
}
