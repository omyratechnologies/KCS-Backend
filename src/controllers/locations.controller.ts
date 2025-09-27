import { Context } from "hono";
import { LocationsService } from "@/services/locations.service";

export class LocationsController {
    /**
     * Get all countries
     */
    public static readonly getCountries = async (c: Context) => {
        try {
            const countries = LocationsService.getCountries();
            
            return c.json({
                success: true,
                data: countries,
                total: countries.length
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    400
                );
            }
            
            return c.json(
                {
                    success: false,
                    message: "Internal server error",
                },
                500
            );
        }
    };

    /**
     * Get states for a specific country
     */
    public static readonly getStatesByCountry = async (c: Context) => {
        try {
            const countryId = parseInt(c.req.param("countryId"));
            
            if (isNaN(countryId)) {
                return c.json(
                    {
                        success: false,
                        message: "Invalid country ID provided",
                    },
                    400
                );
            }

            const states = LocationsService.getStatesByCountry(countryId);
            
            return c.json({
                success: true,
                data: states,
                total: states.length,
                countryId
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    404
                );
            }
            
            return c.json(
                {
                    success: false,
                    message: "Internal server error",
                },
                500
            );
        }
    };

    /**
     * Get cities for a specific state
     */
    public static readonly getCitiesByState = async (c: Context) => {
        try {
            const stateId = parseInt(c.req.param("stateId"));
            
            if (isNaN(stateId)) {
                return c.json(
                    {
                        success: false,
                        message: "Invalid state ID provided",
                    },
                    400
                );
            }

            const cities = LocationsService.getCitiesByState(stateId);
            
            return c.json({
                success: true,
                data: cities,
                total: cities.length,
                stateId
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    404
                );
            }
            
            return c.json(
                {
                    success: false,
                    message: "Internal server error",
                },
                500
            );
        }
    };
}