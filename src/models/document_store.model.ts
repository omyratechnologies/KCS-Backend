import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IDocumentStoreData {
    id: string;
    campus_id: string;
    document_name: string;
    document_type: string;
    document_meta_data: object;
    issued_to: string;
    issued_type: string;
    issuer_id: string;
    issuer_type: string;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const DocumentStoreSchema = new Schema({
    campus_id: { type: String, required: true },
    document_name: { type: String, required: true },
    document_type: { type: String, required: true },
    document_meta_data: { type: Object, required: true },
    issued_to: { type: String, required: true },
    issued_type: { type: String, required: true },
    issuer_id: { type: String, required: true },
    issuer_type: { type: String, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

DocumentStoreSchema.index.findByCampusId = { by: "campus_id" };
DocumentStoreSchema.index.findByDocumentName = { by: "document_name" };
DocumentStoreSchema.index.findByDocumentType = { by: "document_type" };
DocumentStoreSchema.index.findByIssuedTo = { by: "issued_to" };
DocumentStoreSchema.index.findByIssuerId = { by: "issuer_id" };

const DocumentStore = ottoman.model<IDocumentStoreData>(
    "document_store",
    DocumentStoreSchema
);

export { DocumentStore, type IDocumentStoreData };
