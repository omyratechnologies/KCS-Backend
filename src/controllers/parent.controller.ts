import { type Context } from "hono";

import { UserService } from "@/services/users.service";

export class ParentController {
    // Get Parent for student id
    public static readonly getParentForStudent = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();

            const parents = await UserService.getParentForStudent(student_id);

            return ctx.json(parents);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Get Student for parent id
    public static readonly getStudentForParent = async (ctx: Context) => {
        try {
            const { parent_id } = ctx.req.param();

            const students = await UserService.getStudentForParent(parent_id);

            return ctx.json(students);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
}
