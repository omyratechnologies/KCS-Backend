import { type Context } from "hono";

import { CampusService } from "@/services/campuses.service";

export class CampusesController {
    // Create
    public static readonly createCampus = async (c: Context) => {
        try {
            const { name, address, domain, meta_data } = await c.req.json();

            const campuses = await CampusService.createCampus({
                name,
                address,
                domain,
                meta_data,
            });

            return c.json(campuses);
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // Get All
    public static readonly getCampuses = async (c: Context) => {
        try {
            const campuses = await CampusService.getCampuses();

            return c.json(campuses);
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // Get One
    public static readonly getCampus = async (c: Context) => {
        try {
            const { id } = c.req.param();

            const campuses = await CampusService.getCampus(id);

            return c.json(campuses);
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // Update
    public static readonly updateCampus = async (c: Context) => {
        try {
            const { id } = c.req.param();
            const data = await c.req.json();

            await CampusService.updateCampus(id, {
                data,
            });

            return c.json({
                message: "Campuses updated successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // Delete
    public static readonly deleteCampus = async (c: Context) => {
        try {
            const { id } = c.req.param();

            await CampusService.deleteCampus(id);

            return c.json({
                message: "Campuses deleted successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };
}
