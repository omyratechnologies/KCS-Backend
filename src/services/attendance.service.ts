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
                    error: error instanceof Error ? error.message : "Unknown error",
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
                    error: error instanceof Error ? error.message : "Unknown error",
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
        } catch {
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
                    const filtered = userAttendance.rows.find(record => {
                        const recordDate = new Date(record.date);
                        return recordDate >= startOfDay && recordDate <= endOfDay;
                    });
                    
                    return filtered || null; // Return first match or null
                } catch {
                    return null;
                }
            });

            const attendances = await Promise.all(attendancePromises);
            return attendances.filter(attendance => attendance !== null); // Return empty array if no records found
        } catch {
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
                    error: error instanceof Error ? error.message : "Unknown error",
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
        } catch {
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
                } catch {
                    return [];
                }
            });

            const attendanceArrays = await Promise.all(attendancePromises);
            // Flatten the array of arrays

            return attendanceArrays.flat();
        } catch {
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
                    } catch {
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
                                } catch {
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
                        const presentCount = classAttendance.rows.filter(att => att.status === "present").length;
                        const totalStudents = classData.student_count || classData.student_ids?.length || 0;
                        
                        if (totalStudents > 0) {
                            const attendanceRate = (presentCount / totalStudents) * 100;
                            totalAttendanceRate += attendanceRate;
                            classesWithAttendance++;
                        }

                        return {
                            class_id: classData.id,
                            class_name: classData.name,
                            status: "completed",
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
                            status: "pending",
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
                        status: "incomplete",
                        present_count: 0,
                        total_students: classData.student_count || classData.student_ids?.length || 0,
                        attendance_rate: 0,
                        last_updated: null,
                        error: error instanceof Error ? error.message : "Unknown error"
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
                date: targetDate.toISOString().split("T")[0],
                classes: classStats
            };

        } catch (error) {
            throw new Error(`Unable to retrieve attendance statistics: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    // Get comprehensive attendance report for a class
    public static readonly getClassAttendanceReport = async (
        campus_id: string,
        class_id: string,
        from_date?: Date,
        to_date?: Date
    ) => {
        try {
            // Set default date range if not provided (last 30 days)
            const endDate = to_date || new Date();
            const startDate = from_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            // Get class details
            const classData = await Class.findById(class_id);
            if (!classData || !classData.student_ids || classData.student_ids.length === 0) {
                throw new Error("Class not found or has no students");
            }

            // Get all students in the class
            const { User } = await import("@/models/user.model");
            const studentPromises = classData.student_ids.map(async (studentId) => {
                try {
                    return await User.findById(studentId);
                } catch {
                    return null;
                }
            });

            const students = (await Promise.all(studentPromises)).filter(student => student !== null);

            // Calculate total class days (excluding weekends for now)
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Get attendance data for all students
            const attendanceReportPromises = students.map(async (student) => {
                try {
                    // Get all attendance records for this student in the date range
                    const studentAttendance = await Attendance.find({
                        campus_id,
                        user_id: student.id,
                        date: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    });

                    const attendanceRecords = studentAttendance.rows || [];
                    
                    // Calculate attendance statistics
                    const totalClasses = totalDays; // Can be refined based on actual class schedule
                    const attendedClasses = attendanceRecords.filter(record => record.status === "present").length;
                    const absentClasses = attendanceRecords.filter(record => record.status === "absent").length;
                    const lateClasses = attendanceRecords.filter(record => record.status === "late").length;
                    const leaveClasses = attendanceRecords.filter(record => record.status === "leave").length;
                    
                    const attendancePercentage = totalClasses > 0 
                        ? Math.round((attendedClasses / totalClasses) * 100) 
                        : 0;

                    // Determine attendance status
                    let attendanceStatus = "good";
                    if (attendancePercentage >= 90) {
                        attendanceStatus = "excellent";
                    } else if (attendancePercentage >= 75) {
                        attendanceStatus = "good";
                    } else if (attendancePercentage >= 60) {
                        attendanceStatus = "average";
                    } else {
                        attendanceStatus = "poor";
                    }

                    // Get last attendance date
                    const lastAttendance = attendanceRecords.length > 0 
                        ? attendanceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                        : null;

                    return {
                        student_id: student.id,
                        student_name: `${student.first_name} ${student.last_name}`,
                        roll_number: student.user_id, // Using user_id as roll number
                        total_classes: totalClasses,
                        attended: attendedClasses,
                        absent: absentClasses,
                        late: lateClasses,
                        leave: leaveClasses,
                        percentage: attendancePercentage,
                        status: attendanceStatus,
                        last_attended: lastAttendance ? lastAttendance.date : null,
                        email: student.email,
                        phone: student.phone
                    };
                } catch (error) {
                    return {
                        student_id: student.id,
                        student_name: `${student.first_name} ${student.last_name}`,
                        roll_number: student.user_id,
                        total_classes: 0,
                        attended: 0,
                        absent: 0,
                        late: 0,
                        leave: 0,
                        percentage: 0,
                        status: "poor",
                        last_attended: null,
                        email: student.email,
                        phone: student.phone,
                        error: error instanceof Error ? error.message : "Unknown error"
                    };
                }
            });

            const attendanceReport = await Promise.all(attendanceReportPromises);
            
            // Calculate summary statistics
            const totalStudents = attendanceReport.length;
            const averageAttendance = totalStudents > 0 
                ? Math.round(attendanceReport.reduce((sum, student) => sum + student.percentage, 0) / totalStudents)
                : 0;

            const excellentCount = attendanceReport.filter(student => student.percentage >= 90).length;
            const goodCount = attendanceReport.filter(student => student.percentage >= 75 && student.percentage < 90).length;
            const averageCount = attendanceReport.filter(student => student.percentage >= 60 && student.percentage < 75).length;
            const needsAttentionCount = attendanceReport.filter(student => student.percentage < 60).length;

            // Sort students by attendance percentage (descending)
            attendanceReport.sort((a, b) => b.percentage - a.percentage);

            return {
                class_info: {
                    class_id: classData.id,
                    class_name: classData.name,
                    total_students: totalStudents
                },
                date_range: {
                    from_date: startDate.toISOString().split("T")[0],
                    to_date: endDate.toISOString().split("T")[0],
                    total_days: totalDays
                },
                summary: {
                    total_students: totalStudents,
                    average_attendance: averageAttendance,
                    excellent_90_plus: excellentCount,
                    good_75_89: goodCount,
                    average_60_74: averageCount,
                    needs_attention_below_60: needsAttentionCount
                },
                students: attendanceReport
            };

        } catch (error) {
            throw new Error(`Unable to generate attendance report: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    // Get comprehensive attendance view for a specific student (Monthly Performance)
    public static readonly getStudentAttendanceView = async (
        campus_id: string,
        student_id: string,
        from_date?: Date,
        to_date?: Date
    ) => {
        try {
            // Set default date range if not provided (last 12 months)
            const endDate = to_date || new Date();
            const startDate = from_date || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            
            // Get student details
            const { User } = await import("@/models/user.model");
            const student = await User.findById(student_id);
            if (!student) {
                throw new Error("Student not found");
            }

            // Get student's class information
            const studentClasses = await Class.find({
                campus_id,
                student_ids: { $in: [student_id] },
                is_active: true,
                is_deleted: false
            });

            const primaryClass = studentClasses.rows && studentClasses.rows.length > 0 
                ? studentClasses.rows[0] 
                : null;

            // Get all attendance records for this student in the date range
            const studentAttendance = await Attendance.find({
                campus_id,
                user_id: student_id,
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }, {
                sort: {
                    date: "DESC"
                },
            });

            const attendanceRecords = studentAttendance.rows || [];
            
            // Group attendance records by month
            const monthlyAttendance = new Map<string, {
                month: string;
                year: number;
                present: number;
                absent: number;
                late: number;
                leave: number;
                total_days: number;
                percentage: number;
                status: string;
            }>();

            // Process records by month
            for (const record of attendanceRecords) {
                const recordDate = new Date(record.date);
                const monthKey = `${recordDate.getMonth() + 1}-${recordDate.getFullYear()}`;
                const monthName = recordDate.toLocaleString("default", { month: "long" });
                const year = recordDate.getFullYear();

                if (!monthlyAttendance.has(monthKey)) {
                    monthlyAttendance.set(monthKey, {
                        month: monthName,
                        year: year,
                        present: 0,
                        absent: 0,
                        late: 0,
                        leave: 0,
                        total_days: 0,
                        percentage: 0,
                        status: "poor"
                    });
                }

                const monthData = monthlyAttendance.get(monthKey)!;
                monthData.total_days++;

                switch (record.status) {
                    case "present": {
                        monthData.present++;
                        break;
                    }
                    case "absent": {
                        monthData.absent++;
                        break;
                    }
                    case "late": {
                        monthData.late++;
                        break;
                    }
                    case "leave": {
                        monthData.leave++;
                        break;
                    }
                }

                // Calculate monthly percentage (including late as present)
                const effectivePresent = monthData.present + monthData.late;
                monthData.percentage = monthData.total_days > 0 
                    ? Math.round((effectivePresent / monthData.total_days) * 100) 
                    : 0;

                // Determine monthly status
                if (monthData.percentage >= 90) {
                    monthData.status = "excellent";
                } else if (monthData.percentage >= 75) {
                    monthData.status = "good";
                } else if (monthData.percentage >= 60) {
                    monthData.status = "average";
                } else {
                    monthData.status = "poor";
                }
            }

            // Convert to array and sort by year-month descending
            const monthlyPerformance = [...monthlyAttendance.values()]
                .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    const monthOrder = ["January", "February", "March", "April", "May", "June",
                                      "July", "August", "September", "October", "November", "December"];
                    return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
                });

            // Calculate overall summary statistics
            const totalRecords = attendanceRecords.length;
            const totalPresent = attendanceRecords.filter(record => record.status === "present").length;
            const totalAbsent = attendanceRecords.filter(record => record.status === "absent").length;
            const totalLate = attendanceRecords.filter(record => record.status === "late").length;
            const totalLeave = attendanceRecords.filter(record => record.status === "leave").length;
            
            const overallAttendanceRate = totalRecords > 0 
                ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) 
                : 0;

            // Determine overall attendance status
            let overallStatus = "good";
            if (overallAttendanceRate >= 90) {
                overallStatus = "excellent";
            } else if (overallAttendanceRate >= 75) {
                overallStatus = "good";
            } else if (overallAttendanceRate >= 60) {
                overallStatus = "average";
            } else {
                overallStatus = "poor";
            }

            // Calculate total unique months/days for display
            const totalMonths = monthlyPerformance.length;
            const totalUniqueDays = totalRecords;

            return {
                student_profile: {
                    student_id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    roll_number: student.user_id,
                    class: primaryClass ? primaryClass.name : "Not Assigned",
                    contact: student.phone,
                    email: student.email,
                    avatar_url: student.meta_data?.imageURL || null
                },
                date_range: {
                    from_date: startDate.toISOString().split("T")[0],
                    to_date: endDate.toISOString().split("T")[0],
                    showing_records: `${totalMonths} months with ${totalUniqueDays} attendance records`
                },
                summary_cards: {
                    total_days: {
                        count: totalUniqueDays,
                        label: "TOTAL DAYS"
                    },
                    present_days: {
                        count: totalPresent,
                        label: "PRESENT DAYS"
                    },
                    absent_days: {
                        count: totalAbsent,
                        label: "ABSENT DAYS"
                    },
                    attendance_rate: {
                        percentage: overallAttendanceRate,
                        label: "ATTENDANCE RATE",
                        status: overallStatus
                    }
                },
                additional_stats: {
                    late_days: totalLate,
                    leave_days: totalLeave,
                    total_present_including_late: totalPresent + totalLate,
                    total_months: totalMonths
                },
                monthly_performance: {
                    records: monthlyPerformance.map(month => ({
                        month: month.month,
                        year: month.year,
                        month_year: `${month.month} ${month.year}`,
                        present_days: month.present,
                        absent_days: month.absent,
                        late_days: month.late,
                        leave_days: month.leave,
                        total_days: month.total_days,
                        percentage: month.percentage,
                        status: month.status,
                        performance_badge: month.percentage >= 90 ? "excellent" : 
                                         month.percentage >= 75 ? "good" : 
                                         month.percentage >= 60 ? "average" : "poor"
                    })),
                    total_months: totalMonths,
                    filters: {
                        date_range: "Last 12 Months",
                        view_type: "Monthly"
                    }
                }
            };

        } catch (error) {
            throw new Error(`Unable to generate student attendance view: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };
}
