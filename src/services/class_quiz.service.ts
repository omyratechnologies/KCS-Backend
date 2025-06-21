import { ClassQuiz, IClassQuiz } from "@/models/class_quiz.model";
import {
    ClassQuizAttempt,
    IClassQuizAttempt,
} from "@/models/class_quiz_attempt.model";
import {
    ClassQuizQuestion,
    IClassQuizQuestion,
} from "@/models/class_quiz_question.model";
import {
    ClassQuizSubmission,
    IClassQuizSubmission,
} from "@/models/class_quiz_submission.model";

export class ClassQuizService {
    // Create
    public static readonly createClassQuiz = async (
        campus_id: string,
        class_id: string,
        {
            quiz_name,
            quiz_description,
            quiz_meta_data,
        }: {
            quiz_name: string;
            quiz_description: string;
            quiz_meta_data: object;
        }
    ) => {
        return await ClassQuiz.create({
            campus_id,
            class_id,
            quiz_name,
            quiz_description,
            quiz_meta_data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // Read by ID
    public static readonly getClassQuizById = async (id: string) => {
        const data = await ClassQuiz.findById(id);

        if (!data) {
            return null;
        }

        return data;
    };

    // Get all by campus id and class id
    public static readonly getClassQuizByClassID = async (
        campus_id: string,
        class_id: string
    ) => {
        console.log("Searching for quizzes with:", { campus_id, class_id });
        
        // First, let's try to find any quizzes for this class_id without campus_id filter
        const allQuizzesForClass: {
            rows: IClassQuiz[];
        } = await ClassQuiz.find(
            {
                class_id: class_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );
        
        console.log("All quizzes for class_id (ignoring campus_id):", allQuizzesForClass.rows.length);
        
        const quiz: {
            rows: IClassQuiz[];
        } = await ClassQuiz.find(
            {
                campus_id: campus_id,
                class_id: class_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        console.log("Found quizzes with campus filter:", quiz.rows.length);
        if (quiz.rows.length > 0) {
            console.log("First quiz:", quiz.rows[0]);
        }

        if (quiz.rows.length === 0) {
            return [];
        }

        return quiz.rows;
    };

    // Get all quizzes from all classes
    public static readonly getAllClassQuizzes = async (
        campus_id: string
    ) => {
        const quiz: {
            rows: IClassQuiz[];
        } = await ClassQuiz.find(
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

        if (quiz.rows.length === 0) {
            return [];
        }

        return quiz.rows;
    };

    // Update by ID
    public static readonly updateClassQuizById = async (
        id: string,
        {
            quiz_name,
            quiz_description,
            quiz_meta_data,
        }: {
            quiz_name: string;
            quiz_description: string;
            quiz_meta_data: object;
        }
    ) => {
        return await ClassQuiz.updateById(id, {
            quiz_name,
            quiz_description,
            quiz_meta_data,
            updated_at: new Date(),
        });
    };

    // Delete by ID
    public static readonly deleteClassQuizById = async (id: string) => {
        return await ClassQuiz.updateById(id, {
            is_deleted: true,
            updated_at: new Date(),
        });
    };

    // Create Class Quiz Question
    public static readonly createClassQuizQuestions = async (
        campus_id: string,
        class_id: string,
        quiz_id: string,
        questionBank: {
            question_text: string;
            question_type: string;
            options: string[];
            correct_answer: string;
            meta_data: object;
        }[]
    ) => {
        for (const question of questionBank) {
            await ClassQuizQuestion.create({
                campus_id,
                class_id,
                quiz_id,
                ...question,
                is_active: true,
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        return "Class Quiz Questions created successfully";
    };

    // Read Class Quiz Question by ID
    public static readonly getClassQuizQuestionById = async (id: string) => {
        return await ClassQuizQuestion.findById(id);
    };

    // Get all Class Quiz Question by campus id, class id and quiz id
    public static readonly getClassQuizQuestionByClassIDAndByQuizID = async (
        campus_id: string,
        class_id: string,
        quiz_id: string
    ) => {
        const quiz: {
            rows: IClassQuizQuestion[];
        } = await ClassQuizQuestion.find(
            {
                campus_id: campus_id,
                class_id: class_id,
                quiz_id: quiz_id,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (quiz.rows.length === 0) {
            return [];
        }

        return quiz.rows;
    };

    // Update Class Quiz Question by ID
    public static readonly updateClassQuizQuestionById = async (
        id: string,
        {
            question_text,
            question_type,
            options,
            correct_answer,
            meta_data,
        }: {
            question_text: string;
            question_type: string;
            options: string[];
            correct_answer: string;
            meta_data: object;
        }
    ) => {
        return await ClassQuizQuestion.updateById(id, {
            question_text,
            question_type,
            options,
            correct_answer,
            meta_data,
            updated_at: new Date(),
        });
    };

    // Delete Class Quiz Question by ID
    public static readonly deleteClassQuizQuestionById = async (id: string) => {
        return await ClassQuizQuestion.updateById(id, {
            is_deleted: true,
            updated_at: new Date(),
        });
    };

    // Create Class Quiz Attempt
    public static readonly createClassQuizAttempt = async (
        campus_id: string,
        class_id: string,
        {
            quiz_id,
            student_id,
            question_id,
            opted_answer,
        }: {
            quiz_id: string;
            student_id: string;
            question_id: string;
            opted_answer: {
                option_id: string;
                answer: string;
            };
        }
    ) => {
        return await ClassQuizAttempt.create({
            campus_id,
            class_id,
            quiz_id,
            question_id,
            user_id: student_id,
            attempt_data: opted_answer,
            meta_data: {},
        });
    };

    // Read Class Quiz Attempt by Quiz ID and Student ID
    public static readonly getClassQuizAttemptByQuizIdAndStudentId = async (
        quiz_id: string,
        student_id: string
    ) => {
        const data: {
            rows: IClassQuizAttempt[];
        } = await ClassQuizAttempt.find(
            {
                quiz_id,
                user_id: student_id,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            return [];
        }

        return data.rows;
    };

    // Get all Class Quiz Attempt by campus id, class id and quiz id
    public static readonly getClassQuizAttemptByCampusIdAndClassIdAndQuizId =
        async (campus_id: string, class_id: string, quiz_id: string) => {
            const quiz: {
                rows: IClassQuizAttempt[];
            } = await ClassQuizAttempt.find(
                {
                    campus_id: campus_id,
                    class_id: class_id,
                    quiz_id: quiz_id,
                },
                {
                    sort: {
                        updated_at: "DESC",
                    },
                }
            );

            if (quiz.rows.length === 0) {
                return [];
            }

            return quiz.rows;
        };

    // Create Class Quiz Submission
    public static readonly createClassQuizSubmission = async (
        campus_id: string,
        class_id: string,
        quiz_id: string,
        user_id: string
    ) => {
        const quiz_questions =
            await this.getClassQuizQuestionByClassIDAndByQuizID(
                campus_id,
                class_id,
                quiz_id
            );

        const quiz_attempts =
            await this.getClassQuizAttemptByCampusIdAndClassIdAndQuizId(
                campus_id,
                class_id,
                quiz_id
            );

        const quiz_attempts_map = new Map<string, string>();
        for (const attempt of quiz_attempts) {
            quiz_attempts_map.set(attempt.question_id, attempt.attempt_data);
        }

        let score = 0;

        for (const question of quiz_questions) {
            const correct_answer = question.correct_answer;
            const student_answer = quiz_attempts_map.get(question.id);

            if (correct_answer === student_answer) {
                score++;
            }
        }

        const data = await ClassQuizSubmission.create({
            campus_id,
            class_id,
            quiz_id,
            user_id,
            submission_date: new Date(),
            score,
            feedback: "",
            meta_data: {},
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (!data) {
            throw new Error("Class Quiz Submission not created");
        }

        return data;
    };

    // Read Class Quiz Submission by ID
    public static readonly getClassQuizSubmissionById = async (id: string) => {
        return await ClassQuizSubmission.findById(id);
    };

    // Read Class Quiz Submission by Quiz ID and Student ID
    public static readonly getClassQuizSubmissionByQuizIdAndStudentId = async (
        quiz_id: string,
        student_id: string
    ) => {
        const data: {
            rows: IClassQuizSubmission[];
        } = await ClassQuizSubmission.find(
            {
                quiz_id,
                user_id: student_id,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            return null;
        }

        return data.rows[0];
    };

    // Get all Class Quiz Submission by campus id, class id
    public static readonly getClassQuizSubmissionByCampusIdAndClassId = async (
        campus_id: string,
        class_id: string
    ) => {
        const data: {
            rows: IClassQuizSubmission[];
        } = await ClassQuizSubmission.find(
            {
                campus_id,
                class_id,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            return [];
        }

        return data.rows;
    };

    // Update Class Quiz Submission by ID
    public static readonly updateClassQuizSubmissionById = async (
        id: string,
        data: {
            campus_id: string;
            class_id: string;
            quiz_id: string;
            user_id: string;
            submission_date: Date;
            score: number;
            feedback: string;
            meta_data: object;
        }
    ) => {
        return await ClassQuizSubmission.updateById(id, {
            ...data,
            updated_at: new Date(),
        });
    };
}
