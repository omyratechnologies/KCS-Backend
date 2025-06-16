import { Context } from "hono";

import { DocumentStoreService } from "@/services/document_store.service";

export class DocumentStoreController {
    public static readonly createDocumentStore = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id") ?? " ";

            const {
                document_name,
                document_type,
                document_meta_data,
                issued_to,
                issuer_id,
                issued_type,
                issuer_type,
            } = await ctx.req.json();

            const document = await DocumentStoreService.createDocumentStore(
                campus_id,
                {
                    document_name,
                    document_type,
                    document_meta_data,
                    issued_to,
                    issuer_id,
                    issued_type,
                    issuer_type,
                }
            );

            return ctx.json(document);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getAllDocumentStore = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id") ?? " ";

            const documents =
                await DocumentStoreService.getAllDocumentStore(campus_id);

            return ctx.json(documents);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getDocumentStoreById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const document =
                await DocumentStoreService.getDocumentStoreById(id);

            return ctx.json(document);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // update document
    public static readonly updateDocumentStore = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const {
                document_name,
                document_type,
                document_meta_data,
                issued_to,
                issuer_id,
            } = await ctx.req.json();

            const document = await DocumentStoreService.updateDocumentStore(
                id,
                {
                    document_name,
                    document_type,
                    document_meta_data,
                    issued_to,
                    issuer_id,
                }
            );

            return ctx.json(document);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // delete document
    public static readonly deleteDocumentStore = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const document = await DocumentStoreService.deleteDocumentStore(id);

            return ctx.json(document);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getDocumentStoreByIssuedTo = async (
        ctx: Context
    ) => {
        try {
            const issued_to = ctx.get("user_id");

            const documents =
                await DocumentStoreService.getDocumentStoreByIssuedTo(
                    issued_to
                );

            return ctx.json(documents);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // get document by issuer id
    public static readonly getDocumentStoreByIssuerId = async (
        ctx: Context
    ) => {
        try {
            const issuer_id = ctx.get("user_id");

            const documents =
                await DocumentStoreService.getDocumentStoreByIssuerId(
                    issuer_id
                );

            return ctx.json(documents);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
}
