import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ILabelData {
    id: string;
    campus_id: string;
    name: string;
    color: string; // Hex color code
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}

const LabelSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    updated_by: { type: String, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

LabelSchema.index.findByCampusId = { by: "campus_id" };

const Label = ottoman.model<ILabelData>("label", LabelSchema);

export { Label, type ILabelData };
