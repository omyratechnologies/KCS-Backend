import { Hono } from "hono";

import { authMiddleware } from "@/middlewares/auth.middleware";
import attendanceRoute from "@/routes/attendance.route";
import authRoute from "@/routes/auth.route";
import campusesRoute from "@/routes/campuses.route";
import classRoute from "@/routes/class.route";
import classQuizRoute from "@/routes/class_quiz.route";
import courseRoute from "@/routes/course.route";
import courseQuizRoute from "@/routes/cousre_quiz.route";
import curriculumRoute from "@/routes/curriculum.route";
import dashboardRoute from "@/routes/dashboard.route";
import documentStoreoute from "@/routes/document_store.route";
import examRoute from "@/routes/exam.route";
import feeRoute from "@/routes/fee.route";
import libraryRoute from "@/routes/library.route";
import meetingRoute from "@/routes/meeting.route";
import messagesRoute from "@/routes/message.route";
import notificationRoute from "@/routes/notification.route";
import parentRoute from "@/routes/parent.route";
import studentRecordRoute from "@/routes/student_record.route";
import subjectRoute from "@/routes/subject.route";
import syllabusRoute from "@/routes/syllabus.route";
import teacherRoute from "@/routes/teacher.route";
import tmpRoute from "@/routes/temp.route";
import timetableRoute from "@/routes/timetable.route";
import uploadRoute from "@/routes/upload.route";
import usersRoute from "@/routes/users.route";

const app = new Hono();

app.route("/tmp", tmpRoute);
app.route("/auth", authRoute);

app.use(authMiddleware());

app.route("/dashboard", dashboardRoute);
app.route("/user", usersRoute);
app.route("/campus", campusesRoute);
app.route("/attendance", attendanceRoute);
app.route("/class", classRoute);
app.route("/curriculum", curriculumRoute);
app.route("/course", courseRoute);
app.route("/subject", subjectRoute);
app.route("/library", libraryRoute);
app.route("/document-store", documentStoreoute);
app.route("/exam", examRoute);
app.route("/fee", feeRoute);
app.route("/timetable", timetableRoute);
app.route("/notification", notificationRoute);
app.route("/messages", messagesRoute);
app.route("/meeting", meetingRoute);
app.route("/class-quiz", classQuizRoute);
app.route("/course-quiz", courseQuizRoute);
app.route("/syllabus", syllabusRoute);
app.route("/upload", uploadRoute);
app.route("/student-record", studentRecordRoute);
app.route("/teacher", teacherRoute);
app.route("/parent", parentRoute);

export default app;
