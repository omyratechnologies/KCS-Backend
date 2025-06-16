import { CourseQuiz, ICourseQuiz } from "@/models/course_quiz.model";
import {
    CourseQuizAttempt,
    ICourseQuizAttempt,
} from "@/models/course_quiz_attempt.model";
import {
    CourseQuizQuestion,
    ICourseQuizQuestion,
} from "@/models/course_quiz_question.model";
import {
    CourseQuizSubmission,
    ICourseQuizSubmission,
} from "@/models/course_quiz_submission.model";

export class CourseQuizService {
    // Create
    public static readonly createCourseQuiz = async (
        campus_id: string,
        course_id: string,
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
        return await CourseQuiz.create({
            campus_id,
            course_id,
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
    public static readonly getCourseQuizById = async (id: string) => {
        const data: {
            rows: ICourseQuiz[];
        } = await CourseQuiz.findById(id);

        if (data.rows.length === 0) {
            return null;
        }

        return data.rows[0];
    };

    // Get all by campus id and course id
    public static readonly getCourseQuizByCourseID = async (
        campus_id: string,
        course_id: string
    ) => {
        const quiz: {
            rows: ICourseQuiz[];
        } = await CourseQuiz.find(
            {
                campus_id: campus_id,
                course_id: course_id,
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
    public static readonly updateCourseQuizById = async (
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
        return await CourseQuiz.updateById(id, {
            quiz_name,
            quiz_description,
            quiz_meta_data,
            updated_at: new Date(),
        });
    };

    // Delete by ID
    public static readonly deleteCourseQuizById = async (id: string) => {
        return await CourseQuiz.updateById(id, {
            is_deleted: true,
            updated_at: new Date(),
        });
    };

    // Create course Quiz Question
    public static readonly createCourseQuizQuestions = async (
        campus_id: string,
        course_id: string,
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
            await CourseQuizQuestion.create({
                campus_id,
                course_id,
                quiz_id,
                ...question,
                is_active: true,
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        return "course Quiz Questions created successfully";
    };

    // Read course Quiz Question by ID
    public static readonly getCourseQuizQuestionById = async (id: string) => {
        return await CourseQuizQuestion.findById(id);
    };

    // Get all course Quiz Question by campus id, course id and quiz id
    public static readonly getCourseQuizQuestionByCourseIDAndByQuizID = async (
        campus_id: string,
        course_id: string,
        quiz_id: string
    ) => {
        const quiz: {
            rows: ICourseQuizQuestion[];
        } = await CourseQuizQuestion.find(
            {
                campus_id: campus_id,
                course_id: course_id,
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

    // Update course Quiz Question by ID
    public static readonly updateCourseQuizQuestionById = async (
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
        return await CourseQuizQuestion.updateById(id, {
            question_text,
            question_type,
            options,
            correct_answer,
            meta_data,
            updated_at: new Date(),
        });
    };

    // Delete course Quiz Question by ID
    public static readonly deleteCourseQuizQuestionById = async (
        id: string
    ) => {
        return await CourseQuizQuestion.updateById(id, {
            is_deleted: true,
            updated_at: new Date(),
        });
    };

    // Create course Quiz Attempt
    public static readonly createCourseQuizAttempt = async (
        campus_id: string,
        course_id: string,
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
        return await CourseQuizAttempt.create({
            campus_id,
            course_id,
            quiz_id,
            question_id,
            user_id: student_id,
            attempt_data: opted_answer,
            meta_data: {},
        });
    };

    // Read course Quiz Attempt by Quiz ID and Student ID
    public static readonly getCourseQuizAttemptByQuizIdAndStudentId = async (
        quiz_id: string,
        student_id: string
    ) => {
        const data: {
            rows: ICourseQuizAttempt[];
        } = await CourseQuizAttempt.find(
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

    // Get all course Quiz Attempt by campus id, course id and quiz id
    public static readonly getCourseQuizAttemptByCampusIdAndCourseIdAndQuizId =
        async (campus_id: string, course_id: string, quiz_id: string) => {
            const quiz: {
                rows: ICourseQuizAttempt[];
            } = await CourseQuizAttempt.find(
                {
                    campus_id: campus_id,
                    course_id: course_id,
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

    // Create course Quiz Submission
    public static readonly createCourseQuizSubmission = async (
        campus_id: string,
        course_id: string,
        quiz_id: string,
        user_id: string
    ) => {
        const quiz_questions =
            await this.getCourseQuizQuestionByCourseIDAndByQuizID(
                campus_id,
                course_id,
                quiz_id
            );

        const quiz_attempts =
            await this.getCourseQuizAttemptByCampusIdAndCourseIdAndQuizId(
                campus_id,
                course_id,
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

        const data = await CourseQuizSubmission.create({
            campus_id,
            course_id,
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
            throw new Error("course Quiz Submission not created");
        }

        return data;
    };

    // Read course Quiz Submission by ID
    public static readonly getCourseQuizSubmissionById = async (id: string) => {
        return await CourseQuizSubmission.findById(id);
    };

    // Read course Quiz Submission by Quiz ID and Student ID
    public static readonly getCourseQuizSubmissionByQuizIdAndStudentId = async (
        quiz_id: string,
        student_id: string
    ) => {
        const data: {
            rows: ICourseQuizSubmission[];
        } = await CourseQuizSubmission.find(
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

    // Get all course Quiz Submission by campus id, course id
    public static readonly getCourseQuizSubmissionByCampusIdAndCourseId =
        async (campus_id: string, course_id: string) => {
            const data: {
                rows: ICourseQuizSubmission[];
            } = await CourseQuizSubmission.find(
                {
                    campus_id,
                    course_id,
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

    // Update course Quiz Submission by ID
    public static readonly updateCourseQuizSubmissionById = async (
        id: string,
        data: {
            campus_id: string;
            course_id: string;
            quiz_id: string;
            user_id: string;
            submission_date: Date;
            score: number;
            feedback: string;
            meta_data: object;
        }
    ) => {
        return await CourseQuizSubmission.updateById(id, {
            ...data,
            updated_at: new Date(),
        });
    };
}
