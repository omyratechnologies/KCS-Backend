/**
 * Fee Structure Routes
 * Admin manages fee structures for classes
 */

import { Hono } from "hono";
import { ClassFeeStructureController } from "../controllers/class_fee_structure.controller";
import { roleMiddleware } from "@/middlewares/role.middleware";

const feeStructureRouter = new Hono();

// Create fee structure (Admin only)
feeStructureRouter.post("/", roleMiddleware("create_fee_structure"), ClassFeeStructureController.createFeeStructure);

// Get all fee structures with optional filters (Admin only)
feeStructureRouter.get(
    "/",
    roleMiddleware("get_all_fee_structures"),
    ClassFeeStructureController.getAllFeeStructures
);

// Get fee structure by ID (Student, Parent, Admin, Accountant)
feeStructureRouter.get("/:id", roleMiddleware("view_fee_structure"), ClassFeeStructureController.getFeeStructureById);

// Update fee structure (Admin only)
feeStructureRouter.patch(
    "/:id",
    roleMiddleware("update_fee_structure"),
    ClassFeeStructureController.updateFeeStructure
);

export default feeStructureRouter;
