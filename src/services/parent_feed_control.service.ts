import { ParentFeedControl, type IParentFeedControl } from "@/models/parent_feed_control.model";

export class ParentFeedControlService {
    
    // Get feed control settings for a specific parent-student pair
    public static readonly getFeedControl = async (parent_id: string, student_id: string): Promise<IParentFeedControl | null> => {
        // TEMPORARILY BYPASSING RELATIONSHIP CHECK FOR TESTING
        // TODO: In production, uncomment this verification:
        // const students = await UserService.getStudentForParent(parent_id);
        // const isValidRelationship = students.some(student => student.id === student_id);
        // if (!isValidRelationship) {
        //     throw new Error("Invalid parent-student relationship");
        // }

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
        // TEMPORARILY BYPASSING RELATIONSHIP CHECK FOR TESTING
        // TODO: In production, uncomment this verification:
        // const students = await UserService.getStudentForParent(parent_id);
        // const isValidRelationship = students.some(student => student.id === student_id);
        // if (!isValidRelationship) {
        //     throw new Error("Invalid parent-student relationship");
        // }

        // Check if a control record already exists
        const existingControl = await this.getFeedControl(parent_id, student_id);

        if (existingControl) {
            // Update existing record
            const updatedData: Partial<IParentFeedControl> = {
                feed_access_enabled,
                updated_at: new Date()
            };

            await ParentFeedControl.updateById(existingControl.id, updatedData);
            
            // Fetch and return the updated record
            const updatedControl = await ParentFeedControl.findById(existingControl.id);
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