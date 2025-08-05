import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ILibraryIssueData {
    id: string;
    campus_id: string;
    book_id: string;
    user_id: string;
    issue_date: Date;
    due_date: Date;
    return_date: Date;
    fine_amount: number;
    meta_data: object;
    is_active: boolean;
    is_returned: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const LibraryIssueSchema = new Schema({
    campus_id: { type: String, required: true },
    book_id: { type: String, required: true },
    user_id: { type: String, required: true },
    issue_date: { type: Date, required: true },
    due_date: { type: Date, required: true },
    return_date: { type: Date, required: true },
    fine_amount: { type: Number, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_returned: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

LibraryIssueSchema.index.findByCampusId = { by: "campus_id" };
LibraryIssueSchema.index.findByBookId = { by: "book_id" };
LibraryIssueSchema.index.findByUserId = { by: "user_id" };
LibraryIssueSchema.index.findByIssueDate = { by: "issue_date" };
LibraryIssueSchema.index.findByDueDate = { by: "due_date" };
LibraryIssueSchema.index.findByReturnDate = { by: "return_date" };

const LibraryIssue = ottoman.model<ILibraryIssueData>("library_issue", LibraryIssueSchema);

export { type ILibraryIssueData, LibraryIssue };
