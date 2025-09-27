import locationsData from "@/utils/locations.json";

interface Location {
    id: number;
    name: string;
    iso3?: string;
    iso2?: string;
    phone_code?: string;
    capital?: string;
    currency?: string;
    currency_symbol?: string;
    tld?: string;
    native?: string;
    region?: string;
    subregion?: string;
    latitude: string;
    longitude: string;
    emoji?: string;
    emojiU?: string;
    states?: State[];
}

interface State {
    id: number;
    name: string;
    state_code?: string;
    latitude: string;
    longitude: string;
    cities?: City[];
}

interface City {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
}

// Cast the imported data to the correct type
const locations = locationsData as Location[];

export class LocationsService {
    /**
     * Get all countries
     */
    public static getCountries(): Omit<Location, 'states'>[] {
        return locations.map(({ states: _states, ...country }) => country);
    }

    /**
     * Get states for a specific country
     */
    public static getStatesByCountry(countryId: number): State[] {
        const country = locations.find(c => c.id === countryId);
        
        if (!country) {
            throw new Error(`Country with ID ${countryId} not found`);
        }

        if (!country.states || country.states.length === 0) {
            return [];
        }

        return country.states.map(({ cities: _cities, ...state }) => state);
    }

    /**
     * Get cities for a specific state
     */
    public static getCitiesByState(stateId: number): City[] {
        for (const country of locations) {
            if (country.states) {
                const state = country.states.find(s => s.id === stateId);
                if (state) {
                    return state.cities || [];
                }
            }
        }
        
        throw new Error(`State with ID ${stateId} not found`);
    }

    /**
     * Get a specific country by ID (helper method)
     */
    public static getCountryById(countryId: number): Location | null {
        return locations.find(c => c.id === countryId) || null;
    }

    /**
     * Get a specific state by ID (helper method)
     */
    public static getStateById(stateId: number): { state: State; countryId: number } | null {
        for (const country of locations) {
            if (country.states) {
                const state = country.states.find(s => s.id === stateId);
                if (state) {
                    return { state, countryId: country.id };
                }
            }
        }
        return null;
    }
}