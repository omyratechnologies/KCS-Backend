import { Label, ILabelData } from "@/models/label.model";

export class LabelService {
    // Create a new label
    public static readonly createLabel = async ({
        campus_id,
        name,
        color,
        created_by,
    }: {
        campus_id: string;
        name: string;
        color: string;
        created_by: string;
    }) => {
        return await Label.create({
            campus_id,
            name,
            color,
            updated_by: created_by, // Initially set updated_by to creator
        });
    };

    // Get label by ID
    public static readonly getLabelById = async (id: string) => {
        const label = await Label.findById(id);
        if (!label) {
            throw new Error("Label not found");
        }
        return label;
    };

    // Get all labels by campus ID
    public static readonly getLabelsByCampusId = async (campus_id: string) => {
        const labels: {
            rows: ILabelData[];
        } = await Label.find(
            {
                campus_id: campus_id,
            },
            {
                sort: {
                    created_at: "DESC",
                },
            }
        );

        return labels.rows;
    };

    // Update label by ID
    public static readonly updateLabelById = async (id: string, updated_by: string, data: { name?: string; color?: string }) => {
        return await Label.updateById(id, {
            ...data,
            updated_by,
            updated_at: new Date(),
        });
    };

    // Delete label by ID
    public static readonly deleteLabelById = async (id: string) => {
        await Label.removeById(id);
        return { message: "Label deleted successfully" };
    };
}
