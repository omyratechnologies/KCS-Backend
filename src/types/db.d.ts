interface UsersData {
    id: string;
    user_type: string;
    user_id: string;
    email: string;
    hash: string;
    salt: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    last_login: string;
    campus_id?: string;
    meta_data: string;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface CampusesData {
    id: string;
    name: string;
    address: string;
    domain: string;
    meta_data: string;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface LoginSessionsData {
    id: string;
    user_id: string;
    campus_id?: string;
    session_id: string;
    refresh_token: string;
    created_at: Date;
    updated_at: Date;
}

interface PasswordResetsData {
    id: string;
    user_id: string;
    reset_token: string;
    created_at: Date;
    updated_at: Date;
}

interface AttendanceData {
    id: string;
    user_id: string;
    campus_id: string;
    date: Date;
    status: "present" | "absent" | "late" | "leave";
    created_at: Date;
    updated_at: Date;
}

interface ExamTermData {
    id: string;
    campus_id: string;
    name: string;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at: Date;
}

interface ExaminationData {
    id: string;
    campus_id: string;
    subject_id: string;
    date: Date;
    start_time: Date;
    end_time: Date;
    exam_term_id: string;
    created_at: Date;
    updated_at: Date;
}

interface SubjectsData {
    id: string;
    campus_id: string;
    name: string;
    code: string;
    created_at: Date;
    updated_at: Date;
}

interface ExamResultData {
    id: string;
    campus_id: string;
    subject_id: string;
    user_id: string;
    score: number;
    exam_id: string;
    created_at: Date;
    updated_at: Date;
}

interface AssignmentData {
    id: string;
    campus_id: string;
    subject_id: string;
    user_id: string;
    title: string;
    description: string;
    due_date: Date;
    is_graded: boolean;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface AssignmentSubmissionData {
    id: string;
    campus_id: string;
    assignment_id: string;
    user_id: string;
    submission_date: Date;
    grade: number;
    feedback: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface CurriculumData {
    id: string;
    campus_id: string;
    name: string;
    description: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface SyllabusData {
    id: string;
    campus_id: string;
    subject_id: string;
    name: string;
    description: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface ClassData {
    id: string;
    campus_id: string;
    name: string;
    class_teacher_id: string;
    student_ids: string[];
    student_count: number;
    academic_year: string;
    class_in_charge: string[];
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface SubjectData {
    id: string;
    campus_id: string;
    name: string;
    code: string;
    teacher_ids: string[];
    description: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface ClassSubjectData {
    id: string;
    campus_id: string;
    class_id: string;
    subject_id: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface ClassQuizData {
    id: string;
    campus_id: string;
    class_id: string;
    section_id: string;
    quiz_name: string;
    quiz_description: string;
    quiz_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface ClassQuizQuestionData {
    id: string;
    campus_id: string;
    class_id: string;
    section_id: string;
    quiz_id: string;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface ClassQuizSubmissionData {
    id: string;
    campus_id: string;
    class_id: string;
    section_id: string;
    quiz_id: string;
    user_id: string;
    submission_date: Date;
    score: number;
    feedback: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface TimetableData {
    id: string;
    campus_id: string;
    class_id: string;
    subject_id: string;
    section_id: string;
    teacher_id: string;
    day: string;
    start_time: string;
    end_time: string;
    meta_data: object;
    is_suspended: boolean;
    is_adjourned: boolean;
    is_cancelled: boolean;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface TeacherData {
    id: string;
    campus_id: string;
    user_id: string;
    subjects: string[];
    sections: string[];
    classes: string[];
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface CampusWideNotificationData {
    id: string;
    campus_id: string;
    title: string;
    message: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface StudentNotificationData {
    id: string;
    campus_id: string;
    user_id: string;
    title: string;
    message: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    is_seen: boolean;
    created_at: Date;
    updated_at: Date;
}

interface ClassNotificationData {
    id: string;
    campus_id: string;
    class_id: string;
    title: string;
    message: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface ParentNotificationData {
    id: string;
    campus_id: string;
    user_id: string;
    title: string;
    message: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    is_seen: boolean;
    created_at: Date;
    updated_at: Date;
}

interface TeacherNotificationData {
    id: string;
    campus_id: string;
    user_id: string;
    title: string;
    message: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    is_seen: boolean;
    created_at: Date;
    updated_at: Date;
}

interface MessageData {
    id: string;
    campus_id: string;
    from_user_id: string;
    to_user_id: string;
    message: string;
    meta_data: object;
    is_seen: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface MessageGroupData {
    id: string;
    campus_id: string;
    group_name: string;
    group_description: string;
    members: string[];
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface LibraryData {
    id: string;
    campus_id: string;
    book_name: string;
    author_name: string;
    book_code: string;
    book_cover: string;
    book_description: string;
    book_quantity: number;
    book_available: number;
    book_issued: number;
    book_fine: number;
    book_status: string;
    book_location: string;
    book_tags: string[];
    book_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface LibraryIssueData {
    id: string;
    campus_id: string;
    book_id: string;
    user_id: string;
    issue_date: Date;
    due_date: Date;
    return_date: Date;
    fine_amount: number;
    meta_data: object;
    is_active: boolean;
    is_returned: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface FeeData {
    id: string;
    campus_id: string;
    user_id: string;
    items: {
        fee_type: string;
        amount: number;
        name: string;
    }[];
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    is_paid: boolean;
    payment_date: Date;
    payment_mode: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface DocumentStoreData {
    id: string;
    campus_id: string;
    document_name: string;
    document_type: string;
    document_meta_data: object;
    issued_to: string;
    issuer_id: string;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface MeetingData {
    id: string;
    campus_id: string;
    creator_id: string;
    participants: string[];
    meeting_name: string;
    meeting_description: string;
    meeting_start_time: Date;
    meeting_end_time: Date;
    meeting_location: string;
    meeting_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface CourseData {
    id: string;
    campus_id: string;
    course_name: string;
    course_code: string;
    course_description: string;
    course_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface CourseEnrollmentData {
    id: string;
    campus_id: string;
    course_id: string;
    user_id: string;
    enrollment_date: Date;
    completion_date: Date;
    is_completed: boolean;
    is_graded: boolean;
    grade_data: {
        assignment_id: string;
        grade: number;
    }[];
    overall_grade: number;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface CourseContentData {
    id: string;
    campus_id: string;
    course_id: string;
    content_type: string;
    data: object;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface CourseAssignmentData {
    id: string;
    campus_id: string;
    course_id: string;
    assignment_title: string;
    assignment_description: string;
    due_date: Date;
    is_graded: boolean;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface CourseAssignmentSubmissionData {
    id: string;
    campus_id: string;
    course_id: string;
    assignment_id: string;
    user_id: string;
    submission_date: Date;
    grade: number;
    feedback: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface CourseQuizData {
    id: string;
    campus_id: string;
    course_id: string;
    quiz_name: string;
    quiz_description: string;
    quiz_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface CourseQuizQuestionData {
    id: string;
    campus_id: string;
    course_id: string;
    quiz_id: string;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface CourseQuizAttemptData {
    id: string;
    campus_id: string;
    course_id: string;
    quiz_id: string;
    user_id: string;
    attempt_date: Date;
    score: number;
    feedback: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

interface CourseQuizSubmissionData {
    id: string;
    campus_id: string;
    course_id: string;
    quiz_id: string;
    user_id: string;
    submission_date: Date;
    score: number;
    feedback: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface Database {
    users_data: UsersData;
    campuses_data: CampusesData;
    login_sessions_data: LoginSessionsData;
    password_resets_data: PasswordResetsData;
}
