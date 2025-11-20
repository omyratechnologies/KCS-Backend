import { Hono } from "hono";

import { authMiddleware } from "@/middlewares/auth.middleware";
import adminCourseAnalyticsRoute from "@/routes/admin_course_analytics.route";
import assignmentRoute from "@/routes/assignments.route";
import attendanceRoute from "@/routes/attendance.route";
import authRoute from "@/routes/auth.route";
import campusesRoute from "@/routes/campuses.route";
import chatRoute from "@/routes/chat.route";
import classRoute from "@/routes/class.route";
import classQuizRoute from "@/routes/class_quiz.route";
import courseRoute from "@/routes/course.route";
import curriculumRoute from "@/routes/curriculum.route";
import dashboardRoute from "@/routes/dashboard.route";
import { diagnosticRoutes } from "@/routes/diagnostic.routes";
import documentStoreoute from "@/routes/document_store.route";
import eventMediaGalleryRoute from "@/routes/event_media_gallery.route";
import examRoute from "@/routes/exam.route";
import examTimetableRoute from "@/routes/exam_timetable.route";
import feeRoute from "@/routes/fee.route";
import healthRoute from "@/routes/health.route";
import labelRoute from "@/routes/label.route";
import leaveRoute from "@/routes/leave.route";
import libraryRoute from "@/routes/library.route";
import locationsRoute from "@/routes/locations.route";
import meetingRoute from "@/routes/meeting.route";
import messagesRoute from "@/routes/message.route";
import notificationRoute from "@/routes/notification.route";
import parentRoute from "@/routes/parent.route";
import paymentRoute from "@/routes/payment.route";
import pushNotificationRoute from "@/routes/push_notification.route";
import reminderRoute from "@/routes/reminder.route";
import semesterReportRoute from "@/routes/semester_report.route";
import studentAcademicViewRoute from "@/routes/student_academic_view.route";
import studentPerformanceRoute from "@/routes/student_performance.route";
import studentProgressRoute from "@/routes/student_progress.route";
import studentRecordRoute from "@/routes/student_record.route";
import subjectRoute from "@/routes/subject.route";
import superAdminRoute from "@/routes/super_admin.routes";
import syllabusRoute from "@/routes/syllabus.route";
import teacherRoute from "@/routes/teacher.route";
import tmpRoute from "@/routes/temp.route";
import timetableRoute from "@/routes/timetable.route";
import uploadRoute from "@/routes/upload.route";
import usersRoute from "@/routes/users.route";
import { videoCallRoutes } from "@/routes/video_call.routes";
import vendorRoute from "@/routes/vendor.route";
import feeStructureRoute from "./fee_structure.route";
import cashfreePaymentRoute from "./cashfree_payment.route";

const app = new Hono();

// Routes that don't require authentication
app.route("/tmp", tmpRoute);
app.route("/auth", authRoute);
app.route("/health", healthRoute); // Health endpoints accessible without authentication
app.route("/locations", locationsRoute); // Public locations API

// Apply authentication middleware to all routes below this point
app.use(authMiddleware());

app.route("/diagnostic", diagnosticRoutes);
app.route("/dashboard", dashboardRoute);
app.route("/admin-course-analytics", adminCourseAnalyticsRoute);
app.route("/user", usersRoute);
app.route("/campus", campusesRoute);
app.route("/chat", chatRoute);
app.route("/video-calls", videoCallRoutes);
app.route("/attendance", attendanceRoute);
app.route("/class", classRoute);
app.route("/courses", courseRoute);
app.route("/curriculum", curriculumRoute);
app.route("/subject", subjectRoute);
app.route("/library", libraryRoute);
app.route("/assignments", assignmentRoute); // New unified assignment routes
app.route("/document-store", documentStoreoute);
app.route("/event-media", eventMediaGalleryRoute);
app.route("/exam", examRoute);
app.route("/exam/timetable", examTimetableRoute);
app.route("/fee", feeRoute);
app.route("/payments", paymentRoute); // Razorpay payment system
app.route("/vendor", vendorRoute); // Campus vendor management (Cashfree)
app.route("/fee-structures", feeStructureRoute); // Class fee structure management (Cashfree)
app.route("/cashfree-payments", cashfreePaymentRoute); // Cashfree payment orders with vendor splits
app.route("/label", labelRoute); // Label management for curriculum chapters
app.route("/leave", leaveRoute);
app.route("/timetable", timetableRoute);
app.route("/notification", notificationRoute);
app.route("/push-notification", pushNotificationRoute);
app.route("/reminders", reminderRoute);
app.route("/messages", messagesRoute);
app.route("/meeting", meetingRoute);
app.route("/class-quiz", classQuizRoute);
app.route("/syllabus", syllabusRoute);
app.route("/upload", uploadRoute);
app.route("/student-record", studentRecordRoute);
app.route("/student-performance", studentPerformanceRoute);
app.route("/student-progress", studentProgressRoute);
app.route("/student-academic-view", studentAcademicViewRoute);
app.route("/semester-report", semesterReportRoute);
app.route("/teacher", teacherRoute);
app.route("/parent", parentRoute);
app.route("/super-admin", superAdminRoute);

export default app;