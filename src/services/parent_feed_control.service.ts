import { ParentFeedControl, type IParentFeedControl } from "@/models/parent_feed_control.model";
import { UserService } from "@/services/users.service";

export class ParentFeedControlService {
    
    // Helper method to validate UUID format
    private static isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    // Helper method to validate parent-student relationship
    private static async validateParentStudentRelationship(parent_id: string, student_id: string): Promise<void> {
        try {
            const students = await UserService.getStudentForParent(parent_id);
            
            // Check both id and user_id fields to handle both database ID and user ID cases
            // This ensures compatibility regardless of which ID format is being used
            const isValidRelationship = students.some(student => 
                student.id === student_id || student.user_id === student_id
            );
            
            if (!isValidRelationship) {
                throw new Error("You are not authorized to control this student's feed access");
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Parent-student relationship validation failed: ${error.message}`);
            }
            throw new Error("Failed to validate parent-student relationship");
        }
    }
    
    // Get feed control settings for a specific parent-student pair
    public static readonly getFeedControl = async (parent_id: string, student_id: string): Promise<IParentFeedControl | null> => {
        // Validate UUID formats
        if (!this.isValidUUID(parent_id)) {
            throw new Error("Invalid parent ID format");
        }
        if (!this.isValidUUID(student_id)) {
            throw new Error("Invalid student ID format");
        }

        // Validate parent-student relationship
        await this.validateParentStudentRelationship(parent_id, student_id);

        const data = await ParentFeedControl.find({
            parent_id,
            student_id
        });

        return data.rows.length > 0 ? data.rows[0] : null;
    };

    // Set feed access for a student (enable or disable)
    public static readonly setFeedAccess = async (
        parent_id: string, 
        student_id: string, 
        campus_id: string,
        feed_access_enabled: boolean
    ): Promise<IParentFeedControl> => {
        // Validate UUID formats
        if (!this.isValidUUID(parent_id)) {
            throw new Error("Invalid parent ID format");
        }
        if (!this.isValidUUID(student_id)) {
            throw new Error("Invalid student ID format");
        }
        if (!this.isValidUUID(campus_id)) {
            throw new Error("Invalid campus ID format");
        }

        // Validate parent-student relationship
        await this.validateParentStudentRelationship(parent_id, student_id);

        // Check if a control record already exists
        const existingControl = await ParentFeedControl.find({
            parent_id,
            student_id
        });

        if (existingControl.rows.length > 0) {
            // Update existing record
            const existing = existingControl.rows[0];
            const updatedData: Partial<IParentFeedControl> = {
                feed_access_enabled,
                updated_at: new Date()
            };

            await ParentFeedControl.updateById(existing.id, updatedData);
            
            // Fetch and return the updated record
            const updatedControl = await ParentFeedControl.findById(existing.id);
            return updatedControl;
        } else {
            // Create new record
            const controlData: Omit<IParentFeedControl, 'id'> = {
                parent_id,
                student_id,
                campus_id,
                feed_access_enabled,
                updated_at: new Date()
            };

            const newControl = await ParentFeedControl.create(controlData);
            return newControl;
        }
    };

    // Check if a student has access to feeds (used by middleware)
    public static readonly checkStudentFeedAccess = async (student_id: string): Promise<boolean> => {
        try {
            // Get all parent control records that affect this student
            // Using the same query pattern as getFeedControl but only filtering by student_id
            const data = await ParentFeedControl.find({
                student_id: student_id
            });

            // If no control records exist, default to allow access
            if (!data || !data.rows || data.rows.length === 0) {
                return true; // Default: allow access
            }

            // If ANY parent control record has disabled access, deny access
            // This ensures that if any parent disables access, the student is blocked
            for (const controlRecord of data.rows) {
                if (controlRecord.feed_access_enabled === false) {
                    return false; // Access blocked by at least one parent
                }
            }

            // All existing control records allow access
            return true;
        } catch {
            // In case of any error, fail-open (allow access) to prevent system breaking
            // In production, you might want to log this error for debugging
            return true;
        }
    };
}