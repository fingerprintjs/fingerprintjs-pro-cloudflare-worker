export function getCdnEndpoint(path) {
    const url = new URL(path);
    const apiKey = url.searchParams.get('apiKey');
    if (!apiKey) {
        throw new Error('apiKey is expected in query parameters.');
    }
    const apiVersion = url.searchParams.get('apiVersion') ?? API_VERSION;
    return `https://fpcdn.io/${apiVersion}/${apiKey}?ii=fingerprintjs-cloudflare/${INT_VERSION}/procdn`;
}

export function getCdnForNpmEndpoint(path) {
    const url = new URL(path);
    const apiKey = url.searchParams.get('apiKey');
    if (!apiKey) {
        throw new Error('apiKey is expected in query parameters.');
    }
    const apiVersion = url.searchParams.get('v');
    if (!apiVersion) {
        throw new Error('v is expected in query parameters.')
    }    

    const loaderVersion = url.searchParams.get('lv');
    if (!loaderVersion) {
        throw new Error('lv is expected in query parameters.')
    }
    return `https://fpcdn.io/v${apiVersion}/${apiKey}/loader_v${loaderVersion}.js?ii=fingerprintjs-cloudflare/${INT_VERSION}/procdn`;    
}

export function getVisitorIdEndpoint(region) {
    const prefix = region === 'us' ? '' : `${region}.`;
    return `https://${prefix}api.fpjs.io?ii=fingerprintjs-cloudflare/${INT_VERSION}/ingress`;
}

export const INT_VERSION = '1.0.0-beta';

const API_VERSION = 'v3'
const LOADER_VERSION = 'v3.6.0-beta.0';
