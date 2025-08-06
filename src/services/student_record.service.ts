import { IStudentRecordData, StudentRecord } from "@/models/student_record.model";

export class StudentRecordService {
    // create student record
    public static readonly createStudentRecord = async (
        campus_id: string,
        student_id: string,
        record_data: Partial<IStudentRecordData>
    ) => {
        return await StudentRecord.create({
            campus_id,
            student_id,
            record_data,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // get student record by student id
    public static readonly getStudentRecordByStudentId = async (student_id: string) => {
        const studentRecords: {
            rows: IStudentRecordData[];
        } = await StudentRecord.find(
            {
                student_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (studentRecords.rows.length === 0) {
            return [];
        }

        return studentRecords.rows;
    };

    // get student record by campus id
    public static readonly getStudentRecordByCampusId = async (campus_id: string) => {
        const studentRecords: {
            rows: IStudentRecordData[];
        } = await StudentRecord.find(
            {
                campus_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (studentRecords.rows.length === 0) {
            return [];
        }

        return studentRecords.rows;
    };

    // get student record by id
    public static readonly getStudentRecordById = async (id: string) => {
        return await StudentRecord.findById(id);
    };

    // update student record by id
    public static readonly updateStudentRecordById = async (id: string, data: Partial<IStudentRecordData>) => {
        const studentRecord = await StudentRecord.updateById(id, {
            ...data,
            updated_at: new Date(),
        });
        if (!studentRecord) {
            throw new Error("Student record not updated");
        }
        return studentRecord;
    };

    // delete student record by id
    public static readonly deleteStudentRecordById = async (id: string) => {
        const studentRecord = await StudentRecord.updateById(id, {
            is_deleted: true,
            is_active: false,
        });
        if (!studentRecord) {
            throw new Error("Student record not deleted");
        }
        return studentRecord;
    };
}
