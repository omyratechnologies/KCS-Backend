import z from "zod";

import "zod-openapi/extend";

// Schema for library data (book)
export const librarySchema = z
    .object({
        id: z.string().openapi({ example: "book123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        book_name: z.string().openapi({ example: "The Great Gatsby" }),
        author_name: z.string().openapi({ example: "F. Scott Fitzgerald" }),
        book_code: z.string().openapi({ example: "LIB-001" }),
        book_cover: z.string().openapi({ example: "https://example.com/book-cover.jpg" }),
        book_description: z.string().openapi({ example: "A novel about the American Dream" }),
        book_quantity: z.number().openapi({ example: 5 }),
        book_available: z.number().openapi({ example: 3 }),
        book_issued: z.number().openapi({ example: 2 }),
        book_fine: z.number().openapi({ example: 10 }),
        book_status: z.string().openapi({ example: "available" }),
        book_location: z.string().openapi({ example: "Shelf A-12" }),
        book_tags: z.array(z.string()).openapi({ example: ["fiction", "classic", "american"] }),
        book_meta_data: z.record(z.string(), z.any()).openapi({ example: { publisher: "Scribner", year: 1925 } }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Library" });

// Create Library (Book) Request
export const createLibraryRequestBodySchema = z
    .object({
        bookData: z
            .object({
                book_name: z.string().openapi({ example: "The Great Gatsby" }),
                author_name: z.string().openapi({ example: "F. Scott Fitzgerald" }),
                book_code: z.string().openapi({ example: "LIB-001" }),
                book_cover: z.string().openapi({ example: "https://example.com/book-cover.jpg" }),
                book_description: z.string().openapi({ example: "A novel about the American Dream" }),
                book_quantity: z.number().openapi({ example: 5 }),
                book_available: z.number().openapi({ example: 5 }),
                book_issued: z.number().openapi({ example: 0 }),
                book_fine: z.number().openapi({ example: 10 }),
                book_status: z.string().openapi({ example: "available" }),
                book_location: z.string().openapi({ example: "Shelf A-12" }),
                book_tags: z.array(z.string()).openapi({ example: ["fiction", "classic", "american"] }),
                book_meta_data: z.record(z.string(), z.any()).openapi({
                    example: { publisher: "Scribner", year: 1925 },
                }),
            })
            .openapi({
                example: {
                    book_name: "The Great Gatsby",
                    author_name: "F. Scott Fitzgerald",
                    book_code: "LIB-001",
                    book_cover: "https://example.com/book-cover.jpg",
                    book_description: "A novel about the American Dream",
                    book_quantity: 5,
                    book_available: 5,
                    book_issued: 0,
                    book_fine: 10,
                    book_status: "available",
                    book_location: "Shelf A-12",
                    book_tags: ["fiction", "classic", "american"],
                    book_meta_data: { publisher: "Scribner", year: 1925 },
                },
            }),
    })
    .openapi({ ref: "CreateLibraryRequest" });

export const createLibraryResponseSchema = librarySchema.openapi({
    ref: "CreateLibraryResponse",
});

// Update Library (Book) Request
export const updateLibraryRequestBodySchema = z
    .object({
        book_name: z.string().optional().openapi({ example: "The Great Gatsby (Revised Edition)" }),
        author_name: z.string().optional().openapi({ example: "F. Scott Fitzgerald" }),
        book_code: z.string().optional().openapi({ example: "LIB-001-R" }),
        book_cover: z.string().optional().openapi({ example: "https://example.com/book-cover-revised.jpg" }),
        book_description: z.string().optional().openapi({ example: "Revised edition of the classic novel" }),
        book_quantity: z.number().optional().openapi({ example: 7 }),
        book_available: z.number().optional().openapi({ example: 4 }),
        book_issued: z.number().optional().openapi({ example: 3 }),
        book_fine: z.number().optional().openapi({ example: 15 }),
        book_status: z.string().optional().openapi({ example: "available" }),
        book_location: z.string().optional().openapi({ example: "Shelf B-5" }),
        book_tags: z
            .array(z.string())
            .optional()
            .openapi({
                example: ["fiction", "classic", "american", "revised"],
            }),
        book_meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: {
                    publisher: "Scribner",
                    year: 1925,
                    edition: "Revised",
                },
            }),
        is_active: z.boolean().optional().openapi({ example: true }),
    })
    .openapi({ ref: "UpdateLibraryRequest" });

export const updateLibraryResponseSchema = librarySchema.openapi({
    ref: "UpdateLibraryResponse",
});

// Get Libraries Response
export const getLibrariesResponseSchema = z.array(librarySchema).openapi({ ref: "GetLibrariesResponse" });

// Delete Library Response
export const deleteLibraryResponseSchema = librarySchema.openapi({
    ref: "DeleteLibraryResponse",
});

// Library Issue Schema
export const libraryIssueSchema = z
    .object({
        id: z.string().openapi({ example: "issue123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        book_id: z.string().openapi({ example: "book123" }),
        user_id: z.string().openapi({ example: "user123" }),
        issue_date: z.string().openapi({ example: "2023-01-15T00:00:00Z" }),
        due_date: z.string().openapi({ example: "2023-01-29T00:00:00Z" }),
        return_date: z.string().nullable().openapi({ example: null }),
        fine_amount: z.number().openapi({ example: 0 }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { condition: "good" } }),
        is_active: z.boolean().openapi({ example: true }),
        is_returned: z.boolean().openapi({ example: false }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-15T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-15T00:00:00Z" }),
    })
    .openapi({ ref: "LibraryIssue" });

// Create Library Issue Request
export const createLibraryIssueRequestBodySchema = z
    .object({
        book_id: z.string().openapi({ example: "book123" }),
        user_id: z.string().openapi({ example: "user123" }),
        issue_date: z.string().openapi({ example: "2023-01-15T00:00:00Z" }),
        due_date: z.string().openapi({ example: "2023-01-29T00:00:00Z" }),
        return_date: z.string().nullable().openapi({ example: null }),
        fine_amount: z.number().openapi({ example: 0 }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { condition: "good" } }),
    })
    .openapi({ ref: "CreateLibraryIssueRequest" });

export const createLibraryIssueResponseSchema = libraryIssueSchema.openapi({
    ref: "CreateLibraryIssueResponse",
});

// Update Library Issue Request
export const updateLibraryIssueRequestBodySchema = z
    .object({
        return_date: z.string().optional().openapi({ example: "2023-01-25T00:00:00Z" }),
        fine_amount: z.number().optional().openapi({ example: 0 }),
        is_returned: z.boolean().optional().openapi({ example: true }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: { condition: "good", notes: "Returned early" },
            }),
    })
    .openapi({ ref: "UpdateLibraryIssueRequest" });

export const updateLibraryIssueResponseSchema = libraryIssueSchema.openapi({
    ref: "UpdateLibraryIssueResponse",
});

// Get Library Issues Response
export const getLibraryIssuesResponseSchema = z.array(libraryIssueSchema).openapi({ ref: "GetLibraryIssuesResponse" });

// Delete Library Issue Response
export const deleteLibraryIssueResponseSchema = libraryIssueSchema.openapi({
    ref: "DeleteLibraryIssueResponse",
});
