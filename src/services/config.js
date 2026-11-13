// Vite only exposes variables prefixed with VITE_. These end up in the client
// bundle (there is no backend), so only use free-tier keys restricted to this app.
const env = import.meta.env || {};

export const OPENWEATHER_KEY = (env.VITE_OPENWEATHER_API_KEY || '').trim();
export const RAPIDAPI_KEY = (env.VITE_RAPIDAPI_KEY || '').trim();
export const RAPIDAPI_HOST = (env.VITE_RAPIDAPI_HOST || 'wft-geo-db.p.rapidapi.com').trim();
