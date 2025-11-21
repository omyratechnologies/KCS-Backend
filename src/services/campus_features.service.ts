import { CampusFeatures, ICampusFeatures } from "@/models/campus_features.model";

export class CampusFeaturesService {
    /**
     * Get features configuration for a specific campus
     */
    static async getCampusFeatures(campus_id: string): Promise<ICampusFeatures | null> {
        try {
            const features = await CampusFeatures.findOne({ campus_id });
            return features;
        } catch (error) {
            throw new Error(`Failed to fetch campus features: ${error}`);
        }
    }

    /**
     * Initialize default features for a campus (all enabled)
     */
    static async initializeCampusFeatures(
        campus_id: string,
        updated_by: string
    ): Promise<ICampusFeatures> {
        try {
            // Skip campus check for now - assuming campus exists
            // TODO: Fix campus lookup with proper Ottoman query

            // Check if features already exist
            const existingFeatures = await CampusFeatures.findOne({ campus_id });
            if (existingFeatures) {
                return existingFeatures;
            }

            // Create default features (all enabled)
            const campusFeatures = await CampusFeatures.create({
                campus_id,
                features: {
                    chat: true,
                    meetings: true,
                    payments: true,
                    curriculum: true,
                    subject_materials: true,
                    student_parent_access: true,
                },
                updated_by,
                created_at: new Date(),
                updated_at: new Date(),
            });

            return campusFeatures;
        } catch (error) {
            throw new Error(`Failed to initialize campus features: ${error}`);
        }
    }

    /**
     * Update features for a specific campus (Super Admin only)
     */
    static async updateCampusFeatures(
        campus_id: string,
        features: Partial<ICampusFeatures["features"]>,
        updated_by: string
    ): Promise<ICampusFeatures> {
        try {
            // Try to find existing features - Ottoman throws DocumentNotFoundError if not found
            let existingFeatures: ICampusFeatures | null = null;
            try {
                existingFeatures = await CampusFeatures.findOne({ campus_id });
                console.log(`[CampusFeatures] Existing features found for campus: ${campus_id}`);
            } catch (findError: any) {
                // DocumentNotFoundError means no features exist yet - this is expected for new setups
                if (findError.name === 'DocumentNotFoundError') {
                    console.log(`[CampusFeatures] No existing features for campus: ${campus_id}, will create new`);
                    existingFeatures = null;
                } else {
                    // Unexpected error, rethrow
                    throw findError;
                }
            }

            if (!existingFeatures) {
                // Create new campus_features document for existing campus
                console.log(`[CampusFeatures] Creating new campus_features for campus: ${campus_id}`);
                const newFeatures = await CampusFeatures.create({
                    campus_id,
                    features: {
                        chat: true,
                        meetings: true,
                        payments: true,
                        curriculum: true,
                        subject_materials: true,
                        student_parent_access: true,
                        ...features, // Override with requested changes
                    },
                    updated_by,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
                console.log(`[CampusFeatures] Created successfully with ID:`, newFeatures.id);
                return newFeatures;
            }

            // Update existing campus_features document
            console.log(`[CampusFeatures] Updating existing features with ID: ${existingFeatures.id}`);
            const updatedFeatures = {
                ...existingFeatures,
                features: {
                    ...existingFeatures.features,
                    ...features,
                },
                updated_by,
                updated_at: new Date(),
            };

            // Use updateById with the document ID
            if (!existingFeatures.id) {
                throw new Error("Campus features document ID is missing");
            }
            const result = await CampusFeatures.updateById(existingFeatures.id, updatedFeatures);
            console.log(`[CampusFeatures] Updated successfully`);
            return result;
        } catch (error) {
            console.error(`[CampusFeatures] Error in updateCampusFeatures:`, error);
            throw new Error(`Failed to update campus features: ${error}`);
        }
    }

    /**
     * Enable a specific feature for a campus
     */
    static async enableFeature(
        campus_id: string,
        feature_name: keyof ICampusFeatures["features"],
        updated_by: string
    ): Promise<ICampusFeatures> {
        return this.updateCampusFeatures(
            campus_id,
            { [feature_name]: true },
            updated_by
        );
    }

    /**
     * Disable a specific feature for a campus
     */
    static async disableFeature(
        campus_id: string,
        feature_name: keyof ICampusFeatures["features"],
        updated_by: string
    ): Promise<ICampusFeatures> {
        return this.updateCampusFeatures(
            campus_id,
            { [feature_name]: false },
            updated_by
        );
    }

    /**
     * Check if a specific feature is enabled for a campus
     */
    static async isFeatureEnabled(
        campus_id: string,
        feature_name: keyof ICampusFeatures["features"]
    ): Promise<boolean> {
        try {
            const features = await this.getCampusFeatures(campus_id);
            
            // If no features record exists, assume all features are enabled (backward compatibility)
            if (!features) {
                return true;
            }

            return features.features[feature_name] ?? true;
        } catch {
            // On error, default to enabled for backward compatibility
            return true;
        }
    }

    /**
     * Get all campuses with their feature configurations
     */
    static async getAllCampusFeatures(): Promise<ICampusFeatures[]> {
        try {
            const result = await CampusFeatures.find({});
            // Ottoman returns {rows: [...]} structure
            return result.rows || [];
        } catch (error) {
            throw new Error(`Failed to fetch all campus features: ${error}`);
        }
    }

    /**
     * Bulk update features for multiple campuses
     */
    static async bulkUpdateFeatures(
        campus_ids: string[],
        features: Partial<ICampusFeatures["features"]>,
        updated_by: string
    ): Promise<ICampusFeatures[]> {
        try {
            const results: ICampusFeatures[] = [];

            for (const campus_id of campus_ids) {
                const updated = await this.updateCampusFeatures(
                    campus_id,
                    features,
                    updated_by
                );
                results.push(updated);
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to bulk update campus features: ${error}`);
        }
    }

    /**
     * Reset all features to default (all enabled) for a campus
     */
    static async resetToDefaults(
        campus_id: string,
        updated_by: string
    ): Promise<ICampusFeatures> {
        return this.updateCampusFeatures(
            campus_id,
            {
                chat: true,
                meetings: true,
                payments: true,
                curriculum: true,
                subject_materials: true,
                student_parent_access: true,
            },
            updated_by
        );
    }
}
