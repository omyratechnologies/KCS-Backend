import { Attendance, IAttendanceData } from "@/models/attendance.model";
import { Class } from "@/models/class.model";

export class AttendanceService {
    // Enhanced Mark Attendance - supports both single and bulk operations
    public static readonly markAttendance = async ({
        campus_id,
        date,
        status,
        user_id,
        user_ids,
        class_id,
        user_type = "Student",
    }: {
        campus_id: string;
        date: Date;
        status: "present" | "absent" | "late" | "leave";
        user_id?: string; // For single user (backwards compatibility)
        user_ids?: string[]; // For multiple users
        class_id?: string; // Optional class association
        user_type?: "Student" | "Teacher";
    }) => {
        // Validate user_type
        if (!["Student", "Teacher"].includes(user_type)) {
            throw new Error("user_type must be either 'Student' or 'Teacher'");
        }

        // Determine which users to process
        let usersToProcess: string[] = [];
        
        if (user_ids && user_ids.length > 0) {
            // Bulk operation
            usersToProcess = user_ids;
        } else if (user_id) {
            // Single operation (backwards compatibility)
            usersToProcess = [user_id];
        } else {
            throw new Error("Either user_id or user_ids must be provided");
        }

        // Validate that we have users to process
        if (usersToProcess.length === 0) {
            throw new Error("No users provided for attendance marking");
        }

        // Process attendance for all users
        const attendanceResults: IAttendanceData[] = [];
        const errors: Array<{ user_id: string; error: string }> = [];

        for (const userId of usersToProcess) {
            try {
                const attendance = await Attendance.create({
                    campus_id,
                    user_id: userId,
                    class_id,
                    date,
                    status,
                    user_type,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
                attendanceResults.push(attendance);
            } catch (error) {
                errors.push({
                    user_id: userId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            success: attendanceResults,
            errors: errors,
            total_processed: usersToProcess.length,
            successful_count: attendanceResults.length,
            error_count: errors.length,
        };
    };

    // Enhanced Bulk Mark Attendance - dedicated method for bulk operations
    public static readonly markBulkAttendance = async ({
        campus_id,
        date,
        class_id,
        attendances,
    }: {
        campus_id: string;
        date: Date;
        class_id?: string;
        attendances: Array<{
            user_id: string;
            status: "present" | "absent" | "late" | "leave";
            user_type?: "Student" | "Teacher";
        }>;
    }) => {
        if (!attendances || attendances.length === 0) {
            throw new Error("No attendance data provided");
        }

        const attendanceResults: IAttendanceData[] = [];
        const errors: Array<{ user_id: string; error: string }> = [];

        for (const attendanceData of attendances) {
            try {
                // Validate user_type
                const userType = attendanceData.user_type || "Student";
                if (!["Student", "Teacher"].includes(userType)) {
                    throw new Error("user_type must be either 'Student' or 'Teacher'");
                }

                const attendance = await Attendance.create({
                    campus_id,
                    user_id: attendanceData.user_id,
                    class_id,
                    date,
                    status: attendanceData.status,
                    user_type: userType,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
                attendanceResults.push(attendance);
            } catch (error) {
                errors.push({
                    user_id: attendanceData.user_id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            success: attendanceResults,
            errors: errors,
            total_processed: attendances.length,
            successful_count: attendanceResults.length,
            error_count: errors.length,
        };
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
                user_type?: "Student" | "Teacher";
            };
        }
    ) => {
        // Validate user_type if provided
        if (data.user_type && !["Student", "Teacher"].includes(data.user_type)) {
            throw new Error("user_type must be either 'Student' or 'Teacher'");
        }

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
        // Approach 1: If attendance records have class_id
        const attendanceWithClassId = await Attendance.find({
            campus_id,
            class_id,
            date,
        });

        if (attendanceWithClassId.rows.length > 0) {
            return attendanceWithClassId.rows;
        }

        // Approach 2: Fallback - get class students and find their attendance
        const classData = await Class.findById(class_id);
        if (!classData || !classData.student_ids) {
            throw new Error("Class not found or has no students");
        }

        const students = classData.student_ids;
        const attendancePromises = students.map(async (student) => {
            return await Attendance.findOne({
                campus_id,
                user_id: student,
                date,
            });
        });

        const attendances = await Promise.all(attendancePromises);
        const validAttendances = attendances.filter(attendance => attendance !== null);

        if (validAttendances.length === 0) {
            throw new Error("No attendances found for this class on the specified date");
        }

        return validAttendances;
    };

    // Dedicated method for marking class attendance
    public static readonly markClassAttendance = async ({
        campus_id,
        class_id,
        date,
        attendances,
    }: {
        campus_id: string;
        class_id: string;
        date: Date;
        attendances: Array<{
            user_id: string;
            status: "present" | "absent" | "late" | "leave";
            user_type?: "Student" | "Teacher";
        }>;
    }) => {
        if (!attendances || attendances.length === 0) {
            throw new Error("No attendance data provided");
        }

        // Verify class exists
        const classData = await Class.findById(class_id);
        if (!classData) {
            throw new Error("Class not found");
        }

        const attendanceResults: IAttendanceData[] = [];
        const errors: Array<{ user_id: string; error: string }> = [];

        for (const attendanceData of attendances) {
            try {
                // Validate user_type
                const userType = attendanceData.user_type || "Student";
                if (!["Student", "Teacher"].includes(userType)) {
                    throw new Error("user_type must be either 'Student' or 'Teacher'");
                }

                // Verify user is part of the class (for students)
                if (userType === "Student" && !classData.student_ids.includes(attendanceData.user_id)) {
                    throw new Error("Student is not enrolled in this class");
                }

                const attendance = await Attendance.create({
                    campus_id,
                    user_id: attendanceData.user_id,
                    class_id,
                    date,
                    status: attendanceData.status,
                    user_type: userType,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
                attendanceResults.push(attendance);
            } catch (error) {
                errors.push({
                    user_id: attendanceData.user_id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            success: attendanceResults,
            errors: errors,
            total_processed: attendances.length,
            successful_count: attendanceResults.length,
            error_count: errors.length,
            class_id,
        };
    };
}
