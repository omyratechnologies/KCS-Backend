import { ILibraryData, Library } from "@/models/library.model";
import { ILibraryIssueData, LibraryIssue } from "@/models/library_issue.model";

export class LibraryService {
    // create library
    public static readonly createLibrary = async (
        campus_id: string,
        data: {
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
        }
    ) => {
        const library = await Library.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (!library) {throw new Error("Library not created");}

        return library;
    };

    // get all libraries
    public static readonly getAllLibraries = async (campus_id: string) => {
        const libraries: {
            rows: ILibraryData[];
        } = await Library.find(
            { campus_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!libraries) {throw new Error("Libraries not found");}

        return libraries.rows;
    };

    // get library by id
    public static readonly getLibraryById = async (id: string) => {
        const library = await Library.findById(id);

        if (!library) {throw new Error("Library not found");}

        return library;
    };

    // update library
    public static readonly updateLibrary = async (
        id: string,
        data: Partial<ILibraryData>
    ) => {
        const library = await Library.findByIdAndUpdate(id, data);

        if (!library) {throw new Error("Library not updated");}

        return library;
    };

    // delete library
    public static readonly deleteLibrary = async (id: string) => {
        const library = await Library.findByIdAndUpdate(id, {
            is_deleted: true,
        });

        if (!library) {throw new Error("Library not deleted");}

        return library;
    };

    // create library issue
    public static readonly createLibraryIssue = async (
        campus_id: string,
        data: {
            book_id: string;
            user_id: string;
            issue_date: Date;
            due_date: Date;
            return_date: Date;
            fine_amount: number;
            meta_data: object;
        }
    ) => {
        const libraryIssue = await LibraryIssue.create({
            campus_id,
            ...data,
            is_active: true,
            is_returned: false,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (!libraryIssue) {throw new Error("Library issue not created");}

        return libraryIssue;
    };

    // get all library issues
    public static readonly getAllLibraryIssues = async (campus_id: string) => {
        const libraryIssues = await LibraryIssue.find(
            { campus_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!libraryIssues) {throw new Error("Library issues not found");}

        return libraryIssues.rows;
    };

    // get library issue by id
    public static readonly getLibraryIssueById = async (id: string) => {
        const libraryIssue = await LibraryIssue.findById(id);

        if (!libraryIssue) {throw new Error("Library issue not found");}

        return libraryIssue;
    };

    // update library issue
    public static readonly updateLibraryIssue = async (
        id: string,
        data: Partial<ILibraryIssueData>
    ) => {
        const libraryIssue = await LibraryIssue.findByIdAndUpdate(id, data);

        if (!libraryIssue) {throw new Error("Library issue not updated");}

        return libraryIssue;
    };

    // delete library issue
    public static readonly deleteLibraryIssue = async (id: string) => {
        const libraryIssue = await LibraryIssue.findByIdAndUpdate(id, {
            is_deleted: true,
        });

        if (!libraryIssue) {throw new Error("Library issue not deleted");}

        return libraryIssue;
    };

    // get library issue by user id
    public static readonly getLibraryIssueByUserId = async (
        user_id: string
    ) => {
        const libraryIssues = await LibraryIssue.find(
            { user_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!libraryIssues) {throw new Error("Library issues not found");}

        return libraryIssues.rows;
    };

    // get library issue by book id
    public static readonly getLibraryIssueByBookId = async (
        book_id: string
    ) => {
        const libraryIssues = await LibraryIssue.find(
            { book_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (!libraryIssues) {throw new Error("Library issues not found");}

        return libraryIssues.rows;
    };
}
