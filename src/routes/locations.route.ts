import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

import { LocationsController } from "@/controllers/locations.controller";
import {
    citiesResponseSchema,
    countriesResponseSchema,
    errorResponseSchema,
    statesResponseSchema,
} from "@/schema/locations";

const app = new Hono();

// GET /locations/countries - Get all countries
app.get(
    "/countries",
    describeRoute({
        operationId: "getCountries",
        summary: "Get all countries",
        description: "Retrieve a list of all available countries with their details",
        tags: ["Locations"],
        responses: {
            200: {
                description: "List of countries retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(countriesResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    LocationsController.getCountries
);

// GET /locations/states/:countryId - Get states for a specific country
app.get(
    "/states/:countryId",
    describeRoute({
        operationId: "getStatesByCountry",
        summary: "Get states by country",
        description: "Retrieve all states/provinces for a specific country",
        tags: ["Locations"],
        parameters: [
            {
                name: "countryId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Country ID",
            },
        ],
        responses: {
            200: {
                description: "List of states retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(statesResponseSchema),
                    },
                },
            },
            400: {
                description: "Invalid country ID provided",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            404: {
                description: "Country not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    LocationsController.getStatesByCountry
);

// GET /locations/cities/:stateId - Get cities for a specific state
app.get(
    "/cities/:stateId",
    describeRoute({
        operationId: "getCitiesByState",
        summary: "Get cities by state",
        description: "Retrieve all cities for a specific state/province",
        tags: ["Locations"],
        parameters: [
            {
                name: "stateId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "State ID",
            },
        ],
        responses: {
            200: {
                description: "List of cities retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(citiesResponseSchema),
                    },
                },
            },
            400: {
                description: "Invalid state ID provided",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            404: {
                description: "State not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    LocationsController.getCitiesByState
);

export default app;