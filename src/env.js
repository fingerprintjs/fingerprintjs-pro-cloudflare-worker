export function getCdnEndpoint(apiKey, apiVersion, loaderVersion) {
    return `https://fpcdn.io/${apiVersion}/${apiKey}/loader_${loaderVersion}.js`
}

//TODO use worker settings
export const API_VERSION = 'v3'
export const LOADER_VERSION = 'v3.6.0-beta.0';
