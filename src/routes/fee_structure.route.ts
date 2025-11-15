/**
 * Fee Structure Routes
 * Admin manages fee structures for classes
 */

import { Hono } from "hono";
import { ClassFeeStructureController } from "../controllers/class_fee_structure.controller";

const feeStructureRouter = new Hono();

// Create fee structure
feeStructureRouter.post("/", ClassFeeStructureController.createFeeStructure);

// Get all fee structures (with optional filters)
feeStructureRouter.get("/", ClassFeeStructureController.getAllFeeStructures);

// Get fee structure by ID
feeStructureRouter.get("/:id", ClassFeeStructureController.getFeeStructureById);

// Update fee structure
feeStructureRouter.put("/:id", ClassFeeStructureController.updateFeeStructure);

// Delete fee structure
feeStructureRouter.delete("/:id", ClassFeeStructureController.deleteFeeStructure);

export default feeStructureRouter;
