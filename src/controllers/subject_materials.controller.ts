import { Context } from "hono";

import { ISubjectMaterial } from "@/models/subject.model";
import { SubjectService } from "@/services/subject.service";
import { SubjectMaterialsService } from "@/services/subject_materials.service";

export class SubjectMaterialsController {
    // Add material to subject
    public static readonly addMaterial = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");
            const material_type = ctx.req.param("material_type") as 'pdfs' | 'videos' | 'worksheets' | 'presentations';
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Validate material type
            const validTypes = ['pdfs', 'videos', 'worksheets', 'presentations'];
            if (!validTypes.includes(material_type)) {
                return ctx.json({ error: "Invalid material type" }, 400);
            }

            const materialData: Omit<ISubjectMaterial, 'id' | 'file_type' | 'created_at' | 'updated_at'> = await ctx.req.json();

            const updatedSubject = await SubjectMaterialsService.addMaterial(
                subject_id,
                material_type,
                {
                    ...materialData,
                    upload_by: user_id,
                    download_count: 0,
                    date: new Date().toISOString()
                },
                user_id,
                user_type
            );

            return ctx.json({
                success: true,
                data: updatedSubject,
                message: "Material added successfully"
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };

    // Update material
    public static readonly updateMaterial = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");
            const material_type = ctx.req.param("material_type") as 'pdfs' | 'videos' | 'worksheets' | 'presentations';
            const material_id = ctx.req.param("material_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Validate material type
            const validTypes = ['pdfs', 'videos', 'worksheets', 'presentations'];
            if (!validTypes.includes(material_type)) {
                return ctx.json({ error: "Invalid material type" }, 400);
            }

            const updateData = await ctx.req.json();

            const updatedSubject = await SubjectMaterialsService.updateMaterial(
                subject_id,
                material_type,
                material_id,
                updateData,
                user_id,
                user_type
            );

            return ctx.json({
                success: true,
                data: updatedSubject,
                message: "Material updated successfully"
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };

    // Delete material
    public static readonly deleteMaterial = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");
            const material_type = ctx.req.param("material_type") as 'pdfs' | 'videos' | 'worksheets' | 'presentations';
            const material_id = ctx.req.param("material_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Validate material type
            const validTypes = ['pdfs', 'videos', 'worksheets', 'presentations'];
            if (!validTypes.includes(material_type)) {
                return ctx.json({ error: "Invalid material type" }, 400);
            }

            const updatedSubject = await SubjectMaterialsService.deleteMaterial(
                subject_id,
                material_type,
                material_id,
                user_id,
                user_type
            );

            return ctx.json({
                success: true,
                data: updatedSubject,
                message: "Material deleted successfully"
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };

    // Get materials by type
    public static readonly getMaterialsByType = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");
            const material_type = ctx.req.param("material_type") as 'pdfs' | 'videos' | 'worksheets' | 'presentations';
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Validate material type
            const validTypes = ['pdfs', 'videos', 'worksheets', 'presentations'];
            if (!validTypes.includes(material_type)) {
                return ctx.json({ error: "Invalid material type" }, 400);
            }

            const materials = await SubjectMaterialsService.getMaterialsByType(subject_id, material_type, user_id, user_type);

            return ctx.json({
                success: true,
                data: materials,
                count: materials.length
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };

    // Get single material
    public static readonly getMaterial = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");
            const material_type = ctx.req.param("material_type") as 'pdfs' | 'videos' | 'worksheets' | 'presentations';
            const material_id = ctx.req.param("material_id");

            // Validate material type
            const validTypes = ['pdfs', 'videos', 'worksheets', 'presentations'];
            if (!validTypes.includes(material_type)) {
                return ctx.json({ error: "Invalid material type" }, 400);
            }

            const material = await SubjectMaterialsService.getMaterialById(subject_id, material_type, material_id);

            return ctx.json({
                success: true,
                data: material
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };

    // Download material (increment count)
    public static readonly downloadMaterial = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");
            const material_type = ctx.req.param("material_type") as 'pdfs' | 'videos' | 'worksheets' | 'presentations';
            const material_id = ctx.req.param("material_id");

            // Validate material type
            const validTypes = ['pdfs', 'videos', 'worksheets', 'presentations'];
            if (!validTypes.includes(material_type)) {
                return ctx.json({ error: "Invalid material type" }, 400);
            }

            // Get material first to check link
            const material = await SubjectMaterialsService.getMaterialById(subject_id, material_type, material_id);
            
            // Increment download count
            await SubjectMaterialsService.incrementDownloadCount(subject_id, material_type, material_id);

            return ctx.json({
                success: true,
                data: {
                    download_url: material.link,
                    title: material.title,
                    size: material.size
                },
                message: "Download initiated successfully"
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };

    // Assign teacher to subject
    public static readonly assignTeacher = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const {
                teacher_id,
                role,
                hours,
                days
            } = await ctx.req.json();

            const updatedSubject = await SubjectMaterialsService.assignTeacher(
                subject_id,
                teacher_id,
                role,
                hours,
                days,
                user_id,
                user_type
            );

            return ctx.json({
                success: true,
                data: updatedSubject,
                message: "Teacher assigned successfully"
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };

    // Remove teacher from subject
    public static readonly removeTeacher = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");
            const teacher_id = ctx.req.param("teacher_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const updatedSubject = await SubjectMaterialsService.removeTeacher(
                subject_id,
                teacher_id,
                user_id,
                user_type
            );

            return ctx.json({
                success: true,
                data: updatedSubject,
                message: "Teacher removed successfully"
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };

    // Get subject with detailed breakdown
    public static readonly getSubjectDetails = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");

            const subject = await SubjectService.getSubjectById(subject_id);

            // Get material counts for summary
            const materialSummary = {
                pdfs: {
                    count: subject.meta_data.materials?.pdfs?.length || 0,
                    items: subject.meta_data.materials?.pdfs || []
                },
                videos: {
                    count: subject.meta_data.materials?.videos?.length || 0,
                    items: subject.meta_data.materials?.videos || []
                },
                worksheets: {
                    count: subject.meta_data.materials?.worksheets?.length || 0,
                    items: subject.meta_data.materials?.worksheets || []
                },
                presentations: {
                    count: subject.meta_data.materials?.presentations?.length || 0,
                    items: subject.meta_data.materials?.presentations || []
                }
            };

            return ctx.json({
                success: true,
                data: {
                    ...subject,
                    material_summary: materialSummary,
                    teacher_count: Object.keys(subject.meta_data.teachers || {}).length
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    error: error.message
                }, 400);
            }
            return ctx.json({
                success: false,
                error: "An unexpected error occurred"
            }, 500);
        }
    };
}
