import { Attendance, IAttendanceData } from "@/models/attendance.model";
import { Class } from "@/models/class.model";

export class AttendanceService {
    // Mark
    public static readonly markAttendance = async ({
        campus_id,
        date,
        status,
        user_id,
    }: {
        campus_id: string;
        date: Date;
        status: "present" | "absent" | "late" | "leave";
        user_id: string;
    }) => {
        return await Attendance.create({
            campus_id,
            user_id,
            date,
            status,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // Update
    public static readonly updateAttendance = async (
        {
            user_id,
            campus_id,
            date,
        }: {
            user_id: string;
            campus_id: string;
            date: Date;
        },
        {
            data,
        }: {
            data: {
                status?: "present" | "absent" | "late" | "leave";
            };
        }
    ) => {
        const updatedAttendance = await Attendance.findOneAndUpdate(
            {
                user_id,
                campus_id,
                date,
            },
            {
                ...data,
                updated_at: new Date(),
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!updatedAttendance) {
            throw new Error("Attendance not updated");
        }

        return updatedAttendance;
    };

    // Get for a date for a campus
    public static readonly getAttendancesByDate = async (
        campus_id: string,
        date: Date
    ): Promise<IAttendanceData[]> => {
        const data = await Attendance.find(
            {
                campus_id,
                date,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            throw new Error("No attendances found");
        }

        return data.rows;
    };

    // Get attendance for user_id
    public static readonly getAttendanceByUserId = async (
        campus_id: string,
        user_id: string
    ): Promise<IAttendanceData[]> => {
        const data = await Attendance.find(
            {
                user_id,
                campus_id,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            throw new Error("No attendances found");
        }

        return data.rows;
    };

    // Get attendance for campus_id
    public static readonly getAttendanceByCampusId = async (
        campus_id: string,
        from_date: Date,
        to_date: Date
    ): Promise<IAttendanceData[]> => {
        const data: {
            rows: IAttendanceData[];
        } = await Attendance.find(
            {
                campus_id,
                date: {
                    $gte: from_date,
                    $lte: to_date,
                },
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            throw new Error("No attendances found");
        }

        return data.rows;
    };

    // Get attendance for campus_id, class_id and date
    public static readonly getAttendanceByClassIdAndDate = async (
        campus_id: string,
        class_id: string,
        date: Date
    ): Promise<IAttendanceData[]> => {
        const classData = await Class.findById(class_id);

        const students = classData.student_ids;

        const attendancePromises = students.map(async (student) => {
            return await Attendance.findOne({
                campus_id,
                class_id,
                user_id: student,
                date,
            });
        });

        const attendances = await Promise.all(attendancePromises);

        if (attendances.length === 0) {
            throw new Error("No attendances found");
        }

        return attendances;
    };
}
