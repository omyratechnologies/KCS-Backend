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
import {
    ClassQuizSession,
    IClassQuizSession,
} from "@/models/class_quiz_session.model";
import { randomBytes } from "crypto";

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
        const quiz = await ClassQuiz.create({
            campus_id,
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

        return quiz;
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
        if (quizSettings.available_from && new Date() < new Date(quizSettings.available_from)) {
            throw new Error("Quiz is not yet available");
        }

        if (quizSettings.available_until && new Date() > new Date(quizSettings.available_until)) {
            throw new Error("Quiz is no longer available");
        }

        // Check if user already has completed the quiz
        const existingSubmission = await this.getClassQuizSubmissionByQuizIdAndStudentId(
            quiz_id,
            user_id
        );

        if (existingSubmission && quizSettings.max_attempts === 1) {
            throw new Error("Quiz already completed");
        }

        // Check if user has an active session
        const existingSession = await this.getActiveQuizSession(quiz_id, user_id);
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
            ? new Date(now.getTime() + quizSettings.time_limit_minutes * 60 * 1000)
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
                question_order: orderedQuestions.map(q => q.id),
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
        if (session.expires_at && new Date() > new Date(session.expires_at) && session.status === "in_progress") {
            console.log(`Session ${session.id} has expired during answer submission, auto-submitting...`);
            await this.handleQuizTimeout(session.id);
            throw new Error("Quiz session has expired and has been auto-submitted. Your previous answers have been saved.");
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

    public static readonly completeQuiz = async (
        session_token: string,
        user_id: string
    ): Promise<QuizResult> => {
        const session = await this.validateAndGetSession(session_token, user_id);

        if (session.status === "completed") {
            throw new Error("Quiz already completed");
        }

        const completedAt = new Date();
        const timeTakenSeconds = session.started_at
            ? Math.floor((completedAt.getTime() - new Date(session.started_at).getTime()) / 1000)
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
            attempts.rows?.map(attempt => [attempt.question_id, attempt.attempt_data]) || []
        );

        let correctAnswers = 0;
        for (const question of questions) {
            const userAnswer = attemptMap.get(question.id);
            if (userAnswer === question.correct_answer) {
                correctAnswers++;
            }
        }

        const score = correctAnswers;
        const percentage = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

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
        const currentQuestion = questions.find(q => q.id === currentQuestionId);

        // Calculate remaining time
        let timeRemainingSeconds: number | undefined;
        if (session.expires_at) {
            const now = new Date();
            const expiresAt = new Date(session.expires_at);
            timeRemainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        }

        return {
            session,
            quiz,
            current_question: currentQuestion,
            questions_count: questions.length,
            time_remaining_seconds: timeRemainingSeconds,
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

    public static readonly getClassQuizAttemptByCampusIdAndClassIdAndQuizId = async (
        campus_id: string,
        class_id: string,
        quiz_id: string
    ) => {
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

        const quiz_attempts = await this.getClassQuizAttemptByCampusIdAndClassIdAndQuizId(
            campus_id,
            class_id,
            quiz_id
        );

        const quiz_attempts_map = new Map<string, string>();
        for (const attempt of quiz_attempts.filter(a => a.user_id === user_id)) {
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
        return await this.getClassQuizQuestionsByQuizId(campus_id, class_id, quiz_id);
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

        const scores = submissionData.map(s => s.score);
        const totalAttempts = submissionData.length;
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
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

        if (class_id) filter.class_id = class_id;
        if (quiz_id) filter.quiz_id = quiz_id;

        const result = await ClassQuizSession.find(filter, {
            sort: { last_activity_at: "DESC" },
        });

        return result.rows || [];
    };

    public static readonly abandonQuizSession = async (
        session_token: string,
        user_id: string
    ) => {
        const session = await this.validateAndGetSession(session_token, user_id);

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
        const session = await this.validateAndGetSession(session_token, user_id);

        if (!session.expires_at) {
            throw new Error("This quiz does not have a time limit");
        }

        const newExpiresAt = new Date(
            new Date(session.expires_at).getTime() + additional_minutes * 60 * 1000
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

        if (quiz_id) filter.quiz_id = quiz_id;

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

        console.log(`Auto-submitting quiz due to timeout for session: ${session_id}`);

        const completedAt = new Date();
        const timeTakenSeconds = session.started_at
            ? Math.floor((completedAt.getTime() - new Date(session.started_at).getTime()) / 1000)
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
            attempts.rows?.map(attempt => [attempt.question_id, attempt.attempt_data]) || []
        );

        let correctAnswers = 0;
        for (const question of questions) {
            const userAnswer = attemptMap.get(question.id);
            if (userAnswer === question.correct_answer) {
                correctAnswers++;
            }
        }

        const score = correctAnswers;
        const percentage = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

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

        const sessionsToProcess = expiredSessions.rows?.filter(session => 
            session.expires_at && new Date(session.expires_at) <= now
        ) || [];

        console.log(`Found ${sessionsToProcess.length} expired sessions to process`);

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
                console.log(`Auto-submitted quiz for user ${session.user_id} in session ${session.id}`);
            } catch (error) {
                console.error(`Error auto-submitting session ${session.id}:`, error);
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
        if (session.expires_at && new Date() > new Date(session.expires_at) && session.status === "in_progress") {
            console.log(`Session ${session.id} has expired, auto-submitting...`);
            await this.handleQuizTimeout(session.id);
            throw new Error("Quiz session has expired and has been auto-submitted");
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
}
