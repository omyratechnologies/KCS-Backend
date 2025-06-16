import { Campus, ICampus } from "@/models/campus.model";

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
        return await Campus.create({
            name: name,
            address: address,
            domain: domain,
            meta_data: meta_data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
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
