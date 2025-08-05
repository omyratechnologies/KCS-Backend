import { ISyllabusData, Syllabus } from "@/models/syllabus.model";

export class SyllabusService {
    // Create
    public static readonly createSyllabus = async (
        campus_id: string,
        data: {
            subject_id: string;
            name: string;
            description: string;
            meta_data: object;
        }
    ) => {
        return await Syllabus.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // Read by ID
    public static readonly getSyllabusById = async (id: string) => {
        return await Syllabus.findById(id);
    };

    // Get all by campus id
    public static readonly getSyllabusByCampusId = async (campus_id: string) => {
        const syllabus: {
            rows: ISyllabusData[];
        } = await Syllabus.find(
            {
                campus_id: campus_id,
                is_deleted: false,
                is_active: true,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (syllabus.rows.length === 0) {
            return [];
        }

        return syllabus.rows;
    };

    // Get all by subject id
    public static readonly getSyllabusBySubjectId = async (subject_id: string) => {
        const syllabus: {
            rows: ISyllabusData[];
        } = await Syllabus.find(
            {
                subject_id: subject_id,
                is_deleted: false,
                is_active: true,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (syllabus.rows.length === 0) {
            return [];
        }

        return syllabus.rows;
    };

    // Update by ID
    public static readonly updateSyllabusById = async (id: string, data: Partial<ISyllabusData>) => {
        return await Syllabus.updateById(id, {
            ...data,
            updated_at: new Date(),
        });
    };

    // Delete by ID
    public static readonly deleteSyllabusById = async (id: string) => {
        return await Syllabus.updateById(id, {
            is_deleted: true,
            is_active: false,
        });
    };
}
