import {
    DocumentStore,
    IDocumentStoreData,
} from "@/models/document_store.model";

export class DocumentStoreService {
    // create document
    public static readonly createDocumentStore = async (
        campus_id: string,
        data: {
            document_name: string;
            document_type: string;
            document_meta_data: object;
            issued_to: string;
            issued_type: string;
            issuer_id: string;
            issuer_type: string;
        }
    ) => {
        const documentStore = await DocumentStore.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (!documentStore) {throw new Error("Document not created");}

        return documentStore;
    };

    // get all documents
    public static readonly getAllDocumentStore = async (campus_id: string) => {
        const documents: {
            rows: IDocumentStoreData[];
        } = await DocumentStore.find(
            { campus_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (documents.rows.length === 0) {
            return [];
        }

        return documents.rows;
    };

    // get document by id
    public static readonly getDocumentStoreById = async (id: string) => {
        const document = await DocumentStore.findById(id);

        if (!document) {throw new Error("Document not found");}

        return document;
    };

    // update document
    public static readonly updateDocumentStore = async (
        id: string,
        data: Partial<IDocumentStoreData>
    ) => {
        const document = await DocumentStore.updateById(id, data);

        if (!document) {throw new Error("Document not updated");}

        return document;
    };

    // delete document
    public static readonly deleteDocumentStore = async (id: string) => {
        const document = await DocumentStore.updateById(id, {
            is_deleted: true,
        });

        if (!document) {throw new Error("Document not deleted");}

        return document;
    };

    // get document by issued to
    public static readonly getDocumentStoreByIssuedTo = async (
        issued_to: string
    ) => {
        const documents: {
            rows: IDocumentStoreData[];
        } = await DocumentStore.find(
            { issued_to, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (documents.rows.length === 0) {throw new Error("Documents not found");}

        return documents.rows;
    };

    // get document by issuer id
    public static readonly getDocumentStoreByIssuerId = async (
        issuer_id: string
    ) => {
        const documents: {
            rows: IDocumentStoreData[];
        } = await DocumentStore.find(
            { issuer_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (documents.rows.length === 0) {throw new Error("Documents not found");}

        return documents.rows;
    };
}
