import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface IKeyRotationHistory {
    id: string;
    campus_id: string;
    rotation_date: Date;
    old_key_id: string;
    new_key_id: string;
    key_type: "payment_credentials" | "encryption_master" | "signing_key";
    rotation_reason:
        | "scheduled"
        | "security_incident"
        | "compliance_requirement"
        | "manual";
    rotated_by: string;
    rotation_status: "completed" | "failed" | "pending";
    backup_location: string;
    verification_status: "verified" | "pending" | "failed";
    created_at: Date;
    updated_at: Date;
}

const KeyRotationHistorySchema = new Schema({
    campus_id: { type: String, required: true },
    rotation_date: { type: Date, required: true },
    old_key_id: { type: String, required: true },
    new_key_id: { type: String, required: true },
    key_type: { type: String, required: true },
    rotation_reason: { type: String, required: true },
    rotated_by: { type: String, required: true },
    rotation_status: { type: String, required: true },
    backup_location: { type: String, required: true },
    verification_status: { type: String, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

KeyRotationHistorySchema.index.findByCampusId = { by: "campus_id" };
KeyRotationHistorySchema.index.findByKeyType = { by: "key_type" };
KeyRotationHistorySchema.index.findByStatus = { by: "rotation_status" };
KeyRotationHistorySchema.index.findByCampusIdAndKeyType = {
    by: ["campus_id", "key_type"],
};

const KeyRotationHistory = ottoman.model<IKeyRotationHistory>(
    "key_rotation_history",
    KeyRotationHistorySchema
);

export class KeyRotationHistoryService {
    public static async createRotationRecord(
        data: Omit<IKeyRotationHistory, "id" | "created_at" | "updated_at">
    ): Promise<IKeyRotationHistory> {
        return await KeyRotationHistory.create({
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    public static async getRotationHistory(
        campus_id: string
    ): Promise<IKeyRotationHistory[]> {
        const history = await KeyRotationHistory.find({
            campus_id,
        });
        return history.rows || [];
    }

    public static async getLastRotationDate(
        campus_id: string,
        key_type: string
    ): Promise<Date | null> {
        const lastRotation = await KeyRotationHistory.find({
            campus_id,
            key_type,
            rotation_status: "completed",
        });

        const rotations = lastRotation.rows || [];
        if (rotations.length === 0) {return null;}

        const sortedRotations = rotations.sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        );

        return sortedRotations[0]?.rotation_date || null;
    }

    public static async updateRotationStatus(
        id: string,
        status: "completed" | "failed" | "pending",
        verification_status?: "verified" | "pending" | "failed"
    ): Promise<IKeyRotationHistory> {
        const updateData: Partial<IKeyRotationHistory> = {
            rotation_status: status,
            updated_at: new Date(),
        };

        if (verification_status) {
            updateData.verification_status = verification_status;
        }

        return await KeyRotationHistory.updateById(id, updateData);
    }

    public static async getRotationStatistics(): Promise<{
        total_rotations: number;
        successful_rotations: number;
        failed_rotations: number;
        pending_rotations: number;
        last_rotation_date: Date | null;
        avg_rotation_interval_days: number;
    }> {
        const allRotations = await KeyRotationHistory.find({});
        const rotations = allRotations.rows || [];

        const total = rotations.length;
        const successful = rotations.filter(
            (r) => r.rotation_status === "completed"
        ).length;
        const failed = rotations.filter(
            (r) => r.rotation_status === "failed"
        ).length;
        const pending = rotations.filter(
            (r) => r.rotation_status === "pending"
        ).length;

        const lastRotation =
            rotations.length > 0
                ? rotations.sort(
                      (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                  )[0]
                : null;

        // Calculate average rotation interval
        const completedRotations = rotations
            .filter((r) => r.rotation_status === "completed")
            .sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
            );

        let avgIntervalDays = 0;
        if (completedRotations.length > 1) {
            const intervals: number[] = [];
            for (let i = 1; i < completedRotations.length; i++) {
                const prevDate = new Date(completedRotations[i - 1].created_at);
                const currentDate = new Date(completedRotations[i].created_at);
                const intervalDays =
                    (currentDate.getTime() - prevDate.getTime()) /
                    (1000 * 60 * 60 * 24);
                intervals.push(intervalDays);
            }
            avgIntervalDays =
                intervals.reduce((sum, interval) => sum + interval, 0) /
                intervals.length;
        }

        return {
            total_rotations: total,
            successful_rotations: successful,
            failed_rotations: failed,
            pending_rotations: pending,
            last_rotation_date: lastRotation?.rotation_date || null,
            avg_rotation_interval_days: avgIntervalDays,
        };
    }
}

export { KeyRotationHistory };
