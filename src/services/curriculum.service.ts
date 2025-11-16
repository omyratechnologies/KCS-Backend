import { Curriculum, ICurriculumData, IUnit } from "@/models/curriculum.model";
import { v4 as uuidv4 } from "uuid";

export class CurriculumService {
    // Helper function to generate IDs for units and chapters
    // ALWAYS generates new IDs, ignoring any user-provided IDs
    private static generateIdsForUnits(units: IUnit[]): IUnit[] {
        return units.map((unit) => ({
            ...unit,
            id: uuidv4(), // ALWAYS generate new ID (ignore user input)
            chapters: unit.chapters.map((chapter) => ({
                ...chapter,
                id: uuidv4(), // ALWAYS generate new ID (ignore user input)
            })),
        }));
    }

    // Create a new curriculum - only one per subject
    public static readonly createCurriculum = async ({
        campus_id,
        subject_id,
        created_by,
        units = [],
    }: {
        campus_id: string;
        subject_id: string;
        created_by: string;
        units?: IUnit[];
    }) => {
        // Check if curriculum already exists for this subject
        const existingCurriculum = await Curriculum.find({
            campus_id,
            subject_id,
        });

        if (existingCurriculum.rows && existingCurriculum.rows.length > 0) {
            throw new Error("Curriculum already exists for this subject. Please update the existing curriculum instead.");
        }

        // Generate IDs for units and chapters
        const unitsWithIds = this.generateIdsForUnits(units);

        return await Curriculum.create({
            campus_id,
            subject_id,
            units: unitsWithIds,
            created_by,
            updated_by: created_by, // Initially set updated_by to creator
        });
    };

    // Get curriculum by ID
    public static readonly getCurriculumById = async (id: string) => {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
            throw new Error("Curriculum not found");
        }
        return curriculum;
    };

    // Get curriculum by subject ID
    public static readonly getCurriculumBySubjectId = async (campus_id: string, subject_id: string) => {
        const curriculum = await Curriculum.find({
            campus_id,
            subject_id,
        });

        if (!curriculum.rows || curriculum.rows.length === 0) {
            throw new Error("Curriculum not found for this subject");
        }

        return curriculum.rows[0]; // Return the first (and only) curriculum for this subject
    };

    // Get all curriculums by campus ID with optional label filtering
    public static readonly getCurriculumsByCampusId = async (campus_id: string, label_ids?: string[]) => {
        const curriculums: {
            rows: ICurriculumData[];
        } = await Curriculum.find(
            {
                campus_id: campus_id,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        // If no label filter, return all curriculums
        if (!label_ids || label_ids.length === 0) {
            return curriculums.rows;
        }

        // Filter units and chapters by labels and return curriculums with only matching units/chapters
        const filteredCurriculums = curriculums.rows
            .map((curriculum) => {
                const matchingUnits = curriculum.units
                    .map((unit) => {
                        const matchingChapters = unit.chapters.filter((chapter) => {
                            if (!chapter.label_ids || chapter.label_ids.length === 0) {
                                return false;
                            }
                            // Check if chapter has any of the requested labels
                            return chapter.label_ids.some((labelId) => label_ids.includes(labelId));
                        });

                        // Only return unit if it has matching chapters
                        if (matchingChapters.length > 0) {
                            return {
                                ...unit,
                                chapters: matchingChapters,
                            };
                        }
                        return null;
                    })
                    .filter((unit) => unit !== null);

                // Only return curriculum if it has matching units
                if (matchingUnits.length > 0) {
                    return {
                        ...curriculum,
                        units: matchingUnits,
                    };
                }
                return null;
            })
            .filter((curriculum) => curriculum !== null) as ICurriculumData[];

        return filteredCurriculums;
    };

    // Update curriculum by ID - tracks who updated it
    public static readonly updateCurriculumById = async (
        id: string,
        updated_by: string,
        data: { units?: IUnit[] }
    ) => {
        // Generate IDs for units and chapters if provided
        const updateData = data.units 
            ? { units: this.generateIdsForUnits(data.units) }
            : {};

        return await Curriculum.updateById(id, {
            ...updateData,
            updated_by,
            updated_at: new Date(),
        });
    };

    // Delete is not allowed - curriculum can only be modified
    // If you need to deactivate, add an is_active field to the model
}
