import { ISubject, ISubjectMaterial, Subject } from "@/models/subject.model";
import { TeacherService } from "./teacher.service";

export class SubjectMaterialsService {
    // Helper method to generate material ID
    private static generateMaterialId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Check if user has permission to modify materials
    private static async checkMaterialPermission(
        subjectId: string, 
        userId: string, 
        userType: string, 
        operation: 'create' | 'read' | 'update' | 'delete' = 'create',
        materialUploadBy?: string
    ): Promise<boolean> {
        // Admin can do anything (case insensitive check)
        const normalizedUserType = userType.toLowerCase();
        if (normalizedUserType === 'admin' || normalizedUserType === 'super_admin' || normalizedUserType === 'super admin') {
            return true; // Admins have full CRUD access to everything
        }

        // For teachers, check if they are assigned to the subject
        if (normalizedUserType === 'teacher') {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
                throw new Error("Subject not found");
            }

            // Check if teacher is assigned to this subject
            const teacherData = await TeacherService.getTeacherByUserId(userId);
            if (!teacherData) {
                throw new Error("Teacher not found");
            }

            const isAssignedToSubject = subject.meta_data.teachers?.[teacherData.id];
            if (!isAssignedToSubject) {
                return false; // Teacher not assigned to this subject
            }

            // For assigned teachers, check operation permissions
            switch (operation) {
                case 'read':
                    return true; // Teachers can read all files in assigned subjects
                case 'create':
                    return true; // Teachers can upload files to assigned subjects
                case 'update':
                case 'delete':
                    // Teachers can only edit/delete their own files
                    return materialUploadBy === userId;
                default:
                    return false;
            }
        }

        return false;
    }

    // Add material to subject
    public static async addMaterial(
        subjectId: string,
        materialType: 'pdfs' | 'videos' | 'worksheets' | 'presentations',
        materialData: Omit<ISubjectMaterial, 'id' | 'file_type' | 'created_at' | 'updated_at'>,
        userId: string,
        userType: string
    ): Promise<ISubject> {
        // Check permissions
        const hasPermission = await this.checkMaterialPermission(subjectId, userId, userType);
        if (!hasPermission) {
            throw new Error("You don't have permission to add materials to this subject");
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error("Subject not found");
        }

        const newMaterial: ISubjectMaterial = {
            ...materialData,
            id: this.generateMaterialId(),
            file_type: materialType.slice(0, -1) as 'pdf' | 'video' | 'worksheet' | 'presentation',
            upload_by: userId, // Set the uploader ID
            created_at: new Date(),
            updated_at: new Date()
        };

        // Add material to the appropriate array
        if (!subject.meta_data.materials) {
            subject.meta_data.materials = {
                pdfs: [],
                videos: [],
                worksheets: [],
                presentations: []
            };
        }
        if (!subject.meta_data.materials[materialType]) {
            subject.meta_data.materials[materialType] = [];
        }
        subject.meta_data.materials[materialType].push(newMaterial);

        // Update the subject
        const updatedSubject = await Subject.updateById(subjectId, {
            meta_data: subject.meta_data,
            updated_at: new Date()
        });

        if (!updatedSubject) {
            throw new Error("Failed to add material");
        }

        return updatedSubject;
    }

    // Update material
    public static async updateMaterial(
        subjectId: string,
        materialType: 'pdfs' | 'videos' | 'worksheets' | 'presentations',
        materialId: string,
        updateData: Partial<Omit<ISubjectMaterial, 'id' | 'file_type' | 'created_at'>>,
        userId: string,
        userType: string
    ): Promise<ISubject> {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error("Subject not found");
        }

        if (!subject.meta_data.materials?.[materialType]) {
            throw new Error("Material type not found");
        }

        const materialIndex = subject.meta_data.materials[materialType].findIndex(m => m.id === materialId);
        if (materialIndex === -1) {
            throw new Error("Material not found");
        }

        const existingMaterial = subject.meta_data.materials[materialType][materialIndex];
        
        // Check permissions
        const hasPermission = await this.checkMaterialPermission(
            subjectId, 
            userId, 
            userType, 
            'update',
            existingMaterial.upload_by
        );
        if (!hasPermission) {
            throw new Error("You don't have permission to update this material");
        }

        // Update the material
        subject.meta_data.materials[materialType][materialIndex] = {
            ...existingMaterial,
            ...updateData,
            updated_at: new Date()
        };

        const updatedSubject = await Subject.updateById(subjectId, {
            meta_data: subject.meta_data,
            updated_at: new Date()
        });

        if (!updatedSubject) {
            throw new Error("Failed to update material");
        }

        return updatedSubject;
    }

    // Delete material
    public static async deleteMaterial(
        subjectId: string,
        materialType: 'pdfs' | 'videos' | 'worksheets' | 'presentations',
        materialId: string,
        userId: string,
        userType: string
    ): Promise<ISubject> {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error("Subject not found");
        }

        if (!subject.meta_data.materials?.[materialType]) {
            throw new Error("Material type not found");
        }

        const materialIndex = subject.meta_data.materials[materialType].findIndex(m => m.id === materialId);
        if (materialIndex === -1) {
            throw new Error("Material not found");
        }

        const existingMaterial = subject.meta_data.materials[materialType][materialIndex];
        
        // Check permissions
        const hasPermission = await this.checkMaterialPermission(
            subjectId, 
            userId, 
            userType, 
            'delete',
            existingMaterial.upload_by
        );
        if (!hasPermission) {
            throw new Error("You don't have permission to delete this material");
        }

        // Remove the material
        subject.meta_data.materials[materialType].splice(materialIndex, 1);

        const updatedSubject = await Subject.updateById(subjectId, {
            meta_data: subject.meta_data,
            updated_at: new Date()
        });

        if (!updatedSubject) {
            throw new Error("Failed to delete material");
        }

        return updatedSubject;
    }

    // Get all materials for a subject by type
    public static async getMaterialsByType(
        subjectId: string,
        materialType: 'pdfs' | 'videos' | 'worksheets' | 'presentations',
        userId: string,
        userType: string
    ): Promise<ISubjectMaterial[]> {
        // Check read permissions
        const hasPermission = await this.checkMaterialPermission(subjectId, userId, userType, 'read');
        if (!hasPermission) {
            throw new Error("You don't have permission to view materials in this subject");
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error("Subject not found");
        }

        return subject.meta_data.materials?.[materialType] || [];
    }

    // Get material by ID
    public static async getMaterialById(
        subjectId: string,
        materialType: 'pdfs' | 'videos' | 'worksheets' | 'presentations',
        materialId: string
    ): Promise<ISubjectMaterial> {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error("Subject not found");
        }

        const material = subject.meta_data.materials?.[materialType]?.find(m => m.id === materialId);
        if (!material) {
            throw new Error("Material not found");
        }

        return material;
    }

    // Increment download count
    public static async incrementDownloadCount(
        subjectId: string,
        materialType: 'pdfs' | 'videos' | 'worksheets' | 'presentations',
        materialId: string
    ): Promise<ISubject> {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error("Subject not found");
        }

        if (!subject.meta_data.materials?.[materialType]) {
            throw new Error("Material type not found");
        }

        const materialIndex = subject.meta_data.materials[materialType].findIndex(m => m.id === materialId);
        if (materialIndex === -1) {
            throw new Error("Material not found");
        }

        // Increment download count
        subject.meta_data.materials[materialType][materialIndex].download_count += 1;
        subject.meta_data.materials[materialType][materialIndex].updated_at = new Date();

        const updatedSubject = await Subject.updateById(subjectId, {
            meta_data: subject.meta_data,
            updated_at: new Date()
        });

        if (!updatedSubject) {
            throw new Error("Failed to update download count");
        }

        return updatedSubject;
    }

    // Assign teacher to subject
    public static async assignTeacher(
        subjectId: string,
        teacherId: string,
        role: string,
        hours: number,
        days: string[],
        userId: string,
        userType: string
    ): Promise<ISubject> {
        // Only admin can assign teachers (case insensitive check)
        const normalizedUserType = userType.toLowerCase();
        if (normalizedUserType !== 'admin' && normalizedUserType !== 'super_admin' && normalizedUserType !== 'super admin') {
            throw new Error("You don't have permission to assign teachers");
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error("Subject not found");
        }

        // Initialize teachers if not exists
        if (!subject.meta_data.teachers) {
            subject.meta_data.teachers = {};
        }

        // Add/update teacher assignment
        subject.meta_data.teachers[teacherId] = {
            teacher_id: teacherId,
            role,
            hours,
            days,
            assigned_at: new Date()
        };

        const updatedSubject = await Subject.updateById(subjectId, {
            meta_data: subject.meta_data,
            updated_at: new Date()
        });

        if (!updatedSubject) {
            throw new Error("Failed to assign teacher");
        }

        return updatedSubject;
    }

    // Remove teacher from subject
    public static async removeTeacher(
        subjectId: string,
        teacherId: string,
        userId: string,
        userType: string
    ): Promise<ISubject> {
        // Only admin can remove teachers (case insensitive check)
        const normalizedUserType = userType.toLowerCase();
        if (normalizedUserType !== 'admin' && normalizedUserType !== 'super_admin' && normalizedUserType !== 'super admin') {
            throw new Error("You don't have permission to remove teachers");
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error("Subject not found");
        }

        if (!subject.meta_data.teachers?.[teacherId]) {
            throw new Error("Teacher not assigned to this subject");
        }

        delete subject.meta_data.teachers[teacherId];

        const updatedSubject = await Subject.updateById(subjectId, {
            meta_data: subject.meta_data,
            updated_at: new Date()
        });

        if (!updatedSubject) {
            throw new Error("Failed to remove teacher");
        }

        return updatedSubject;
    }
}
