import { ExamTerm, IExamTermData } from "@/models/exam_term.model";
import { Examination, IExaminationData } from "@/models/examination.model";

export class ExamService {
    // create exam term
    public static readonly createExamTerm = async (
        campus_id: string,
        data: {
            name: string;
            start_date: Date;
            end_date: Date;
            meta_data: object;
        }
    ) => {
        return await ExamTerm.create({
            campus_id,
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // get all exam terms
    public static readonly getExamTerms = async (campus_id: string) => {
        const data: {
            rows: IExamTermData[];
        } = await ExamTerm.find(
            { campus_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) throw new Error("Exam terms not found");

        return data.rows;
    };

    // get exam term by id
    public static readonly getExamTermById = async (id: string) => {
        const data = await ExamTerm.findById(id);

        if (!data) throw new Error("Exam term not found");

        return data;
    };

    // update exam term
    public static readonly updateExamTerm = async (
        id: string,
        data: Partial<IExamTermData>
    ) => {
        const examTerm = await ExamTerm.updateById(id, data);

        if (!examTerm) throw new Error("Exam term not updated");

        return examTerm;
    };

    // delete exam term
    public static readonly deleteExamTerm = async (id: string) => {
        const examTerm = await ExamTerm.updateById(id, { is_deleted: true });

        if (!examTerm) throw new Error("Exam term not deleted");

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

        if (data.rows.length === 0) throw new Error("Examinations not found");

        return data.rows;
    };

    // get examination by id
    public static readonly getExaminationById = async (id: string) => {
        const data = await Examination.findById(id);

        if (!data) throw new Error("Examination not found");

        return data;
    };

    // update examination
    public static readonly updateExamination = async (
        id: string,
        data: Partial<IExaminationData>
    ) => {
        const examination = await Examination.updateById(id, data);

        if (!examination) throw new Error("Examination not updated");

        return examination;
    };

    // delete examination
    public static readonly deleteExamination = async (id: string) => {
        const examination = await Examination.updateById(id, {
            is_deleted: true,
        });

        if (!examination) throw new Error("Examination not deleted");

        return examination;
    };

    // get examination by exam term id
    public static readonly getExaminationsByExamTermId = async (
        exam_term_id: string
    ) => {
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

        if (data.rows.length === 0) throw new Error("Examinations not found");

        return data.rows;
    };

    // get examination by subject id
    public static readonly getExaminationsBySubjectId = async (
        subject_id: string
    ) => {
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

        if (data.rows.length === 0) throw new Error("Examinations not found");

        return data.rows;
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

        if (data.rows.length === 0) throw new Error("Examinations not found");

        return data.rows;
    };
}
