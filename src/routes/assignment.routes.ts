import { Hono } from "hono";
import { AssignmentController } from "@/controllers/assignment.controller";

const assignmentRoutes = new Hono();

// Assignment routes
assignmentRoutes.get("/", AssignmentController.getAssignments);
assignmentRoutes.get("/stats", AssignmentController.getAssignmentStats);
assignmentRoutes.post("/", AssignmentController.createAssignment);
assignmentRoutes.post("/bulk", AssignmentController.bulkUpdateAssignments);
assignmentRoutes.get("/:assignment_id", AssignmentController.getAssignmentById);
assignmentRoutes.put("/:assignment_id", AssignmentController.updateAssignment);
assignmentRoutes.delete("/:assignment_id", AssignmentController.deleteAssignment);

// Assignment submissions
assignmentRoutes.get("/:assignment_id/submissions", AssignmentController.getAssignmentSubmissions);
assignmentRoutes.post("/:assignment_id/submissions", AssignmentController.createAssignmentSubmission);

// Class-specific assignment routes
assignmentRoutes.get("/classes/:class_id", AssignmentController.getClassAssignments);

// Teacher-specific routes
assignmentRoutes.get("/teachers/my-assignments", AssignmentController.getMyAssignments);
assignmentRoutes.get("/teachers/assignment-stats", AssignmentController.getTeacherAssignmentStats);

// Student-specific routes  
assignmentRoutes.get("/students/my-assignments", AssignmentController.getStudentAssignments);
assignmentRoutes.get("/students/my-submissions", AssignmentController.getMySubmissions);

export { assignmentRoutes };
