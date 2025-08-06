import { Curriculum, ICurriculumData } from "@/models/curriculum.model";

export class CurriculumService {
    // Create
    public static readonly createCurriculum = async ({
        campus_id,
        name,
        description,
        meta_data,
    }: {
        campus_id: string;
        name: string;
        description: string;
        meta_data: object;
    }) => {
        return await Curriculum.create({
            campus_id,
            name,
            description,
            meta_data,
            is_active: true,
            is_deleted: false,
        });
    };

    // Read by ID
    public static readonly getCurriculumById = async (id: string) => {
        return await Curriculum.findById(id);
    };

    // Get all by campus id
    public static readonly getCurriculumsByCampusId = async (campus_id: string) => {
        const curriculum: {
            rows: ICurriculumData[];
        } = await Curriculum.find(
            {
                campus_id: campus_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (curriculum.rows.length === 0) {
            return [];
        }

        return curriculum.rows;
    };

    // Update by ID
    public static readonly updateCurriculumById = async (id: string, data: Partial<ICurriculumData>) => {
        return await Curriculum.updateById(id, {
            ...data,
            updated_at: new Date(),
        });
    };

    // Delete by ID
    public static readonly deleteCurriculumById = async (id: string) => {
        return await Curriculum.updateById(id, { is_deleted: true });
    };
}
