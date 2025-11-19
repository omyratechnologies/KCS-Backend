import { Class } from "@/models/class.model";
import { ExamTerm, IExamTermData } from "@/models/exam_term.model";
import { Examination, IExaminationData } from "@/models/examination.model";
import { Subject } from "@/models/subject.model";

export class ExamService {
    // Enrich exam term with class names
    private static readonly enrichExamTerm = async (examTerm: IExamTermData) => {
        try {
            const classes = await Promise.all(
                (examTerm.class_ids || []).map(async (class_id: string) => {
                    try {
                        const classInfo = await Class.findById(class_id);
                        return {
                            id: class_id,
                            name: classInfo?.name || "Unknown Class",
                        };
                    } catch (error) {
                        return {
                            id: class_id,
                            name: "Unknown Class",
                        };
                    }
                })
            );

            return {
                ...examTerm,
                classes,
            };
        } catch (error) {
            return {
                ...examTerm,
                classes: (examTerm.class_ids || []).map(id => ({
                    id,
                    name: "Unknown Class"
                })),
            };
        }
    };

    // Enrich examination with subject details
    private static readonly enrichExamination = async (examination: IExaminationData) => {
        try {
            const subject = await Subject.findById(examination.subject_id);
            const examTerm = await ExamTerm.findById(examination.exam_term_id);
            
            return {
                ...examination,
                subject: {
                    id: examination.subject_id,
                    name: subject?.name || "Unknown Subject",
                    code: subject?.code || "Unknown Code",
                    credits: (subject?.meta_data as { credits?: number })?.credits || 0,
                },
                exam_term: {
                    id: examination.exam_term_id,
                    name: examTerm?.name || "Unknown Term",
                },
            };
        } catch (error) {
            return {
                ...examination,
                subject: {
                    id: examination.subject_id,
                    name: "Unknown Subject",
                    code: "Unknown Code",
                    credits: 0,
                },
                exam_term: {
                    id: examination.exam_term_id,
                    name: "Unknown Term",
                },
            };
        }
    };

    // create exam term
    public static readonly createExamTerm = async (
        campus_id: string,
        data: {
            name: string;
            class_ids: string[];
            start_date: Date;
            end_date: Date;
            meta_data: object;
        }
    ) => {
        // Validate that all classes exist
        for (const class_id of data.class_ids) {
            const classExists = await Class.findById(class_id);
            if (!classExists) {
                throw new Error(`Class with ID ${class_id} not found`);
            }
            // Ensure class belongs to the same campus
            if (classExists.campus_id !== campus_id) {
                throw new Error(`Class with ID ${class_id} does not belong to this campus`);
            }
        }

        return await ExamTerm.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // get all exam terms
    public static readonly getExamTerms = async (campus_id: string) => {
        const data: {
            rows: IExamTermData[];
        } = await ExamTerm.find(
            { campus_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            return [];
        }

        // Enrich with class names
        const enrichedTerms = await Promise.all(
            data.rows.map(term => this.enrichExamTerm(term))
        );

        return enrichedTerms;
    };

    // get exam term by id
    public static readonly getExamTermById = async (id: string) => {
        const data = await ExamTerm.findById(id);

        if (!data) {
            throw new Error("Exam term not found");
        }

        // Enrich with class names
        return await this.enrichExamTerm(data);
    };

    // update exam term
    public static readonly updateExamTerm = async (id: string, data: Partial<IExamTermData>) => {
        // If updating class_ids, validate that all classes exist
        if (data.class_ids) {
            const examTerm = await ExamTerm.findById(id);
            if (!examTerm) {
                throw new Error("Exam term not found");
            }

            for (const class_id of data.class_ids) {
                const classExists = await Class.findById(class_id);
                if (!classExists) {
                    throw new Error(`Class with ID ${class_id} not found`);
                }
                // Ensure class belongs to the same campus
                if (classExists.campus_id !== examTerm.campus_id) {
                    throw new Error(`Class with ID ${class_id} does not belong to this campus`);
                }
            }
        }

        const updatedExamTerm = await ExamTerm.updateById(id, data);

        if (!updatedExamTerm) {
            throw new Error("Exam term not updated");
        }

        return updatedExamTerm;
    };

    // delete exam term
    public static readonly deleteExamTerm = async (id: string) => {
        const examTerm = await ExamTerm.updateById(id, { is_deleted: true });

        if (!examTerm) {
            throw new Error("Exam term not deleted");
        }

        return examTerm;
    };

    // create examination
    public static readonly createExamination = async (
        campus_id: string,
        data: {
            subject_id: string;
            date: Date;
            start_time: Date;
            end_time: Date;
            exam_term_id: string;
            meta_data: object;
        }
    ) => {
        return await Examination.create({
            campus_id,
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // get all examinations
    public static readonly getExaminations = async (campus_id: string) => {
        const data: {
            rows: IExaminationData[];
        } = await Examination.find(
            { campus_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            return [];
        }

        // Enrich with subject details
        const enrichedExaminations = await Promise.all(
            data.rows.map(exam => this.enrichExamination(exam))
        );

        return enrichedExaminations;
    };

    // get examination by id
    public static readonly getExaminationById = async (id: string) => {
        const data = await Examination.findById(id);

        if (!data) {
            throw new Error("Examination not found");
        }

        // Enrich with subject details
        return await this.enrichExamination(data);
    };

    // update examination
    public static readonly updateExamination = async (id: string, data: Partial<IExaminationData>) => {
        const examination = await Examination.updateById(id, data);

        if (!examination) {
            throw new Error("Examination not updated");
        }

        return examination;
    };

    // delete examination
    public static readonly deleteExamination = async (id: string) => {
        const examination = await Examination.updateById(id, {
            is_deleted: true,
        });

        if (!examination) {
            throw new Error("Examination not deleted");
        }

        return examination;
    };

    // get examination by exam term id
    public static readonly getExaminationsByExamTermId = async (exam_term_id: string) => {
        const data: {
            rows: IExaminationData[];
        } = await Examination.find(
            { exam_term_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            return [];
        }

        // Enrich with subject details
        const enrichedExaminations = await Promise.all(
            data.rows.map(exam => this.enrichExamination(exam))
        );

        return enrichedExaminations;
    };

    // get examination by subject id
    public static readonly getExaminationsBySubjectId = async (subject_id: string) => {
        const data: {
            rows: IExaminationData[];
        } = await Examination.find(
            { subject_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            return [];
        }

        // Enrich with subject details
        const enrichedExaminations = await Promise.all(
            data.rows.map(exam => this.enrichExamination(exam))
        );

        return enrichedExaminations;
    };

    // get examination by date
    public static readonly getExaminationsByDate = async (date: Date) => {
        const data: {
            rows: IExaminationData[];
        } = await Examination.find(
            { date },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            return [];
        }

        // Enrich with subject details
        const enrichedExaminations = await Promise.all(
            data.rows.map(exam => this.enrichExamination(exam))
        );

        return enrichedExaminations;
    };
}
