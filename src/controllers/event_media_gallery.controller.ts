import { Context } from "hono";
import { EventMediaGalleryService } from "@/services/event_media_gallery.service";
import { EventMediaType } from "@/models/event_media_gallery.model";

const eventMediaService = new EventMediaGalleryService();

export class EventMediaGalleryController {
    /**
     * Create a new event media gallery entry
     * POST /event-media
     * Only Teachers and Admins can upload
     */
    public static readonly createEventMedia = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const data = await ctx.req.json();

            // Validate required fields
            if (!data.title || !data.date || !data.type || !data.images) {
                return ctx.json(
                    {
                        success: false,
                        error: "Title, date, type, and images are required",
                    },
                    400
                );
            }

            // Validate type
            if (!["img", "video"].includes(data.type)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Invalid type. Must be 'img' or 'video'",
                    },
                    400
                );
            }

            // Validate images array
            if (!Array.isArray(data.images) || data.images.length === 0) {
                return ctx.json(
                    {
                        success: false,
                        error: "Images array is required and must not be empty",
                    },
                    400
                );
            }

            // Parse date
            let eventDate: Date;
            try {
                eventDate = new Date(data.date);
                if (isNaN(eventDate.getTime())) {
                    throw new Error("Invalid date");
                }
            } catch {
                return ctx.json(
                    {
                        success: false,
                        error: "Invalid date format",
                    },
                    400
                );
            }

            const eventMedia = await eventMediaService.createEventMedia({
                title: data.title,
                description: data.description,
                date: eventDate,
                type: data.type as EventMediaType,
                images: data.images,
                uploaded_by: user_id,
                uploader_type: user_type as "Teacher" | "Admin" | "Super Admin",
                campus_id,
            });

            return ctx.json({
                success: true,
                message: "Event media gallery created successfully",
                data: eventMedia,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: "Failed to create event media gallery",
                    message: (error as Error).message,
                },
                500
            );
        }
    };

    /**
     * Get event media galleries
     * GET /event-media
     * All authenticated users can access (filtered by campus)
     */
    public static readonly getEventMediaList = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const type = ctx.req.query("type") as EventMediaType | undefined;
            const start_date = ctx.req.query("start_date");
            const end_date = ctx.req.query("end_date");
            const page = parseInt(ctx.req.query("page") || "1");
            const limit = parseInt(ctx.req.query("limit") || "20");

            // Parse dates if provided
            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (start_date) {
                try {
                    startDate = new Date(start_date);
                    if (isNaN(startDate.getTime())) {
                        startDate = undefined;
                    }
                } catch {
                    startDate = undefined;
                }
            }

            if (end_date) {
                try {
                    endDate = new Date(end_date);
                    if (isNaN(endDate.getTime())) {
                        endDate = undefined;
                    }
                } catch {
                    endDate = undefined;
                }
            }

            const result = await eventMediaService.getEventMediaList({
                campus_id,
                type,
                start_date: startDate,
                end_date: endDate,
                page,
                limit,
            });

            return ctx.json({
                success: true,
                ...result,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch event media galleries",
                    message: (error as Error).message,
                },
                500
            );
        }
    };

    /**
     * Get single event media gallery by ID
     * GET /event-media/:id
     */
    public static readonly getEventMediaById = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const id = ctx.req.param("id");

            const eventMedia = await eventMediaService.getEventMediaById(id, campus_id);

            if (!eventMedia) {
                return ctx.json(
                    {
                        success: false,
                        error: "Event media gallery not found",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                data: eventMedia,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch event media gallery",
                    message: (error as Error).message,
                },
                500
            );
        }
    };

    /**
     * Update event media gallery
     * PUT /event-media/:id
     * Admin can update any, teachers only their own
     */
    public static readonly updateEventMedia = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const id = ctx.req.param("id");
            const data = await ctx.req.json();

            // Get existing event media
            const existingEventMedia = await eventMediaService.getEventMediaById(id, campus_id);

            if (!existingEventMedia) {
                return ctx.json(
                    {
                        success: false,
                        error: "Event media gallery not found",
                    },
                    404
                );
            }

            // Check permissions
            if (!eventMediaService.canUserUpdate(existingEventMedia, user_id, user_type)) {
                return ctx.json(
                    {
                        success: false,
                        error: "You do not have permission to update this event media gallery",
                    },
                    403
                );
            }

            // Parse date if provided
            let eventDate: Date | undefined;
            if (data.date) {
                try {
                    eventDate = new Date(data.date);
                    if (isNaN(eventDate.getTime())) {
                        return ctx.json(
                            {
                                success: false,
                                error: "Invalid date format",
                            },
                            400
                        );
                    }
                } catch {
                    return ctx.json(
                        {
                            success: false,
                            error: "Invalid date format",
                        },
                        400
                    );
                }
            }

            // Validate type if provided
            if (data.type && !["img", "video"].includes(data.type)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Invalid type. Must be 'img' or 'video'",
                    },
                    400
                );
            }

            const updatedEventMedia = await eventMediaService.updateEventMedia(id, {
                title: data.title,
                description: data.description,
                date: eventDate,
                type: data.type as EventMediaType | undefined,
                images: data.images,
            });

            if (!updatedEventMedia) {
                return ctx.json(
                    {
                        success: false,
                        error: "Failed to update event media gallery",
                    },
                    500
                );
            }

            return ctx.json({
                success: true,
                message: "Event media gallery updated successfully",
                data: updatedEventMedia,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: "Failed to update event media gallery",
                    message: (error as Error).message,
                },
                500
            );
        }
    };

    /**
     * Delete event media gallery
     * DELETE /event-media/:id
     * Admin can delete any, teachers only their own
     */
    public static readonly deleteEventMedia = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const id = ctx.req.param("id");

            // Get existing event media
            const existingEventMedia = await eventMediaService.getEventMediaById(id, campus_id);

            if (!existingEventMedia) {
                return ctx.json(
                    {
                        success: false,
                        error: "Event media gallery not found",
                    },
                    404
                );
            }

            // Check permissions
            if (!eventMediaService.canUserDelete(existingEventMedia, user_id, user_type)) {
                return ctx.json(
                    {
                        success: false,
                        error: "You do not have permission to delete this event media gallery",
                    },
                    403
                );
            }

            const deletedEventMedia = await eventMediaService.deleteEventMedia(id);

            if (!deletedEventMedia) {
                return ctx.json(
                    {
                        success: false,
                        error: "Failed to delete event media gallery",
                    },
                    500
                );
            }

            return ctx.json({
                success: true,
                message: "Event media gallery deleted successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: "Failed to delete event media gallery",
                    message: (error as Error).message,
                },
                500
            );
        }
    };
}
