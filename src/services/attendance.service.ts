import { Attendance, IAttendanceData } from "@/models/attendance.model";
import { Class } from "@/models/class.model";

export class AttendanceService {
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

        // Normalize date to start of day for matching
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const updatedAttendance = await Attendance.findOneAndUpdate(
            {
                user_id,
                campus_id,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
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

    // Get attendance for campus_id
    public static readonly getAttendanceByCampusId = async (
        campus_id: string,
        from_date: Date,
        to_date: Date,
        filters?: {
            class_ids?: string[];
            user_ids?: string[];
            status?: ("present" | "absent" | "late" | "leave")[];
            page?: number;
            limit?: number;
        }
    ): Promise<{
        data: IAttendanceData[];
        pagination: {
            current_page: number;
            per_page: number;
            total_items: number;
            total_pages: number;
            has_next: boolean;
            has_previous: boolean;
        };
    }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: Record<string, any> = {
            campus_id,
            date: {
                $gte: from_date,
                $lte: to_date,
            },
        };

        // Add optional filters
        if (filters?.class_ids && filters.class_ids.length > 0) {
            query.class_id = { $in: filters.class_ids };
        }

        if (filters?.user_ids && filters.user_ids.length > 0) {
            query.user_id = { $in: filters.user_ids };
        }

        // Filter by status if provided
        if (filters?.status && filters.status.length > 0) {
            query.status = { $in: filters.status };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const options: Record<string, any> = {
            sort: {
                updated_at: "DESC",
            },
        };

        // Add pagination
        if (filters?.limit) {
            options.limit = filters.limit;
            if (filters?.page) {
                options.skip = (filters.page - 1) * filters.limit;
            }
        }

        const data: {
            rows: IAttendanceData[];
        } = await Attendance.find(query, options);

        // Get total count for metadata (even without pagination)
        const countData = await Attendance.find(query, { select: "id" });
        const totalItems = countData.rows.length;

        // If pagination was used, return structured response with pagination metadata
        if (filters?.limit) {
            const currentPage = filters.page || 1;
            const perPage = filters.limit;
            const totalPages = totalItems > 0 ? Math.ceil(totalItems / perPage) : 0;

            return {
                data: data.rows,
                pagination: {
                    current_page: currentPage,
                    per_page: perPage,
                    total_items: totalItems,
                    total_pages: totalPages,
                    has_next: currentPage < totalPages,
                    has_previous: currentPage > 1,
                },
            };
        }

        // Return structured format even without pagination for consistency
        return {
            data: data.rows,
            pagination: {
                current_page: 1,
                per_page: totalItems,
                total_items: totalItems,
                total_pages: totalItems > 0 ? 1 : 0,
                has_next: false,
                has_previous: false,
            },
        };
    };

    // Dedicated method for marking class attendance (now universal for all attendance)
    public static readonly markClassAttendance = async ({
        campus_id,
        class_id,
        date,
        attendances,
    }: {
        campus_id: string;
        class_id?: string; // Now optional
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

        // Verify class exists if class_id is provided
        let classData: Awaited<ReturnType<typeof Class.findById>> | null = null;
        if (class_id) {
            classData = await Class.findById(class_id);
            if (!classData) {
                throw new Error("Class not found");
            }
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

                // Verify user is part of the class (only if class_id is provided and user is a student)
                if (class_id && classData && userType === "Student" && !classData.student_ids.includes(attendanceData.user_id)) {
                    throw new Error("Student is not enrolled in this class");
                }

                // Normalize the date to start of day for consistent matching
                const normalizedDate = new Date(date);
                normalizedDate.setUTCHours(0, 0, 0, 0);

                // Create end of day for range query
                const endOfDay = new Date(normalizedDate);
                endOfDay.setUTCHours(23, 59, 59, 999);

                // Check if attendance already exists for this user on this date using range query
                const existingRecords = await Attendance.find({
                    user_id: attendanceData.user_id,
                    campus_id,
                    date: {
                        $gte: normalizedDate,
                        $lte: endOfDay,
                    },
                    class_id,
                });

                // POST endpoint should ONLY create - throw error if record exists
                if (existingRecords.rows && existingRecords.rows.length > 0) {
                    throw new Error(`Attendance already exists for this user on this date. Use PATCH /patch-attendance to update.`);
                }

                // Create new attendance record
                const attendance: IAttendanceData = await Attendance.create({
                    campus_id,
                    user_id: attendanceData.user_id,
                    class_id,
                    date: normalizedDate,
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

    // Get comprehensive attendance report for a class
    public static readonly getClassAttendanceReport = async (
        campus_id: string,
        class_id: string,
        from_date: Date,
        to_date: Date,
        filters?: {
            user_ids?: string[];
            status?: ("present" | "absent" | "late" | "leave")[];
            page?: number;
            limit?: number;
        }
    ) => {
        try {
            // Get class details
            const classData = await Class.findById(class_id);
            if (!classData || !classData.student_ids || classData.student_ids.length === 0) {
                throw new Error("Class not found or has no students");
            }

            // Filter student IDs if user_ids filter is provided
            let studentIds = classData.student_ids;
            if (filters?.user_ids && filters.user_ids.length > 0) {
                studentIds = studentIds.filter(id => (filters.user_ids as string[]).includes(id));
            }

            // Apply pagination to student IDs if needed
            let paginatedStudentIds = studentIds;
            if (filters?.limit) {
                const start = filters.page ? (filters.page - 1) * filters.limit : 0;
                paginatedStudentIds = studentIds.slice(start, start + filters.limit);
            }

            // Get all students in the class
            const { User } = await import("@/models/user.model");
            const studentPromises = paginatedStudentIds.map(async (studentId) => {
                try {
                    return await User.findById(studentId);
                } catch {
                    return null;
                }
            });

            const students = (await Promise.all(studentPromises)).filter((student) => student !== null);

            // Calculate total class days based on ACTUAL attendance records (unique dates when attendance was marked)
            // This ensures all students/classes in the campus have the same total_days reference
            const campusAttendanceQuery = {
                campus_id,
                class_id,
                date: {
                    $gte: from_date,
                    $lte: to_date,
                },
            };
            
            const campusAttendanceResult = await Attendance.find(campusAttendanceQuery);
            const campusAttendanceRecords = campusAttendanceResult.rows || [];
            
            // Get unique dates when attendance was actually marked for this class
            const uniqueDates = new Set(
                campusAttendanceRecords.map(record => 
                    new Date(record.date).toISOString().split('T')[0]
                )
            );
            
            // Total days = number of unique dates when attendance was marked
            const totalDays = uniqueDates.size;

            // OPTIMIZED: Fetch ALL attendance records in a single query instead of per-student queries
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const allAttendanceQuery: Record<string, any> = {
                campus_id,
                class_id,
                date: {
                    $gte: from_date,
                    $lte: to_date,
                },
            };

            // Filter by user_ids if provided
            if (filters?.user_ids && filters.user_ids.length > 0) {
                allAttendanceQuery.user_id = { $in: filters.user_ids };
            } else {
                // Otherwise get attendance for all students in the class
                allAttendanceQuery.user_id = { $in: paginatedStudentIds };
            }

            // Filter by status if provided
            if (filters?.status && filters.status.length > 0) {
                allAttendanceQuery.status = { $in: filters.status };
            }

            const allAttendanceResult = await Attendance.find(allAttendanceQuery);
            const allAttendanceRecords = allAttendanceResult.rows || [];

            // Group attendance records by student ID for quick lookup
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const attendanceByStudent = allAttendanceRecords.reduce((acc: Record<string, any[]>, record) => {
                if (!acc[record.user_id]) {
                    acc[record.user_id] = [];
                }
                acc[record.user_id].push(record);
                return acc;
            }, {});

            // Get attendance data for all students using the pre-fetched records
            const attendanceReportPromises = students.map(async (student) => {
                try {
                    const attendanceRecords = attendanceByStudent[student.id] || [];

                    // Calculate attendance statistics
                    const totalClasses = totalDays; // Can be refined based on actual class schedule
                    const attendedClasses = attendanceRecords.filter((record) => record.status === "present").length;
                    const absentClasses = attendanceRecords.filter((record) => record.status === "absent").length;
                    const lateClasses = attendanceRecords.filter((record) => record.status === "late").length;
                    const leaveClasses = attendanceRecords.filter((record) => record.status === "leave").length;

                    const attendancePercentage =
                        totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

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
                    const lastAttendance =
                        attendanceRecords.length > 0
                            ? attendanceRecords.sort(
                                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                              )[0]
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
                        phone: student.phone,
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
                        error: error instanceof Error ? error.message : "Unknown error",
                    };
                }
            });

            const attendanceReport = await Promise.all(attendanceReportPromises);

            // Calculate summary statistics
            const totalStudents = attendanceReport.length;
            const averageAttendance =
                totalStudents > 0
                    ? Math.round(attendanceReport.reduce((sum, student) => sum + student.percentage, 0) / totalStudents)
                    : 0;

            const excellentCount = attendanceReport.filter((student) => student.percentage >= 90).length;
            const goodCount = attendanceReport.filter(
                (student) => student.percentage >= 75 && student.percentage < 90
            ).length;
            const averageCount = attendanceReport.filter(
                (student) => student.percentage >= 60 && student.percentage < 75
            ).length;
            const needsAttentionCount = attendanceReport.filter((student) => student.percentage < 60).length;

            // Sort students by attendance percentage (descending)
            attendanceReport.sort((a, b) => b.percentage - a.percentage);

            // Calculate pagination metadata based on ATTENDANCE RECORDS with same filters applied
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const attendanceCountQuery: Record<string, any> = {
                campus_id,
                class_id,
                date: {
                    $gte: from_date,
                    $lte: to_date,
                },
            };
            
            // Apply user_ids filter to count query if provided
            if (filters?.user_ids && filters.user_ids.length > 0) {
                attendanceCountQuery.user_id = { $in: filters.user_ids };
            }
            
            // Apply status filter to count query if provided
            if (filters?.status && filters.status.length > 0) {
                attendanceCountQuery.status = { $in: filters.status };
            }
            
            const attendanceCount = await Attendance.find(attendanceCountQuery);
            const totalAttendanceRecords = attendanceCount.rows.length;
            
            const currentPage = filters?.page || 1;
            const perPage = filters?.limit || totalStudents;
            const totalPages = totalStudents > 0 && filters?.limit ? Math.ceil(studentIds.length / filters.limit) : (totalStudents > 0 ? 1 : 0);

            return {
                success: true,
                data: {
                    class_info: {
                        class_id: classData.id,
                        class_name: classData.name,
                        total_students: totalStudents,
                    },
                    date_range: {
                        from_date: from_date.toISOString().split("T")[0],
                        to_date: to_date.toISOString().split("T")[0],
                        total_days: totalDays,
                    },
                    summary: {
                        total_students: totalStudents,
                        average_attendance: averageAttendance,
                        excellent_90_plus: excellentCount,
                        good_75_89: goodCount,
                        average_60_74: averageCount,
                        needs_attention_below_60: needsAttentionCount,
                    },
                    students: attendanceReport,
                    attendance: allAttendanceRecords.map(record => ({
                        id: record.id,
                        user_id: record.user_id,
                        campus_id: record.campus_id,
                        class_id: record.class_id,
                        date: record.date,
                        status: record.status,
                        created_at: record.created_at,
                        updated_at: record.updated_at,
                    })),
                },
                pagination: {
                    current_page: currentPage,
                    per_page: perPage,
                    total_items: totalAttendanceRecords,
                    total_pages: totalPages,
                    has_next: currentPage < totalPages,
                    has_previous: currentPage > 1,
                },
            };
        } catch (error) {
            throw new Error(
                `Unable to generate attendance report: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };

    // Get comprehensive attendance view for a specific student (Monthly Performance)
    public static readonly getStudentAttendanceView = async (
        campus_id: string,
        student_id: string,
        from_date: Date,
        to_date: Date,
        filters?: {
            status?: ("present" | "absent" | "late" | "leave")[];
        }
    ) => {
        try {
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
                is_deleted: false,
            });

            const primaryClass = studentClasses.rows && studentClasses.rows.length > 0 ? studentClasses.rows[0] : null;

            // Build query for attendance records
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const attendanceQuery: Record<string, any> = {
                campus_id,
                user_id: student_id,
                date: {
                    $gte: from_date,
                    $lte: to_date,
                },
            };

            // Apply status filter if provided
            if (filters?.status && filters.status.length > 0) {
                attendanceQuery.status = { $in: filters.status };
            }

            // Get all attendance records for this student in the date range
            const studentAttendance = await Attendance.find(
                attendanceQuery,
                {
                    sort: {
                        date: "DESC",
                    },
                }
            );

            const attendanceRecords = studentAttendance.rows || [];

            // Get campus-wide total working days (unique dates when attendance was marked for ANY student)
            // This ensures all students show the same total_days for fair comparison
            const campusAttendanceQuery = {
                campus_id,
                date: {
                    $gte: from_date,
                    $lte: to_date,
                },
            };
            
            const campusAttendanceResult = await Attendance.find(campusAttendanceQuery);
            const campusAttendanceRecords = campusAttendanceResult.rows || [];
            
            // Get unique dates when attendance was marked campus-wide
            const campusUniqueDates = new Set(
                campusAttendanceRecords.map(record => 
                    new Date(record.date).toISOString().split('T')[0]
                )
            );
            
            // Campus-wide total working days (same for all students)
            const campusTotalDays = campusUniqueDates.size;

            // Group attendance records by month
            const monthlyAttendance = new Map<
                string,
                {
                    month: string;
                    year: number;
                    present: number;
                    absent: number;
                    late: number;
                    leave: number;
                    total_days: number;
                    percentage: number;
                    status: string;
                }
            >();

            // Process records by month
            for (const record of attendanceRecords) {
                const recordDate = new Date(record.date);
                const monthKey = `${recordDate.getMonth() + 1}-${recordDate.getFullYear()}`;
                const monthName = recordDate.toLocaleString("default", {
                    month: "long",
                });
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
                        status: "poor",
                    });
                }

                const monthData = monthlyAttendance.get(monthKey);
                if (!monthData) {
                    continue;
                }

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
                monthData.percentage =
                    monthData.total_days > 0 ? Math.round((effectivePresent / monthData.total_days) * 100) : 0;

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
            const monthlyPerformance = [...monthlyAttendance.values()].sort((a, b) => {
                if (a.year !== b.year) {
                    return b.year - a.year;
                }
                const monthOrder = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                ];
                return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
            });

            // Calculate overall summary statistics
            const totalRecords = attendanceRecords.length;
            const totalPresent = attendanceRecords.filter((record) => record.status === "present").length;
            const totalAbsent = attendanceRecords.filter((record) => record.status === "absent").length;
            const totalLate = attendanceRecords.filter((record) => record.status === "late").length;
            const totalLeave = attendanceRecords.filter((record) => record.status === "leave").length;

            // Calculate attendance rate based on campus-wide total days for consistency
            const overallAttendanceRate =
                campusTotalDays > 0 ? Math.round(((totalPresent + totalLate) / campusTotalDays) * 100) : 0;

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
            const studentTotalRecords = totalRecords; // Student's actual attendance records
            const totalUniqueDays = campusTotalDays; // Campus-wide total working days

            return {
                success: true,
                data: {
                    student_profile: {
                        student_id: student.id,
                        name: `${student.first_name} ${student.last_name}`,
                        roll_number: student.user_id,
                        class: primaryClass ? primaryClass.name : "Not Assigned",
                        contact: student.phone,
                        email: student.email,
                        avatar_url: student.meta_data?.imageURL || null,
                    },
                    date_range: {
                        from_date: from_date.toISOString().split("T")[0],
                        to_date: to_date.toISOString().split("T")[0],
                        showing_records: `${totalMonths} months with ${studentTotalRecords} attendance records`,
                    },
                    summary_cards: {
                        total_days: {
                            count: totalUniqueDays,
                            label: "TOTAL DAYS",
                        },
                        present_days: {
                            count: totalPresent,
                            label: "PRESENT DAYS",
                        },
                        absent_days: {
                            count: totalAbsent,
                            label: "ABSENT DAYS",
                        },
                        attendance_rate: {
                            percentage: overallAttendanceRate,
                            label: "ATTENDANCE RATE",
                            status: overallStatus,
                        },
                    },
                    additional_stats: {
                        late_days: totalLate,
                        leave_days: totalLeave,
                        total_present_including_late: totalPresent + totalLate,
                        total_months: totalMonths,
                    },
                    monthly_performance: {
                        records: monthlyPerformance.map((month) => ({
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
                            performance_badge:
                                month.percentage >= 90
                                    ? "excellent"
                                    : month.percentage >= 75
                                      ? "good"
                                      : month.percentage >= 60
                                        ? "average"
                                        : "poor",
                        })),
                        total_months: totalMonths,
                        filters: {
                            date_range: "Last 12 Months",
                            view_type: "Monthly",
                        },
                    },
                    attendance: attendanceRecords.map(record => ({
                        id: record.id,
                        user_id: record.user_id,
                        campus_id: record.campus_id,
                        class_id: record.class_id,
                        date: record.date,
                        status: record.status,
                        created_at: record.created_at,
                        updated_at: record.updated_at,
                    })),
                },
                pagination: {
                    current_page: 1,
                    per_page: totalUniqueDays,
                    total_items: totalUniqueDays,
                    total_pages: totalUniqueDays > 0 ? 1 : 0,
                    has_next: false,
                    has_previous: false,
                },
            };
        } catch (error) {
            throw new Error(
                `Unable to generate student attendance view: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };
}