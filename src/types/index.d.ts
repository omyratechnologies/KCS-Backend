type ID = string;

interface IInfoLogs {
    infoLogs: (msg: string, logType: LogTypes) => void;
    generated_by: string;
}

// Student Parent Teacher  Staff Principal  Admin Super Admin Public User
type UserType =
    | "Student"
    | "Parent"
    | "Teacher"
    | "Staff"
    | "Principal"
    | "Admin"
    | "Super Admin"
    | "Public";
