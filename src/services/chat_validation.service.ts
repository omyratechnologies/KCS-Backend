import { Class } from "../models/class.model";
import { Teacher, ITeacherData } from "../models/teacher.model";
import { User } from "../models/user.model";
import { ChatRoom } from "../models/chat_room.model";
import log, { LogTypes } from "../libs/logger";

export class ChatValidationService {
    /**
     * Check if user can send personal message to another user
     */
    public static async canSendPersonalMessage(
        sender_user_id: string,
        recipient_user_id: string,
        campus_id: string
    ): Promise<{ canSend: boolean; reason?: string }> {
        try {
            // Get user profiles
            const [senderProfile, recipientProfile] = await Promise.all([
                this.getUserProfile(sender_user_id, campus_id),
                this.getUserProfile(recipient_user_id, campus_id)
            ]);


            if (!senderProfile || !recipientProfile) {
                return { canSend: false, reason: "User not found" };
            }

            // Both must be in same campus
            if (senderProfile.campus_id !== recipientProfile.campus_id) {
                return { canSend: false, reason: "Users must be from the same campus" };
            }

            const senderType = senderProfile.user_type;
            const recipientType = recipientProfile.user_type;

            // Admins and Super Admins can message anyone (admins, teachers, students, parents)
            if (["Admin", "Super Admin"].includes(senderType)) {
                return { canSend: true };
            }

            // Teachers can message anyone (teachers, admin, students, parents)
            if (senderType === "Teacher") {
                return { canSend: true };
            }

            // Students can message teachers and other students
            if (senderType === "Student") {
                // Students can message teachers
                if (recipientType === "Teacher") {
                    return { canSend: true };
                }
                
                // Students can only message students in same class
                if (recipientType === "Student") {
                    const senderClassId = await this.getUserClassId(sender_user_id, campus_id);
                    const recipientClassId = await this.getUserClassId(recipient_user_id, campus_id);
                    
                    if (!senderClassId || !recipientClassId) {
                        return { canSend: false, reason: "Class information not found" };
                    }

                    if (senderClassId === recipientClassId) {
                        return { canSend: true };
                    } else {
                        return { canSend: false, reason: "Students can only message classmates" };
                    }
                }

                // Students cannot message parents or admins
                return { canSend: false, reason: "Students can only message teachers and classmates" };
            }

            // Parents can message teachers and students
            if (senderType === "Parent") {
                if (["Teacher", "Student"].includes(recipientType)) {
                    return { canSend: true };
                }
                
                // Parents cannot message admins or other parents
                return { canSend: false, reason: "Parents can only message teachers and students" };
            }

            return { canSend: false, reason: "Messaging not allowed between these user types" };
        } catch (error) {
            // Log error appropriately
            log(`Personal message validation error: ${error}`, LogTypes.ERROR, "CHAT_VALIDATION");
            return { canSend: false, reason: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    /**
     * Check if user can create a group
     * Teachers and Admins can create groups
     */
    public static async canCreateGroup(
        user_id: string,
        campus_id: string,
        group_type: "class_group" | "subject_group" | "custom_group",
        group_data: {
            class_id?: string;
            subject_id?: string;
        },
        members: string[],
        teacherData?: ITeacherData // Optional: pass teacher data from middleware to avoid DB call
    ): Promise<{ canCreate: boolean; reason?: string }> {
        try {
            // Get user profile to check user type
            const userProfile = await this.getUserProfile(user_id, campus_id);
            if (!userProfile) {
                return { canCreate: false, reason: "User not found" };
            }

            // Admins and Super Admins can create any type of group
            if (["Admin", "Super Admin"].includes(userProfile.user_type)) {
                if (!members || members.length === 0) {
                    return { canCreate: false, reason: "At least one member is required" };
                }
                // Admins can create all group types without additional validation
                return { canCreate: true };
            }

            // For teachers, validate based on group type
            let teacher = teacherData;
            if (!teacher) {
                teacher = await Teacher.findOne({
                    user_id,
                    campus_id,
                });

                if (!teacher) {
                    return { canCreate: false, reason: "Teacher profile not found" };
                }
            }

            if (!members || members.length === 0) {
                return { canCreate: false, reason: "At least one member is required" };
            }

            switch (group_type as "class_group" | "subject_group" | "custom_group") {
                case "class_group":
                    if (!group_data.class_id) {
                        return { canCreate: false, reason: "Class ID is required for class groups" };
                    }
                    return this.validateClassGroupCreation(teacher, group_data.class_id, campus_id);
                case "subject_group":
                    if (!group_data.subject_id) {
                        return { canCreate: false, reason: "Subject ID is required for subject groups" };
                    }
                    return this.validateSubjectGroupCreation(teacher, group_data.subject_id);
                case "custom_group":
                    return { canCreate: true }; // Teachers can always create custom groups
                default:
                    return { canCreate: false, reason: "Invalid group type" };
            }
        } catch (error) {
            log(`Group creation validation error: ${error}`, LogTypes.ERROR, "CHAT_VALIDATION");
            return { canCreate: false, reason: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    /**
     * Check if user can send message to a group
     */
    public static async canSendGroupMessage(
        user_id: string,
        room_id: string,
        campus_id: string
    ): Promise<{ canSend: boolean; reason?: string }> {
        try {
            const room = await ChatRoom.findById(room_id);
            if (!room || !room.is_active || room.is_deleted) {
                return { canSend: false, reason: "Room not found or inactive" };
            }

            if (room.campus_id !== campus_id) {
                return { canSend: false, reason: "Room not in user's campus" };
            }

            // Check if user is member of the group
            if (!room.members.includes(user_id)) {
                return { canSend: false, reason: "User is not a member of this room" };
            }

            return { canSend: true };
        } catch {
            return { canSend: false, reason: "Validation failed" };
        }
    }

    /**
     * Get user profile with class information
     */
    private static async getUserProfile(user_id: string, campus_id: string) {
        try {
            // First try to find by document ID (which is what we get from JWT token)
            let user = await User.findById(user_id);

            // If found, verify it's in the correct campus
            if (user && user.campus_id !== campus_id) {
                log(`User ${user_id} found but in different campus: ${user.campus_id} vs ${campus_id}`, LogTypes.ERROR, "CHAT_VALIDATION");
                return null;
            }

            // If not found by ID, try the old approach with user_id field (fallback)
            if (!user) {
                user = await User.findOne({
                    user_id,
                    campus_id,
                    is_active: true,
                    is_deleted: false
                });
            }

            // Additional fallback: try without is_active/is_deleted filters
            if (!user) {
                user = await User.findOne({
                    user_id,
                    campus_id
                });
            }

            return user;
        } catch (error) {
            log(`Error fetching user profile for ${user_id}: ${error}`, LogTypes.ERROR, "CHAT_VALIDATION");
            throw error;
        }
    }

    /**
     * Get user's class ID (for students) - optimized version
     */
    private static classCache = new Map<string, { classes: { id: string; student_ids?: string[]; name?: string }[]; timestamp: number }>();
    private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    private static async getUserClassId(user_id: string, campus_id: string): Promise<string | null> {
        try {
            const cacheKey = campus_id;
            const now = Date.now();
            
            // Check cache first
            let classData = this.classCache.get(cacheKey);
            if (!classData || now - classData.timestamp > this.CACHE_TTL) {
                // Fetch all classes for this campus and cache them
                const allClasses = await Class.find({
                    campus_id,
                    is_active: true,
                    is_deleted: false
                });
                
                classData = {
                    classes: allClasses.rows || [],
                    timestamp: now
                };
                this.classCache.set(cacheKey, classData);
            }

            // Find class where user is a student
            const userClass = classData.classes.find(cls => 
                cls.student_ids && cls.student_ids.includes(user_id)
            );

            return userClass ? userClass.id : null;
        } catch (error) {
            log(`Error in getUserClassId for student ${user_id}: ${error}`, LogTypes.ERROR, "CHAT_VALIDATION");
            return null;
        }
    }

    /**
     * Validate class group creation
     */
    private static async validateClassGroupCreation(
        teacherData: { user_id: string; subjects: string[]; classes: string[] },
        class_id: string,
        campus_id: string
    ): Promise<{ canCreate: boolean; reason?: string }> {
        const classInfo = await Class.findById(class_id);
        if (!classInfo) {
            return { canCreate: false, reason: "Class not found" };
        }

        if (classInfo.campus_id !== campus_id) {
            return { canCreate: false, reason: "Class not in teacher's campus" };
        }

        // Check if teacher is class teacher
        if (classInfo.class_teacher_id === teacherData.user_id) {
            return { canCreate: true };
        }

        // Check if teacher teaches this class
        if (classInfo.teacher_ids && classInfo.teacher_ids.includes(teacherData.user_id)) {
            return { canCreate: true };
        }

        return { canCreate: false, reason: "Teacher is not authorized to create group for this class" };
    }

    /**
     * Validate subject group creation
     */
    private static async validateSubjectGroupCreation(
        teacherData: { user_id: string; subjects: string[]; classes: string[] },
        subject_id: string,
    ): Promise<{ canCreate: boolean; reason?: string }> {
        // Check if teacher teaches this subject
        if (!teacherData.subjects || !teacherData.subjects.includes(subject_id)) {
            return { canCreate: false, reason: "Teacher does not teach this subject" };
        }
        return { canCreate: true };
    }

    /**
     * Get all users that a user can message personally
     */
    public static async getAvailableContacts(
        user_id: string,
        campus_id: string
    ): Promise<{ users: { id: string; user_id: string; first_name: string; last_name: string; user_type: string; email: string; class_name?: string; subject?: string }[]; error?: string }> {
        try {
            const userProfile = await this.getUserProfile(user_id, campus_id);
            if (!userProfile) {
                return { users: [], error: "User not found" };
            }

            let availableUsers: { id: string; user_id: string; first_name: string; last_name: string; user_type: string; email: string; is_active: boolean; is_deleted: boolean; campus_id?: string; class_name?: string; subject?: string }[] = [];

            const userType = userProfile.user_type;

            if (["Admin", "Super Admin"].includes(userType)) {
                // Admins can message everyone: admins, teachers, students, parents
                const allUsers = await User.find({
                    campus_id,
                    is_active: true,
                    is_deleted: false
                });
                
                // Filter out self
                availableUsers = (allUsers.rows || []).filter(user => user.id !== user_id);

                // Add class information for students
                await this.addClassInfoToUsers(availableUsers.filter(u => u.user_type === "Student"), campus_id);

            } else if (userType === "Teacher") {
                // Teachers can message everyone: teachers, admin, students, parents
                const allUsers = await User.find({
                    campus_id,
                    is_active: true,
                    is_deleted: false
                });
                
                // Filter out self
                availableUsers = (allUsers.rows || []).filter(user => user.id !== user_id);

                // Add class information for students
                await this.addClassInfoToUsers(availableUsers.filter(u => u.user_type === "Student"), campus_id);

                // For teachers in the list, just add a generic subject
                availableUsers.forEach(user => {
                    if (user.user_type === "Teacher") {
                        user.subject = "General";
                    }
                });

            } else if (userType === "Student") {
                // Students can message: teachers and students (from same class)
                try {
                    // Get all teachers
                    const allTeachers = await User.find({
                        campus_id,
                        user_type: "Teacher",
                        is_active: true,
                        is_deleted: false
                    });

                    const teachers = (allTeachers.rows || []).map(teacher => ({
                        ...teacher,
                        subject: "General"
                    }));
                    availableUsers.push(...teachers);

                    // Get classmates from same class
                    try {
                        const userClassId = await this.getUserClassId(user_id, campus_id);
                        
                        if (userClassId) {
                            const classData = await Class.findById(userClassId);
                            const classmateIds = classData?.student_ids?.filter(id => id !== user_id) || [];
                            
                            if (classmateIds.length > 0) {
                                const allStudents = await User.find({
                                    campus_id,
                                    user_type: "Student",
                                    is_active: true,
                                    is_deleted: false
                                });

                                const classmates = (allStudents.rows || [])
                                    .filter(student => classmateIds.includes(student.id))
                                    .map(classmate => ({
                                        ...classmate,
                                        class_name: classData?.name || "Same Class"
                                    }));

                                availableUsers.push(...classmates);
                            }
                        }
                    } catch (classError) {
                        log(`Non-critical: Error fetching classmates for student ${user_id}: ${classError}`, LogTypes.LOGS, "CHAT_VALIDATION");
                    }
                } catch (studentError) {
                    log(`Error in student contact processing for ${user_id}: ${studentError}`, LogTypes.ERROR, "CHAT_VALIDATION");
                    return { users: [], error: "Failed to get student contacts" };
                }

            } else if (userType === "Parent") {
                // Parents can message: teachers and students
                try {
                    // Get all teachers
                    const allTeachers = await User.find({
                        campus_id,
                        user_type: "Teacher",
                        is_active: true,
                        is_deleted: false
                    });

                    const teachers = (allTeachers.rows || []).map(teacher => ({
                        ...teacher,
                        subject: "General"
                    }));
                    availableUsers.push(...teachers);

                    // Get all students
                    const allStudents = await User.find({
                        campus_id,
                        user_type: "Student",
                        is_active: true,
                        is_deleted: false
                    });

                    const students = (allStudents.rows || []);
                    
                    // Add class information to students
                    await this.addClassInfoToUsers(students, campus_id);
                    
                    availableUsers.push(...students);
                } catch (parentError) {
                    log(`Error in parent contact processing for ${user_id}: ${parentError}`, LogTypes.ERROR, "CHAT_VALIDATION");
                    return { users: [], error: "Failed to get parent contacts" };
                }
            }

            // Remove sensitive data and organize by type
            const sanitizedUsers = availableUsers.map(user => ({
                id: user.id,
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                user_type: user.user_type,
                email: user.email,
                ...(user.class_name && { class_name: user.class_name }),
                ...(user.subject && { subject: user.subject })
            }));

            // Sort users by type and name for better UX
            const sortedUsers = sanitizedUsers.sort((a, b) => {
                // Define priority order for user types
                const typePriority: { [key: string]: number } = {
                    "Admin": 1,
                    "Super Admin": 1,
                    "Teacher": 2,
                    "Student": 3,
                    "Parent": 4
                };

                const aPriority = typePriority[a.user_type] || 5;
                const bPriority = typePriority[b.user_type] || 5;

                // First sort by user type priority
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }

                // Then sort by name
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });

            return { users: sortedUsers };
        } catch (error) {
            log(`Error in getAvailableContacts: ${error}`, LogTypes.ERROR, "CHAT_VALIDATION");
            return { users: [], error: "Failed to get contacts" };
        }
    }

    /**
     * Helper method to add class information to student users
     */
    private static async addClassInfoToUsers(
        students: { id: string; class_name?: string }[],
        campus_id: string
    ): Promise<void> {
        const studentPromises = students.map(async (student) => {
            try {
                const studentClassId = await this.getUserClassId(student.id, campus_id);
                if (studentClassId) {
                    const classData = await Class.findById(studentClassId);
                    student.class_name = classData?.name || "Unknown Class";
                }
            } catch (error) {
                log(`Error processing student ${student.id}: ${error}`, LogTypes.ERROR, "CHAT_VALIDATION");
                // Continue without class data
            }
        });

        await Promise.all(studentPromises);
    }
}
