export function getCdnEndpoint(apiKey, apiVersion, loaderVersion) {
    return `https://fpcdn.io/${apiVersion}/${apiKey}/loader_${loaderVersion}.js?ii=fingerprintjs-cloudflare/${INT_VERSION}/procdn`
}

export function getVisitorIdEndpoint(region) {
    const prefix = region === 'us' ? '' : `${region}.`;  
    return `https://${prefix}api.fpjs.io?ii=fingerprintjs-cloudflare/${INT_VERSION}/ingress`;
}

export const INT_VERSION = '1.0.0-beta';

//TODO use worker settings
export const API_VERSION = 'v3'
export const LOADER_VERSION = 'v3.6.0-beta.0';
