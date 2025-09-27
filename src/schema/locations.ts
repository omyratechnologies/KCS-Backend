import z from "zod";

import "zod-openapi/extend";

// Country Schema
export const countrySchema = z
    .object({
        id: z.number().openapi({ example: 1 }),
        name: z.string().openapi({ example: "Afghanistan" }),
        iso3: z.string().optional().openapi({ example: "AFG" }),
        iso2: z.string().optional().openapi({ example: "AF" }),
        phone_code: z.string().optional().openapi({ example: "93" }),
        capital: z.string().optional().openapi({ example: "Kabul" }),
        currency: z.string().optional().openapi({ example: "AFN" }),
        currency_symbol: z.string().optional().openapi({ example: "؋" }),
        tld: z.string().optional().openapi({ example: ".af" }),
        native: z.string().optional().openapi({ example: "افغانستان" }),
        region: z.string().optional().openapi({ example: "Asia" }),
        subregion: z.string().optional().openapi({ example: "Southern Asia" }),
        latitude: z.string().openapi({ example: "33.00000000" }),
        longitude: z.string().openapi({ example: "65.00000000" }),
        emoji: z.string().optional().openapi({ example: "🇦🇫" }),
        emojiU: z.string().optional().openapi({ example: "U+1F1E6 U+1F1EB" }),
    })
    .openapi({ ref: "Country" });

// State Schema
export const stateSchema = z
    .object({
        id: z.number().openapi({ example: 3901 }),
        name: z.string().openapi({ example: "Badakhshan" }),
        state_code: z.string().optional().openapi({ example: "BDS" }),
        latitude: z.string().openapi({ example: "36.73477250" }),
        longitude: z.string().openapi({ example: "70.81199530" }),
    })
    .openapi({ ref: "State" });

// City Schema
export const citySchema = z
    .object({
        id: z.number().openapi({ example: 52 }),
        name: z.string().openapi({ example: "Ashkāsham" }),
        latitude: z.string().openapi({ example: "36.68333000" }),
        longitude: z.string().openapi({ example: "71.53333000" }),
    })
    .openapi({ ref: "City" });

// Response Schemas
export const countriesResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.array(countrySchema),
        total: z.number().openapi({ example: 195 }),
    })
    .openapi({ ref: "CountriesResponse" });

export const statesResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.array(stateSchema),
        total: z.number().openapi({ example: 34 }),
        countryId: z.number().openapi({ example: 1 }),
    })
    .openapi({ ref: "StatesResponse" });

export const citiesResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.array(citySchema),
        total: z.number().openapi({ example: 6 }),
        stateId: z.number().openapi({ example: 3901 }),
    })
    .openapi({ ref: "CitiesResponse" });

// Parameter Schemas
export const countryIdParamSchema = z
    .object({
        countryId: z.string().transform((val) => parseInt(val)).pipe(z.number().positive()),
    })
    .openapi({ ref: "CountryIdParam" });

export const stateIdParamSchema = z
    .object({
        stateId: z.string().transform((val) => parseInt(val)).pipe(z.number().positive()),
    })
    .openapi({ ref: "StateIdParam" });

// Error Response Schema
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "Country with ID 999 not found" }),
    })
    .openapi({ ref: "ErrorResponse" });