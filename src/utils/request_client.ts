import fetch, { Headers, RequestInit } from "node-fetch";

/**
 * Make a request to the given url with the given options
 * @param url URL to make the request to
 * @param options Options to pass to the fetch function
 * @returns The response from the request
 */
export const request = async (url: string, options: RequestInit): Promise<unknown> => {
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw new TypeError(error.message);
        }
    }
};

/**
 * Make a request to the given url with the given options and return the response and headers
 * @param url URL to make the request to
 * @param options Options to pass to the fetch function
 * @returns The response and headers from the request
 */
export const requestWithResponseHeader = async (
    url: string,
    options: RequestInit
): Promise<{
    response: unknown;
    headers: Headers;
}> => {
    try {
        const response = await fetch(url, options);
        return {
            response: await response.json(),
            headers: response.headers,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new TypeError(error.message);
        }
        return {
            response: " ",
            headers: new Headers(),
        };
    }
};
