import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ILibraryData {
    id: string;
    campus_id: string;
    book_name: string;
    author_name: string;
    book_code: string;
    book_cover: string;
    book_description: string;
    book_quantity: number;
    book_available: number;
    book_issued: number;
    book_fine: number;
    book_status: string;
    book_location: string;
    book_tags: string[];
    book_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const LibrarySchema = new Schema({
    campus_id: { type: String, required: true },
    book_name: { type: String, required: true },
    author_name: { type: String, required: true },
    book_code: { type: String, required: true },
    book_cover: { type: String, required: true },
    book_description: { type: String, required: true },
    book_quantity: { type: Number, required: true },
    book_available: { type: Number, required: true },
    book_issued: { type: Number, required: true },
    book_fine: { type: Number, required: true },
    book_status: { type: String, required: true },
    book_location: { type: String, required: true },
    book_tags: { type: [String], required: true },
    book_meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

LibrarySchema.index.findByCampusId = { by: "campus_id" };
LibrarySchema.index.findByBookName = { by: "book_name" };
LibrarySchema.index.findByAuthorName = { by: "author_name" };
LibrarySchema.index.findByBookCode = { by: "book_code" };

const Library = ottoman.model<ILibraryData>("library", LibrarySchema);

export { type ILibraryData, Library };
