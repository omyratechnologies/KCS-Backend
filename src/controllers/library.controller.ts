import { Context } from "hono";

import { ILibraryData } from "@/models/library.model";
import { ILibraryIssueData } from "@/models/library_issue.model";
import { LibraryService } from "@/services/library.service";

export class LibraryController {
    public static readonly createLibrary = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const {
                bookData,
            }: {
                bookData: {
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
                };
            } = await ctx.req.json();

            const library = await LibraryService.createLibrary(
                campus_id,
                bookData
            );

            return ctx.json(library);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getAllLibraries = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const libraries = await LibraryService.getAllLibraries(campus_id);

            return ctx.json(libraries);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getLibraryById = async (ctx: Context) => {
        try {
            const library_id = ctx.get("library_id");

            const library = await LibraryService.getLibraryById(library_id);

            return ctx.json(library);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly updateLibrary = async (ctx: Context) => {
        try {
            const { library_id } = ctx.req.param();

            const data: Partial<ILibraryData> = await ctx.req.json();

            const library = await LibraryService.updateLibrary(
                library_id,
                data
            );

            return ctx.json(library);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly deleteLibrary = async (ctx: Context) => {
        try {
            const { library_id } = ctx.req.param();

            const library = await LibraryService.deleteLibrary(library_id);

            return ctx.json(library);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly createLibraryIssue = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const {
                book_id,
                user_id,
                issue_date,
                due_date,
                return_date,
                fine_amount,
                meta_data,
            }: {
                book_id: string;
                user_id: string;
                issue_date: Date;
                due_date: Date;
                return_date: Date;
                fine_amount: number;
                meta_data: object;
            } = await ctx.req.json();

            const library_issue = await LibraryService.createLibraryIssue(
                campus_id,
                {
                    book_id,
                    user_id,
                    issue_date,
                    due_date,
                    return_date,
                    fine_amount,
                    meta_data,
                }
            );

            return ctx.json(library_issue);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getAllLibraryIssues = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const library_issues =
                await LibraryService.getAllLibraryIssues(campus_id);

            return ctx.json(library_issues);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getLibraryIssueById = async (ctx: Context) => {
        try {
            const { library_issue_id } = ctx.req.param();

            const library_issue =
                await LibraryService.getLibraryIssueById(library_issue_id);

            return ctx.json(library_issue);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly updateLibraryIssue = async (ctx: Context) => {
        try {
            const { library_issue_id } = ctx.req.param();
            const data: Partial<ILibraryIssueData> = await ctx.req.json();

            const library_issue = await LibraryService.updateLibraryIssue(
                library_issue_id,
                data
            );

            return ctx.json(library_issue);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly deleteLibraryIssue = async (ctx: Context) => {
        try {
            const { library_issue_id } = ctx.req.param();

            const library_issue =
                await LibraryService.deleteLibraryIssue(library_issue_id);

            return ctx.json(library_issue);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getLibraryIssueByUserId = async (ctx: Context) => {
        try {
            const { user_id } = ctx.req.param();

            const library_issues =
                await LibraryService.getLibraryIssueByUserId(user_id);

            return ctx.json(library_issues);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getLibraryIssueByBookId = async (ctx: Context) => {
        try {
            const { book_id } = ctx.req.param();

            const library_issues =
                await LibraryService.getLibraryIssueByBookId(book_id);

            return ctx.json(library_issues);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
}
