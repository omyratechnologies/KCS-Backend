import { Hono } from "hono";
import { EventMediaGalleryController } from "@/controllers/event_media_gallery.controller";
import { teacherOrAdminMiddleware } from "@/middlewares/teacher_or_admin.middleware";

const app = new Hono();

// ======================= EVENT MEDIA GALLERY ROUTES =======================

/**
 * Create new event media gallery
 * Only teachers and admins can upload
 */
app.post("/", teacherOrAdminMiddleware(), EventMediaGalleryController.createEventMedia);

/**
 * Get all event media galleries
 * All authenticated users can access (filtered by campus)
 */
app.get("/", EventMediaGalleryController.getEventMediaList);

/**
 * Get single event media gallery by ID
 */
app.get("/:id", EventMediaGalleryController.getEventMediaById);

/**
 * Update event media gallery
 * Admin can update any, teachers only their own
 */
app.put("/:id", teacherOrAdminMiddleware(), EventMediaGalleryController.updateEventMedia);

/**
 * Delete event media gallery
 * Admin can delete any, teachers only their own
 */
app.delete("/:id", teacherOrAdminMiddleware(), EventMediaGalleryController.deleteEventMedia);

export default app;
