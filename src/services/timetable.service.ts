import { ITimetable, Timetable } from "@/models/time_table.model";

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

        return data.rows;
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

        return data.rows;
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
}
