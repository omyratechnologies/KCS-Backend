import { EventMediaGallery, IEventMediaGallery, EventMediaType } from "@/models/event_media_gallery.model";
import log, { LogTypes } from "@/libs/logger";

export class EventMediaGalleryService {
    /**
     * Create a new event media gallery entry
     */
    public async createEventMedia(data: {
        title: string;
        description?: string;
        date: Date;
        type: EventMediaType;
        images: string[];
        uploaded_by: string;
        uploader_type: "Teacher" | "Admin" | "Super Admin";
        campus_id: string;
    }): Promise<IEventMediaGallery> {
        try {
            const eventMedia = new EventMediaGallery({
                ...data,
            } as IEventMediaGallery);
            await eventMedia.save();

            log(`Event media gallery created: ${eventMedia.id}`, LogTypes.LOGS, "EventMediaGalleryService");

            return eventMedia;
        } catch (error) {
            log(`Failed to create event media gallery: ${(error as Error).message}`, LogTypes.ERROR, "EventMediaGalleryService");
            throw error;
        }
    }

    /**
     * Get event media galleries with filters
     */
    public async getEventMediaList(params: {
        campus_id: string;
        type?: EventMediaType;
        start_date?: Date;
        end_date?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        data: IEventMediaGallery[];
        total: number;
        page: number;
        limit: number;
    }> {
        try {
            const { campus_id, type, start_date, end_date, page = 1, limit = 20 } = params;

            const conditions: Record<string, unknown> = {
                campus_id,
            };

            if (type) {
                conditions.type = type;
            }

            const offset = (page - 1) * limit;

            const eventMediaQuery = await EventMediaGallery.find(conditions, {
                sort: {
                    date: "DESC",
                    created_at: "DESC"
                },
                limit: limit,
                skip: offset
            });

            let data = eventMediaQuery.rows || [];

            // Filter by date range if provided
            if (start_date || end_date) {
                data = data.filter((item: IEventMediaGallery) => {
                    const itemDate = new Date(item.date);
                    if (start_date && itemDate < start_date) {
                        return false;
                    }
                    if (end_date && itemDate > end_date) {
                        return false;
                    }
                    return true;
                });
            }

            // Get total count
            const totalQuery = await EventMediaGallery.find(conditions);
            let total = totalQuery.rows?.length || 0;

            // Apply date filter to total count if needed
            if (start_date || end_date) {
                const filteredTotal = (totalQuery.rows || []).filter((item: IEventMediaGallery) => {
                    const itemDate = new Date(item.date);
                    if (start_date && itemDate < start_date) {
                        return false;
                    }
                    if (end_date && itemDate > end_date) {
                        return false;
                    }
                    return true;
                });
                total = filteredTotal.length;
            }

            return {
                data,
                total,
                page,
                limit,
            };
        } catch (error) {
            log(`Failed to get event media galleries: ${(error as Error).message}`, LogTypes.ERROR, "EventMediaGalleryService");
            throw error;
        }
    }

    /**
     * Get a single event media gallery by ID
     */
    public async getEventMediaById(id: string, campus_id: string): Promise<IEventMediaGallery | null> {
        try {
            const eventMedia = await EventMediaGallery.findById(id);

            if (!eventMedia || eventMedia.campus_id !== campus_id) {
                return null;
            }

            return eventMedia;
        } catch (error) {
            log(`Failed to get event media gallery by ID: ${(error as Error).message}`, LogTypes.ERROR, "EventMediaGalleryService");
            throw error;
        }
    }

    /**
     * Update event media gallery
     */
    public async updateEventMedia(
        id: string,
        data: {
            title?: string;
            description?: string;
            date?: Date;
            type?: EventMediaType;
            images?: string[];
        }
    ): Promise<IEventMediaGallery | null> {
        try {
            const eventMedia = await EventMediaGallery.findById(id);

            if (!eventMedia) {
                return null;
            }

            // Update allowed fields
            if (data.title !== undefined) {
                eventMedia.title = data.title;
            }
            if (data.description !== undefined) {
                eventMedia.description = data.description;
            }
            if (data.date !== undefined) {
                eventMedia.date = data.date;
            }
            if (data.type !== undefined) {
                eventMedia.type = data.type;
            }
            if (data.images !== undefined) {
                eventMedia.images = data.images;
            }

            eventMedia.updated_at = new Date();
            await eventMedia.save();

            log(`Event media gallery updated: ${id}`, LogTypes.LOGS, "EventMediaGalleryService");

            return eventMedia;
        } catch (error) {
            log(`Failed to update event media gallery: ${(error as Error).message}`, LogTypes.ERROR, "EventMediaGalleryService");
            throw error;
        }
    }

    /**
     * Delete event media gallery (permanent delete)
     */
    public async deleteEventMedia(
        id: string
    ): Promise<boolean> {
        try {
            const eventMedia = await EventMediaGallery.findById(id);

            if (!eventMedia) {
                return false;
            }

            await EventMediaGallery.removeById(id);

            log(`Event media gallery deleted: ${id}`, LogTypes.LOGS, "EventMediaGalleryService");

            return true;
        } catch (error) {
            log(`Failed to delete event media gallery: ${(error as Error).message}`, LogTypes.ERROR, "EventMediaGalleryService");
            throw error;
        }
    }

    /**
     * Check if user can delete event media (admin can delete any, teachers only their own)
     */
    public canUserDelete(eventMedia: IEventMediaGallery, user_id: string, user_type: string): boolean {
        // Admin and Super Admin can delete any event media
        if (["Admin", "Super Admin"].includes(user_type)) {
            return true;
        }

        // Teachers can only delete their own uploads
        if (user_type === "Teacher" && eventMedia.uploaded_by === user_id) {
            return true;
        }

        return false;
    }

    /**
     * Check if user can update event media (admin can update any, teachers only their own)
     */
    public canUserUpdate(eventMedia: IEventMediaGallery, user_id: string, user_type: string): boolean {
        // Admin and Super Admin can update any event media
        if (["Admin", "Super Admin"].includes(user_type)) {
            return true;
        }

        // Teachers can only update their own uploads
        if (user_type === "Teacher" && eventMedia.uploaded_by === user_id) {
            return true;
        }

        return false;
    }
}
