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
        // Convert date to start and end of day for filtering
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Approach 1: Get attendance records by class_id only, then filter by date
        try {
            const attendanceWithClassId = await Attendance.find({
                campus_id,
                class_id
            });
            
            // Filter by date on the application side
            const filteredAttendance = attendanceWithClassId.rows.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= startOfDay && recordDate <= endOfDay;
            });

            if (filteredAttendance.length > 0) {
                return filteredAttendance;
            }
        } catch (error) {
            // Continue to approach 2 if this fails
        }

        // Approach 2: Fallback - get class students and find their attendance
        try {
            const classData = await Class.findById(class_id);
            if (!classData || !classData.student_ids) {
                throw new Error("Class not found or has no students");
            }

            const attendancePromises = classData.student_ids.map(async (student) => {
                try {
                    // Query attendance by campus_id and user_id only, then filter by date
                    const userAttendance = await Attendance.find({
                        campus_id,
                        user_id: student,
                    });
                    
                    // Filter by date
                    const filtered = userAttendance.rows.filter(record => {
                        const recordDate = new Date(record.date);
                        return recordDate >= startOfDay && recordDate <= endOfDay;
                    });
                    
                    return filtered[0] || null; // Return first match or null
                } catch (error) {
                    return null;
                }
            });

            const attendances = await Promise.all(attendancePromises);
            const validAttendances = attendances.filter(attendance => attendance !== null);

            return validAttendances; // Return empty array if no records found
        } catch (error) {
            throw new Error("Unable to retrieve attendance records");
        }
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

    // Get all attendance for a specific class (without date filter)
    public static readonly getAttendanceByClassId = async (
        campus_id: string,
        class_id: string
    ): Promise<IAttendanceData[]> => {
        // Approach 1: Get attendance records by class_id
        try {
            const attendanceWithClassId = await Attendance.find({
                campus_id,
                class_id
            });

            if (attendanceWithClassId.rows.length > 0) {
                return attendanceWithClassId.rows;
            }
        } catch (error) {
            // Continue to approach 2 if this fails
        }

        // Approach 2: Fallback - get class students and find all their attendance
        try {
            const classData = await Class.findById(class_id);
            if (!classData || !classData.student_ids) {
                throw new Error("Class not found or has no students");
            }

            const attendancePromises = classData.student_ids.map(async (student) => {
                try {
                    // Query attendance by campus_id and user_id
                    const userAttendance = await Attendance.find({
                        campus_id,
                        user_id: student,
                    });
                    
                    return userAttendance.rows || [];
                } catch (error) {
                    return [];
                }
            });

            const attendanceArrays = await Promise.all(attendancePromises);
            const allAttendances = attendanceArrays.flat(); // Flatten the array of arrays

            return allAttendances;
        } catch (error) {
            throw new Error("Unable to retrieve attendance records");
        }
    };

    // Get attendance statistics by teacher ID
    public static readonly getAttendanceStatsByTeacherId = async (
        campus_id: string,
        teacher_id: string,
        date?: Date
    ) => {
        try {
            // Use today's date if no date is provided
            const targetDate = date || new Date();
            const startOfDay = new Date(targetDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            
            const endOfDay = new Date(targetDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            // Get all classes for the campus first, then filter by teacher
            const allClasses = await Class.find({
                campus_id,
                is_active: true,
                is_deleted: false
            });

            if (!allClasses.rows || allClasses.rows.length === 0) {
                return {
                    total_classes: 0,
                    completed_today: 0,
                    pending_today: 0,
                    average_attendance: 0,
                    classes: [],
                    debug: "No classes found for campus"
                };
            }

            // Filter classes where teacher is involved
            const teacherClasses = allClasses.rows.filter(classData => {
                return classData.class_teacher_id === teacher_id || 
                       (classData.teacher_ids && classData.teacher_ids.includes(teacher_id));
            });

            if (teacherClasses.length === 0) {
                return {
                    total_classes: 0,
                    completed_today: 0,
                    pending_today: 0,
                    average_attendance: 0,
                    classes: [],
                    debug: `No classes found for teacher ${teacher_id}. Total classes in campus: ${allClasses.rows.length}`
                };
            }

            const totalClasses = teacherClasses.length;
            let completedToday = 0;
            let pendingToday = 0;
            let totalAttendanceRate = 0;
            let classesWithAttendance = 0;

            const classStatsPromises = teacherClasses.map(async (classData) => {
                try {
                    // First try to get attendance by class_id and date range
                    let classAttendance: { rows: IAttendanceData[] } = { rows: [] };
                    
                    try {
                        classAttendance = await Attendance.find({
                            campus_id,
                            class_id: classData.id,
                            date: {
                                $gte: startOfDay,
                                $lte: endOfDay
                            }
                        });
                    } catch (error) {
                        // If class_id query fails, try getting attendance by students
                        if (classData.student_ids && classData.student_ids.length > 0) {
                            const studentAttendancePromises = classData.student_ids.map(async (studentId) => {
                                try {
                                    const studentAttendance = await Attendance.find({
                                        campus_id,
                                        user_id: studentId,
                                        date: {
                                            $gte: startOfDay,
                                            $lte: endOfDay
                                        }
                                    });
                                    return studentAttendance.rows || [];
                                } catch (err) {
                                    return [];
                                }
                            });
                            
                            const studentAttendanceArrays = await Promise.all(studentAttendancePromises);
                            classAttendance = { rows: studentAttendanceArrays.flat() };
                        }
                    }

                    const hasAttendanceToday = classAttendance.rows && classAttendance.rows.length > 0;
                    
                    if (hasAttendanceToday) {
                        completedToday++;
                        
                        // Calculate attendance rate for this class
                        const presentCount = classAttendance.rows.filter(att => att.status === 'present').length;
                        const totalStudents = classData.student_count || classData.student_ids?.length || 0;
                        
                        if (totalStudents > 0) {
                            const attendanceRate = (presentCount / totalStudents) * 100;
                            totalAttendanceRate += attendanceRate;
                            classesWithAttendance++;
                        }

                        return {
                            class_id: classData.id,
                            class_name: classData.name,
                            status: 'completed',
                            present_count: presentCount,
                            total_students: totalStudents,
                            attendance_rate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0,
                            last_updated: classAttendance.rows[0]?.updated_at
                        };
                    } else {
                        pendingToday++;
                        
                        return {
                            class_id: classData.id,
                            class_name: classData.name,
                            status: 'pending',
                            present_count: 0,
                            total_students: classData.student_count || classData.student_ids?.length || 0,
                            attendance_rate: 0,
                            last_updated: null
                        };
                    }
                } catch (error) {
                    pendingToday++;
                    return {
                        class_id: classData.id,
                        class_name: classData.name,
                        status: 'incomplete',
                        present_count: 0,
                        total_students: classData.student_count || classData.student_ids?.length || 0,
                        attendance_rate: 0,
                        last_updated: null,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            });

            const classStats = await Promise.all(classStatsPromises);

            // Calculate average attendance
            const averageAttendance = classesWithAttendance > 0 
                ? Math.round(totalAttendanceRate / classesWithAttendance) 
                : 0;

            return {
                total_classes: totalClasses,
                completed_today: completedToday,
                pending_today: pendingToday,
                average_attendance: averageAttendance,
                date: targetDate.toISOString().split('T')[0],
                classes: classStats
            };

        } catch (error) {
            throw new Error(`Unable to retrieve attendance statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
}
