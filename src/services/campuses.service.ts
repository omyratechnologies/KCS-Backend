import { Campus, ICampus } from "@/models/campus.model";
import { CampusFeaturesService } from "./campus_features.service";

export class CampusService {
    // Create
    public static readonly createCampus = async ({
        name,
        address,
        domain,
        meta_data,
    }: {
        name: string;
        address: string;
        domain: string;
        meta_data: string;
    }) => {
        const campus = await Campus.create({
            name: name,
            address: address,
            domain: domain,
            meta_data: meta_data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Automatically create campus features with all features enabled by default
        try {
            if (campus.id) {
                await CampusFeaturesService.initializeCampusFeatures(
                    campus.id,
                    "system" // System-generated
                );
                console.log(`[CampusService] Campus features initialized for new campus: ${campus.id}`);
            }
        } catch (error) {
            console.error(`[CampusService] Failed to initialize campus features for ${campus.id}:`, error);
            // Don't fail campus creation if features initialization fails
        }

        return campus;
    };

    // Get All
    public static readonly getCampuses = async (): Promise<ICampus[]> => {
        const data = (await Campus.find()) as {
            rows: ICampus[];
        };

        if (data.rows.length === 0) {
            throw new Error("No campuses found");
        }

        return data.rows;
    };

    // Get One
    public static readonly getCampus = async (id: string) => {
        return await Campus.findById(id);
    };

    // Update
    public static readonly updateCampus = async (
        id: string,
        {
            data,
        }: {
            data: {
                name?: string;
                address?: string;
                domain?: string;
                meta_data?: string;
                is_active?: boolean;
                is_deleted?: boolean;
            };
        }
    ): Promise<ICampus> => {
        const campus = await Campus.findById(id);

        if (!campus) {
            throw new Error("Campus not found");
        }

        console.log("campus", campus);
        console.log("data", data);

        const result = await Campus.updateById(id, {
            ...data,
            updated_at: new Date(),
        });

        console.log("result", result);

        return result;
    };

    // Delete
    public static readonly deleteCampus = async (id: string): Promise<void> => {
        const campus = await Campus.findById(id);

        if (!campus) {
            throw new Error("Campus not found");
        }

        await Campus.removeById(id);
    };
}
