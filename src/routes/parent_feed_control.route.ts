import { Hono } from "hono";
import { ParentFeedControlController } from "@/controllers/parent_feed_control.controller";

const app = new Hono();

// ======================= PARENT FEED CONTROL ROUTES =======================

// Get current feed access status for a student
app.get("/student/:student_id/status", ParentFeedControlController.getStudentFeedStatus);

// Toggle feed access for a student (enable/disable with boolean)
app.put("/student/:student_id/toggle", ParentFeedControlController.toggleStudentFeedAccess);

export default app;