import { Hono } from "hono";

import { authMiddleware } from "@/middlewares/auth.middleware";
import androidApkRoute from "@/routes/android_apk.route";
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
import documentStoreoute from "@/routes/document_store.route";
import examRoute from "@/routes/exam.route";
import examTimetableRoute from "@/routes/exam_timetable.route";
import feeRoute from "@/routes/fee.route";
import healthRoute from "@/routes/health.route";
import leaveRoute from "@/routes/leave.route";
import libraryRoute from "@/routes/library.route";
import meetingRoute from "@/routes/meeting.route";
import messagesRoute from "@/routes/message.route";
import notificationRoute from "@/routes/notification.route";
import parentRoute from "@/routes/parent.route";
import paymentRoute from "@/routes/payment.route";
import paymentSettlementRoute from "@/routes/payment_settlement.route";
import studentPerformanceRoute from "@/routes/student_performance.route";
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

const app = new Hono();

// Routes that don't require authentication
app.route("/tmp", tmpRoute);
app.route("/auth", authRoute);
app.route("/health", healthRoute); // Health endpoints accessible without authentication

// Apply authentication middleware to all routes below this point
app.use(authMiddleware());

app.route("/android-apk", androidApkRoute);
app.route("/dashboard", dashboardRoute);
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
app.route("/exam", examRoute);
app.route("/exam/timetable", examTimetableRoute);
app.route("/fee", feeRoute);
app.route("/leave", leaveRoute);
app.route("/timetable", timetableRoute);
app.route("/notification", notificationRoute);
app.route("/messages", messagesRoute);
app.route("/meeting", meetingRoute);
app.route("/class-quiz", classQuizRoute);
app.route("/syllabus", syllabusRoute);
app.route("/upload", uploadRoute);
app.route("/student-record", studentRecordRoute);
app.route("/student-performance", studentPerformanceRoute);
app.route("/teacher", teacherRoute);
app.route("/parent", parentRoute);
app.route("/payment", paymentRoute);
app.route("/payment-settlement", paymentSettlementRoute);
app.route("/super-admin", superAdminRoute);

export default app;