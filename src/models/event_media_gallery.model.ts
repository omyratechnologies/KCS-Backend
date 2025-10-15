import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export type EventMediaType = "img" | "video";

export interface IEventMediaGallery {
    id: string;
    title: string;
    description?: string;
    date: Date;
    type: EventMediaType;
    images: string[];
    uploaded_by: string;
    uploader_type: "Teacher" | "Admin" | "Super Admin";
    campus_id: string;
    created_at: Date;
    updated_at: Date;
}

const EventMediaGallerySchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: false },
    date: { type: Date, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ["img", "video"]
    },
    images: { 
        type: [String], 
        required: true,
        default: []
    },
    uploaded_by: { type: String, required: true },
    uploader_type: { 
        type: String, 
        required: true,
        enum: ["Teacher", "Admin", "Super Admin"]
    },
    campus_id: { type: String, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes
EventMediaGallerySchema.index.findByCampus = {
    by: "campus_id",
    type: "n1ql",
};

EventMediaGallerySchema.index.findByUploader = {
    by: "uploaded_by",
    type: "n1ql",
};

EventMediaGallerySchema.index.findByDate = {
    by: "date",
    type: "n1ql",
};

export const EventMediaGallery = ottoman.model<IEventMediaGallery>(
    "EventMediaGallery",
    EventMediaGallerySchema,
    {
        collectionName: "event_media_gallery",
        scopeName: "_default",
    }
);
