import { randomBytes } from "node:crypto";

import { Class, IClassData } from "@/models/class.model";
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
    ClassQuizSession,
    IClassQuizSession,
} from "@/models/class_quiz_session.model";
import {
    ClassQuizSubmission,
    IClassQuizSubmission,
} from "@/models/class_quiz_submission.model";
import { IUser, User } from "@/models/user.model";

// Utility function to format time in seconds to a readable format
const formatTime = (seconds: number): string => {
    if (seconds === 0) {return "0 seconds";}

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];
    if (hours > 0) {parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);}
    if (minutes > 0) {parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);}
    if (remainingSeconds > 0)
        {parts.push(
            `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`
        );}

    return parts.join(", ");
};

interface QuizSettings {
    time_limit_minutes?: number;
    shuffle_questions?: boolean;
    allow_review?: boolean;
    show_results_immediately?: boolean;
    max_attempts?: number;
    available_from?: Date;
    available_until?: Date;
}

interface QuizSessionResponse {
    session: IClassQuizSession;
    quiz: IClassQuiz;
    current_question?: IClassQuizQuestion;
    questions_count: number;
    time_remaining_seconds?: number;
    can_go_previous?: boolean;
    can_go_next?: boolean;
}

interface QuizResult {
    score: number;
    total_questions: number;
    percentage: number;
    correct_answers: number;
    incorrect_answers: number;
    time_taken_seconds: number;
    submission: IClassQuizSubmission;
}

export class ClassQuizService {
    // ======================= QUIZ MANAGEMENT =======================

    public static readonly createClassQuiz = async (
        campus_id: string,
        created_by: string,
        class_id: string,
        {
            quiz_name,
            quiz_description,
            quiz_meta_data,
        }: {
            quiz_name: string;
            quiz_description: string;
            quiz_meta_data: QuizSettings;
        }
    ) => {
        return await ClassQuiz.create({
            campus_id,
            created_by,
            class_id,
            quiz_name,
            quiz_description,
            quiz_meta_data: {
                time_limit_minutes: 30,
                shuffle_questions: false,
                allow_review: true,
                show_results_immediately: true,
                max_attempts: 1,
                ...quiz_meta_data,
            },
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    public static readonly getAllQuizzesFromAllClasses = async (
        campus_id: string
    ) => {
        const quizzes = await ClassQuiz.find(
            {
                campus_id,
                is_deleted: false,
            },
            {
                sort: { created_at: "DESC" },
            }
        );

        return quizzes || [];
    };

    public static readonly getClassQuizById = async (id: string) => {
        const quiz = await ClassQuiz.findById(id);
        if (!quiz || quiz.is_deleted) {
            return null;
        }
        return quiz;
    };

    public static readonly getClassQuizByClassID = async (
        campus_id: string,
        class_id: string
    ) => {
        const result = await ClassQuiz.find(
            {
                campus_id,
                class_id,
                is_deleted: false,
            },
            {
                sort: { created_at: "DESC" },
            }
        );

        return result.rows || [];
    };

    public static readonly getClassQuizByCreatedBy = async (
        campus_id: string,
        created_by: string
    ) => {
        const result = await ClassQuiz.find(
            {
                campus_id,
                created_by,
                is_deleted: false,
            },
            {
                sort: { created_at: "DESC" },
            }
        );

        const quizzes = result.rows || [];

        // Enhance quiz data with class information and status
        return await Promise.all(
            quizzes.map(async (quiz) => {
                // Get class information
                const classData = await Class.findById(quiz.class_id);

                // Get quiz questions count
                const questionsResult = await ClassQuizQuestion.find({
                    quiz_id: quiz.id,
                    is_deleted: false,
                });
                const questionsCount = questionsResult.rows?.length || 0;

                // Get quiz submissions count
                const submissionsResult = await ClassQuizSubmission.find({
                    quiz_id: quiz.id,
                    is_deleted: false,
                });
                const submissionsCount = submissionsResult.rows?.length || 0;

                // Determine quiz status
                const quizSettings = quiz.quiz_meta_data as QuizSettings;
                let status = "Draft";

                if (questionsCount > 0) {
                    // Check if quiz is published based on availability settings
                    if (
                        quizSettings.available_from &&
                        quizSettings.available_until
                    ) {
                        const now = new Date();
                        const availableFrom = new Date(
                            quizSettings.available_from
                        );
                        const availableUntil = new Date(
                            quizSettings.available_until
                        );

                        if (now > availableUntil) {
                            status = "Completed";
                        } else if (now >= availableFrom) {
                            status = "Published";
                        } else {
                            status = "Published"; // Scheduled for future
                        }
                    } else {
                        // No time restrictions, consider it published if it has questions
                        status =
                            submissionsCount > 0 ? "Published" : "Published";
                    }
                }

                // Format due date
                let dueDate: Date | null = null;
                let dueDateDisplay = "Not scheduled";

                if (quizSettings.available_until) {
                    dueDate = new Date(quizSettings.available_until);
                    dueDateDisplay = dueDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    });
                }

                // Format completion date for completed quizzes
                let completionDate: Date | null = null;
                if (status === "Completed" && quizSettings.available_until) {
                    completionDate = new Date(quizSettings.available_until);
                }

                return {
                    id: quiz.id,
                    quiz_name: quiz.quiz_name,
                    quiz_description: quiz.quiz_description,
                    class_id: quiz.class_id,
                    class_name: classData?.name || "Unknown Class",
                    status,
                    due_date: dueDate,
                    due_date_display: dueDateDisplay,
                    completion_date: completionDate,
                    questions_count: questionsCount,
                    submissions_count: submissionsCount,
                    time_limit_minutes: quizSettings.time_limit_minutes || null,
                    max_attempts: quizSettings.max_attempts || 1,
                    quiz_meta_data: quiz.quiz_meta_data,
                    created_at: quiz.created_at,
                    updated_at: quiz.updated_at,
                    is_active: quiz.is_active,
                    created_by: quiz.created_by,
                    campus_id: quiz.campus_id,
                    // Dashboard specific fields
                    dashboard_display: {
                        title: quiz.quiz_name,
                        subtitle: classData?.name || "Unknown Class",
                        status_label: status,
                        status_color:
                            status === "Published"
                                ? "success"
                                : status === "Completed"
                                  ? "neutral"
                                  : "warning",
                        date_label: status === "Completed" ? "Ended" : "Due",
                        date_value:
                            status === "Completed" ? completionDate : dueDate,
                        date_display:
                            status === "Completed"
                                ? completionDate
                                    ? completionDate.toLocaleDateString(
                                          "en-US",
                                          {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                          }
                                      )
                                    : "Recently ended"
                                : dueDateDisplay,
                        participants_count: submissionsCount,
                        questions_count: questionsCount,
                    },
                };
            })
        );
    };

    public static readonly getAllClassQuizzes = async (campus_id: string) => {
        const result = await ClassQuiz.find(
            {
                campus_id,
                is_deleted: false,
            },
            {
                sort: { created_at: "DESC" },
            }
        );

        return result.rows || [];
    };

    public static readonly updateClassQuizById = async (
        id: string,
        updates: {
            quiz_name?: string;
            quiz_description?: string;
            quiz_meta_data?: QuizSettings;
        }
    ) => {
        return await ClassQuiz.updateById(id, {
            ...updates,
            updated_at: new Date(),
        });
    };

    public static readonly deleteClassQuizById = async (id: string) => {
        // Check if quiz has active sessions
        const activeSessions = await ClassQuizSession.find({
            quiz_id: id,
            status: "in_progress",
            is_deleted: false,
        });

        if (activeSessions.rows && activeSessions.rows.length > 0) {
            throw new Error("Cannot delete quiz with active sessions");
        }

        // Delete all questions associated with this quiz
        const questions = await ClassQuizQuestion.find({
            quiz_id: id,
            is_deleted: false,
        });

        if (questions.rows && questions.rows.length > 0) {
            await Promise.all(
                questions.rows.map((question) =>
                    ClassQuizQuestion.updateById(question.id, {
                        is_deleted: true,
                        updated_at: new Date(),
                    })
                )
            );
        }

        // Delete the quiz
        return await ClassQuiz.updateById(id, {
            is_deleted: true,
            updated_at: new Date(),
        });
    };

    // ======================= QUESTION MANAGEMENT =======================

    public static readonly createClassQuizQuestions = async (
        campus_id: string,
        class_id: string,
        quiz_id: string,
        questionBank: {
            question_text: string;
            question_type: string;
            options: string[];
            correct_answer: string;
            meta_data?: object;
        }[]
    ) => {
        const createdQuestions: IClassQuizQuestion[] = [];

        for (const question of questionBank) {
            const createdQuestion = await ClassQuizQuestion.create({
                campus_id,
                class_id,
                quiz_id,
                question_text: question.question_text,
                question_type: question.question_type,
                options: question.options,
                correct_answer: question.correct_answer,
                meta_data: question.meta_data || {},
                is_active: true,
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });
            createdQuestions.push(createdQuestion as IClassQuizQuestion);
        }

        return {
            message: "Quiz questions created successfully",
            questions_count: createdQuestions.length,
            questions: createdQuestions,
        };
    };

    public static readonly getClassQuizQuestionsByQuizId = async (
        campus_id: string,
        class_id: string,
        quiz_id: string
    ) => {
        const result = await ClassQuizQuestion.find(
            {
                campus_id,
                class_id,
                quiz_id,
                is_deleted: false,
            },
            {
                sort: { created_at: "ASC" },
            }
        );

        return result.rows || [];
    };

    public static readonly updateClassQuizQuestionById = async (
        id: string,
        updates: {
            question_text?: string;
            question_type?: string;
            options?: string[];
            correct_answer?: string;
            meta_data?: object;
        }
    ) => {
        return await ClassQuizQuestion.updateById(id, {
            ...updates,
            updated_at: new Date(),
        });
    };

    public static readonly deleteClassQuizQuestionById = async (id: string) => {
        return await ClassQuizQuestion.updateById(id, {
            is_deleted: true,
            updated_at: new Date(),
        });
    };

    // ======================= QUIZ SESSION MANAGEMENT =======================

    public static readonly startQuizSession = async (
        campus_id: string,
        class_id: string,
        quiz_id: string,
        user_id: string
    ): Promise<QuizSessionResponse> => {
        // Validate quiz exists and is available
        const quiz = await this.getClassQuizById(quiz_id);
        if (!quiz) {
            throw new Error("Quiz not found");
        }

        const quizSettings = quiz.quiz_meta_data as QuizSettings;

        // Check availability window
        if (
            quizSettings.available_from &&
            new Date() < new Date(quizSettings.available_from)
        ) {
            throw new Error("Quiz is not yet available");
        }

        if (
            quizSettings.available_until &&
            new Date() > new Date(quizSettings.available_until)
        ) {
            throw new Error("Quiz is no longer available");
        }

        // Check if user already has completed the quiz
        const existingSubmission =
            await this.getClassQuizSubmissionByQuizIdAndStudentId(
                quiz_id,
                user_id
            );

        if (existingSubmission && quizSettings.max_attempts === 1) {
            throw new Error("Quiz already completed");
        }

        // Check if user has an active session
        const existingSession = await this.getActiveQuizSession(
            quiz_id,
            user_id
        );
        if (existingSession) {
            // Resume existing session
            return await this.getQuizSessionResponse(existingSession);
        }

        // Get quiz questions
        const questions = await this.getClassQuizQuestionsByQuizId(
            campus_id,
            class_id,
            quiz_id
        );

        if (questions.length === 0) {
            throw new Error("Quiz has no questions");
        }

        // Shuffle questions if enabled
        const orderedQuestions = quizSettings.shuffle_questions
            ? this.shuffleArray([...questions])
            : questions;

        // Create new session
        const sessionToken = this.generateSessionToken();
        const now = new Date();
        const expiresAt = quizSettings.time_limit_minutes
            ? new Date(
                  now.getTime() + quizSettings.time_limit_minutes * 60 * 1000
              )
            : null;

        const session = await ClassQuizSession.create({
            campus_id,
            class_id,
            quiz_id,
            user_id,
            session_token: sessionToken,
            status: "in_progress",
            started_at: now,
            completed_at: null,
            expires_at: expiresAt,
            time_limit_minutes: quizSettings.time_limit_minutes || null,
            remaining_time_seconds: quizSettings.time_limit_minutes
                ? quizSettings.time_limit_minutes * 60
                : null,
            last_activity_at: now,
            answers_count: 0,
            total_questions: questions.length,
            current_question_index: 0,
            meta_data: {
                question_order: orderedQuestions.map((q) => q.id),
                quiz_settings: quizSettings,
            },
            is_active: true,
            is_deleted: false,
            created_at: now,
            updated_at: now,
        });

        return await this.getQuizSessionResponse(session);
    };

    public static readonly getQuizSession = async (
        session_token: string,
        user_id: string
    ): Promise<QuizSessionResponse> => {
        return await this.getSessionWithTimeoutCheck(session_token, user_id);
    };

    public static readonly submitAnswer = async (
        session_token: string,
        user_id: string,
        question_id: string,
        answer: string
    ): Promise<QuizSessionResponse> => {
        // Use timeout-aware session validation
        const sessionResult = await ClassQuizSession.find({
            session_token,
            user_id,
            is_deleted: false,
        });

        if (!sessionResult.rows || sessionResult.rows.length === 0) {
            throw new Error("Invalid session");
        }

        const session = sessionResult.rows[0];

        // Check if session is expired and auto-submit if needed
        if (
            session.expires_at &&
            new Date() > new Date(session.expires_at) &&
            session.status === "in_progress"
        ) {
            console.log(
                `Session ${session.id} has expired during answer submission, auto-submitting...`
            );
            await this.handleQuizTimeout(session.id);
            throw new Error(
                "Quiz session has expired and has been auto-submitted. Your previous answers have been saved."
            );
        }

        if (session.status === "completed") {
            throw new Error("Quiz already completed");
        }

        if (session.status === "expired") {
            throw new Error("Quiz session has expired");
        }

        // Check if question belongs to this quiz
        const question = await ClassQuizQuestion.findById(question_id);
        if (!question || question.quiz_id !== session.quiz_id) {
            throw new Error("Invalid question for this quiz");
        }

        // Check if answer already exists for this question
        const existingAttempt = await ClassQuizAttempt.find({
            quiz_id: session.quiz_id,
            user_id,
            question_id,
        });

        if (existingAttempt.rows && existingAttempt.rows.length > 0) {
            // Update existing attempt
            await ClassQuizAttempt.updateById(existingAttempt.rows[0].id, {
                attempt_data: answer,
                updated_at: new Date(),
            });
        } else {
            // Create new attempt
            await ClassQuizAttempt.create({
                campus_id: session.campus_id,
                class_id: session.class_id,
                quiz_id: session.quiz_id,
                question_id,
                user_id,
                attempt_data: answer,
                meta_data: {},
                created_at: new Date(),
                updated_at: new Date(),
            });

            // Update answers count
            await ClassQuizSession.updateById(session.id, {
                answers_count: session.answers_count + 1,
                last_activity_at: new Date(),
            });
        }

        const updatedSession = await ClassQuizSession.findById(session.id);
        return await this.getQuizSessionResponse(updatedSession!);
    };

    public static readonly navigateToNext = async (
        session_token: string,
        user_id: string
    ): Promise<QuizSessionResponse> => {
        const session = await this.validateAndGetSession(
            session_token,
            user_id
        );

        if (session.status === "completed") {
            throw new Error("Quiz already completed");
        }

        if (session.status === "expired") {
            throw new Error("Quiz session has expired");
        }

        // Get all questions for this quiz
        const questions = await this.getClassQuizQuestionsByQuizId(
            session.campus_id,
            session.class_id,
            session.quiz_id
        );

        const totalQuestions = questions.length;
        const currentIndex = session.current_question_index || 0;

        if (currentIndex >= totalQuestions - 1) {
            throw new Error("Already at the last question");
        }

        const nextIndex = currentIndex + 1;

        // Update session with new current question index
        await ClassQuizSession.updateById(session.id, {
            current_question_index: nextIndex,
            last_activity_at: new Date(),
        });

        const updatedSession = await ClassQuizSession.findById(session.id);
        return await this.getQuizSessionResponse(updatedSession!);
    };

    public static readonly navigateToPrevious = async (
        session_token: string,
        user_id: string
    ): Promise<QuizSessionResponse> => {
        const session = await this.validateAndGetSession(
            session_token,
            user_id
        );

        if (session.status === "completed") {
            throw new Error("Quiz already completed");
        }

        if (session.status === "expired") {
            throw new Error("Quiz session has expired");
        }

        const currentIndex = session.current_question_index || 0;

        if (currentIndex <= 0) {
            throw new Error("Already at the first question");
        }

        const previousIndex = currentIndex - 1;

        // Update session with new current question index
        await ClassQuizSession.updateById(session.id, {
            current_question_index: previousIndex,
            last_activity_at: new Date(),
        });

        const updatedSession = await ClassQuizSession.findById(session.id);
        return await this.getQuizSessionResponse(updatedSession!);
    };

    public static readonly completeQuiz = async (
        session_token: string,
        user_id: string
    ): Promise<QuizResult> => {
        const session = await this.validateAndGetSession(
            session_token,
            user_id
        );

        if (session.status === "completed") {
            throw new Error("Quiz already completed");
        }

        const completedAt = new Date();
        const timeTakenSeconds = session.started_at
            ? Math.floor(
                  (completedAt.getTime() -
                      new Date(session.started_at).getTime()) /
                      1000
              )
            : 0;

        // Calculate score
        const questions = await this.getClassQuizQuestionsByQuizId(
            session.campus_id,
            session.class_id,
            session.quiz_id
        );

        const attempts = await ClassQuizAttempt.find({
            quiz_id: session.quiz_id,
            user_id,
        });

        const attemptMap = new Map(
            attempts.rows?.map((attempt) => [
                attempt.question_id,
                attempt.attempt_data,
            ]) || []
        );

        let correctAnswers = 0;
        for (const question of questions) {
            const userAnswer = attemptMap.get(question.id);
            if (userAnswer === question.correct_answer) {
                correctAnswers++;
            }
        }

        const score = correctAnswers;
        const percentage =
            questions.length > 0
                ? (correctAnswers / questions.length) * 100
                : 0;

        // Create submission record
        const submission = await ClassQuizSubmission.create({
            campus_id: session.campus_id,
            class_id: session.class_id,
            quiz_id: session.quiz_id,
            user_id,
            submission_date: completedAt,
            score,
            feedback: "Quiz submitted successfully",
            meta_data: {
                time_taken_seconds: timeTakenSeconds,
                percentage,
                total_questions: questions.length,
            },
            is_active: true,
            is_deleted: false,
            created_at: completedAt,
            updated_at: completedAt,
        });

        // Update session
        await ClassQuizSession.updateById(session.id, {
            status: "completed",
            completed_at: completedAt,
            last_activity_at: completedAt,
            updated_at: completedAt,
        });

        return {
            score,
            total_questions: questions.length,
            percentage,
            correct_answers: correctAnswers,
            incorrect_answers: questions.length - correctAnswers,
            time_taken_seconds: timeTakenSeconds,
            submission,
        };
    };

    public static readonly getQuizResultsBySession = async (
        session_token: string,
        user_id: string
    ) => {
        // Validate session exists and belongs to user
        const sessionResult = await ClassQuizSession.find({
            session_token,
            user_id,
            is_deleted: false,
        });

        if (!sessionResult.rows || sessionResult.rows.length === 0) {
            throw new Error("Session not found");
        }

        const session = sessionResult.rows[0] as IClassQuizSession;

        // Only allow getting results for completed or expired sessions
        if (session.status !== "completed" && session.status !== "expired") {
            throw new Error("Quiz session is not completed yet");
        }

        // Get the quiz details
        const quiz = await this.getClassQuizById(session.quiz_id);
        if (!quiz) {
            throw new Error("Quiz not found");
        }

        // Get the submission for this session
        const submission = await ClassQuizSubmission.find({
            quiz_id: session.quiz_id,
            user_id: session.user_id,
            is_deleted: false,
        });

        if (!submission.rows || submission.rows.length === 0) {
            throw new Error("Quiz submission not found");
        }

        const submissionData = submission.rows[0] as IClassQuizSubmission;

        // Get all questions for the quiz
        const questions = await this.getClassQuizQuestionsByQuizId(
            session.campus_id,
            session.class_id,
            session.quiz_id
        );

        // Get all attempts for this user and quiz
        const attempts = await ClassQuizAttempt.find({
            quiz_id: session.quiz_id,
            user_id: session.user_id,
        });

        const attemptMap = new Map(
            attempts.rows?.map((attempt) => [
                attempt.question_id,
                attempt as IClassQuizAttempt,
            ]) || []
        );

        // Build detailed results
        const questionResults = questions.map((question) => {
            const userAttempt = attemptMap.get(question.id);
            const userAnswer = userAttempt
                ? (userAttempt as IClassQuizAttempt).attempt_data
                : null;
            const isCorrect = userAnswer === question.correct_answer;

            return {
                question_id: question.id,
                question_text: question.question_text,
                question_type: question.question_type,
                options: question.options,
                correct_answer: question.correct_answer,
                user_answer: userAnswer,
                is_correct: isCorrect,
                points_earned: isCorrect ? 1 : 0, // Basic scoring, can be enhanced
                meta_data: question.meta_data,
            };
        });

        const correctAnswers = questionResults.filter(
            (q) => q.is_correct
        ).length;
        const totalQuestions = questions.length;
        const percentage =
            totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        // Calculate time taken
        const timeTakenSeconds =
            session.started_at && session.completed_at
                ? Math.floor(
                      (new Date(session.completed_at).getTime() -
                          new Date(session.started_at).getTime()) /
                          1000
                  )
                : 0;

        return {
            session: {
                id: session.id,
                session_token: session.session_token,
                status: session.status,
                started_at: session.started_at,
                completed_at: session.completed_at,
                time_taken_seconds: timeTakenSeconds,
            },
            quiz: {
                id: quiz.id,
                quiz_name: quiz.quiz_name,
                quiz_description: quiz.quiz_description,
                quiz_meta_data: quiz.quiz_meta_data,
            },
            results: {
                submission_id: submissionData.id,
                score: submissionData.score,
                total_questions: totalQuestions,
                correct_answers: correctAnswers,
                incorrect_answers: totalQuestions - correctAnswers,
                percentage: Math.round(percentage * 100) / 100,
                submission_date: submissionData.submission_date,
                feedback: submissionData.feedback,
                time_taken_seconds: timeTakenSeconds,
                auto_submitted: session.status === "expired",
            },
            question_details: questionResults,
            meta_data: submissionData.meta_data,
        };
    };

    // ======================= HELPER METHODS =======================

    private static readonly validateAndGetSession = async (
        session_token: string,
        user_id: string
    ): Promise<IClassQuizSession> => {
        const sessionResult = await ClassQuizSession.find({
            session_token,
            user_id,
            is_deleted: false,
        });

        if (!sessionResult.rows || sessionResult.rows.length === 0) {
            throw new Error("Invalid session");
        }

        const session = sessionResult.rows[0];

        if (session.status === "completed") {
            throw new Error("Quiz already completed");
        }

        if (session.expires_at && new Date() > new Date(session.expires_at)) {
            await this.expireQuizSession(session.id);
            throw new Error("Quiz session has expired");
        }

        return session;
    };

    private static readonly getActiveQuizSession = async (
        quiz_id: string,
        user_id: string
    ): Promise<IClassQuizSession | null> => {
        const result = await ClassQuizSession.find({
            quiz_id,
            user_id,
            status: "in_progress",
            is_deleted: false,
        });

        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    };

    private static readonly getQuizSessionResponse = async (
        session: IClassQuizSession
    ): Promise<QuizSessionResponse> => {
        const quiz = await this.getClassQuizById(session.quiz_id);
        if (!quiz) {
            throw new Error("Quiz not found");
        }

        const questions = await this.getClassQuizQuestionsByQuizId(
            session.campus_id,
            session.class_id,
            session.quiz_id
        );

        // Get current question
        const questionOrder = (session.meta_data as any).question_order || [];
        const currentQuestionId = questionOrder[session.current_question_index];
        const currentQuestion = questions.find(
            (q) => q.id === currentQuestionId
        );

        // Calculate remaining time
        let timeRemainingSeconds: number | undefined;
        if (session.expires_at) {
            const now = new Date();
            const expiresAt = new Date(session.expires_at);
            timeRemainingSeconds = Math.max(
                0,
                Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
            );
        }

        // Calculate navigation flags
        const currentIndex = session.current_question_index || 0;
        const totalQuestions = questions.length;
        const canGoPrevious = currentIndex > 0;
        const canGoNext = currentIndex < totalQuestions - 1;

        return {
            session,
            quiz,
            current_question: currentQuestion,
            questions_count: questions.length,
            time_remaining_seconds: timeRemainingSeconds,
            can_go_previous: canGoPrevious,
            can_go_next: canGoNext,
        };
    };

    private static readonly expireQuizSession = async (session_id: string) => {
        await ClassQuizSession.updateById(session_id, {
            status: "expired",
            updated_at: new Date(),
        });
    };

    private static readonly generateSessionToken = (): string => {
        return randomBytes(32).toString("hex");
    };

    private static readonly shuffleArray = <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // ======================= LEGACY COMPATIBILITY =======================

    public static readonly getClassQuizSubmissionByQuizIdAndStudentId = async (
        quiz_id: string,
        student_id: string
    ) => {
        const data = await ClassQuizSubmission.find(
            {
                quiz_id,
                user_id: student_id,
                is_deleted: false,
            },
            {
                sort: { updated_at: "DESC" },
            }
        );

        return data.rows && data.rows.length > 0 ? data.rows[0] : null;
    };

    public static readonly getClassQuizSubmissionByCampusIdAndClassId = async (
        campus_id: string,
        class_id: string
    ) => {
        const data = await ClassQuizSubmission.find(
            {
                campus_id,
                class_id,
                is_deleted: false,
            },
            {
                sort: { updated_at: "DESC" },
            }
        );

        return data.rows || [];
    };

    // ======================= LEGACY METHODS FOR BACKWARD COMPATIBILITY =======================

    public static readonly getClassQuizAttemptByQuizIdAndStudentId = async (
        quiz_id: string,
        student_id: string
    ) => {
        const data = await ClassQuizAttempt.find(
            {
                quiz_id,
                user_id: student_id,
            },
            {
                sort: { updated_at: "DESC" },
            }
        );

        return data.rows || [];
    };

    public static readonly getClassQuizAttemptByCampusIdAndClassIdAndQuizId =
        async (campus_id: string, class_id: string, quiz_id: string) => {
            const data = await ClassQuizAttempt.find(
                {
                    campus_id,
                    class_id,
                    quiz_id,
                },
                {
                    sort: { updated_at: "DESC" },
                }
            );

            return data.rows || [];
        };

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
            attempt_data: JSON.stringify(opted_answer),
            meta_data: {},
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    public static readonly createClassQuizSubmission = async (
        campus_id: string,
        class_id: string,
        quiz_id: string,
        user_id: string
    ) => {
        const quiz_questions = await this.getClassQuizQuestionsByQuizId(
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
        for (const attempt of quiz_attempts.filter(
            (a) => a.user_id === user_id
        )) {
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
            feedback: "Quiz submitted successfully",
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

    public static readonly getClassQuizSubmissionById = async (id: string) => {
        return await ClassQuizSubmission.findById(id);
    };

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

    // Legacy method names for backward compatibility
    public static readonly getClassQuizQuestionByClassIDAndByQuizID = async (
        campus_id: string,
        class_id: string,
        quiz_id: string
    ) => {
        return await this.getClassQuizQuestionsByQuizId(
            campus_id,
            class_id,
            quiz_id
        );
    };

    public static readonly getClassQuizQuestionById = async (id: string) => {
        return await ClassQuizQuestion.findById(id);
    };

    // ======================= ADDITIONAL HELPER METHODS =======================

    public static readonly getQuizStatistics = async (
        campus_id: string,
        class_id: string,
        quiz_id: string
    ) => {
        const submissions = await ClassQuizSubmission.find({
            campus_id,
            class_id,
            quiz_id,
            is_deleted: false,
        });

        const submissionData = submissions.rows || [];

        if (submissionData.length === 0) {
            return {
                total_attempts: 0,
                average_score: 0,
                highest_score: 0,
                lowest_score: 0,
                completion_rate: 0,
            };
        }

        const scores = submissionData.map((s) => s.score);
        const totalAttempts = submissionData.length;
        const averageScore =
            scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);

        // Get total enrolled students for completion rate (this would need to be implemented based on your class enrollment system)
        const completionRate = totalAttempts; // This is a simplified calculation

        return {
            total_attempts: totalAttempts,
            average_score: Math.round(averageScore * 100) / 100,
            highest_score: highestScore,
            lowest_score: lowestScore,
            completion_rate: completionRate,
            submissions: submissionData,
        };
    };

    public static readonly getActiveQuizSessions = async (
        campus_id: string,
        class_id?: string,
        quiz_id?: string
    ) => {
        const filter: any = {
            campus_id,
            status: "in_progress",
            is_deleted: false,
        };

        if (class_id) {filter.class_id = class_id;}
        if (quiz_id) {filter.quiz_id = quiz_id;}

        const result = await ClassQuizSession.find(filter, {
            sort: { last_activity_at: "DESC" },
        });

        return result.rows || [];
    };

    public static readonly abandonQuizSession = async (
        session_token: string,
        user_id: string
    ) => {
        const session = await this.validateAndGetSession(
            session_token,
            user_id
        );

        await ClassQuizSession.updateById(session.id, {
            status: "abandoned",
            updated_at: new Date(),
        });

        return { message: "Quiz session abandoned" };
    };

    public static readonly extendQuizSession = async (
        session_token: string,
        user_id: string,
        additional_minutes: number
    ) => {
        const session = await this.validateAndGetSession(
            session_token,
            user_id
        );

        if (!session.expires_at) {
            throw new Error("This quiz does not have a time limit");
        }

        const newExpiresAt = new Date(
            new Date(session.expires_at).getTime() +
                additional_minutes * 60 * 1000
        );

        await ClassQuizSession.updateById(session.id, {
            expires_at: newExpiresAt,
            updated_at: new Date(),
        });

        return {
            message: "Quiz session extended successfully",
            new_expires_at: newExpiresAt,
        };
    };

    public static readonly getQuizSessionHistory = async (
        user_id: string,
        quiz_id?: string
    ) => {
        const filter: any = {
            user_id,
            is_deleted: false,
        };

        if (quiz_id) {filter.quiz_id = quiz_id;}

        const result = await ClassQuizSession.find(filter, {
            sort: { created_at: "DESC" },
        });

        return result.rows || [];
    };

    // ======================= TIMEOUT AND AUTO-SAVE METHODS =======================

    public static readonly handleQuizTimeout = async (
        session_id: string
    ): Promise<QuizResult> => {
        const session = await ClassQuizSession.findById(session_id);
        if (!session) {
            throw new Error("Session not found");
        }

        if (session.status !== "in_progress") {
            throw new Error("Session is not in progress");
        }

        console.log(
            `Auto-submitting quiz due to timeout for session: ${session_id}`
        );

        const completedAt = new Date();
        const timeTakenSeconds = session.started_at
            ? Math.floor(
                  (completedAt.getTime() -
                      new Date(session.started_at).getTime()) /
                      1000
              )
            : 0;

        // Calculate score based on current attempts
        const questions = await this.getClassQuizQuestionsByQuizId(
            session.campus_id,
            session.class_id,
            session.quiz_id
        );

        const attempts = await ClassQuizAttempt.find({
            quiz_id: session.quiz_id,
            user_id: session.user_id,
        });

        const attemptMap = new Map(
            attempts.rows?.map((attempt) => [
                attempt.question_id,
                attempt.attempt_data,
            ]) || []
        );

        let correctAnswers = 0;
        for (const question of questions) {
            const userAnswer = attemptMap.get(question.id);
            if (userAnswer === question.correct_answer) {
                correctAnswers++;
            }
        }

        const score = correctAnswers;
        const percentage =
            questions.length > 0
                ? (correctAnswers / questions.length) * 100
                : 0;

        // Create submission record with timeout flag
        const submission = await ClassQuizSubmission.create({
            campus_id: session.campus_id,
            class_id: session.class_id,
            quiz_id: session.quiz_id,
            user_id: session.user_id,
            submission_date: completedAt,
            score,
            feedback: "Quiz auto-submitted due to timeout",
            meta_data: {
                time_taken_seconds: timeTakenSeconds,
                percentage,
                total_questions: questions.length,
                auto_submitted: true,
                timeout_submission: true,
                answered_questions: session.answers_count,
            },
            is_active: true,
            is_deleted: false,
            created_at: completedAt,
            updated_at: completedAt,
        });

        // Update session to expired with completion data
        await ClassQuizSession.updateById(session.id, {
            status: "expired",
            completed_at: completedAt,
            last_activity_at: completedAt,
            meta_data: {
                ...session.meta_data,
                auto_submitted: true,
                timeout_submission: true,
            },
            updated_at: completedAt,
        });

        return {
            score,
            total_questions: questions.length,
            percentage,
            correct_answers: correctAnswers,
            incorrect_answers: questions.length - correctAnswers,
            time_taken_seconds: timeTakenSeconds,
            submission,
        };
    };

    public static readonly checkAndHandleExpiredSessions = async () => {
        const now = new Date();

        // Find all expired sessions that haven't been processed
        const expiredSessions = await ClassQuizSession.find({
            status: "in_progress",
            is_deleted: false,
        });

        const sessionsToProcess =
            expiredSessions.rows?.filter(
                (session) =>
                    session.expires_at && new Date(session.expires_at) <= now
            ) || [];

        console.log(
            `Found ${sessionsToProcess.length} expired sessions to process`
        );

        const results: Array<{
            session_id: string;
            user_id: string;
            quiz_id: string;
            result: QuizResult;
        }> = [];

        for (const session of sessionsToProcess) {
            try {
                const result = await this.handleQuizTimeout(session.id);
                results.push({
                    session_id: session.id,
                    user_id: session.user_id,
                    quiz_id: session.quiz_id,
                    result,
                });
                console.log(
                    `Auto-submitted quiz for user ${session.user_id} in session ${session.id}`
                );
            } catch (error) {
                console.error(
                    `Error auto-submitting session ${session.id}:`,
                    error
                );
            }
        }

        return results;
    };

    public static readonly getSessionWithTimeoutCheck = async (
        session_token: string,
        user_id: string
    ): Promise<QuizSessionResponse> => {
        const sessionResult = await ClassQuizSession.find({
            session_token,
            user_id,
            is_deleted: false,
        });

        if (!sessionResult.rows || sessionResult.rows.length === 0) {
            throw new Error("Invalid session");
        }

        const session = sessionResult.rows[0];

        // Check if session is expired and auto-submit if needed
        if (
            session.expires_at &&
            new Date() > new Date(session.expires_at) &&
            session.status === "in_progress"
        ) {
            console.log(
                `Session ${session.id} has expired, auto-submitting...`
            );
            await this.handleQuizTimeout(session.id);
            throw new Error(
                "Quiz session has expired and has been auto-submitted"
            );
        }

        if (session.status === "completed") {
            throw new Error("Quiz already completed");
        }

        if (session.status === "expired") {
            throw new Error("Quiz session has expired");
        }

        // Update last activity
        await ClassQuizSession.updateById(session.id, {
            last_activity_at: new Date(),
        });

        return await this.getQuizSessionResponse(session);
    };

    public static readonly getClassQuizByClassIDWithStudentStatus = async (
        campus_id: string,
        class_id: string,
        student_id: string
    ) => {
        // Get all quizzes for the class
        const quizzes = await this.getClassQuizByClassID(campus_id, class_id);

        if (quizzes.length === 0) {
            return [];
        }

        // Get all submissions for this student
        const submissions = await ClassQuizSubmission.find({
            class_id,
            user_id: student_id,
            is_deleted: false,
        });

        const submissionMap = new Map(
            submissions.rows?.map((sub) => [
                sub.quiz_id,
                sub as IClassQuizSubmission,
            ]) || []
        );

        // Get all active sessions for this student
        const activeSessions = await ClassQuizSession.find({
            class_id,
            user_id: student_id,
            status: "in_progress",
            is_deleted: false,
        });

        const activeSessionMap = new Map(
            activeSessions.rows?.map((session) => [
                session.quiz_id,
                session as IClassQuizSession,
            ]) || []
        );

        // Enhance each quiz with student status
        return await Promise.all(
            quizzes.map(async (quiz) => {
                const submission = submissionMap.get(quiz.id) as
                    | IClassQuizSubmission
                    | undefined;
                const activeSession = activeSessionMap.get(quiz.id) as
                    | IClassQuizSession
                    | undefined;

                let status = "not_attempted";
                let attempt_data: any = null;
                let session_data: any = null;

                if (submission) {
                    status = "completed";
                    attempt_data = {
                        submission_id: submission.id,
                        score: submission.score,
                        submission_date: submission.submission_date,
                        feedback: submission.feedback,
                        meta_data: submission.meta_data,
                    };
                } else if (activeSession) {
                    // Check if session is expired
                    const now = new Date();
                    status =
                        activeSession.expires_at &&
                        new Date(activeSession.expires_at) <= now
                            ? "expired"
                            : "in_progress";

                    session_data = {
                        session_id: activeSession.id,
                        session_token: activeSession.session_token,
                        started_at: activeSession.started_at,
                        expires_at: activeSession.expires_at,
                        answers_count: activeSession.answers_count,
                        total_questions: activeSession.total_questions,
                        time_remaining_seconds: activeSession.expires_at
                            ? Math.max(
                                  0,
                                  Math.floor(
                                      (new Date(
                                          activeSession.expires_at
                                      ).getTime() -
                                          now.getTime()) /
                                          1000
                                  )
                              )
                            : null,
                    };
                }

                // Check availability
                const quizSettings = quiz.quiz_meta_data as QuizSettings;
                let availability_status = "available";

                if (
                    quizSettings.available_from &&
                    new Date() < new Date(quizSettings.available_from)
                ) {
                    availability_status = "not_yet_available";
                } else if (
                    quizSettings.available_until &&
                    new Date() > new Date(quizSettings.available_until)
                ) {
                    availability_status = "expired";
                }

                // Check if student can attempt based on max_attempts
                let can_attempt = true;
                if (
                    submission &&
                    quizSettings.max_attempts &&
                    quizSettings.max_attempts <= 1
                ) {
                    can_attempt = false;
                }

                return {
                    ...quiz,
                    student_status: {
                        status,
                        availability_status,
                        can_attempt,
                        attempt_data,
                        session_data,
                        max_attempts: quizSettings.max_attempts || 1,
                        attempts_made: submission ? 1 : 0,
                    },
                };
            })
        );
    };

    // ======================= QUIZ MANAGEMENT =======================
    public static readonly getAllQuizResultsByStudentId = async (
        campus_id: string,
        student_id: string,
        class_id?: string
    ) => {
        // Build filter for submissions
        const filter: any = {
            campus_id,
            user_id: student_id,
            is_deleted: false,
        };

        if (class_id) {
            filter.class_id = class_id;
        }

        // Get all submissions for the student
        const submissions = await ClassQuizSubmission.find(filter, {
            sort: { submission_date: "DESC" },
        });

        if (!submissions.rows || submissions.rows.length === 0) {
            return [];
        }

        // Get detailed results for each submission
        const results = await Promise.all(
            submissions.rows.map(async (submission) => {
                const submissionData = submission as IClassQuizSubmission;

                // Get quiz details
                const quiz = await this.getClassQuizById(
                    submissionData.quiz_id
                );
                if (!quiz) {
                    return null;
                }

                // Get all questions for the quiz
                const questions = await this.getClassQuizQuestionsByQuizId(
                    submissionData.campus_id,
                    submissionData.class_id,
                    submissionData.quiz_id
                );

                // Get all attempts for this submission
                const attempts = await ClassQuizAttempt.find({
                    quiz_id: submissionData.quiz_id,
                    user_id: student_id,
                });

                const attemptMap = new Map(
                    attempts.rows?.map((attempt) => [
                        attempt.question_id,
                        attempt as IClassQuizAttempt,
                    ]) || []
                );

                // Calculate detailed results
                const questionResults = questions.map((question) => {
                    const userAttempt = attemptMap.get(question.id);
                    const userAnswer = userAttempt
                        ? (userAttempt as IClassQuizAttempt).attempt_data
                        : null;
                    const isCorrect = userAnswer === question.correct_answer;

                    return {
                        question_id: question.id,
                        question_text: question.question_text,
                        question_type: question.question_type,
                        options: question.options,
                        correct_answer: question.correct_answer,
                        user_answer: userAnswer,
                        is_correct: isCorrect,
                        points_earned: isCorrect ? 1 : 0,
                    };
                });

                const correctAnswers = questionResults.filter(
                    (q) => q.is_correct
                ).length;
                const totalQuestions = questions.length;
                const percentage =
                    totalQuestions > 0
                        ? (correctAnswers / totalQuestions) * 100
                        : 0;

                // Get session information if available
                const session = await ClassQuizSession.find({
                    quiz_id: submissionData.quiz_id,
                    user_id: student_id,
                    is_deleted: false,
                });

                const sessionData =
                    session.rows && session.rows.length > 0
                        ? (session.rows[0] as IClassQuizSession)
                        : null;

                let timeTakenSeconds = 0;
                if (
                    sessionData &&
                    sessionData.started_at &&
                    sessionData.completed_at
                ) {
                    timeTakenSeconds = Math.floor(
                        (new Date(sessionData.completed_at).getTime() -
                            new Date(sessionData.started_at).getTime()) /
                            1000
                    );
                }

                return {
                    submission: {
                        id: submissionData.id,
                        submission_date: submissionData.submission_date,
                        score: submissionData.score,
                        feedback: submissionData.feedback,
                        meta_data: submissionData.meta_data,
                    },
                    quiz: {
                        id: quiz.id,
                        quiz_name: quiz.quiz_name,
                        quiz_description: quiz.quiz_description,
                        class_id: quiz.class_id,
                        quiz_meta_data: quiz.quiz_meta_data,
                    },
                    results: {
                        total_questions: totalQuestions,
                        correct_answers: correctAnswers,
                        incorrect_answers: totalQuestions - correctAnswers,
                        percentage: Math.round(percentage * 100) / 100,
                        time_taken_seconds: timeTakenSeconds,
                        auto_submitted:
                            sessionData?.status === "expired" || false,
                    },
                    question_details: questionResults,
                    session_info: sessionData
                        ? {
                              session_id: sessionData.id,
                              status: sessionData.status,
                              started_at: sessionData.started_at,
                              completed_at: sessionData.completed_at,
                          }
                        : null,
                };
            })
        );

        // Filter out null results and return
        return results.filter((result) => result !== null);
    };

    public static readonly getQuizResultsSummaryByStudentId = async (
        campus_id: string,
        student_id: string,
        class_id?: string
    ) => {
        const results = await this.getAllQuizResultsByStudentId(
            campus_id,
            student_id,
            class_id
        );

        if (results.length === 0) {
            return {
                student_id,
                campus_id,
                class_id: class_id || null,
                total_quizzes_attempted: 0,
                average_score: 0,
                average_percentage: 0,
                total_correct_answers: 0,
                total_questions_attempted: 0,
                highest_score: 0,
                lowest_score: 0,
                total_time_spent_seconds: 0,
                quiz_results: [],
            };
        }

        // Calculate summary statistics
        const totalQuizzesAttempted = results.length;
        const totalScore = results.reduce(
            (sum, result) => sum + result.submission.score,
            0
        );
        const totalPercentage = results.reduce(
            (sum, result) => sum + result.results.percentage,
            0
        );
        const totalCorrectAnswers = results.reduce(
            (sum, result) => sum + result.results.correct_answers,
            0
        );
        const totalQuestionsAttempted = results.reduce(
            (sum, result) => sum + result.results.total_questions,
            0
        );
        const totalTimeSpent = results.reduce(
            (sum, result) => sum + result.results.time_taken_seconds,
            0
        );

        const scores = results.map((result) => result.submission.score);
        const averageScore = totalScore / totalQuizzesAttempted;
        const averagePercentage = totalPercentage / totalQuizzesAttempted;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);

        return {
            student_id,
            campus_id,
            class_id: class_id || null,
            total_quizzes_attempted: totalQuizzesAttempted,
            average_score: Math.round(averageScore * 100) / 100,
            average_percentage: Math.round(averagePercentage * 100) / 100,
            total_correct_answers: totalCorrectAnswers,
            total_questions_attempted: totalQuestionsAttempted,
            highest_score: highestScore,
            lowest_score: lowestScore,
            total_time_spent_seconds: totalTimeSpent,
            quiz_results: results.map((result) => ({
                quiz_id: result.quiz.id,
                quiz_name: result.quiz.quiz_name,
                submission_date: result.submission.submission_date,
                score: result.submission.score,
                percentage: result.results.percentage,
                total_questions: result.results.total_questions,
                correct_answers: result.results.correct_answers,
                time_taken_seconds: result.results.time_taken_seconds,
                auto_submitted: result.results.auto_submitted,
            })),
        };
    };

    public static readonly getQuizResultsByStudentIdAndQuizId = async (
        campus_id: string,
        student_id: string,
        quiz_id: string,
        class_id?: string
    ) => {
        // Get all submissions for the specific quiz
        const submissions = await ClassQuizSubmission.find({
            campus_id,
            user_id: student_id,
            quiz_id,
            is_deleted: false,
        });
        if (!submissions.rows || submissions.rows.length === 0) {
            return null; // No submissions found for this quiz
        }
        const submissionData = submissions.rows[0] as IClassQuizSubmission;
        // Get quiz details
        const quiz = await this.getClassQuizById(quiz_id);
        if (!quiz) {
            throw new Error("Quiz not found");
        }
        // Get all questions for the quiz
        const questions = await this.getClassQuizQuestionsByQuizId(
            submissionData.campus_id,
            submissionData.class_id,
            submissionData.quiz_id
        );
        // Get all attempts for this submission
        const attempts = await ClassQuizAttempt.find({
            quiz_id: submissionData.quiz_id,
            user_id: student_id,
        });
        const attemptMap = new Map(
            attempts.rows?.map((attempt) => [
                attempt.question_id,
                attempt as IClassQuizAttempt,
            ]) || []
        );
        // Calculate detailed results
        const questionResults = questions.map((question) => {
            const userAttempt = attemptMap.get(question.id);
            const userAnswer = userAttempt
                ? (userAttempt as IClassQuizAttempt).attempt_data
                : null;
            const isCorrect = userAnswer === question.correct_answer;
            return {
                question_id: question.id,
                question_text: question.question_text,
                question_type: question.question_type,
                options: question.options,
                correct_answer: question.correct_answer,
                user_answer: userAnswer,
                is_correct: isCorrect,
                marks_awarded: isCorrect ? 1 : 0, // Marks for this question
            };
        });

        // Calculate marks summary
        const correctAnswers = questionResults.filter(
            (q) => q.is_correct
        ).length;
        const totalQuestions = questions.length;
        const studentMarks = submissionData.score; // Student's total marks
        const totalMarks = totalQuestions; // Total possible marks (assuming 1 mark per question)
        const percentage =
            totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        // Get session information for time taken
        const session = await ClassQuizSession.find({
            quiz_id: submissionData.quiz_id,
            user_id: student_id,
            is_deleted: false,
        });

        const sessionData =
            session.rows && session.rows.length > 0
                ? (session.rows[0] as IClassQuizSession)
                : null;

        let timeTakenSeconds = 0;
        if (sessionData && sessionData.started_at && sessionData.completed_at) {
            timeTakenSeconds = Math.floor(
                (new Date(sessionData.completed_at).getTime() -
                    new Date(sessionData.started_at).getTime()) /
                    1000
            );
        }

        return {
            quiz: {
                id: quiz.id,
                quiz_name: quiz.quiz_name,
                quiz_description: quiz.quiz_description,
                total_questions: totalQuestions,
            },
            student: {
                student_id,
                campus_id,
                class_id: submissionData.class_id,
            },
            marks: {
                student_marks: studentMarks, // Marks student got
                total_marks: totalMarks, // Total marks possible
                correct_answers: correctAnswers,
                incorrect_answers: totalQuestions - correctAnswers,
                percentage: Math.round(percentage * 100) / 100,
                marks_breakdown: `${studentMarks}/${totalMarks}`,
            },
            submission: {
                id: submissionData.id,
                submission_date: submissionData.submission_date,
                feedback: submissionData.feedback,
                time_taken_seconds: timeTakenSeconds,
                auto_submitted: sessionData?.status === "expired" || false,
                meta_data: submissionData.meta_data,
            },
            question_results: questionResults,
        };
    };

    // ======================= QUIZ STATISTICS =======================
    public static readonly getDetailedQuizStatistics = async (
        campus_id: string,
        quiz_id: string
    ) => {
        try {
            // Get quiz information
            const quiz = await ClassQuiz.findOne({
                id: quiz_id,
                campus_id,
                is_deleted: false,
            });

            if (!quiz) {
                throw new Error("Quiz not found");
            }

            // Get class information to get total students
            const classData = await Class.findOne({
                id: quiz.class_id,
                campus_id,
                is_deleted: false,
            });

            if (!classData) {
                throw new Error("Class not found");
            }

            // Get all quiz submissions
            const submissions = await ClassQuizSubmission.find({
                campus_id,
                quiz_id,
                is_deleted: false,
            });

            const submissionData = submissions.rows || [];

            // Get quiz sessions for completion time data
            const sessions = await ClassQuizSession.find({
                campus_id,
                quiz_id,
                status: "completed",
                is_deleted: false,
            });

            const sessionData = sessions.rows || [];

            // Calculate basic statistics
            const totalStudents =
                classData.student_count || classData.student_ids?.length || 0;
            const attemptedStudents = submissionData.length;
            const scores = submissionData.map((s) => s.score);
            const averageScore =
                scores.length > 0
                    ? scores.reduce((sum, score) => sum + score, 0) /
                      scores.length
                    : 0;

            // Get detailed student results with user information
            const studentResults = await Promise.all(
                submissionData.map(async (submission) => {
                    // Get user information
                    const user = await User.findOne({
                        id: submission.user_id,
                        campus_id,
                        is_deleted: false,
                    });

                    // Get session information for completion time
                    const session = sessionData.find(
                        (s) => s.user_id === submission.user_id
                    );

                    let completionTimeSeconds = 0;
                    if (session && session.started_at && session.completed_at) {
                        const startTime = new Date(
                            session.started_at
                        ).getTime();
                        const endTime = new Date(
                            session.completed_at
                        ).getTime();
                        completionTimeSeconds = Math.floor(
                            (endTime - startTime) / 1000
                        );
                    }

                    return {
                        student_id: submission.user_id,
                        student_name: user
                            ? `${user.first_name} ${user.last_name}`
                            : "Unknown Student",
                        student_email: user?.email || "Unknown",
                        score: submission.score,
                        submission_date: submission.submission_date,
                        completion_time_seconds: completionTimeSeconds,
                        completion_time_formatted: formatTime(
                            completionTimeSeconds
                        ),
                        feedback: submission.feedback || "",
                        meta_data: submission.meta_data || {},
                    };
                })
            );

            // Sort by score (descending) and then by completion time (ascending) for top performers
            const sortedResults = studentResults.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score; // Higher score first
                }
                return a.completion_time_seconds - b.completion_time_seconds; // Faster completion first
            });

            // Get top 3 students
            const topThreeStudents = sortedResults.slice(0, 3);

            return {
                quiz_info: {
                    id: quiz.id,
                    quiz_name: quiz.quiz_name,
                    quiz_description: quiz.quiz_description,
                    class_id: quiz.class_id,
                    class_name: classData.name,
                    created_at: quiz.created_at,
                },
                statistics: {
                    total_students: totalStudents,
                    attempted_students: attemptedStudents,
                    completion_percentage:
                        totalStudents > 0
                            ? Math.round(
                                  (attemptedStudents / totalStudents) * 100
                              )
                            : 0,
                    average_score: Math.round(averageScore * 100) / 100,
                    highest_score: scores.length > 0 ? Math.max(...scores) : 0,
                    lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
                    average_completion_time_seconds:
                        sessionData.length > 0
                            ? Math.round(
                                  sessionData.reduce((sum, session) => {
                                      if (
                                          session.started_at &&
                                          session.completed_at
                                      ) {
                                          const startTime = new Date(
                                              session.started_at
                                          ).getTime();
                                          const endTime = new Date(
                                              session.completed_at
                                          ).getTime();
                                          return (
                                              sum + (endTime - startTime) / 1000
                                          );
                                      }
                                      return sum;
                                  }, 0) / sessionData.length
                              )
                            : 0,
                },
                top_three_students: topThreeStudents,
                all_student_results: sortedResults,
                summary: {
                    total_attempts: attemptedStudents,
                    success_rate:
                        attemptedStudents > 0
                            ? Math.round(
                                  (sortedResults.filter((r) => r.score >= 60)
                                      .length /
                                      attemptedStudents) *
                                      100
                              )
                            : 0,
                    average_time_formatted: formatTime(
                        sessionData.length > 0
                            ? Math.round(
                                  sessionData.reduce((sum, session) => {
                                      if (
                                          session.started_at &&
                                          session.completed_at
                                      ) {
                                          const startTime = new Date(
                                              session.started_at
                                          ).getTime();
                                          const endTime = new Date(
                                              session.completed_at
                                          ).getTime();
                                          return (
                                              sum + (endTime - startTime) / 1000
                                          );
                                      }
                                      return sum;
                                  }, 0) / sessionData.length
                              )
                            : 0
                    ),
                },
            };
        } catch (error) {
            console.error("Error getting detailed quiz statistics:", error);
            throw error;
        }
    };

    // ======================= QUIZ MANAGEMENT =======================
}
