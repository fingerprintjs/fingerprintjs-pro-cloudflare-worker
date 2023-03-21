/**
 * FingerprintJS Pro Cloudflare Worker v1.2.0 - Copyright (c) FingerprintJS, Inc, 2023 (https://fingerprint.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

const Defaults = {
    AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
    GET_RESULT_PATH: 'getResult',
    PROXY_SECRET: null,
};
function getVarOrDefault(variable, defaults) {
    return function (env) {
        return (env[variable] || defaults[variable]);
    };
}
function isVarSet(variable) {
    return function (env) {
        return env[variable] != null;
    };
}
const agentScriptDownloadPathVarName = 'AGENT_SCRIPT_DOWNLOAD_PATH';
const getAgentPathVar = getVarOrDefault(agentScriptDownloadPathVarName, Defaults);
const isScriptDownloadPathSet = isVarSet(agentScriptDownloadPathVarName);
function getScriptDownloadPath(env) {
    const agentPathVar = getAgentPathVar(env);
    return `/${agentPathVar}`;
}
const getResultPathVarName = 'GET_RESULT_PATH';
const getGetResultPathVar = getVarOrDefault(getResultPathVarName, Defaults);
const isGetResultPathSet = isVarSet(getResultPathVarName);
function getGetResultPath(env) {
    const getResultPathVar = getGetResultPathVar(env);
    return `/${getResultPathVar}`;
}
const proxySecretVarName = 'PROXY_SECRET';
const getProxySecretVar = getVarOrDefault(proxySecretVarName, Defaults);
const isProxySecretSet = isVarSet(proxySecretVarName);
function getProxySecret(env) {
    return getProxySecretVar(env);
}
function getStatusPagePath() {
    return `/status`;
}

function setDirective(directives, directive, maxMaxAge) {
    const directiveIndex = directives.findIndex((directivePair) => directivePair.split('=')[0].trim().toLowerCase() === directive);
    if (directiveIndex === -1) {
        directives.push(`${directive}=${maxMaxAge}`);
    }
    else {
        const oldValue = Number(directives[directiveIndex].split('=')[1]);
        const newValue = Math.min(maxMaxAge, oldValue);
        directives[directiveIndex] = `${directive}=${newValue}`;
    }
}
function getCacheControlHeaderWithMaxAgeIfLower(cacheControlHeaderValue, maxMaxAge, maxSMaxAge) {
    const cacheControlDirectives = cacheControlHeaderValue.split(', ');
    setDirective(cacheControlDirectives, 'max-age', maxMaxAge);
    setDirective(cacheControlDirectives, 's-maxage', maxSMaxAge);
    return cacheControlDirectives.join(', ');
}

function errorToString(error) {
    try {
        return typeof error === 'string' ? error : error instanceof Error ? error.message : String(error);
    }
    catch (e) {
        return 'unknown';
    }
}
function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
function generateRequestUniqueId() {
    return generateRandomString(6);
}
function generateRequestId() {
    const uniqueId = generateRequestUniqueId();
    const now = new Date().getTime();
    return `${now}.${uniqueId}`;
}
function createErrorResponseForIngress(request, error) {
    const reason = errorToString(error);
    const errorBody = {
        code: 'IntegrationFailed',
        message: `An error occurred with Cloudflare worker. Reason: ${reason}`,
    };
    const responseBody = {
        v: '2',
        error: errorBody,
        requestId: generateRequestId(),
        products: {},
    };
    const requestOrigin = request.headers.get('origin') || '';
    const responseHeaders = {
        'Access-Control-Allow-Origin': requestOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'content-type': 'application/json',
    };
    return new Response(JSON.stringify(responseBody), { status: 500, headers: responseHeaders });
}
function createErrorResponseForProCDN(error) {
    const responseBody = { error: errorToString(error) };
    return new Response(JSON.stringify(responseBody), { status: 500, headers: { 'content-type': 'application/json' } });
}

async function fetchCacheable(request, ttl) {
    return fetch(request, { cf: { cacheTtl: ttl } });
}

const INT_VERSION = '1.2.0';
const PARAM_NAME = 'ii';
function getTrafficMonitoringValue(type) {
    return `fingerprintjs-pro-cloudflare/${INT_VERSION}/${type}`;
}
function addTrafficMonitoringSearchParamsForProCDN(url) {
    url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue('procdn'));
}
function addTrafficMonitoringSearchParamsForVisitorIdRequest(url) {
    url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue('ingress'));
}

function returnHttpResponse(oldResponse) {
    oldResponse.headers.delete('Strict-Transport-Security');
    return oldResponse;
}

function addProxyIntegrationHeaders(headers, env) {
    const proxySecret = getProxySecret(env);
    if (proxySecret) {
        headers.set('FPJS-Proxy-Secret', proxySecret);
        headers.set('FPJS-Proxy-Client-IP', headers.get('CF-Connecting-IP') || '');
    }
}

var domainSuffixListReversed = [
	{
		suffix: "!city.kawasaki.jp",
		reversed: "pj.ikasawak.ytic"
	},
	{
		suffix: "!city.kitakyushu.jp",
		reversed: "pj.uhsuykatik.ytic"
	},
	{
		suffix: "!city.kobe.jp",
		reversed: "pj.ebok.ytic"
	},
	{
		suffix: "!city.nagoya.jp",
		reversed: "pj.ayogan.ytic"
	},
	{
		suffix: "!city.sapporo.jp",
		reversed: "pj.oroppas.ytic"
	},
	{
		suffix: "!city.sendai.jp",
		reversed: "pj.iadnes.ytic"
	},
	{
		suffix: "!city.yokohama.jp",
		reversed: "pj.amahokoy.ytic"
	},
	{
		suffix: "!www.ck",
		reversed: "kc.www"
	},
	{
		suffix: "*.0emm.com",
		reversed: "moc.mme0"
	},
	{
		suffix: "*.advisor.ws",
		reversed: "sw.rosivda"
	},
	{
		suffix: "*.alces.network",
		reversed: "krowten.secla"
	},
	{
		suffix: "*.awdev.ca",
		reversed: "ac.vedwa"
	},
	{
		suffix: "*.azurecontainer.io",
		reversed: "oi.reniatnoceruza"
	},
	{
		suffix: "*.backyards.banzaicloud.io",
		reversed: "oi.duolciaznab.sdraykcab"
	},
	{
		suffix: "*.banzai.cloud",
		reversed: "duolc.iaznab"
	},
	{
		suffix: "*.bd",
		reversed: "db"
	},
	{
		suffix: "*.beget.app",
		reversed: "ppa.tegeb"
	},
	{
		suffix: "*.build.run",
		reversed: "nur.dliub"
	},
	{
		suffix: "*.builder.code.com",
		reversed: "moc.edoc.redliub"
	},
	{
		suffix: "*.bzz.dapps.earth",
		reversed: "htrae.sppad.zzb"
	},
	{
		suffix: "*.ck",
		reversed: "kc"
	},
	{
		suffix: "*.cloud.metacentrum.cz",
		reversed: "zc.murtnecatem.duolc"
	},
	{
		suffix: "*.cloudera.site",
		reversed: "etis.areduolc"
	},
	{
		suffix: "*.cns.joyent.com",
		reversed: "moc.tneyoj.snc"
	},
	{
		suffix: "*.code.run",
		reversed: "nur.edoc"
	},
	{
		suffix: "*.compute-1.amazonaws.com",
		reversed: "moc.swanozama.1-etupmoc"
	},
	{
		suffix: "*.compute.amazonaws.com",
		reversed: "moc.swanozama.etupmoc"
	},
	{
		suffix: "*.compute.amazonaws.com.cn",
		reversed: "nc.moc.swanozama.etupmoc"
	},
	{
		suffix: "*.compute.estate",
		reversed: "etatse.etupmoc"
	},
	{
		suffix: "*.cryptonomic.net",
		reversed: "ten.cimonotpyrc"
	},
	{
		suffix: "*.customer-oci.com",
		reversed: "moc.ico-remotsuc"
	},
	{
		suffix: "*.dapps.earth",
		reversed: "htrae.sppad"
	},
	{
		suffix: "*.database.run",
		reversed: "nur.esabatad"
	},
	{
		suffix: "*.dev-builder.code.com",
		reversed: "moc.edoc.redliub-ved"
	},
	{
		suffix: "*.dev.adobeaemcloud.com",
		reversed: "moc.duolcmeaeboda.ved"
	},
	{
		suffix: "*.devcdnaccesso.com",
		reversed: "moc.osseccandcved"
	},
	{
		suffix: "*.developer.app",
		reversed: "ppa.repoleved"
	},
	{
		suffix: "*.digitaloceanspaces.com",
		reversed: "moc.secapsnaecolatigid"
	},
	{
		suffix: "*.diher.solutions",
		reversed: "snoitulos.rehid"
	},
	{
		suffix: "*.dweb.link",
		reversed: "knil.bewd"
	},
	{
		suffix: "*.elb.amazonaws.com",
		reversed: "moc.swanozama.ble"
	},
	{
		suffix: "*.elb.amazonaws.com.cn",
		reversed: "nc.moc.swanozama.ble"
	},
	{
		suffix: "*.er",
		reversed: "re"
	},
	{
		suffix: "*.ex.futurecms.at",
		reversed: "ta.smcerutuf.xe"
	},
	{
		suffix: "*.ex.ortsinfo.at",
		reversed: "ta.ofnistro.xe"
	},
	{
		suffix: "*.firenet.ch",
		reversed: "hc.tenerif"
	},
	{
		suffix: "*.fk",
		reversed: "kf"
	},
	{
		suffix: "*.frusky.de",
		reversed: "ed.yksurf"
	},
	{
		suffix: "*.futurecms.at",
		reversed: "ta.smcerutuf"
	},
	{
		suffix: "*.gateway.dev",
		reversed: "ved.yawetag"
	},
	{
		suffix: "*.hosting.myjino.ru",
		reversed: "ur.onijym.gnitsoh"
	},
	{
		suffix: "*.hosting.ovh.net",
		reversed: "ten.hvo.gnitsoh"
	},
	{
		suffix: "*.in.futurecms.at",
		reversed: "ta.smcerutuf.ni"
	},
	{
		suffix: "*.jm",
		reversed: "mj"
	},
	{
		suffix: "*.kawasaki.jp",
		reversed: "pj.ikasawak"
	},
	{
		suffix: "*.kh",
		reversed: "hk"
	},
	{
		suffix: "*.kitakyushu.jp",
		reversed: "pj.uhsuykatik"
	},
	{
		suffix: "*.kobe.jp",
		reversed: "pj.ebok"
	},
	{
		suffix: "*.kunden.ortsinfo.at",
		reversed: "ta.ofnistro.nednuk"
	},
	{
		suffix: "*.landing.myjino.ru",
		reversed: "ur.onijym.gnidnal"
	},
	{
		suffix: "*.lcl.dev",
		reversed: "ved.lcl"
	},
	{
		suffix: "*.lclstage.dev",
		reversed: "ved.egatslcl"
	},
	{
		suffix: "*.linodeobjects.com",
		reversed: "moc.stcejboedonil"
	},
	{
		suffix: "*.magentosite.cloud",
		reversed: "duolc.etisotnegam"
	},
	{
		suffix: "*.migration.run",
		reversed: "nur.noitargim"
	},
	{
		suffix: "*.mm",
		reversed: "mm"
	},
	{
		suffix: "*.moonscale.io",
		reversed: "oi.elacsnoom"
	},
	{
		suffix: "*.nagoya.jp",
		reversed: "pj.ayogan"
	},
	{
		suffix: "*.nodebalancer.linode.com",
		reversed: "moc.edonil.recnalabedon"
	},
	{
		suffix: "*.nom.br",
		reversed: "rb.mon"
	},
	{
		suffix: "*.northflank.app",
		reversed: "ppa.knalfhtron"
	},
	{
		suffix: "*.np",
		reversed: "pn"
	},
	{
		suffix: "*.oci.customer-oci.com",
		reversed: "moc.ico-remotsuc.ico"
	},
	{
		suffix: "*.ocp.customer-oci.com",
		reversed: "moc.ico-remotsuc.pco"
	},
	{
		suffix: "*.ocs.customer-oci.com",
		reversed: "moc.ico-remotsuc.sco"
	},
	{
		suffix: "*.on-acorn.io",
		reversed: "oi.nroca-no"
	},
	{
		suffix: "*.on-k3s.io",
		reversed: "oi.s3k-no"
	},
	{
		suffix: "*.on-rancher.cloud",
		reversed: "duolc.rehcnar-no"
	},
	{
		suffix: "*.on-rio.io",
		reversed: "oi.oir-no"
	},
	{
		suffix: "*.otap.co",
		reversed: "oc.pato"
	},
	{
		suffix: "*.owo.codes",
		reversed: "sedoc.owo"
	},
	{
		suffix: "*.paywhirl.com",
		reversed: "moc.lrihwyap"
	},
	{
		suffix: "*.pg",
		reversed: "gp"
	},
	{
		suffix: "*.platformsh.site",
		reversed: "etis.hsmroftalp"
	},
	{
		suffix: "*.quipelements.com",
		reversed: "moc.stnemelepiuq"
	},
	{
		suffix: "*.r.appspot.com",
		reversed: "moc.topsppa.r"
	},
	{
		suffix: "*.rss.my.id",
		reversed: "di.ym.ssr"
	},
	{
		suffix: "*.s5y.io",
		reversed: "oi.y5s"
	},
	{
		suffix: "*.sapporo.jp",
		reversed: "pj.oroppas"
	},
	{
		suffix: "*.sch.uk",
		reversed: "ku.hcs"
	},
	{
		suffix: "*.sendai.jp",
		reversed: "pj.iadnes"
	},
	{
		suffix: "*.sensiosite.cloud",
		reversed: "duolc.etisoisnes"
	},
	{
		suffix: "*.spectrum.myjino.ru",
		reversed: "ur.onijym.murtceps"
	},
	{
		suffix: "*.statics.cloud",
		reversed: "duolc.scitats"
	},
	{
		suffix: "*.stg-builder.code.com",
		reversed: "moc.edoc.redliub-gts"
	},
	{
		suffix: "*.stg.dev",
		reversed: "ved.gts"
	},
	{
		suffix: "*.stgstage.dev",
		reversed: "ved.egatsgts"
	},
	{
		suffix: "*.stolos.io",
		reversed: "oi.solots"
	},
	{
		suffix: "*.svc.firenet.ch",
		reversed: "hc.tenerif.cvs"
	},
	{
		suffix: "*.sys.qcx.io",
		reversed: "oi.xcq.sys"
	},
	{
		suffix: "*.telebit.xyz",
		reversed: "zyx.tibelet"
	},
	{
		suffix: "*.transurl.be",
		reversed: "eb.lrusnart"
	},
	{
		suffix: "*.transurl.eu",
		reversed: "ue.lrusnart"
	},
	{
		suffix: "*.transurl.nl",
		reversed: "ln.lrusnart"
	},
	{
		suffix: "*.triton.zone",
		reversed: "enoz.notirt"
	},
	{
		suffix: "*.tst.site",
		reversed: "etis.tst"
	},
	{
		suffix: "*.uberspace.de",
		reversed: "ed.ecapsrebu"
	},
	{
		suffix: "*.user.fm",
		reversed: "mf.resu"
	},
	{
		suffix: "*.user.localcert.dev",
		reversed: "ved.treclacol.resu"
	},
	{
		suffix: "*.usercontent.goog",
		reversed: "goog.tnetnocresu"
	},
	{
		suffix: "*.vps.myjino.ru",
		reversed: "ur.onijym.spv"
	},
	{
		suffix: "*.vultrobjects.com",
		reversed: "moc.stcejbortluv"
	},
	{
		suffix: "*.webhare.dev",
		reversed: "ved.erahbew"
	},
	{
		suffix: "*.webpaas.ovh.net",
		reversed: "ten.hvo.saapbew"
	},
	{
		suffix: "*.yokohama.jp",
		reversed: "pj.amahokoy"
	},
	{
		suffix: "0.bg",
		reversed: "gb.0"
	},
	{
		suffix: "001www.com",
		reversed: "moc.www100"
	},
	{
		suffix: "0e.vc",
		reversed: "cv.e0"
	},
	{
		suffix: "1.azurestaticapps.net",
		reversed: "ten.sppacitatseruza.1"
	},
	{
		suffix: "1.bg",
		reversed: "gb.1"
	},
	{
		suffix: "123hjemmeside.dk",
		reversed: "kd.edisemmejh321"
	},
	{
		suffix: "123hjemmeside.no",
		reversed: "on.edisemmejh321"
	},
	{
		suffix: "123homepage.it",
		reversed: "ti.egapemoh321"
	},
	{
		suffix: "123kotisivu.fi",
		reversed: "if.uvisitok321"
	},
	{
		suffix: "123minsida.se",
		reversed: "es.adisnim321"
	},
	{
		suffix: "123miweb.es",
		reversed: "se.bewim321"
	},
	{
		suffix: "123paginaweb.pt",
		reversed: "tp.bewanigap321"
	},
	{
		suffix: "123sait.ru",
		reversed: "ur.tias321"
	},
	{
		suffix: "123siteweb.fr",
		reversed: "rf.bewetis321"
	},
	{
		suffix: "123webseite.at",
		reversed: "ta.etiesbew321"
	},
	{
		suffix: "123webseite.de",
		reversed: "ed.etiesbew321"
	},
	{
		suffix: "123website.be",
		reversed: "eb.etisbew321"
	},
	{
		suffix: "123website.ch",
		reversed: "hc.etisbew321"
	},
	{
		suffix: "123website.lu",
		reversed: "ul.etisbew321"
	},
	{
		suffix: "123website.nl",
		reversed: "ln.etisbew321"
	},
	{
		suffix: "12hp.at",
		reversed: "ta.ph21"
	},
	{
		suffix: "12hp.ch",
		reversed: "hc.ph21"
	},
	{
		suffix: "12hp.de",
		reversed: "ed.ph21"
	},
	{
		suffix: "1337.pictures",
		reversed: "serutcip.7331"
	},
	{
		suffix: "16-b.it",
		reversed: "ti.b-61"
	},
	{
		suffix: "1kapp.com",
		reversed: "moc.ppak1"
	},
	{
		suffix: "2.azurestaticapps.net",
		reversed: "ten.sppacitatseruza.2"
	},
	{
		suffix: "2.bg",
		reversed: "gb.2"
	},
	{
		suffix: "2000.hu",
		reversed: "uh.0002"
	},
	{
		suffix: "2038.io",
		reversed: "oi.8302"
	},
	{
		suffix: "2ix.at",
		reversed: "ta.xi2"
	},
	{
		suffix: "2ix.ch",
		reversed: "hc.xi2"
	},
	{
		suffix: "2ix.de",
		reversed: "ed.xi2"
	},
	{
		suffix: "3.bg",
		reversed: "gb.3"
	},
	{
		suffix: "32-b.it",
		reversed: "ti.b-23"
	},
	{
		suffix: "3utilities.com",
		reversed: "moc.seitilitu3"
	},
	{
		suffix: "4.bg",
		reversed: "gb.4"
	},
	{
		suffix: "4lima.at",
		reversed: "ta.amil4"
	},
	{
		suffix: "4lima.ch",
		reversed: "hc.amil4"
	},
	{
		suffix: "4lima.de",
		reversed: "ed.amil4"
	},
	{
		suffix: "4u.com",
		reversed: "moc.u4"
	},
	{
		suffix: "5.bg",
		reversed: "gb.5"
	},
	{
		suffix: "5g.in",
		reversed: "ni.g5"
	},
	{
		suffix: "6.bg",
		reversed: "gb.6"
	},
	{
		suffix: "611.to",
		reversed: "ot.116"
	},
	{
		suffix: "64-b.it",
		reversed: "ti.b-46"
	},
	{
		suffix: "6g.in",
		reversed: "ni.g6"
	},
	{
		suffix: "7.bg",
		reversed: "gb.7"
	},
	{
		suffix: "8.bg",
		reversed: "gb.8"
	},
	{
		suffix: "9.bg",
		reversed: "gb.9"
	},
	{
		suffix: "9guacu.br",
		reversed: "rb.ucaug9"
	},
	{
		suffix: "a.bg",
		reversed: "gb.a"
	},
	{
		suffix: "a.prod.fastly.net",
		reversed: "ten.yltsaf.dorp.a"
	},
	{
		suffix: "a.run.app",
		reversed: "ppa.nur.a"
	},
	{
		suffix: "a.se",
		reversed: "es.a"
	},
	{
		suffix: "a.ssl.fastly.net",
		reversed: "ten.yltsaf.lss.a"
	},
	{
		suffix: "aa.no",
		reversed: "on.aa"
	},
	{
		suffix: "aaa",
		reversed: "aaa"
	},
	{
		suffix: "aaa.pro",
		reversed: "orp.aaa"
	},
	{
		suffix: "aarborte.no",
		reversed: "on.etrobraa"
	},
	{
		suffix: "aarp",
		reversed: "praa"
	},
	{
		suffix: "ab.ca",
		reversed: "ac.ba"
	},
	{
		suffix: "abarth",
		reversed: "htraba"
	},
	{
		suffix: "abashiri.hokkaido.jp",
		reversed: "pj.odiakkoh.irihsaba"
	},
	{
		suffix: "abb",
		reversed: "bba"
	},
	{
		suffix: "abbott",
		reversed: "ttobba"
	},
	{
		suffix: "abbvie",
		reversed: "eivbba"
	},
	{
		suffix: "abc",
		reversed: "cba"
	},
	{
		suffix: "abc.br",
		reversed: "rb.cba"
	},
	{
		suffix: "abeno.osaka.jp",
		reversed: "pj.akaso.oneba"
	},
	{
		suffix: "abiko.chiba.jp",
		reversed: "pj.abihc.okiba"
	},
	{
		suffix: "abira.hokkaido.jp",
		reversed: "pj.odiakkoh.ariba"
	},
	{
		suffix: "abkhazia.su",
		reversed: "us.aizahkba"
	},
	{
		suffix: "able",
		reversed: "elba"
	},
	{
		suffix: "abo.pa",
		reversed: "ap.oba"
	},
	{
		suffix: "abogado",
		reversed: "odagoba"
	},
	{
		suffix: "abr.it",
		reversed: "ti.rba"
	},
	{
		suffix: "abruzzo.it",
		reversed: "ti.ozzurba"
	},
	{
		suffix: "abu.yamaguchi.jp",
		reversed: "pj.ihcugamay.uba"
	},
	{
		suffix: "abudhabi",
		reversed: "ibahduba"
	},
	{
		suffix: "ac",
		reversed: "ca"
	},
	{
		suffix: "ac.ae",
		reversed: "ea.ca"
	},
	{
		suffix: "ac.at",
		reversed: "ta.ca"
	},
	{
		suffix: "ac.be",
		reversed: "eb.ca"
	},
	{
		suffix: "ac.ci",
		reversed: "ic.ca"
	},
	{
		suffix: "ac.cn",
		reversed: "nc.ca"
	},
	{
		suffix: "ac.cr",
		reversed: "rc.ca"
	},
	{
		suffix: "ac.cy",
		reversed: "yc.ca"
	},
	{
		suffix: "ac.fj",
		reversed: "jf.ca"
	},
	{
		suffix: "ac.gn",
		reversed: "ng.ca"
	},
	{
		suffix: "ac.gov.br",
		reversed: "rb.vog.ca"
	},
	{
		suffix: "ac.id",
		reversed: "di.ca"
	},
	{
		suffix: "ac.il",
		reversed: "li.ca"
	},
	{
		suffix: "ac.im",
		reversed: "mi.ca"
	},
	{
		suffix: "ac.in",
		reversed: "ni.ca"
	},
	{
		suffix: "ac.ir",
		reversed: "ri.ca"
	},
	{
		suffix: "ac.jp",
		reversed: "pj.ca"
	},
	{
		suffix: "ac.ke",
		reversed: "ek.ca"
	},
	{
		suffix: "ac.kr",
		reversed: "rk.ca"
	},
	{
		suffix: "ac.leg.br",
		reversed: "rb.gel.ca"
	},
	{
		suffix: "ac.lk",
		reversed: "kl.ca"
	},
	{
		suffix: "ac.ls",
		reversed: "sl.ca"
	},
	{
		suffix: "ac.ma",
		reversed: "am.ca"
	},
	{
		suffix: "ac.me",
		reversed: "em.ca"
	},
	{
		suffix: "ac.mu",
		reversed: "um.ca"
	},
	{
		suffix: "ac.mw",
		reversed: "wm.ca"
	},
	{
		suffix: "ac.mz",
		reversed: "zm.ca"
	},
	{
		suffix: "ac.ni",
		reversed: "in.ca"
	},
	{
		suffix: "ac.nz",
		reversed: "zn.ca"
	},
	{
		suffix: "ac.pa",
		reversed: "ap.ca"
	},
	{
		suffix: "ac.pr",
		reversed: "rp.ca"
	},
	{
		suffix: "ac.rs",
		reversed: "sr.ca"
	},
	{
		suffix: "ac.ru",
		reversed: "ur.ca"
	},
	{
		suffix: "ac.rw",
		reversed: "wr.ca"
	},
	{
		suffix: "ac.se",
		reversed: "es.ca"
	},
	{
		suffix: "ac.sz",
		reversed: "zs.ca"
	},
	{
		suffix: "ac.th",
		reversed: "ht.ca"
	},
	{
		suffix: "ac.tj",
		reversed: "jt.ca"
	},
	{
		suffix: "ac.tz",
		reversed: "zt.ca"
	},
	{
		suffix: "ac.ug",
		reversed: "gu.ca"
	},
	{
		suffix: "ac.uk",
		reversed: "ku.ca"
	},
	{
		suffix: "ac.vn",
		reversed: "nv.ca"
	},
	{
		suffix: "ac.za",
		reversed: "az.ca"
	},
	{
		suffix: "ac.zm",
		reversed: "mz.ca"
	},
	{
		suffix: "ac.zw",
		reversed: "wz.ca"
	},
	{
		suffix: "aca.pro",
		reversed: "orp.aca"
	},
	{
		suffix: "academia.bo",
		reversed: "ob.aimedaca"
	},
	{
		suffix: "academy",
		reversed: "ymedaca"
	},
	{
		suffix: "academy.museum",
		reversed: "muesum.ymedaca"
	},
	{
		suffix: "accenture",
		reversed: "erutnecca"
	},
	{
		suffix: "accesscam.org",
		reversed: "gro.macssecca"
	},
	{
		suffix: "accident-investigation.aero",
		reversed: "orea.noitagitsevni-tnedicca"
	},
	{
		suffix: "accident-prevention.aero",
		reversed: "orea.noitneverp-tnedicca"
	},
	{
		suffix: "accountant",
		reversed: "tnatnuocca"
	},
	{
		suffix: "accountants",
		reversed: "stnatnuocca"
	},
	{
		suffix: "acct.pro",
		reversed: "orp.tcca"
	},
	{
		suffix: "achi.nagano.jp",
		reversed: "pj.onagan.ihca"
	},
	{
		suffix: "aco",
		reversed: "oca"
	},
	{
		suffix: "act.au",
		reversed: "ua.tca"
	},
	{
		suffix: "act.edu.au",
		reversed: "ua.ude.tca"
	},
	{
		suffix: "actor",
		reversed: "rotca"
	},
	{
		suffix: "ad",
		reversed: "da"
	},
	{
		suffix: "ad.jp",
		reversed: "pj.da"
	},
	{
		suffix: "adac",
		reversed: "cada"
	},
	{
		suffix: "adachi.tokyo.jp",
		reversed: "pj.oykot.ihcada"
	},
	{
		suffix: "adimo.co.uk",
		reversed: "ku.oc.omida"
	},
	{
		suffix: "adm.br",
		reversed: "rb.mda"
	},
	{
		suffix: "adobeaemcloud.com",
		reversed: "moc.duolcmeaeboda"
	},
	{
		suffix: "adobeaemcloud.net",
		reversed: "ten.duolcmeaeboda"
	},
	{
		suffix: "ads",
		reversed: "sda"
	},
	{
		suffix: "adult",
		reversed: "tluda"
	},
	{
		suffix: "adult.ht",
		reversed: "th.tluda"
	},
	{
		suffix: "adv.br",
		reversed: "rb.vda"
	},
	{
		suffix: "adv.mz",
		reversed: "zm.vda"
	},
	{
		suffix: "adygeya.ru",
		reversed: "ur.ayegyda"
	},
	{
		suffix: "adygeya.su",
		reversed: "us.ayegyda"
	},
	{
		suffix: "ae",
		reversed: "ea"
	},
	{
		suffix: "ae.org",
		reversed: "gro.ea"
	},
	{
		suffix: "aeg",
		reversed: "gea"
	},
	{
		suffix: "aejrie.no",
		reversed: "on.eirjea"
	},
	{
		suffix: "aero",
		reversed: "orea"
	},
	{
		suffix: "aero.mv",
		reversed: "vm.orea"
	},
	{
		suffix: "aero.tt",
		reversed: "tt.orea"
	},
	{
		suffix: "aerobatic.aero",
		reversed: "orea.citaborea"
	},
	{
		suffix: "aeroclub.aero",
		reversed: "orea.bulcorea"
	},
	{
		suffix: "aerodrome.aero",
		reversed: "orea.emordorea"
	},
	{
		suffix: "aeroport.fr",
		reversed: "rf.troporea"
	},
	{
		suffix: "aetna",
		reversed: "antea"
	},
	{
		suffix: "af",
		reversed: "fa"
	},
	{
		suffix: "affinitylottery.org.uk",
		reversed: "ku.gro.yrettolytiniffa"
	},
	{
		suffix: "afjord.no",
		reversed: "on.drojfa"
	},
	{
		suffix: "afl",
		reversed: "lfa"
	},
	{
		suffix: "africa",
		reversed: "acirfa"
	},
	{
		suffix: "africa.com",
		reversed: "moc.acirfa"
	},
	{
		suffix: "ag",
		reversed: "ga"
	},
	{
		suffix: "ag.it",
		reversed: "ti.ga"
	},
	{
		suffix: "aga.niigata.jp",
		reversed: "pj.atagiin.aga"
	},
	{
		suffix: "agakhan",
		reversed: "nahkaga"
	},
	{
		suffix: "agano.niigata.jp",
		reversed: "pj.atagiin.onaga"
	},
	{
		suffix: "agdenes.no",
		reversed: "on.senedga"
	},
	{
		suffix: "agematsu.nagano.jp",
		reversed: "pj.onagan.ustamega"
	},
	{
		suffix: "agency",
		reversed: "ycnega"
	},
	{
		suffix: "agents.aero",
		reversed: "orea.stnega"
	},
	{
		suffix: "agr.br",
		reversed: "rb.rga"
	},
	{
		suffix: "agrar.hu",
		reversed: "uh.rarga"
	},
	{
		suffix: "agric.za",
		reversed: "az.cirga"
	},
	{
		suffix: "agriculture.museum",
		reversed: "muesum.erutlucirga"
	},
	{
		suffix: "agrigento.it",
		reversed: "ti.otnegirga"
	},
	{
		suffix: "agro.bo",
		reversed: "ob.orga"
	},
	{
		suffix: "agro.pl",
		reversed: "lp.orga"
	},
	{
		suffix: "aguni.okinawa.jp",
		reversed: "pj.awaniko.inuga"
	},
	{
		suffix: "ah.cn",
		reversed: "nc.ha"
	},
	{
		suffix: "ah.no",
		reversed: "on.ha"
	},
	{
		suffix: "ai",
		reversed: "ia"
	},
	{
		suffix: "ai.in",
		reversed: "ni.ia"
	},
	{
		suffix: "aibetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebia"
	},
	{
		suffix: "aichi.jp",
		reversed: "pj.ihcia"
	},
	{
		suffix: "aid.pl",
		reversed: "lp.dia"
	},
	{
		suffix: "aig",
		reversed: "gia"
	},
	{
		suffix: "aikawa.kanagawa.jp",
		reversed: "pj.awaganak.awakia"
	},
	{
		suffix: "ainan.ehime.jp",
		reversed: "pj.emihe.nania"
	},
	{
		suffix: "aioi.hyogo.jp",
		reversed: "pj.ogoyh.ioia"
	},
	{
		suffix: "aip.ee",
		reversed: "ee.pia"
	},
	{
		suffix: "air-surveillance.aero",
		reversed: "orea.ecnallievrus-ria"
	},
	{
		suffix: "air-traffic-control.aero",
		reversed: "orea.lortnoc-ciffart-ria"
	},
	{
		suffix: "air.museum",
		reversed: "muesum.ria"
	},
	{
		suffix: "airbus",
		reversed: "subria"
	},
	{
		suffix: "aircraft.aero",
		reversed: "orea.tfarcria"
	},
	{
		suffix: "airforce",
		reversed: "ecrofria"
	},
	{
		suffix: "airguard.museum",
		reversed: "muesum.draugria"
	},
	{
		suffix: "airkitapps-au.com",
		reversed: "moc.ua-sppatikria"
	},
	{
		suffix: "airkitapps.com",
		reversed: "moc.sppatikria"
	},
	{
		suffix: "airkitapps.eu",
		reversed: "ue.sppatikria"
	},
	{
		suffix: "airline.aero",
		reversed: "orea.enilria"
	},
	{
		suffix: "airport.aero",
		reversed: "orea.tropria"
	},
	{
		suffix: "airtel",
		reversed: "letria"
	},
	{
		suffix: "airtraffic.aero",
		reversed: "orea.ciffartria"
	},
	{
		suffix: "aisai.aichi.jp",
		reversed: "pj.ihcia.iasia"
	},
	{
		suffix: "aisho.shiga.jp",
		reversed: "pj.agihs.ohsia"
	},
	{
		suffix: "aivencloud.com",
		reversed: "moc.duolcnevia"
	},
	{
		suffix: "aizubange.fukushima.jp",
		reversed: "pj.amihsukuf.egnabuzia"
	},
	{
		suffix: "aizumi.tokushima.jp",
		reversed: "pj.amihsukot.imuzia"
	},
	{
		suffix: "aizumisato.fukushima.jp",
		reversed: "pj.amihsukuf.otasimuzia"
	},
	{
		suffix: "aizuwakamatsu.fukushima.jp",
		reversed: "pj.amihsukuf.ustamakawuzia"
	},
	{
		suffix: "aju.br",
		reversed: "rb.uja"
	},
	{
		suffix: "ak.us",
		reversed: "su.ka"
	},
	{
		suffix: "akabira.hokkaido.jp",
		reversed: "pj.odiakkoh.aribaka"
	},
	{
		suffix: "akagi.shimane.jp",
		reversed: "pj.enamihs.igaka"
	},
	{
		suffix: "akaiwa.okayama.jp",
		reversed: "pj.amayako.awiaka"
	},
	{
		suffix: "akashi.hyogo.jp",
		reversed: "pj.ogoyh.ihsaka"
	},
	{
		suffix: "akdn",
		reversed: "ndka"
	},
	{
		suffix: "aki.kochi.jp",
		reversed: "pj.ihcok.ika"
	},
	{
		suffix: "akiruno.tokyo.jp",
		reversed: "pj.oykot.onurika"
	},
	{
		suffix: "akishima.tokyo.jp",
		reversed: "pj.oykot.amihsika"
	},
	{
		suffix: "akita.akita.jp",
		reversed: "pj.atika.atika"
	},
	{
		suffix: "akita.jp",
		reversed: "pj.atika"
	},
	{
		suffix: "akkeshi.hokkaido.jp",
		reversed: "pj.odiakkoh.ihsekka"
	},
	{
		suffix: "aknoluokta.no",
		reversed: "on.atkoulonka"
	},
	{
		suffix: "ako.hyogo.jp",
		reversed: "pj.ogoyh.oka"
	},
	{
		suffix: "akrehamn.no",
		reversed: "on.nmaherka"
	},
	{
		suffix: "aktyubinsk.su",
		reversed: "us.ksnibuytka"
	},
	{
		suffix: "akune.kagoshima.jp",
		reversed: "pj.amihsogak.enuka"
	},
	{
		suffix: "al",
		reversed: "la"
	},
	{
		suffix: "al.eu.org",
		reversed: "gro.ue.la"
	},
	{
		suffix: "al.gov.br",
		reversed: "rb.vog.la"
	},
	{
		suffix: "al.it",
		reversed: "ti.la"
	},
	{
		suffix: "al.leg.br",
		reversed: "rb.gel.la"
	},
	{
		suffix: "al.no",
		reversed: "on.la"
	},
	{
		suffix: "al.us",
		reversed: "su.la"
	},
	{
		suffix: "alabama.museum",
		reversed: "muesum.amabala"
	},
	{
		suffix: "alaheadju.no",
		reversed: "on.ujdaehala"
	},
	{
		suffix: "aland.fi",
		reversed: "if.dnala"
	},
	{
		suffix: "alaska.museum",
		reversed: "muesum.aksala"
	},
	{
		suffix: "alessandria.it",
		reversed: "ti.airdnassela"
	},
	{
		suffix: "alesund.no",
		reversed: "on.dnusela"
	},
	{
		suffix: "alfaromeo",
		reversed: "oemorafla"
	},
	{
		suffix: "algard.no",
		reversed: "on.dragla"
	},
	{
		suffix: "alibaba",
		reversed: "ababila"
	},
	{
		suffix: "alipay",
		reversed: "yapila"
	},
	{
		suffix: "allfinanz",
		reversed: "znaniflla"
	},
	{
		suffix: "allstate",
		reversed: "etatslla"
	},
	{
		suffix: "ally",
		reversed: "ylla"
	},
	{
		suffix: "alp1.ae.flow.ch",
		reversed: "hc.wolf.ea.1pla"
	},
	{
		suffix: "alpha-myqnapcloud.com",
		reversed: "moc.duolcpanqym-ahpla"
	},
	{
		suffix: "alpha.bounty-full.com",
		reversed: "moc.lluf-ytnuob.ahpla"
	},
	{
		suffix: "alsace",
		reversed: "ecasla"
	},
	{
		suffix: "alstahaug.no",
		reversed: "on.guahatsla"
	},
	{
		suffix: "alstom",
		reversed: "motsla"
	},
	{
		suffix: "alt.za",
		reversed: "az.tla"
	},
	{
		suffix: "alta.no",
		reversed: "on.atla"
	},
	{
		suffix: "altervista.org",
		reversed: "gro.atsivretla"
	},
	{
		suffix: "alto-adige.it",
		reversed: "ti.egida-otla"
	},
	{
		suffix: "altoadige.it",
		reversed: "ti.egidaotla"
	},
	{
		suffix: "alvdal.no",
		reversed: "on.ladvla"
	},
	{
		suffix: "alwaysdata.net",
		reversed: "ten.atadsyawla"
	},
	{
		suffix: "am",
		reversed: "ma"
	},
	{
		suffix: "am.br",
		reversed: "rb.ma"
	},
	{
		suffix: "am.gov.br",
		reversed: "rb.vog.ma"
	},
	{
		suffix: "am.in",
		reversed: "ni.ma"
	},
	{
		suffix: "am.leg.br",
		reversed: "rb.gel.ma"
	},
	{
		suffix: "ama.aichi.jp",
		reversed: "pj.ihcia.ama"
	},
	{
		suffix: "ama.shimane.jp",
		reversed: "pj.enamihs.ama"
	},
	{
		suffix: "amagasaki.hyogo.jp",
		reversed: "pj.ogoyh.ikasagama"
	},
	{
		suffix: "amakusa.kumamoto.jp",
		reversed: "pj.otomamuk.asukama"
	},
	{
		suffix: "amami.kagoshima.jp",
		reversed: "pj.amihsogak.imama"
	},
	{
		suffix: "amazon",
		reversed: "nozama"
	},
	{
		suffix: "amber.museum",
		reversed: "muesum.rebma"
	},
	{
		suffix: "ambulance.aero",
		reversed: "orea.ecnalubma"
	},
	{
		suffix: "ambulance.museum",
		reversed: "muesum.ecnalubma"
	},
	{
		suffix: "american.museum",
		reversed: "muesum.nacirema"
	},
	{
		suffix: "americana.museum",
		reversed: "muesum.anacirema"
	},
	{
		suffix: "americanantiques.museum",
		reversed: "muesum.seuqitnanacirema"
	},
	{
		suffix: "americanart.museum",
		reversed: "muesum.tranacirema"
	},
	{
		suffix: "americanexpress",
		reversed: "sserpxenacirema"
	},
	{
		suffix: "americanfamily",
		reversed: "ylimafnacirema"
	},
	{
		suffix: "amex",
		reversed: "xema"
	},
	{
		suffix: "amfam",
		reversed: "mafma"
	},
	{
		suffix: "ami.ibaraki.jp",
		reversed: "pj.ikarabi.ima"
	},
	{
		suffix: "amica",
		reversed: "acima"
	},
	{
		suffix: "amli.no",
		reversed: "on.ilma"
	},
	{
		suffix: "amot.no",
		reversed: "on.toma"
	},
	{
		suffix: "amscompute.com",
		reversed: "moc.etupmocsma"
	},
	{
		suffix: "amsterdam",
		reversed: "madretsma"
	},
	{
		suffix: "amsterdam.museum",
		reversed: "muesum.madretsma"
	},
	{
		suffix: "amusement.aero",
		reversed: "orea.tnemesuma"
	},
	{
		suffix: "an.it",
		reversed: "ti.na"
	},
	{
		suffix: "analytics",
		reversed: "scitylana"
	},
	{
		suffix: "anamizu.ishikawa.jp",
		reversed: "pj.awakihsi.uzimana"
	},
	{
		suffix: "anan.nagano.jp",
		reversed: "pj.onagan.nana"
	},
	{
		suffix: "anan.tokushima.jp",
		reversed: "pj.amihsukot.nana"
	},
	{
		suffix: "anani.br",
		reversed: "rb.inana"
	},
	{
		suffix: "ancona.it",
		reversed: "ti.anocna"
	},
	{
		suffix: "and.museum",
		reversed: "muesum.dna"
	},
	{
		suffix: "andasuolo.no",
		reversed: "on.olousadna"
	},
	{
		suffix: "andebu.no",
		reversed: "on.ubedna"
	},
	{
		suffix: "ando.nara.jp",
		reversed: "pj.aran.odna"
	},
	{
		suffix: "andoy.no",
		reversed: "on.yodna"
	},
	{
		suffix: "andria-barletta-trani.it",
		reversed: "ti.inart-attelrab-airdna"
	},
	{
		suffix: "andria-trani-barletta.it",
		reversed: "ti.attelrab-inart-airdna"
	},
	{
		suffix: "andriabarlettatrani.it",
		reversed: "ti.inartattelrabairdna"
	},
	{
		suffix: "andriatranibarletta.it",
		reversed: "ti.attelrabinartairdna"
	},
	{
		suffix: "android",
		reversed: "diordna"
	},
	{
		suffix: "andøy.no",
		reversed: "on.ari-ydna--nx"
	},
	{
		suffix: "angry.jp",
		reversed: "pj.yrgna"
	},
	{
		suffix: "anjo.aichi.jp",
		reversed: "pj.ihcia.ojna"
	},
	{
		suffix: "ann-arbor.mi.us",
		reversed: "su.im.robra-nna"
	},
	{
		suffix: "annaka.gunma.jp",
		reversed: "pj.amnug.akanna"
	},
	{
		suffix: "annefrank.museum",
		reversed: "muesum.knarfenna"
	},
	{
		suffix: "anpachi.gifu.jp",
		reversed: "pj.ufig.ihcapna"
	},
	{
		suffix: "anquan",
		reversed: "nauqna"
	},
	{
		suffix: "anthro.museum",
		reversed: "muesum.orhtna"
	},
	{
		suffix: "anthropology.museum",
		reversed: "muesum.ygoloporhtna"
	},
	{
		suffix: "antiques.museum",
		reversed: "muesum.seuqitna"
	},
	{
		suffix: "anz",
		reversed: "zna"
	},
	{
		suffix: "ao",
		reversed: "oa"
	},
	{
		suffix: "ao.it",
		reversed: "ti.oa"
	},
	{
		suffix: "aogaki.hyogo.jp",
		reversed: "pj.ogoyh.ikagoa"
	},
	{
		suffix: "aogashima.tokyo.jp",
		reversed: "pj.oykot.amihsagoa"
	},
	{
		suffix: "aoki.nagano.jp",
		reversed: "pj.onagan.ikoa"
	},
	{
		suffix: "aol",
		reversed: "loa"
	},
	{
		suffix: "aomori.aomori.jp",
		reversed: "pj.iromoa.iromoa"
	},
	{
		suffix: "aomori.jp",
		reversed: "pj.iromoa"
	},
	{
		suffix: "aosta-valley.it",
		reversed: "ti.yellav-atsoa"
	},
	{
		suffix: "aosta.it",
		reversed: "ti.atsoa"
	},
	{
		suffix: "aostavalley.it",
		reversed: "ti.yellavatsoa"
	},
	{
		suffix: "aoste.it",
		reversed: "ti.etsoa"
	},
	{
		suffix: "ap-northeast-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-tsaehtron-pa"
	},
	{
		suffix: "ap-northeast-2.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.2-tsaehtron-pa"
	},
	{
		suffix: "ap-northeast-3.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.3-tsaehtron-pa"
	},
	{
		suffix: "ap-south-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-htuos-pa"
	},
	{
		suffix: "ap-southeast-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-tsaehtuos-pa"
	},
	{
		suffix: "ap-southeast-2.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.2-tsaehtuos-pa"
	},
	{
		suffix: "ap.gov.br",
		reversed: "rb.vog.pa"
	},
	{
		suffix: "ap.gov.pl",
		reversed: "lp.vog.pa"
	},
	{
		suffix: "ap.it",
		reversed: "ti.pa"
	},
	{
		suffix: "ap.leg.br",
		reversed: "rb.gel.pa"
	},
	{
		suffix: "aparecida.br",
		reversed: "rb.adicerapa"
	},
	{
		suffix: "apartments",
		reversed: "stnemtrapa"
	},
	{
		suffix: "api.gov.uk",
		reversed: "ku.vog.ipa"
	},
	{
		suffix: "api.stdlib.com",
		reversed: "moc.bildts.ipa"
	},
	{
		suffix: "apigee.io",
		reversed: "oi.eegipa"
	},
	{
		suffix: "app",
		reversed: "ppa"
	},
	{
		suffix: "app.banzaicloud.io",
		reversed: "oi.duolciaznab.ppa"
	},
	{
		suffix: "app.br",
		reversed: "rb.ppa"
	},
	{
		suffix: "app.gp",
		reversed: "pg.ppa"
	},
	{
		suffix: "app.lmpm.com",
		reversed: "moc.mpml.ppa"
	},
	{
		suffix: "app.os.fedoraproject.org",
		reversed: "gro.tcejorparodef.so.ppa"
	},
	{
		suffix: "app.os.stg.fedoraproject.org",
		reversed: "gro.tcejorparodef.gts.so.ppa"
	},
	{
		suffix: "app.render.com",
		reversed: "moc.redner.ppa"
	},
	{
		suffix: "appchizi.com",
		reversed: "moc.izihcppa"
	},
	{
		suffix: "appengine.flow.ch",
		reversed: "hc.wolf.enigneppa"
	},
	{
		suffix: "apple",
		reversed: "elppa"
	},
	{
		suffix: "applinzi.com",
		reversed: "moc.iznilppa"
	},
	{
		suffix: "apps.fbsbx.com",
		reversed: "moc.xbsbf.sppa"
	},
	{
		suffix: "apps.lair.io",
		reversed: "oi.rial.sppa"
	},
	{
		suffix: "appspacehosted.com",
		reversed: "moc.detsohecapsppa"
	},
	{
		suffix: "appspaceusercontent.com",
		reversed: "moc.tnetnocresuecapsppa"
	},
	{
		suffix: "appspot.com",
		reversed: "moc.topsppa"
	},
	{
		suffix: "appudo.net",
		reversed: "ten.oduppa"
	},
	{
		suffix: "aq",
		reversed: "qa"
	},
	{
		suffix: "aq.it",
		reversed: "ti.qa"
	},
	{
		suffix: "aquarelle",
		reversed: "ellerauqa"
	},
	{
		suffix: "aquarium.museum",
		reversed: "muesum.muirauqa"
	},
	{
		suffix: "aquila.it",
		reversed: "ti.aliuqa"
	},
	{
		suffix: "ar",
		reversed: "ra"
	},
	{
		suffix: "ar.com",
		reversed: "moc.ra"
	},
	{
		suffix: "ar.it",
		reversed: "ti.ra"
	},
	{
		suffix: "ar.us",
		reversed: "su.ra"
	},
	{
		suffix: "arab",
		reversed: "bara"
	},
	{
		suffix: "arai.shizuoka.jp",
		reversed: "pj.akouzihs.iara"
	},
	{
		suffix: "arakawa.saitama.jp",
		reversed: "pj.amatias.awakara"
	},
	{
		suffix: "arakawa.tokyo.jp",
		reversed: "pj.oykot.awakara"
	},
	{
		suffix: "aramco",
		reversed: "ocmara"
	},
	{
		suffix: "arao.kumamoto.jp",
		reversed: "pj.otomamuk.oara"
	},
	{
		suffix: "arboretum.museum",
		reversed: "muesum.muterobra"
	},
	{
		suffix: "archaeological.museum",
		reversed: "muesum.lacigoloeahcra"
	},
	{
		suffix: "archaeology.museum",
		reversed: "muesum.ygoloeahcra"
	},
	{
		suffix: "archi",
		reversed: "ihcra"
	},
	{
		suffix: "architecture.museum",
		reversed: "muesum.erutcetihcra"
	},
	{
		suffix: "ardal.no",
		reversed: "on.ladra"
	},
	{
		suffix: "aremark.no",
		reversed: "on.kramera"
	},
	{
		suffix: "arendal.no",
		reversed: "on.ladnera"
	},
	{
		suffix: "arezzo.it",
		reversed: "ti.ozzera"
	},
	{
		suffix: "ariake.saga.jp",
		reversed: "pj.agas.ekaira"
	},
	{
		suffix: "arida.wakayama.jp",
		reversed: "pj.amayakaw.adira"
	},
	{
		suffix: "aridagawa.wakayama.jp",
		reversed: "pj.amayakaw.awagadira"
	},
	{
		suffix: "arita.saga.jp",
		reversed: "pj.agas.atira"
	},
	{
		suffix: "arkhangelsk.su",
		reversed: "us.kslegnahkra"
	},
	{
		suffix: "armenia.su",
		reversed: "us.ainemra"
	},
	{
		suffix: "army",
		reversed: "ymra"
	},
	{
		suffix: "arna.no",
		reversed: "on.anra"
	},
	{
		suffix: "arpa",
		reversed: "apra"
	},
	{
		suffix: "arq.br",
		reversed: "rb.qra"
	},
	{
		suffix: "art",
		reversed: "tra"
	},
	{
		suffix: "art.br",
		reversed: "rb.tra"
	},
	{
		suffix: "art.do",
		reversed: "od.tra"
	},
	{
		suffix: "art.dz",
		reversed: "zd.tra"
	},
	{
		suffix: "art.ht",
		reversed: "th.tra"
	},
	{
		suffix: "art.museum",
		reversed: "muesum.tra"
	},
	{
		suffix: "art.pl",
		reversed: "lp.tra"
	},
	{
		suffix: "art.sn",
		reversed: "ns.tra"
	},
	{
		suffix: "artanddesign.museum",
		reversed: "muesum.ngiseddnatra"
	},
	{
		suffix: "artcenter.museum",
		reversed: "muesum.retnectra"
	},
	{
		suffix: "artdeco.museum",
		reversed: "muesum.ocedtra"
	},
	{
		suffix: "arte",
		reversed: "etra"
	},
	{
		suffix: "arte.bo",
		reversed: "ob.etra"
	},
	{
		suffix: "arteducation.museum",
		reversed: "muesum.noitacudetra"
	},
	{
		suffix: "artgallery.museum",
		reversed: "muesum.yrellagtra"
	},
	{
		suffix: "arts.co",
		reversed: "oc.stra"
	},
	{
		suffix: "arts.museum",
		reversed: "muesum.stra"
	},
	{
		suffix: "arts.nf",
		reversed: "fn.stra"
	},
	{
		suffix: "arts.ro",
		reversed: "or.stra"
	},
	{
		suffix: "arts.ve",
		reversed: "ev.stra"
	},
	{
		suffix: "artsandcrafts.museum",
		reversed: "muesum.stfarcdnastra"
	},
	{
		suffix: "arvo.network",
		reversed: "krowten.ovra"
	},
	{
		suffix: "as",
		reversed: "sa"
	},
	{
		suffix: "as.us",
		reversed: "su.sa"
	},
	{
		suffix: "asago.hyogo.jp",
		reversed: "pj.ogoyh.ogasa"
	},
	{
		suffix: "asahi.chiba.jp",
		reversed: "pj.abihc.ihasa"
	},
	{
		suffix: "asahi.ibaraki.jp",
		reversed: "pj.ikarabi.ihasa"
	},
	{
		suffix: "asahi.mie.jp",
		reversed: "pj.eim.ihasa"
	},
	{
		suffix: "asahi.nagano.jp",
		reversed: "pj.onagan.ihasa"
	},
	{
		suffix: "asahi.toyama.jp",
		reversed: "pj.amayot.ihasa"
	},
	{
		suffix: "asahi.yamagata.jp",
		reversed: "pj.atagamay.ihasa"
	},
	{
		suffix: "asahikawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awakihasa"
	},
	{
		suffix: "asaka.saitama.jp",
		reversed: "pj.amatias.akasa"
	},
	{
		suffix: "asakawa.fukushima.jp",
		reversed: "pj.amihsukuf.awakasa"
	},
	{
		suffix: "asakuchi.okayama.jp",
		reversed: "pj.amayako.ihcukasa"
	},
	{
		suffix: "asaminami.hiroshima.jp",
		reversed: "pj.amihsorih.imanimasa"
	},
	{
		suffix: "ascoli-piceno.it",
		reversed: "ti.onecip-ilocsa"
	},
	{
		suffix: "ascolipiceno.it",
		reversed: "ti.onecipilocsa"
	},
	{
		suffix: "asda",
		reversed: "adsa"
	},
	{
		suffix: "aseral.no",
		reversed: "on.laresa"
	},
	{
		suffix: "ashgabad.su",
		reversed: "us.dabaghsa"
	},
	{
		suffix: "ashibetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebihsa"
	},
	{
		suffix: "ashikaga.tochigi.jp",
		reversed: "pj.igihcot.agakihsa"
	},
	{
		suffix: "ashiya.fukuoka.jp",
		reversed: "pj.akoukuf.ayihsa"
	},
	{
		suffix: "ashiya.hyogo.jp",
		reversed: "pj.ogoyh.ayihsa"
	},
	{
		suffix: "ashoro.hokkaido.jp",
		reversed: "pj.odiakkoh.orohsa"
	},
	{
		suffix: "asia",
		reversed: "aisa"
	},
	{
		suffix: "asker.no",
		reversed: "on.reksa"
	},
	{
		suffix: "askim.no",
		reversed: "on.miksa"
	},
	{
		suffix: "askoy.no",
		reversed: "on.yoksa"
	},
	{
		suffix: "askvoll.no",
		reversed: "on.llovksa"
	},
	{
		suffix: "askøy.no",
		reversed: "on.ari-yksa--nx"
	},
	{
		suffix: "asmatart.museum",
		reversed: "muesum.tratamsa"
	},
	{
		suffix: "asn.au",
		reversed: "ua.nsa"
	},
	{
		suffix: "asn.lv",
		reversed: "vl.nsa"
	},
	{
		suffix: "asnes.no",
		reversed: "on.sensa"
	},
	{
		suffix: "aso.kumamoto.jp",
		reversed: "pj.otomamuk.osa"
	},
	{
		suffix: "ass.km",
		reversed: "mk.ssa"
	},
	{
		suffix: "assabu.hokkaido.jp",
		reversed: "pj.odiakkoh.ubassa"
	},
	{
		suffix: "assassination.museum",
		reversed: "muesum.noitanissassa"
	},
	{
		suffix: "assisi.museum",
		reversed: "muesum.isissa"
	},
	{
		suffix: "assn.lk",
		reversed: "kl.nssa"
	},
	{
		suffix: "asso.bj",
		reversed: "jb.ossa"
	},
	{
		suffix: "asso.ci",
		reversed: "ic.ossa"
	},
	{
		suffix: "asso.dz",
		reversed: "zd.ossa"
	},
	{
		suffix: "asso.eu.org",
		reversed: "gro.ue.ossa"
	},
	{
		suffix: "asso.fr",
		reversed: "rf.ossa"
	},
	{
		suffix: "asso.gp",
		reversed: "pg.ossa"
	},
	{
		suffix: "asso.ht",
		reversed: "th.ossa"
	},
	{
		suffix: "asso.km",
		reversed: "mk.ossa"
	},
	{
		suffix: "asso.mc",
		reversed: "cm.ossa"
	},
	{
		suffix: "asso.nc",
		reversed: "cn.ossa"
	},
	{
		suffix: "asso.re",
		reversed: "er.ossa"
	},
	{
		suffix: "associates",
		reversed: "setaicossa"
	},
	{
		suffix: "association.aero",
		reversed: "orea.noitaicossa"
	},
	{
		suffix: "association.museum",
		reversed: "muesum.noitaicossa"
	},
	{
		suffix: "asti.it",
		reversed: "ti.itsa"
	},
	{
		suffix: "astronomy.museum",
		reversed: "muesum.ymonortsa"
	},
	{
		suffix: "asuke.aichi.jp",
		reversed: "pj.ihcia.ekusa"
	},
	{
		suffix: "at",
		reversed: "ta"
	},
	{
		suffix: "at-band-camp.net",
		reversed: "ten.pmac-dnab-ta"
	},
	{
		suffix: "at.eu.org",
		reversed: "gro.ue.ta"
	},
	{
		suffix: "at.it",
		reversed: "ti.ta"
	},
	{
		suffix: "at.md",
		reversed: "dm.ta"
	},
	{
		suffix: "at.vg",
		reversed: "gv.ta"
	},
	{
		suffix: "atami.shizuoka.jp",
		reversed: "pj.akouzihs.imata"
	},
	{
		suffix: "ath.cx",
		reversed: "xc.hta"
	},
	{
		suffix: "athleta",
		reversed: "atelhta"
	},
	{
		suffix: "atl.jelastic.vps-host.net",
		reversed: "ten.tsoh-spv.citsalej.lta"
	},
	{
		suffix: "atlanta.museum",
		reversed: "muesum.atnalta"
	},
	{
		suffix: "atm.pl",
		reversed: "lp.mta"
	},
	{
		suffix: "ato.br",
		reversed: "rb.ota"
	},
	{
		suffix: "atsugi.kanagawa.jp",
		reversed: "pj.awaganak.igusta"
	},
	{
		suffix: "atsuma.hokkaido.jp",
		reversed: "pj.odiakkoh.amusta"
	},
	{
		suffix: "attorney",
		reversed: "yenrotta"
	},
	{
		suffix: "au",
		reversed: "ua"
	},
	{
		suffix: "au.eu.org",
		reversed: "gro.ue.ua"
	},
	{
		suffix: "auction",
		reversed: "noitcua"
	},
	{
		suffix: "audi",
		reversed: "idua"
	},
	{
		suffix: "audible",
		reversed: "elbidua"
	},
	{
		suffix: "audio",
		reversed: "oidua"
	},
	{
		suffix: "audnedaln.no",
		reversed: "on.nladendua"
	},
	{
		suffix: "augustow.pl",
		reversed: "lp.wotsugua"
	},
	{
		suffix: "aukra.no",
		reversed: "on.arkua"
	},
	{
		suffix: "aure.no",
		reversed: "on.erua"
	},
	{
		suffix: "aurland.no",
		reversed: "on.dnalrua"
	},
	{
		suffix: "aurskog-holand.no",
		reversed: "on.dnaloh-goksrua"
	},
	{
		suffix: "aurskog-høland.no",
		reversed: "on.bnj-dnalh-goksrua--nx"
	},
	{
		suffix: "aus.basketball",
		reversed: "llabteksab.sua"
	},
	{
		suffix: "auspost",
		reversed: "tsopsua"
	},
	{
		suffix: "austevoll.no",
		reversed: "on.llovetsua"
	},
	{
		suffix: "austin.museum",
		reversed: "muesum.nitsua"
	},
	{
		suffix: "australia.museum",
		reversed: "muesum.ailartsua"
	},
	{
		suffix: "austrheim.no",
		reversed: "on.miehrtsua"
	},
	{
		suffix: "authgear-staging.com",
		reversed: "moc.gnigats-raeghtua"
	},
	{
		suffix: "authgearapps.com",
		reversed: "moc.spparaeghtua"
	},
	{
		suffix: "author",
		reversed: "rohtua"
	},
	{
		suffix: "author.aero",
		reversed: "orea.rohtua"
	},
	{
		suffix: "auto",
		reversed: "otua"
	},
	{
		suffix: "auto.pl",
		reversed: "lp.otua"
	},
	{
		suffix: "automotive.museum",
		reversed: "muesum.evitomotua"
	},
	{
		suffix: "autos",
		reversed: "sotua"
	},
	{
		suffix: "av.it",
		reversed: "ti.va"
	},
	{
		suffix: "av.tr",
		reversed: "rt.va"
	},
	{
		suffix: "avellino.it",
		reversed: "ti.onilleva"
	},
	{
		suffix: "averoy.no",
		reversed: "on.yoreva"
	},
	{
		suffix: "averøy.no",
		reversed: "on.auy-yreva--nx"
	},
	{
		suffix: "avianca",
		reversed: "acnaiva"
	},
	{
		suffix: "aviation.museum",
		reversed: "muesum.noitaiva"
	},
	{
		suffix: "avocat.fr",
		reversed: "rf.tacova"
	},
	{
		suffix: "avocat.pro",
		reversed: "orp.tacova"
	},
	{
		suffix: "avoues.fr",
		reversed: "rf.seuova"
	},
	{
		suffix: "aw",
		reversed: "wa"
	},
	{
		suffix: "awaji.hyogo.jp",
		reversed: "pj.ogoyh.ijawa"
	},
	{
		suffix: "aws",
		reversed: "swa"
	},
	{
		suffix: "awsglobalaccelerator.com",
		reversed: "moc.rotareleccalabolgswa"
	},
	{
		suffix: "awsmppl.com",
		reversed: "moc.lppmswa"
	},
	{
		suffix: "ax",
		reversed: "xa"
	},
	{
		suffix: "axa",
		reversed: "axa"
	},
	{
		suffix: "axis.museum",
		reversed: "muesum.sixa"
	},
	{
		suffix: "aya.miyazaki.jp",
		reversed: "pj.ikazayim.aya"
	},
	{
		suffix: "ayabe.kyoto.jp",
		reversed: "pj.otoyk.ebaya"
	},
	{
		suffix: "ayagawa.kagawa.jp",
		reversed: "pj.awagak.awagaya"
	},
	{
		suffix: "ayase.kanagawa.jp",
		reversed: "pj.awaganak.esaya"
	},
	{
		suffix: "az",
		reversed: "za"
	},
	{
		suffix: "az.us",
		reversed: "su.za"
	},
	{
		suffix: "azerbaijan.su",
		reversed: "us.najiabreza"
	},
	{
		suffix: "azimuth.network",
		reversed: "krowten.htumiza"
	},
	{
		suffix: "azumino.nagano.jp",
		reversed: "pj.onagan.onimuza"
	},
	{
		suffix: "azure",
		reversed: "eruza"
	},
	{
		suffix: "azure-mobile.net",
		reversed: "ten.elibom-eruza"
	},
	{
		suffix: "azurestaticapps.net",
		reversed: "ten.sppacitatseruza"
	},
	{
		suffix: "azurewebsites.net",
		reversed: "ten.setisbeweruza"
	},
	{
		suffix: "aéroport.ci",
		reversed: "ic.ayb-tropora--nx"
	},
	{
		suffix: "b-data.io",
		reversed: "oi.atad-b"
	},
	{
		suffix: "b.bg",
		reversed: "gb.b"
	},
	{
		suffix: "b.br",
		reversed: "rb.b"
	},
	{
		suffix: "b.se",
		reversed: "es.b"
	},
	{
		suffix: "b.ssl.fastly.net",
		reversed: "ten.yltsaf.lss.b"
	},
	{
		suffix: "ba",
		reversed: "ab"
	},
	{
		suffix: "ba.gov.br",
		reversed: "rb.vog.ab"
	},
	{
		suffix: "ba.it",
		reversed: "ti.ab"
	},
	{
		suffix: "ba.leg.br",
		reversed: "rb.gel.ab"
	},
	{
		suffix: "babia-gora.pl",
		reversed: "lp.arog-aibab"
	},
	{
		suffix: "baby",
		reversed: "ybab"
	},
	{
		suffix: "babyblue.jp",
		reversed: "pj.eulbybab"
	},
	{
		suffix: "babymilk.jp",
		reversed: "pj.klimybab"
	},
	{
		suffix: "backdrop.jp",
		reversed: "pj.pordkcab"
	},
	{
		suffix: "backplaneapp.io",
		reversed: "oi.ppaenalpkcab"
	},
	{
		suffix: "badaddja.no",
		reversed: "on.ajddadab"
	},
	{
		suffix: "badajoz.museum",
		reversed: "muesum.zojadab"
	},
	{
		suffix: "baghdad.museum",
		reversed: "muesum.dadhgab"
	},
	{
		suffix: "bahcavuotna.no",
		reversed: "on.antouvachab"
	},
	{
		suffix: "bahccavuotna.no",
		reversed: "on.antouvacchab"
	},
	{
		suffix: "bahn.museum",
		reversed: "muesum.nhab"
	},
	{
		suffix: "baidar.no",
		reversed: "on.radiab"
	},
	{
		suffix: "baidu",
		reversed: "udiab"
	},
	{
		suffix: "bajddar.no",
		reversed: "on.raddjab"
	},
	{
		suffix: "balashov.su",
		reversed: "us.vohsalab"
	},
	{
		suffix: "balat.no",
		reversed: "on.talab"
	},
	{
		suffix: "bale.museum",
		reversed: "muesum.elab"
	},
	{
		suffix: "balena-devices.com",
		reversed: "moc.secived-anelab"
	},
	{
		suffix: "balestrand.no",
		reversed: "on.dnartselab"
	},
	{
		suffix: "ballangen.no",
		reversed: "on.negnallab"
	},
	{
		suffix: "ballooning.aero",
		reversed: "orea.gninoollab"
	},
	{
		suffix: "balsan-sudtirol.it",
		reversed: "ti.loritdus-naslab"
	},
	{
		suffix: "balsan-suedtirol.it",
		reversed: "ti.loritdeus-naslab"
	},
	{
		suffix: "balsan-südtirol.it",
		reversed: "ti.bsn-loritds-naslab--nx"
	},
	{
		suffix: "balsan.it",
		reversed: "ti.naslab"
	},
	{
		suffix: "balsfjord.no",
		reversed: "on.drojfslab"
	},
	{
		suffix: "baltimore.museum",
		reversed: "muesum.eromitlab"
	},
	{
		suffix: "bambina.jp",
		reversed: "pj.anibmab"
	},
	{
		suffix: "bamble.no",
		reversed: "on.elbmab"
	},
	{
		suffix: "banamex",
		reversed: "xemanab"
	},
	{
		suffix: "bananarepublic",
		reversed: "cilbuperananab"
	},
	{
		suffix: "band",
		reversed: "dnab"
	},
	{
		suffix: "bandai.fukushima.jp",
		reversed: "pj.amihsukuf.iadnab"
	},
	{
		suffix: "bando.ibaraki.jp",
		reversed: "pj.ikarabi.odnab"
	},
	{
		suffix: "bank",
		reversed: "knab"
	},
	{
		suffix: "bar",
		reversed: "rab"
	},
	{
		suffix: "bar.pro",
		reversed: "orp.rab"
	},
	{
		suffix: "bar0.net",
		reversed: "ten.0rab"
	},
	{
		suffix: "bar1.net",
		reversed: "ten.1rab"
	},
	{
		suffix: "bar2.net",
		reversed: "ten.2rab"
	},
	{
		suffix: "barcelona",
		reversed: "anolecrab"
	},
	{
		suffix: "barcelona.museum",
		reversed: "muesum.anolecrab"
	},
	{
		suffix: "barclaycard",
		reversed: "dracyalcrab"
	},
	{
		suffix: "barclays",
		reversed: "syalcrab"
	},
	{
		suffix: "bardu.no",
		reversed: "on.udrab"
	},
	{
		suffix: "barefoot",
		reversed: "tooferab"
	},
	{
		suffix: "bargains",
		reversed: "sniagrab"
	},
	{
		suffix: "bari.it",
		reversed: "ti.irab"
	},
	{
		suffix: "barletta-trani-andria.it",
		reversed: "ti.airdna-inart-attelrab"
	},
	{
		suffix: "barlettatraniandria.it",
		reversed: "ti.airdnainartattelrab"
	},
	{
		suffix: "barreau.bj",
		reversed: "jb.uaerrab"
	},
	{
		suffix: "barrel-of-knowledge.info",
		reversed: "ofni.egdelwonk-fo-lerrab"
	},
	{
		suffix: "barrell-of-knowledge.info",
		reversed: "ofni.egdelwonk-fo-llerrab"
	},
	{
		suffix: "barsy.bg",
		reversed: "gb.ysrab"
	},
	{
		suffix: "barsy.ca",
		reversed: "ac.ysrab"
	},
	{
		suffix: "barsy.club",
		reversed: "bulc.ysrab"
	},
	{
		suffix: "barsy.co.uk",
		reversed: "ku.oc.ysrab"
	},
	{
		suffix: "barsy.de",
		reversed: "ed.ysrab"
	},
	{
		suffix: "barsy.eu",
		reversed: "ue.ysrab"
	},
	{
		suffix: "barsy.in",
		reversed: "ni.ysrab"
	},
	{
		suffix: "barsy.info",
		reversed: "ofni.ysrab"
	},
	{
		suffix: "barsy.io",
		reversed: "oi.ysrab"
	},
	{
		suffix: "barsy.me",
		reversed: "em.ysrab"
	},
	{
		suffix: "barsy.menu",
		reversed: "unem.ysrab"
	},
	{
		suffix: "barsy.mobi",
		reversed: "ibom.ysrab"
	},
	{
		suffix: "barsy.net",
		reversed: "ten.ysrab"
	},
	{
		suffix: "barsy.online",
		reversed: "enilno.ysrab"
	},
	{
		suffix: "barsy.org",
		reversed: "gro.ysrab"
	},
	{
		suffix: "barsy.pro",
		reversed: "orp.ysrab"
	},
	{
		suffix: "barsy.pub",
		reversed: "bup.ysrab"
	},
	{
		suffix: "barsy.ro",
		reversed: "or.ysrab"
	},
	{
		suffix: "barsy.shop",
		reversed: "pohs.ysrab"
	},
	{
		suffix: "barsy.site",
		reversed: "etis.ysrab"
	},
	{
		suffix: "barsy.support",
		reversed: "troppus.ysrab"
	},
	{
		suffix: "barsy.uk",
		reversed: "ku.ysrab"
	},
	{
		suffix: "barsycenter.com",
		reversed: "moc.retnecysrab"
	},
	{
		suffix: "barsyonline.co.uk",
		reversed: "ku.oc.enilnoysrab"
	},
	{
		suffix: "barsyonline.com",
		reversed: "moc.enilnoysrab"
	},
	{
		suffix: "barueri.br",
		reversed: "rb.ireurab"
	},
	{
		suffix: "barum.no",
		reversed: "on.murab"
	},
	{
		suffix: "bas.it",
		reversed: "ti.sab"
	},
	{
		suffix: "base.ec",
		reversed: "ce.esab"
	},
	{
		suffix: "base.shop",
		reversed: "pohs.esab"
	},
	{
		suffix: "baseball",
		reversed: "llabesab"
	},
	{
		suffix: "baseball.museum",
		reversed: "muesum.llabesab"
	},
	{
		suffix: "basel.museum",
		reversed: "muesum.lesab"
	},
	{
		suffix: "bashkiria.ru",
		reversed: "ur.airikhsab"
	},
	{
		suffix: "bashkiria.su",
		reversed: "us.airikhsab"
	},
	{
		suffix: "basicserver.io",
		reversed: "oi.revrescisab"
	},
	{
		suffix: "basilicata.it",
		reversed: "ti.atacilisab"
	},
	{
		suffix: "basketball",
		reversed: "llabteksab"
	},
	{
		suffix: "baths.museum",
		reversed: "muesum.shtab"
	},
	{
		suffix: "bato.tochigi.jp",
		reversed: "pj.igihcot.otab"
	},
	{
		suffix: "batsfjord.no",
		reversed: "on.drojfstab"
	},
	{
		suffix: "bauern.museum",
		reversed: "muesum.nreuab"
	},
	{
		suffix: "bauhaus",
		reversed: "suahuab"
	},
	{
		suffix: "bayern",
		reversed: "nreyab"
	},
	{
		suffix: "bb",
		reversed: "bb"
	},
	{
		suffix: "bbc",
		reversed: "cbb"
	},
	{
		suffix: "bbs.tr",
		reversed: "rt.sbb"
	},
	{
		suffix: "bbt",
		reversed: "tbb"
	},
	{
		suffix: "bbva",
		reversed: "avbb"
	},
	{
		suffix: "bc.ca",
		reversed: "ac.cb"
	},
	{
		suffix: "bc.platform.sh",
		reversed: "hs.mroftalp.cb"
	},
	{
		suffix: "bcg",
		reversed: "gcb"
	},
	{
		suffix: "bci.dnstrace.pro",
		reversed: "orp.ecartsnd.icb"
	},
	{
		suffix: "bcn",
		reversed: "ncb"
	},
	{
		suffix: "bd.se",
		reversed: "es.db"
	},
	{
		suffix: "be",
		reversed: "eb"
	},
	{
		suffix: "be.ax",
		reversed: "xa.eb"
	},
	{
		suffix: "be.eu.org",
		reversed: "gro.ue.eb"
	},
	{
		suffix: "be.gy",
		reversed: "yg.eb"
	},
	{
		suffix: "beagleboard.io",
		reversed: "oi.draobelgaeb"
	},
	{
		suffix: "bearalvahki.no",
		reversed: "on.ikhavlaraeb"
	},
	{
		suffix: "bearalváhki.no",
		reversed: "on.a4y-ikhvlaraeb--nx"
	},
	{
		suffix: "beardu.no",
		reversed: "on.udraeb"
	},
	{
		suffix: "beats",
		reversed: "staeb"
	},
	{
		suffix: "beauty",
		reversed: "ytuaeb"
	},
	{
		suffix: "beauxarts.museum",
		reversed: "muesum.straxuaeb"
	},
	{
		suffix: "bedzin.pl",
		reversed: "lp.nizdeb"
	},
	{
		suffix: "beeldengeluid.museum",
		reversed: "muesum.diulegnedleeb"
	},
	{
		suffix: "beep.pl",
		reversed: "lp.peeb"
	},
	{
		suffix: "beer",
		reversed: "reeb"
	},
	{
		suffix: "beiarn.no",
		reversed: "on.nraieb"
	},
	{
		suffix: "bel.tr",
		reversed: "rt.leb"
	},
	{
		suffix: "belau.pw",
		reversed: "wp.ualeb"
	},
	{
		suffix: "belem.br",
		reversed: "rb.meleb"
	},
	{
		suffix: "bellevue.museum",
		reversed: "muesum.euvelleb"
	},
	{
		suffix: "belluno.it",
		reversed: "ti.onulleb"
	},
	{
		suffix: "benevento.it",
		reversed: "ti.otneveneb"
	},
	{
		suffix: "bentley",
		reversed: "yeltneb"
	},
	{
		suffix: "beppu.oita.jp",
		reversed: "pj.atio.uppeb"
	},
	{
		suffix: "berg.no",
		reversed: "on.greb"
	},
	{
		suffix: "bergamo.it",
		reversed: "ti.omagreb"
	},
	{
		suffix: "bergbau.museum",
		reversed: "muesum.uabgreb"
	},
	{
		suffix: "bergen.no",
		reversed: "on.negreb"
	},
	{
		suffix: "berkeley.museum",
		reversed: "muesum.yelekreb"
	},
	{
		suffix: "berlevag.no",
		reversed: "on.gavelreb"
	},
	{
		suffix: "berlevåg.no",
		reversed: "on.axj-gvelreb--nx"
	},
	{
		suffix: "berlin",
		reversed: "nilreb"
	},
	{
		suffix: "berlin.museum",
		reversed: "muesum.nilreb"
	},
	{
		suffix: "bern.museum",
		reversed: "muesum.nreb"
	},
	{
		suffix: "beskidy.pl",
		reversed: "lp.ydikseb"
	},
	{
		suffix: "best",
		reversed: "tseb"
	},
	{
		suffix: "bestbuy",
		reversed: "yubtseb"
	},
	{
		suffix: "bet",
		reversed: "teb"
	},
	{
		suffix: "bet.ar",
		reversed: "ra.teb"
	},
	{
		suffix: "beta.bounty-full.com",
		reversed: "moc.lluf-ytnuob.ateb"
	},
	{
		suffix: "beta.tailscale.net",
		reversed: "ten.elacsliat.ateb"
	},
	{
		suffix: "betainabox.com",
		reversed: "moc.xobaniateb"
	},
	{
		suffix: "better-than.tv",
		reversed: "vt.naht-retteb"
	},
	{
		suffix: "bf",
		reversed: "fb"
	},
	{
		suffix: "bg",
		reversed: "gb"
	},
	{
		suffix: "bg.eu.org",
		reversed: "gro.ue.gb"
	},
	{
		suffix: "bg.it",
		reversed: "ti.gb"
	},
	{
		suffix: "bh",
		reversed: "hb"
	},
	{
		suffix: "bharti",
		reversed: "itrahb"
	},
	{
		suffix: "bhz.br",
		reversed: "rb.zhb"
	},
	{
		suffix: "bi",
		reversed: "ib"
	},
	{
		suffix: "bi.it",
		reversed: "ti.ib"
	},
	{
		suffix: "bialowieza.pl",
		reversed: "lp.azeiwolaib"
	},
	{
		suffix: "bialystok.pl",
		reversed: "lp.kotsylaib"
	},
	{
		suffix: "bib.br",
		reversed: "rb.bib"
	},
	{
		suffix: "bib.ve",
		reversed: "ev.bib"
	},
	{
		suffix: "bibai.hokkaido.jp",
		reversed: "pj.odiakkoh.iabib"
	},
	{
		suffix: "bible",
		reversed: "elbib"
	},
	{
		suffix: "bible.museum",
		reversed: "muesum.elbib"
	},
	{
		suffix: "bid",
		reversed: "dib"
	},
	{
		suffix: "biei.hokkaido.jp",
		reversed: "pj.odiakkoh.ieib"
	},
	{
		suffix: "bielawa.pl",
		reversed: "lp.awaleib"
	},
	{
		suffix: "biella.it",
		reversed: "ti.alleib"
	},
	{
		suffix: "bieszczady.pl",
		reversed: "lp.ydazczseib"
	},
	{
		suffix: "bievat.no",
		reversed: "on.taveib"
	},
	{
		suffix: "bievát.no",
		reversed: "on.aq0-tveib--nx"
	},
	{
		suffix: "bifuka.hokkaido.jp",
		reversed: "pj.odiakkoh.akufib"
	},
	{
		suffix: "bihar.in",
		reversed: "ni.rahib"
	},
	{
		suffix: "bihoro.hokkaido.jp",
		reversed: "pj.odiakkoh.orohib"
	},
	{
		suffix: "bike",
		reversed: "ekib"
	},
	{
		suffix: "bilbao.museum",
		reversed: "muesum.oablib"
	},
	{
		suffix: "bill.museum",
		reversed: "muesum.llib"
	},
	{
		suffix: "bindal.no",
		reversed: "on.ladnib"
	},
	{
		suffix: "bing",
		reversed: "gnib"
	},
	{
		suffix: "bingo",
		reversed: "ognib"
	},
	{
		suffix: "bio",
		reversed: "oib"
	},
	{
		suffix: "bio.br",
		reversed: "rb.oib"
	},
	{
		suffix: "bip.sh",
		reversed: "hs.pib"
	},
	{
		suffix: "bir.ru",
		reversed: "ur.rib"
	},
	{
		suffix: "biratori.hokkaido.jp",
		reversed: "pj.odiakkoh.irotarib"
	},
	{
		suffix: "birdart.museum",
		reversed: "muesum.tradrib"
	},
	{
		suffix: "birkenes.no",
		reversed: "on.senekrib"
	},
	{
		suffix: "birthplace.museum",
		reversed: "muesum.ecalphtrib"
	},
	{
		suffix: "bitbridge.net",
		reversed: "ten.egdirbtib"
	},
	{
		suffix: "bitbucket.io",
		reversed: "oi.tekcubtib"
	},
	{
		suffix: "bitter.jp",
		reversed: "pj.rettib"
	},
	{
		suffix: "biz",
		reversed: "zib"
	},
	{
		suffix: "biz.at",
		reversed: "ta.zib"
	},
	{
		suffix: "biz.az",
		reversed: "za.zib"
	},
	{
		suffix: "biz.bb",
		reversed: "bb.zib"
	},
	{
		suffix: "biz.cy",
		reversed: "yc.zib"
	},
	{
		suffix: "biz.dk",
		reversed: "kd.zib"
	},
	{
		suffix: "biz.et",
		reversed: "te.zib"
	},
	{
		suffix: "biz.fj",
		reversed: "jf.zib"
	},
	{
		suffix: "biz.gl",
		reversed: "lg.zib"
	},
	{
		suffix: "biz.id",
		reversed: "di.zib"
	},
	{
		suffix: "biz.in",
		reversed: "ni.zib"
	},
	{
		suffix: "biz.ki",
		reversed: "ik.zib"
	},
	{
		suffix: "biz.ls",
		reversed: "sl.zib"
	},
	{
		suffix: "biz.mv",
		reversed: "vm.zib"
	},
	{
		suffix: "biz.mw",
		reversed: "wm.zib"
	},
	{
		suffix: "biz.my",
		reversed: "ym.zib"
	},
	{
		suffix: "biz.ni",
		reversed: "in.zib"
	},
	{
		suffix: "biz.nr",
		reversed: "rn.zib"
	},
	{
		suffix: "biz.pk",
		reversed: "kp.zib"
	},
	{
		suffix: "biz.pl",
		reversed: "lp.zib"
	},
	{
		suffix: "biz.pr",
		reversed: "rp.zib"
	},
	{
		suffix: "biz.ss",
		reversed: "ss.zib"
	},
	{
		suffix: "biz.tj",
		reversed: "jt.zib"
	},
	{
		suffix: "biz.tr",
		reversed: "rt.zib"
	},
	{
		suffix: "biz.tt",
		reversed: "tt.zib"
	},
	{
		suffix: "biz.ua",
		reversed: "au.zib"
	},
	{
		suffix: "biz.vn",
		reversed: "nv.zib"
	},
	{
		suffix: "biz.wf",
		reversed: "fw.zib"
	},
	{
		suffix: "biz.zm",
		reversed: "mz.zib"
	},
	{
		suffix: "bizen.okayama.jp",
		reversed: "pj.amayako.nezib"
	},
	{
		suffix: "bj",
		reversed: "jb"
	},
	{
		suffix: "bj.cn",
		reversed: "nc.jb"
	},
	{
		suffix: "bjarkoy.no",
		reversed: "on.yokrajb"
	},
	{
		suffix: "bjarkøy.no",
		reversed: "on.ayf-ykrajb--nx"
	},
	{
		suffix: "bjerkreim.no",
		reversed: "on.mierkrejb"
	},
	{
		suffix: "bjugn.no",
		reversed: "on.ngujb"
	},
	{
		suffix: "bl.it",
		reversed: "ti.lb"
	},
	{
		suffix: "black",
		reversed: "kcalb"
	},
	{
		suffix: "blackbaudcdn.net",
		reversed: "ten.ndcduabkcalb"
	},
	{
		suffix: "blackfriday",
		reversed: "yadirfkcalb"
	},
	{
		suffix: "blockbuster",
		reversed: "retsubkcolb"
	},
	{
		suffix: "blog",
		reversed: "golb"
	},
	{
		suffix: "blog.bo",
		reversed: "ob.golb"
	},
	{
		suffix: "blog.br",
		reversed: "rb.golb"
	},
	{
		suffix: "blog.gt",
		reversed: "tg.golb"
	},
	{
		suffix: "blog.kg",
		reversed: "gk.golb"
	},
	{
		suffix: "blog.vu",
		reversed: "uv.golb"
	},
	{
		suffix: "blogdns.com",
		reversed: "moc.sndgolb"
	},
	{
		suffix: "blogdns.net",
		reversed: "ten.sndgolb"
	},
	{
		suffix: "blogdns.org",
		reversed: "gro.sndgolb"
	},
	{
		suffix: "blogsite.org",
		reversed: "gro.etisgolb"
	},
	{
		suffix: "blogsite.xyz",
		reversed: "zyx.etisgolb"
	},
	{
		suffix: "blogspot.ae",
		reversed: "ea.topsgolb"
	},
	{
		suffix: "blogspot.al",
		reversed: "la.topsgolb"
	},
	{
		suffix: "blogspot.am",
		reversed: "ma.topsgolb"
	},
	{
		suffix: "blogspot.ba",
		reversed: "ab.topsgolb"
	},
	{
		suffix: "blogspot.be",
		reversed: "eb.topsgolb"
	},
	{
		suffix: "blogspot.bg",
		reversed: "gb.topsgolb"
	},
	{
		suffix: "blogspot.bj",
		reversed: "jb.topsgolb"
	},
	{
		suffix: "blogspot.ca",
		reversed: "ac.topsgolb"
	},
	{
		suffix: "blogspot.cf",
		reversed: "fc.topsgolb"
	},
	{
		suffix: "blogspot.ch",
		reversed: "hc.topsgolb"
	},
	{
		suffix: "blogspot.cl",
		reversed: "lc.topsgolb"
	},
	{
		suffix: "blogspot.co.at",
		reversed: "ta.oc.topsgolb"
	},
	{
		suffix: "blogspot.co.id",
		reversed: "di.oc.topsgolb"
	},
	{
		suffix: "blogspot.co.il",
		reversed: "li.oc.topsgolb"
	},
	{
		suffix: "blogspot.co.ke",
		reversed: "ek.oc.topsgolb"
	},
	{
		suffix: "blogspot.co.nz",
		reversed: "zn.oc.topsgolb"
	},
	{
		suffix: "blogspot.co.uk",
		reversed: "ku.oc.topsgolb"
	},
	{
		suffix: "blogspot.co.za",
		reversed: "az.oc.topsgolb"
	},
	{
		suffix: "blogspot.com",
		reversed: "moc.topsgolb"
	},
	{
		suffix: "blogspot.com.ar",
		reversed: "ra.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.au",
		reversed: "ua.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.br",
		reversed: "rb.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.by",
		reversed: "yb.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.co",
		reversed: "oc.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.cy",
		reversed: "yc.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.ee",
		reversed: "ee.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.eg",
		reversed: "ge.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.es",
		reversed: "se.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.mt",
		reversed: "tm.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.ng",
		reversed: "gn.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.tr",
		reversed: "rt.moc.topsgolb"
	},
	{
		suffix: "blogspot.com.uy",
		reversed: "yu.moc.topsgolb"
	},
	{
		suffix: "blogspot.cv",
		reversed: "vc.topsgolb"
	},
	{
		suffix: "blogspot.cz",
		reversed: "zc.topsgolb"
	},
	{
		suffix: "blogspot.de",
		reversed: "ed.topsgolb"
	},
	{
		suffix: "blogspot.dk",
		reversed: "kd.topsgolb"
	},
	{
		suffix: "blogspot.fi",
		reversed: "if.topsgolb"
	},
	{
		suffix: "blogspot.fr",
		reversed: "rf.topsgolb"
	},
	{
		suffix: "blogspot.gr",
		reversed: "rg.topsgolb"
	},
	{
		suffix: "blogspot.hk",
		reversed: "kh.topsgolb"
	},
	{
		suffix: "blogspot.hr",
		reversed: "rh.topsgolb"
	},
	{
		suffix: "blogspot.hu",
		reversed: "uh.topsgolb"
	},
	{
		suffix: "blogspot.ie",
		reversed: "ei.topsgolb"
	},
	{
		suffix: "blogspot.in",
		reversed: "ni.topsgolb"
	},
	{
		suffix: "blogspot.is",
		reversed: "si.topsgolb"
	},
	{
		suffix: "blogspot.it",
		reversed: "ti.topsgolb"
	},
	{
		suffix: "blogspot.jp",
		reversed: "pj.topsgolb"
	},
	{
		suffix: "blogspot.kr",
		reversed: "rk.topsgolb"
	},
	{
		suffix: "blogspot.li",
		reversed: "il.topsgolb"
	},
	{
		suffix: "blogspot.lt",
		reversed: "tl.topsgolb"
	},
	{
		suffix: "blogspot.lu",
		reversed: "ul.topsgolb"
	},
	{
		suffix: "blogspot.md",
		reversed: "dm.topsgolb"
	},
	{
		suffix: "blogspot.mk",
		reversed: "km.topsgolb"
	},
	{
		suffix: "blogspot.mr",
		reversed: "rm.topsgolb"
	},
	{
		suffix: "blogspot.mx",
		reversed: "xm.topsgolb"
	},
	{
		suffix: "blogspot.my",
		reversed: "ym.topsgolb"
	},
	{
		suffix: "blogspot.nl",
		reversed: "ln.topsgolb"
	},
	{
		suffix: "blogspot.no",
		reversed: "on.topsgolb"
	},
	{
		suffix: "blogspot.pe",
		reversed: "ep.topsgolb"
	},
	{
		suffix: "blogspot.pt",
		reversed: "tp.topsgolb"
	},
	{
		suffix: "blogspot.qa",
		reversed: "aq.topsgolb"
	},
	{
		suffix: "blogspot.re",
		reversed: "er.topsgolb"
	},
	{
		suffix: "blogspot.ro",
		reversed: "or.topsgolb"
	},
	{
		suffix: "blogspot.rs",
		reversed: "sr.topsgolb"
	},
	{
		suffix: "blogspot.ru",
		reversed: "ur.topsgolb"
	},
	{
		suffix: "blogspot.se",
		reversed: "es.topsgolb"
	},
	{
		suffix: "blogspot.sg",
		reversed: "gs.topsgolb"
	},
	{
		suffix: "blogspot.si",
		reversed: "is.topsgolb"
	},
	{
		suffix: "blogspot.sk",
		reversed: "ks.topsgolb"
	},
	{
		suffix: "blogspot.sn",
		reversed: "ns.topsgolb"
	},
	{
		suffix: "blogspot.td",
		reversed: "dt.topsgolb"
	},
	{
		suffix: "blogspot.tw",
		reversed: "wt.topsgolb"
	},
	{
		suffix: "blogspot.ug",
		reversed: "gu.topsgolb"
	},
	{
		suffix: "blogspot.vn",
		reversed: "nv.topsgolb"
	},
	{
		suffix: "blogsyte.com",
		reversed: "moc.etysgolb"
	},
	{
		suffix: "bloomberg",
		reversed: "grebmoolb"
	},
	{
		suffix: "bloxcms.com",
		reversed: "moc.smcxolb"
	},
	{
		suffix: "blue",
		reversed: "eulb"
	},
	{
		suffix: "bluebite.io",
		reversed: "oi.etibeulb"
	},
	{
		suffix: "blush.jp",
		reversed: "pj.hsulb"
	},
	{
		suffix: "bm",
		reversed: "mb"
	},
	{
		suffix: "bmd.br",
		reversed: "rb.dmb"
	},
	{
		suffix: "bmoattachments.org",
		reversed: "gro.stnemhcattaomb"
	},
	{
		suffix: "bms",
		reversed: "smb"
	},
	{
		suffix: "bmw",
		reversed: "wmb"
	},
	{
		suffix: "bn",
		reversed: "nb"
	},
	{
		suffix: "bn.it",
		reversed: "ti.nb"
	},
	{
		suffix: "bnpparibas",
		reversed: "sabirappnb"
	},
	{
		suffix: "bnr.la",
		reversed: "al.rnb"
	},
	{
		suffix: "bo",
		reversed: "ob"
	},
	{
		suffix: "bo.it",
		reversed: "ti.ob"
	},
	{
		suffix: "bo.nordland.no",
		reversed: "on.dnaldron.ob"
	},
	{
		suffix: "bo.telemark.no",
		reversed: "on.kramelet.ob"
	},
	{
		suffix: "boats",
		reversed: "staob"
	},
	{
		suffix: "boavista.br",
		reversed: "rb.atsivaob"
	},
	{
		suffix: "bodo.no",
		reversed: "on.odob"
	},
	{
		suffix: "bodø.no",
		reversed: "on.an2-dob--nx"
	},
	{
		suffix: "boehringer",
		reversed: "regnirheob"
	},
	{
		suffix: "bofa",
		reversed: "afob"
	},
	{
		suffix: "bokn.no",
		reversed: "on.nkob"
	},
	{
		suffix: "boldlygoingnowhere.org",
		reversed: "gro.erehwongniogyldlob"
	},
	{
		suffix: "boleslawiec.pl",
		reversed: "lp.ceiwalselob"
	},
	{
		suffix: "bolivia.bo",
		reversed: "ob.aivilob"
	},
	{
		suffix: "bologna.it",
		reversed: "ti.angolob"
	},
	{
		suffix: "bolt.hu",
		reversed: "uh.tlob"
	},
	{
		suffix: "bolzano-altoadige.it",
		reversed: "ti.egidaotla-onazlob"
	},
	{
		suffix: "bolzano.it",
		reversed: "ti.onazlob"
	},
	{
		suffix: "bom",
		reversed: "mob"
	},
	{
		suffix: "bomlo.no",
		reversed: "on.olmob"
	},
	{
		suffix: "bond",
		reversed: "dnob"
	},
	{
		suffix: "bonn.museum",
		reversed: "muesum.nnob"
	},
	{
		suffix: "boo",
		reversed: "oob"
	},
	{
		suffix: "boo.jp",
		reversed: "pj.oob"
	},
	{
		suffix: "book",
		reversed: "koob"
	},
	{
		suffix: "booking",
		reversed: "gnikoob"
	},
	{
		suffix: "bookonline.app",
		reversed: "ppa.enilnokoob"
	},
	{
		suffix: "boomla.net",
		reversed: "ten.almoob"
	},
	{
		suffix: "bosch",
		reversed: "hcsob"
	},
	{
		suffix: "bostik",
		reversed: "kitsob"
	},
	{
		suffix: "boston",
		reversed: "notsob"
	},
	{
		suffix: "boston.museum",
		reversed: "muesum.notsob"
	},
	{
		suffix: "bot",
		reversed: "tob"
	},
	{
		suffix: "botanical.museum",
		reversed: "muesum.lacinatob"
	},
	{
		suffix: "botanicalgarden.museum",
		reversed: "muesum.nedraglacinatob"
	},
	{
		suffix: "botanicgarden.museum",
		reversed: "muesum.nedragcinatob"
	},
	{
		suffix: "botany.museum",
		reversed: "muesum.ynatob"
	},
	{
		suffix: "bounceme.net",
		reversed: "ten.emecnuob"
	},
	{
		suffix: "bounty-full.com",
		reversed: "moc.lluf-ytnuob"
	},
	{
		suffix: "boutique",
		reversed: "euqituob"
	},
	{
		suffix: "boutir.com",
		reversed: "moc.rituob"
	},
	{
		suffix: "box",
		reversed: "xob"
	},
	{
		suffix: "boxfuse.io",
		reversed: "oi.esufxob"
	},
	{
		suffix: "boy.jp",
		reversed: "pj.yob"
	},
	{
		suffix: "boyfriend.jp",
		reversed: "pj.dneirfyob"
	},
	{
		suffix: "bozen-sudtirol.it",
		reversed: "ti.loritdus-nezob"
	},
	{
		suffix: "bozen-suedtirol.it",
		reversed: "ti.loritdeus-nezob"
	},
	{
		suffix: "bozen-südtirol.it",
		reversed: "ti.bo2-loritds-nezob--nx"
	},
	{
		suffix: "bozen.it",
		reversed: "ti.nezob"
	},
	{
		suffix: "bplaced.com",
		reversed: "moc.decalpb"
	},
	{
		suffix: "bplaced.de",
		reversed: "ed.decalpb"
	},
	{
		suffix: "bplaced.net",
		reversed: "ten.decalpb"
	},
	{
		suffix: "br",
		reversed: "rb"
	},
	{
		suffix: "br.com",
		reversed: "moc.rb"
	},
	{
		suffix: "br.it",
		reversed: "ti.rb"
	},
	{
		suffix: "bradesco",
		reversed: "ocsedarb"
	},
	{
		suffix: "brand.se",
		reversed: "es.dnarb"
	},
	{
		suffix: "brandywinevalley.museum",
		reversed: "muesum.yellaveniwydnarb"
	},
	{
		suffix: "brasil.museum",
		reversed: "muesum.lisarb"
	},
	{
		suffix: "brasilia.me",
		reversed: "em.ailisarb"
	},
	{
		suffix: "bremanger.no",
		reversed: "on.regnamerb"
	},
	{
		suffix: "brescia.it",
		reversed: "ti.aicserb"
	},
	{
		suffix: "bridgestone",
		reversed: "enotsegdirb"
	},
	{
		suffix: "brindisi.it",
		reversed: "ti.isidnirb"
	},
	{
		suffix: "bristol.museum",
		reversed: "muesum.lotsirb"
	},
	{
		suffix: "british.museum",
		reversed: "muesum.hsitirb"
	},
	{
		suffix: "britishcolumbia.museum",
		reversed: "muesum.aibmulochsitirb"
	},
	{
		suffix: "broadcast.museum",
		reversed: "muesum.tsacdaorb"
	},
	{
		suffix: "broadway",
		reversed: "yawdaorb"
	},
	{
		suffix: "broke-it.net",
		reversed: "ten.ti-ekorb"
	},
	{
		suffix: "broker",
		reversed: "rekorb"
	},
	{
		suffix: "broker.aero",
		reversed: "orea.rekorb"
	},
	{
		suffix: "bronnoy.no",
		reversed: "on.yonnorb"
	},
	{
		suffix: "bronnoysund.no",
		reversed: "on.dnusyonnorb"
	},
	{
		suffix: "brother",
		reversed: "rehtorb"
	},
	{
		suffix: "browsersafetymark.io",
		reversed: "oi.kramytefasresworb"
	},
	{
		suffix: "brumunddal.no",
		reversed: "on.laddnumurb"
	},
	{
		suffix: "brunel.museum",
		reversed: "muesum.lenurb"
	},
	{
		suffix: "brussel.museum",
		reversed: "muesum.lessurb"
	},
	{
		suffix: "brussels",
		reversed: "slessurb"
	},
	{
		suffix: "brussels.museum",
		reversed: "muesum.slessurb"
	},
	{
		suffix: "bruxelles.museum",
		reversed: "muesum.sellexurb"
	},
	{
		suffix: "bryansk.su",
		reversed: "us.ksnayrb"
	},
	{
		suffix: "bryne.no",
		reversed: "on.enyrb"
	},
	{
		suffix: "brønnøy.no",
		reversed: "on.cauw-ynnrb--nx"
	},
	{
		suffix: "brønnøysund.no",
		reversed: "on.ca8m-dnusynnrb--nx"
	},
	{
		suffix: "bs",
		reversed: "sb"
	},
	{
		suffix: "bs.it",
		reversed: "ti.sb"
	},
	{
		suffix: "bsb.br",
		reversed: "rb.bsb"
	},
	{
		suffix: "bss.design",
		reversed: "ngised.ssb"
	},
	{
		suffix: "bt",
		reversed: "tb"
	},
	{
		suffix: "bt.it",
		reversed: "ti.tb"
	},
	{
		suffix: "bu.no",
		reversed: "on.ub"
	},
	{
		suffix: "budejju.no",
		reversed: "on.ujjedub"
	},
	{
		suffix: "build",
		reversed: "dliub"
	},
	{
		suffix: "builders",
		reversed: "sredliub"
	},
	{
		suffix: "building.museum",
		reversed: "muesum.gnidliub"
	},
	{
		suffix: "builtwithdark.com",
		reversed: "moc.kradhtiwtliub"
	},
	{
		suffix: "bukhara.su",
		reversed: "us.arahkub"
	},
	{
		suffix: "bulsan-sudtirol.it",
		reversed: "ti.loritdus-naslub"
	},
	{
		suffix: "bulsan-suedtirol.it",
		reversed: "ti.loritdeus-naslub"
	},
	{
		suffix: "bulsan-südtirol.it",
		reversed: "ti.bsn-loritds-naslub--nx"
	},
	{
		suffix: "bulsan.it",
		reversed: "ti.naslub"
	},
	{
		suffix: "bungoono.oita.jp",
		reversed: "pj.atio.onoognub"
	},
	{
		suffix: "bungotakada.oita.jp",
		reversed: "pj.atio.adakatognub"
	},
	{
		suffix: "bunkyo.tokyo.jp",
		reversed: "pj.oykot.oyknub"
	},
	{
		suffix: "burghof.museum",
		reversed: "muesum.fohgrub"
	},
	{
		suffix: "bus.museum",
		reversed: "muesum.sub"
	},
	{
		suffix: "busan.kr",
		reversed: "rk.nasub"
	},
	{
		suffix: "bushey.museum",
		reversed: "muesum.yehsub"
	},
	{
		suffix: "business",
		reversed: "ssenisub"
	},
	{
		suffix: "business.in",
		reversed: "ni.ssenisub"
	},
	{
		suffix: "but.jp",
		reversed: "pj.tub"
	},
	{
		suffix: "buy",
		reversed: "yub"
	},
	{
		suffix: "buyshop.jp",
		reversed: "pj.pohsyub"
	},
	{
		suffix: "buyshouses.net",
		reversed: "ten.sesuohsyub"
	},
	{
		suffix: "buzen.fukuoka.jp",
		reversed: "pj.akoukuf.nezub"
	},
	{
		suffix: "buzz",
		reversed: "zzub"
	},
	{
		suffix: "bv",
		reversed: "vb"
	},
	{
		suffix: "bw",
		reversed: "wb"
	},
	{
		suffix: "by",
		reversed: "yb"
	},
	{
		suffix: "bydgoszcz.pl",
		reversed: "lp.zczsogdyb"
	},
	{
		suffix: "byen.site",
		reversed: "etis.neyb"
	},
	{
		suffix: "bygland.no",
		reversed: "on.dnalgyb"
	},
	{
		suffix: "bykle.no",
		reversed: "on.elkyb"
	},
	{
		suffix: "bytom.pl",
		reversed: "lp.motyb"
	},
	{
		suffix: "bz",
		reversed: "zb"
	},
	{
		suffix: "bz.it",
		reversed: "ti.zb"
	},
	{
		suffix: "bzh",
		reversed: "hzb"
	},
	{
		suffix: "báhcavuotna.no",
		reversed: "on.a4s-antouvachb--nx"
	},
	{
		suffix: "báhccavuotna.no",
		reversed: "on.a7k-antouvacchb--nx"
	},
	{
		suffix: "báidár.no",
		reversed: "on.can5-rdib--nx"
	},
	{
		suffix: "bájddar.no",
		reversed: "on.atp-raddjb--nx"
	},
	{
		suffix: "bálát.no",
		reversed: "on.bale-tlb--nx"
	},
	{
		suffix: "bådåddjå.no",
		reversed: "on.dbarm-jdddb--nx"
	},
	{
		suffix: "båtsfjord.no",
		reversed: "on.az9-drojfstb--nx"
	},
	{
		suffix: "bærum.no",
		reversed: "on.aov-murb--nx"
	},
	{
		suffix: "bø.nordland.no",
		reversed: "on.dnaldron.ag5-b--nx"
	},
	{
		suffix: "bø.telemark.no",
		reversed: "on.kramelet.ag5-b--nx"
	},
	{
		suffix: "bømlo.no",
		reversed: "on.arg-olmb--nx"
	},
	{
		suffix: "c.bg",
		reversed: "gb.c"
	},
	{
		suffix: "c.cdn77.org",
		reversed: "gro.77ndc.c"
	},
	{
		suffix: "c.la",
		reversed: "al.c"
	},
	{
		suffix: "c.se",
		reversed: "es.c"
	},
	{
		suffix: "c66.me",
		reversed: "em.66c"
	},
	{
		suffix: "ca",
		reversed: "ac"
	},
	{
		suffix: "ca-central-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-lartnec-ac"
	},
	{
		suffix: "ca.eu.org",
		reversed: "gro.ue.ac"
	},
	{
		suffix: "ca.in",
		reversed: "ni.ac"
	},
	{
		suffix: "ca.it",
		reversed: "ti.ac"
	},
	{
		suffix: "ca.na",
		reversed: "an.ac"
	},
	{
		suffix: "ca.reclaim.cloud",
		reversed: "duolc.mialcer.ac"
	},
	{
		suffix: "ca.us",
		reversed: "su.ac"
	},
	{
		suffix: "caa.aero",
		reversed: "orea.aac"
	},
	{
		suffix: "caa.li",
		reversed: "il.aac"
	},
	{
		suffix: "cab",
		reversed: "bac"
	},
	{
		suffix: "cable-modem.org",
		reversed: "gro.medom-elbac"
	},
	{
		suffix: "cadaques.museum",
		reversed: "muesum.seuqadac"
	},
	{
		suffix: "cafe",
		reversed: "efac"
	},
	{
		suffix: "cafjs.com",
		reversed: "moc.sjfac"
	},
	{
		suffix: "cagliari.it",
		reversed: "ti.irailgac"
	},
	{
		suffix: "cahcesuolo.no",
		reversed: "on.olousechac"
	},
	{
		suffix: "cal",
		reversed: "lac"
	},
	{
		suffix: "cal.it",
		reversed: "ti.lac"
	},
	{
		suffix: "calabria.it",
		reversed: "ti.airbalac"
	},
	{
		suffix: "california.museum",
		reversed: "muesum.ainrofilac"
	},
	{
		suffix: "call",
		reversed: "llac"
	},
	{
		suffix: "caltanissetta.it",
		reversed: "ti.attessinatlac"
	},
	{
		suffix: "calvinklein",
		reversed: "nielknivlac"
	},
	{
		suffix: "cam",
		reversed: "mac"
	},
	{
		suffix: "cam.it",
		reversed: "ti.mac"
	},
	{
		suffix: "cambridge.museum",
		reversed: "muesum.egdirbmac"
	},
	{
		suffix: "camdvr.org",
		reversed: "gro.rvdmac"
	},
	{
		suffix: "camera",
		reversed: "aremac"
	},
	{
		suffix: "camp",
		reversed: "pmac"
	},
	{
		suffix: "campaign.gov.uk",
		reversed: "ku.vog.ngiapmac"
	},
	{
		suffix: "campania.it",
		reversed: "ti.ainapmac"
	},
	{
		suffix: "campidano-medio.it",
		reversed: "ti.oidem-onadipmac"
	},
	{
		suffix: "campidanomedio.it",
		reversed: "ti.oidemonadipmac"
	},
	{
		suffix: "campinagrande.br",
		reversed: "rb.ednarganipmac"
	},
	{
		suffix: "campinas.br",
		reversed: "rb.sanipmac"
	},
	{
		suffix: "campobasso.it",
		reversed: "ti.ossabopmac"
	},
	{
		suffix: "can.museum",
		reversed: "muesum.nac"
	},
	{
		suffix: "canada.museum",
		reversed: "muesum.adanac"
	},
	{
		suffix: "candypop.jp",
		reversed: "pj.popydnac"
	},
	{
		suffix: "canon",
		reversed: "nonac"
	},
	{
		suffix: "capebreton.museum",
		reversed: "muesum.noterbepac"
	},
	{
		suffix: "capetown",
		reversed: "nwotepac"
	},
	{
		suffix: "capital",
		reversed: "latipac"
	},
	{
		suffix: "capitalone",
		reversed: "enolatipac"
	},
	{
		suffix: "capoo.jp",
		reversed: "pj.oopac"
	},
	{
		suffix: "car",
		reversed: "rac"
	},
	{
		suffix: "caracal.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.lacarac"
	},
	{
		suffix: "caravan",
		reversed: "navarac"
	},
	{
		suffix: "carbonia-iglesias.it",
		reversed: "ti.saiselgi-ainobrac"
	},
	{
		suffix: "carboniaiglesias.it",
		reversed: "ti.saiselgiainobrac"
	},
	{
		suffix: "cards",
		reversed: "sdrac"
	},
	{
		suffix: "care",
		reversed: "erac"
	},
	{
		suffix: "career",
		reversed: "reerac"
	},
	{
		suffix: "careers",
		reversed: "sreerac"
	},
	{
		suffix: "cargo.aero",
		reversed: "orea.ograc"
	},
	{
		suffix: "carrara-massa.it",
		reversed: "ti.assam-ararrac"
	},
	{
		suffix: "carraramassa.it",
		reversed: "ti.assamararrac"
	},
	{
		suffix: "carrd.co",
		reversed: "oc.drrac"
	},
	{
		suffix: "carrier.museum",
		reversed: "muesum.reirrac"
	},
	{
		suffix: "cars",
		reversed: "srac"
	},
	{
		suffix: "cartoonart.museum",
		reversed: "muesum.tranootrac"
	},
	{
		suffix: "casa",
		reversed: "asac"
	},
	{
		suffix: "casacam.net",
		reversed: "ten.macasac"
	},
	{
		suffix: "casadelamoneda.museum",
		reversed: "muesum.adenomaledasac"
	},
	{
		suffix: "case",
		reversed: "esac"
	},
	{
		suffix: "caserta.it",
		reversed: "ti.atresac"
	},
	{
		suffix: "cash",
		reversed: "hsac"
	},
	{
		suffix: "casino",
		reversed: "onisac"
	},
	{
		suffix: "casino.hu",
		reversed: "uh.onisac"
	},
	{
		suffix: "castle.museum",
		reversed: "muesum.eltsac"
	},
	{
		suffix: "castres.museum",
		reversed: "muesum.sertsac"
	},
	{
		suffix: "cat",
		reversed: "tac"
	},
	{
		suffix: "cat.ax",
		reversed: "xa.tac"
	},
	{
		suffix: "catania.it",
		reversed: "ti.ainatac"
	},
	{
		suffix: "catanzaro.it",
		reversed: "ti.oraznatac"
	},
	{
		suffix: "catering",
		reversed: "gniretac"
	},
	{
		suffix: "catering.aero",
		reversed: "orea.gniretac"
	},
	{
		suffix: "catfood.jp",
		reversed: "pj.dooftac"
	},
	{
		suffix: "catholic",
		reversed: "cilohtac"
	},
	{
		suffix: "catholic.edu.au",
		reversed: "ua.ude.cilohtac"
	},
	{
		suffix: "caxias.br",
		reversed: "rb.saixac"
	},
	{
		suffix: "cb.it",
		reversed: "ti.bc"
	},
	{
		suffix: "cba",
		reversed: "abc"
	},
	{
		suffix: "cbg.ru",
		reversed: "ur.gbc"
	},
	{
		suffix: "cbn",
		reversed: "nbc"
	},
	{
		suffix: "cbre",
		reversed: "erbc"
	},
	{
		suffix: "cbs",
		reversed: "sbc"
	},
	{
		suffix: "cc",
		reversed: "cc"
	},
	{
		suffix: "cc.ak.us",
		reversed: "su.ka.cc"
	},
	{
		suffix: "cc.al.us",
		reversed: "su.la.cc"
	},
	{
		suffix: "cc.ar.us",
		reversed: "su.ra.cc"
	},
	{
		suffix: "cc.as.us",
		reversed: "su.sa.cc"
	},
	{
		suffix: "cc.az.us",
		reversed: "su.za.cc"
	},
	{
		suffix: "cc.ca.us",
		reversed: "su.ac.cc"
	},
	{
		suffix: "cc.co.us",
		reversed: "su.oc.cc"
	},
	{
		suffix: "cc.ct.us",
		reversed: "su.tc.cc"
	},
	{
		suffix: "cc.dc.us",
		reversed: "su.cd.cc"
	},
	{
		suffix: "cc.de.us",
		reversed: "su.ed.cc"
	},
	{
		suffix: "cc.fl.us",
		reversed: "su.lf.cc"
	},
	{
		suffix: "cc.ga.us",
		reversed: "su.ag.cc"
	},
	{
		suffix: "cc.gu.us",
		reversed: "su.ug.cc"
	},
	{
		suffix: "cc.hi.us",
		reversed: "su.ih.cc"
	},
	{
		suffix: "cc.hn",
		reversed: "nh.cc"
	},
	{
		suffix: "cc.ia.us",
		reversed: "su.ai.cc"
	},
	{
		suffix: "cc.id.us",
		reversed: "su.di.cc"
	},
	{
		suffix: "cc.il.us",
		reversed: "su.li.cc"
	},
	{
		suffix: "cc.in.us",
		reversed: "su.ni.cc"
	},
	{
		suffix: "cc.ks.us",
		reversed: "su.sk.cc"
	},
	{
		suffix: "cc.ky.us",
		reversed: "su.yk.cc"
	},
	{
		suffix: "cc.la.us",
		reversed: "su.al.cc"
	},
	{
		suffix: "cc.ma.us",
		reversed: "su.am.cc"
	},
	{
		suffix: "cc.md.us",
		reversed: "su.dm.cc"
	},
	{
		suffix: "cc.me.us",
		reversed: "su.em.cc"
	},
	{
		suffix: "cc.mi.us",
		reversed: "su.im.cc"
	},
	{
		suffix: "cc.mn.us",
		reversed: "su.nm.cc"
	},
	{
		suffix: "cc.mo.us",
		reversed: "su.om.cc"
	},
	{
		suffix: "cc.ms.us",
		reversed: "su.sm.cc"
	},
	{
		suffix: "cc.mt.us",
		reversed: "su.tm.cc"
	},
	{
		suffix: "cc.na",
		reversed: "an.cc"
	},
	{
		suffix: "cc.nc.us",
		reversed: "su.cn.cc"
	},
	{
		suffix: "cc.nd.us",
		reversed: "su.dn.cc"
	},
	{
		suffix: "cc.ne.us",
		reversed: "su.en.cc"
	},
	{
		suffix: "cc.nh.us",
		reversed: "su.hn.cc"
	},
	{
		suffix: "cc.nj.us",
		reversed: "su.jn.cc"
	},
	{
		suffix: "cc.nm.us",
		reversed: "su.mn.cc"
	},
	{
		suffix: "cc.nv.us",
		reversed: "su.vn.cc"
	},
	{
		suffix: "cc.ny.us",
		reversed: "su.yn.cc"
	},
	{
		suffix: "cc.oh.us",
		reversed: "su.ho.cc"
	},
	{
		suffix: "cc.ok.us",
		reversed: "su.ko.cc"
	},
	{
		suffix: "cc.or.us",
		reversed: "su.ro.cc"
	},
	{
		suffix: "cc.pa.us",
		reversed: "su.ap.cc"
	},
	{
		suffix: "cc.pr.us",
		reversed: "su.rp.cc"
	},
	{
		suffix: "cc.ri.us",
		reversed: "su.ir.cc"
	},
	{
		suffix: "cc.sc.us",
		reversed: "su.cs.cc"
	},
	{
		suffix: "cc.sd.us",
		reversed: "su.ds.cc"
	},
	{
		suffix: "cc.tn.us",
		reversed: "su.nt.cc"
	},
	{
		suffix: "cc.tx.us",
		reversed: "su.xt.cc"
	},
	{
		suffix: "cc.ua",
		reversed: "au.cc"
	},
	{
		suffix: "cc.ut.us",
		reversed: "su.tu.cc"
	},
	{
		suffix: "cc.va.us",
		reversed: "su.av.cc"
	},
	{
		suffix: "cc.vi.us",
		reversed: "su.iv.cc"
	},
	{
		suffix: "cc.vt.us",
		reversed: "su.tv.cc"
	},
	{
		suffix: "cc.wa.us",
		reversed: "su.aw.cc"
	},
	{
		suffix: "cc.wi.us",
		reversed: "su.iw.cc"
	},
	{
		suffix: "cc.wv.us",
		reversed: "su.vw.cc"
	},
	{
		suffix: "cc.wy.us",
		reversed: "su.yw.cc"
	},
	{
		suffix: "cci.fr",
		reversed: "rf.icc"
	},
	{
		suffix: "cd",
		reversed: "dc"
	},
	{
		suffix: "cd.eu.org",
		reversed: "gro.ue.dc"
	},
	{
		suffix: "cdn-edges.net",
		reversed: "ten.segde-ndc"
	},
	{
		suffix: "cdn.prod.atlassian-dev.net",
		reversed: "ten.ved-naissalta.dorp.ndc"
	},
	{
		suffix: "cdn77-ssl.net",
		reversed: "ten.lss-77ndc"
	},
	{
		suffix: "ce.gov.br",
		reversed: "rb.vog.ec"
	},
	{
		suffix: "ce.it",
		reversed: "ti.ec"
	},
	{
		suffix: "ce.leg.br",
		reversed: "rb.gel.ec"
	},
	{
		suffix: "cechire.com",
		reversed: "moc.erihcec"
	},
	{
		suffix: "celtic.museum",
		reversed: "muesum.citlec"
	},
	{
		suffix: "center",
		reversed: "retnec"
	},
	{
		suffix: "center.museum",
		reversed: "muesum.retnec"
	},
	{
		suffix: "centralus.azurestaticapps.net",
		reversed: "ten.sppacitatseruza.sulartnec"
	},
	{
		suffix: "ceo",
		reversed: "oec"
	},
	{
		suffix: "cern",
		reversed: "nrec"
	},
	{
		suffix: "certification.aero",
		reversed: "orea.noitacifitrec"
	},
	{
		suffix: "certmgr.org",
		reversed: "gro.rgmtrec"
	},
	{
		suffix: "cesena-forli.it",
		reversed: "ti.ilrof-anesec"
	},
	{
		suffix: "cesena-forlì.it",
		reversed: "ti.bcm-lrof-anesec--nx"
	},
	{
		suffix: "cesenaforli.it",
		reversed: "ti.ilrofanesec"
	},
	{
		suffix: "cesenaforlì.it",
		reversed: "ti.a8i-lrofanesec--nx"
	},
	{
		suffix: "cf",
		reversed: "fc"
	},
	{
		suffix: "cfa",
		reversed: "afc"
	},
	{
		suffix: "cfd",
		reversed: "dfc"
	},
	{
		suffix: "cg",
		reversed: "gc"
	},
	{
		suffix: "ch",
		reversed: "hc"
	},
	{
		suffix: "ch.eu.org",
		reversed: "gro.ue.hc"
	},
	{
		suffix: "ch.it",
		reversed: "ti.hc"
	},
	{
		suffix: "ch.tc",
		reversed: "ct.hc"
	},
	{
		suffix: "ch.trendhosting.cloud",
		reversed: "duolc.gnitsohdnert.hc"
	},
	{
		suffix: "chambagri.fr",
		reversed: "rf.irgabmahc"
	},
	{
		suffix: "championship.aero",
		reversed: "orea.pihsnoipmahc"
	},
	{
		suffix: "chanel",
		reversed: "lenahc"
	},
	{
		suffix: "channel",
		reversed: "lennahc"
	},
	{
		suffix: "channelsdvr.net",
		reversed: "ten.rvdslennahc"
	},
	{
		suffix: "charity",
		reversed: "ytirahc"
	},
	{
		suffix: "charter.aero",
		reversed: "orea.retrahc"
	},
	{
		suffix: "chase",
		reversed: "esahc"
	},
	{
		suffix: "chat",
		reversed: "tahc"
	},
	{
		suffix: "chattanooga.museum",
		reversed: "muesum.agoonattahc"
	},
	{
		suffix: "cheap",
		reversed: "paehc"
	},
	{
		suffix: "cheap.jp",
		reversed: "pj.paehc"
	},
	{
		suffix: "cheltenham.museum",
		reversed: "muesum.mahnetlehc"
	},
	{
		suffix: "cherkassy.ua",
		reversed: "au.yssakrehc"
	},
	{
		suffix: "cherkasy.ua",
		reversed: "au.ysakrehc"
	},
	{
		suffix: "chernigov.ua",
		reversed: "au.voginrehc"
	},
	{
		suffix: "chernihiv.ua",
		reversed: "au.vihinrehc"
	},
	{
		suffix: "chernivtsi.ua",
		reversed: "au.istvinrehc"
	},
	{
		suffix: "chernovtsy.ua",
		reversed: "au.ystvonrehc"
	},
	{
		suffix: "chesapeakebay.museum",
		reversed: "muesum.yabekaepasehc"
	},
	{
		suffix: "chiba.jp",
		reversed: "pj.abihc"
	},
	{
		suffix: "chicago.museum",
		reversed: "muesum.ogacihc"
	},
	{
		suffix: "chicappa.jp",
		reversed: "pj.appacihc"
	},
	{
		suffix: "chichibu.saitama.jp",
		reversed: "pj.amatias.ubihcihc"
	},
	{
		suffix: "chieti.it",
		reversed: "ti.iteihc"
	},
	{
		suffix: "chigasaki.kanagawa.jp",
		reversed: "pj.awaganak.ikasagihc"
	},
	{
		suffix: "chihayaakasaka.osaka.jp",
		reversed: "pj.akaso.akasakaayahihc"
	},
	{
		suffix: "chijiwa.nagasaki.jp",
		reversed: "pj.ikasagan.awijihc"
	},
	{
		suffix: "chikugo.fukuoka.jp",
		reversed: "pj.akoukuf.ogukihc"
	},
	{
		suffix: "chikuho.fukuoka.jp",
		reversed: "pj.akoukuf.ohukihc"
	},
	{
		suffix: "chikuhoku.nagano.jp",
		reversed: "pj.onagan.ukohukihc"
	},
	{
		suffix: "chikujo.fukuoka.jp",
		reversed: "pj.akoukuf.ojukihc"
	},
	{
		suffix: "chikuma.nagano.jp",
		reversed: "pj.onagan.amukihc"
	},
	{
		suffix: "chikusei.ibaraki.jp",
		reversed: "pj.ikarabi.iesukihc"
	},
	{
		suffix: "chikushino.fukuoka.jp",
		reversed: "pj.akoukuf.onihsukihc"
	},
	{
		suffix: "chikuzen.fukuoka.jp",
		reversed: "pj.akoukuf.nezukihc"
	},
	{
		suffix: "children.museum",
		reversed: "muesum.nerdlihc"
	},
	{
		suffix: "childrens.museum",
		reversed: "muesum.snerdlihc"
	},
	{
		suffix: "childrensgarden.museum",
		reversed: "muesum.nedragsnerdlihc"
	},
	{
		suffix: "chillout.jp",
		reversed: "pj.tuollihc"
	},
	{
		suffix: "chimkent.su",
		reversed: "us.tnekmihc"
	},
	{
		suffix: "chino.nagano.jp",
		reversed: "pj.onagan.onihc"
	},
	{
		suffix: "chintai",
		reversed: "iatnihc"
	},
	{
		suffix: "chippubetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebuppihc"
	},
	{
		suffix: "chips.jp",
		reversed: "pj.spihc"
	},
	{
		suffix: "chiropractic.museum",
		reversed: "muesum.citcarporihc"
	},
	{
		suffix: "chirurgiens-dentistes-en-france.fr",
		reversed: "rf.ecnarf-ne-setsitned-sneigrurihc"
	},
	{
		suffix: "chirurgiens-dentistes.fr",
		reversed: "rf.setsitned-sneigrurihc"
	},
	{
		suffix: "chiryu.aichi.jp",
		reversed: "pj.ihcia.uyrihc"
	},
	{
		suffix: "chita.aichi.jp",
		reversed: "pj.ihcia.atihc"
	},
	{
		suffix: "chitose.hokkaido.jp",
		reversed: "pj.odiakkoh.esotihc"
	},
	{
		suffix: "chiyoda.gunma.jp",
		reversed: "pj.amnug.adoyihc"
	},
	{
		suffix: "chiyoda.tokyo.jp",
		reversed: "pj.oykot.adoyihc"
	},
	{
		suffix: "chizu.tottori.jp",
		reversed: "pj.irottot.uzihc"
	},
	{
		suffix: "chocolate.museum",
		reversed: "muesum.etalocohc"
	},
	{
		suffix: "chofu.tokyo.jp",
		reversed: "pj.oykot.ufohc"
	},
	{
		suffix: "chonan.chiba.jp",
		reversed: "pj.abihc.nanohc"
	},
	{
		suffix: "chosei.chiba.jp",
		reversed: "pj.abihc.iesohc"
	},
	{
		suffix: "choshi.chiba.jp",
		reversed: "pj.abihc.ihsohc"
	},
	{
		suffix: "chowder.jp",
		reversed: "pj.redwohc"
	},
	{
		suffix: "choyo.kumamoto.jp",
		reversed: "pj.otomamuk.oyohc"
	},
	{
		suffix: "christiansburg.museum",
		reversed: "muesum.grubsnaitsirhc"
	},
	{
		suffix: "christmas",
		reversed: "samtsirhc"
	},
	{
		suffix: "chrome",
		reversed: "emorhc"
	},
	{
		suffix: "chtr.k12.ma.us",
		reversed: "su.am.21k.rthc"
	},
	{
		suffix: "chu.jp",
		reversed: "pj.uhc"
	},
	{
		suffix: "chungbuk.kr",
		reversed: "rk.kubgnuhc"
	},
	{
		suffix: "chungnam.kr",
		reversed: "rk.mangnuhc"
	},
	{
		suffix: "chuo.chiba.jp",
		reversed: "pj.abihc.ouhc"
	},
	{
		suffix: "chuo.fukuoka.jp",
		reversed: "pj.akoukuf.ouhc"
	},
	{
		suffix: "chuo.osaka.jp",
		reversed: "pj.akaso.ouhc"
	},
	{
		suffix: "chuo.tokyo.jp",
		reversed: "pj.oykot.ouhc"
	},
	{
		suffix: "chuo.yamanashi.jp",
		reversed: "pj.ihsanamay.ouhc"
	},
	{
		suffix: "church",
		reversed: "hcruhc"
	},
	{
		suffix: "ci",
		reversed: "ic"
	},
	{
		suffix: "ci.it",
		reversed: "ti.ic"
	},
	{
		suffix: "ciao.jp",
		reversed: "pj.oaic"
	},
	{
		suffix: "ciencia.bo",
		reversed: "ob.aicneic"
	},
	{
		suffix: "cieszyn.pl",
		reversed: "lp.nyzseic"
	},
	{
		suffix: "cim.br",
		reversed: "rb.mic"
	},
	{
		suffix: "cincinnati.museum",
		reversed: "muesum.itannicnic"
	},
	{
		suffix: "cinema.museum",
		reversed: "muesum.amenic"
	},
	{
		suffix: "cipriani",
		reversed: "inairpic"
	},
	{
		suffix: "circle",
		reversed: "elcric"
	},
	{
		suffix: "circus.museum",
		reversed: "muesum.sucric"
	},
	{
		suffix: "cisco",
		reversed: "ocsic"
	},
	{
		suffix: "ciscofreak.com",
		reversed: "moc.kaerfocsic"
	},
	{
		suffix: "cistron.nl",
		reversed: "ln.nortsic"
	},
	{
		suffix: "citadel",
		reversed: "ledatic"
	},
	{
		suffix: "citi",
		reversed: "itic"
	},
	{
		suffix: "citic",
		reversed: "citic"
	},
	{
		suffix: "city",
		reversed: "ytic"
	},
	{
		suffix: "city.hu",
		reversed: "uh.ytic"
	},
	{
		suffix: "cityeats",
		reversed: "staeytic"
	},
	{
		suffix: "civilaviation.aero",
		reversed: "orea.noitaivalivic"
	},
	{
		suffix: "civilisation.museum",
		reversed: "muesum.noitasilivic"
	},
	{
		suffix: "civilization.museum",
		reversed: "muesum.noitazilivic"
	},
	{
		suffix: "civilwar.museum",
		reversed: "muesum.rawlivic"
	},
	{
		suffix: "ck.ua",
		reversed: "au.kc"
	},
	{
		suffix: "cl",
		reversed: "lc"
	},
	{
		suffix: "cl.it",
		reversed: "ti.lc"
	},
	{
		suffix: "claims",
		reversed: "smialc"
	},
	{
		suffix: "clan.rip",
		reversed: "pir.nalc"
	},
	{
		suffix: "cleaning",
		reversed: "gninaelc"
	},
	{
		suffix: "clerk.app",
		reversed: "ppa.krelc"
	},
	{
		suffix: "clerkstage.app",
		reversed: "ppa.egatskrelc"
	},
	{
		suffix: "cleverapps.io",
		reversed: "oi.spparevelc"
	},
	{
		suffix: "click",
		reversed: "kcilc"
	},
	{
		suffix: "clicketcloud.com",
		reversed: "moc.duolctekcilc"
	},
	{
		suffix: "clickrising.net",
		reversed: "ten.gnisirkcilc"
	},
	{
		suffix: "clinic",
		reversed: "cinilc"
	},
	{
		suffix: "clinique",
		reversed: "euqinilc"
	},
	{
		suffix: "clinton.museum",
		reversed: "muesum.notnilc"
	},
	{
		suffix: "clock.museum",
		reversed: "muesum.kcolc"
	},
	{
		suffix: "clothing",
		reversed: "gnihtolc"
	},
	{
		suffix: "cloud",
		reversed: "duolc"
	},
	{
		suffix: "cloud-fr1.unispace.io",
		reversed: "oi.ecapsinu.1rf-duolc"
	},
	{
		suffix: "cloud.fedoraproject.org",
		reversed: "gro.tcejorparodef.duolc"
	},
	{
		suffix: "cloud.goog",
		reversed: "goog.duolc"
	},
	{
		suffix: "cloud.interhostsolutions.be",
		reversed: "eb.snoitulostsohretni.duolc"
	},
	{
		suffix: "cloud.jelastic.open.tim.it",
		reversed: "ti.mit.nepo.citsalej.duolc"
	},
	{
		suffix: "cloud.nospamproxy.com",
		reversed: "moc.yxorpmapson.duolc"
	},
	{
		suffix: "cloud66.ws",
		reversed: "sw.66duolc"
	},
	{
		suffix: "cloud66.zone",
		reversed: "enoz.66duolc"
	},
	{
		suffix: "cloudaccess.host",
		reversed: "tsoh.sseccaduolc"
	},
	{
		suffix: "cloudaccess.net",
		reversed: "ten.sseccaduolc"
	},
	{
		suffix: "cloudapp.net",
		reversed: "ten.ppaduolc"
	},
	{
		suffix: "cloudapps.digital",
		reversed: "latigid.sppaduolc"
	},
	{
		suffix: "cloudcontrolapp.com",
		reversed: "moc.ppalortnocduolc"
	},
	{
		suffix: "cloudcontrolled.com",
		reversed: "moc.dellortnocduolc"
	},
	{
		suffix: "cloudfront.net",
		reversed: "ten.tnorfduolc"
	},
	{
		suffix: "cloudfunctions.net",
		reversed: "ten.snoitcnufduolc"
	},
	{
		suffix: "cloudjiffy.net",
		reversed: "ten.yffijduolc"
	},
	{
		suffix: "cloudns.asia",
		reversed: "aisa.snduolc"
	},
	{
		suffix: "cloudns.biz",
		reversed: "zib.snduolc"
	},
	{
		suffix: "cloudns.cc",
		reversed: "cc.snduolc"
	},
	{
		suffix: "cloudns.club",
		reversed: "bulc.snduolc"
	},
	{
		suffix: "cloudns.eu",
		reversed: "ue.snduolc"
	},
	{
		suffix: "cloudns.in",
		reversed: "ni.snduolc"
	},
	{
		suffix: "cloudns.info",
		reversed: "ofni.snduolc"
	},
	{
		suffix: "cloudns.org",
		reversed: "gro.snduolc"
	},
	{
		suffix: "cloudns.pro",
		reversed: "orp.snduolc"
	},
	{
		suffix: "cloudns.pw",
		reversed: "wp.snduolc"
	},
	{
		suffix: "cloudns.us",
		reversed: "su.snduolc"
	},
	{
		suffix: "cloudsite.builders",
		reversed: "sredliub.etisduolc"
	},
	{
		suffix: "cloudycluster.net",
		reversed: "ten.retsulcyduolc"
	},
	{
		suffix: "club",
		reversed: "bulc"
	},
	{
		suffix: "club.aero",
		reversed: "orea.bulc"
	},
	{
		suffix: "club.tw",
		reversed: "wt.bulc"
	},
	{
		suffix: "clubmed",
		reversed: "dembulc"
	},
	{
		suffix: "cm",
		reversed: "mc"
	},
	{
		suffix: "cn",
		reversed: "nc"
	},
	{
		suffix: "cn-north-1.eb.amazonaws.com.cn",
		reversed: "nc.moc.swanozama.be.1-htron-nc"
	},
	{
		suffix: "cn-northwest-1.eb.amazonaws.com.cn",
		reversed: "nc.moc.swanozama.be.1-tsewhtron-nc"
	},
	{
		suffix: "cn.com",
		reversed: "moc.nc"
	},
	{
		suffix: "cn.eu.org",
		reversed: "gro.ue.nc"
	},
	{
		suffix: "cn.in",
		reversed: "ni.nc"
	},
	{
		suffix: "cn.it",
		reversed: "ti.nc"
	},
	{
		suffix: "cn.ua",
		reversed: "au.nc"
	},
	{
		suffix: "cn.vu",
		reversed: "uv.nc"
	},
	{
		suffix: "cng.br",
		reversed: "rb.gnc"
	},
	{
		suffix: "cnpy.gdn",
		reversed: "ndg.ypnc"
	},
	{
		suffix: "cnt.br",
		reversed: "rb.tnc"
	},
	{
		suffix: "co",
		reversed: "oc"
	},
	{
		suffix: "co.ae",
		reversed: "ea.oc"
	},
	{
		suffix: "co.ag",
		reversed: "ga.oc"
	},
	{
		suffix: "co.am",
		reversed: "ma.oc"
	},
	{
		suffix: "co.ao",
		reversed: "oa.oc"
	},
	{
		suffix: "co.at",
		reversed: "ta.oc"
	},
	{
		suffix: "co.bb",
		reversed: "bb.oc"
	},
	{
		suffix: "co.bi",
		reversed: "ib.oc"
	},
	{
		suffix: "co.bn",
		reversed: "nb.oc"
	},
	{
		suffix: "co.business",
		reversed: "ssenisub.oc"
	},
	{
		suffix: "co.bw",
		reversed: "wb.oc"
	},
	{
		suffix: "co.ca",
		reversed: "ac.oc"
	},
	{
		suffix: "co.ci",
		reversed: "ic.oc"
	},
	{
		suffix: "co.cl",
		reversed: "lc.oc"
	},
	{
		suffix: "co.cm",
		reversed: "mc.oc"
	},
	{
		suffix: "co.com",
		reversed: "moc.oc"
	},
	{
		suffix: "co.cr",
		reversed: "rc.oc"
	},
	{
		suffix: "co.cz",
		reversed: "zc.oc"
	},
	{
		suffix: "co.dk",
		reversed: "kd.oc"
	},
	{
		suffix: "co.education",
		reversed: "noitacude.oc"
	},
	{
		suffix: "co.events",
		reversed: "stneve.oc"
	},
	{
		suffix: "co.financial",
		reversed: "laicnanif.oc"
	},
	{
		suffix: "co.gg",
		reversed: "gg.oc"
	},
	{
		suffix: "co.gl",
		reversed: "lg.oc"
	},
	{
		suffix: "co.gy",
		reversed: "yg.oc"
	},
	{
		suffix: "co.hu",
		reversed: "uh.oc"
	},
	{
		suffix: "co.id",
		reversed: "di.oc"
	},
	{
		suffix: "co.il",
		reversed: "li.oc"
	},
	{
		suffix: "co.im",
		reversed: "mi.oc"
	},
	{
		suffix: "co.in",
		reversed: "ni.oc"
	},
	{
		suffix: "co.ir",
		reversed: "ri.oc"
	},
	{
		suffix: "co.it",
		reversed: "ti.oc"
	},
	{
		suffix: "co.je",
		reversed: "ej.oc"
	},
	{
		suffix: "co.jp",
		reversed: "pj.oc"
	},
	{
		suffix: "co.ke",
		reversed: "ek.oc"
	},
	{
		suffix: "co.kr",
		reversed: "rk.oc"
	},
	{
		suffix: "co.krd",
		reversed: "drk.oc"
	},
	{
		suffix: "co.lc",
		reversed: "cl.oc"
	},
	{
		suffix: "co.ls",
		reversed: "sl.oc"
	},
	{
		suffix: "co.ma",
		reversed: "am.oc"
	},
	{
		suffix: "co.me",
		reversed: "em.oc"
	},
	{
		suffix: "co.mg",
		reversed: "gm.oc"
	},
	{
		suffix: "co.mu",
		reversed: "um.oc"
	},
	{
		suffix: "co.mw",
		reversed: "wm.oc"
	},
	{
		suffix: "co.mz",
		reversed: "zm.oc"
	},
	{
		suffix: "co.na",
		reversed: "an.oc"
	},
	{
		suffix: "co.network",
		reversed: "krowten.oc"
	},
	{
		suffix: "co.ni",
		reversed: "in.oc"
	},
	{
		suffix: "co.nl",
		reversed: "ln.oc"
	},
	{
		suffix: "co.no",
		reversed: "on.oc"
	},
	{
		suffix: "co.nz",
		reversed: "zn.oc"
	},
	{
		suffix: "co.om",
		reversed: "mo.oc"
	},
	{
		suffix: "co.pl",
		reversed: "lp.oc"
	},
	{
		suffix: "co.place",
		reversed: "ecalp.oc"
	},
	{
		suffix: "co.pn",
		reversed: "np.oc"
	},
	{
		suffix: "co.pw",
		reversed: "wp.oc"
	},
	{
		suffix: "co.ro",
		reversed: "or.oc"
	},
	{
		suffix: "co.rs",
		reversed: "sr.oc"
	},
	{
		suffix: "co.rw",
		reversed: "wr.oc"
	},
	{
		suffix: "co.st",
		reversed: "ts.oc"
	},
	{
		suffix: "co.sz",
		reversed: "zs.oc"
	},
	{
		suffix: "co.technology",
		reversed: "ygolonhcet.oc"
	},
	{
		suffix: "co.th",
		reversed: "ht.oc"
	},
	{
		suffix: "co.tj",
		reversed: "jt.oc"
	},
	{
		suffix: "co.tm",
		reversed: "mt.oc"
	},
	{
		suffix: "co.tt",
		reversed: "tt.oc"
	},
	{
		suffix: "co.tz",
		reversed: "zt.oc"
	},
	{
		suffix: "co.ua",
		reversed: "au.oc"
	},
	{
		suffix: "co.ug",
		reversed: "gu.oc"
	},
	{
		suffix: "co.uk",
		reversed: "ku.oc"
	},
	{
		suffix: "co.us",
		reversed: "su.oc"
	},
	{
		suffix: "co.uz",
		reversed: "zu.oc"
	},
	{
		suffix: "co.ve",
		reversed: "ev.oc"
	},
	{
		suffix: "co.vi",
		reversed: "iv.oc"
	},
	{
		suffix: "co.za",
		reversed: "az.oc"
	},
	{
		suffix: "co.zm",
		reversed: "mz.oc"
	},
	{
		suffix: "co.zw",
		reversed: "wz.oc"
	},
	{
		suffix: "coach",
		reversed: "hcaoc"
	},
	{
		suffix: "coal.museum",
		reversed: "muesum.laoc"
	},
	{
		suffix: "coastaldefence.museum",
		reversed: "muesum.ecnefedlatsaoc"
	},
	{
		suffix: "cocotte.jp",
		reversed: "pj.ettococ"
	},
	{
		suffix: "codeberg.page",
		reversed: "egap.grebedoc"
	},
	{
		suffix: "codes",
		reversed: "sedoc"
	},
	{
		suffix: "codespot.com",
		reversed: "moc.topsedoc"
	},
	{
		suffix: "cody.museum",
		reversed: "muesum.ydoc"
	},
	{
		suffix: "coffee",
		reversed: "eeffoc"
	},
	{
		suffix: "cog.mi.us",
		reversed: "su.im.goc"
	},
	{
		suffix: "col.ng",
		reversed: "gn.loc"
	},
	{
		suffix: "coldwar.museum",
		reversed: "muesum.rawdloc"
	},
	{
		suffix: "collection.museum",
		reversed: "muesum.noitcelloc"
	},
	{
		suffix: "college",
		reversed: "egelloc"
	},
	{
		suffix: "collegefan.org",
		reversed: "gro.nafegelloc"
	},
	{
		suffix: "cologne",
		reversed: "engoloc"
	},
	{
		suffix: "colonialwilliamsburg.museum",
		reversed: "muesum.grubsmailliwlainoloc"
	},
	{
		suffix: "coloradoplateau.museum",
		reversed: "muesum.uaetalpodaroloc"
	},
	{
		suffix: "columbia.museum",
		reversed: "muesum.aibmuloc"
	},
	{
		suffix: "columbus.museum",
		reversed: "muesum.submuloc"
	},
	{
		suffix: "com",
		reversed: "moc"
	},
	{
		suffix: "com.ac",
		reversed: "ca.moc"
	},
	{
		suffix: "com.af",
		reversed: "fa.moc"
	},
	{
		suffix: "com.ag",
		reversed: "ga.moc"
	},
	{
		suffix: "com.ai",
		reversed: "ia.moc"
	},
	{
		suffix: "com.al",
		reversed: "la.moc"
	},
	{
		suffix: "com.am",
		reversed: "ma.moc"
	},
	{
		suffix: "com.ar",
		reversed: "ra.moc"
	},
	{
		suffix: "com.au",
		reversed: "ua.moc"
	},
	{
		suffix: "com.aw",
		reversed: "wa.moc"
	},
	{
		suffix: "com.az",
		reversed: "za.moc"
	},
	{
		suffix: "com.ba",
		reversed: "ab.moc"
	},
	{
		suffix: "com.bb",
		reversed: "bb.moc"
	},
	{
		suffix: "com.bh",
		reversed: "hb.moc"
	},
	{
		suffix: "com.bi",
		reversed: "ib.moc"
	},
	{
		suffix: "com.bm",
		reversed: "mb.moc"
	},
	{
		suffix: "com.bn",
		reversed: "nb.moc"
	},
	{
		suffix: "com.bo",
		reversed: "ob.moc"
	},
	{
		suffix: "com.br",
		reversed: "rb.moc"
	},
	{
		suffix: "com.bs",
		reversed: "sb.moc"
	},
	{
		suffix: "com.bt",
		reversed: "tb.moc"
	},
	{
		suffix: "com.by",
		reversed: "yb.moc"
	},
	{
		suffix: "com.bz",
		reversed: "zb.moc"
	},
	{
		suffix: "com.ci",
		reversed: "ic.moc"
	},
	{
		suffix: "com.cm",
		reversed: "mc.moc"
	},
	{
		suffix: "com.cn",
		reversed: "nc.moc"
	},
	{
		suffix: "com.co",
		reversed: "oc.moc"
	},
	{
		suffix: "com.cu",
		reversed: "uc.moc"
	},
	{
		suffix: "com.cv",
		reversed: "vc.moc"
	},
	{
		suffix: "com.cw",
		reversed: "wc.moc"
	},
	{
		suffix: "com.cy",
		reversed: "yc.moc"
	},
	{
		suffix: "com.de",
		reversed: "ed.moc"
	},
	{
		suffix: "com.dm",
		reversed: "md.moc"
	},
	{
		suffix: "com.do",
		reversed: "od.moc"
	},
	{
		suffix: "com.dz",
		reversed: "zd.moc"
	},
	{
		suffix: "com.ec",
		reversed: "ce.moc"
	},
	{
		suffix: "com.ee",
		reversed: "ee.moc"
	},
	{
		suffix: "com.eg",
		reversed: "ge.moc"
	},
	{
		suffix: "com.es",
		reversed: "se.moc"
	},
	{
		suffix: "com.et",
		reversed: "te.moc"
	},
	{
		suffix: "com.fj",
		reversed: "jf.moc"
	},
	{
		suffix: "com.fm",
		reversed: "mf.moc"
	},
	{
		suffix: "com.fr",
		reversed: "rf.moc"
	},
	{
		suffix: "com.ge",
		reversed: "eg.moc"
	},
	{
		suffix: "com.gh",
		reversed: "hg.moc"
	},
	{
		suffix: "com.gi",
		reversed: "ig.moc"
	},
	{
		suffix: "com.gl",
		reversed: "lg.moc"
	},
	{
		suffix: "com.gn",
		reversed: "ng.moc"
	},
	{
		suffix: "com.gp",
		reversed: "pg.moc"
	},
	{
		suffix: "com.gr",
		reversed: "rg.moc"
	},
	{
		suffix: "com.gt",
		reversed: "tg.moc"
	},
	{
		suffix: "com.gu",
		reversed: "ug.moc"
	},
	{
		suffix: "com.gy",
		reversed: "yg.moc"
	},
	{
		suffix: "com.hk",
		reversed: "kh.moc"
	},
	{
		suffix: "com.hn",
		reversed: "nh.moc"
	},
	{
		suffix: "com.hr",
		reversed: "rh.moc"
	},
	{
		suffix: "com.ht",
		reversed: "th.moc"
	},
	{
		suffix: "com.im",
		reversed: "mi.moc"
	},
	{
		suffix: "com.in",
		reversed: "ni.moc"
	},
	{
		suffix: "com.io",
		reversed: "oi.moc"
	},
	{
		suffix: "com.iq",
		reversed: "qi.moc"
	},
	{
		suffix: "com.is",
		reversed: "si.moc"
	},
	{
		suffix: "com.jo",
		reversed: "oj.moc"
	},
	{
		suffix: "com.kg",
		reversed: "gk.moc"
	},
	{
		suffix: "com.ki",
		reversed: "ik.moc"
	},
	{
		suffix: "com.km",
		reversed: "mk.moc"
	},
	{
		suffix: "com.kp",
		reversed: "pk.moc"
	},
	{
		suffix: "com.kw",
		reversed: "wk.moc"
	},
	{
		suffix: "com.ky",
		reversed: "yk.moc"
	},
	{
		suffix: "com.kz",
		reversed: "zk.moc"
	},
	{
		suffix: "com.la",
		reversed: "al.moc"
	},
	{
		suffix: "com.lb",
		reversed: "bl.moc"
	},
	{
		suffix: "com.lc",
		reversed: "cl.moc"
	},
	{
		suffix: "com.lk",
		reversed: "kl.moc"
	},
	{
		suffix: "com.lr",
		reversed: "rl.moc"
	},
	{
		suffix: "com.lv",
		reversed: "vl.moc"
	},
	{
		suffix: "com.ly",
		reversed: "yl.moc"
	},
	{
		suffix: "com.mg",
		reversed: "gm.moc"
	},
	{
		suffix: "com.mk",
		reversed: "km.moc"
	},
	{
		suffix: "com.ml",
		reversed: "lm.moc"
	},
	{
		suffix: "com.mo",
		reversed: "om.moc"
	},
	{
		suffix: "com.ms",
		reversed: "sm.moc"
	},
	{
		suffix: "com.mt",
		reversed: "tm.moc"
	},
	{
		suffix: "com.mu",
		reversed: "um.moc"
	},
	{
		suffix: "com.mv",
		reversed: "vm.moc"
	},
	{
		suffix: "com.mw",
		reversed: "wm.moc"
	},
	{
		suffix: "com.mx",
		reversed: "xm.moc"
	},
	{
		suffix: "com.my",
		reversed: "ym.moc"
	},
	{
		suffix: "com.na",
		reversed: "an.moc"
	},
	{
		suffix: "com.nf",
		reversed: "fn.moc"
	},
	{
		suffix: "com.ng",
		reversed: "gn.moc"
	},
	{
		suffix: "com.ni",
		reversed: "in.moc"
	},
	{
		suffix: "com.nr",
		reversed: "rn.moc"
	},
	{
		suffix: "com.om",
		reversed: "mo.moc"
	},
	{
		suffix: "com.pa",
		reversed: "ap.moc"
	},
	{
		suffix: "com.pe",
		reversed: "ep.moc"
	},
	{
		suffix: "com.pf",
		reversed: "fp.moc"
	},
	{
		suffix: "com.ph",
		reversed: "hp.moc"
	},
	{
		suffix: "com.pk",
		reversed: "kp.moc"
	},
	{
		suffix: "com.pl",
		reversed: "lp.moc"
	},
	{
		suffix: "com.pr",
		reversed: "rp.moc"
	},
	{
		suffix: "com.ps",
		reversed: "sp.moc"
	},
	{
		suffix: "com.pt",
		reversed: "tp.moc"
	},
	{
		suffix: "com.py",
		reversed: "yp.moc"
	},
	{
		suffix: "com.qa",
		reversed: "aq.moc"
	},
	{
		suffix: "com.re",
		reversed: "er.moc"
	},
	{
		suffix: "com.ro",
		reversed: "or.moc"
	},
	{
		suffix: "com.ru",
		reversed: "ur.moc"
	},
	{
		suffix: "com.sa",
		reversed: "as.moc"
	},
	{
		suffix: "com.sb",
		reversed: "bs.moc"
	},
	{
		suffix: "com.sc",
		reversed: "cs.moc"
	},
	{
		suffix: "com.sd",
		reversed: "ds.moc"
	},
	{
		suffix: "com.se",
		reversed: "es.moc"
	},
	{
		suffix: "com.sg",
		reversed: "gs.moc"
	},
	{
		suffix: "com.sh",
		reversed: "hs.moc"
	},
	{
		suffix: "com.sl",
		reversed: "ls.moc"
	},
	{
		suffix: "com.sn",
		reversed: "ns.moc"
	},
	{
		suffix: "com.so",
		reversed: "os.moc"
	},
	{
		suffix: "com.ss",
		reversed: "ss.moc"
	},
	{
		suffix: "com.st",
		reversed: "ts.moc"
	},
	{
		suffix: "com.sv",
		reversed: "vs.moc"
	},
	{
		suffix: "com.sy",
		reversed: "ys.moc"
	},
	{
		suffix: "com.tj",
		reversed: "jt.moc"
	},
	{
		suffix: "com.tm",
		reversed: "mt.moc"
	},
	{
		suffix: "com.tn",
		reversed: "nt.moc"
	},
	{
		suffix: "com.to",
		reversed: "ot.moc"
	},
	{
		suffix: "com.tr",
		reversed: "rt.moc"
	},
	{
		suffix: "com.tt",
		reversed: "tt.moc"
	},
	{
		suffix: "com.tw",
		reversed: "wt.moc"
	},
	{
		suffix: "com.ua",
		reversed: "au.moc"
	},
	{
		suffix: "com.ug",
		reversed: "gu.moc"
	},
	{
		suffix: "com.uy",
		reversed: "yu.moc"
	},
	{
		suffix: "com.uz",
		reversed: "zu.moc"
	},
	{
		suffix: "com.vc",
		reversed: "cv.moc"
	},
	{
		suffix: "com.ve",
		reversed: "ev.moc"
	},
	{
		suffix: "com.vi",
		reversed: "iv.moc"
	},
	{
		suffix: "com.vn",
		reversed: "nv.moc"
	},
	{
		suffix: "com.vu",
		reversed: "uv.moc"
	},
	{
		suffix: "com.ws",
		reversed: "sw.moc"
	},
	{
		suffix: "com.ye",
		reversed: "ey.moc"
	},
	{
		suffix: "com.zm",
		reversed: "mz.moc"
	},
	{
		suffix: "comcast",
		reversed: "tsacmoc"
	},
	{
		suffix: "commbank",
		reversed: "knabmmoc"
	},
	{
		suffix: "commune.am",
		reversed: "ma.enummoc"
	},
	{
		suffix: "communication.museum",
		reversed: "muesum.noitacinummoc"
	},
	{
		suffix: "communications.museum",
		reversed: "muesum.snoitacinummoc"
	},
	{
		suffix: "community",
		reversed: "ytinummoc"
	},
	{
		suffix: "community-pro.de",
		reversed: "ed.orp-ytinummoc"
	},
	{
		suffix: "community-pro.net",
		reversed: "ten.orp-ytinummoc"
	},
	{
		suffix: "community.museum",
		reversed: "muesum.ytinummoc"
	},
	{
		suffix: "como.it",
		reversed: "ti.omoc"
	},
	{
		suffix: "company",
		reversed: "ynapmoc"
	},
	{
		suffix: "compare",
		reversed: "erapmoc"
	},
	{
		suffix: "computer",
		reversed: "retupmoc"
	},
	{
		suffix: "computer.museum",
		reversed: "muesum.retupmoc"
	},
	{
		suffix: "computerhistory.museum",
		reversed: "muesum.yrotsihretupmoc"
	},
	{
		suffix: "comsec",
		reversed: "cesmoc"
	},
	{
		suffix: "comunicações.museum",
		reversed: "muesum.o2a6v-seacinumoc--nx"
	},
	{
		suffix: "condos",
		reversed: "sodnoc"
	},
	{
		suffix: "conf.au",
		reversed: "ua.fnoc"
	},
	{
		suffix: "conf.lv",
		reversed: "vl.fnoc"
	},
	{
		suffix: "conf.se",
		reversed: "es.fnoc"
	},
	{
		suffix: "conference.aero",
		reversed: "orea.ecnerefnoc"
	},
	{
		suffix: "conn.uk",
		reversed: "ku.nnoc"
	},
	{
		suffix: "construction",
		reversed: "noitcurtsnoc"
	},
	{
		suffix: "consulado.st",
		reversed: "ts.odalusnoc"
	},
	{
		suffix: "consultant.aero",
		reversed: "orea.tnatlusnoc"
	},
	{
		suffix: "consulting",
		reversed: "gnitlusnoc"
	},
	{
		suffix: "consulting.aero",
		reversed: "orea.gnitlusnoc"
	},
	{
		suffix: "contact",
		reversed: "tcatnoc"
	},
	{
		suffix: "contagem.br",
		reversed: "rb.megatnoc"
	},
	{
		suffix: "contemporary.museum",
		reversed: "muesum.yraropmetnoc"
	},
	{
		suffix: "contemporaryart.museum",
		reversed: "muesum.trayraropmetnoc"
	},
	{
		suffix: "contractors",
		reversed: "srotcartnoc"
	},
	{
		suffix: "control.aero",
		reversed: "orea.lortnoc"
	},
	{
		suffix: "convent.museum",
		reversed: "muesum.tnevnoc"
	},
	{
		suffix: "cooking",
		reversed: "gnikooc"
	},
	{
		suffix: "cookingchannel",
		reversed: "lennahcgnikooc"
	},
	{
		suffix: "cool",
		reversed: "looc"
	},
	{
		suffix: "coolblog.jp",
		reversed: "pj.golblooc"
	},
	{
		suffix: "coop",
		reversed: "pooc"
	},
	{
		suffix: "coop.ar",
		reversed: "ra.pooc"
	},
	{
		suffix: "coop.br",
		reversed: "rb.pooc"
	},
	{
		suffix: "coop.ht",
		reversed: "th.pooc"
	},
	{
		suffix: "coop.in",
		reversed: "ni.pooc"
	},
	{
		suffix: "coop.km",
		reversed: "mk.pooc"
	},
	{
		suffix: "coop.mv",
		reversed: "vm.pooc"
	},
	{
		suffix: "coop.mw",
		reversed: "wm.pooc"
	},
	{
		suffix: "coop.py",
		reversed: "yp.pooc"
	},
	{
		suffix: "coop.rw",
		reversed: "wr.pooc"
	},
	{
		suffix: "coop.tt",
		reversed: "tt.pooc"
	},
	{
		suffix: "cooperativa.bo",
		reversed: "ob.avitarepooc"
	},
	{
		suffix: "copenhagen.museum",
		reversed: "muesum.negahnepoc"
	},
	{
		suffix: "copro.uk",
		reversed: "ku.orpoc"
	},
	{
		suffix: "corporation.museum",
		reversed: "muesum.noitaroproc"
	},
	{
		suffix: "correios-e-telecomunicações.museum",
		reversed: "muesum.a92chg-seacinumocelet-e-soierroc--nx"
	},
	{
		suffix: "corsica",
		reversed: "acisroc"
	},
	{
		suffix: "corvette.museum",
		reversed: "muesum.ettevroc"
	},
	{
		suffix: "cosenza.it",
		reversed: "ti.aznesoc"
	},
	{
		suffix: "costume.museum",
		reversed: "muesum.emutsoc"
	},
	{
		suffix: "couchpotatofries.org",
		reversed: "gro.seirfotatophcuoc"
	},
	{
		suffix: "council.aero",
		reversed: "orea.licnuoc"
	},
	{
		suffix: "country",
		reversed: "yrtnuoc"
	},
	{
		suffix: "countryestate.museum",
		reversed: "muesum.etatseyrtnuoc"
	},
	{
		suffix: "county.museum",
		reversed: "muesum.ytnuoc"
	},
	{
		suffix: "coupon",
		reversed: "nopuoc"
	},
	{
		suffix: "coupons",
		reversed: "snopuoc"
	},
	{
		suffix: "courses",
		reversed: "sesruoc"
	},
	{
		suffix: "coz.br",
		reversed: "rb.zoc"
	},
	{
		suffix: "cpa",
		reversed: "apc"
	},
	{
		suffix: "cpa.pro",
		reversed: "orp.apc"
	},
	{
		suffix: "cq.cn",
		reversed: "nc.qc"
	},
	{
		suffix: "cr",
		reversed: "rc"
	},
	{
		suffix: "cr.it",
		reversed: "ti.rc"
	},
	{
		suffix: "cr.ua",
		reversed: "au.rc"
	},
	{
		suffix: "crafting.xyz",
		reversed: "zyx.gnitfarc"
	},
	{
		suffix: "crafts.museum",
		reversed: "muesum.stfarc"
	},
	{
		suffix: "cranbrook.museum",
		reversed: "muesum.koorbnarc"
	},
	{
		suffix: "cranky.jp",
		reversed: "pj.yknarc"
	},
	{
		suffix: "crd.co",
		reversed: "oc.drc"
	},
	{
		suffix: "creation.museum",
		reversed: "muesum.noitaerc"
	},
	{
		suffix: "credit",
		reversed: "tiderc"
	},
	{
		suffix: "creditcard",
		reversed: "dractiderc"
	},
	{
		suffix: "creditunion",
		reversed: "noinutiderc"
	},
	{
		suffix: "cremona.it",
		reversed: "ti.anomerc"
	},
	{
		suffix: "crew.aero",
		reversed: "orea.werc"
	},
	{
		suffix: "cri.br",
		reversed: "rb.irc"
	},
	{
		suffix: "cri.nz",
		reversed: "zn.irc"
	},
	{
		suffix: "cricket",
		reversed: "tekcirc"
	},
	{
		suffix: "crimea.ua",
		reversed: "au.aemirc"
	},
	{
		suffix: "crotone.it",
		reversed: "ti.enotorc"
	},
	{
		suffix: "crown",
		reversed: "nworc"
	},
	{
		suffix: "crs",
		reversed: "src"
	},
	{
		suffix: "cruise",
		reversed: "esiurc"
	},
	{
		suffix: "cruises",
		reversed: "sesiurc"
	},
	{
		suffix: "cs.in",
		reversed: "ni.sc"
	},
	{
		suffix: "cs.it",
		reversed: "ti.sc"
	},
	{
		suffix: "cs.keliweb.cloud",
		reversed: "duolc.bewilek.sc"
	},
	{
		suffix: "csx.cc",
		reversed: "cc.xsc"
	},
	{
		suffix: "ct.it",
		reversed: "ti.tc"
	},
	{
		suffix: "ct.us",
		reversed: "su.tc"
	},
	{
		suffix: "cu",
		reversed: "uc"
	},
	{
		suffix: "cuiaba.br",
		reversed: "rb.abaiuc"
	},
	{
		suffix: "cuisinella",
		reversed: "allenisiuc"
	},
	{
		suffix: "cultural.museum",
		reversed: "muesum.larutluc"
	},
	{
		suffix: "culturalcenter.museum",
		reversed: "muesum.retneclarutluc"
	},
	{
		suffix: "culture.museum",
		reversed: "muesum.erutluc"
	},
	{
		suffix: "cuneo.it",
		reversed: "ti.oenuc"
	},
	{
		suffix: "cupcake.is",
		reversed: "si.ekacpuc"
	},
	{
		suffix: "curitiba.br",
		reversed: "rb.abitiruc"
	},
	{
		suffix: "curv.dev",
		reversed: "ved.vruc"
	},
	{
		suffix: "cust.dev.thingdust.io",
		reversed: "oi.tsudgniht.ved.tsuc"
	},
	{
		suffix: "cust.disrec.thingdust.io",
		reversed: "oi.tsudgniht.cersid.tsuc"
	},
	{
		suffix: "cust.prod.thingdust.io",
		reversed: "oi.tsudgniht.dorp.tsuc"
	},
	{
		suffix: "cust.retrosnub.co.uk",
		reversed: "ku.oc.bunsorter.tsuc"
	},
	{
		suffix: "cust.testing.thingdust.io",
		reversed: "oi.tsudgniht.gnitset.tsuc"
	},
	{
		suffix: "custom.metacentrum.cz",
		reversed: "zc.murtnecatem.motsuc"
	},
	{
		suffix: "customer.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.remotsuc"
	},
	{
		suffix: "customer.speedpartner.de",
		reversed: "ed.rentrapdeeps.remotsuc"
	},
	{
		suffix: "cutegirl.jp",
		reversed: "pj.lrigetuc"
	},
	{
		suffix: "cv",
		reversed: "vc"
	},
	{
		suffix: "cv.ua",
		reversed: "au.vc"
	},
	{
		suffix: "cw",
		reversed: "wc"
	},
	{
		suffix: "cx",
		reversed: "xc"
	},
	{
		suffix: "cx.ua",
		reversed: "au.xc"
	},
	{
		suffix: "cy",
		reversed: "yc"
	},
	{
		suffix: "cy.eu.org",
		reversed: "gro.ue.yc"
	},
	{
		suffix: "cya.gg",
		reversed: "gg.ayc"
	},
	{
		suffix: "cyber.museum",
		reversed: "muesum.rebyc"
	},
	{
		suffix: "cymru",
		reversed: "urmyc"
	},
	{
		suffix: "cymru.museum",
		reversed: "muesum.urmyc"
	},
	{
		suffix: "cyon.link",
		reversed: "knil.noyc"
	},
	{
		suffix: "cyon.site",
		reversed: "etis.noyc"
	},
	{
		suffix: "cyou",
		reversed: "uoyc"
	},
	{
		suffix: "cz",
		reversed: "zc"
	},
	{
		suffix: "cz.eu.org",
		reversed: "gro.ue.zc"
	},
	{
		suffix: "cz.it",
		reversed: "ti.zc"
	},
	{
		suffix: "czeladz.pl",
		reversed: "lp.zdalezc"
	},
	{
		suffix: "czest.pl",
		reversed: "lp.tsezc"
	},
	{
		suffix: "d.bg",
		reversed: "gb.d"
	},
	{
		suffix: "d.gv.vc",
		reversed: "cv.vg.d"
	},
	{
		suffix: "d.se",
		reversed: "es.d"
	},
	{
		suffix: "daa.jp",
		reversed: "pj.aad"
	},
	{
		suffix: "dabur",
		reversed: "rubad"
	},
	{
		suffix: "dad",
		reversed: "dad"
	},
	{
		suffix: "daegu.kr",
		reversed: "rk.ugead"
	},
	{
		suffix: "daejeon.kr",
		reversed: "rk.noejead"
	},
	{
		suffix: "daemon.panel.gg",
		reversed: "gg.lenap.nomead"
	},
	{
		suffix: "dagestan.ru",
		reversed: "ur.natsegad"
	},
	{
		suffix: "dagestan.su",
		reversed: "us.natsegad"
	},
	{
		suffix: "daigo.ibaraki.jp",
		reversed: "pj.ikarabi.ogiad"
	},
	{
		suffix: "daisen.akita.jp",
		reversed: "pj.atika.nesiad"
	},
	{
		suffix: "daito.osaka.jp",
		reversed: "pj.akaso.otiad"
	},
	{
		suffix: "daiwa.hiroshima.jp",
		reversed: "pj.amihsorih.awiad"
	},
	{
		suffix: "dali.museum",
		reversed: "muesum.ilad"
	},
	{
		suffix: "dallas.museum",
		reversed: "muesum.sallad"
	},
	{
		suffix: "damnserver.com",
		reversed: "moc.revresnmad"
	},
	{
		suffix: "dance",
		reversed: "ecnad"
	},
	{
		suffix: "daplie.me",
		reversed: "em.eilpad"
	},
	{
		suffix: "data",
		reversed: "atad"
	},
	{
		suffix: "database.museum",
		reversed: "muesum.esabatad"
	},
	{
		suffix: "date",
		reversed: "etad"
	},
	{
		suffix: "date.fukushima.jp",
		reversed: "pj.amihsukuf.etad"
	},
	{
		suffix: "date.hokkaido.jp",
		reversed: "pj.odiakkoh.etad"
	},
	{
		suffix: "dating",
		reversed: "gnitad"
	},
	{
		suffix: "datsun",
		reversed: "nustad"
	},
	{
		suffix: "dattolocal.com",
		reversed: "moc.lacolottad"
	},
	{
		suffix: "dattolocal.net",
		reversed: "ten.lacolottad"
	},
	{
		suffix: "dattorelay.com",
		reversed: "moc.yalerottad"
	},
	{
		suffix: "dattoweb.com",
		reversed: "moc.bewottad"
	},
	{
		suffix: "davvenjarga.no",
		reversed: "on.agrajnevvad"
	},
	{
		suffix: "davvenjárga.no",
		reversed: "on.a4y-agrjnevvad--nx"
	},
	{
		suffix: "davvesiida.no",
		reversed: "on.adiisevvad"
	},
	{
		suffix: "day",
		reversed: "yad"
	},
	{
		suffix: "dazaifu.fukuoka.jp",
		reversed: "pj.akoukuf.ufiazad"
	},
	{
		suffix: "dc.us",
		reversed: "su.cd"
	},
	{
		suffix: "dclk",
		reversed: "klcd"
	},
	{
		suffix: "dd-dns.de",
		reversed: "ed.snd-dd"
	},
	{
		suffix: "ddns.me",
		reversed: "em.sndd"
	},
	{
		suffix: "ddns.net",
		reversed: "ten.sndd"
	},
	{
		suffix: "ddns5.com",
		reversed: "moc.5sndd"
	},
	{
		suffix: "ddnsfree.com",
		reversed: "moc.eerfsndd"
	},
	{
		suffix: "ddnsgeek.com",
		reversed: "moc.keegsndd"
	},
	{
		suffix: "ddnsking.com",
		reversed: "moc.gniksndd"
	},
	{
		suffix: "ddnslive.com",
		reversed: "moc.evilsndd"
	},
	{
		suffix: "ddnss.de",
		reversed: "ed.ssndd"
	},
	{
		suffix: "ddnss.org",
		reversed: "gro.ssndd"
	},
	{
		suffix: "ddr.museum",
		reversed: "muesum.rdd"
	},
	{
		suffix: "dds",
		reversed: "sdd"
	},
	{
		suffix: "de",
		reversed: "ed"
	},
	{
		suffix: "de.com",
		reversed: "moc.ed"
	},
	{
		suffix: "de.cool",
		reversed: "looc.ed"
	},
	{
		suffix: "de.eu.org",
		reversed: "gro.ue.ed"
	},
	{
		suffix: "de.gt",
		reversed: "tg.ed"
	},
	{
		suffix: "de.ls",
		reversed: "sl.ed"
	},
	{
		suffix: "de.md",
		reversed: "dm.ed"
	},
	{
		suffix: "de.trendhosting.cloud",
		reversed: "duolc.gnitsohdnert.ed"
	},
	{
		suffix: "de.us",
		reversed: "su.ed"
	},
	{
		suffix: "deal",
		reversed: "laed"
	},
	{
		suffix: "dealer",
		reversed: "relaed"
	},
	{
		suffix: "deals",
		reversed: "slaed"
	},
	{
		suffix: "deatnu.no",
		reversed: "on.untaed"
	},
	{
		suffix: "debian.net",
		reversed: "ten.naibed"
	},
	{
		suffix: "deca.jp",
		reversed: "pj.aced"
	},
	{
		suffix: "deci.jp",
		reversed: "pj.iced"
	},
	{
		suffix: "decorativearts.museum",
		reversed: "muesum.straevitaroced"
	},
	{
		suffix: "dedibox.fr",
		reversed: "rf.xobided"
	},
	{
		suffix: "dedyn.io",
		reversed: "oi.nyded"
	},
	{
		suffix: "def.br",
		reversed: "rb.fed"
	},
	{
		suffix: "definima.io",
		reversed: "oi.aminifed"
	},
	{
		suffix: "definima.net",
		reversed: "ten.aminifed"
	},
	{
		suffix: "degree",
		reversed: "eerged"
	},
	{
		suffix: "delaware.museum",
		reversed: "muesum.erawaled"
	},
	{
		suffix: "delhi.in",
		reversed: "ni.ihled"
	},
	{
		suffix: "delivery",
		reversed: "yreviled"
	},
	{
		suffix: "dell",
		reversed: "lled"
	},
	{
		suffix: "dell-ogliastra.it",
		reversed: "ti.artsailgo-lled"
	},
	{
		suffix: "dellogliastra.it",
		reversed: "ti.artsailgolled"
	},
	{
		suffix: "delmenhorst.museum",
		reversed: "muesum.tsrohnemled"
	},
	{
		suffix: "deloitte",
		reversed: "ettioled"
	},
	{
		suffix: "delta",
		reversed: "atled"
	},
	{
		suffix: "demo.datacenter.fi",
		reversed: "if.retnecatad.omed"
	},
	{
		suffix: "demo.datadetect.com",
		reversed: "moc.tcetedatad.omed"
	},
	{
		suffix: "demo.jelastic.com",
		reversed: "moc.citsalej.omed"
	},
	{
		suffix: "democracia.bo",
		reversed: "ob.aicarcomed"
	},
	{
		suffix: "democrat",
		reversed: "tarcomed"
	},
	{
		suffix: "demon.nl",
		reversed: "ln.nomed"
	},
	{
		suffix: "denmark.museum",
		reversed: "muesum.kramned"
	},
	{
		suffix: "deno-staging.dev",
		reversed: "ved.gnigats-oned"
	},
	{
		suffix: "deno.dev",
		reversed: "ved.oned"
	},
	{
		suffix: "dental",
		reversed: "latned"
	},
	{
		suffix: "dentist",
		reversed: "tsitned"
	},
	{
		suffix: "dep.no",
		reversed: "on.ped"
	},
	{
		suffix: "deporte.bo",
		reversed: "ob.etroped"
	},
	{
		suffix: "depot.museum",
		reversed: "muesum.toped"
	},
	{
		suffix: "des.br",
		reversed: "rb.sed"
	},
	{
		suffix: "desa.id",
		reversed: "di.ased"
	},
	{
		suffix: "desi",
		reversed: "ised"
	},
	{
		suffix: "design",
		reversed: "ngised"
	},
	{
		suffix: "design.aero",
		reversed: "orea.ngised"
	},
	{
		suffix: "design.museum",
		reversed: "muesum.ngised"
	},
	{
		suffix: "det.br",
		reversed: "rb.ted"
	},
	{
		suffix: "deta.app",
		reversed: "ppa.ated"
	},
	{
		suffix: "deta.dev",
		reversed: "ved.ated"
	},
	{
		suffix: "detroit.museum",
		reversed: "muesum.tiorted"
	},
	{
		suffix: "dev",
		reversed: "ved"
	},
	{
		suffix: "dev-myqnapcloud.com",
		reversed: "moc.duolcpanqym-ved"
	},
	{
		suffix: "dev.br",
		reversed: "rb.ved"
	},
	{
		suffix: "dev.static.land",
		reversed: "dnal.citats.ved"
	},
	{
		suffix: "dev.vu",
		reversed: "uv.ved"
	},
	{
		suffix: "development.run",
		reversed: "nur.tnempoleved"
	},
	{
		suffix: "devices.resinstaging.io",
		reversed: "oi.gnigatsniser.secived"
	},
	{
		suffix: "df.gov.br",
		reversed: "rb.vog.fd"
	},
	{
		suffix: "df.leg.br",
		reversed: "rb.gel.fd"
	},
	{
		suffix: "dgca.aero",
		reversed: "orea.acgd"
	},
	{
		suffix: "dh.bytemark.co.uk",
		reversed: "ku.oc.krametyb.hd"
	},
	{
		suffix: "dhl",
		reversed: "lhd"
	},
	{
		suffix: "diadem.cloud",
		reversed: "duolc.medaid"
	},
	{
		suffix: "diamonds",
		reversed: "sdnomaid"
	},
	{
		suffix: "dielddanuorri.no",
		reversed: "on.irrounaddleid"
	},
	{
		suffix: "diet",
		reversed: "teid"
	},
	{
		suffix: "digick.jp",
		reversed: "pj.kcigid"
	},
	{
		suffix: "digital",
		reversed: "latigid"
	},
	{
		suffix: "dinosaur.museum",
		reversed: "muesum.ruasonid"
	},
	{
		suffix: "direct",
		reversed: "tcerid"
	},
	{
		suffix: "direct.quickconnect.cn",
		reversed: "nc.tcennockciuq.tcerid"
	},
	{
		suffix: "direct.quickconnect.to",
		reversed: "ot.tcennockciuq.tcerid"
	},
	{
		suffix: "directory",
		reversed: "yrotcerid"
	},
	{
		suffix: "discordsays.com",
		reversed: "moc.syasdrocsid"
	},
	{
		suffix: "discordsez.com",
		reversed: "moc.zesdrocsid"
	},
	{
		suffix: "discount",
		reversed: "tnuocsid"
	},
	{
		suffix: "discourse.group",
		reversed: "puorg.esruocsid"
	},
	{
		suffix: "discourse.team",
		reversed: "maet.esruocsid"
	},
	{
		suffix: "discover",
		reversed: "revocsid"
	},
	{
		suffix: "discovery.museum",
		reversed: "muesum.yrevocsid"
	},
	{
		suffix: "dish",
		reversed: "hsid"
	},
	{
		suffix: "diskstation.eu",
		reversed: "ue.noitatsksid"
	},
	{
		suffix: "diskstation.me",
		reversed: "em.noitatsksid"
	},
	{
		suffix: "diskstation.org",
		reversed: "gro.noitatsksid"
	},
	{
		suffix: "diskussionsbereich.de",
		reversed: "ed.hcierebsnoissuksid"
	},
	{
		suffix: "ditchyourip.com",
		reversed: "moc.piruoyhctid"
	},
	{
		suffix: "divtasvuodna.no",
		reversed: "on.andouvsatvid"
	},
	{
		suffix: "divttasvuotna.no",
		reversed: "on.antouvsattvid"
	},
	{
		suffix: "diy",
		reversed: "yid"
	},
	{
		suffix: "dj",
		reversed: "jd"
	},
	{
		suffix: "dk",
		reversed: "kd"
	},
	{
		suffix: "dk.eu.org",
		reversed: "gro.ue.kd"
	},
	{
		suffix: "dlugoleka.pl",
		reversed: "lp.akeloguld"
	},
	{
		suffix: "dm",
		reversed: "md"
	},
	{
		suffix: "dn.ua",
		reversed: "au.nd"
	},
	{
		suffix: "dnepropetrovsk.ua",
		reversed: "au.ksvorteporpend"
	},
	{
		suffix: "dni.us",
		reversed: "su.ind"
	},
	{
		suffix: "dnipropetrovsk.ua",
		reversed: "au.ksvorteporpind"
	},
	{
		suffix: "dnp",
		reversed: "pnd"
	},
	{
		suffix: "dnsalias.com",
		reversed: "moc.sailasnd"
	},
	{
		suffix: "dnsalias.net",
		reversed: "ten.sailasnd"
	},
	{
		suffix: "dnsalias.org",
		reversed: "gro.sailasnd"
	},
	{
		suffix: "dnsdojo.com",
		reversed: "moc.ojodsnd"
	},
	{
		suffix: "dnsdojo.net",
		reversed: "ten.ojodsnd"
	},
	{
		suffix: "dnsdojo.org",
		reversed: "gro.ojodsnd"
	},
	{
		suffix: "dnsfor.me",
		reversed: "em.rofsnd"
	},
	{
		suffix: "dnshome.de",
		reversed: "ed.emohsnd"
	},
	{
		suffix: "dnsiskinky.com",
		reversed: "moc.ykniksisnd"
	},
	{
		suffix: "dnsking.ch",
		reversed: "hc.gniksnd"
	},
	{
		suffix: "dnsup.net",
		reversed: "ten.pusnd"
	},
	{
		suffix: "dnsupdate.info",
		reversed: "ofni.etadpusnd"
	},
	{
		suffix: "dnsupdater.de",
		reversed: "ed.retadpusnd"
	},
	{
		suffix: "do",
		reversed: "od"
	},
	{
		suffix: "docs",
		reversed: "scod"
	},
	{
		suffix: "doctor",
		reversed: "rotcod"
	},
	{
		suffix: "does-it.net",
		reversed: "ten.ti-seod"
	},
	{
		suffix: "doesntexist.com",
		reversed: "moc.tsixetnseod"
	},
	{
		suffix: "doesntexist.org",
		reversed: "gro.tsixetnseod"
	},
	{
		suffix: "dog",
		reversed: "god"
	},
	{
		suffix: "dolls.museum",
		reversed: "muesum.sllod"
	},
	{
		suffix: "domains",
		reversed: "sniamod"
	},
	{
		suffix: "donetsk.ua",
		reversed: "au.kstenod"
	},
	{
		suffix: "donna.no",
		reversed: "on.annod"
	},
	{
		suffix: "donostia.museum",
		reversed: "muesum.aitsonod"
	},
	{
		suffix: "dontexist.com",
		reversed: "moc.tsixetnod"
	},
	{
		suffix: "dontexist.net",
		reversed: "ten.tsixetnod"
	},
	{
		suffix: "dontexist.org",
		reversed: "gro.tsixetnod"
	},
	{
		suffix: "doomdns.com",
		reversed: "moc.sndmood"
	},
	{
		suffix: "doomdns.org",
		reversed: "gro.sndmood"
	},
	{
		suffix: "dopaas.com",
		reversed: "moc.saapod"
	},
	{
		suffix: "doshi.yamanashi.jp",
		reversed: "pj.ihsanamay.ihsod"
	},
	{
		suffix: "dot",
		reversed: "tod"
	},
	{
		suffix: "dovre.no",
		reversed: "on.ervod"
	},
	{
		suffix: "download",
		reversed: "daolnwod"
	},
	{
		suffix: "dp.ua",
		reversed: "au.pd"
	},
	{
		suffix: "dr.in",
		reversed: "ni.rd"
	},
	{
		suffix: "dr.na",
		reversed: "an.rd"
	},
	{
		suffix: "dr.tr",
		reversed: "rt.rd"
	},
	{
		suffix: "drammen.no",
		reversed: "on.nemmard"
	},
	{
		suffix: "drangedal.no",
		reversed: "on.ladegnard"
	},
	{
		suffix: "dray-dns.de",
		reversed: "ed.snd-yard"
	},
	{
		suffix: "drayddns.com",
		reversed: "moc.snddyard"
	},
	{
		suffix: "draydns.de",
		reversed: "ed.sndyard"
	},
	{
		suffix: "dreamhosters.com",
		reversed: "moc.sretsohmaerd"
	},
	{
		suffix: "drive",
		reversed: "evird"
	},
	{
		suffix: "drobak.no",
		reversed: "on.kabord"
	},
	{
		suffix: "drr.ac",
		reversed: "ca.rrd"
	},
	{
		suffix: "drud.io",
		reversed: "oi.durd"
	},
	{
		suffix: "drud.us",
		reversed: "su.durd"
	},
	{
		suffix: "drøbak.no",
		reversed: "on.auw-kabrd--nx"
	},
	{
		suffix: "dscloud.biz",
		reversed: "zib.duolcsd"
	},
	{
		suffix: "dscloud.me",
		reversed: "em.duolcsd"
	},
	{
		suffix: "dscloud.mobi",
		reversed: "ibom.duolcsd"
	},
	{
		suffix: "dsmynas.com",
		reversed: "moc.sanymsd"
	},
	{
		suffix: "dsmynas.net",
		reversed: "ten.sanymsd"
	},
	{
		suffix: "dsmynas.org",
		reversed: "gro.sanymsd"
	},
	{
		suffix: "dst.mi.us",
		reversed: "su.im.tsd"
	},
	{
		suffix: "dtv",
		reversed: "vtd"
	},
	{
		suffix: "dubai",
		reversed: "iabud"
	},
	{
		suffix: "duckdns.org",
		reversed: "gro.sndkcud"
	},
	{
		suffix: "dunlop",
		reversed: "polnud"
	},
	{
		suffix: "dupont",
		reversed: "tnopud"
	},
	{
		suffix: "durban",
		reversed: "nabrud"
	},
	{
		suffix: "durham.museum",
		reversed: "muesum.mahrud"
	},
	{
		suffix: "dvag",
		reversed: "gavd"
	},
	{
		suffix: "dvr",
		reversed: "rvd"
	},
	{
		suffix: "dvrcam.info",
		reversed: "ofni.macrvd"
	},
	{
		suffix: "dvrdns.org",
		reversed: "gro.sndrvd"
	},
	{
		suffix: "dy.fi",
		reversed: "if.yd"
	},
	{
		suffix: "dyn-berlin.de",
		reversed: "ed.nilreb-nyd"
	},
	{
		suffix: "dyn-ip24.de",
		reversed: "ed.42pi-nyd"
	},
	{
		suffix: "dyn-o-saur.com",
		reversed: "moc.ruas-o-nyd"
	},
	{
		suffix: "dyn-vpn.de",
		reversed: "ed.npv-nyd"
	},
	{
		suffix: "dyn.cosidns.de",
		reversed: "ed.sndisoc.nyd"
	},
	{
		suffix: "dyn.ddnss.de",
		reversed: "ed.ssndd.nyd"
	},
	{
		suffix: "dyn.home-webserver.de",
		reversed: "ed.revresbew-emoh.nyd"
	},
	{
		suffix: "dyn53.io",
		reversed: "oi.35nyd"
	},
	{
		suffix: "dynalias.com",
		reversed: "moc.sailanyd"
	},
	{
		suffix: "dynalias.net",
		reversed: "ten.sailanyd"
	},
	{
		suffix: "dynalias.org",
		reversed: "gro.sailanyd"
	},
	{
		suffix: "dynamic-dns.info",
		reversed: "ofni.snd-cimanyd"
	},
	{
		suffix: "dynamisches-dns.de",
		reversed: "ed.snd-sehcsimanyd"
	},
	{
		suffix: "dynathome.net",
		reversed: "ten.emohtanyd"
	},
	{
		suffix: "dyndns-at-home.com",
		reversed: "moc.emoh-ta-sndnyd"
	},
	{
		suffix: "dyndns-at-work.com",
		reversed: "moc.krow-ta-sndnyd"
	},
	{
		suffix: "dyndns-blog.com",
		reversed: "moc.golb-sndnyd"
	},
	{
		suffix: "dyndns-free.com",
		reversed: "moc.eerf-sndnyd"
	},
	{
		suffix: "dyndns-home.com",
		reversed: "moc.emoh-sndnyd"
	},
	{
		suffix: "dyndns-ip.com",
		reversed: "moc.pi-sndnyd"
	},
	{
		suffix: "dyndns-mail.com",
		reversed: "moc.liam-sndnyd"
	},
	{
		suffix: "dyndns-office.com",
		reversed: "moc.eciffo-sndnyd"
	},
	{
		suffix: "dyndns-pics.com",
		reversed: "moc.scip-sndnyd"
	},
	{
		suffix: "dyndns-remote.com",
		reversed: "moc.etomer-sndnyd"
	},
	{
		suffix: "dyndns-server.com",
		reversed: "moc.revres-sndnyd"
	},
	{
		suffix: "dyndns-web.com",
		reversed: "moc.bew-sndnyd"
	},
	{
		suffix: "dyndns-wiki.com",
		reversed: "moc.ikiw-sndnyd"
	},
	{
		suffix: "dyndns-work.com",
		reversed: "moc.krow-sndnyd"
	},
	{
		suffix: "dyndns.biz",
		reversed: "zib.sndnyd"
	},
	{
		suffix: "dyndns.dappnode.io",
		reversed: "oi.edonppad.sndnyd"
	},
	{
		suffix: "dyndns.ddnss.de",
		reversed: "ed.ssndd.sndnyd"
	},
	{
		suffix: "dyndns.info",
		reversed: "ofni.sndnyd"
	},
	{
		suffix: "dyndns.org",
		reversed: "gro.sndnyd"
	},
	{
		suffix: "dyndns.tv",
		reversed: "vt.sndnyd"
	},
	{
		suffix: "dyndns.ws",
		reversed: "sw.sndnyd"
	},
	{
		suffix: "dyndns1.de",
		reversed: "ed.1sndnyd"
	},
	{
		suffix: "dynns.com",
		reversed: "moc.snnyd"
	},
	{
		suffix: "dynserv.org",
		reversed: "gro.vresnyd"
	},
	{
		suffix: "dynu.net",
		reversed: "ten.unyd"
	},
	{
		suffix: "dynv6.net",
		reversed: "ten.6vnyd"
	},
	{
		suffix: "dynvpn.de",
		reversed: "ed.npvnyd"
	},
	{
		suffix: "dyroy.no",
		reversed: "on.yoryd"
	},
	{
		suffix: "dyrøy.no",
		reversed: "on.ari-yryd--nx"
	},
	{
		suffix: "dz",
		reversed: "zd"
	},
	{
		suffix: "dønna.no",
		reversed: "on.arg-annd--nx"
	},
	{
		suffix: "e.bg",
		reversed: "gb.e"
	},
	{
		suffix: "e.se",
		reversed: "es.e"
	},
	{
		suffix: "e12.ve",
		reversed: "ev.21e"
	},
	{
		suffix: "e164.arpa",
		reversed: "apra.461e"
	},
	{
		suffix: "e4.cz",
		reversed: "zc.4e"
	},
	{
		suffix: "earth",
		reversed: "htrae"
	},
	{
		suffix: "east-kazakhstan.su",
		reversed: "us.natshkazak-tsae"
	},
	{
		suffix: "eastafrica.museum",
		reversed: "muesum.acirfatsae"
	},
	{
		suffix: "eastasia.azurestaticapps.net",
		reversed: "ten.sppacitatseruza.aisatsae"
	},
	{
		suffix: "eastcoast.museum",
		reversed: "muesum.tsaoctsae"
	},
	{
		suffix: "eastus2.azurestaticapps.net",
		reversed: "ten.sppacitatseruza.2sutsae"
	},
	{
		suffix: "easypanel.app",
		reversed: "ppa.lenapysae"
	},
	{
		suffix: "easypanel.host",
		reversed: "tsoh.lenapysae"
	},
	{
		suffix: "eat",
		reversed: "tae"
	},
	{
		suffix: "eating-organic.net",
		reversed: "ten.cinagro-gnitae"
	},
	{
		suffix: "eaton.mi.us",
		reversed: "su.im.notae"
	},
	{
		suffix: "ebetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebe"
	},
	{
		suffix: "ebina.kanagawa.jp",
		reversed: "pj.awaganak.anibe"
	},
	{
		suffix: "ebino.miyazaki.jp",
		reversed: "pj.ikazayim.onibe"
	},
	{
		suffix: "ebiz.tw",
		reversed: "wt.zibe"
	},
	{
		suffix: "ec",
		reversed: "ce"
	},
	{
		suffix: "echizen.fukui.jp",
		reversed: "pj.iukuf.nezihce"
	},
	{
		suffix: "ecn.br",
		reversed: "rb.nce"
	},
	{
		suffix: "eco",
		reversed: "oce"
	},
	{
		suffix: "eco.br",
		reversed: "rb.oce"
	},
	{
		suffix: "ecologia.bo",
		reversed: "ob.aigoloce"
	},
	{
		suffix: "ecommerce-shop.pl",
		reversed: "lp.pohs-ecremmoce"
	},
	{
		suffix: "economia.bo",
		reversed: "ob.aimonoce"
	},
	{
		suffix: "ed.ao",
		reversed: "oa.de"
	},
	{
		suffix: "ed.ci",
		reversed: "ic.de"
	},
	{
		suffix: "ed.cr",
		reversed: "rc.de"
	},
	{
		suffix: "ed.jp",
		reversed: "pj.de"
	},
	{
		suffix: "ed.pw",
		reversed: "wp.de"
	},
	{
		suffix: "edeka",
		reversed: "akede"
	},
	{
		suffix: "edgeapp.net",
		reversed: "ten.ppaegde"
	},
	{
		suffix: "edgecompute.app",
		reversed: "ppa.etupmocegde"
	},
	{
		suffix: "edgestack.me",
		reversed: "em.kcatsegde"
	},
	{
		suffix: "editorx.io",
		reversed: "oi.xrotide"
	},
	{
		suffix: "edogawa.tokyo.jp",
		reversed: "pj.oykot.awagode"
	},
	{
		suffix: "edu",
		reversed: "ude"
	},
	{
		suffix: "edu.ac",
		reversed: "ca.ude"
	},
	{
		suffix: "edu.af",
		reversed: "fa.ude"
	},
	{
		suffix: "edu.al",
		reversed: "la.ude"
	},
	{
		suffix: "edu.ar",
		reversed: "ra.ude"
	},
	{
		suffix: "edu.au",
		reversed: "ua.ude"
	},
	{
		suffix: "edu.az",
		reversed: "za.ude"
	},
	{
		suffix: "edu.ba",
		reversed: "ab.ude"
	},
	{
		suffix: "edu.bb",
		reversed: "bb.ude"
	},
	{
		suffix: "edu.bh",
		reversed: "hb.ude"
	},
	{
		suffix: "edu.bi",
		reversed: "ib.ude"
	},
	{
		suffix: "edu.bm",
		reversed: "mb.ude"
	},
	{
		suffix: "edu.bn",
		reversed: "nb.ude"
	},
	{
		suffix: "edu.bo",
		reversed: "ob.ude"
	},
	{
		suffix: "edu.br",
		reversed: "rb.ude"
	},
	{
		suffix: "edu.bs",
		reversed: "sb.ude"
	},
	{
		suffix: "edu.bt",
		reversed: "tb.ude"
	},
	{
		suffix: "edu.bz",
		reversed: "zb.ude"
	},
	{
		suffix: "edu.ci",
		reversed: "ic.ude"
	},
	{
		suffix: "edu.cn",
		reversed: "nc.ude"
	},
	{
		suffix: "edu.co",
		reversed: "oc.ude"
	},
	{
		suffix: "edu.cu",
		reversed: "uc.ude"
	},
	{
		suffix: "edu.cv",
		reversed: "vc.ude"
	},
	{
		suffix: "edu.cw",
		reversed: "wc.ude"
	},
	{
		suffix: "edu.dm",
		reversed: "md.ude"
	},
	{
		suffix: "edu.do",
		reversed: "od.ude"
	},
	{
		suffix: "edu.dz",
		reversed: "zd.ude"
	},
	{
		suffix: "edu.ec",
		reversed: "ce.ude"
	},
	{
		suffix: "edu.ee",
		reversed: "ee.ude"
	},
	{
		suffix: "edu.eg",
		reversed: "ge.ude"
	},
	{
		suffix: "edu.es",
		reversed: "se.ude"
	},
	{
		suffix: "edu.et",
		reversed: "te.ude"
	},
	{
		suffix: "edu.eu.org",
		reversed: "gro.ue.ude"
	},
	{
		suffix: "edu.fm",
		reversed: "mf.ude"
	},
	{
		suffix: "edu.gd",
		reversed: "dg.ude"
	},
	{
		suffix: "edu.ge",
		reversed: "eg.ude"
	},
	{
		suffix: "edu.gh",
		reversed: "hg.ude"
	},
	{
		suffix: "edu.gi",
		reversed: "ig.ude"
	},
	{
		suffix: "edu.gl",
		reversed: "lg.ude"
	},
	{
		suffix: "edu.gn",
		reversed: "ng.ude"
	},
	{
		suffix: "edu.gp",
		reversed: "pg.ude"
	},
	{
		suffix: "edu.gr",
		reversed: "rg.ude"
	},
	{
		suffix: "edu.gt",
		reversed: "tg.ude"
	},
	{
		suffix: "edu.gu",
		reversed: "ug.ude"
	},
	{
		suffix: "edu.gy",
		reversed: "yg.ude"
	},
	{
		suffix: "edu.hk",
		reversed: "kh.ude"
	},
	{
		suffix: "edu.hn",
		reversed: "nh.ude"
	},
	{
		suffix: "edu.ht",
		reversed: "th.ude"
	},
	{
		suffix: "edu.in",
		reversed: "ni.ude"
	},
	{
		suffix: "edu.iq",
		reversed: "qi.ude"
	},
	{
		suffix: "edu.is",
		reversed: "si.ude"
	},
	{
		suffix: "edu.it",
		reversed: "ti.ude"
	},
	{
		suffix: "edu.jo",
		reversed: "oj.ude"
	},
	{
		suffix: "edu.kg",
		reversed: "gk.ude"
	},
	{
		suffix: "edu.ki",
		reversed: "ik.ude"
	},
	{
		suffix: "edu.km",
		reversed: "mk.ude"
	},
	{
		suffix: "edu.kn",
		reversed: "nk.ude"
	},
	{
		suffix: "edu.kp",
		reversed: "pk.ude"
	},
	{
		suffix: "edu.krd",
		reversed: "drk.ude"
	},
	{
		suffix: "edu.kw",
		reversed: "wk.ude"
	},
	{
		suffix: "edu.ky",
		reversed: "yk.ude"
	},
	{
		suffix: "edu.kz",
		reversed: "zk.ude"
	},
	{
		suffix: "edu.la",
		reversed: "al.ude"
	},
	{
		suffix: "edu.lb",
		reversed: "bl.ude"
	},
	{
		suffix: "edu.lc",
		reversed: "cl.ude"
	},
	{
		suffix: "edu.lk",
		reversed: "kl.ude"
	},
	{
		suffix: "edu.lr",
		reversed: "rl.ude"
	},
	{
		suffix: "edu.ls",
		reversed: "sl.ude"
	},
	{
		suffix: "edu.lv",
		reversed: "vl.ude"
	},
	{
		suffix: "edu.ly",
		reversed: "yl.ude"
	},
	{
		suffix: "edu.me",
		reversed: "em.ude"
	},
	{
		suffix: "edu.mg",
		reversed: "gm.ude"
	},
	{
		suffix: "edu.mk",
		reversed: "km.ude"
	},
	{
		suffix: "edu.ml",
		reversed: "lm.ude"
	},
	{
		suffix: "edu.mn",
		reversed: "nm.ude"
	},
	{
		suffix: "edu.mo",
		reversed: "om.ude"
	},
	{
		suffix: "edu.ms",
		reversed: "sm.ude"
	},
	{
		suffix: "edu.mt",
		reversed: "tm.ude"
	},
	{
		suffix: "edu.mv",
		reversed: "vm.ude"
	},
	{
		suffix: "edu.mw",
		reversed: "wm.ude"
	},
	{
		suffix: "edu.mx",
		reversed: "xm.ude"
	},
	{
		suffix: "edu.my",
		reversed: "ym.ude"
	},
	{
		suffix: "edu.mz",
		reversed: "zm.ude"
	},
	{
		suffix: "edu.ng",
		reversed: "gn.ude"
	},
	{
		suffix: "edu.ni",
		reversed: "in.ude"
	},
	{
		suffix: "edu.nr",
		reversed: "rn.ude"
	},
	{
		suffix: "edu.om",
		reversed: "mo.ude"
	},
	{
		suffix: "edu.pa",
		reversed: "ap.ude"
	},
	{
		suffix: "edu.pe",
		reversed: "ep.ude"
	},
	{
		suffix: "edu.pf",
		reversed: "fp.ude"
	},
	{
		suffix: "edu.ph",
		reversed: "hp.ude"
	},
	{
		suffix: "edu.pk",
		reversed: "kp.ude"
	},
	{
		suffix: "edu.pl",
		reversed: "lp.ude"
	},
	{
		suffix: "edu.pn",
		reversed: "np.ude"
	},
	{
		suffix: "edu.pr",
		reversed: "rp.ude"
	},
	{
		suffix: "edu.ps",
		reversed: "sp.ude"
	},
	{
		suffix: "edu.pt",
		reversed: "tp.ude"
	},
	{
		suffix: "edu.py",
		reversed: "yp.ude"
	},
	{
		suffix: "edu.qa",
		reversed: "aq.ude"
	},
	{
		suffix: "edu.rs",
		reversed: "sr.ude"
	},
	{
		suffix: "edu.ru",
		reversed: "ur.ude"
	},
	{
		suffix: "edu.sa",
		reversed: "as.ude"
	},
	{
		suffix: "edu.sb",
		reversed: "bs.ude"
	},
	{
		suffix: "edu.sc",
		reversed: "cs.ude"
	},
	{
		suffix: "edu.scot",
		reversed: "tocs.ude"
	},
	{
		suffix: "edu.sd",
		reversed: "ds.ude"
	},
	{
		suffix: "edu.sg",
		reversed: "gs.ude"
	},
	{
		suffix: "edu.sl",
		reversed: "ls.ude"
	},
	{
		suffix: "edu.sn",
		reversed: "ns.ude"
	},
	{
		suffix: "edu.so",
		reversed: "os.ude"
	},
	{
		suffix: "edu.ss",
		reversed: "ss.ude"
	},
	{
		suffix: "edu.st",
		reversed: "ts.ude"
	},
	{
		suffix: "edu.sv",
		reversed: "vs.ude"
	},
	{
		suffix: "edu.sy",
		reversed: "ys.ude"
	},
	{
		suffix: "edu.tj",
		reversed: "jt.ude"
	},
	{
		suffix: "edu.tm",
		reversed: "mt.ude"
	},
	{
		suffix: "edu.to",
		reversed: "ot.ude"
	},
	{
		suffix: "edu.tr",
		reversed: "rt.ude"
	},
	{
		suffix: "edu.tt",
		reversed: "tt.ude"
	},
	{
		suffix: "edu.tw",
		reversed: "wt.ude"
	},
	{
		suffix: "edu.ua",
		reversed: "au.ude"
	},
	{
		suffix: "edu.uy",
		reversed: "yu.ude"
	},
	{
		suffix: "edu.vc",
		reversed: "cv.ude"
	},
	{
		suffix: "edu.ve",
		reversed: "ev.ude"
	},
	{
		suffix: "edu.vn",
		reversed: "nv.ude"
	},
	{
		suffix: "edu.vu",
		reversed: "uv.ude"
	},
	{
		suffix: "edu.ws",
		reversed: "sw.ude"
	},
	{
		suffix: "edu.ye",
		reversed: "ey.ude"
	},
	{
		suffix: "edu.za",
		reversed: "az.ude"
	},
	{
		suffix: "edu.zm",
		reversed: "mz.ude"
	},
	{
		suffix: "education",
		reversed: "noitacude"
	},
	{
		suffix: "education.museum",
		reversed: "muesum.noitacude"
	},
	{
		suffix: "educational.museum",
		reversed: "muesum.lanoitacude"
	},
	{
		suffix: "educator.aero",
		reversed: "orea.rotacude"
	},
	{
		suffix: "edugit.io",
		reversed: "oi.tigude"
	},
	{
		suffix: "ee",
		reversed: "ee"
	},
	{
		suffix: "ee.eu.org",
		reversed: "gro.ue.ee"
	},
	{
		suffix: "eero-stage.online",
		reversed: "enilno.egats-oree"
	},
	{
		suffix: "eero.online",
		reversed: "enilno.oree"
	},
	{
		suffix: "eg",
		reversed: "ge"
	},
	{
		suffix: "egersund.no",
		reversed: "on.dnusrege"
	},
	{
		suffix: "egoism.jp",
		reversed: "pj.msioge"
	},
	{
		suffix: "egyptian.museum",
		reversed: "muesum.naitpyge"
	},
	{
		suffix: "ehime.jp",
		reversed: "pj.emihe"
	},
	{
		suffix: "eid.no",
		reversed: "on.die"
	},
	{
		suffix: "eidfjord.no",
		reversed: "on.drojfdie"
	},
	{
		suffix: "eidsberg.no",
		reversed: "on.grebsdie"
	},
	{
		suffix: "eidskog.no",
		reversed: "on.goksdie"
	},
	{
		suffix: "eidsvoll.no",
		reversed: "on.llovsdie"
	},
	{
		suffix: "eigersund.no",
		reversed: "on.dnusregie"
	},
	{
		suffix: "eiheiji.fukui.jp",
		reversed: "pj.iukuf.ijiehie"
	},
	{
		suffix: "eisenbahn.museum",
		reversed: "muesum.nhabnesie"
	},
	{
		suffix: "ekloges.cy",
		reversed: "yc.segolke"
	},
	{
		suffix: "elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale"
	},
	{
		suffix: "elblag.pl",
		reversed: "lp.galble"
	},
	{
		suffix: "elburg.museum",
		reversed: "muesum.gruble"
	},
	{
		suffix: "elementor.cloud",
		reversed: "duolc.rotnemele"
	},
	{
		suffix: "elementor.cool",
		reversed: "looc.rotnemele"
	},
	{
		suffix: "elk.pl",
		reversed: "lp.kle"
	},
	{
		suffix: "elvendrell.museum",
		reversed: "muesum.llerdnevle"
	},
	{
		suffix: "elverum.no",
		reversed: "on.murevle"
	},
	{
		suffix: "email",
		reversed: "liame"
	},
	{
		suffix: "emb.kw",
		reversed: "wk.bme"
	},
	{
		suffix: "embaixada.st",
		reversed: "ts.adaxiabme"
	},
	{
		suffix: "embetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebme"
	},
	{
		suffix: "embroidery.museum",
		reversed: "muesum.yrediorbme"
	},
	{
		suffix: "emerck",
		reversed: "kcreme"
	},
	{
		suffix: "emergency.aero",
		reversed: "orea.ycnegreme"
	},
	{
		suffix: "emilia-romagna.it",
		reversed: "ti.angamor-ailime"
	},
	{
		suffix: "emiliaromagna.it",
		reversed: "ti.angamorailime"
	},
	{
		suffix: "emp.br",
		reversed: "rb.pme"
	},
	{
		suffix: "empresa.bo",
		reversed: "ob.aserpme"
	},
	{
		suffix: "emr.it",
		reversed: "ti.rme"
	},
	{
		suffix: "en-root.fr",
		reversed: "rf.toor-ne"
	},
	{
		suffix: "en.it",
		reversed: "ti.ne"
	},
	{
		suffix: "ena.gifu.jp",
		reversed: "pj.ufig.ane"
	},
	{
		suffix: "encoreapi.com",
		reversed: "moc.ipaerocne"
	},
	{
		suffix: "encr.app",
		reversed: "ppa.rcne"
	},
	{
		suffix: "encyclopedic.museum",
		reversed: "muesum.cidepolcycne"
	},
	{
		suffix: "endofinternet.net",
		reversed: "ten.tenretnifodne"
	},
	{
		suffix: "endofinternet.org",
		reversed: "gro.tenretnifodne"
	},
	{
		suffix: "endoftheinternet.org",
		reversed: "gro.tenretniehtfodne"
	},
	{
		suffix: "enebakk.no",
		reversed: "on.kkabene"
	},
	{
		suffix: "energy",
		reversed: "ygrene"
	},
	{
		suffix: "enf.br",
		reversed: "rb.fne"
	},
	{
		suffix: "eng.br",
		reversed: "rb.gne"
	},
	{
		suffix: "eng.pro",
		reversed: "orp.gne"
	},
	{
		suffix: "engerdal.no",
		reversed: "on.ladregne"
	},
	{
		suffix: "engine.aero",
		reversed: "orea.enigne"
	},
	{
		suffix: "engineer",
		reversed: "reenigne"
	},
	{
		suffix: "engineer.aero",
		reversed: "orea.reenigne"
	},
	{
		suffix: "engineering",
		reversed: "gnireenigne"
	},
	{
		suffix: "england.museum",
		reversed: "muesum.dnalgne"
	},
	{
		suffix: "eniwa.hokkaido.jp",
		reversed: "pj.odiakkoh.awine"
	},
	{
		suffix: "enna.it",
		reversed: "ti.anne"
	},
	{
		suffix: "ens.tn",
		reversed: "nt.sne"
	},
	{
		suffix: "enscaled.sg",
		reversed: "gs.delacsne"
	},
	{
		suffix: "ent.platform.sh",
		reversed: "hs.mroftalp.tne"
	},
	{
		suffix: "enterprisecloud.nu",
		reversed: "un.duolcesirpretne"
	},
	{
		suffix: "enterprises",
		reversed: "sesirpretne"
	},
	{
		suffix: "entertainment.aero",
		reversed: "orea.tnemniatretne"
	},
	{
		suffix: "entomology.museum",
		reversed: "muesum.ygolomotne"
	},
	{
		suffix: "environment.museum",
		reversed: "muesum.tnemnorivne"
	},
	{
		suffix: "environmentalconservation.museum",
		reversed: "muesum.noitavresnoclatnemnorivne"
	},
	{
		suffix: "epilepsy.museum",
		reversed: "muesum.yspelipe"
	},
	{
		suffix: "epson",
		reversed: "nospe"
	},
	{
		suffix: "equipment",
		reversed: "tnempiuqe"
	},
	{
		suffix: "equipment.aero",
		reversed: "orea.tnempiuqe"
	},
	{
		suffix: "er.in",
		reversed: "ni.re"
	},
	{
		suffix: "ericsson",
		reversed: "nosscire"
	},
	{
		suffix: "erimo.hokkaido.jp",
		reversed: "pj.odiakkoh.omire"
	},
	{
		suffix: "erni",
		reversed: "inre"
	},
	{
		suffix: "erotica.hu",
		reversed: "uh.acitore"
	},
	{
		suffix: "erotika.hu",
		reversed: "uh.akitore"
	},
	{
		suffix: "es",
		reversed: "se"
	},
	{
		suffix: "es-1.axarnet.cloud",
		reversed: "duolc.tenraxa.1-se"
	},
	{
		suffix: "es.ax",
		reversed: "xa.se"
	},
	{
		suffix: "es.eu.org",
		reversed: "gro.ue.se"
	},
	{
		suffix: "es.gov.br",
		reversed: "rb.vog.se"
	},
	{
		suffix: "es.kr",
		reversed: "rk.se"
	},
	{
		suffix: "es.leg.br",
		reversed: "rb.gel.se"
	},
	{
		suffix: "esan.hokkaido.jp",
		reversed: "pj.odiakkoh.nase"
	},
	{
		suffix: "esashi.hokkaido.jp",
		reversed: "pj.odiakkoh.ihsase"
	},
	{
		suffix: "esp.br",
		reversed: "rb.pse"
	},
	{
		suffix: "esq",
		reversed: "qse"
	},
	{
		suffix: "essex.museum",
		reversed: "muesum.xesse"
	},
	{
		suffix: "est-a-la-maison.com",
		reversed: "moc.nosiam-al-a-tse"
	},
	{
		suffix: "est-a-la-masion.com",
		reversed: "moc.noisam-al-a-tse"
	},
	{
		suffix: "est-le-patron.com",
		reversed: "moc.nortap-el-tse"
	},
	{
		suffix: "est-mon-blogueur.com",
		reversed: "moc.rueugolb-nom-tse"
	},
	{
		suffix: "est.pr",
		reversed: "rp.tse"
	},
	{
		suffix: "estate",
		reversed: "etatse"
	},
	{
		suffix: "estate.museum",
		reversed: "muesum.etatse"
	},
	{
		suffix: "et",
		reversed: "te"
	},
	{
		suffix: "etajima.hiroshima.jp",
		reversed: "pj.amihsorih.amijate"
	},
	{
		suffix: "etc.br",
		reversed: "rb.cte"
	},
	{
		suffix: "ethnology.museum",
		reversed: "muesum.ygolonhte"
	},
	{
		suffix: "eti.br",
		reversed: "rb.ite"
	},
	{
		suffix: "etisalat",
		reversed: "talasite"
	},
	{
		suffix: "etne.no",
		reversed: "on.ente"
	},
	{
		suffix: "etnedal.no",
		reversed: "on.ladente"
	},
	{
		suffix: "eu",
		reversed: "ue"
	},
	{
		suffix: "eu-1.evennode.com",
		reversed: "moc.edonneve.1-ue"
	},
	{
		suffix: "eu-2.evennode.com",
		reversed: "moc.edonneve.2-ue"
	},
	{
		suffix: "eu-3.evennode.com",
		reversed: "moc.edonneve.3-ue"
	},
	{
		suffix: "eu-4.evennode.com",
		reversed: "moc.edonneve.4-ue"
	},
	{
		suffix: "eu-central-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-lartnec-ue"
	},
	{
		suffix: "eu-west-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-tsew-ue"
	},
	{
		suffix: "eu-west-2.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.2-tsew-ue"
	},
	{
		suffix: "eu-west-3.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.3-tsew-ue"
	},
	{
		suffix: "eu.ax",
		reversed: "xa.ue"
	},
	{
		suffix: "eu.com",
		reversed: "moc.ue"
	},
	{
		suffix: "eu.encoway.cloud",
		reversed: "duolc.yawocne.ue"
	},
	{
		suffix: "eu.int",
		reversed: "tni.ue"
	},
	{
		suffix: "eu.meteorapp.com",
		reversed: "moc.pparoetem.ue"
	},
	{
		suffix: "eu.org",
		reversed: "gro.ue"
	},
	{
		suffix: "eu.platform.sh",
		reversed: "hs.mroftalp.ue"
	},
	{
		suffix: "eu.pythonanywhere.com",
		reversed: "moc.erehwynanohtyp.ue"
	},
	{
		suffix: "eun.eg",
		reversed: "ge.nue"
	},
	{
		suffix: "eurodir.ru",
		reversed: "ur.ridorue"
	},
	{
		suffix: "eurovision",
		reversed: "noisivorue"
	},
	{
		suffix: "eus",
		reversed: "sue"
	},
	{
		suffix: "evenassi.no",
		reversed: "on.issaneve"
	},
	{
		suffix: "evenes.no",
		reversed: "on.seneve"
	},
	{
		suffix: "events",
		reversed: "stneve"
	},
	{
		suffix: "evenášši.no",
		reversed: "on.ag10aq0-ineve--nx"
	},
	{
		suffix: "evje-og-hornnes.no",
		reversed: "on.sennroh-go-ejve"
	},
	{
		suffix: "exchange",
		reversed: "egnahcxe"
	},
	{
		suffix: "exchange.aero",
		reversed: "orea.egnahcxe"
	},
	{
		suffix: "exeter.museum",
		reversed: "muesum.retexe"
	},
	{
		suffix: "exhibition.museum",
		reversed: "muesum.noitibihxe"
	},
	{
		suffix: "exnet.su",
		reversed: "us.tenxe"
	},
	{
		suffix: "expert",
		reversed: "trepxe"
	},
	{
		suffix: "experts-comptables.fr",
		reversed: "rf.selbatpmoc-strepxe"
	},
	{
		suffix: "exposed",
		reversed: "desopxe"
	},
	{
		suffix: "express",
		reversed: "sserpxe"
	},
	{
		suffix: "express.aero",
		reversed: "orea.sserpxe"
	},
	{
		suffix: "extraspace",
		reversed: "ecapsartxe"
	},
	{
		suffix: "ezproxy.kuleuven.be",
		reversed: "eb.nevueluk.yxorpze"
	},
	{
		suffix: "f.bg",
		reversed: "gb.f"
	},
	{
		suffix: "f.se",
		reversed: "es.f"
	},
	{
		suffix: "fage",
		reversed: "egaf"
	},
	{
		suffix: "fail",
		reversed: "liaf"
	},
	{
		suffix: "fairwinds",
		reversed: "sdniwriaf"
	},
	{
		suffix: "faith",
		reversed: "htiaf"
	},
	{
		suffix: "fakefur.jp",
		reversed: "pj.rufekaf"
	},
	{
		suffix: "fam.pk",
		reversed: "kp.maf"
	},
	{
		suffix: "family",
		reversed: "ylimaf"
	},
	{
		suffix: "family.museum",
		reversed: "muesum.ylimaf"
	},
	{
		suffix: "familyds.com",
		reversed: "moc.sdylimaf"
	},
	{
		suffix: "familyds.net",
		reversed: "ten.sdylimaf"
	},
	{
		suffix: "familyds.org",
		reversed: "gro.sdylimaf"
	},
	{
		suffix: "fan",
		reversed: "naf"
	},
	{
		suffix: "fans",
		reversed: "snaf"
	},
	{
		suffix: "fantasyleague.cc",
		reversed: "cc.eugaelysatnaf"
	},
	{
		suffix: "far.br",
		reversed: "rb.raf"
	},
	{
		suffix: "farm",
		reversed: "mraf"
	},
	{
		suffix: "farm.museum",
		reversed: "muesum.mraf"
	},
	{
		suffix: "farmequipment.museum",
		reversed: "muesum.tnempiuqemraf"
	},
	{
		suffix: "farmers",
		reversed: "sremraf"
	},
	{
		suffix: "farmers.museum",
		reversed: "muesum.sremraf"
	},
	{
		suffix: "farmstead.museum",
		reversed: "muesum.daetsmraf"
	},
	{
		suffix: "farsund.no",
		reversed: "on.dnusraf"
	},
	{
		suffix: "fashion",
		reversed: "noihsaf"
	},
	{
		suffix: "fashionstore.jp",
		reversed: "pj.erotsnoihsaf"
	},
	{
		suffix: "fast",
		reversed: "tsaf"
	},
	{
		suffix: "fastly-terrarium.com",
		reversed: "moc.muirarret-yltsaf"
	},
	{
		suffix: "fastlylb.net",
		reversed: "ten.blyltsaf"
	},
	{
		suffix: "faststacks.net",
		reversed: "ten.skcatstsaf"
	},
	{
		suffix: "fastvps-server.com",
		reversed: "moc.revres-spvtsaf"
	},
	{
		suffix: "fastvps.host",
		reversed: "tsoh.spvtsaf"
	},
	{
		suffix: "fastvps.site",
		reversed: "etis.spvtsaf"
	},
	{
		suffix: "fauske.no",
		reversed: "on.eksuaf"
	},
	{
		suffix: "fbx-os.fr",
		reversed: "rf.so-xbf"
	},
	{
		suffix: "fbxos.fr",
		reversed: "rf.soxbf"
	},
	{
		suffix: "fc.it",
		reversed: "ti.cf"
	},
	{
		suffix: "fe.it",
		reversed: "ti.ef"
	},
	{
		suffix: "fed.us",
		reversed: "su.def"
	},
	{
		suffix: "federation.aero",
		reversed: "orea.noitaredef"
	},
	{
		suffix: "fedex",
		reversed: "xedef"
	},
	{
		suffix: "fedje.no",
		reversed: "on.ejdef"
	},
	{
		suffix: "fedorainfracloud.org",
		reversed: "gro.duolcarfniarodef"
	},
	{
		suffix: "fedorapeople.org",
		reversed: "gro.elpoeparodef"
	},
	{
		suffix: "feedback",
		reversed: "kcabdeef"
	},
	{
		suffix: "feira.br",
		reversed: "rb.arief"
	},
	{
		suffix: "fem.jp",
		reversed: "pj.mef"
	},
	{
		suffix: "fentiger.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.regitnef"
	},
	{
		suffix: "fermo.it",
		reversed: "ti.omref"
	},
	{
		suffix: "ferrara.it",
		reversed: "ti.ararref"
	},
	{
		suffix: "ferrari",
		reversed: "irarref"
	},
	{
		suffix: "ferrero",
		reversed: "orerref"
	},
	{
		suffix: "feste-ip.net",
		reversed: "ten.pi-etsef"
	},
	{
		suffix: "fet.no",
		reversed: "on.tef"
	},
	{
		suffix: "fetsund.no",
		reversed: "on.dnustef"
	},
	{
		suffix: "fg.it",
		reversed: "ti.gf"
	},
	{
		suffix: "fh-muenster.io",
		reversed: "oi.retsneum-hf"
	},
	{
		suffix: "fh.se",
		reversed: "es.hf"
	},
	{
		suffix: "fhs.no",
		reversed: "on.shf"
	},
	{
		suffix: "fhsk.se",
		reversed: "es.kshf"
	},
	{
		suffix: "fhv.se",
		reversed: "es.vhf"
	},
	{
		suffix: "fi",
		reversed: "if"
	},
	{
		suffix: "fi.cloudplatform.fi",
		reversed: "if.mroftalpduolc.if"
	},
	{
		suffix: "fi.cr",
		reversed: "rc.if"
	},
	{
		suffix: "fi.eu.org",
		reversed: "gro.ue.if"
	},
	{
		suffix: "fi.it",
		reversed: "ti.if"
	},
	{
		suffix: "fiat",
		reversed: "taif"
	},
	{
		suffix: "fidelity",
		reversed: "ytiledif"
	},
	{
		suffix: "fido",
		reversed: "odif"
	},
	{
		suffix: "fie.ee",
		reversed: "ee.eif"
	},
	{
		suffix: "field.museum",
		reversed: "muesum.dleif"
	},
	{
		suffix: "figueres.museum",
		reversed: "muesum.sereugif"
	},
	{
		suffix: "filatelia.museum",
		reversed: "muesum.ailetalif"
	},
	{
		suffix: "filegear-au.me",
		reversed: "em.ua-raegelif"
	},
	{
		suffix: "filegear-de.me",
		reversed: "em.ed-raegelif"
	},
	{
		suffix: "filegear-gb.me",
		reversed: "em.bg-raegelif"
	},
	{
		suffix: "filegear-ie.me",
		reversed: "em.ei-raegelif"
	},
	{
		suffix: "filegear-jp.me",
		reversed: "em.pj-raegelif"
	},
	{
		suffix: "filegear-sg.me",
		reversed: "em.gs-raegelif"
	},
	{
		suffix: "filegear.me",
		reversed: "em.raegelif"
	},
	{
		suffix: "film",
		reversed: "mlif"
	},
	{
		suffix: "film.hu",
		reversed: "uh.mlif"
	},
	{
		suffix: "film.museum",
		reversed: "muesum.mlif"
	},
	{
		suffix: "fin.ci",
		reversed: "ic.nif"
	},
	{
		suffix: "fin.ec",
		reversed: "ce.nif"
	},
	{
		suffix: "fin.tn",
		reversed: "nt.nif"
	},
	{
		suffix: "final",
		reversed: "lanif"
	},
	{
		suffix: "finance",
		reversed: "ecnanif"
	},
	{
		suffix: "financial",
		reversed: "laicnanif"
	},
	{
		suffix: "fineart.museum",
		reversed: "muesum.traenif"
	},
	{
		suffix: "finearts.museum",
		reversed: "muesum.straenif"
	},
	{
		suffix: "finland.museum",
		reversed: "muesum.dnalnif"
	},
	{
		suffix: "finnoy.no",
		reversed: "on.yonnif"
	},
	{
		suffix: "finnøy.no",
		reversed: "on.auy-ynnif--nx"
	},
	{
		suffix: "fire",
		reversed: "erif"
	},
	{
		suffix: "firebaseapp.com",
		reversed: "moc.ppaesaberif"
	},
	{
		suffix: "firenze.it",
		reversed: "ti.eznerif"
	},
	{
		suffix: "firestone",
		reversed: "enotserif"
	},
	{
		suffix: "firewall-gateway.com",
		reversed: "moc.yawetag-llawerif"
	},
	{
		suffix: "firewall-gateway.de",
		reversed: "ed.yawetag-llawerif"
	},
	{
		suffix: "firewall-gateway.net",
		reversed: "ten.yawetag-llawerif"
	},
	{
		suffix: "firewalledreplit.co",
		reversed: "oc.tilperdellawerif"
	},
	{
		suffix: "fireweb.app",
		reversed: "ppa.bewerif"
	},
	{
		suffix: "firm.co",
		reversed: "oc.mrif"
	},
	{
		suffix: "firm.dk",
		reversed: "kd.mrif"
	},
	{
		suffix: "firm.ht",
		reversed: "th.mrif"
	},
	{
		suffix: "firm.in",
		reversed: "ni.mrif"
	},
	{
		suffix: "firm.nf",
		reversed: "fn.mrif"
	},
	{
		suffix: "firm.ng",
		reversed: "gn.mrif"
	},
	{
		suffix: "firm.ro",
		reversed: "or.mrif"
	},
	{
		suffix: "firm.ve",
		reversed: "ev.mrif"
	},
	{
		suffix: "firmdale",
		reversed: "eladmrif"
	},
	{
		suffix: "fish",
		reversed: "hsif"
	},
	{
		suffix: "fishing",
		reversed: "gnihsif"
	},
	{
		suffix: "fit",
		reversed: "tif"
	},
	{
		suffix: "fitjar.no",
		reversed: "on.rajtif"
	},
	{
		suffix: "fitness",
		reversed: "ssentif"
	},
	{
		suffix: "fj",
		reversed: "jf"
	},
	{
		suffix: "fj.cn",
		reversed: "nc.jf"
	},
	{
		suffix: "fjaler.no",
		reversed: "on.relajf"
	},
	{
		suffix: "fjell.no",
		reversed: "on.llejf"
	},
	{
		suffix: "fl.us",
		reversed: "su.lf"
	},
	{
		suffix: "fla.no",
		reversed: "on.alf"
	},
	{
		suffix: "flakstad.no",
		reversed: "on.datskalf"
	},
	{
		suffix: "flanders.museum",
		reversed: "muesum.srednalf"
	},
	{
		suffix: "flap.id",
		reversed: "di.palf"
	},
	{
		suffix: "flatanger.no",
		reversed: "on.regnatalf"
	},
	{
		suffix: "fldrv.com",
		reversed: "moc.vrdlf"
	},
	{
		suffix: "flekkefjord.no",
		reversed: "on.drojfekkelf"
	},
	{
		suffix: "flesberg.no",
		reversed: "on.grebself"
	},
	{
		suffix: "flickr",
		reversed: "rkcilf"
	},
	{
		suffix: "flier.jp",
		reversed: "pj.reilf"
	},
	{
		suffix: "flight.aero",
		reversed: "orea.thgilf"
	},
	{
		suffix: "flights",
		reversed: "sthgilf"
	},
	{
		suffix: "flir",
		reversed: "rilf"
	},
	{
		suffix: "flog.br",
		reversed: "rb.golf"
	},
	{
		suffix: "floppy.jp",
		reversed: "pj.yppolf"
	},
	{
		suffix: "flora.no",
		reversed: "on.arolf"
	},
	{
		suffix: "florence.it",
		reversed: "ti.ecnerolf"
	},
	{
		suffix: "florida.museum",
		reversed: "muesum.adirolf"
	},
	{
		suffix: "floripa.br",
		reversed: "rb.apirolf"
	},
	{
		suffix: "florist",
		reversed: "tsirolf"
	},
	{
		suffix: "floro.no",
		reversed: "on.orolf"
	},
	{
		suffix: "florø.no",
		reversed: "on.arj-rolf--nx"
	},
	{
		suffix: "flowers",
		reversed: "srewolf"
	},
	{
		suffix: "flt.cloud.muni.cz",
		reversed: "zc.inum.duolc.tlf"
	},
	{
		suffix: "fly",
		reversed: "ylf"
	},
	{
		suffix: "fly.dev",
		reversed: "ved.ylf"
	},
	{
		suffix: "flynnhosting.net",
		reversed: "ten.gnitsohnnylf"
	},
	{
		suffix: "flå.no",
		reversed: "on.aiz-lf--nx"
	},
	{
		suffix: "fm",
		reversed: "mf"
	},
	{
		suffix: "fm.br",
		reversed: "rb.mf"
	},
	{
		suffix: "fm.it",
		reversed: "ti.mf"
	},
	{
		suffix: "fm.no",
		reversed: "on.mf"
	},
	{
		suffix: "fnc.fr-par.scw.cloud",
		reversed: "duolc.wcs.rap-rf.cnf"
	},
	{
		suffix: "fnd.br",
		reversed: "rb.dnf"
	},
	{
		suffix: "fnwk.site",
		reversed: "etis.kwnf"
	},
	{
		suffix: "fo",
		reversed: "of"
	},
	{
		suffix: "foggia.it",
		reversed: "ti.aiggof"
	},
	{
		suffix: "folionetwork.site",
		reversed: "etis.krowtenoilof"
	},
	{
		suffix: "folkebibl.no",
		reversed: "on.lbibeklof"
	},
	{
		suffix: "folldal.no",
		reversed: "on.ladllof"
	},
	{
		suffix: "foo",
		reversed: "oof"
	},
	{
		suffix: "food",
		reversed: "doof"
	},
	{
		suffix: "foodnetwork",
		reversed: "krowtendoof"
	},
	{
		suffix: "fool.jp",
		reversed: "pj.loof"
	},
	{
		suffix: "football",
		reversed: "llabtoof"
	},
	{
		suffix: "for-better.biz",
		reversed: "zib.retteb-rof"
	},
	{
		suffix: "for-more.biz",
		reversed: "zib.erom-rof"
	},
	{
		suffix: "for-our.info",
		reversed: "ofni.ruo-rof"
	},
	{
		suffix: "for-some.biz",
		reversed: "zib.emos-rof"
	},
	{
		suffix: "for-the.biz",
		reversed: "zib.eht-rof"
	},
	{
		suffix: "force.museum",
		reversed: "muesum.ecrof"
	},
	{
		suffix: "ford",
		reversed: "drof"
	},
	{
		suffix: "forde.no",
		reversed: "on.edrof"
	},
	{
		suffix: "forex",
		reversed: "xerof"
	},
	{
		suffix: "forgeblocks.com",
		reversed: "moc.skcolbegrof"
	},
	{
		suffix: "forgot.her.name",
		reversed: "eman.reh.togrof"
	},
	{
		suffix: "forgot.his.name",
		reversed: "eman.sih.togrof"
	},
	{
		suffix: "forli-cesena.it",
		reversed: "ti.anesec-ilrof"
	},
	{
		suffix: "forlicesena.it",
		reversed: "ti.anesecilrof"
	},
	{
		suffix: "forlì-cesena.it",
		reversed: "ti.bcf-anesec-lrof--nx"
	},
	{
		suffix: "forlìcesena.it",
		reversed: "ti.a8c-aneseclrof--nx"
	},
	{
		suffix: "forsale",
		reversed: "elasrof"
	},
	{
		suffix: "forsand.no",
		reversed: "on.dnasrof"
	},
	{
		suffix: "fortal.br",
		reversed: "rb.latrof"
	},
	{
		suffix: "forte.id",
		reversed: "di.etrof"
	},
	{
		suffix: "fortmissoula.museum",
		reversed: "muesum.aluossimtrof"
	},
	{
		suffix: "fortworth.museum",
		reversed: "muesum.htrowtrof"
	},
	{
		suffix: "forum",
		reversed: "murof"
	},
	{
		suffix: "forum.hu",
		reversed: "uh.murof"
	},
	{
		suffix: "forumz.info",
		reversed: "ofni.zmurof"
	},
	{
		suffix: "fosnes.no",
		reversed: "on.sensof"
	},
	{
		suffix: "fot.br",
		reversed: "rb.tof"
	},
	{
		suffix: "foundation",
		reversed: "noitadnuof"
	},
	{
		suffix: "foundation.museum",
		reversed: "muesum.noitadnuof"
	},
	{
		suffix: "fox",
		reversed: "xof"
	},
	{
		suffix: "foz.br",
		reversed: "rb.zof"
	},
	{
		suffix: "fr",
		reversed: "rf"
	},
	{
		suffix: "fr-1.paas.massivegrid.net",
		reversed: "ten.dirgevissam.saap.1-rf"
	},
	{
		suffix: "fr-par-1.baremetal.scw.cloud",
		reversed: "duolc.wcs.latemerab.1-rap-rf"
	},
	{
		suffix: "fr-par-2.baremetal.scw.cloud",
		reversed: "duolc.wcs.latemerab.2-rap-rf"
	},
	{
		suffix: "fr.eu.org",
		reversed: "gro.ue.rf"
	},
	{
		suffix: "fr.it",
		reversed: "ti.rf"
	},
	{
		suffix: "fra1-de.cloudjiffy.net",
		reversed: "ten.yffijduolc.ed-1arf"
	},
	{
		suffix: "framer.app",
		reversed: "ppa.remarf"
	},
	{
		suffix: "framer.media",
		reversed: "aidem.remarf"
	},
	{
		suffix: "framer.photos",
		reversed: "sotohp.remarf"
	},
	{
		suffix: "framer.website",
		reversed: "etisbew.remarf"
	},
	{
		suffix: "framer.wiki",
		reversed: "ikiw.remarf"
	},
	{
		suffix: "framercanvas.com",
		reversed: "moc.savnacremarf"
	},
	{
		suffix: "frana.no",
		reversed: "on.anarf"
	},
	{
		suffix: "francaise.museum",
		reversed: "muesum.esiacnarf"
	},
	{
		suffix: "frankfurt.museum",
		reversed: "muesum.trufknarf"
	},
	{
		suffix: "franziskaner.museum",
		reversed: "muesum.renaksiznarf"
	},
	{
		suffix: "fredrikstad.no",
		reversed: "on.datskirderf"
	},
	{
		suffix: "free",
		reversed: "eerf"
	},
	{
		suffix: "free.hr",
		reversed: "rh.eerf"
	},
	{
		suffix: "freebox-os.com",
		reversed: "moc.so-xobeerf"
	},
	{
		suffix: "freebox-os.fr",
		reversed: "rf.so-xobeerf"
	},
	{
		suffix: "freeboxos.com",
		reversed: "moc.soxobeerf"
	},
	{
		suffix: "freeboxos.fr",
		reversed: "rf.soxobeerf"
	},
	{
		suffix: "freeddns.org",
		reversed: "gro.snddeerf"
	},
	{
		suffix: "freeddns.us",
		reversed: "su.snddeerf"
	},
	{
		suffix: "freedesktop.org",
		reversed: "gro.potksedeerf"
	},
	{
		suffix: "freemasonry.museum",
		reversed: "muesum.yrnosameerf"
	},
	{
		suffix: "freemyip.com",
		reversed: "moc.piymeerf"
	},
	{
		suffix: "freesite.host",
		reversed: "tsoh.etiseerf"
	},
	{
		suffix: "freetls.fastly.net",
		reversed: "ten.yltsaf.slteerf"
	},
	{
		suffix: "frei.no",
		reversed: "on.ierf"
	},
	{
		suffix: "freiburg.museum",
		reversed: "muesum.grubierf"
	},
	{
		suffix: "frenchkiss.jp",
		reversed: "pj.ssikhcnerf"
	},
	{
		suffix: "fresenius",
		reversed: "suineserf"
	},
	{
		suffix: "fribourg.museum",
		reversed: "muesum.gruobirf"
	},
	{
		suffix: "friuli-v-giulia.it",
		reversed: "ti.ailuig-v-iluirf"
	},
	{
		suffix: "friuli-ve-giulia.it",
		reversed: "ti.ailuig-ev-iluirf"
	},
	{
		suffix: "friuli-vegiulia.it",
		reversed: "ti.ailuigev-iluirf"
	},
	{
		suffix: "friuli-venezia-giulia.it",
		reversed: "ti.ailuig-aizenev-iluirf"
	},
	{
		suffix: "friuli-veneziagiulia.it",
		reversed: "ti.ailuigaizenev-iluirf"
	},
	{
		suffix: "friuli-vgiulia.it",
		reversed: "ti.ailuigv-iluirf"
	},
	{
		suffix: "friuliv-giulia.it",
		reversed: "ti.ailuig-viluirf"
	},
	{
		suffix: "friulive-giulia.it",
		reversed: "ti.ailuig-eviluirf"
	},
	{
		suffix: "friulivegiulia.it",
		reversed: "ti.ailuigeviluirf"
	},
	{
		suffix: "friulivenezia-giulia.it",
		reversed: "ti.ailuig-aizeneviluirf"
	},
	{
		suffix: "friuliveneziagiulia.it",
		reversed: "ti.ailuigaizeneviluirf"
	},
	{
		suffix: "friulivgiulia.it",
		reversed: "ti.ailuigviluirf"
	},
	{
		suffix: "frl",
		reversed: "lrf"
	},
	{
		suffix: "frog.museum",
		reversed: "muesum.gorf"
	},
	{
		suffix: "frogans",
		reversed: "snagorf"
	},
	{
		suffix: "frogn.no",
		reversed: "on.ngorf"
	},
	{
		suffix: "froland.no",
		reversed: "on.dnalorf"
	},
	{
		suffix: "from-ak.com",
		reversed: "moc.ka-morf"
	},
	{
		suffix: "from-al.com",
		reversed: "moc.la-morf"
	},
	{
		suffix: "from-ar.com",
		reversed: "moc.ra-morf"
	},
	{
		suffix: "from-az.net",
		reversed: "ten.za-morf"
	},
	{
		suffix: "from-ca.com",
		reversed: "moc.ac-morf"
	},
	{
		suffix: "from-co.net",
		reversed: "ten.oc-morf"
	},
	{
		suffix: "from-ct.com",
		reversed: "moc.tc-morf"
	},
	{
		suffix: "from-dc.com",
		reversed: "moc.cd-morf"
	},
	{
		suffix: "from-de.com",
		reversed: "moc.ed-morf"
	},
	{
		suffix: "from-fl.com",
		reversed: "moc.lf-morf"
	},
	{
		suffix: "from-ga.com",
		reversed: "moc.ag-morf"
	},
	{
		suffix: "from-hi.com",
		reversed: "moc.ih-morf"
	},
	{
		suffix: "from-ia.com",
		reversed: "moc.ai-morf"
	},
	{
		suffix: "from-id.com",
		reversed: "moc.di-morf"
	},
	{
		suffix: "from-il.com",
		reversed: "moc.li-morf"
	},
	{
		suffix: "from-in.com",
		reversed: "moc.ni-morf"
	},
	{
		suffix: "from-ks.com",
		reversed: "moc.sk-morf"
	},
	{
		suffix: "from-ky.com",
		reversed: "moc.yk-morf"
	},
	{
		suffix: "from-la.net",
		reversed: "ten.al-morf"
	},
	{
		suffix: "from-ma.com",
		reversed: "moc.am-morf"
	},
	{
		suffix: "from-md.com",
		reversed: "moc.dm-morf"
	},
	{
		suffix: "from-me.org",
		reversed: "gro.em-morf"
	},
	{
		suffix: "from-mi.com",
		reversed: "moc.im-morf"
	},
	{
		suffix: "from-mn.com",
		reversed: "moc.nm-morf"
	},
	{
		suffix: "from-mo.com",
		reversed: "moc.om-morf"
	},
	{
		suffix: "from-ms.com",
		reversed: "moc.sm-morf"
	},
	{
		suffix: "from-mt.com",
		reversed: "moc.tm-morf"
	},
	{
		suffix: "from-nc.com",
		reversed: "moc.cn-morf"
	},
	{
		suffix: "from-nd.com",
		reversed: "moc.dn-morf"
	},
	{
		suffix: "from-ne.com",
		reversed: "moc.en-morf"
	},
	{
		suffix: "from-nh.com",
		reversed: "moc.hn-morf"
	},
	{
		suffix: "from-nj.com",
		reversed: "moc.jn-morf"
	},
	{
		suffix: "from-nm.com",
		reversed: "moc.mn-morf"
	},
	{
		suffix: "from-nv.com",
		reversed: "moc.vn-morf"
	},
	{
		suffix: "from-ny.net",
		reversed: "ten.yn-morf"
	},
	{
		suffix: "from-oh.com",
		reversed: "moc.ho-morf"
	},
	{
		suffix: "from-ok.com",
		reversed: "moc.ko-morf"
	},
	{
		suffix: "from-or.com",
		reversed: "moc.ro-morf"
	},
	{
		suffix: "from-pa.com",
		reversed: "moc.ap-morf"
	},
	{
		suffix: "from-pr.com",
		reversed: "moc.rp-morf"
	},
	{
		suffix: "from-ri.com",
		reversed: "moc.ir-morf"
	},
	{
		suffix: "from-sc.com",
		reversed: "moc.cs-morf"
	},
	{
		suffix: "from-sd.com",
		reversed: "moc.ds-morf"
	},
	{
		suffix: "from-tn.com",
		reversed: "moc.nt-morf"
	},
	{
		suffix: "from-tx.com",
		reversed: "moc.xt-morf"
	},
	{
		suffix: "from-ut.com",
		reversed: "moc.tu-morf"
	},
	{
		suffix: "from-va.com",
		reversed: "moc.av-morf"
	},
	{
		suffix: "from-vt.com",
		reversed: "moc.tv-morf"
	},
	{
		suffix: "from-wa.com",
		reversed: "moc.aw-morf"
	},
	{
		suffix: "from-wi.com",
		reversed: "moc.iw-morf"
	},
	{
		suffix: "from-wv.com",
		reversed: "moc.vw-morf"
	},
	{
		suffix: "from-wy.com",
		reversed: "moc.yw-morf"
	},
	{
		suffix: "from.hr",
		reversed: "rh.morf"
	},
	{
		suffix: "frontdoor",
		reversed: "roodtnorf"
	},
	{
		suffix: "frontier",
		reversed: "reitnorf"
	},
	{
		suffix: "frosinone.it",
		reversed: "ti.enonisorf"
	},
	{
		suffix: "frosta.no",
		reversed: "on.atsorf"
	},
	{
		suffix: "froya.no",
		reversed: "on.ayorf"
	},
	{
		suffix: "fræna.no",
		reversed: "on.aow-anrf--nx"
	},
	{
		suffix: "frøya.no",
		reversed: "on.arh-ayrf--nx"
	},
	{
		suffix: "fst.br",
		reversed: "rb.tsf"
	},
	{
		suffix: "ftpaccess.cc",
		reversed: "cc.sseccaptf"
	},
	{
		suffix: "ftr",
		reversed: "rtf"
	},
	{
		suffix: "fuchu.hiroshima.jp",
		reversed: "pj.amihsorih.uhcuf"
	},
	{
		suffix: "fuchu.tokyo.jp",
		reversed: "pj.oykot.uhcuf"
	},
	{
		suffix: "fuchu.toyama.jp",
		reversed: "pj.amayot.uhcuf"
	},
	{
		suffix: "fudai.iwate.jp",
		reversed: "pj.etawi.iaduf"
	},
	{
		suffix: "fuefuki.yamanashi.jp",
		reversed: "pj.ihsanamay.ikufeuf"
	},
	{
		suffix: "fuel.aero",
		reversed: "orea.leuf"
	},
	{
		suffix: "fuettertdasnetz.de",
		reversed: "ed.ztensadtretteuf"
	},
	{
		suffix: "fuji.shizuoka.jp",
		reversed: "pj.akouzihs.ijuf"
	},
	{
		suffix: "fujieda.shizuoka.jp",
		reversed: "pj.akouzihs.adeijuf"
	},
	{
		suffix: "fujiidera.osaka.jp",
		reversed: "pj.akaso.arediijuf"
	},
	{
		suffix: "fujikawa.shizuoka.jp",
		reversed: "pj.akouzihs.awakijuf"
	},
	{
		suffix: "fujikawa.yamanashi.jp",
		reversed: "pj.ihsanamay.awakijuf"
	},
	{
		suffix: "fujikawaguchiko.yamanashi.jp",
		reversed: "pj.ihsanamay.okihcugawakijuf"
	},
	{
		suffix: "fujimi.nagano.jp",
		reversed: "pj.onagan.imijuf"
	},
	{
		suffix: "fujimi.saitama.jp",
		reversed: "pj.amatias.imijuf"
	},
	{
		suffix: "fujimino.saitama.jp",
		reversed: "pj.amatias.onimijuf"
	},
	{
		suffix: "fujinomiya.shizuoka.jp",
		reversed: "pj.akouzihs.ayimonijuf"
	},
	{
		suffix: "fujioka.gunma.jp",
		reversed: "pj.amnug.akoijuf"
	},
	{
		suffix: "fujisato.akita.jp",
		reversed: "pj.atika.otasijuf"
	},
	{
		suffix: "fujisawa.iwate.jp",
		reversed: "pj.etawi.awasijuf"
	},
	{
		suffix: "fujisawa.kanagawa.jp",
		reversed: "pj.awaganak.awasijuf"
	},
	{
		suffix: "fujishiro.ibaraki.jp",
		reversed: "pj.ikarabi.orihsijuf"
	},
	{
		suffix: "fujitsu",
		reversed: "ustijuf"
	},
	{
		suffix: "fujiyoshida.yamanashi.jp",
		reversed: "pj.ihsanamay.adihsoyijuf"
	},
	{
		suffix: "fukagawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awagakuf"
	},
	{
		suffix: "fukaya.saitama.jp",
		reversed: "pj.amatias.ayakuf"
	},
	{
		suffix: "fukuchi.fukuoka.jp",
		reversed: "pj.akoukuf.ihcukuf"
	},
	{
		suffix: "fukuchiyama.kyoto.jp",
		reversed: "pj.otoyk.amayihcukuf"
	},
	{
		suffix: "fukudomi.saga.jp",
		reversed: "pj.agas.imodukuf"
	},
	{
		suffix: "fukui.fukui.jp",
		reversed: "pj.iukuf.iukuf"
	},
	{
		suffix: "fukui.jp",
		reversed: "pj.iukuf"
	},
	{
		suffix: "fukumitsu.toyama.jp",
		reversed: "pj.amayot.ustimukuf"
	},
	{
		suffix: "fukuoka.jp",
		reversed: "pj.akoukuf"
	},
	{
		suffix: "fukuroi.shizuoka.jp",
		reversed: "pj.akouzihs.iorukuf"
	},
	{
		suffix: "fukusaki.hyogo.jp",
		reversed: "pj.ogoyh.ikasukuf"
	},
	{
		suffix: "fukushima.fukushima.jp",
		reversed: "pj.amihsukuf.amihsukuf"
	},
	{
		suffix: "fukushima.hokkaido.jp",
		reversed: "pj.odiakkoh.amihsukuf"
	},
	{
		suffix: "fukushima.jp",
		reversed: "pj.amihsukuf"
	},
	{
		suffix: "fukuyama.hiroshima.jp",
		reversed: "pj.amihsorih.amayukuf"
	},
	{
		suffix: "fun",
		reversed: "nuf"
	},
	{
		suffix: "funabashi.chiba.jp",
		reversed: "pj.abihc.ihsabanuf"
	},
	{
		suffix: "funagata.yamagata.jp",
		reversed: "pj.atagamay.ataganuf"
	},
	{
		suffix: "funahashi.toyama.jp",
		reversed: "pj.amayot.ihsahanuf"
	},
	{
		suffix: "functions.fnc.fr-par.scw.cloud",
		reversed: "duolc.wcs.rap-rf.cnf.snoitcnuf"
	},
	{
		suffix: "fund",
		reversed: "dnuf"
	},
	{
		suffix: "fundacio.museum",
		reversed: "muesum.oicadnuf"
	},
	{
		suffix: "fuoisku.no",
		reversed: "on.uksiouf"
	},
	{
		suffix: "fuossko.no",
		reversed: "on.okssouf"
	},
	{
		suffix: "furano.hokkaido.jp",
		reversed: "pj.odiakkoh.onaruf"
	},
	{
		suffix: "furniture",
		reversed: "erutinruf"
	},
	{
		suffix: "furniture.museum",
		reversed: "muesum.erutinruf"
	},
	{
		suffix: "furubira.hokkaido.jp",
		reversed: "pj.odiakkoh.ariburuf"
	},
	{
		suffix: "furudono.fukushima.jp",
		reversed: "pj.amihsukuf.onoduruf"
	},
	{
		suffix: "furukawa.miyagi.jp",
		reversed: "pj.igayim.awakuruf"
	},
	{
		suffix: "fusa.no",
		reversed: "on.asuf"
	},
	{
		suffix: "fuso.aichi.jp",
		reversed: "pj.ihcia.osuf"
	},
	{
		suffix: "fussa.tokyo.jp",
		reversed: "pj.oykot.assuf"
	},
	{
		suffix: "futaba.fukushima.jp",
		reversed: "pj.amihsukuf.abatuf"
	},
	{
		suffix: "futbol",
		reversed: "lobtuf"
	},
	{
		suffix: "futsu.nagasaki.jp",
		reversed: "pj.ikasagan.ustuf"
	},
	{
		suffix: "futtsu.chiba.jp",
		reversed: "pj.abihc.usttuf"
	},
	{
		suffix: "futurehosting.at",
		reversed: "ta.gnitsoherutuf"
	},
	{
		suffix: "futuremailing.at",
		reversed: "ta.gniliamerutuf"
	},
	{
		suffix: "fvg.it",
		reversed: "ti.gvf"
	},
	{
		suffix: "fyi",
		reversed: "iyf"
	},
	{
		suffix: "fylkesbibl.no",
		reversed: "on.lbibseklyf"
	},
	{
		suffix: "fyresdal.no",
		reversed: "on.ladseryf"
	},
	{
		suffix: "førde.no",
		reversed: "on.arg-edrf--nx"
	},
	{
		suffix: "g.bg",
		reversed: "gb.g"
	},
	{
		suffix: "g.se",
		reversed: "es.g"
	},
	{
		suffix: "g.vbrplsbx.io",
		reversed: "oi.xbslprbv.g"
	},
	{
		suffix: "g12.br",
		reversed: "rb.21g"
	},
	{
		suffix: "ga",
		reversed: "ag"
	},
	{
		suffix: "ga.us",
		reversed: "su.ag"
	},
	{
		suffix: "gaivuotna.no",
		reversed: "on.antouviag"
	},
	{
		suffix: "gal",
		reversed: "lag"
	},
	{
		suffix: "gallery",
		reversed: "yrellag"
	},
	{
		suffix: "gallery.museum",
		reversed: "muesum.yrellag"
	},
	{
		suffix: "gallo",
		reversed: "ollag"
	},
	{
		suffix: "gallup",
		reversed: "pullag"
	},
	{
		suffix: "galsa.no",
		reversed: "on.aslag"
	},
	{
		suffix: "gamagori.aichi.jp",
		reversed: "pj.ihcia.irogamag"
	},
	{
		suffix: "game",
		reversed: "emag"
	},
	{
		suffix: "game-host.org",
		reversed: "gro.tsoh-emag"
	},
	{
		suffix: "game-server.cc",
		reversed: "cc.revres-emag"
	},
	{
		suffix: "game.tw",
		reversed: "wt.emag"
	},
	{
		suffix: "games",
		reversed: "semag"
	},
	{
		suffix: "games.hu",
		reversed: "uh.semag"
	},
	{
		suffix: "gamo.shiga.jp",
		reversed: "pj.agihs.omag"
	},
	{
		suffix: "gamvik.no",
		reversed: "on.kivmag"
	},
	{
		suffix: "gangaviika.no",
		reversed: "on.akiivagnag"
	},
	{
		suffix: "gangwon.kr",
		reversed: "rk.nowgnag"
	},
	{
		suffix: "gap",
		reversed: "pag"
	},
	{
		suffix: "garden",
		reversed: "nedrag"
	},
	{
		suffix: "garden.museum",
		reversed: "muesum.nedrag"
	},
	{
		suffix: "gateway.museum",
		reversed: "muesum.yawetag"
	},
	{
		suffix: "gaular.no",
		reversed: "on.raluag"
	},
	{
		suffix: "gausdal.no",
		reversed: "on.ladsuag"
	},
	{
		suffix: "gay",
		reversed: "yag"
	},
	{
		suffix: "gb",
		reversed: "bg"
	},
	{
		suffix: "gb.net",
		reversed: "ten.bg"
	},
	{
		suffix: "gbiz",
		reversed: "zibg"
	},
	{
		suffix: "gc.ca",
		reversed: "ac.cg"
	},
	{
		suffix: "gd",
		reversed: "dg"
	},
	{
		suffix: "gd.cn",
		reversed: "nc.dg"
	},
	{
		suffix: "gda.pl",
		reversed: "lp.adg"
	},
	{
		suffix: "gdansk.pl",
		reversed: "lp.ksnadg"
	},
	{
		suffix: "gdn",
		reversed: "ndg"
	},
	{
		suffix: "gdynia.pl",
		reversed: "lp.ainydg"
	},
	{
		suffix: "ge",
		reversed: "eg"
	},
	{
		suffix: "ge.it",
		reversed: "ti.eg"
	},
	{
		suffix: "gea",
		reversed: "aeg"
	},
	{
		suffix: "geek.nz",
		reversed: "zn.keeg"
	},
	{
		suffix: "geekgalaxy.com",
		reversed: "moc.yxalagkeeg"
	},
	{
		suffix: "geelvinck.museum",
		reversed: "muesum.kcnivleeg"
	},
	{
		suffix: "gehirn.ne.jp",
		reversed: "pj.en.nriheg"
	},
	{
		suffix: "geisei.kochi.jp",
		reversed: "pj.ihcok.iesieg"
	},
	{
		suffix: "gemological.museum",
		reversed: "muesum.lacigolomeg"
	},
	{
		suffix: "gen.in",
		reversed: "ni.neg"
	},
	{
		suffix: "gen.mi.us",
		reversed: "su.im.neg"
	},
	{
		suffix: "gen.ng",
		reversed: "gn.neg"
	},
	{
		suffix: "gen.nz",
		reversed: "zn.neg"
	},
	{
		suffix: "gen.tr",
		reversed: "rt.neg"
	},
	{
		suffix: "genkai.saga.jp",
		reversed: "pj.agas.iakneg"
	},
	{
		suffix: "genoa.it",
		reversed: "ti.aoneg"
	},
	{
		suffix: "genova.it",
		reversed: "ti.avoneg"
	},
	{
		suffix: "gent",
		reversed: "tneg"
	},
	{
		suffix: "gentapps.com",
		reversed: "moc.sppatneg"
	},
	{
		suffix: "genting",
		reversed: "gnitneg"
	},
	{
		suffix: "gentlentapis.com",
		reversed: "moc.sipatneltneg"
	},
	{
		suffix: "geo.br",
		reversed: "rb.oeg"
	},
	{
		suffix: "geology.museum",
		reversed: "muesum.ygoloeg"
	},
	{
		suffix: "geometre-expert.fr",
		reversed: "rf.trepxe-ertemoeg"
	},
	{
		suffix: "george",
		reversed: "egroeg"
	},
	{
		suffix: "georgia.museum",
		reversed: "muesum.aigroeg"
	},
	{
		suffix: "georgia.su",
		reversed: "us.aigroeg"
	},
	{
		suffix: "getmyip.com",
		reversed: "moc.piymteg"
	},
	{
		suffix: "gets-it.net",
		reversed: "ten.ti-steg"
	},
	{
		suffix: "gf",
		reversed: "fg"
	},
	{
		suffix: "gg",
		reversed: "gg"
	},
	{
		suffix: "gg.ax",
		reversed: "xa.gg"
	},
	{
		suffix: "ggee",
		reversed: "eegg"
	},
	{
		suffix: "ggf.br",
		reversed: "rb.fgg"
	},
	{
		suffix: "gh",
		reversed: "hg"
	},
	{
		suffix: "ghost.io",
		reversed: "oi.tsohg"
	},
	{
		suffix: "gi",
		reversed: "ig"
	},
	{
		suffix: "giehtavuoatna.no",
		reversed: "on.antaouvatheig"
	},
	{
		suffix: "giessen.museum",
		reversed: "muesum.nesseig"
	},
	{
		suffix: "gift",
		reversed: "tfig"
	},
	{
		suffix: "gifts",
		reversed: "stfig"
	},
	{
		suffix: "gifu.gifu.jp",
		reversed: "pj.ufig.ufig"
	},
	{
		suffix: "gifu.jp",
		reversed: "pj.ufig"
	},
	{
		suffix: "giize.com",
		reversed: "moc.eziig"
	},
	{
		suffix: "gildeskal.no",
		reversed: "on.laksedlig"
	},
	{
		suffix: "gildeskål.no",
		reversed: "on.a0g-lksedlig--nx"
	},
	{
		suffix: "ginan.gifu.jp",
		reversed: "pj.ufig.nanig"
	},
	{
		suffix: "ginowan.okinawa.jp",
		reversed: "pj.awaniko.nawonig"
	},
	{
		suffix: "ginoza.okinawa.jp",
		reversed: "pj.awaniko.azonig"
	},
	{
		suffix: "girlfriend.jp",
		reversed: "pj.dneirflrig"
	},
	{
		suffix: "girly.jp",
		reversed: "pj.ylrig"
	},
	{
		suffix: "giske.no",
		reversed: "on.eksig"
	},
	{
		suffix: "git-pages.rit.edu",
		reversed: "ude.tir.segap-tig"
	},
	{
		suffix: "git-repos.de",
		reversed: "ed.soper-tig"
	},
	{
		suffix: "gitapp.si",
		reversed: "is.ppatig"
	},
	{
		suffix: "github.io",
		reversed: "oi.buhtig"
	},
	{
		suffix: "githubpreview.dev",
		reversed: "ved.weiverpbuhtig"
	},
	{
		suffix: "githubusercontent.com",
		reversed: "moc.tnetnocresubuhtig"
	},
	{
		suffix: "gitlab.io",
		reversed: "oi.baltig"
	},
	{
		suffix: "gitpage.si",
		reversed: "is.egaptig"
	},
	{
		suffix: "gives",
		reversed: "sevig"
	},
	{
		suffix: "giving",
		reversed: "gnivig"
	},
	{
		suffix: "gjemnes.no",
		reversed: "on.senmejg"
	},
	{
		suffix: "gjerdrum.no",
		reversed: "on.murdrejg"
	},
	{
		suffix: "gjerstad.no",
		reversed: "on.datsrejg"
	},
	{
		suffix: "gjesdal.no",
		reversed: "on.ladsejg"
	},
	{
		suffix: "gjovik.no",
		reversed: "on.kivojg"
	},
	{
		suffix: "gjøvik.no",
		reversed: "on.auw-kivjg--nx"
	},
	{
		suffix: "gl",
		reversed: "lg"
	},
	{
		suffix: "glas.museum",
		reversed: "muesum.salg"
	},
	{
		suffix: "glass",
		reversed: "ssalg"
	},
	{
		suffix: "glass.museum",
		reversed: "muesum.ssalg"
	},
	{
		suffix: "gle",
		reversed: "elg"
	},
	{
		suffix: "gleeze.com",
		reversed: "moc.ezeelg"
	},
	{
		suffix: "gliding.aero",
		reversed: "orea.gnidilg"
	},
	{
		suffix: "glitch.me",
		reversed: "em.hctilg"
	},
	{
		suffix: "gliwice.pl",
		reversed: "lp.eciwilg"
	},
	{
		suffix: "global",
		reversed: "labolg"
	},
	{
		suffix: "global.prod.fastly.net",
		reversed: "ten.yltsaf.dorp.labolg"
	},
	{
		suffix: "global.ssl.fastly.net",
		reversed: "ten.yltsaf.lss.labolg"
	},
	{
		suffix: "globo",
		reversed: "obolg"
	},
	{
		suffix: "glogow.pl",
		reversed: "lp.wogolg"
	},
	{
		suffix: "gloomy.jp",
		reversed: "pj.ymoolg"
	},
	{
		suffix: "gloppen.no",
		reversed: "on.neppolg"
	},
	{
		suffix: "glug.org.uk",
		reversed: "ku.gro.gulg"
	},
	{
		suffix: "gm",
		reversed: "mg"
	},
	{
		suffix: "gmail",
		reversed: "liamg"
	},
	{
		suffix: "gmbh",
		reversed: "hbmg"
	},
	{
		suffix: "gmina.pl",
		reversed: "lp.animg"
	},
	{
		suffix: "gmo",
		reversed: "omg"
	},
	{
		suffix: "gmx",
		reversed: "xmg"
	},
	{
		suffix: "gn",
		reversed: "ng"
	},
	{
		suffix: "gniezno.pl",
		reversed: "lp.onzeing"
	},
	{
		suffix: "go.ci",
		reversed: "ic.og"
	},
	{
		suffix: "go.cr",
		reversed: "rc.og"
	},
	{
		suffix: "go.dyndns.org",
		reversed: "gro.sndnyd.og"
	},
	{
		suffix: "go.gov.br",
		reversed: "rb.vog.og"
	},
	{
		suffix: "go.id",
		reversed: "di.og"
	},
	{
		suffix: "go.it",
		reversed: "ti.og"
	},
	{
		suffix: "go.jp",
		reversed: "pj.og"
	},
	{
		suffix: "go.ke",
		reversed: "ek.og"
	},
	{
		suffix: "go.kr",
		reversed: "rk.og"
	},
	{
		suffix: "go.leg.br",
		reversed: "rb.gel.og"
	},
	{
		suffix: "go.pw",
		reversed: "wp.og"
	},
	{
		suffix: "go.th",
		reversed: "ht.og"
	},
	{
		suffix: "go.tj",
		reversed: "jt.og"
	},
	{
		suffix: "go.tz",
		reversed: "zt.og"
	},
	{
		suffix: "go.ug",
		reversed: "gu.og"
	},
	{
		suffix: "gob.ar",
		reversed: "ra.bog"
	},
	{
		suffix: "gob.bo",
		reversed: "ob.bog"
	},
	{
		suffix: "gob.cl",
		reversed: "lc.bog"
	},
	{
		suffix: "gob.do",
		reversed: "od.bog"
	},
	{
		suffix: "gob.ec",
		reversed: "ce.bog"
	},
	{
		suffix: "gob.es",
		reversed: "se.bog"
	},
	{
		suffix: "gob.gt",
		reversed: "tg.bog"
	},
	{
		suffix: "gob.hn",
		reversed: "nh.bog"
	},
	{
		suffix: "gob.mx",
		reversed: "xm.bog"
	},
	{
		suffix: "gob.ni",
		reversed: "in.bog"
	},
	{
		suffix: "gob.pa",
		reversed: "ap.bog"
	},
	{
		suffix: "gob.pe",
		reversed: "ep.bog"
	},
	{
		suffix: "gob.pk",
		reversed: "kp.bog"
	},
	{
		suffix: "gob.sv",
		reversed: "vs.bog"
	},
	{
		suffix: "gob.ve",
		reversed: "ev.bog"
	},
	{
		suffix: "gobo.wakayama.jp",
		reversed: "pj.amayakaw.obog"
	},
	{
		suffix: "godaddy",
		reversed: "yddadog"
	},
	{
		suffix: "godo.gifu.jp",
		reversed: "pj.ufig.odog"
	},
	{
		suffix: "goiania.br",
		reversed: "rb.ainaiog"
	},
	{
		suffix: "goip.de",
		reversed: "ed.piog"
	},
	{
		suffix: "gojome.akita.jp",
		reversed: "pj.atika.emojog"
	},
	{
		suffix: "gok.pk",
		reversed: "kp.kog"
	},
	{
		suffix: "gokase.miyazaki.jp",
		reversed: "pj.ikazayim.esakog"
	},
	{
		suffix: "gol.no",
		reversed: "on.log"
	},
	{
		suffix: "gold",
		reversed: "dlog"
	},
	{
		suffix: "goldpoint",
		reversed: "tniopdlog"
	},
	{
		suffix: "golf",
		reversed: "flog"
	},
	{
		suffix: "golffan.us",
		reversed: "su.nafflog"
	},
	{
		suffix: "gon.pk",
		reversed: "kp.nog"
	},
	{
		suffix: "gonna.jp",
		reversed: "pj.annog"
	},
	{
		suffix: "gonohe.aomori.jp",
		reversed: "pj.iromoa.ehonog"
	},
	{
		suffix: "goo",
		reversed: "oog"
	},
	{
		suffix: "goodyear",
		reversed: "raeydoog"
	},
	{
		suffix: "goog",
		reversed: "goog"
	},
	{
		suffix: "google",
		reversed: "elgoog"
	},
	{
		suffix: "googleapis.com",
		reversed: "moc.sipaelgoog"
	},
	{
		suffix: "googlecode.com",
		reversed: "moc.edocelgoog"
	},
	{
		suffix: "gop",
		reversed: "pog"
	},
	{
		suffix: "gop.pk",
		reversed: "kp.pog"
	},
	{
		suffix: "gorge.museum",
		reversed: "muesum.egrog"
	},
	{
		suffix: "gorizia.it",
		reversed: "ti.aizirog"
	},
	{
		suffix: "gorlice.pl",
		reversed: "lp.ecilrog"
	},
	{
		suffix: "gos.pk",
		reversed: "kp.sog"
	},
	{
		suffix: "gose.nara.jp",
		reversed: "pj.aran.esog"
	},
	{
		suffix: "gosen.niigata.jp",
		reversed: "pj.atagiin.nesog"
	},
	{
		suffix: "goshiki.hyogo.jp",
		reversed: "pj.ogoyh.ikihsog"
	},
	{
		suffix: "got",
		reversed: "tog"
	},
	{
		suffix: "gotdns.ch",
		reversed: "hc.sndtog"
	},
	{
		suffix: "gotdns.com",
		reversed: "moc.sndtog"
	},
	{
		suffix: "gotdns.org",
		reversed: "gro.sndtog"
	},
	{
		suffix: "gotemba.shizuoka.jp",
		reversed: "pj.akouzihs.abmetog"
	},
	{
		suffix: "goto.nagasaki.jp",
		reversed: "pj.ikasagan.otog"
	},
	{
		suffix: "gotpantheon.com",
		reversed: "moc.noehtnaptog"
	},
	{
		suffix: "gotsu.shimane.jp",
		reversed: "pj.enamihs.ustog"
	},
	{
		suffix: "goupile.fr",
		reversed: "rf.elipuog"
	},
	{
		suffix: "gouv.bj",
		reversed: "jb.vuog"
	},
	{
		suffix: "gouv.ci",
		reversed: "ic.vuog"
	},
	{
		suffix: "gouv.fr",
		reversed: "rf.vuog"
	},
	{
		suffix: "gouv.ht",
		reversed: "th.vuog"
	},
	{
		suffix: "gouv.km",
		reversed: "mk.vuog"
	},
	{
		suffix: "gouv.ml",
		reversed: "lm.vuog"
	},
	{
		suffix: "gouv.sn",
		reversed: "ns.vuog"
	},
	{
		suffix: "gov",
		reversed: "vog"
	},
	{
		suffix: "gov.ac",
		reversed: "ca.vog"
	},
	{
		suffix: "gov.ae",
		reversed: "ea.vog"
	},
	{
		suffix: "gov.af",
		reversed: "fa.vog"
	},
	{
		suffix: "gov.al",
		reversed: "la.vog"
	},
	{
		suffix: "gov.ar",
		reversed: "ra.vog"
	},
	{
		suffix: "gov.as",
		reversed: "sa.vog"
	},
	{
		suffix: "gov.au",
		reversed: "ua.vog"
	},
	{
		suffix: "gov.az",
		reversed: "za.vog"
	},
	{
		suffix: "gov.ba",
		reversed: "ab.vog"
	},
	{
		suffix: "gov.bb",
		reversed: "bb.vog"
	},
	{
		suffix: "gov.bf",
		reversed: "fb.vog"
	},
	{
		suffix: "gov.bh",
		reversed: "hb.vog"
	},
	{
		suffix: "gov.bm",
		reversed: "mb.vog"
	},
	{
		suffix: "gov.bn",
		reversed: "nb.vog"
	},
	{
		suffix: "gov.br",
		reversed: "rb.vog"
	},
	{
		suffix: "gov.bs",
		reversed: "sb.vog"
	},
	{
		suffix: "gov.bt",
		reversed: "tb.vog"
	},
	{
		suffix: "gov.by",
		reversed: "yb.vog"
	},
	{
		suffix: "gov.bz",
		reversed: "zb.vog"
	},
	{
		suffix: "gov.cd",
		reversed: "dc.vog"
	},
	{
		suffix: "gov.cl",
		reversed: "lc.vog"
	},
	{
		suffix: "gov.cm",
		reversed: "mc.vog"
	},
	{
		suffix: "gov.cn",
		reversed: "nc.vog"
	},
	{
		suffix: "gov.co",
		reversed: "oc.vog"
	},
	{
		suffix: "gov.cu",
		reversed: "uc.vog"
	},
	{
		suffix: "gov.cx",
		reversed: "xc.vog"
	},
	{
		suffix: "gov.cy",
		reversed: "yc.vog"
	},
	{
		suffix: "gov.dm",
		reversed: "md.vog"
	},
	{
		suffix: "gov.do",
		reversed: "od.vog"
	},
	{
		suffix: "gov.dz",
		reversed: "zd.vog"
	},
	{
		suffix: "gov.ec",
		reversed: "ce.vog"
	},
	{
		suffix: "gov.ee",
		reversed: "ee.vog"
	},
	{
		suffix: "gov.eg",
		reversed: "ge.vog"
	},
	{
		suffix: "gov.et",
		reversed: "te.vog"
	},
	{
		suffix: "gov.fj",
		reversed: "jf.vog"
	},
	{
		suffix: "gov.gd",
		reversed: "dg.vog"
	},
	{
		suffix: "gov.ge",
		reversed: "eg.vog"
	},
	{
		suffix: "gov.gh",
		reversed: "hg.vog"
	},
	{
		suffix: "gov.gi",
		reversed: "ig.vog"
	},
	{
		suffix: "gov.gn",
		reversed: "ng.vog"
	},
	{
		suffix: "gov.gr",
		reversed: "rg.vog"
	},
	{
		suffix: "gov.gu",
		reversed: "ug.vog"
	},
	{
		suffix: "gov.gy",
		reversed: "yg.vog"
	},
	{
		suffix: "gov.hk",
		reversed: "kh.vog"
	},
	{
		suffix: "gov.ie",
		reversed: "ei.vog"
	},
	{
		suffix: "gov.il",
		reversed: "li.vog"
	},
	{
		suffix: "gov.in",
		reversed: "ni.vog"
	},
	{
		suffix: "gov.iq",
		reversed: "qi.vog"
	},
	{
		suffix: "gov.ir",
		reversed: "ri.vog"
	},
	{
		suffix: "gov.is",
		reversed: "si.vog"
	},
	{
		suffix: "gov.it",
		reversed: "ti.vog"
	},
	{
		suffix: "gov.jo",
		reversed: "oj.vog"
	},
	{
		suffix: "gov.kg",
		reversed: "gk.vog"
	},
	{
		suffix: "gov.ki",
		reversed: "ik.vog"
	},
	{
		suffix: "gov.km",
		reversed: "mk.vog"
	},
	{
		suffix: "gov.kn",
		reversed: "nk.vog"
	},
	{
		suffix: "gov.kp",
		reversed: "pk.vog"
	},
	{
		suffix: "gov.kw",
		reversed: "wk.vog"
	},
	{
		suffix: "gov.kz",
		reversed: "zk.vog"
	},
	{
		suffix: "gov.la",
		reversed: "al.vog"
	},
	{
		suffix: "gov.lb",
		reversed: "bl.vog"
	},
	{
		suffix: "gov.lc",
		reversed: "cl.vog"
	},
	{
		suffix: "gov.lk",
		reversed: "kl.vog"
	},
	{
		suffix: "gov.lr",
		reversed: "rl.vog"
	},
	{
		suffix: "gov.ls",
		reversed: "sl.vog"
	},
	{
		suffix: "gov.lt",
		reversed: "tl.vog"
	},
	{
		suffix: "gov.lv",
		reversed: "vl.vog"
	},
	{
		suffix: "gov.ly",
		reversed: "yl.vog"
	},
	{
		suffix: "gov.ma",
		reversed: "am.vog"
	},
	{
		suffix: "gov.me",
		reversed: "em.vog"
	},
	{
		suffix: "gov.mg",
		reversed: "gm.vog"
	},
	{
		suffix: "gov.mk",
		reversed: "km.vog"
	},
	{
		suffix: "gov.ml",
		reversed: "lm.vog"
	},
	{
		suffix: "gov.mn",
		reversed: "nm.vog"
	},
	{
		suffix: "gov.mo",
		reversed: "om.vog"
	},
	{
		suffix: "gov.mr",
		reversed: "rm.vog"
	},
	{
		suffix: "gov.ms",
		reversed: "sm.vog"
	},
	{
		suffix: "gov.mu",
		reversed: "um.vog"
	},
	{
		suffix: "gov.mv",
		reversed: "vm.vog"
	},
	{
		suffix: "gov.mw",
		reversed: "wm.vog"
	},
	{
		suffix: "gov.my",
		reversed: "ym.vog"
	},
	{
		suffix: "gov.mz",
		reversed: "zm.vog"
	},
	{
		suffix: "gov.nc.tr",
		reversed: "rt.cn.vog"
	},
	{
		suffix: "gov.ng",
		reversed: "gn.vog"
	},
	{
		suffix: "gov.nl",
		reversed: "ln.vog"
	},
	{
		suffix: "gov.nr",
		reversed: "rn.vog"
	},
	{
		suffix: "gov.om",
		reversed: "mo.vog"
	},
	{
		suffix: "gov.ph",
		reversed: "hp.vog"
	},
	{
		suffix: "gov.pk",
		reversed: "kp.vog"
	},
	{
		suffix: "gov.pl",
		reversed: "lp.vog"
	},
	{
		suffix: "gov.pn",
		reversed: "np.vog"
	},
	{
		suffix: "gov.pr",
		reversed: "rp.vog"
	},
	{
		suffix: "gov.ps",
		reversed: "sp.vog"
	},
	{
		suffix: "gov.pt",
		reversed: "tp.vog"
	},
	{
		suffix: "gov.py",
		reversed: "yp.vog"
	},
	{
		suffix: "gov.qa",
		reversed: "aq.vog"
	},
	{
		suffix: "gov.rs",
		reversed: "sr.vog"
	},
	{
		suffix: "gov.ru",
		reversed: "ur.vog"
	},
	{
		suffix: "gov.rw",
		reversed: "wr.vog"
	},
	{
		suffix: "gov.sa",
		reversed: "as.vog"
	},
	{
		suffix: "gov.sb",
		reversed: "bs.vog"
	},
	{
		suffix: "gov.sc",
		reversed: "cs.vog"
	},
	{
		suffix: "gov.scot",
		reversed: "tocs.vog"
	},
	{
		suffix: "gov.sd",
		reversed: "ds.vog"
	},
	{
		suffix: "gov.sg",
		reversed: "gs.vog"
	},
	{
		suffix: "gov.sh",
		reversed: "hs.vog"
	},
	{
		suffix: "gov.sl",
		reversed: "ls.vog"
	},
	{
		suffix: "gov.so",
		reversed: "os.vog"
	},
	{
		suffix: "gov.ss",
		reversed: "ss.vog"
	},
	{
		suffix: "gov.sx",
		reversed: "xs.vog"
	},
	{
		suffix: "gov.sy",
		reversed: "ys.vog"
	},
	{
		suffix: "gov.tj",
		reversed: "jt.vog"
	},
	{
		suffix: "gov.tl",
		reversed: "lt.vog"
	},
	{
		suffix: "gov.tm",
		reversed: "mt.vog"
	},
	{
		suffix: "gov.tn",
		reversed: "nt.vog"
	},
	{
		suffix: "gov.to",
		reversed: "ot.vog"
	},
	{
		suffix: "gov.tr",
		reversed: "rt.vog"
	},
	{
		suffix: "gov.tt",
		reversed: "tt.vog"
	},
	{
		suffix: "gov.tw",
		reversed: "wt.vog"
	},
	{
		suffix: "gov.ua",
		reversed: "au.vog"
	},
	{
		suffix: "gov.uk",
		reversed: "ku.vog"
	},
	{
		suffix: "gov.vc",
		reversed: "cv.vog"
	},
	{
		suffix: "gov.ve",
		reversed: "ev.vog"
	},
	{
		suffix: "gov.vn",
		reversed: "nv.vog"
	},
	{
		suffix: "gov.ws",
		reversed: "sw.vog"
	},
	{
		suffix: "gov.ye",
		reversed: "ey.vog"
	},
	{
		suffix: "gov.za",
		reversed: "az.vog"
	},
	{
		suffix: "gov.zm",
		reversed: "mz.vog"
	},
	{
		suffix: "gov.zw",
		reversed: "wz.vog"
	},
	{
		suffix: "government.aero",
		reversed: "orea.tnemnrevog"
	},
	{
		suffix: "govt.nz",
		reversed: "zn.tvog"
	},
	{
		suffix: "gp",
		reversed: "pg"
	},
	{
		suffix: "gq",
		reversed: "qg"
	},
	{
		suffix: "gr",
		reversed: "rg"
	},
	{
		suffix: "gr.com",
		reversed: "moc.rg"
	},
	{
		suffix: "gr.eu.org",
		reversed: "gro.ue.rg"
	},
	{
		suffix: "gr.it",
		reversed: "ti.rg"
	},
	{
		suffix: "gr.jp",
		reversed: "pj.rg"
	},
	{
		suffix: "grainger",
		reversed: "regniarg"
	},
	{
		suffix: "grajewo.pl",
		reversed: "lp.owejarg"
	},
	{
		suffix: "gran.no",
		reversed: "on.narg"
	},
	{
		suffix: "grandrapids.museum",
		reversed: "muesum.sdipardnarg"
	},
	{
		suffix: "grane.no",
		reversed: "on.enarg"
	},
	{
		suffix: "granvin.no",
		reversed: "on.nivnarg"
	},
	{
		suffix: "graphics",
		reversed: "scihparg"
	},
	{
		suffix: "graphox.us",
		reversed: "su.xohparg"
	},
	{
		suffix: "gratangen.no",
		reversed: "on.negnatarg"
	},
	{
		suffix: "gratis",
		reversed: "sitarg"
	},
	{
		suffix: "graz.museum",
		reversed: "muesum.zarg"
	},
	{
		suffix: "greater.jp",
		reversed: "pj.retaerg"
	},
	{
		suffix: "green",
		reversed: "neerg"
	},
	{
		suffix: "greta.fr",
		reversed: "rf.aterg"
	},
	{
		suffix: "grimstad.no",
		reversed: "on.datsmirg"
	},
	{
		suffix: "gripe",
		reversed: "epirg"
	},
	{
		suffix: "griw.gov.pl",
		reversed: "lp.vog.wirg"
	},
	{
		suffix: "grocery",
		reversed: "yrecorg"
	},
	{
		suffix: "groks-the.info",
		reversed: "ofni.eht-skorg"
	},
	{
		suffix: "groks-this.info",
		reversed: "ofni.siht-skorg"
	},
	{
		suffix: "grondar.za",
		reversed: "az.radnorg"
	},
	{
		suffix: "grong.no",
		reversed: "on.gnorg"
	},
	{
		suffix: "grosseto.it",
		reversed: "ti.otessorg"
	},
	{
		suffix: "groundhandling.aero",
		reversed: "orea.gnildnahdnuorg"
	},
	{
		suffix: "group",
		reversed: "puorg"
	},
	{
		suffix: "group.aero",
		reversed: "orea.puorg"
	},
	{
		suffix: "grozny.ru",
		reversed: "ur.ynzorg"
	},
	{
		suffix: "grozny.su",
		reversed: "us.ynzorg"
	},
	{
		suffix: "grp.lk",
		reversed: "kl.prg"
	},
	{
		suffix: "gru.br",
		reversed: "rb.urg"
	},
	{
		suffix: "grue.no",
		reversed: "on.eurg"
	},
	{
		suffix: "gs",
		reversed: "sg"
	},
	{
		suffix: "gs.aa.no",
		reversed: "on.aa.sg"
	},
	{
		suffix: "gs.ah.no",
		reversed: "on.ha.sg"
	},
	{
		suffix: "gs.bu.no",
		reversed: "on.ub.sg"
	},
	{
		suffix: "gs.cn",
		reversed: "nc.sg"
	},
	{
		suffix: "gs.fm.no",
		reversed: "on.mf.sg"
	},
	{
		suffix: "gs.hl.no",
		reversed: "on.lh.sg"
	},
	{
		suffix: "gs.hm.no",
		reversed: "on.mh.sg"
	},
	{
		suffix: "gs.jan-mayen.no",
		reversed: "on.neyam-naj.sg"
	},
	{
		suffix: "gs.mr.no",
		reversed: "on.rm.sg"
	},
	{
		suffix: "gs.nl.no",
		reversed: "on.ln.sg"
	},
	{
		suffix: "gs.nt.no",
		reversed: "on.tn.sg"
	},
	{
		suffix: "gs.of.no",
		reversed: "on.fo.sg"
	},
	{
		suffix: "gs.ol.no",
		reversed: "on.lo.sg"
	},
	{
		suffix: "gs.oslo.no",
		reversed: "on.olso.sg"
	},
	{
		suffix: "gs.rl.no",
		reversed: "on.lr.sg"
	},
	{
		suffix: "gs.sf.no",
		reversed: "on.fs.sg"
	},
	{
		suffix: "gs.st.no",
		reversed: "on.ts.sg"
	},
	{
		suffix: "gs.svalbard.no",
		reversed: "on.drablavs.sg"
	},
	{
		suffix: "gs.tm.no",
		reversed: "on.mt.sg"
	},
	{
		suffix: "gs.tr.no",
		reversed: "on.rt.sg"
	},
	{
		suffix: "gs.va.no",
		reversed: "on.av.sg"
	},
	{
		suffix: "gs.vf.no",
		reversed: "on.fv.sg"
	},
	{
		suffix: "gsj.bz",
		reversed: "zb.jsg"
	},
	{
		suffix: "gsm.pl",
		reversed: "lp.msg"
	},
	{
		suffix: "gt",
		reversed: "tg"
	},
	{
		suffix: "gu",
		reversed: "ug"
	},
	{
		suffix: "gu.us",
		reversed: "su.ug"
	},
	{
		suffix: "guam.gu",
		reversed: "ug.maug"
	},
	{
		suffix: "guardian",
		reversed: "naidraug"
	},
	{
		suffix: "gub.uy",
		reversed: "yu.bug"
	},
	{
		suffix: "gucci",
		reversed: "iccug"
	},
	{
		suffix: "guernsey.museum",
		reversed: "muesum.yesnreug"
	},
	{
		suffix: "guge",
		reversed: "egug"
	},
	{
		suffix: "guide",
		reversed: "ediug"
	},
	{
		suffix: "guitars",
		reversed: "sratiug"
	},
	{
		suffix: "gujarat.in",
		reversed: "ni.tarajug"
	},
	{
		suffix: "gujo.gifu.jp",
		reversed: "pj.ufig.ojug"
	},
	{
		suffix: "gulen.no",
		reversed: "on.nelug"
	},
	{
		suffix: "gunma.jp",
		reversed: "pj.amnug"
	},
	{
		suffix: "guovdageaidnu.no",
		reversed: "on.undiaegadvoug"
	},
	{
		suffix: "guru",
		reversed: "urug"
	},
	{
		suffix: "gushikami.okinawa.jp",
		reversed: "pj.awaniko.imakihsug"
	},
	{
		suffix: "gv.ao",
		reversed: "oa.vg"
	},
	{
		suffix: "gv.at",
		reversed: "ta.vg"
	},
	{
		suffix: "gv.vc",
		reversed: "cv.vg"
	},
	{
		suffix: "gw",
		reversed: "wg"
	},
	{
		suffix: "gwangju.kr",
		reversed: "rk.ujgnawg"
	},
	{
		suffix: "gwiddle.co.uk",
		reversed: "ku.oc.elddiwg"
	},
	{
		suffix: "gx.cn",
		reversed: "nc.xg"
	},
	{
		suffix: "gy",
		reversed: "yg"
	},
	{
		suffix: "gyeongbuk.kr",
		reversed: "rk.kubgnoeyg"
	},
	{
		suffix: "gyeonggi.kr",
		reversed: "rk.iggnoeyg"
	},
	{
		suffix: "gyeongnam.kr",
		reversed: "rk.mangnoeyg"
	},
	{
		suffix: "gyokuto.kumamoto.jp",
		reversed: "pj.otomamuk.otukoyg"
	},
	{
		suffix: "gz.cn",
		reversed: "nc.zg"
	},
	{
		suffix: "gáivuotna.no",
		reversed: "on.ay8-antouvig--nx"
	},
	{
		suffix: "gálsá.no",
		reversed: "on.cale-slg--nx"
	},
	{
		suffix: "gáŋgaviika.no",
		reversed: "on.h74ay8-akiivagg--nx"
	},
	{
		suffix: "günstigbestellen.de",
		reversed: "ed.bvz-nelletsebgitsng--nx"
	},
	{
		suffix: "günstigliefern.de",
		reversed: "ed.bow-nrefeilgitsng--nx"
	},
	{
		suffix: "h.bg",
		reversed: "gb.h"
	},
	{
		suffix: "h.se",
		reversed: "es.h"
	},
	{
		suffix: "ha.cn",
		reversed: "nc.ah"
	},
	{
		suffix: "ha.no",
		reversed: "on.ah"
	},
	{
		suffix: "habikino.osaka.jp",
		reversed: "pj.akaso.onikibah"
	},
	{
		suffix: "habmer.no",
		reversed: "on.rembah"
	},
	{
		suffix: "haboro.hokkaido.jp",
		reversed: "pj.odiakkoh.orobah"
	},
	{
		suffix: "hacca.jp",
		reversed: "pj.accah"
	},
	{
		suffix: "hachijo.tokyo.jp",
		reversed: "pj.oykot.ojihcah"
	},
	{
		suffix: "hachinohe.aomori.jp",
		reversed: "pj.iromoa.ehonihcah"
	},
	{
		suffix: "hachioji.tokyo.jp",
		reversed: "pj.oykot.ijoihcah"
	},
	{
		suffix: "hachirogata.akita.jp",
		reversed: "pj.atika.atagorihcah"
	},
	{
		suffix: "hadano.kanagawa.jp",
		reversed: "pj.awaganak.onadah"
	},
	{
		suffix: "hadsel.no",
		reversed: "on.lesdah"
	},
	{
		suffix: "haebaru.okinawa.jp",
		reversed: "pj.awaniko.urabeah"
	},
	{
		suffix: "haga.tochigi.jp",
		reversed: "pj.igihcot.agah"
	},
	{
		suffix: "hagebostad.no",
		reversed: "on.datsobegah"
	},
	{
		suffix: "hagi.yamaguchi.jp",
		reversed: "pj.ihcugamay.igah"
	},
	{
		suffix: "haibara.shizuoka.jp",
		reversed: "pj.akouzihs.arabiah"
	},
	{
		suffix: "hair",
		reversed: "riah"
	},
	{
		suffix: "hakata.fukuoka.jp",
		reversed: "pj.akoukuf.atakah"
	},
	{
		suffix: "hakodate.hokkaido.jp",
		reversed: "pj.odiakkoh.etadokah"
	},
	{
		suffix: "hakone.kanagawa.jp",
		reversed: "pj.awaganak.enokah"
	},
	{
		suffix: "hakuba.nagano.jp",
		reversed: "pj.onagan.abukah"
	},
	{
		suffix: "hakui.ishikawa.jp",
		reversed: "pj.awakihsi.iukah"
	},
	{
		suffix: "hakusan.ishikawa.jp",
		reversed: "pj.awakihsi.nasukah"
	},
	{
		suffix: "halden.no",
		reversed: "on.nedlah"
	},
	{
		suffix: "half.host",
		reversed: "tsoh.flah"
	},
	{
		suffix: "halloffame.museum",
		reversed: "muesum.emaffollah"
	},
	{
		suffix: "halsa.no",
		reversed: "on.aslah"
	},
	{
		suffix: "ham-radio-op.net",
		reversed: "ten.po-oidar-mah"
	},
	{
		suffix: "hamada.shimane.jp",
		reversed: "pj.enamihs.adamah"
	},
	{
		suffix: "hamamatsu.shizuoka.jp",
		reversed: "pj.akouzihs.ustamamah"
	},
	{
		suffix: "hamar.no",
		reversed: "on.ramah"
	},
	{
		suffix: "hamaroy.no",
		reversed: "on.yoramah"
	},
	{
		suffix: "hamatama.saga.jp",
		reversed: "pj.agas.amatamah"
	},
	{
		suffix: "hamatonbetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebnotamah"
	},
	{
		suffix: "hamburg",
		reversed: "grubmah"
	},
	{
		suffix: "hamburg.museum",
		reversed: "muesum.grubmah"
	},
	{
		suffix: "hammarfeasta.no",
		reversed: "on.atsaeframmah"
	},
	{
		suffix: "hammerfest.no",
		reversed: "on.tsefremmah"
	},
	{
		suffix: "hamura.tokyo.jp",
		reversed: "pj.oykot.arumah"
	},
	{
		suffix: "hanamaki.iwate.jp",
		reversed: "pj.etawi.ikamanah"
	},
	{
		suffix: "hanamigawa.chiba.jp",
		reversed: "pj.abihc.awagimanah"
	},
	{
		suffix: "hanawa.fukushima.jp",
		reversed: "pj.amihsukuf.awanah"
	},
	{
		suffix: "handa.aichi.jp",
		reversed: "pj.ihcia.adnah"
	},
	{
		suffix: "handcrafted.jp",
		reversed: "pj.detfarcdnah"
	},
	{
		suffix: "handson.museum",
		reversed: "muesum.nosdnah"
	},
	{
		suffix: "hanggliding.aero",
		reversed: "orea.gnidilggnah"
	},
	{
		suffix: "hangout",
		reversed: "tuognah"
	},
	{
		suffix: "hannan.osaka.jp",
		reversed: "pj.akaso.nannah"
	},
	{
		suffix: "hanno.saitama.jp",
		reversed: "pj.amatias.onnah"
	},
	{
		suffix: "hanyu.saitama.jp",
		reversed: "pj.amatias.uynah"
	},
	{
		suffix: "hapmir.no",
		reversed: "on.rimpah"
	},
	{
		suffix: "happou.akita.jp",
		reversed: "pj.atika.uoppah"
	},
	{
		suffix: "hara.nagano.jp",
		reversed: "pj.onagan.arah"
	},
	{
		suffix: "haram.no",
		reversed: "on.marah"
	},
	{
		suffix: "hareid.no",
		reversed: "on.dierah"
	},
	{
		suffix: "harima.hyogo.jp",
		reversed: "pj.ogoyh.amirah"
	},
	{
		suffix: "harstad.no",
		reversed: "on.datsrah"
	},
	{
		suffix: "harvestcelebration.museum",
		reversed: "muesum.noitarbelectsevrah"
	},
	{
		suffix: "hasama.oita.jp",
		reversed: "pj.atio.amasah"
	},
	{
		suffix: "hasami.nagasaki.jp",
		reversed: "pj.ikasagan.imasah"
	},
	{
		suffix: "hashbang.sh",
		reversed: "hs.gnabhsah"
	},
	{
		suffix: "hashikami.aomori.jp",
		reversed: "pj.iromoa.imakihsah"
	},
	{
		suffix: "hashima.gifu.jp",
		reversed: "pj.ufig.amihsah"
	},
	{
		suffix: "hashimoto.wakayama.jp",
		reversed: "pj.amayakaw.otomihsah"
	},
	{
		suffix: "hasuda.saitama.jp",
		reversed: "pj.amatias.adusah"
	},
	{
		suffix: "hasura-app.io",
		reversed: "oi.ppa-arusah"
	},
	{
		suffix: "hasura.app",
		reversed: "ppa.arusah"
	},
	{
		suffix: "hasvik.no",
		reversed: "on.kivsah"
	},
	{
		suffix: "hatogaya.saitama.jp",
		reversed: "pj.amatias.ayagotah"
	},
	{
		suffix: "hatoyama.saitama.jp",
		reversed: "pj.amatias.amayotah"
	},
	{
		suffix: "hatsukaichi.hiroshima.jp",
		reversed: "pj.amihsorih.ihciakustah"
	},
	{
		suffix: "hattfjelldal.no",
		reversed: "on.ladllejfttah"
	},
	{
		suffix: "haugesund.no",
		reversed: "on.dnuseguah"
	},
	{
		suffix: "haus",
		reversed: "suah"
	},
	{
		suffix: "hawaii.museum",
		reversed: "muesum.iiawah"
	},
	{
		suffix: "hayakawa.yamanashi.jp",
		reversed: "pj.ihsanamay.awakayah"
	},
	{
		suffix: "hayashima.okayama.jp",
		reversed: "pj.amayako.amihsayah"
	},
	{
		suffix: "hazu.aichi.jp",
		reversed: "pj.ihcia.uzah"
	},
	{
		suffix: "hb.cldmail.ru",
		reversed: "ur.liamdlc.bh"
	},
	{
		suffix: "hb.cn",
		reversed: "nc.bh"
	},
	{
		suffix: "hbo",
		reversed: "obh"
	},
	{
		suffix: "hdfc",
		reversed: "cfdh"
	},
	{
		suffix: "hdfcbank",
		reversed: "knabcfdh"
	},
	{
		suffix: "he.cn",
		reversed: "nc.eh"
	},
	{
		suffix: "health",
		reversed: "htlaeh"
	},
	{
		suffix: "health-carereform.com",
		reversed: "moc.mrofererac-htlaeh"
	},
	{
		suffix: "health.museum",
		reversed: "muesum.htlaeh"
	},
	{
		suffix: "health.nz",
		reversed: "zn.htlaeh"
	},
	{
		suffix: "health.vn",
		reversed: "nv.htlaeh"
	},
	{
		suffix: "healthcare",
		reversed: "erachtlaeh"
	},
	{
		suffix: "heavy.jp",
		reversed: "pj.yvaeh"
	},
	{
		suffix: "heguri.nara.jp",
		reversed: "pj.aran.irugeh"
	},
	{
		suffix: "heimatunduhren.museum",
		reversed: "muesum.nerhudnutamieh"
	},
	{
		suffix: "hekinan.aichi.jp",
		reversed: "pj.ihcia.nanikeh"
	},
	{
		suffix: "hellas.museum",
		reversed: "muesum.salleh"
	},
	{
		suffix: "help",
		reversed: "pleh"
	},
	{
		suffix: "helsinki",
		reversed: "iknisleh"
	},
	{
		suffix: "helsinki.museum",
		reversed: "muesum.iknisleh"
	},
	{
		suffix: "hembygdsforbund.museum",
		reversed: "muesum.dnubrofsdgybmeh"
	},
	{
		suffix: "hemne.no",
		reversed: "on.enmeh"
	},
	{
		suffix: "hemnes.no",
		reversed: "on.senmeh"
	},
	{
		suffix: "hemsedal.no",
		reversed: "on.ladesmeh"
	},
	{
		suffix: "hepforge.org",
		reversed: "gro.egrofpeh"
	},
	{
		suffix: "her.jp",
		reversed: "pj.reh"
	},
	{
		suffix: "herad.no",
		reversed: "on.dareh"
	},
	{
		suffix: "here",
		reversed: "ereh"
	},
	{
		suffix: "here-for-more.info",
		reversed: "ofni.erom-rof-ereh"
	},
	{
		suffix: "heritage.museum",
		reversed: "muesum.egatireh"
	},
	{
		suffix: "hermes",
		reversed: "semreh"
	},
	{
		suffix: "herokuapp.com",
		reversed: "moc.ppaukoreh"
	},
	{
		suffix: "herokussl.com",
		reversed: "moc.lssukoreh"
	},
	{
		suffix: "heroy.more-og-romsdal.no",
		reversed: "on.ladsmor-go-erom.yoreh"
	},
	{
		suffix: "heroy.nordland.no",
		reversed: "on.dnaldron.yoreh"
	},
	{
		suffix: "herøy.møre-og-romsdal.no",
		reversed: "on.bqq-ladsmor-go-erm--nx.ari-yreh--nx"
	},
	{
		suffix: "herøy.nordland.no",
		reversed: "on.dnaldron.ari-yreh--nx"
	},
	{
		suffix: "heteml.net",
		reversed: "ten.lmeteh"
	},
	{
		suffix: "hgtv",
		reversed: "vtgh"
	},
	{
		suffix: "hi.cn",
		reversed: "nc.ih"
	},
	{
		suffix: "hi.us",
		reversed: "su.ih"
	},
	{
		suffix: "hicam.net",
		reversed: "ten.macih"
	},
	{
		suffix: "hichiso.gifu.jp",
		reversed: "pj.ufig.osihcih"
	},
	{
		suffix: "hida.gifu.jp",
		reversed: "pj.ufig.adih"
	},
	{
		suffix: "hidaka.hokkaido.jp",
		reversed: "pj.odiakkoh.akadih"
	},
	{
		suffix: "hidaka.kochi.jp",
		reversed: "pj.ihcok.akadih"
	},
	{
		suffix: "hidaka.saitama.jp",
		reversed: "pj.amatias.akadih"
	},
	{
		suffix: "hidaka.wakayama.jp",
		reversed: "pj.amayakaw.akadih"
	},
	{
		suffix: "hidora.com",
		reversed: "moc.arodih"
	},
	{
		suffix: "higashi.fukuoka.jp",
		reversed: "pj.akoukuf.ihsagih"
	},
	{
		suffix: "higashi.fukushima.jp",
		reversed: "pj.amihsukuf.ihsagih"
	},
	{
		suffix: "higashi.okinawa.jp",
		reversed: "pj.awaniko.ihsagih"
	},
	{
		suffix: "higashiagatsuma.gunma.jp",
		reversed: "pj.amnug.amustagaihsagih"
	},
	{
		suffix: "higashichichibu.saitama.jp",
		reversed: "pj.amatias.ubihcihcihsagih"
	},
	{
		suffix: "higashihiroshima.hiroshima.jp",
		reversed: "pj.amihsorih.amihsorihihsagih"
	},
	{
		suffix: "higashiizu.shizuoka.jp",
		reversed: "pj.akouzihs.uziihsagih"
	},
	{
		suffix: "higashiizumo.shimane.jp",
		reversed: "pj.enamihs.omuziihsagih"
	},
	{
		suffix: "higashikagawa.kagawa.jp",
		reversed: "pj.awagak.awagakihsagih"
	},
	{
		suffix: "higashikagura.hokkaido.jp",
		reversed: "pj.odiakkoh.arugakihsagih"
	},
	{
		suffix: "higashikawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awakihsagih"
	},
	{
		suffix: "higashikurume.tokyo.jp",
		reversed: "pj.oykot.emurukihsagih"
	},
	{
		suffix: "higashimatsushima.miyagi.jp",
		reversed: "pj.igayim.amihsustamihsagih"
	},
	{
		suffix: "higashimatsuyama.saitama.jp",
		reversed: "pj.amatias.amayustamihsagih"
	},
	{
		suffix: "higashimurayama.tokyo.jp",
		reversed: "pj.oykot.amayarumihsagih"
	},
	{
		suffix: "higashinaruse.akita.jp",
		reversed: "pj.atika.esuranihsagih"
	},
	{
		suffix: "higashine.yamagata.jp",
		reversed: "pj.atagamay.enihsagih"
	},
	{
		suffix: "higashiomi.shiga.jp",
		reversed: "pj.agihs.imoihsagih"
	},
	{
		suffix: "higashiosaka.osaka.jp",
		reversed: "pj.akaso.akasoihsagih"
	},
	{
		suffix: "higashishirakawa.gifu.jp",
		reversed: "pj.ufig.awakarihsihsagih"
	},
	{
		suffix: "higashisumiyoshi.osaka.jp",
		reversed: "pj.akaso.ihsoyimusihsagih"
	},
	{
		suffix: "higashitsuno.kochi.jp",
		reversed: "pj.ihcok.onustihsagih"
	},
	{
		suffix: "higashiura.aichi.jp",
		reversed: "pj.ihcia.aruihsagih"
	},
	{
		suffix: "higashiyama.kyoto.jp",
		reversed: "pj.otoyk.amayihsagih"
	},
	{
		suffix: "higashiyamato.tokyo.jp",
		reversed: "pj.oykot.otamayihsagih"
	},
	{
		suffix: "higashiyodogawa.osaka.jp",
		reversed: "pj.akaso.awagodoyihsagih"
	},
	{
		suffix: "higashiyoshino.nara.jp",
		reversed: "pj.aran.onihsoyihsagih"
	},
	{
		suffix: "hiho.jp",
		reversed: "pj.ohih"
	},
	{
		suffix: "hiji.oita.jp",
		reversed: "pj.atio.ijih"
	},
	{
		suffix: "hikari.yamaguchi.jp",
		reversed: "pj.ihcugamay.irakih"
	},
	{
		suffix: "hikawa.shimane.jp",
		reversed: "pj.enamihs.awakih"
	},
	{
		suffix: "hikimi.shimane.jp",
		reversed: "pj.enamihs.imikih"
	},
	{
		suffix: "hikone.shiga.jp",
		reversed: "pj.agihs.enokih"
	},
	{
		suffix: "himeji.hyogo.jp",
		reversed: "pj.ogoyh.ijemih"
	},
	{
		suffix: "himeshima.oita.jp",
		reversed: "pj.atio.amihsemih"
	},
	{
		suffix: "himi.toyama.jp",
		reversed: "pj.amayot.imih"
	},
	{
		suffix: "hino.tokyo.jp",
		reversed: "pj.oykot.onih"
	},
	{
		suffix: "hino.tottori.jp",
		reversed: "pj.irottot.onih"
	},
	{
		suffix: "hinode.tokyo.jp",
		reversed: "pj.oykot.edonih"
	},
	{
		suffix: "hinohara.tokyo.jp",
		reversed: "pj.oykot.arahonih"
	},
	{
		suffix: "hioki.kagoshima.jp",
		reversed: "pj.amihsogak.ikoih"
	},
	{
		suffix: "hiphop",
		reversed: "pohpih"
	},
	{
		suffix: "hippy.jp",
		reversed: "pj.yppih"
	},
	{
		suffix: "hirado.nagasaki.jp",
		reversed: "pj.ikasagan.odarih"
	},
	{
		suffix: "hiraizumi.iwate.jp",
		reversed: "pj.etawi.imuziarih"
	},
	{
		suffix: "hirakata.osaka.jp",
		reversed: "pj.akaso.atakarih"
	},
	{
		suffix: "hiranai.aomori.jp",
		reversed: "pj.iromoa.ianarih"
	},
	{
		suffix: "hirara.okinawa.jp",
		reversed: "pj.awaniko.ararih"
	},
	{
		suffix: "hirata.fukushima.jp",
		reversed: "pj.amihsukuf.atarih"
	},
	{
		suffix: "hiratsuka.kanagawa.jp",
		reversed: "pj.awaganak.akustarih"
	},
	{
		suffix: "hiraya.nagano.jp",
		reversed: "pj.onagan.ayarih"
	},
	{
		suffix: "hirogawa.wakayama.jp",
		reversed: "pj.amayakaw.awagorih"
	},
	{
		suffix: "hirokawa.fukuoka.jp",
		reversed: "pj.akoukuf.awakorih"
	},
	{
		suffix: "hirono.fukushima.jp",
		reversed: "pj.amihsukuf.onorih"
	},
	{
		suffix: "hirono.iwate.jp",
		reversed: "pj.etawi.onorih"
	},
	{
		suffix: "hiroo.hokkaido.jp",
		reversed: "pj.odiakkoh.oorih"
	},
	{
		suffix: "hirosaki.aomori.jp",
		reversed: "pj.iromoa.ikasorih"
	},
	{
		suffix: "hiroshima.jp",
		reversed: "pj.amihsorih"
	},
	{
		suffix: "hisamitsu",
		reversed: "ustimasih"
	},
	{
		suffix: "hisayama.fukuoka.jp",
		reversed: "pj.akoukuf.amayasih"
	},
	{
		suffix: "histoire.museum",
		reversed: "muesum.eriotsih"
	},
	{
		suffix: "historical.museum",
		reversed: "muesum.lacirotsih"
	},
	{
		suffix: "historicalsociety.museum",
		reversed: "muesum.yteicoslacirotsih"
	},
	{
		suffix: "historichouses.museum",
		reversed: "muesum.sesuohcirotsih"
	},
	{
		suffix: "historisch.museum",
		reversed: "muesum.hcsirotsih"
	},
	{
		suffix: "historisches.museum",
		reversed: "muesum.sehcsirotsih"
	},
	{
		suffix: "history.museum",
		reversed: "muesum.yrotsih"
	},
	{
		suffix: "historyofscience.museum",
		reversed: "muesum.ecneicsfoyrotsih"
	},
	{
		suffix: "hita.oita.jp",
		reversed: "pj.atio.atih"
	},
	{
		suffix: "hitachi",
		reversed: "ihcatih"
	},
	{
		suffix: "hitachi.ibaraki.jp",
		reversed: "pj.ikarabi.ihcatih"
	},
	{
		suffix: "hitachinaka.ibaraki.jp",
		reversed: "pj.ikarabi.akanihcatih"
	},
	{
		suffix: "hitachiomiya.ibaraki.jp",
		reversed: "pj.ikarabi.ayimoihcatih"
	},
	{
		suffix: "hitachiota.ibaraki.jp",
		reversed: "pj.ikarabi.atoihcatih"
	},
	{
		suffix: "hitra.no",
		reversed: "on.artih"
	},
	{
		suffix: "hiv",
		reversed: "vih"
	},
	{
		suffix: "hizen.saga.jp",
		reversed: "pj.agas.nezih"
	},
	{
		suffix: "hjartdal.no",
		reversed: "on.ladtrajh"
	},
	{
		suffix: "hjelmeland.no",
		reversed: "on.dnalemlejh"
	},
	{
		suffix: "hk",
		reversed: "kh"
	},
	{
		suffix: "hk.cn",
		reversed: "nc.kh"
	},
	{
		suffix: "hk.com",
		reversed: "moc.kh"
	},
	{
		suffix: "hk.org",
		reversed: "gro.kh"
	},
	{
		suffix: "hkt",
		reversed: "tkh"
	},
	{
		suffix: "hl.cn",
		reversed: "nc.lh"
	},
	{
		suffix: "hl.no",
		reversed: "on.lh"
	},
	{
		suffix: "hlx.live",
		reversed: "evil.xlh"
	},
	{
		suffix: "hlx.page",
		reversed: "egap.xlh"
	},
	{
		suffix: "hlx3.page",
		reversed: "egap.3xlh"
	},
	{
		suffix: "hm",
		reversed: "mh"
	},
	{
		suffix: "hm.no",
		reversed: "on.mh"
	},
	{
		suffix: "hn",
		reversed: "nh"
	},
	{
		suffix: "hn.cn",
		reversed: "nc.nh"
	},
	{
		suffix: "hobby-site.com",
		reversed: "moc.etis-ybboh"
	},
	{
		suffix: "hobby-site.org",
		reversed: "gro.etis-ybboh"
	},
	{
		suffix: "hobol.no",
		reversed: "on.loboh"
	},
	{
		suffix: "hobøl.no",
		reversed: "on.ari-lboh--nx"
	},
	{
		suffix: "hockey",
		reversed: "yekcoh"
	},
	{
		suffix: "hof.no",
		reversed: "on.foh"
	},
	{
		suffix: "hofu.yamaguchi.jp",
		reversed: "pj.ihcugamay.ufoh"
	},
	{
		suffix: "hokkaido.jp",
		reversed: "pj.odiakkoh"
	},
	{
		suffix: "hokksund.no",
		reversed: "on.dnuskkoh"
	},
	{
		suffix: "hokuryu.hokkaido.jp",
		reversed: "pj.odiakkoh.uyrukoh"
	},
	{
		suffix: "hokuto.hokkaido.jp",
		reversed: "pj.odiakkoh.otukoh"
	},
	{
		suffix: "hokuto.yamanashi.jp",
		reversed: "pj.ihsanamay.otukoh"
	},
	{
		suffix: "hol.no",
		reversed: "on.loh"
	},
	{
		suffix: "holdings",
		reversed: "sgnidloh"
	},
	{
		suffix: "hole.no",
		reversed: "on.eloh"
	},
	{
		suffix: "holiday",
		reversed: "yadiloh"
	},
	{
		suffix: "holmestrand.no",
		reversed: "on.dnartsemloh"
	},
	{
		suffix: "holtalen.no",
		reversed: "on.nelatloh"
	},
	{
		suffix: "holtålen.no",
		reversed: "on.axh-neltloh--nx"
	},
	{
		suffix: "holy.jp",
		reversed: "pj.yloh"
	},
	{
		suffix: "home-webserver.de",
		reversed: "ed.revresbew-emoh"
	},
	{
		suffix: "home.dyndns.org",
		reversed: "gro.sndnyd.emoh"
	},
	{
		suffix: "homebuilt.aero",
		reversed: "orea.tliubemoh"
	},
	{
		suffix: "homedepot",
		reversed: "topedemoh"
	},
	{
		suffix: "homedns.org",
		reversed: "gro.sndemoh"
	},
	{
		suffix: "homeftp.net",
		reversed: "ten.ptfemoh"
	},
	{
		suffix: "homeftp.org",
		reversed: "gro.ptfemoh"
	},
	{
		suffix: "homegoods",
		reversed: "sdoogemoh"
	},
	{
		suffix: "homeip.net",
		reversed: "ten.piemoh"
	},
	{
		suffix: "homelink.one",
		reversed: "eno.knilemoh"
	},
	{
		suffix: "homelinux.com",
		reversed: "moc.xunilemoh"
	},
	{
		suffix: "homelinux.net",
		reversed: "ten.xunilemoh"
	},
	{
		suffix: "homelinux.org",
		reversed: "gro.xunilemoh"
	},
	{
		suffix: "homeoffice.gov.uk",
		reversed: "ku.vog.eciffoemoh"
	},
	{
		suffix: "homes",
		reversed: "semoh"
	},
	{
		suffix: "homesecuritymac.com",
		reversed: "moc.camytirucesemoh"
	},
	{
		suffix: "homesecuritypc.com",
		reversed: "moc.cpytirucesemoh"
	},
	{
		suffix: "homesense",
		reversed: "esnesemoh"
	},
	{
		suffix: "homesklep.pl",
		reversed: "lp.pelksemoh"
	},
	{
		suffix: "homeunix.com",
		reversed: "moc.xinuemoh"
	},
	{
		suffix: "homeunix.net",
		reversed: "ten.xinuemoh"
	},
	{
		suffix: "homeunix.org",
		reversed: "gro.xinuemoh"
	},
	{
		suffix: "honai.ehime.jp",
		reversed: "pj.emihe.ianoh"
	},
	{
		suffix: "honbetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebnoh"
	},
	{
		suffix: "honda",
		reversed: "adnoh"
	},
	{
		suffix: "honefoss.no",
		reversed: "on.ssofenoh"
	},
	{
		suffix: "hongo.hiroshima.jp",
		reversed: "pj.amihsorih.ognoh"
	},
	{
		suffix: "honjo.akita.jp",
		reversed: "pj.atika.ojnoh"
	},
	{
		suffix: "honjo.saitama.jp",
		reversed: "pj.amatias.ojnoh"
	},
	{
		suffix: "honjyo.akita.jp",
		reversed: "pj.atika.oyjnoh"
	},
	{
		suffix: "hoplix.shop",
		reversed: "pohs.xilpoh"
	},
	{
		suffix: "hopto.me",
		reversed: "em.otpoh"
	},
	{
		suffix: "hopto.org",
		reversed: "gro.otpoh"
	},
	{
		suffix: "hornindal.no",
		reversed: "on.ladninroh"
	},
	{
		suffix: "horokanai.hokkaido.jp",
		reversed: "pj.odiakkoh.ianakoroh"
	},
	{
		suffix: "horology.museum",
		reversed: "muesum.ygoloroh"
	},
	{
		suffix: "horonobe.hokkaido.jp",
		reversed: "pj.odiakkoh.ebonoroh"
	},
	{
		suffix: "horse",
		reversed: "esroh"
	},
	{
		suffix: "horten.no",
		reversed: "on.netroh"
	},
	{
		suffix: "hosp.uk",
		reversed: "ku.psoh"
	},
	{
		suffix: "hospital",
		reversed: "latipsoh"
	},
	{
		suffix: "host",
		reversed: "tsoh"
	},
	{
		suffix: "hostedpi.com",
		reversed: "moc.ipdetsoh"
	},
	{
		suffix: "hosting",
		reversed: "gnitsoh"
	},
	{
		suffix: "hosting-cluster.nl",
		reversed: "ln.retsulc-gnitsoh"
	},
	{
		suffix: "hostyhosting.io",
		reversed: "oi.gnitsohytsoh"
	},
	{
		suffix: "hot",
		reversed: "toh"
	},
	{
		suffix: "hotel.hu",
		reversed: "uh.letoh"
	},
	{
		suffix: "hotel.lk",
		reversed: "kl.letoh"
	},
	{
		suffix: "hotel.tz",
		reversed: "zt.letoh"
	},
	{
		suffix: "hoteles",
		reversed: "seletoh"
	},
	{
		suffix: "hotels",
		reversed: "sletoh"
	},
	{
		suffix: "hotelwithflight.com",
		reversed: "moc.thgilfhtiwletoh"
	},
	{
		suffix: "hotmail",
		reversed: "liamtoh"
	},
	{
		suffix: "house",
		reversed: "esuoh"
	},
	{
		suffix: "house.museum",
		reversed: "muesum.esuoh"
	},
	{
		suffix: "how",
		reversed: "woh"
	},
	{
		suffix: "hoyanger.no",
		reversed: "on.regnayoh"
	},
	{
		suffix: "hoylandet.no",
		reversed: "on.tednalyoh"
	},
	{
		suffix: "hr",
		reversed: "rh"
	},
	{
		suffix: "hr.eu.org",
		reversed: "gro.ue.rh"
	},
	{
		suffix: "hra.health",
		reversed: "htlaeh.arh"
	},
	{
		suffix: "hs.kr",
		reversed: "rk.sh"
	},
	{
		suffix: "hs.run",
		reversed: "nur.sh"
	},
	{
		suffix: "hs.zone",
		reversed: "enoz.sh"
	},
	{
		suffix: "hsbc",
		reversed: "cbsh"
	},
	{
		suffix: "ht",
		reversed: "th"
	},
	{
		suffix: "httpbin.org",
		reversed: "gro.nibptth"
	},
	{
		suffix: "hu",
		reversed: "uh"
	},
	{
		suffix: "hu.com",
		reversed: "moc.uh"
	},
	{
		suffix: "hu.eu.org",
		reversed: "gro.ue.uh"
	},
	{
		suffix: "hu.net",
		reversed: "ten.uh"
	},
	{
		suffix: "hughes",
		reversed: "sehguh"
	},
	{
		suffix: "huissier-justice.fr",
		reversed: "rf.ecitsuj-reissiuh"
	},
	{
		suffix: "humanities.museum",
		reversed: "muesum.seitinamuh"
	},
	{
		suffix: "hungry.jp",
		reversed: "pj.yrgnuh"
	},
	{
		suffix: "hurdal.no",
		reversed: "on.ladruh"
	},
	{
		suffix: "hurum.no",
		reversed: "on.muruh"
	},
	{
		suffix: "hvaler.no",
		reversed: "on.relavh"
	},
	{
		suffix: "hyatt",
		reversed: "ttayh"
	},
	{
		suffix: "hyllestad.no",
		reversed: "on.datsellyh"
	},
	{
		suffix: "hyogo.jp",
		reversed: "pj.ogoyh"
	},
	{
		suffix: "hyuga.miyazaki.jp",
		reversed: "pj.ikazayim.aguyh"
	},
	{
		suffix: "hyundai",
		reversed: "iadnuyh"
	},
	{
		suffix: "hzc.io",
		reversed: "oi.czh"
	},
	{
		suffix: "hábmer.no",
		reversed: "on.aqx-rembh--nx"
	},
	{
		suffix: "hámmárfeasta.no",
		reversed: "on.ca4s-atsaefrmmh--nx"
	},
	{
		suffix: "hápmir.no",
		reversed: "on.aqx-rimph--nx"
	},
	{
		suffix: "häkkinen.fi",
		reversed: "if.aw5-nenikkh--nx"
	},
	{
		suffix: "hå.no",
		reversed: "on.af2-h--nx"
	},
	{
		suffix: "hægebostad.no",
		reversed: "on.a3g-datsobegh--nx"
	},
	{
		suffix: "hønefoss.no",
		reversed: "on.a1q-ssofenh--nx"
	},
	{
		suffix: "høyanger.no",
		reversed: "on.a1q-regnayh--nx"
	},
	{
		suffix: "høylandet.no",
		reversed: "on.a45-tednalyh--nx"
	},
	{
		suffix: "i.bg",
		reversed: "gb.i"
	},
	{
		suffix: "i.ng",
		reversed: "gn.i"
	},
	{
		suffix: "i.ph",
		reversed: "hp.i"
	},
	{
		suffix: "i.se",
		reversed: "es.i"
	},
	{
		suffix: "i234.me",
		reversed: "em.432i"
	},
	{
		suffix: "ia.us",
		reversed: "su.ai"
	},
	{
		suffix: "iamallama.com",
		reversed: "moc.amallamai"
	},
	{
		suffix: "ibara.okayama.jp",
		reversed: "pj.amayako.arabi"
	},
	{
		suffix: "ibaraki.ibaraki.jp",
		reversed: "pj.ikarabi.ikarabi"
	},
	{
		suffix: "ibaraki.jp",
		reversed: "pj.ikarabi"
	},
	{
		suffix: "ibaraki.osaka.jp",
		reversed: "pj.akaso.ikarabi"
	},
	{
		suffix: "ibestad.no",
		reversed: "on.datsebi"
	},
	{
		suffix: "ibigawa.gifu.jp",
		reversed: "pj.ufig.awagibi"
	},
	{
		suffix: "ibm",
		reversed: "mbi"
	},
	{
		suffix: "ibxos.it",
		reversed: "ti.soxbi"
	},
	{
		suffix: "ic.gov.pl",
		reversed: "lp.vog.ci"
	},
	{
		suffix: "icbc",
		reversed: "cbci"
	},
	{
		suffix: "ice",
		reversed: "eci"
	},
	{
		suffix: "ichiba.tokushima.jp",
		reversed: "pj.amihsukot.abihci"
	},
	{
		suffix: "ichihara.chiba.jp",
		reversed: "pj.abihc.arahihci"
	},
	{
		suffix: "ichikai.tochigi.jp",
		reversed: "pj.igihcot.iakihci"
	},
	{
		suffix: "ichikawa.chiba.jp",
		reversed: "pj.abihc.awakihci"
	},
	{
		suffix: "ichikawa.hyogo.jp",
		reversed: "pj.ogoyh.awakihci"
	},
	{
		suffix: "ichikawamisato.yamanashi.jp",
		reversed: "pj.ihsanamay.otasimawakihci"
	},
	{
		suffix: "ichinohe.iwate.jp",
		reversed: "pj.etawi.ehonihci"
	},
	{
		suffix: "ichinomiya.aichi.jp",
		reversed: "pj.ihcia.ayimonihci"
	},
	{
		suffix: "ichinomiya.chiba.jp",
		reversed: "pj.abihc.ayimonihci"
	},
	{
		suffix: "ichinoseki.iwate.jp",
		reversed: "pj.etawi.ikesonihci"
	},
	{
		suffix: "icu",
		reversed: "uci"
	},
	{
		suffix: "icurus.jp",
		reversed: "pj.suruci"
	},
	{
		suffix: "id",
		reversed: "di"
	},
	{
		suffix: "id.au",
		reversed: "ua.di"
	},
	{
		suffix: "id.firewalledreplit.co",
		reversed: "oc.tilperdellawerif.di"
	},
	{
		suffix: "id.forgerock.io",
		reversed: "oi.kcoregrof.di"
	},
	{
		suffix: "id.ir",
		reversed: "ri.di"
	},
	{
		suffix: "id.lv",
		reversed: "vl.di"
	},
	{
		suffix: "id.ly",
		reversed: "yl.di"
	},
	{
		suffix: "id.repl.co",
		reversed: "oc.lper.di"
	},
	{
		suffix: "id.us",
		reversed: "su.di"
	},
	{
		suffix: "ide.kyoto.jp",
		reversed: "pj.otoyk.edi"
	},
	{
		suffix: "idf.il",
		reversed: "li.fdi"
	},
	{
		suffix: "idrett.no",
		reversed: "on.tterdi"
	},
	{
		suffix: "idv.hk",
		reversed: "kh.vdi"
	},
	{
		suffix: "idv.tw",
		reversed: "wt.vdi"
	},
	{
		suffix: "ie",
		reversed: "ei"
	},
	{
		suffix: "ie.eu.org",
		reversed: "gro.ue.ei"
	},
	{
		suffix: "ieee",
		reversed: "eeei"
	},
	{
		suffix: "if.ua",
		reversed: "au.fi"
	},
	{
		suffix: "ifm",
		reversed: "mfi"
	},
	{
		suffix: "iglesias-carbonia.it",
		reversed: "ti.ainobrac-saiselgi"
	},
	{
		suffix: "iglesiascarbonia.it",
		reversed: "ti.ainobracsaiselgi"
	},
	{
		suffix: "iheya.okinawa.jp",
		reversed: "pj.awaniko.ayehi"
	},
	{
		suffix: "iida.nagano.jp",
		reversed: "pj.onagan.adii"
	},
	{
		suffix: "iide.yamagata.jp",
		reversed: "pj.atagamay.edii"
	},
	{
		suffix: "iijima.nagano.jp",
		reversed: "pj.onagan.amijii"
	},
	{
		suffix: "iitate.fukushima.jp",
		reversed: "pj.amihsukuf.etatii"
	},
	{
		suffix: "iiyama.nagano.jp",
		reversed: "pj.onagan.amayii"
	},
	{
		suffix: "iizuka.fukuoka.jp",
		reversed: "pj.akoukuf.akuzii"
	},
	{
		suffix: "iizuna.nagano.jp",
		reversed: "pj.onagan.anuzii"
	},
	{
		suffix: "ikano",
		reversed: "onaki"
	},
	{
		suffix: "ikaruga.nara.jp",
		reversed: "pj.aran.aguraki"
	},
	{
		suffix: "ikata.ehime.jp",
		reversed: "pj.emihe.ataki"
	},
	{
		suffix: "ikawa.akita.jp",
		reversed: "pj.atika.awaki"
	},
	{
		suffix: "ikeda.fukui.jp",
		reversed: "pj.iukuf.adeki"
	},
	{
		suffix: "ikeda.gifu.jp",
		reversed: "pj.ufig.adeki"
	},
	{
		suffix: "ikeda.hokkaido.jp",
		reversed: "pj.odiakkoh.adeki"
	},
	{
		suffix: "ikeda.nagano.jp",
		reversed: "pj.onagan.adeki"
	},
	{
		suffix: "ikeda.osaka.jp",
		reversed: "pj.akaso.adeki"
	},
	{
		suffix: "iki.fi",
		reversed: "if.iki"
	},
	{
		suffix: "iki.nagasaki.jp",
		reversed: "pj.ikasagan.iki"
	},
	{
		suffix: "ikoma.nara.jp",
		reversed: "pj.aran.amoki"
	},
	{
		suffix: "ikusaka.nagano.jp",
		reversed: "pj.onagan.akasuki"
	},
	{
		suffix: "il",
		reversed: "li"
	},
	{
		suffix: "il.eu.org",
		reversed: "gro.ue.li"
	},
	{
		suffix: "il.us",
		reversed: "su.li"
	},
	{
		suffix: "ilawa.pl",
		reversed: "lp.awali"
	},
	{
		suffix: "iliadboxos.it",
		reversed: "ti.soxobdaili"
	},
	{
		suffix: "illustration.museum",
		reversed: "muesum.noitartsulli"
	},
	{
		suffix: "ilovecollege.info",
		reversed: "ofni.egellocevoli"
	},
	{
		suffix: "im",
		reversed: "mi"
	},
	{
		suffix: "im.it",
		reversed: "ti.mi"
	},
	{
		suffix: "imabari.ehime.jp",
		reversed: "pj.emihe.irabami"
	},
	{
		suffix: "imageandsound.museum",
		reversed: "muesum.dnuosdnaegami"
	},
	{
		suffix: "imakane.hokkaido.jp",
		reversed: "pj.odiakkoh.enakami"
	},
	{
		suffix: "imamat",
		reversed: "tamami"
	},
	{
		suffix: "imari.saga.jp",
		reversed: "pj.agas.irami"
	},
	{
		suffix: "imb.br",
		reversed: "rb.bmi"
	},
	{
		suffix: "imdb",
		reversed: "bdmi"
	},
	{
		suffix: "imizu.toyama.jp",
		reversed: "pj.amayot.uzimi"
	},
	{
		suffix: "immo",
		reversed: "ommi"
	},
	{
		suffix: "immobilien",
		reversed: "neilibommi"
	},
	{
		suffix: "imperia.it",
		reversed: "ti.airepmi"
	},
	{
		suffix: "impertrix.com",
		reversed: "moc.xirtrepmi"
	},
	{
		suffix: "impertrixcdn.com",
		reversed: "moc.ndcxirtrepmi"
	},
	{
		suffix: "in",
		reversed: "ni"
	},
	{
		suffix: "in-addr.arpa",
		reversed: "apra.rdda-ni"
	},
	{
		suffix: "in-berlin.de",
		reversed: "ed.nilreb-ni"
	},
	{
		suffix: "in-brb.de",
		reversed: "ed.brb-ni"
	},
	{
		suffix: "in-butter.de",
		reversed: "ed.rettub-ni"
	},
	{
		suffix: "in-dsl.de",
		reversed: "ed.lsd-ni"
	},
	{
		suffix: "in-dsl.net",
		reversed: "ten.lsd-ni"
	},
	{
		suffix: "in-dsl.org",
		reversed: "gro.lsd-ni"
	},
	{
		suffix: "in-the-band.net",
		reversed: "ten.dnab-eht-ni"
	},
	{
		suffix: "in-vpn.de",
		reversed: "ed.npv-ni"
	},
	{
		suffix: "in-vpn.net",
		reversed: "ten.npv-ni"
	},
	{
		suffix: "in-vpn.org",
		reversed: "gro.npv-ni"
	},
	{
		suffix: "in.eu.org",
		reversed: "gro.ue.ni"
	},
	{
		suffix: "in.na",
		reversed: "an.ni"
	},
	{
		suffix: "in.net",
		reversed: "ten.ni"
	},
	{
		suffix: "in.ni",
		reversed: "in.ni"
	},
	{
		suffix: "in.rs",
		reversed: "sr.ni"
	},
	{
		suffix: "in.th",
		reversed: "ht.ni"
	},
	{
		suffix: "in.ua",
		reversed: "au.ni"
	},
	{
		suffix: "in.us",
		reversed: "su.ni"
	},
	{
		suffix: "ina.ibaraki.jp",
		reversed: "pj.ikarabi.ani"
	},
	{
		suffix: "ina.nagano.jp",
		reversed: "pj.onagan.ani"
	},
	{
		suffix: "ina.saitama.jp",
		reversed: "pj.amatias.ani"
	},
	{
		suffix: "inabe.mie.jp",
		reversed: "pj.eim.ebani"
	},
	{
		suffix: "inagawa.hyogo.jp",
		reversed: "pj.ogoyh.awagani"
	},
	{
		suffix: "inagi.tokyo.jp",
		reversed: "pj.oykot.igani"
	},
	{
		suffix: "inami.toyama.jp",
		reversed: "pj.amayot.imani"
	},
	{
		suffix: "inami.wakayama.jp",
		reversed: "pj.amayakaw.imani"
	},
	{
		suffix: "inashiki.ibaraki.jp",
		reversed: "pj.ikarabi.ikihsani"
	},
	{
		suffix: "inatsuki.fukuoka.jp",
		reversed: "pj.akoukuf.ikustani"
	},
	{
		suffix: "inawashiro.fukushima.jp",
		reversed: "pj.amihsukuf.orihsawani"
	},
	{
		suffix: "inazawa.aichi.jp",
		reversed: "pj.ihcia.awazani"
	},
	{
		suffix: "inc",
		reversed: "cni"
	},
	{
		suffix: "inc.hk",
		reversed: "kh.cni"
	},
	{
		suffix: "incheon.kr",
		reversed: "rk.noehcni"
	},
	{
		suffix: "ind.br",
		reversed: "rb.dni"
	},
	{
		suffix: "ind.gt",
		reversed: "tg.dni"
	},
	{
		suffix: "ind.in",
		reversed: "ni.dni"
	},
	{
		suffix: "ind.kw",
		reversed: "wk.dni"
	},
	{
		suffix: "ind.tn",
		reversed: "nt.dni"
	},
	{
		suffix: "independent-commission.uk",
		reversed: "ku.noissimmoc-tnednepedni"
	},
	{
		suffix: "independent-inquest.uk",
		reversed: "ku.tseuqni-tnednepedni"
	},
	{
		suffix: "independent-inquiry.uk",
		reversed: "ku.yriuqni-tnednepedni"
	},
	{
		suffix: "independent-panel.uk",
		reversed: "ku.lenap-tnednepedni"
	},
	{
		suffix: "independent-review.uk",
		reversed: "ku.weiver-tnednepedni"
	},
	{
		suffix: "inderoy.no",
		reversed: "on.yoredni"
	},
	{
		suffix: "inderøy.no",
		reversed: "on.ayf-yredni--nx"
	},
	{
		suffix: "indian.museum",
		reversed: "muesum.naidni"
	},
	{
		suffix: "indiana.museum",
		reversed: "muesum.anaidni"
	},
	{
		suffix: "indianapolis.museum",
		reversed: "muesum.silopanaidni"
	},
	{
		suffix: "indianmarket.museum",
		reversed: "muesum.tekramnaidni"
	},
	{
		suffix: "indie.porn",
		reversed: "nrop.eidni"
	},
	{
		suffix: "indigena.bo",
		reversed: "ob.anegidni"
	},
	{
		suffix: "industria.bo",
		reversed: "ob.airtsudni"
	},
	{
		suffix: "industries",
		reversed: "seirtsudni"
	},
	{
		suffix: "ine.kyoto.jp",
		reversed: "pj.otoyk.eni"
	},
	{
		suffix: "inf.br",
		reversed: "rb.fni"
	},
	{
		suffix: "inf.cu",
		reversed: "uc.fni"
	},
	{
		suffix: "inf.mk",
		reversed: "km.fni"
	},
	{
		suffix: "inf.ua",
		reversed: "au.fni"
	},
	{
		suffix: "infiniti",
		reversed: "itinifni"
	},
	{
		suffix: "info",
		reversed: "ofni"
	},
	{
		suffix: "info.at",
		reversed: "ta.ofni"
	},
	{
		suffix: "info.au",
		reversed: "ua.ofni"
	},
	{
		suffix: "info.az",
		reversed: "za.ofni"
	},
	{
		suffix: "info.bb",
		reversed: "bb.ofni"
	},
	{
		suffix: "info.bo",
		reversed: "ob.ofni"
	},
	{
		suffix: "info.co",
		reversed: "oc.ofni"
	},
	{
		suffix: "info.cx",
		reversed: "xc.ofni"
	},
	{
		suffix: "info.ec",
		reversed: "ce.ofni"
	},
	{
		suffix: "info.et",
		reversed: "te.ofni"
	},
	{
		suffix: "info.fj",
		reversed: "jf.ofni"
	},
	{
		suffix: "info.gu",
		reversed: "ug.ofni"
	},
	{
		suffix: "info.ht",
		reversed: "th.ofni"
	},
	{
		suffix: "info.hu",
		reversed: "uh.ofni"
	},
	{
		suffix: "info.in",
		reversed: "ni.ofni"
	},
	{
		suffix: "info.ke",
		reversed: "ek.ofni"
	},
	{
		suffix: "info.ki",
		reversed: "ik.ofni"
	},
	{
		suffix: "info.la",
		reversed: "al.ofni"
	},
	{
		suffix: "info.ls",
		reversed: "sl.ofni"
	},
	{
		suffix: "info.mv",
		reversed: "vm.ofni"
	},
	{
		suffix: "info.na",
		reversed: "an.ofni"
	},
	{
		suffix: "info.nf",
		reversed: "fn.ofni"
	},
	{
		suffix: "info.ni",
		reversed: "in.ofni"
	},
	{
		suffix: "info.nr",
		reversed: "rn.ofni"
	},
	{
		suffix: "info.pk",
		reversed: "kp.ofni"
	},
	{
		suffix: "info.pl",
		reversed: "lp.ofni"
	},
	{
		suffix: "info.pr",
		reversed: "rp.ofni"
	},
	{
		suffix: "info.ro",
		reversed: "or.ofni"
	},
	{
		suffix: "info.sd",
		reversed: "ds.ofni"
	},
	{
		suffix: "info.tn",
		reversed: "nt.ofni"
	},
	{
		suffix: "info.tr",
		reversed: "rt.ofni"
	},
	{
		suffix: "info.tt",
		reversed: "tt.ofni"
	},
	{
		suffix: "info.tz",
		reversed: "zt.ofni"
	},
	{
		suffix: "info.ve",
		reversed: "ev.ofni"
	},
	{
		suffix: "info.vn",
		reversed: "nv.ofni"
	},
	{
		suffix: "info.zm",
		reversed: "mz.ofni"
	},
	{
		suffix: "ing",
		reversed: "gni"
	},
	{
		suffix: "ing.pa",
		reversed: "ap.gni"
	},
	{
		suffix: "ingatlan.hu",
		reversed: "uh.naltagni"
	},
	{
		suffix: "ink",
		reversed: "kni"
	},
	{
		suffix: "ino.kochi.jp",
		reversed: "pj.ihcok.oni"
	},
	{
		suffix: "instance.datadetect.com",
		reversed: "moc.tcetedatad.ecnatsni"
	},
	{
		suffix: "instances.spawn.cc",
		reversed: "cc.nwaps.secnatsni"
	},
	{
		suffix: "instantcloud.cn",
		reversed: "nc.duolctnatsni"
	},
	{
		suffix: "institute",
		reversed: "etutitsni"
	},
	{
		suffix: "insurance",
		reversed: "ecnarusni"
	},
	{
		suffix: "insurance.aero",
		reversed: "orea.ecnarusni"
	},
	{
		suffix: "insure",
		reversed: "erusni"
	},
	{
		suffix: "int",
		reversed: "tni"
	},
	{
		suffix: "int.ar",
		reversed: "ra.tni"
	},
	{
		suffix: "int.az",
		reversed: "za.tni"
	},
	{
		suffix: "int.bo",
		reversed: "ob.tni"
	},
	{
		suffix: "int.ci",
		reversed: "ic.tni"
	},
	{
		suffix: "int.co",
		reversed: "oc.tni"
	},
	{
		suffix: "int.cv",
		reversed: "vc.tni"
	},
	{
		suffix: "int.eu.org",
		reversed: "gro.ue.tni"
	},
	{
		suffix: "int.in",
		reversed: "ni.tni"
	},
	{
		suffix: "int.is",
		reversed: "si.tni"
	},
	{
		suffix: "int.la",
		reversed: "al.tni"
	},
	{
		suffix: "int.lk",
		reversed: "kl.tni"
	},
	{
		suffix: "int.mv",
		reversed: "vm.tni"
	},
	{
		suffix: "int.mw",
		reversed: "wm.tni"
	},
	{
		suffix: "int.ni",
		reversed: "in.tni"
	},
	{
		suffix: "int.pt",
		reversed: "tp.tni"
	},
	{
		suffix: "int.ru",
		reversed: "ur.tni"
	},
	{
		suffix: "int.tj",
		reversed: "jt.tni"
	},
	{
		suffix: "int.tt",
		reversed: "tt.tni"
	},
	{
		suffix: "int.ve",
		reversed: "ev.tni"
	},
	{
		suffix: "int.vn",
		reversed: "nv.tni"
	},
	{
		suffix: "intelligence.museum",
		reversed: "muesum.ecnegilletni"
	},
	{
		suffix: "interactive.museum",
		reversed: "muesum.evitcaretni"
	},
	{
		suffix: "international",
		reversed: "lanoitanretni"
	},
	{
		suffix: "internet-dns.de",
		reversed: "ed.snd-tenretni"
	},
	{
		suffix: "internet.in",
		reversed: "ni.tenretni"
	},
	{
		suffix: "intl.tn",
		reversed: "nt.ltni"
	},
	{
		suffix: "intuit",
		reversed: "tiutni"
	},
	{
		suffix: "inuyama.aichi.jp",
		reversed: "pj.ihcia.amayuni"
	},
	{
		suffix: "investments",
		reversed: "stnemtsevni"
	},
	{
		suffix: "inzai.chiba.jp",
		reversed: "pj.abihc.iazni"
	},
	{
		suffix: "io",
		reversed: "oi"
	},
	{
		suffix: "io.in",
		reversed: "ni.oi"
	},
	{
		suffix: "io.kg",
		reversed: "gk.oi"
	},
	{
		suffix: "iobb.net",
		reversed: "ten.bboi"
	},
	{
		suffix: "iopsys.se",
		reversed: "es.syspoi"
	},
	{
		suffix: "ip.linodeusercontent.com",
		reversed: "moc.tnetnocresuedonil.pi"
	},
	{
		suffix: "ip6.arpa",
		reversed: "apra.6pi"
	},
	{
		suffix: "ipifony.net",
		reversed: "ten.ynofipi"
	},
	{
		suffix: "ipiranga",
		reversed: "agnaripi"
	},
	{
		suffix: "iq",
		reversed: "qi"
	},
	{
		suffix: "ir",
		reversed: "ri"
	},
	{
		suffix: "iraq.museum",
		reversed: "muesum.qari"
	},
	{
		suffix: "iris.arpa",
		reversed: "apra.siri"
	},
	{
		suffix: "irish",
		reversed: "hsiri"
	},
	{
		suffix: "iron.museum",
		reversed: "muesum.nori"
	},
	{
		suffix: "iruma.saitama.jp",
		reversed: "pj.amatias.amuri"
	},
	{
		suffix: "is",
		reversed: "si"
	},
	{
		suffix: "is-a-anarchist.com",
		reversed: "moc.tsihcrana-a-si"
	},
	{
		suffix: "is-a-blogger.com",
		reversed: "moc.reggolb-a-si"
	},
	{
		suffix: "is-a-bookkeeper.com",
		reversed: "moc.repeekkoob-a-si"
	},
	{
		suffix: "is-a-bruinsfan.org",
		reversed: "gro.nafsniurb-a-si"
	},
	{
		suffix: "is-a-bulls-fan.com",
		reversed: "moc.naf-sllub-a-si"
	},
	{
		suffix: "is-a-candidate.org",
		reversed: "gro.etadidnac-a-si"
	},
	{
		suffix: "is-a-caterer.com",
		reversed: "moc.reretac-a-si"
	},
	{
		suffix: "is-a-celticsfan.org",
		reversed: "gro.nafscitlec-a-si"
	},
	{
		suffix: "is-a-chef.com",
		reversed: "moc.fehc-a-si"
	},
	{
		suffix: "is-a-chef.net",
		reversed: "ten.fehc-a-si"
	},
	{
		suffix: "is-a-chef.org",
		reversed: "gro.fehc-a-si"
	},
	{
		suffix: "is-a-conservative.com",
		reversed: "moc.evitavresnoc-a-si"
	},
	{
		suffix: "is-a-cpa.com",
		reversed: "moc.apc-a-si"
	},
	{
		suffix: "is-a-cubicle-slave.com",
		reversed: "moc.evals-elcibuc-a-si"
	},
	{
		suffix: "is-a-democrat.com",
		reversed: "moc.tarcomed-a-si"
	},
	{
		suffix: "is-a-designer.com",
		reversed: "moc.rengised-a-si"
	},
	{
		suffix: "is-a-doctor.com",
		reversed: "moc.rotcod-a-si"
	},
	{
		suffix: "is-a-financialadvisor.com",
		reversed: "moc.rosivdalaicnanif-a-si"
	},
	{
		suffix: "is-a-geek.com",
		reversed: "moc.keeg-a-si"
	},
	{
		suffix: "is-a-geek.net",
		reversed: "ten.keeg-a-si"
	},
	{
		suffix: "is-a-geek.org",
		reversed: "gro.keeg-a-si"
	},
	{
		suffix: "is-a-green.com",
		reversed: "moc.neerg-a-si"
	},
	{
		suffix: "is-a-guru.com",
		reversed: "moc.urug-a-si"
	},
	{
		suffix: "is-a-hard-worker.com",
		reversed: "moc.rekrow-drah-a-si"
	},
	{
		suffix: "is-a-hunter.com",
		reversed: "moc.retnuh-a-si"
	},
	{
		suffix: "is-a-knight.org",
		reversed: "gro.thgink-a-si"
	},
	{
		suffix: "is-a-landscaper.com",
		reversed: "moc.repacsdnal-a-si"
	},
	{
		suffix: "is-a-lawyer.com",
		reversed: "moc.reywal-a-si"
	},
	{
		suffix: "is-a-liberal.com",
		reversed: "moc.larebil-a-si"
	},
	{
		suffix: "is-a-libertarian.com",
		reversed: "moc.nairatrebil-a-si"
	},
	{
		suffix: "is-a-linux-user.org",
		reversed: "gro.resu-xunil-a-si"
	},
	{
		suffix: "is-a-llama.com",
		reversed: "moc.amall-a-si"
	},
	{
		suffix: "is-a-musician.com",
		reversed: "moc.naicisum-a-si"
	},
	{
		suffix: "is-a-nascarfan.com",
		reversed: "moc.nafracsan-a-si"
	},
	{
		suffix: "is-a-nurse.com",
		reversed: "moc.esrun-a-si"
	},
	{
		suffix: "is-a-painter.com",
		reversed: "moc.retniap-a-si"
	},
	{
		suffix: "is-a-patsfan.org",
		reversed: "gro.nafstap-a-si"
	},
	{
		suffix: "is-a-personaltrainer.com",
		reversed: "moc.reniartlanosrep-a-si"
	},
	{
		suffix: "is-a-photographer.com",
		reversed: "moc.rehpargotohp-a-si"
	},
	{
		suffix: "is-a-player.com",
		reversed: "moc.reyalp-a-si"
	},
	{
		suffix: "is-a-republican.com",
		reversed: "moc.nacilbuper-a-si"
	},
	{
		suffix: "is-a-rockstar.com",
		reversed: "moc.ratskcor-a-si"
	},
	{
		suffix: "is-a-socialist.com",
		reversed: "moc.tsilaicos-a-si"
	},
	{
		suffix: "is-a-soxfan.org",
		reversed: "gro.nafxos-a-si"
	},
	{
		suffix: "is-a-student.com",
		reversed: "moc.tneduts-a-si"
	},
	{
		suffix: "is-a-teacher.com",
		reversed: "moc.rehcaet-a-si"
	},
	{
		suffix: "is-a-techie.com",
		reversed: "moc.eihcet-a-si"
	},
	{
		suffix: "is-a-therapist.com",
		reversed: "moc.tsipareht-a-si"
	},
	{
		suffix: "is-an-accountant.com",
		reversed: "moc.tnatnuocca-na-si"
	},
	{
		suffix: "is-an-actor.com",
		reversed: "moc.rotca-na-si"
	},
	{
		suffix: "is-an-actress.com",
		reversed: "moc.ssertca-na-si"
	},
	{
		suffix: "is-an-anarchist.com",
		reversed: "moc.tsihcrana-na-si"
	},
	{
		suffix: "is-an-artist.com",
		reversed: "moc.tsitra-na-si"
	},
	{
		suffix: "is-an-engineer.com",
		reversed: "moc.reenigne-na-si"
	},
	{
		suffix: "is-an-entertainer.com",
		reversed: "moc.reniatretne-na-si"
	},
	{
		suffix: "is-by.us",
		reversed: "su.yb-si"
	},
	{
		suffix: "is-certified.com",
		reversed: "moc.deifitrec-si"
	},
	{
		suffix: "is-found.org",
		reversed: "gro.dnuof-si"
	},
	{
		suffix: "is-gone.com",
		reversed: "moc.enog-si"
	},
	{
		suffix: "is-into-anime.com",
		reversed: "moc.emina-otni-si"
	},
	{
		suffix: "is-into-cars.com",
		reversed: "moc.srac-otni-si"
	},
	{
		suffix: "is-into-cartoons.com",
		reversed: "moc.snootrac-otni-si"
	},
	{
		suffix: "is-into-games.com",
		reversed: "moc.semag-otni-si"
	},
	{
		suffix: "is-leet.com",
		reversed: "moc.teel-si"
	},
	{
		suffix: "is-lost.org",
		reversed: "gro.tsol-si"
	},
	{
		suffix: "is-not-certified.com",
		reversed: "moc.deifitrec-ton-si"
	},
	{
		suffix: "is-saved.org",
		reversed: "gro.devas-si"
	},
	{
		suffix: "is-slick.com",
		reversed: "moc.kcils-si"
	},
	{
		suffix: "is-uberleet.com",
		reversed: "moc.teelrebu-si"
	},
	{
		suffix: "is-very-bad.org",
		reversed: "gro.dab-yrev-si"
	},
	{
		suffix: "is-very-evil.org",
		reversed: "gro.live-yrev-si"
	},
	{
		suffix: "is-very-good.org",
		reversed: "gro.doog-yrev-si"
	},
	{
		suffix: "is-very-nice.org",
		reversed: "gro.ecin-yrev-si"
	},
	{
		suffix: "is-very-sweet.org",
		reversed: "gro.teews-yrev-si"
	},
	{
		suffix: "is-with-theband.com",
		reversed: "moc.dnabeht-htiw-si"
	},
	{
		suffix: "is.eu.org",
		reversed: "gro.ue.si"
	},
	{
		suffix: "is.gov.pl",
		reversed: "lp.vog.si"
	},
	{
		suffix: "is.it",
		reversed: "ti.si"
	},
	{
		suffix: "isa-geek.com",
		reversed: "moc.keeg-asi"
	},
	{
		suffix: "isa-geek.net",
		reversed: "ten.keeg-asi"
	},
	{
		suffix: "isa-geek.org",
		reversed: "gro.keeg-asi"
	},
	{
		suffix: "isa-hockeynut.com",
		reversed: "moc.tunyekcoh-asi"
	},
	{
		suffix: "isa.kagoshima.jp",
		reversed: "pj.amihsogak.asi"
	},
	{
		suffix: "isa.us",
		reversed: "su.asi"
	},
	{
		suffix: "isahaya.nagasaki.jp",
		reversed: "pj.ikasagan.ayahasi"
	},
	{
		suffix: "ise.mie.jp",
		reversed: "pj.eim.esi"
	},
	{
		suffix: "isehara.kanagawa.jp",
		reversed: "pj.awaganak.arahesi"
	},
	{
		suffix: "isen.kagoshima.jp",
		reversed: "pj.amihsogak.nesi"
	},
	{
		suffix: "isernia.it",
		reversed: "ti.ainresi"
	},
	{
		suffix: "iserv.dev",
		reversed: "ved.vresi"
	},
	{
		suffix: "iservschule.de",
		reversed: "ed.eluhcsvresi"
	},
	{
		suffix: "isesaki.gunma.jp",
		reversed: "pj.amnug.ikasesi"
	},
	{
		suffix: "ishigaki.okinawa.jp",
		reversed: "pj.awaniko.ikagihsi"
	},
	{
		suffix: "ishikari.hokkaido.jp",
		reversed: "pj.odiakkoh.irakihsi"
	},
	{
		suffix: "ishikawa.fukushima.jp",
		reversed: "pj.amihsukuf.awakihsi"
	},
	{
		suffix: "ishikawa.jp",
		reversed: "pj.awakihsi"
	},
	{
		suffix: "ishikawa.okinawa.jp",
		reversed: "pj.awaniko.awakihsi"
	},
	{
		suffix: "ishinomaki.miyagi.jp",
		reversed: "pj.igayim.ikamonihsi"
	},
	{
		suffix: "isla.pr",
		reversed: "rp.alsi"
	},
	{
		suffix: "isleofman.museum",
		reversed: "muesum.namfoelsi"
	},
	{
		suffix: "ismaili",
		reversed: "iliamsi"
	},
	{
		suffix: "isshiki.aichi.jp",
		reversed: "pj.ihcia.ikihssi"
	},
	{
		suffix: "issmarterthanyou.com",
		reversed: "moc.uoynahtretramssi"
	},
	{
		suffix: "ist",
		reversed: "tsi"
	},
	{
		suffix: "istanbul",
		reversed: "lubnatsi"
	},
	{
		suffix: "isteingeek.de",
		reversed: "ed.keegnietsi"
	},
	{
		suffix: "istmein.de",
		reversed: "ed.niemtsi"
	},
	{
		suffix: "isumi.chiba.jp",
		reversed: "pj.abihc.imusi"
	},
	{
		suffix: "it",
		reversed: "ti"
	},
	{
		suffix: "it.ao",
		reversed: "oa.ti"
	},
	{
		suffix: "it.eu.org",
		reversed: "gro.ue.ti"
	},
	{
		suffix: "it1.eur.aruba.jenv-aruba.cloud",
		reversed: "duolc.abura-vnej.abura.rue.1ti"
	},
	{
		suffix: "it1.jenv-aruba.cloud",
		reversed: "duolc.abura-vnej.1ti"
	},
	{
		suffix: "itabashi.tokyo.jp",
		reversed: "pj.oykot.ihsabati"
	},
	{
		suffix: "itako.ibaraki.jp",
		reversed: "pj.ikarabi.okati"
	},
	{
		suffix: "itakura.gunma.jp",
		reversed: "pj.amnug.arukati"
	},
	{
		suffix: "itami.hyogo.jp",
		reversed: "pj.ogoyh.imati"
	},
	{
		suffix: "itano.tokushima.jp",
		reversed: "pj.amihsukot.onati"
	},
	{
		suffix: "itau",
		reversed: "uati"
	},
	{
		suffix: "itayanagi.aomori.jp",
		reversed: "pj.iromoa.iganayati"
	},
	{
		suffix: "itcouldbewor.se",
		reversed: "es.rowebdluocti"
	},
	{
		suffix: "itigo.jp",
		reversed: "pj.ogiti"
	},
	{
		suffix: "ito.shizuoka.jp",
		reversed: "pj.akouzihs.oti"
	},
	{
		suffix: "itoigawa.niigata.jp",
		reversed: "pj.atagiin.awagioti"
	},
	{
		suffix: "itoman.okinawa.jp",
		reversed: "pj.awaniko.namoti"
	},
	{
		suffix: "its.me",
		reversed: "em.sti"
	},
	{
		suffix: "itv",
		reversed: "vti"
	},
	{
		suffix: "ivano-frankivsk.ua",
		reversed: "au.ksviknarf-onavi"
	},
	{
		suffix: "ivanovo.su",
		reversed: "us.ovonavi"
	},
	{
		suffix: "iveland.no",
		reversed: "on.dnalevi"
	},
	{
		suffix: "ivgu.no",
		reversed: "on.ugvi"
	},
	{
		suffix: "iwade.wakayama.jp",
		reversed: "pj.amayakaw.edawi"
	},
	{
		suffix: "iwafune.tochigi.jp",
		reversed: "pj.igihcot.enufawi"
	},
	{
		suffix: "iwaizumi.iwate.jp",
		reversed: "pj.etawi.imuziawi"
	},
	{
		suffix: "iwaki.fukushima.jp",
		reversed: "pj.amihsukuf.ikawi"
	},
	{
		suffix: "iwakuni.yamaguchi.jp",
		reversed: "pj.ihcugamay.inukawi"
	},
	{
		suffix: "iwakura.aichi.jp",
		reversed: "pj.ihcia.arukawi"
	},
	{
		suffix: "iwama.ibaraki.jp",
		reversed: "pj.ikarabi.amawi"
	},
	{
		suffix: "iwamizawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awazimawi"
	},
	{
		suffix: "iwanai.hokkaido.jp",
		reversed: "pj.odiakkoh.ianawi"
	},
	{
		suffix: "iwanuma.miyagi.jp",
		reversed: "pj.igayim.amunawi"
	},
	{
		suffix: "iwata.shizuoka.jp",
		reversed: "pj.akouzihs.atawi"
	},
	{
		suffix: "iwate.iwate.jp",
		reversed: "pj.etawi.etawi"
	},
	{
		suffix: "iwate.jp",
		reversed: "pj.etawi"
	},
	{
		suffix: "iwatsuki.saitama.jp",
		reversed: "pj.amatias.ikustawi"
	},
	{
		suffix: "iwi.nz",
		reversed: "zn.iwi"
	},
	{
		suffix: "iyo.ehime.jp",
		reversed: "pj.emihe.oyi"
	},
	{
		suffix: "iz.hr",
		reversed: "rh.zi"
	},
	{
		suffix: "izena.okinawa.jp",
		reversed: "pj.awaniko.anezi"
	},
	{
		suffix: "izu.shizuoka.jp",
		reversed: "pj.akouzihs.uzi"
	},
	{
		suffix: "izumi.kagoshima.jp",
		reversed: "pj.amihsogak.imuzi"
	},
	{
		suffix: "izumi.osaka.jp",
		reversed: "pj.akaso.imuzi"
	},
	{
		suffix: "izumiotsu.osaka.jp",
		reversed: "pj.akaso.ustoimuzi"
	},
	{
		suffix: "izumisano.osaka.jp",
		reversed: "pj.akaso.onasimuzi"
	},
	{
		suffix: "izumizaki.fukushima.jp",
		reversed: "pj.amihsukuf.ikazimuzi"
	},
	{
		suffix: "izumo.shimane.jp",
		reversed: "pj.enamihs.omuzi"
	},
	{
		suffix: "izumozaki.niigata.jp",
		reversed: "pj.atagiin.ikazomuzi"
	},
	{
		suffix: "izunokuni.shizuoka.jp",
		reversed: "pj.akouzihs.inukonuzi"
	},
	{
		suffix: "j.bg",
		reversed: "gb.j"
	},
	{
		suffix: "j.layershift.co.uk",
		reversed: "ku.oc.tfihsreyal.j"
	},
	{
		suffix: "j.scaleforce.com.cy",
		reversed: "yc.moc.ecrofelacs.j"
	},
	{
		suffix: "j.scaleforce.net",
		reversed: "ten.ecrofelacs.j"
	},
	{
		suffix: "jab.br",
		reversed: "rb.baj"
	},
	{
		suffix: "jaguar",
		reversed: "raugaj"
	},
	{
		suffix: "jambyl.su",
		reversed: "us.lybmaj"
	},
	{
		suffix: "jamison.museum",
		reversed: "muesum.nosimaj"
	},
	{
		suffix: "jampa.br",
		reversed: "rb.apmaj"
	},
	{
		suffix: "jan-mayen.no",
		reversed: "on.neyam-naj"
	},
	{
		suffix: "java",
		reversed: "avaj"
	},
	{
		suffix: "jaworzno.pl",
		reversed: "lp.onzrowaj"
	},
	{
		suffix: "jc.neen.it",
		reversed: "ti.neen.cj"
	},
	{
		suffix: "jcb",
		reversed: "bcj"
	},
	{
		suffix: "jcloud-ver-jpc.ik-server.com",
		reversed: "moc.revres-ki.cpj-rev-duolcj"
	},
	{
		suffix: "jcloud.ik-server.com",
		reversed: "moc.revres-ki.duolcj"
	},
	{
		suffix: "jcloud.kz",
		reversed: "zk.duolcj"
	},
	{
		suffix: "jdevcloud.com",
		reversed: "moc.duolcvedj"
	},
	{
		suffix: "jdf.br",
		reversed: "rb.fdj"
	},
	{
		suffix: "je",
		reversed: "ej"
	},
	{
		suffix: "jed.wafaicloud.com",
		reversed: "moc.duolciafaw.dej"
	},
	{
		suffix: "jeep",
		reversed: "peej"
	},
	{
		suffix: "jefferson.museum",
		reversed: "muesum.nosreffej"
	},
	{
		suffix: "jeju.kr",
		reversed: "rk.ujej"
	},
	{
		suffix: "jelastic.dogado.eu",
		reversed: "ue.odagod.citsalej"
	},
	{
		suffix: "jelastic.regruhosting.ru",
		reversed: "ur.gnitsohurger.citsalej"
	},
	{
		suffix: "jelastic.saveincloud.net",
		reversed: "ten.duolcnievas.citsalej"
	},
	{
		suffix: "jelastic.team",
		reversed: "maet.citsalej"
	},
	{
		suffix: "jelastic.tsukaeru.net",
		reversed: "ten.ureakust.citsalej"
	},
	{
		suffix: "jele.cloud",
		reversed: "duolc.elej"
	},
	{
		suffix: "jele.club",
		reversed: "bulc.elej"
	},
	{
		suffix: "jele.host",
		reversed: "tsoh.elej"
	},
	{
		suffix: "jele.io",
		reversed: "oi.elej"
	},
	{
		suffix: "jele.site",
		reversed: "etis.elej"
	},
	{
		suffix: "jelenia-gora.pl",
		reversed: "lp.arog-ainelej"
	},
	{
		suffix: "jellybean.jp",
		reversed: "pj.naebyllej"
	},
	{
		suffix: "jeonbuk.kr",
		reversed: "rk.kubnoej"
	},
	{
		suffix: "jeonnam.kr",
		reversed: "rk.mannoej"
	},
	{
		suffix: "jerusalem.museum",
		reversed: "muesum.melasurej"
	},
	{
		suffix: "jessheim.no",
		reversed: "on.miehssej"
	},
	{
		suffix: "jetzt",
		reversed: "tztej"
	},
	{
		suffix: "jevnaker.no",
		reversed: "on.rekanvej"
	},
	{
		suffix: "jewelry",
		reversed: "yrlewej"
	},
	{
		suffix: "jewelry.museum",
		reversed: "muesum.yrlewej"
	},
	{
		suffix: "jewish.museum",
		reversed: "muesum.hsiwej"
	},
	{
		suffix: "jewishart.museum",
		reversed: "muesum.trahsiwej"
	},
	{
		suffix: "jfk.museum",
		reversed: "muesum.kfj"
	},
	{
		suffix: "jgora.pl",
		reversed: "lp.arogj"
	},
	{
		suffix: "jinsekikogen.hiroshima.jp",
		reversed: "pj.amihsorih.negokikesnij"
	},
	{
		suffix: "jio",
		reversed: "oij"
	},
	{
		suffix: "jl.cn",
		reversed: "nc.lj"
	},
	{
		suffix: "jll",
		reversed: "llj"
	},
	{
		suffix: "jls-sto1.elastx.net",
		reversed: "ten.xtsale.1ots-slj"
	},
	{
		suffix: "jls-sto2.elastx.net",
		reversed: "ten.xtsale.2ots-slj"
	},
	{
		suffix: "jls-sto3.elastx.net",
		reversed: "ten.xtsale.3ots-slj"
	},
	{
		suffix: "jmp",
		reversed: "pmj"
	},
	{
		suffix: "jnj",
		reversed: "jnj"
	},
	{
		suffix: "jo",
		reversed: "oj"
	},
	{
		suffix: "joboji.iwate.jp",
		reversed: "pj.etawi.ijoboj"
	},
	{
		suffix: "jobs",
		reversed: "sboj"
	},
	{
		suffix: "jobs.tt",
		reversed: "tt.sboj"
	},
	{
		suffix: "joburg",
		reversed: "gruboj"
	},
	{
		suffix: "joetsu.niigata.jp",
		reversed: "pj.atagiin.usteoj"
	},
	{
		suffix: "jogasz.hu",
		reversed: "uh.zsagoj"
	},
	{
		suffix: "johana.toyama.jp",
		reversed: "pj.amayot.anahoj"
	},
	{
		suffix: "joinville.br",
		reversed: "rb.ellivnioj"
	},
	{
		suffix: "jolster.no",
		reversed: "on.retsloj"
	},
	{
		suffix: "jondal.no",
		reversed: "on.ladnoj"
	},
	{
		suffix: "jor.br",
		reversed: "rb.roj"
	},
	{
		suffix: "jorpeland.no",
		reversed: "on.dnaleproj"
	},
	{
		suffix: "joso.ibaraki.jp",
		reversed: "pj.ikarabi.osoj"
	},
	{
		suffix: "jot",
		reversed: "toj"
	},
	{
		suffix: "jotelulu.cloud",
		reversed: "duolc.ululetoj"
	},
	{
		suffix: "journal.aero",
		reversed: "orea.lanruoj"
	},
	{
		suffix: "journalism.museum",
		reversed: "muesum.msilanruoj"
	},
	{
		suffix: "journalist.aero",
		reversed: "orea.tsilanruoj"
	},
	{
		suffix: "joy",
		reversed: "yoj"
	},
	{
		suffix: "joyo.kyoto.jp",
		reversed: "pj.otoyk.oyoj"
	},
	{
		suffix: "jozi.biz",
		reversed: "zib.izoj"
	},
	{
		suffix: "jp",
		reversed: "pj"
	},
	{
		suffix: "jp.eu.org",
		reversed: "gro.ue.pj"
	},
	{
		suffix: "jp.kg",
		reversed: "gk.pj"
	},
	{
		suffix: "jp.md",
		reversed: "dm.pj"
	},
	{
		suffix: "jp.net",
		reversed: "ten.pj"
	},
	{
		suffix: "jpmorgan",
		reversed: "nagrompj"
	},
	{
		suffix: "jpn.com",
		reversed: "moc.npj"
	},
	{
		suffix: "jprs",
		reversed: "srpj"
	},
	{
		suffix: "js.cn",
		reversed: "nc.sj"
	},
	{
		suffix: "js.org",
		reversed: "gro.sj"
	},
	{
		suffix: "js.wpenginepowered.com",
		reversed: "moc.derewopenignepw.sj"
	},
	{
		suffix: "ju.mp",
		reversed: "pm.uj"
	},
	{
		suffix: "judaica.museum",
		reversed: "muesum.aciaduj"
	},
	{
		suffix: "judygarland.museum",
		reversed: "muesum.dnalragyduj"
	},
	{
		suffix: "juedisches.museum",
		reversed: "muesum.sehcsideuj"
	},
	{
		suffix: "juegos",
		reversed: "sogeuj"
	},
	{
		suffix: "juif.museum",
		reversed: "muesum.fiuj"
	},
	{
		suffix: "juniper",
		reversed: "repinuj"
	},
	{
		suffix: "jur.pro",
		reversed: "orp.ruj"
	},
	{
		suffix: "jus.br",
		reversed: "rb.suj"
	},
	{
		suffix: "jx.cn",
		reversed: "nc.xj"
	},
	{
		suffix: "jølster.no",
		reversed: "on.ayb-retslj--nx"
	},
	{
		suffix: "jørpeland.no",
		reversed: "on.a45-dnaleprj--nx"
	},
	{
		suffix: "k.bg",
		reversed: "gb.k"
	},
	{
		suffix: "k.se",
		reversed: "es.k"
	},
	{
		suffix: "k12.ak.us",
		reversed: "su.ka.21k"
	},
	{
		suffix: "k12.al.us",
		reversed: "su.la.21k"
	},
	{
		suffix: "k12.ar.us",
		reversed: "su.ra.21k"
	},
	{
		suffix: "k12.as.us",
		reversed: "su.sa.21k"
	},
	{
		suffix: "k12.az.us",
		reversed: "su.za.21k"
	},
	{
		suffix: "k12.ca.us",
		reversed: "su.ac.21k"
	},
	{
		suffix: "k12.co.us",
		reversed: "su.oc.21k"
	},
	{
		suffix: "k12.ct.us",
		reversed: "su.tc.21k"
	},
	{
		suffix: "k12.dc.us",
		reversed: "su.cd.21k"
	},
	{
		suffix: "k12.de.us",
		reversed: "su.ed.21k"
	},
	{
		suffix: "k12.ec",
		reversed: "ce.21k"
	},
	{
		suffix: "k12.fl.us",
		reversed: "su.lf.21k"
	},
	{
		suffix: "k12.ga.us",
		reversed: "su.ag.21k"
	},
	{
		suffix: "k12.gu.us",
		reversed: "su.ug.21k"
	},
	{
		suffix: "k12.ia.us",
		reversed: "su.ai.21k"
	},
	{
		suffix: "k12.id.us",
		reversed: "su.di.21k"
	},
	{
		suffix: "k12.il",
		reversed: "li.21k"
	},
	{
		suffix: "k12.il.us",
		reversed: "su.li.21k"
	},
	{
		suffix: "k12.in.us",
		reversed: "su.ni.21k"
	},
	{
		suffix: "k12.ks.us",
		reversed: "su.sk.21k"
	},
	{
		suffix: "k12.ky.us",
		reversed: "su.yk.21k"
	},
	{
		suffix: "k12.la.us",
		reversed: "su.al.21k"
	},
	{
		suffix: "k12.ma.us",
		reversed: "su.am.21k"
	},
	{
		suffix: "k12.md.us",
		reversed: "su.dm.21k"
	},
	{
		suffix: "k12.me.us",
		reversed: "su.em.21k"
	},
	{
		suffix: "k12.mi.us",
		reversed: "su.im.21k"
	},
	{
		suffix: "k12.mn.us",
		reversed: "su.nm.21k"
	},
	{
		suffix: "k12.mo.us",
		reversed: "su.om.21k"
	},
	{
		suffix: "k12.ms.us",
		reversed: "su.sm.21k"
	},
	{
		suffix: "k12.mt.us",
		reversed: "su.tm.21k"
	},
	{
		suffix: "k12.nc.us",
		reversed: "su.cn.21k"
	},
	{
		suffix: "k12.ne.us",
		reversed: "su.en.21k"
	},
	{
		suffix: "k12.nh.us",
		reversed: "su.hn.21k"
	},
	{
		suffix: "k12.nj.us",
		reversed: "su.jn.21k"
	},
	{
		suffix: "k12.nm.us",
		reversed: "su.mn.21k"
	},
	{
		suffix: "k12.nv.us",
		reversed: "su.vn.21k"
	},
	{
		suffix: "k12.ny.us",
		reversed: "su.yn.21k"
	},
	{
		suffix: "k12.oh.us",
		reversed: "su.ho.21k"
	},
	{
		suffix: "k12.ok.us",
		reversed: "su.ko.21k"
	},
	{
		suffix: "k12.or.us",
		reversed: "su.ro.21k"
	},
	{
		suffix: "k12.pa.us",
		reversed: "su.ap.21k"
	},
	{
		suffix: "k12.pr.us",
		reversed: "su.rp.21k"
	},
	{
		suffix: "k12.sc.us",
		reversed: "su.cs.21k"
	},
	{
		suffix: "k12.tn.us",
		reversed: "su.nt.21k"
	},
	{
		suffix: "k12.tr",
		reversed: "rt.21k"
	},
	{
		suffix: "k12.tx.us",
		reversed: "su.xt.21k"
	},
	{
		suffix: "k12.ut.us",
		reversed: "su.tu.21k"
	},
	{
		suffix: "k12.va.us",
		reversed: "su.av.21k"
	},
	{
		suffix: "k12.vi",
		reversed: "iv.21k"
	},
	{
		suffix: "k12.vi.us",
		reversed: "su.iv.21k"
	},
	{
		suffix: "k12.vt.us",
		reversed: "su.tv.21k"
	},
	{
		suffix: "k12.wa.us",
		reversed: "su.aw.21k"
	},
	{
		suffix: "k12.wi.us",
		reversed: "su.iw.21k"
	},
	{
		suffix: "k12.wy.us",
		reversed: "su.yw.21k"
	},
	{
		suffix: "k8s.fr-par.scw.cloud",
		reversed: "duolc.wcs.rap-rf.s8k"
	},
	{
		suffix: "k8s.nl-ams.scw.cloud",
		reversed: "duolc.wcs.sma-ln.s8k"
	},
	{
		suffix: "k8s.pl-waw.scw.cloud",
		reversed: "duolc.wcs.waw-lp.s8k"
	},
	{
		suffix: "k8s.scw.cloud",
		reversed: "duolc.wcs.s8k"
	},
	{
		suffix: "kaas.gg",
		reversed: "gg.saak"
	},
	{
		suffix: "kadena.okinawa.jp",
		reversed: "pj.awaniko.anedak"
	},
	{
		suffix: "kadogawa.miyazaki.jp",
		reversed: "pj.ikazayim.awagodak"
	},
	{
		suffix: "kadoma.osaka.jp",
		reversed: "pj.akaso.amodak"
	},
	{
		suffix: "kafjord.no",
		reversed: "on.drojfak"
	},
	{
		suffix: "kaga.ishikawa.jp",
		reversed: "pj.awakihsi.agak"
	},
	{
		suffix: "kagami.kochi.jp",
		reversed: "pj.ihcok.imagak"
	},
	{
		suffix: "kagamiishi.fukushima.jp",
		reversed: "pj.amihsukuf.ihsiimagak"
	},
	{
		suffix: "kagamino.okayama.jp",
		reversed: "pj.amayako.onimagak"
	},
	{
		suffix: "kagawa.jp",
		reversed: "pj.awagak"
	},
	{
		suffix: "kagoshima.jp",
		reversed: "pj.amihsogak"
	},
	{
		suffix: "kagoshima.kagoshima.jp",
		reversed: "pj.amihsogak.amihsogak"
	},
	{
		suffix: "kaho.fukuoka.jp",
		reversed: "pj.akoukuf.ohak"
	},
	{
		suffix: "kahoku.ishikawa.jp",
		reversed: "pj.awakihsi.ukohak"
	},
	{
		suffix: "kahoku.yamagata.jp",
		reversed: "pj.atagamay.ukohak"
	},
	{
		suffix: "kai.yamanashi.jp",
		reversed: "pj.ihsanamay.iak"
	},
	{
		suffix: "kainan.tokushima.jp",
		reversed: "pj.amihsukot.naniak"
	},
	{
		suffix: "kainan.wakayama.jp",
		reversed: "pj.amayakaw.naniak"
	},
	{
		suffix: "kaisei.kanagawa.jp",
		reversed: "pj.awaganak.iesiak"
	},
	{
		suffix: "kaita.hiroshima.jp",
		reversed: "pj.amihsorih.atiak"
	},
	{
		suffix: "kaizuka.osaka.jp",
		reversed: "pj.akaso.akuziak"
	},
	{
		suffix: "kakamigahara.gifu.jp",
		reversed: "pj.ufig.arahagimakak"
	},
	{
		suffix: "kakegawa.shizuoka.jp",
		reversed: "pj.akouzihs.awagekak"
	},
	{
		suffix: "kakinoki.shimane.jp",
		reversed: "pj.enamihs.ikonikak"
	},
	{
		suffix: "kakogawa.hyogo.jp",
		reversed: "pj.ogoyh.awagokak"
	},
	{
		suffix: "kakuda.miyagi.jp",
		reversed: "pj.igayim.adukak"
	},
	{
		suffix: "kalisz.pl",
		reversed: "lp.zsilak"
	},
	{
		suffix: "kalmykia.ru",
		reversed: "ur.aikymlak"
	},
	{
		suffix: "kalmykia.su",
		reversed: "us.aikymlak"
	},
	{
		suffix: "kaluga.su",
		reversed: "us.agulak"
	},
	{
		suffix: "kamagaya.chiba.jp",
		reversed: "pj.abihc.ayagamak"
	},
	{
		suffix: "kamaishi.iwate.jp",
		reversed: "pj.etawi.ihsiamak"
	},
	{
		suffix: "kamakura.kanagawa.jp",
		reversed: "pj.awaganak.arukamak"
	},
	{
		suffix: "kameoka.kyoto.jp",
		reversed: "pj.otoyk.akoemak"
	},
	{
		suffix: "kameyama.mie.jp",
		reversed: "pj.eim.amayemak"
	},
	{
		suffix: "kami.kochi.jp",
		reversed: "pj.ihcok.imak"
	},
	{
		suffix: "kami.miyagi.jp",
		reversed: "pj.igayim.imak"
	},
	{
		suffix: "kamiamakusa.kumamoto.jp",
		reversed: "pj.otomamuk.asukamaimak"
	},
	{
		suffix: "kamifurano.hokkaido.jp",
		reversed: "pj.odiakkoh.onarufimak"
	},
	{
		suffix: "kamigori.hyogo.jp",
		reversed: "pj.ogoyh.irogimak"
	},
	{
		suffix: "kamiichi.toyama.jp",
		reversed: "pj.amayot.ihciimak"
	},
	{
		suffix: "kamiizumi.saitama.jp",
		reversed: "pj.amatias.imuziimak"
	},
	{
		suffix: "kamijima.ehime.jp",
		reversed: "pj.emihe.amijimak"
	},
	{
		suffix: "kamikawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awakimak"
	},
	{
		suffix: "kamikawa.hyogo.jp",
		reversed: "pj.ogoyh.awakimak"
	},
	{
		suffix: "kamikawa.saitama.jp",
		reversed: "pj.amatias.awakimak"
	},
	{
		suffix: "kamikitayama.nara.jp",
		reversed: "pj.aran.amayatikimak"
	},
	{
		suffix: "kamikoani.akita.jp",
		reversed: "pj.atika.inaokimak"
	},
	{
		suffix: "kamimine.saga.jp",
		reversed: "pj.agas.enimimak"
	},
	{
		suffix: "kaminokawa.tochigi.jp",
		reversed: "pj.igihcot.awakonimak"
	},
	{
		suffix: "kaminoyama.yamagata.jp",
		reversed: "pj.atagamay.amayonimak"
	},
	{
		suffix: "kamioka.akita.jp",
		reversed: "pj.atika.akoimak"
	},
	{
		suffix: "kamisato.saitama.jp",
		reversed: "pj.amatias.otasimak"
	},
	{
		suffix: "kamishihoro.hokkaido.jp",
		reversed: "pj.odiakkoh.orohihsimak"
	},
	{
		suffix: "kamisu.ibaraki.jp",
		reversed: "pj.ikarabi.usimak"
	},
	{
		suffix: "kamisunagawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awaganusimak"
	},
	{
		suffix: "kamitonda.wakayama.jp",
		reversed: "pj.amayakaw.adnotimak"
	},
	{
		suffix: "kamitsue.oita.jp",
		reversed: "pj.atio.eustimak"
	},
	{
		suffix: "kamo.kyoto.jp",
		reversed: "pj.otoyk.omak"
	},
	{
		suffix: "kamo.niigata.jp",
		reversed: "pj.atagiin.omak"
	},
	{
		suffix: "kamoenai.hokkaido.jp",
		reversed: "pj.odiakkoh.ianeomak"
	},
	{
		suffix: "kamogawa.chiba.jp",
		reversed: "pj.abihc.awagomak"
	},
	{
		suffix: "kanagawa.jp",
		reversed: "pj.awaganak"
	},
	{
		suffix: "kanan.osaka.jp",
		reversed: "pj.akaso.nanak"
	},
	{
		suffix: "kanazawa.ishikawa.jp",
		reversed: "pj.awakihsi.awazanak"
	},
	{
		suffix: "kanegasaki.iwate.jp",
		reversed: "pj.etawi.ikasagenak"
	},
	{
		suffix: "kaneyama.fukushima.jp",
		reversed: "pj.amihsukuf.amayenak"
	},
	{
		suffix: "kaneyama.yamagata.jp",
		reversed: "pj.atagamay.amayenak"
	},
	{
		suffix: "kani.gifu.jp",
		reversed: "pj.ufig.inak"
	},
	{
		suffix: "kanie.aichi.jp",
		reversed: "pj.ihcia.einak"
	},
	{
		suffix: "kanmaki.nara.jp",
		reversed: "pj.aran.ikamnak"
	},
	{
		suffix: "kanna.gunma.jp",
		reversed: "pj.amnug.annak"
	},
	{
		suffix: "kannami.shizuoka.jp",
		reversed: "pj.akouzihs.imannak"
	},
	{
		suffix: "kanonji.kagawa.jp",
		reversed: "pj.awagak.ijnonak"
	},
	{
		suffix: "kanoya.kagoshima.jp",
		reversed: "pj.amihsogak.ayonak"
	},
	{
		suffix: "kanra.gunma.jp",
		reversed: "pj.amnug.arnak"
	},
	{
		suffix: "kanuma.tochigi.jp",
		reversed: "pj.igihcot.amunak"
	},
	{
		suffix: "kanzaki.saga.jp",
		reversed: "pj.agas.ikaznak"
	},
	{
		suffix: "kapsi.fi",
		reversed: "if.ispak"
	},
	{
		suffix: "karacol.su",
		reversed: "us.locarak"
	},
	{
		suffix: "karaganda.su",
		reversed: "us.adnagarak"
	},
	{
		suffix: "karasjohka.no",
		reversed: "on.akhojsarak"
	},
	{
		suffix: "karasjok.no",
		reversed: "on.kojsarak"
	},
	{
		suffix: "karasuyama.tochigi.jp",
		reversed: "pj.igihcot.amayusarak"
	},
	{
		suffix: "karate.museum",
		reversed: "muesum.etarak"
	},
	{
		suffix: "karatsu.saga.jp",
		reversed: "pj.agas.ustarak"
	},
	{
		suffix: "karelia.su",
		reversed: "us.ailerak"
	},
	{
		suffix: "karikatur.museum",
		reversed: "muesum.rutakirak"
	},
	{
		suffix: "kariwa.niigata.jp",
		reversed: "pj.atagiin.awirak"
	},
	{
		suffix: "kariya.aichi.jp",
		reversed: "pj.ihcia.ayirak"
	},
	{
		suffix: "karlsoy.no",
		reversed: "on.yoslrak"
	},
	{
		suffix: "karmoy.no",
		reversed: "on.yomrak"
	},
	{
		suffix: "karmøy.no",
		reversed: "on.auy-ymrak--nx"
	},
	{
		suffix: "karpacz.pl",
		reversed: "lp.zcaprak"
	},
	{
		suffix: "kartuzy.pl",
		reversed: "lp.yzutrak"
	},
	{
		suffix: "karuizawa.nagano.jp",
		reversed: "pj.onagan.awaziurak"
	},
	{
		suffix: "karumai.iwate.jp",
		reversed: "pj.etawi.iamurak"
	},
	{
		suffix: "kasahara.gifu.jp",
		reversed: "pj.ufig.arahasak"
	},
	{
		suffix: "kasai.hyogo.jp",
		reversed: "pj.ogoyh.iasak"
	},
	{
		suffix: "kasama.ibaraki.jp",
		reversed: "pj.ikarabi.amasak"
	},
	{
		suffix: "kasamatsu.gifu.jp",
		reversed: "pj.ufig.ustamasak"
	},
	{
		suffix: "kasaoka.okayama.jp",
		reversed: "pj.amayako.akoasak"
	},
	{
		suffix: "kashiba.nara.jp",
		reversed: "pj.aran.abihsak"
	},
	{
		suffix: "kashihara.nara.jp",
		reversed: "pj.aran.arahihsak"
	},
	{
		suffix: "kashima.ibaraki.jp",
		reversed: "pj.ikarabi.amihsak"
	},
	{
		suffix: "kashima.saga.jp",
		reversed: "pj.agas.amihsak"
	},
	{
		suffix: "kashiwa.chiba.jp",
		reversed: "pj.abihc.awihsak"
	},
	{
		suffix: "kashiwara.osaka.jp",
		reversed: "pj.akaso.arawihsak"
	},
	{
		suffix: "kashiwazaki.niigata.jp",
		reversed: "pj.atagiin.ikazawihsak"
	},
	{
		suffix: "kasserver.com",
		reversed: "moc.revressak"
	},
	{
		suffix: "kasuga.fukuoka.jp",
		reversed: "pj.akoukuf.agusak"
	},
	{
		suffix: "kasuga.hyogo.jp",
		reversed: "pj.ogoyh.agusak"
	},
	{
		suffix: "kasugai.aichi.jp",
		reversed: "pj.ihcia.iagusak"
	},
	{
		suffix: "kasukabe.saitama.jp",
		reversed: "pj.amatias.ebakusak"
	},
	{
		suffix: "kasumigaura.ibaraki.jp",
		reversed: "pj.ikarabi.aruagimusak"
	},
	{
		suffix: "kasuya.fukuoka.jp",
		reversed: "pj.akoukuf.ayusak"
	},
	{
		suffix: "kaszuby.pl",
		reversed: "lp.ybuzsak"
	},
	{
		suffix: "katagami.akita.jp",
		reversed: "pj.atika.imagatak"
	},
	{
		suffix: "katano.osaka.jp",
		reversed: "pj.akaso.onatak"
	},
	{
		suffix: "katashina.gunma.jp",
		reversed: "pj.amnug.anihsatak"
	},
	{
		suffix: "katori.chiba.jp",
		reversed: "pj.abihc.irotak"
	},
	{
		suffix: "katowice.pl",
		reversed: "lp.eciwotak"
	},
	{
		suffix: "katsuragi.nara.jp",
		reversed: "pj.aran.igarustak"
	},
	{
		suffix: "katsuragi.wakayama.jp",
		reversed: "pj.amayakaw.igarustak"
	},
	{
		suffix: "katsushika.tokyo.jp",
		reversed: "pj.oykot.akihsustak"
	},
	{
		suffix: "katsuura.chiba.jp",
		reversed: "pj.abihc.aruustak"
	},
	{
		suffix: "katsuyama.fukui.jp",
		reversed: "pj.iukuf.amayustak"
	},
	{
		suffix: "kaufen",
		reversed: "nefuak"
	},
	{
		suffix: "kautokeino.no",
		reversed: "on.oniekotuak"
	},
	{
		suffix: "kawaba.gunma.jp",
		reversed: "pj.amnug.abawak"
	},
	{
		suffix: "kawachinagano.osaka.jp",
		reversed: "pj.akaso.onaganihcawak"
	},
	{
		suffix: "kawagoe.mie.jp",
		reversed: "pj.eim.eogawak"
	},
	{
		suffix: "kawagoe.saitama.jp",
		reversed: "pj.amatias.eogawak"
	},
	{
		suffix: "kawaguchi.saitama.jp",
		reversed: "pj.amatias.ihcugawak"
	},
	{
		suffix: "kawahara.tottori.jp",
		reversed: "pj.irottot.arahawak"
	},
	{
		suffix: "kawai.iwate.jp",
		reversed: "pj.etawi.iawak"
	},
	{
		suffix: "kawai.nara.jp",
		reversed: "pj.aran.iawak"
	},
	{
		suffix: "kawaiishop.jp",
		reversed: "pj.pohsiiawak"
	},
	{
		suffix: "kawajima.saitama.jp",
		reversed: "pj.amatias.amijawak"
	},
	{
		suffix: "kawakami.nagano.jp",
		reversed: "pj.onagan.imakawak"
	},
	{
		suffix: "kawakami.nara.jp",
		reversed: "pj.aran.imakawak"
	},
	{
		suffix: "kawakita.ishikawa.jp",
		reversed: "pj.awakihsi.atikawak"
	},
	{
		suffix: "kawamata.fukushima.jp",
		reversed: "pj.amihsukuf.atamawak"
	},
	{
		suffix: "kawaminami.miyazaki.jp",
		reversed: "pj.ikazayim.imanimawak"
	},
	{
		suffix: "kawanabe.kagoshima.jp",
		reversed: "pj.amihsogak.ebanawak"
	},
	{
		suffix: "kawanehon.shizuoka.jp",
		reversed: "pj.akouzihs.nohenawak"
	},
	{
		suffix: "kawanishi.hyogo.jp",
		reversed: "pj.ogoyh.ihsinawak"
	},
	{
		suffix: "kawanishi.nara.jp",
		reversed: "pj.aran.ihsinawak"
	},
	{
		suffix: "kawanishi.yamagata.jp",
		reversed: "pj.atagamay.ihsinawak"
	},
	{
		suffix: "kawara.fukuoka.jp",
		reversed: "pj.akoukuf.arawak"
	},
	{
		suffix: "kawasaki.miyagi.jp",
		reversed: "pj.igayim.ikasawak"
	},
	{
		suffix: "kawatana.nagasaki.jp",
		reversed: "pj.ikasagan.anatawak"
	},
	{
		suffix: "kawaue.gifu.jp",
		reversed: "pj.ufig.euawak"
	},
	{
		suffix: "kawazu.shizuoka.jp",
		reversed: "pj.akouzihs.uzawak"
	},
	{
		suffix: "kayabe.hokkaido.jp",
		reversed: "pj.odiakkoh.ebayak"
	},
	{
		suffix: "kazimierz-dolny.pl",
		reversed: "lp.ynlod-zreimizak"
	},
	{
		suffix: "kazo.saitama.jp",
		reversed: "pj.amatias.ozak"
	},
	{
		suffix: "kazuno.akita.jp",
		reversed: "pj.atika.onuzak"
	},
	{
		suffix: "kddi",
		reversed: "iddk"
	},
	{
		suffix: "ke",
		reversed: "ek"
	},
	{
		suffix: "keisen.fukuoka.jp",
		reversed: "pj.akoukuf.nesiek"
	},
	{
		suffix: "keliweb.cloud",
		reversed: "duolc.bewilek"
	},
	{
		suffix: "kembuchi.hokkaido.jp",
		reversed: "pj.odiakkoh.ihcubmek"
	},
	{
		suffix: "kep.tr",
		reversed: "rt.pek"
	},
	{
		suffix: "kepno.pl",
		reversed: "lp.onpek"
	},
	{
		suffix: "kerryhotels",
		reversed: "sletohyrrek"
	},
	{
		suffix: "kerrylogistics",
		reversed: "scitsigolyrrek"
	},
	{
		suffix: "kerryproperties",
		reversed: "seitreporpyrrek"
	},
	{
		suffix: "ketrzyn.pl",
		reversed: "lp.nyzrtek"
	},
	{
		suffix: "keymachine.de",
		reversed: "ed.enihcamyek"
	},
	{
		suffix: "kfh",
		reversed: "hfk"
	},
	{
		suffix: "kg",
		reversed: "gk"
	},
	{
		suffix: "kg.kr",
		reversed: "rk.gk"
	},
	{
		suffix: "kh.ua",
		reversed: "au.hk"
	},
	{
		suffix: "khakassia.su",
		reversed: "us.aissakahk"
	},
	{
		suffix: "kharkiv.ua",
		reversed: "au.vikrahk"
	},
	{
		suffix: "kharkov.ua",
		reversed: "au.vokrahk"
	},
	{
		suffix: "kherson.ua",
		reversed: "au.nosrehk"
	},
	{
		suffix: "khmelnitskiy.ua",
		reversed: "au.yikstinlemhk"
	},
	{
		suffix: "khmelnytskyi.ua",
		reversed: "au.iykstynlemhk"
	},
	{
		suffix: "khplay.nl",
		reversed: "ln.yalphk"
	},
	{
		suffix: "ki",
		reversed: "ik"
	},
	{
		suffix: "kia",
		reversed: "aik"
	},
	{
		suffix: "kibichuo.okayama.jp",
		reversed: "pj.amayako.ouhcibik"
	},
	{
		suffix: "kicks-ass.net",
		reversed: "ten.ssa-skcik"
	},
	{
		suffix: "kicks-ass.org",
		reversed: "gro.ssa-skcik"
	},
	{
		suffix: "kids",
		reversed: "sdik"
	},
	{
		suffix: "kids.museum",
		reversed: "muesum.sdik"
	},
	{
		suffix: "kids.us",
		reversed: "su.sdik"
	},
	{
		suffix: "kiev.ua",
		reversed: "au.veik"
	},
	{
		suffix: "kiho.mie.jp",
		reversed: "pj.eim.ohik"
	},
	{
		suffix: "kihoku.ehime.jp",
		reversed: "pj.emihe.ukohik"
	},
	{
		suffix: "kijo.miyazaki.jp",
		reversed: "pj.ikazayim.ojik"
	},
	{
		suffix: "kikirara.jp",
		reversed: "pj.ararikik"
	},
	{
		suffix: "kikonai.hokkaido.jp",
		reversed: "pj.odiakkoh.ianokik"
	},
	{
		suffix: "kikuchi.kumamoto.jp",
		reversed: "pj.otomamuk.ihcukik"
	},
	{
		suffix: "kikugawa.shizuoka.jp",
		reversed: "pj.akouzihs.awagukik"
	},
	{
		suffix: "kilatiron.com",
		reversed: "moc.noritalik"
	},
	{
		suffix: "kill.jp",
		reversed: "pj.llik"
	},
	{
		suffix: "kilo.jp",
		reversed: "pj.olik"
	},
	{
		suffix: "kim",
		reversed: "mik"
	},
	{
		suffix: "kimino.wakayama.jp",
		reversed: "pj.amayakaw.onimik"
	},
	{
		suffix: "kimitsu.chiba.jp",
		reversed: "pj.abihc.ustimik"
	},
	{
		suffix: "kimobetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebomik"
	},
	{
		suffix: "kin.okinawa.jp",
		reversed: "pj.awaniko.nik"
	},
	{
		suffix: "kinder",
		reversed: "rednik"
	},
	{
		suffix: "kindle",
		reversed: "eldnik"
	},
	{
		suffix: "kinghost.net",
		reversed: "ten.tsohgnik"
	},
	{
		suffix: "kinko.kagoshima.jp",
		reversed: "pj.amihsogak.oknik"
	},
	{
		suffix: "kinokawa.wakayama.jp",
		reversed: "pj.amayakaw.awakonik"
	},
	{
		suffix: "kira.aichi.jp",
		reversed: "pj.ihcia.arik"
	},
	{
		suffix: "kirkenes.no",
		reversed: "on.senekrik"
	},
	{
		suffix: "kirovograd.ua",
		reversed: "au.dargovorik"
	},
	{
		suffix: "kiryu.gunma.jp",
		reversed: "pj.amnug.uyrik"
	},
	{
		suffix: "kisarazu.chiba.jp",
		reversed: "pj.abihc.uzarasik"
	},
	{
		suffix: "kishiwada.osaka.jp",
		reversed: "pj.akaso.adawihsik"
	},
	{
		suffix: "kiso.nagano.jp",
		reversed: "pj.onagan.osik"
	},
	{
		suffix: "kisofukushima.nagano.jp",
		reversed: "pj.onagan.amihsukufosik"
	},
	{
		suffix: "kisosaki.mie.jp",
		reversed: "pj.eim.ikasosik"
	},
	{
		suffix: "kita.kyoto.jp",
		reversed: "pj.otoyk.atik"
	},
	{
		suffix: "kita.osaka.jp",
		reversed: "pj.akaso.atik"
	},
	{
		suffix: "kita.tokyo.jp",
		reversed: "pj.oykot.atik"
	},
	{
		suffix: "kitaaiki.nagano.jp",
		reversed: "pj.onagan.ikiaatik"
	},
	{
		suffix: "kitaakita.akita.jp",
		reversed: "pj.atika.atikaatik"
	},
	{
		suffix: "kitadaito.okinawa.jp",
		reversed: "pj.awaniko.otiadatik"
	},
	{
		suffix: "kitagata.gifu.jp",
		reversed: "pj.ufig.atagatik"
	},
	{
		suffix: "kitagata.saga.jp",
		reversed: "pj.agas.atagatik"
	},
	{
		suffix: "kitagawa.kochi.jp",
		reversed: "pj.ihcok.awagatik"
	},
	{
		suffix: "kitagawa.miyazaki.jp",
		reversed: "pj.ikazayim.awagatik"
	},
	{
		suffix: "kitahata.saga.jp",
		reversed: "pj.agas.atahatik"
	},
	{
		suffix: "kitahiroshima.hokkaido.jp",
		reversed: "pj.odiakkoh.amihsorihatik"
	},
	{
		suffix: "kitakami.iwate.jp",
		reversed: "pj.etawi.imakatik"
	},
	{
		suffix: "kitakata.fukushima.jp",
		reversed: "pj.amihsukuf.atakatik"
	},
	{
		suffix: "kitakata.miyazaki.jp",
		reversed: "pj.ikazayim.atakatik"
	},
	{
		suffix: "kitami.hokkaido.jp",
		reversed: "pj.odiakkoh.imatik"
	},
	{
		suffix: "kitamoto.saitama.jp",
		reversed: "pj.amatias.otomatik"
	},
	{
		suffix: "kitanakagusuku.okinawa.jp",
		reversed: "pj.awaniko.ukusugakanatik"
	},
	{
		suffix: "kitashiobara.fukushima.jp",
		reversed: "pj.amihsukuf.araboihsatik"
	},
	{
		suffix: "kitaura.miyazaki.jp",
		reversed: "pj.ikazayim.aruatik"
	},
	{
		suffix: "kitayama.wakayama.jp",
		reversed: "pj.amayakaw.amayatik"
	},
	{
		suffix: "kitchen",
		reversed: "nehctik"
	},
	{
		suffix: "kiwa.mie.jp",
		reversed: "pj.eim.awik"
	},
	{
		suffix: "kiwi",
		reversed: "iwik"
	},
	{
		suffix: "kiwi.nz",
		reversed: "zn.iwik"
	},
	{
		suffix: "kiyama.saga.jp",
		reversed: "pj.agas.amayik"
	},
	{
		suffix: "kiyokawa.kanagawa.jp",
		reversed: "pj.awaganak.awakoyik"
	},
	{
		suffix: "kiyosato.hokkaido.jp",
		reversed: "pj.odiakkoh.otasoyik"
	},
	{
		suffix: "kiyose.tokyo.jp",
		reversed: "pj.oykot.esoyik"
	},
	{
		suffix: "kiyosu.aichi.jp",
		reversed: "pj.ihcia.usoyik"
	},
	{
		suffix: "kizu.kyoto.jp",
		reversed: "pj.otoyk.uzik"
	},
	{
		suffix: "klabu.no",
		reversed: "on.ubalk"
	},
	{
		suffix: "klepp.no",
		reversed: "on.ppelk"
	},
	{
		suffix: "klodzko.pl",
		reversed: "lp.okzdolk"
	},
	{
		suffix: "klæbu.no",
		reversed: "on.aow-ublk--nx"
	},
	{
		suffix: "km",
		reversed: "mk"
	},
	{
		suffix: "km.ua",
		reversed: "au.mk"
	},
	{
		suffix: "kmpsp.gov.pl",
		reversed: "lp.vog.pspmk"
	},
	{
		suffix: "kn",
		reversed: "nk"
	},
	{
		suffix: "knightpoint.systems",
		reversed: "smetsys.tniopthgink"
	},
	{
		suffix: "knowsitall.info",
		reversed: "ofni.llatiswonk"
	},
	{
		suffix: "knx-server.net",
		reversed: "ten.revres-xnk"
	},
	{
		suffix: "kobayashi.miyazaki.jp",
		reversed: "pj.ikazayim.ihsayabok"
	},
	{
		suffix: "kobierzyce.pl",
		reversed: "lp.ecyzreibok"
	},
	{
		suffix: "kochi.jp",
		reversed: "pj.ihcok"
	},
	{
		suffix: "kochi.kochi.jp",
		reversed: "pj.ihcok.ihcok"
	},
	{
		suffix: "kodaira.tokyo.jp",
		reversed: "pj.oykot.ariadok"
	},
	{
		suffix: "koebenhavn.museum",
		reversed: "muesum.nvahnebeok"
	},
	{
		suffix: "koeln",
		reversed: "nleok"
	},
	{
		suffix: "koeln.museum",
		reversed: "muesum.nleok"
	},
	{
		suffix: "kofu.yamanashi.jp",
		reversed: "pj.ihsanamay.ufok"
	},
	{
		suffix: "koga.fukuoka.jp",
		reversed: "pj.akoukuf.agok"
	},
	{
		suffix: "koga.ibaraki.jp",
		reversed: "pj.ikarabi.agok"
	},
	{
		suffix: "koganei.tokyo.jp",
		reversed: "pj.oykot.ienagok"
	},
	{
		suffix: "koge.tottori.jp",
		reversed: "pj.irottot.egok"
	},
	{
		suffix: "koka.shiga.jp",
		reversed: "pj.agihs.akok"
	},
	{
		suffix: "kokonoe.oita.jp",
		reversed: "pj.atio.eonokok"
	},
	{
		suffix: "kokubunji.tokyo.jp",
		reversed: "pj.oykot.ijnubukok"
	},
	{
		suffix: "kolobrzeg.pl",
		reversed: "lp.gezrbolok"
	},
	{
		suffix: "komae.tokyo.jp",
		reversed: "pj.oykot.eamok"
	},
	{
		suffix: "komagane.nagano.jp",
		reversed: "pj.onagan.enagamok"
	},
	{
		suffix: "komaki.aichi.jp",
		reversed: "pj.ihcia.ikamok"
	},
	{
		suffix: "komatsu",
		reversed: "ustamok"
	},
	{
		suffix: "komatsu.ishikawa.jp",
		reversed: "pj.awakihsi.ustamok"
	},
	{
		suffix: "komatsushima.tokushima.jp",
		reversed: "pj.amihsukot.amihsustamok"
	},
	{
		suffix: "komforb.se",
		reversed: "es.brofmok"
	},
	{
		suffix: "kommunalforbund.se",
		reversed: "es.dnubroflanummok"
	},
	{
		suffix: "kommune.no",
		reversed: "on.enummok"
	},
	{
		suffix: "komono.mie.jp",
		reversed: "pj.eim.onomok"
	},
	{
		suffix: "komoro.nagano.jp",
		reversed: "pj.onagan.oromok"
	},
	{
		suffix: "komvux.se",
		reversed: "es.xuvmok"
	},
	{
		suffix: "konan.aichi.jp",
		reversed: "pj.ihcia.nanok"
	},
	{
		suffix: "konan.shiga.jp",
		reversed: "pj.agihs.nanok"
	},
	{
		suffix: "kongsberg.no",
		reversed: "on.grebsgnok"
	},
	{
		suffix: "kongsvinger.no",
		reversed: "on.regnivsgnok"
	},
	{
		suffix: "konin.pl",
		reversed: "lp.ninok"
	},
	{
		suffix: "konskowola.pl",
		reversed: "lp.alowoksnok"
	},
	{
		suffix: "konsulat.gov.pl",
		reversed: "lp.vog.talusnok"
	},
	{
		suffix: "konyvelo.hu",
		reversed: "uh.olevynok"
	},
	{
		suffix: "koobin.events",
		reversed: "stneve.nibook"
	},
	{
		suffix: "koori.fukushima.jp",
		reversed: "pj.amihsukuf.irook"
	},
	{
		suffix: "kopervik.no",
		reversed: "on.kivrepok"
	},
	{
		suffix: "koriyama.fukushima.jp",
		reversed: "pj.amihsukuf.amayirok"
	},
	{
		suffix: "koryo.nara.jp",
		reversed: "pj.aran.oyrok"
	},
	{
		suffix: "kosai.shizuoka.jp",
		reversed: "pj.akouzihs.iasok"
	},
	{
		suffix: "kosaka.akita.jp",
		reversed: "pj.atika.akasok"
	},
	{
		suffix: "kosei.shiga.jp",
		reversed: "pj.agihs.iesok"
	},
	{
		suffix: "kosher",
		reversed: "rehsok"
	},
	{
		suffix: "koshigaya.saitama.jp",
		reversed: "pj.amatias.ayagihsok"
	},
	{
		suffix: "koshimizu.hokkaido.jp",
		reversed: "pj.odiakkoh.uzimihsok"
	},
	{
		suffix: "koshu.yamanashi.jp",
		reversed: "pj.ihsanamay.uhsok"
	},
	{
		suffix: "kosuge.yamanashi.jp",
		reversed: "pj.ihsanamay.egusok"
	},
	{
		suffix: "kota.aichi.jp",
		reversed: "pj.ihcia.atok"
	},
	{
		suffix: "koto.shiga.jp",
		reversed: "pj.agihs.otok"
	},
	{
		suffix: "koto.tokyo.jp",
		reversed: "pj.oykot.otok"
	},
	{
		suffix: "kotohira.kagawa.jp",
		reversed: "pj.awagak.arihotok"
	},
	{
		suffix: "kotoura.tottori.jp",
		reversed: "pj.irottot.aruotok"
	},
	{
		suffix: "kouhoku.saga.jp",
		reversed: "pj.agas.ukohuok"
	},
	{
		suffix: "kounosu.saitama.jp",
		reversed: "pj.amatias.usonuok"
	},
	{
		suffix: "kouyama.kagoshima.jp",
		reversed: "pj.amihsogak.amayuok"
	},
	{
		suffix: "kouzushima.tokyo.jp",
		reversed: "pj.oykot.amihsuzuok"
	},
	{
		suffix: "koya.wakayama.jp",
		reversed: "pj.amayakaw.ayok"
	},
	{
		suffix: "koza.wakayama.jp",
		reversed: "pj.amayakaw.azok"
	},
	{
		suffix: "kozagawa.wakayama.jp",
		reversed: "pj.amayakaw.awagazok"
	},
	{
		suffix: "kozaki.chiba.jp",
		reversed: "pj.abihc.ikazok"
	},
	{
		suffix: "kozow.com",
		reversed: "moc.wozok"
	},
	{
		suffix: "kp",
		reversed: "pk"
	},
	{
		suffix: "kpmg",
		reversed: "gmpk"
	},
	{
		suffix: "kpn",
		reversed: "npk"
	},
	{
		suffix: "kppsp.gov.pl",
		reversed: "lp.vog.psppk"
	},
	{
		suffix: "kr",
		reversed: "rk"
	},
	{
		suffix: "kr.com",
		reversed: "moc.rk"
	},
	{
		suffix: "kr.eu.org",
		reversed: "gro.ue.rk"
	},
	{
		suffix: "kr.it",
		reversed: "ti.rk"
	},
	{
		suffix: "kr.ua",
		reversed: "au.rk"
	},
	{
		suffix: "kraanghke.no",
		reversed: "on.ekhgnaark"
	},
	{
		suffix: "kragero.no",
		reversed: "on.oregark"
	},
	{
		suffix: "kragerø.no",
		reversed: "on.ayg-regark--nx"
	},
	{
		suffix: "krakow.pl",
		reversed: "lp.wokark"
	},
	{
		suffix: "krasnik.pl",
		reversed: "lp.kinsark"
	},
	{
		suffix: "krasnodar.su",
		reversed: "us.radonsark"
	},
	{
		suffix: "krd",
		reversed: "drk"
	},
	{
		suffix: "kred",
		reversed: "derk"
	},
	{
		suffix: "krellian.net",
		reversed: "ten.naillerk"
	},
	{
		suffix: "kristiansand.no",
		reversed: "on.dnasnaitsirk"
	},
	{
		suffix: "kristiansund.no",
		reversed: "on.dnusnaitsirk"
	},
	{
		suffix: "krodsherad.no",
		reversed: "on.darehsdork"
	},
	{
		suffix: "krokstadelva.no",
		reversed: "on.avledatskork"
	},
	{
		suffix: "krym.ua",
		reversed: "au.myrk"
	},
	{
		suffix: "kråanghke.no",
		reversed: "on.a0b-ekhgnark--nx"
	},
	{
		suffix: "krødsherad.no",
		reversed: "on.a8m-darehsdrk--nx"
	},
	{
		suffix: "ks.ua",
		reversed: "au.sk"
	},
	{
		suffix: "ks.us",
		reversed: "su.sk"
	},
	{
		suffix: "ktistory.com",
		reversed: "moc.yrotsitk"
	},
	{
		suffix: "kuchinotsu.nagasaki.jp",
		reversed: "pj.ikasagan.ustonihcuk"
	},
	{
		suffix: "kudamatsu.yamaguchi.jp",
		reversed: "pj.ihcugamay.ustamaduk"
	},
	{
		suffix: "kudoyama.wakayama.jp",
		reversed: "pj.amayakaw.amayoduk"
	},
	{
		suffix: "kui.hiroshima.jp",
		reversed: "pj.amihsorih.iuk"
	},
	{
		suffix: "kuji.iwate.jp",
		reversed: "pj.etawi.ijuk"
	},
	{
		suffix: "kuju.oita.jp",
		reversed: "pj.atio.ujuk"
	},
	{
		suffix: "kujukuri.chiba.jp",
		reversed: "pj.abihc.irukujuk"
	},
	{
		suffix: "kuki.saitama.jp",
		reversed: "pj.amatias.ikuk"
	},
	{
		suffix: "kuleuven.cloud",
		reversed: "duolc.nevueluk"
	},
	{
		suffix: "kumagaya.saitama.jp",
		reversed: "pj.amatias.ayagamuk"
	},
	{
		suffix: "kumakogen.ehime.jp",
		reversed: "pj.emihe.negokamuk"
	},
	{
		suffix: "kumamoto.jp",
		reversed: "pj.otomamuk"
	},
	{
		suffix: "kumamoto.kumamoto.jp",
		reversed: "pj.otomamuk.otomamuk"
	},
	{
		suffix: "kumano.hiroshima.jp",
		reversed: "pj.amihsorih.onamuk"
	},
	{
		suffix: "kumano.mie.jp",
		reversed: "pj.eim.onamuk"
	},
	{
		suffix: "kumatori.osaka.jp",
		reversed: "pj.akaso.irotamuk"
	},
	{
		suffix: "kumejima.okinawa.jp",
		reversed: "pj.awaniko.amijemuk"
	},
	{
		suffix: "kumenan.okayama.jp",
		reversed: "pj.amayako.nanemuk"
	},
	{
		suffix: "kumiyama.kyoto.jp",
		reversed: "pj.otoyk.amayimuk"
	},
	{
		suffix: "kunigami.okinawa.jp",
		reversed: "pj.awaniko.imaginuk"
	},
	{
		suffix: "kunimi.fukushima.jp",
		reversed: "pj.amihsukuf.iminuk"
	},
	{
		suffix: "kunisaki.oita.jp",
		reversed: "pj.atio.ikasinuk"
	},
	{
		suffix: "kunitachi.tokyo.jp",
		reversed: "pj.oykot.ihcatinuk"
	},
	{
		suffix: "kunitomi.miyazaki.jp",
		reversed: "pj.ikazayim.imotinuk"
	},
	{
		suffix: "kunneppu.hokkaido.jp",
		reversed: "pj.odiakkoh.uppennuk"
	},
	{
		suffix: "kunohe.iwate.jp",
		reversed: "pj.etawi.ehonuk"
	},
	{
		suffix: "kunst.museum",
		reversed: "muesum.tsnuk"
	},
	{
		suffix: "kunstsammlung.museum",
		reversed: "muesum.gnulmmastsnuk"
	},
	{
		suffix: "kunstunddesign.museum",
		reversed: "muesum.ngiseddnutsnuk"
	},
	{
		suffix: "kuokgroup",
		reversed: "puorgkouk"
	},
	{
		suffix: "kurashiki.okayama.jp",
		reversed: "pj.amayako.ikihsaruk"
	},
	{
		suffix: "kurate.fukuoka.jp",
		reversed: "pj.akoukuf.etaruk"
	},
	{
		suffix: "kure.hiroshima.jp",
		reversed: "pj.amihsorih.eruk"
	},
	{
		suffix: "kurgan.su",
		reversed: "us.nagruk"
	},
	{
		suffix: "kuriyama.hokkaido.jp",
		reversed: "pj.odiakkoh.amayiruk"
	},
	{
		suffix: "kurobe.toyama.jp",
		reversed: "pj.amayot.eboruk"
	},
	{
		suffix: "kurogi.fukuoka.jp",
		reversed: "pj.akoukuf.igoruk"
	},
	{
		suffix: "kuroishi.aomori.jp",
		reversed: "pj.iromoa.ihsioruk"
	},
	{
		suffix: "kuroiso.tochigi.jp",
		reversed: "pj.igihcot.osioruk"
	},
	{
		suffix: "kuromatsunai.hokkaido.jp",
		reversed: "pj.odiakkoh.ianustamoruk"
	},
	{
		suffix: "kuron.jp",
		reversed: "pj.noruk"
	},
	{
		suffix: "kurotaki.nara.jp",
		reversed: "pj.aran.ikatoruk"
	},
	{
		suffix: "kurume.fukuoka.jp",
		reversed: "pj.akoukuf.emuruk"
	},
	{
		suffix: "kusatsu.gunma.jp",
		reversed: "pj.amnug.ustasuk"
	},
	{
		suffix: "kusatsu.shiga.jp",
		reversed: "pj.agihs.ustasuk"
	},
	{
		suffix: "kushima.miyazaki.jp",
		reversed: "pj.ikazayim.amihsuk"
	},
	{
		suffix: "kushimoto.wakayama.jp",
		reversed: "pj.amayakaw.otomihsuk"
	},
	{
		suffix: "kushiro.hokkaido.jp",
		reversed: "pj.odiakkoh.orihsuk"
	},
	{
		suffix: "kustanai.ru",
		reversed: "ur.ianatsuk"
	},
	{
		suffix: "kustanai.su",
		reversed: "us.ianatsuk"
	},
	{
		suffix: "kusu.oita.jp",
		reversed: "pj.atio.usuk"
	},
	{
		suffix: "kutchan.hokkaido.jp",
		reversed: "pj.odiakkoh.nahctuk"
	},
	{
		suffix: "kutno.pl",
		reversed: "lp.ontuk"
	},
	{
		suffix: "kuwana.mie.jp",
		reversed: "pj.eim.anawuk"
	},
	{
		suffix: "kuzumaki.iwate.jp",
		reversed: "pj.etawi.ikamuzuk"
	},
	{
		suffix: "kv.ua",
		reversed: "au.vk"
	},
	{
		suffix: "kvafjord.no",
		reversed: "on.drojfavk"
	},
	{
		suffix: "kvalsund.no",
		reversed: "on.dnuslavk"
	},
	{
		suffix: "kvam.no",
		reversed: "on.mavk"
	},
	{
		suffix: "kvanangen.no",
		reversed: "on.negnanavk"
	},
	{
		suffix: "kvinesdal.no",
		reversed: "on.ladsenivk"
	},
	{
		suffix: "kvinnherad.no",
		reversed: "on.darehnnivk"
	},
	{
		suffix: "kviteseid.no",
		reversed: "on.diesetivk"
	},
	{
		suffix: "kvitsoy.no",
		reversed: "on.yostivk"
	},
	{
		suffix: "kvitsøy.no",
		reversed: "on.ayf-ystivk--nx"
	},
	{
		suffix: "kvæfjord.no",
		reversed: "on.axn-drojfvk--nx"
	},
	{
		suffix: "kvænangen.no",
		reversed: "on.a0k-negnanvk--nx"
	},
	{
		suffix: "kw",
		reversed: "wk"
	},
	{
		suffix: "kwp.gov.pl",
		reversed: "lp.vog.pwk"
	},
	{
		suffix: "kwpsp.gov.pl",
		reversed: "lp.vog.pspwk"
	},
	{
		suffix: "ky",
		reversed: "yk"
	},
	{
		suffix: "ky.us",
		reversed: "su.yk"
	},
	{
		suffix: "kyiv.ua",
		reversed: "au.viyk"
	},
	{
		suffix: "kyonan.chiba.jp",
		reversed: "pj.abihc.nanoyk"
	},
	{
		suffix: "kyotamba.kyoto.jp",
		reversed: "pj.otoyk.abmatoyk"
	},
	{
		suffix: "kyotanabe.kyoto.jp",
		reversed: "pj.otoyk.ebanatoyk"
	},
	{
		suffix: "kyotango.kyoto.jp",
		reversed: "pj.otoyk.ognatoyk"
	},
	{
		suffix: "kyoto",
		reversed: "otoyk"
	},
	{
		suffix: "kyoto.jp",
		reversed: "pj.otoyk"
	},
	{
		suffix: "kyowa.akita.jp",
		reversed: "pj.atika.awoyk"
	},
	{
		suffix: "kyowa.hokkaido.jp",
		reversed: "pj.odiakkoh.awoyk"
	},
	{
		suffix: "kyuragi.saga.jp",
		reversed: "pj.agas.igaruyk"
	},
	{
		suffix: "kz",
		reversed: "zk"
	},
	{
		suffix: "kárášjohka.no",
		reversed: "on.j94bawh-akhojrk--nx"
	},
	{
		suffix: "kåfjord.no",
		reversed: "on.aui-drojfk--nx"
	},
	{
		suffix: "l-o-g-i-n.de",
		reversed: "ed.n-i-g-o-l"
	},
	{
		suffix: "l.bg",
		reversed: "gb.l"
	},
	{
		suffix: "l.se",
		reversed: "es.l"
	},
	{
		suffix: "la",
		reversed: "al"
	},
	{
		suffix: "la-spezia.it",
		reversed: "ti.aizeps-al"
	},
	{
		suffix: "la.us",
		reversed: "su.al"
	},
	{
		suffix: "laakesvuemie.no",
		reversed: "on.eimeuvsekaal"
	},
	{
		suffix: "lab.ms",
		reversed: "sm.bal"
	},
	{
		suffix: "labor.museum",
		reversed: "muesum.robal"
	},
	{
		suffix: "labour.museum",
		reversed: "muesum.ruobal"
	},
	{
		suffix: "lacaixa",
		reversed: "axiacal"
	},
	{
		suffix: "lahppi.no",
		reversed: "on.ipphal"
	},
	{
		suffix: "lajolla.museum",
		reversed: "muesum.allojal"
	},
	{
		suffix: "lakas.hu",
		reversed: "uh.sakal"
	},
	{
		suffix: "lamborghini",
		reversed: "inihgrobmal"
	},
	{
		suffix: "lamer",
		reversed: "remal"
	},
	{
		suffix: "lanbib.se",
		reversed: "es.bibnal"
	},
	{
		suffix: "lancashire.museum",
		reversed: "muesum.erihsacnal"
	},
	{
		suffix: "lancaster",
		reversed: "retsacnal"
	},
	{
		suffix: "lancia",
		reversed: "aicnal"
	},
	{
		suffix: "land",
		reversed: "dnal"
	},
	{
		suffix: "land-4-sale.us",
		reversed: "su.elas-4-dnal"
	},
	{
		suffix: "landes.museum",
		reversed: "muesum.sednal"
	},
	{
		suffix: "landrover",
		reversed: "revordnal"
	},
	{
		suffix: "langevag.no",
		reversed: "on.gavegnal"
	},
	{
		suffix: "langevåg.no",
		reversed: "on.axj-gvegnal--nx"
	},
	{
		suffix: "lans.museum",
		reversed: "muesum.snal"
	},
	{
		suffix: "lanxess",
		reversed: "ssexnal"
	},
	{
		suffix: "lapy.pl",
		reversed: "lp.ypal"
	},
	{
		suffix: "laquila.it",
		reversed: "ti.aliuqal"
	},
	{
		suffix: "lardal.no",
		reversed: "on.ladral"
	},
	{
		suffix: "larsson.museum",
		reversed: "muesum.nossral"
	},
	{
		suffix: "larvik.no",
		reversed: "on.kivral"
	},
	{
		suffix: "lasalle",
		reversed: "ellasal"
	},
	{
		suffix: "laspezia.it",
		reversed: "ti.aizepsal"
	},
	{
		suffix: "lat",
		reversed: "tal"
	},
	{
		suffix: "latina.it",
		reversed: "ti.anital"
	},
	{
		suffix: "latino",
		reversed: "onital"
	},
	{
		suffix: "latrobe",
		reversed: "ebortal"
	},
	{
		suffix: "lavagis.no",
		reversed: "on.sigaval"
	},
	{
		suffix: "lavangen.no",
		reversed: "on.negnaval"
	},
	{
		suffix: "law",
		reversed: "wal"
	},
	{
		suffix: "law.pro",
		reversed: "orp.wal"
	},
	{
		suffix: "law.za",
		reversed: "az.wal"
	},
	{
		suffix: "lawyer",
		reversed: "reywal"
	},
	{
		suffix: "laz.it",
		reversed: "ti.zal"
	},
	{
		suffix: "lazio.it",
		reversed: "ti.oizal"
	},
	{
		suffix: "lb",
		reversed: "bl"
	},
	{
		suffix: "lc",
		reversed: "cl"
	},
	{
		suffix: "lc.it",
		reversed: "ti.cl"
	},
	{
		suffix: "lcube-server.de",
		reversed: "ed.revres-ebucl"
	},
	{
		suffix: "lds",
		reversed: "sdl"
	},
	{
		suffix: "le.it",
		reversed: "ti.el"
	},
	{
		suffix: "leadpages.co",
		reversed: "oc.segapdael"
	},
	{
		suffix: "leangaviika.no",
		reversed: "on.akiivagnael"
	},
	{
		suffix: "lease",
		reversed: "esael"
	},
	{
		suffix: "leasing.aero",
		reversed: "orea.gnisael"
	},
	{
		suffix: "leaŋgaviika.no",
		reversed: "on.b25-akiivagael--nx"
	},
	{
		suffix: "lebesby.no",
		reversed: "on.ybsebel"
	},
	{
		suffix: "lebork.pl",
		reversed: "lp.krobel"
	},
	{
		suffix: "lebtimnetz.de",
		reversed: "ed.ztenmitbel"
	},
	{
		suffix: "lecce.it",
		reversed: "ti.eccel"
	},
	{
		suffix: "lecco.it",
		reversed: "ti.occel"
	},
	{
		suffix: "leclerc",
		reversed: "crelcel"
	},
	{
		suffix: "leczna.pl",
		reversed: "lp.anzcel"
	},
	{
		suffix: "lefrak",
		reversed: "karfel"
	},
	{
		suffix: "leg.br",
		reversed: "rb.gel"
	},
	{
		suffix: "legal",
		reversed: "lagel"
	},
	{
		suffix: "legnica.pl",
		reversed: "lp.acingel"
	},
	{
		suffix: "lego",
		reversed: "ogel"
	},
	{
		suffix: "leikanger.no",
		reversed: "on.regnakiel"
	},
	{
		suffix: "leirfjord.no",
		reversed: "on.drojfriel"
	},
	{
		suffix: "leirvik.no",
		reversed: "on.kivriel"
	},
	{
		suffix: "leitungsen.de",
		reversed: "ed.nesgnutiel"
	},
	{
		suffix: "leka.no",
		reversed: "on.akel"
	},
	{
		suffix: "leksvik.no",
		reversed: "on.kivskel"
	},
	{
		suffix: "lel.br",
		reversed: "rb.lel"
	},
	{
		suffix: "lelux.site",
		reversed: "etis.xulel"
	},
	{
		suffix: "lenug.su",
		reversed: "us.gunel"
	},
	{
		suffix: "lenvik.no",
		reversed: "on.kivnel"
	},
	{
		suffix: "lerdal.no",
		reversed: "on.ladrel"
	},
	{
		suffix: "lesja.no",
		reversed: "on.ajsel"
	},
	{
		suffix: "levanger.no",
		reversed: "on.regnavel"
	},
	{
		suffix: "lewismiller.museum",
		reversed: "muesum.rellimsiwel"
	},
	{
		suffix: "lexus",
		reversed: "suxel"
	},
	{
		suffix: "lezajsk.pl",
		reversed: "lp.ksjazel"
	},
	{
		suffix: "lg.jp",
		reversed: "pj.gl"
	},
	{
		suffix: "lg.ua",
		reversed: "au.gl"
	},
	{
		suffix: "lgbt",
		reversed: "tbgl"
	},
	{
		suffix: "li",
		reversed: "il"
	},
	{
		suffix: "li.it",
		reversed: "ti.il"
	},
	{
		suffix: "lib.ak.us",
		reversed: "su.ka.bil"
	},
	{
		suffix: "lib.al.us",
		reversed: "su.la.bil"
	},
	{
		suffix: "lib.ar.us",
		reversed: "su.ra.bil"
	},
	{
		suffix: "lib.as.us",
		reversed: "su.sa.bil"
	},
	{
		suffix: "lib.az.us",
		reversed: "su.za.bil"
	},
	{
		suffix: "lib.ca.us",
		reversed: "su.ac.bil"
	},
	{
		suffix: "lib.co.us",
		reversed: "su.oc.bil"
	},
	{
		suffix: "lib.ct.us",
		reversed: "su.tc.bil"
	},
	{
		suffix: "lib.dc.us",
		reversed: "su.cd.bil"
	},
	{
		suffix: "lib.de.us",
		reversed: "su.ed.bil"
	},
	{
		suffix: "lib.ee",
		reversed: "ee.bil"
	},
	{
		suffix: "lib.fl.us",
		reversed: "su.lf.bil"
	},
	{
		suffix: "lib.ga.us",
		reversed: "su.ag.bil"
	},
	{
		suffix: "lib.gu.us",
		reversed: "su.ug.bil"
	},
	{
		suffix: "lib.hi.us",
		reversed: "su.ih.bil"
	},
	{
		suffix: "lib.ia.us",
		reversed: "su.ai.bil"
	},
	{
		suffix: "lib.id.us",
		reversed: "su.di.bil"
	},
	{
		suffix: "lib.il.us",
		reversed: "su.li.bil"
	},
	{
		suffix: "lib.in.us",
		reversed: "su.ni.bil"
	},
	{
		suffix: "lib.ks.us",
		reversed: "su.sk.bil"
	},
	{
		suffix: "lib.ky.us",
		reversed: "su.yk.bil"
	},
	{
		suffix: "lib.la.us",
		reversed: "su.al.bil"
	},
	{
		suffix: "lib.ma.us",
		reversed: "su.am.bil"
	},
	{
		suffix: "lib.md.us",
		reversed: "su.dm.bil"
	},
	{
		suffix: "lib.me.us",
		reversed: "su.em.bil"
	},
	{
		suffix: "lib.mi.us",
		reversed: "su.im.bil"
	},
	{
		suffix: "lib.mn.us",
		reversed: "su.nm.bil"
	},
	{
		suffix: "lib.mo.us",
		reversed: "su.om.bil"
	},
	{
		suffix: "lib.ms.us",
		reversed: "su.sm.bil"
	},
	{
		suffix: "lib.mt.us",
		reversed: "su.tm.bil"
	},
	{
		suffix: "lib.nc.us",
		reversed: "su.cn.bil"
	},
	{
		suffix: "lib.nd.us",
		reversed: "su.dn.bil"
	},
	{
		suffix: "lib.ne.us",
		reversed: "su.en.bil"
	},
	{
		suffix: "lib.nh.us",
		reversed: "su.hn.bil"
	},
	{
		suffix: "lib.nj.us",
		reversed: "su.jn.bil"
	},
	{
		suffix: "lib.nm.us",
		reversed: "su.mn.bil"
	},
	{
		suffix: "lib.nv.us",
		reversed: "su.vn.bil"
	},
	{
		suffix: "lib.ny.us",
		reversed: "su.yn.bil"
	},
	{
		suffix: "lib.oh.us",
		reversed: "su.ho.bil"
	},
	{
		suffix: "lib.ok.us",
		reversed: "su.ko.bil"
	},
	{
		suffix: "lib.or.us",
		reversed: "su.ro.bil"
	},
	{
		suffix: "lib.pa.us",
		reversed: "su.ap.bil"
	},
	{
		suffix: "lib.pr.us",
		reversed: "su.rp.bil"
	},
	{
		suffix: "lib.ri.us",
		reversed: "su.ir.bil"
	},
	{
		suffix: "lib.sc.us",
		reversed: "su.cs.bil"
	},
	{
		suffix: "lib.sd.us",
		reversed: "su.ds.bil"
	},
	{
		suffix: "lib.tn.us",
		reversed: "su.nt.bil"
	},
	{
		suffix: "lib.tx.us",
		reversed: "su.xt.bil"
	},
	{
		suffix: "lib.ut.us",
		reversed: "su.tu.bil"
	},
	{
		suffix: "lib.va.us",
		reversed: "su.av.bil"
	},
	{
		suffix: "lib.vi.us",
		reversed: "su.iv.bil"
	},
	{
		suffix: "lib.vt.us",
		reversed: "su.tv.bil"
	},
	{
		suffix: "lib.wa.us",
		reversed: "su.aw.bil"
	},
	{
		suffix: "lib.wi.us",
		reversed: "su.iw.bil"
	},
	{
		suffix: "lib.wy.us",
		reversed: "su.yw.bil"
	},
	{
		suffix: "lidl",
		reversed: "ldil"
	},
	{
		suffix: "lier.no",
		reversed: "on.reil"
	},
	{
		suffix: "lierne.no",
		reversed: "on.enreil"
	},
	{
		suffix: "life",
		reversed: "efil"
	},
	{
		suffix: "lifeinsurance",
		reversed: "ecnarusniefil"
	},
	{
		suffix: "lifestyle",
		reversed: "elytsefil"
	},
	{
		suffix: "lig.it",
		reversed: "ti.gil"
	},
	{
		suffix: "lighting",
		reversed: "gnithgil"
	},
	{
		suffix: "liguria.it",
		reversed: "ti.airugil"
	},
	{
		suffix: "like",
		reversed: "ekil"
	},
	{
		suffix: "likes-pie.com",
		reversed: "moc.eip-sekil"
	},
	{
		suffix: "likescandy.com",
		reversed: "moc.ydnacsekil"
	},
	{
		suffix: "lillehammer.no",
		reversed: "on.remmahellil"
	},
	{
		suffix: "lillesand.no",
		reversed: "on.dnasellil"
	},
	{
		suffix: "lilly",
		reversed: "yllil"
	},
	{
		suffix: "lima-city.at",
		reversed: "ta.ytic-amil"
	},
	{
		suffix: "lima-city.ch",
		reversed: "hc.ytic-amil"
	},
	{
		suffix: "lima-city.de",
		reversed: "ed.ytic-amil"
	},
	{
		suffix: "lima-city.rocks",
		reversed: "skcor.ytic-amil"
	},
	{
		suffix: "lima.zone",
		reversed: "enoz.amil"
	},
	{
		suffix: "limanowa.pl",
		reversed: "lp.awonamil"
	},
	{
		suffix: "limited",
		reversed: "detimil"
	},
	{
		suffix: "limo",
		reversed: "omil"
	},
	{
		suffix: "lincoln",
		reversed: "nlocnil"
	},
	{
		suffix: "lincoln.museum",
		reversed: "muesum.nlocnil"
	},
	{
		suffix: "lindas.no",
		reversed: "on.sadnil"
	},
	{
		suffix: "linde",
		reversed: "ednil"
	},
	{
		suffix: "lindesnes.no",
		reversed: "on.sensednil"
	},
	{
		suffix: "lindås.no",
		reversed: "on.arp-sdnil--nx"
	},
	{
		suffix: "link",
		reversed: "knil"
	},
	{
		suffix: "linkyard-cloud.ch",
		reversed: "hc.duolc-drayknil"
	},
	{
		suffix: "linkyard.cloud",
		reversed: "duolc.drayknil"
	},
	{
		suffix: "linz.museum",
		reversed: "muesum.znil"
	},
	{
		suffix: "lipsy",
		reversed: "yspil"
	},
	{
		suffix: "littlestar.jp",
		reversed: "pj.ratselttil"
	},
	{
		suffix: "live",
		reversed: "evil"
	},
	{
		suffix: "living",
		reversed: "gnivil"
	},
	{
		suffix: "living.museum",
		reversed: "muesum.gnivil"
	},
	{
		suffix: "livinghistory.museum",
		reversed: "muesum.yrotsihgnivil"
	},
	{
		suffix: "livorno.it",
		reversed: "ti.onrovil"
	},
	{
		suffix: "lk",
		reversed: "kl"
	},
	{
		suffix: "lk3.ru",
		reversed: "ur.3kl"
	},
	{
		suffix: "llc",
		reversed: "cll"
	},
	{
		suffix: "llp",
		reversed: "pll"
	},
	{
		suffix: "ln.cn",
		reversed: "nc.nl"
	},
	{
		suffix: "lo.it",
		reversed: "ti.ol"
	},
	{
		suffix: "loabat.no",
		reversed: "on.tabaol"
	},
	{
		suffix: "loabát.no",
		reversed: "on.aq0-tbaol--nx"
	},
	{
		suffix: "loan",
		reversed: "naol"
	},
	{
		suffix: "loans",
		reversed: "snaol"
	},
	{
		suffix: "localhistory.museum",
		reversed: "muesum.yrotsihlacol"
	},
	{
		suffix: "localhost.daplie.me",
		reversed: "em.eilpad.tsohlacol"
	},
	{
		suffix: "localzone.xyz",
		reversed: "zyx.enozlacol"
	},
	{
		suffix: "locker",
		reversed: "rekcol"
	},
	{
		suffix: "locus",
		reversed: "sucol"
	},
	{
		suffix: "lodi.it",
		reversed: "ti.idol"
	},
	{
		suffix: "lodingen.no",
		reversed: "on.negnidol"
	},
	{
		suffix: "loft",
		reversed: "tfol"
	},
	{
		suffix: "log.br",
		reversed: "rb.gol"
	},
	{
		suffix: "loginline.app",
		reversed: "ppa.enilnigol"
	},
	{
		suffix: "loginline.dev",
		reversed: "ved.enilnigol"
	},
	{
		suffix: "loginline.io",
		reversed: "oi.enilnigol"
	},
	{
		suffix: "loginline.services",
		reversed: "secivres.enilnigol"
	},
	{
		suffix: "loginline.site",
		reversed: "etis.enilnigol"
	},
	{
		suffix: "loginto.me",
		reversed: "em.otnigol"
	},
	{
		suffix: "logistics.aero",
		reversed: "orea.scitsigol"
	},
	{
		suffix: "logoip.com",
		reversed: "moc.piogol"
	},
	{
		suffix: "logoip.de",
		reversed: "ed.piogol"
	},
	{
		suffix: "lohmus.me",
		reversed: "em.sumhol"
	},
	{
		suffix: "lol",
		reversed: "lol"
	},
	{
		suffix: "lolipop.io",
		reversed: "oi.popilol"
	},
	{
		suffix: "lolipopmc.jp",
		reversed: "pj.cmpopilol"
	},
	{
		suffix: "lolitapunk.jp",
		reversed: "pj.knupatilol"
	},
	{
		suffix: "lom.it",
		reversed: "ti.mol"
	},
	{
		suffix: "lom.no",
		reversed: "on.mol"
	},
	{
		suffix: "lombardia.it",
		reversed: "ti.aidrabmol"
	},
	{
		suffix: "lombardy.it",
		reversed: "ti.ydrabmol"
	},
	{
		suffix: "lomo.jp",
		reversed: "pj.omol"
	},
	{
		suffix: "lomza.pl",
		reversed: "lp.azmol"
	},
	{
		suffix: "lon-1.paas.massivegrid.net",
		reversed: "ten.dirgevissam.saap.1-nol"
	},
	{
		suffix: "lon-2.paas.massivegrid.net",
		reversed: "ten.dirgevissam.saap.2-nol"
	},
	{
		suffix: "lon.wafaicloud.com",
		reversed: "moc.duolciafaw.nol"
	},
	{
		suffix: "london",
		reversed: "nodnol"
	},
	{
		suffix: "london.cloudapps.digital",
		reversed: "latigid.sppaduolc.nodnol"
	},
	{
		suffix: "london.museum",
		reversed: "muesum.nodnol"
	},
	{
		suffix: "londrina.br",
		reversed: "rb.anirdnol"
	},
	{
		suffix: "loppa.no",
		reversed: "on.appol"
	},
	{
		suffix: "lorenskog.no",
		reversed: "on.goksnerol"
	},
	{
		suffix: "losangeles.museum",
		reversed: "muesum.selegnasol"
	},
	{
		suffix: "loseyourip.com",
		reversed: "moc.piruoyesol"
	},
	{
		suffix: "loten.no",
		reversed: "on.netol"
	},
	{
		suffix: "lotte",
		reversed: "ettol"
	},
	{
		suffix: "lotto",
		reversed: "ottol"
	},
	{
		suffix: "louvre.museum",
		reversed: "muesum.ervuol"
	},
	{
		suffix: "love",
		reversed: "evol"
	},
	{
		suffix: "lovepop.jp",
		reversed: "pj.popevol"
	},
	{
		suffix: "lovesick.jp",
		reversed: "pj.kcisevol"
	},
	{
		suffix: "lowicz.pl",
		reversed: "lp.zciwol"
	},
	{
		suffix: "loyalist.museum",
		reversed: "muesum.tsilayol"
	},
	{
		suffix: "lpages.co",
		reversed: "oc.segapl"
	},
	{
		suffix: "lpl",
		reversed: "lpl"
	},
	{
		suffix: "lplfinancial",
		reversed: "laicnaniflpl"
	},
	{
		suffix: "lpusercontent.com",
		reversed: "moc.tnetnocresupl"
	},
	{
		suffix: "lr",
		reversed: "rl"
	},
	{
		suffix: "ls",
		reversed: "sl"
	},
	{
		suffix: "lt",
		reversed: "tl"
	},
	{
		suffix: "lt.eu.org",
		reversed: "gro.ue.tl"
	},
	{
		suffix: "lt.it",
		reversed: "ti.tl"
	},
	{
		suffix: "lt.ua",
		reversed: "au.tl"
	},
	{
		suffix: "ltd",
		reversed: "dtl"
	},
	{
		suffix: "ltd.co.im",
		reversed: "mi.oc.dtl"
	},
	{
		suffix: "ltd.cy",
		reversed: "yc.dtl"
	},
	{
		suffix: "ltd.gi",
		reversed: "ig.dtl"
	},
	{
		suffix: "ltd.hk",
		reversed: "kh.dtl"
	},
	{
		suffix: "ltd.lk",
		reversed: "kl.dtl"
	},
	{
		suffix: "ltd.ng",
		reversed: "gn.dtl"
	},
	{
		suffix: "ltd.ua",
		reversed: "au.dtl"
	},
	{
		suffix: "ltd.uk",
		reversed: "ku.dtl"
	},
	{
		suffix: "ltda",
		reversed: "adtl"
	},
	{
		suffix: "lu",
		reversed: "ul"
	},
	{
		suffix: "lu.eu.org",
		reversed: "gro.ue.ul"
	},
	{
		suffix: "lu.it",
		reversed: "ti.ul"
	},
	{
		suffix: "lubartow.pl",
		reversed: "lp.wotrabul"
	},
	{
		suffix: "lubin.pl",
		reversed: "lp.nibul"
	},
	{
		suffix: "lublin.pl",
		reversed: "lp.nilbul"
	},
	{
		suffix: "lucania.it",
		reversed: "ti.ainacul"
	},
	{
		suffix: "lucca.it",
		reversed: "ti.accul"
	},
	{
		suffix: "lucerne.museum",
		reversed: "muesum.enrecul"
	},
	{
		suffix: "lug.org.uk",
		reversed: "ku.gro.gul"
	},
	{
		suffix: "lugansk.ua",
		reversed: "au.ksnagul"
	},
	{
		suffix: "lugs.org.uk",
		reversed: "ku.gro.sgul"
	},
	{
		suffix: "lukow.pl",
		reversed: "lp.wokul"
	},
	{
		suffix: "lund.no",
		reversed: "on.dnul"
	},
	{
		suffix: "lundbeck",
		reversed: "kcebdnul"
	},
	{
		suffix: "lunner.no",
		reversed: "on.rennul"
	},
	{
		suffix: "luroy.no",
		reversed: "on.yorul"
	},
	{
		suffix: "lurøy.no",
		reversed: "on.ari-yrul--nx"
	},
	{
		suffix: "luster.no",
		reversed: "on.retsul"
	},
	{
		suffix: "lutsk.ua",
		reversed: "au.kstul"
	},
	{
		suffix: "luxe",
		reversed: "exul"
	},
	{
		suffix: "luxembourg.museum",
		reversed: "muesum.gruobmexul"
	},
	{
		suffix: "luxury",
		reversed: "yruxul"
	},
	{
		suffix: "luzern.museum",
		reversed: "muesum.nrezul"
	},
	{
		suffix: "lv",
		reversed: "vl"
	},
	{
		suffix: "lv.eu.org",
		reversed: "gro.ue.vl"
	},
	{
		suffix: "lv.ua",
		reversed: "au.vl"
	},
	{
		suffix: "lviv.ua",
		reversed: "au.vivl"
	},
	{
		suffix: "ly",
		reversed: "yl"
	},
	{
		suffix: "lyngdal.no",
		reversed: "on.ladgnyl"
	},
	{
		suffix: "lyngen.no",
		reversed: "on.negnyl"
	},
	{
		suffix: "lynx.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.xnyl"
	},
	{
		suffix: "láhppi.no",
		reversed: "on.aqx-ipphl--nx"
	},
	{
		suffix: "läns.museum",
		reversed: "muesum.alq-snl--nx"
	},
	{
		suffix: "lærdal.no",
		reversed: "on.ars-ladrl--nx"
	},
	{
		suffix: "lødingen.no",
		reversed: "on.a1q-negnidl--nx"
	},
	{
		suffix: "lørenskog.no",
		reversed: "on.a45-goksnerl--nx"
	},
	{
		suffix: "løten.no",
		reversed: "on.arg-netl--nx"
	},
	{
		suffix: "m.bg",
		reversed: "gb.m"
	},
	{
		suffix: "m.se",
		reversed: "es.m"
	},
	{
		suffix: "ma",
		reversed: "am"
	},
	{
		suffix: "ma.gov.br",
		reversed: "rb.vog.am"
	},
	{
		suffix: "ma.leg.br",
		reversed: "rb.gel.am"
	},
	{
		suffix: "ma.us",
		reversed: "su.am"
	},
	{
		suffix: "macapa.br",
		reversed: "rb.apacam"
	},
	{
		suffix: "maceio.br",
		reversed: "rb.oiecam"
	},
	{
		suffix: "macerata.it",
		reversed: "ti.atarecam"
	},
	{
		suffix: "machida.tokyo.jp",
		reversed: "pj.oykot.adihcam"
	},
	{
		suffix: "macys",
		reversed: "sycam"
	},
	{
		suffix: "mad.museum",
		reversed: "muesum.dam"
	},
	{
		suffix: "madrid",
		reversed: "dirdam"
	},
	{
		suffix: "madrid.museum",
		reversed: "muesum.dirdam"
	},
	{
		suffix: "maebashi.gunma.jp",
		reversed: "pj.amnug.ihsabeam"
	},
	{
		suffix: "magazine.aero",
		reversed: "orea.enizagam"
	},
	{
		suffix: "magnet.page",
		reversed: "egap.tengam"
	},
	{
		suffix: "maibara.shiga.jp",
		reversed: "pj.agihs.arabiam"
	},
	{
		suffix: "maif",
		reversed: "fiam"
	},
	{
		suffix: "mail.pl",
		reversed: "lp.liam"
	},
	{
		suffix: "main.jp",
		reversed: "pj.niam"
	},
	{
		suffix: "maintenance.aero",
		reversed: "orea.ecnanetniam"
	},
	{
		suffix: "maison",
		reversed: "nosiam"
	},
	{
		suffix: "maizuru.kyoto.jp",
		reversed: "pj.otoyk.uruziam"
	},
	{
		suffix: "makeup",
		reversed: "puekam"
	},
	{
		suffix: "makinohara.shizuoka.jp",
		reversed: "pj.akouzihs.arahonikam"
	},
	{
		suffix: "makurazaki.kagoshima.jp",
		reversed: "pj.amihsogak.ikazarukam"
	},
	{
		suffix: "malatvuopmi.no",
		reversed: "on.impouvtalam"
	},
	{
		suffix: "malbork.pl",
		reversed: "lp.kroblam"
	},
	{
		suffix: "mallorca.museum",
		reversed: "muesum.acrollam"
	},
	{
		suffix: "malopolska.pl",
		reversed: "lp.akslopolam"
	},
	{
		suffix: "malselv.no",
		reversed: "on.vleslam"
	},
	{
		suffix: "malvik.no",
		reversed: "on.kivlam"
	},
	{
		suffix: "mamurogawa.yamagata.jp",
		reversed: "pj.atagamay.awagorumam"
	},
	{
		suffix: "man",
		reversed: "nam"
	},
	{
		suffix: "management",
		reversed: "tnemeganam"
	},
	{
		suffix: "manaus.br",
		reversed: "rb.suanam"
	},
	{
		suffix: "manchester.museum",
		reversed: "muesum.retsehcnam"
	},
	{
		suffix: "mandal.no",
		reversed: "on.ladnam"
	},
	{
		suffix: "mango",
		reversed: "ognam"
	},
	{
		suffix: "mangyshlak.su",
		reversed: "us.kalhsygnam"
	},
	{
		suffix: "maniwa.okayama.jp",
		reversed: "pj.amayako.awinam"
	},
	{
		suffix: "manno.kagawa.jp",
		reversed: "pj.awagak.onnam"
	},
	{
		suffix: "mansion.museum",
		reversed: "muesum.noisnam"
	},
	{
		suffix: "mansions.museum",
		reversed: "muesum.snoisnam"
	},
	{
		suffix: "mantova.it",
		reversed: "ti.avotnam"
	},
	{
		suffix: "manx.museum",
		reversed: "muesum.xnam"
	},
	{
		suffix: "maori.nz",
		reversed: "zn.iroam"
	},
	{
		suffix: "map",
		reversed: "pam"
	},
	{
		suffix: "map.fastly.net",
		reversed: "ten.yltsaf.pam"
	},
	{
		suffix: "map.fastlylb.net",
		reversed: "ten.blyltsaf.pam"
	},
	{
		suffix: "mar.it",
		reversed: "ti.ram"
	},
	{
		suffix: "marburg.museum",
		reversed: "muesum.grubram"
	},
	{
		suffix: "marche.it",
		reversed: "ti.ehcram"
	},
	{
		suffix: "marine.ru",
		reversed: "ur.eniram"
	},
	{
		suffix: "maringa.br",
		reversed: "rb.agniram"
	},
	{
		suffix: "maritime.museum",
		reversed: "muesum.emitiram"
	},
	{
		suffix: "maritimo.museum",
		reversed: "muesum.omitiram"
	},
	{
		suffix: "marker.no",
		reversed: "on.rekram"
	},
	{
		suffix: "market",
		reversed: "tekram"
	},
	{
		suffix: "marketing",
		reversed: "gnitekram"
	},
	{
		suffix: "markets",
		reversed: "stekram"
	},
	{
		suffix: "marnardal.no",
		reversed: "on.ladranram"
	},
	{
		suffix: "marriott",
		reversed: "ttoirram"
	},
	{
		suffix: "marshalls",
		reversed: "sllahsram"
	},
	{
		suffix: "marugame.kagawa.jp",
		reversed: "pj.awagak.emaguram"
	},
	{
		suffix: "marumori.miyagi.jp",
		reversed: "pj.igayim.iromuram"
	},
	{
		suffix: "maryland.museum",
		reversed: "muesum.dnalyram"
	},
	{
		suffix: "marylhurst.museum",
		reversed: "muesum.tsruhlyram"
	},
	{
		suffix: "masaki.ehime.jp",
		reversed: "pj.emihe.ikasam"
	},
	{
		suffix: "maserati",
		reversed: "itaresam"
	},
	{
		suffix: "masfjorden.no",
		reversed: "on.nedrojfsam"
	},
	{
		suffix: "mashike.hokkaido.jp",
		reversed: "pj.odiakkoh.ekihsam"
	},
	{
		suffix: "mashiki.kumamoto.jp",
		reversed: "pj.otomamuk.ikihsam"
	},
	{
		suffix: "mashiko.tochigi.jp",
		reversed: "pj.igihcot.okihsam"
	},
	{
		suffix: "masoy.no",
		reversed: "on.yosam"
	},
	{
		suffix: "massa-carrara.it",
		reversed: "ti.ararrac-assam"
	},
	{
		suffix: "massacarrara.it",
		reversed: "ti.ararracassam"
	},
	{
		suffix: "masuda.shimane.jp",
		reversed: "pj.enamihs.adusam"
	},
	{
		suffix: "mat.br",
		reversed: "rb.tam"
	},
	{
		suffix: "matera.it",
		reversed: "ti.aretam"
	},
	{
		suffix: "matsubara.osaka.jp",
		reversed: "pj.akaso.arabustam"
	},
	{
		suffix: "matsubushi.saitama.jp",
		reversed: "pj.amatias.ihsubustam"
	},
	{
		suffix: "matsuda.kanagawa.jp",
		reversed: "pj.awaganak.adustam"
	},
	{
		suffix: "matsudo.chiba.jp",
		reversed: "pj.abihc.odustam"
	},
	{
		suffix: "matsue.shimane.jp",
		reversed: "pj.enamihs.eustam"
	},
	{
		suffix: "matsukawa.nagano.jp",
		reversed: "pj.onagan.awakustam"
	},
	{
		suffix: "matsumae.hokkaido.jp",
		reversed: "pj.odiakkoh.eamustam"
	},
	{
		suffix: "matsumoto.kagoshima.jp",
		reversed: "pj.amihsogak.otomustam"
	},
	{
		suffix: "matsumoto.nagano.jp",
		reversed: "pj.onagan.otomustam"
	},
	{
		suffix: "matsuno.ehime.jp",
		reversed: "pj.emihe.onustam"
	},
	{
		suffix: "matsusaka.mie.jp",
		reversed: "pj.eim.akasustam"
	},
	{
		suffix: "matsushige.tokushima.jp",
		reversed: "pj.amihsukot.egihsustam"
	},
	{
		suffix: "matsushima.miyagi.jp",
		reversed: "pj.igayim.amihsustam"
	},
	{
		suffix: "matsuura.nagasaki.jp",
		reversed: "pj.ikasagan.aruustam"
	},
	{
		suffix: "matsuyama.ehime.jp",
		reversed: "pj.emihe.amayustam"
	},
	{
		suffix: "matsuzaki.shizuoka.jp",
		reversed: "pj.akouzihs.ikazustam"
	},
	{
		suffix: "matta-varjjat.no",
		reversed: "on.tajjrav-attam"
	},
	{
		suffix: "mattel",
		reversed: "lettam"
	},
	{
		suffix: "mayfirst.info",
		reversed: "ofni.tsrifyam"
	},
	{
		suffix: "mayfirst.org",
		reversed: "gro.tsrifyam"
	},
	{
		suffix: "mazeplay.com",
		reversed: "moc.yalpezam"
	},
	{
		suffix: "mazowsze.pl",
		reversed: "lp.ezswozam"
	},
	{
		suffix: "mazury.pl",
		reversed: "lp.yruzam"
	},
	{
		suffix: "mb.ca",
		reversed: "ac.bm"
	},
	{
		suffix: "mb.it",
		reversed: "ti.bm"
	},
	{
		suffix: "mba",
		reversed: "abm"
	},
	{
		suffix: "mc",
		reversed: "cm"
	},
	{
		suffix: "mc.ax",
		reversed: "xa.cm"
	},
	{
		suffix: "mc.eu.org",
		reversed: "gro.ue.cm"
	},
	{
		suffix: "mc.it",
		reversed: "ti.cm"
	},
	{
		suffix: "mcdir.me",
		reversed: "em.ridcm"
	},
	{
		suffix: "mcdir.ru",
		reversed: "ur.ridcm"
	},
	{
		suffix: "mckinsey",
		reversed: "yesnikcm"
	},
	{
		suffix: "mcpe.me",
		reversed: "em.epcm"
	},
	{
		suffix: "mcpre.ru",
		reversed: "ur.erpcm"
	},
	{
		suffix: "md",
		reversed: "dm"
	},
	{
		suffix: "md.ci",
		reversed: "ic.dm"
	},
	{
		suffix: "md.us",
		reversed: "su.dm"
	},
	{
		suffix: "me",
		reversed: "em"
	},
	{
		suffix: "me.eu.org",
		reversed: "gro.ue.em"
	},
	{
		suffix: "me.in",
		reversed: "ni.em"
	},
	{
		suffix: "me.it",
		reversed: "ti.em"
	},
	{
		suffix: "me.ke",
		reversed: "ek.em"
	},
	{
		suffix: "me.so",
		reversed: "os.em"
	},
	{
		suffix: "me.ss",
		reversed: "ss.em"
	},
	{
		suffix: "me.tc",
		reversed: "ct.em"
	},
	{
		suffix: "me.tz",
		reversed: "zt.em"
	},
	{
		suffix: "me.uk",
		reversed: "ku.em"
	},
	{
		suffix: "me.us",
		reversed: "su.em"
	},
	{
		suffix: "me.vu",
		reversed: "uv.em"
	},
	{
		suffix: "med",
		reversed: "dem"
	},
	{
		suffix: "med.br",
		reversed: "rb.dem"
	},
	{
		suffix: "med.ec",
		reversed: "ce.dem"
	},
	{
		suffix: "med.ee",
		reversed: "ee.dem"
	},
	{
		suffix: "med.ht",
		reversed: "th.dem"
	},
	{
		suffix: "med.ly",
		reversed: "yl.dem"
	},
	{
		suffix: "med.om",
		reversed: "mo.dem"
	},
	{
		suffix: "med.pa",
		reversed: "ap.dem"
	},
	{
		suffix: "med.pl",
		reversed: "lp.dem"
	},
	{
		suffix: "med.pro",
		reversed: "orp.dem"
	},
	{
		suffix: "med.sa",
		reversed: "as.dem"
	},
	{
		suffix: "med.sd",
		reversed: "ds.dem"
	},
	{
		suffix: "medecin.fr",
		reversed: "rf.nicedem"
	},
	{
		suffix: "medecin.km",
		reversed: "mk.nicedem"
	},
	{
		suffix: "media",
		reversed: "aidem"
	},
	{
		suffix: "media.aero",
		reversed: "orea.aidem"
	},
	{
		suffix: "media.hu",
		reversed: "uh.aidem"
	},
	{
		suffix: "media.museum",
		reversed: "muesum.aidem"
	},
	{
		suffix: "media.pl",
		reversed: "lp.aidem"
	},
	{
		suffix: "mediatech.by",
		reversed: "yb.hcetaidem"
	},
	{
		suffix: "mediatech.dev",
		reversed: "ved.hcetaidem"
	},
	{
		suffix: "medical.museum",
		reversed: "muesum.lacidem"
	},
	{
		suffix: "medicina.bo",
		reversed: "ob.anicidem"
	},
	{
		suffix: "medio-campidano.it",
		reversed: "ti.onadipmac-oidem"
	},
	{
		suffix: "mediocampidano.it",
		reversed: "ti.onadipmacoidem"
	},
	{
		suffix: "medizinhistorisches.museum",
		reversed: "muesum.sehcsirotsihnizidem"
	},
	{
		suffix: "meeres.museum",
		reversed: "muesum.sereem"
	},
	{
		suffix: "meet",
		reversed: "teem"
	},
	{
		suffix: "meguro.tokyo.jp",
		reversed: "pj.oykot.orugem"
	},
	{
		suffix: "mein-iserv.de",
		reversed: "ed.vresi-niem"
	},
	{
		suffix: "mein-vigor.de",
		reversed: "ed.rogiv-niem"
	},
	{
		suffix: "meinforum.net",
		reversed: "ten.murofniem"
	},
	{
		suffix: "meiwa.gunma.jp",
		reversed: "pj.amnug.awiem"
	},
	{
		suffix: "meiwa.mie.jp",
		reversed: "pj.eim.awiem"
	},
	{
		suffix: "mel.cloudlets.com.au",
		reversed: "ua.moc.stelduolc.lem"
	},
	{
		suffix: "meland.no",
		reversed: "on.dnalem"
	},
	{
		suffix: "melbourne",
		reversed: "enruoblem"
	},
	{
		suffix: "meldal.no",
		reversed: "on.ladlem"
	},
	{
		suffix: "melhus.no",
		reversed: "on.suhlem"
	},
	{
		suffix: "meloy.no",
		reversed: "on.yolem"
	},
	{
		suffix: "meløy.no",
		reversed: "on.ari-ylem--nx"
	},
	{
		suffix: "members.linode.com",
		reversed: "moc.edonil.srebmem"
	},
	{
		suffix: "meme",
		reversed: "emem"
	},
	{
		suffix: "memorial",
		reversed: "lairomem"
	},
	{
		suffix: "memorial.museum",
		reversed: "muesum.lairomem"
	},
	{
		suffix: "memset.net",
		reversed: "ten.tesmem"
	},
	{
		suffix: "men",
		reversed: "nem"
	},
	{
		suffix: "menu",
		reversed: "unem"
	},
	{
		suffix: "meraker.no",
		reversed: "on.rekarem"
	},
	{
		suffix: "merckmsd",
		reversed: "dsmkcrem"
	},
	{
		suffix: "merseine.nu",
		reversed: "un.eniesrem"
	},
	{
		suffix: "meråker.no",
		reversed: "on.auk-rekrem--nx"
	},
	{
		suffix: "mesaverde.museum",
		reversed: "muesum.edrevasem"
	},
	{
		suffix: "messerli.app",
		reversed: "ppa.ilressem"
	},
	{
		suffix: "messina.it",
		reversed: "ti.anissem"
	},
	{
		suffix: "messwithdns.com",
		reversed: "moc.sndhtiwssem"
	},
	{
		suffix: "meteorapp.com",
		reversed: "moc.pparoetem"
	},
	{
		suffix: "mex.com",
		reversed: "moc.xem"
	},
	{
		suffix: "mg",
		reversed: "gm"
	},
	{
		suffix: "mg.gov.br",
		reversed: "rb.vog.gm"
	},
	{
		suffix: "mg.leg.br",
		reversed: "rb.gel.gm"
	},
	{
		suffix: "mh",
		reversed: "hm"
	},
	{
		suffix: "mi.it",
		reversed: "ti.im"
	},
	{
		suffix: "mi.th",
		reversed: "ht.im"
	},
	{
		suffix: "mi.us",
		reversed: "su.im"
	},
	{
		suffix: "miami",
		reversed: "imaim"
	},
	{
		suffix: "miasa.nagano.jp",
		reversed: "pj.onagan.asaim"
	},
	{
		suffix: "miasta.pl",
		reversed: "lp.atsaim"
	},
	{
		suffix: "mibu.tochigi.jp",
		reversed: "pj.igihcot.ubim"
	},
	{
		suffix: "michigan.museum",
		reversed: "muesum.nagihcim"
	},
	{
		suffix: "microlight.aero",
		reversed: "orea.thgilorcim"
	},
	{
		suffix: "microsoft",
		reversed: "tfosorcim"
	},
	{
		suffix: "midatlantic.museum",
		reversed: "muesum.citnaltadim"
	},
	{
		suffix: "midori.chiba.jp",
		reversed: "pj.abihc.irodim"
	},
	{
		suffix: "midori.gunma.jp",
		reversed: "pj.amnug.irodim"
	},
	{
		suffix: "midsund.no",
		reversed: "on.dnusdim"
	},
	{
		suffix: "midtre-gauldal.no",
		reversed: "on.ladluag-ertdim"
	},
	{
		suffix: "mie.jp",
		reversed: "pj.eim"
	},
	{
		suffix: "mielec.pl",
		reversed: "lp.celeim"
	},
	{
		suffix: "mielno.pl",
		reversed: "lp.onleim"
	},
	{
		suffix: "mifune.kumamoto.jp",
		reversed: "pj.otomamuk.enufim"
	},
	{
		suffix: "mihama.aichi.jp",
		reversed: "pj.ihcia.amahim"
	},
	{
		suffix: "mihama.chiba.jp",
		reversed: "pj.abihc.amahim"
	},
	{
		suffix: "mihama.fukui.jp",
		reversed: "pj.iukuf.amahim"
	},
	{
		suffix: "mihama.mie.jp",
		reversed: "pj.eim.amahim"
	},
	{
		suffix: "mihama.wakayama.jp",
		reversed: "pj.amayakaw.amahim"
	},
	{
		suffix: "mihara.hiroshima.jp",
		reversed: "pj.amihsorih.arahim"
	},
	{
		suffix: "mihara.kochi.jp",
		reversed: "pj.ihcok.arahim"
	},
	{
		suffix: "miharu.fukushima.jp",
		reversed: "pj.amihsukuf.urahim"
	},
	{
		suffix: "miho.ibaraki.jp",
		reversed: "pj.ikarabi.ohim"
	},
	{
		suffix: "mikasa.hokkaido.jp",
		reversed: "pj.odiakkoh.asakim"
	},
	{
		suffix: "mikawa.yamagata.jp",
		reversed: "pj.atagamay.awakim"
	},
	{
		suffix: "miki.hyogo.jp",
		reversed: "pj.ogoyh.ikim"
	},
	{
		suffix: "mil",
		reversed: "lim"
	},
	{
		suffix: "mil.ac",
		reversed: "ca.lim"
	},
	{
		suffix: "mil.ae",
		reversed: "ea.lim"
	},
	{
		suffix: "mil.al",
		reversed: "la.lim"
	},
	{
		suffix: "mil.ar",
		reversed: "ra.lim"
	},
	{
		suffix: "mil.az",
		reversed: "za.lim"
	},
	{
		suffix: "mil.ba",
		reversed: "ab.lim"
	},
	{
		suffix: "mil.bo",
		reversed: "ob.lim"
	},
	{
		suffix: "mil.br",
		reversed: "rb.lim"
	},
	{
		suffix: "mil.by",
		reversed: "yb.lim"
	},
	{
		suffix: "mil.cl",
		reversed: "lc.lim"
	},
	{
		suffix: "mil.cn",
		reversed: "nc.lim"
	},
	{
		suffix: "mil.co",
		reversed: "oc.lim"
	},
	{
		suffix: "mil.cy",
		reversed: "yc.lim"
	},
	{
		suffix: "mil.do",
		reversed: "od.lim"
	},
	{
		suffix: "mil.ec",
		reversed: "ce.lim"
	},
	{
		suffix: "mil.eg",
		reversed: "ge.lim"
	},
	{
		suffix: "mil.fj",
		reversed: "jf.lim"
	},
	{
		suffix: "mil.ge",
		reversed: "eg.lim"
	},
	{
		suffix: "mil.gh",
		reversed: "hg.lim"
	},
	{
		suffix: "mil.gt",
		reversed: "tg.lim"
	},
	{
		suffix: "mil.hn",
		reversed: "nh.lim"
	},
	{
		suffix: "mil.id",
		reversed: "di.lim"
	},
	{
		suffix: "mil.in",
		reversed: "ni.lim"
	},
	{
		suffix: "mil.iq",
		reversed: "qi.lim"
	},
	{
		suffix: "mil.jo",
		reversed: "oj.lim"
	},
	{
		suffix: "mil.kg",
		reversed: "gk.lim"
	},
	{
		suffix: "mil.km",
		reversed: "mk.lim"
	},
	{
		suffix: "mil.kr",
		reversed: "rk.lim"
	},
	{
		suffix: "mil.kz",
		reversed: "zk.lim"
	},
	{
		suffix: "mil.lv",
		reversed: "vl.lim"
	},
	{
		suffix: "mil.mg",
		reversed: "gm.lim"
	},
	{
		suffix: "mil.mv",
		reversed: "vm.lim"
	},
	{
		suffix: "mil.my",
		reversed: "ym.lim"
	},
	{
		suffix: "mil.mz",
		reversed: "zm.lim"
	},
	{
		suffix: "mil.ng",
		reversed: "gn.lim"
	},
	{
		suffix: "mil.ni",
		reversed: "in.lim"
	},
	{
		suffix: "mil.no",
		reversed: "on.lim"
	},
	{
		suffix: "mil.nz",
		reversed: "zn.lim"
	},
	{
		suffix: "mil.pe",
		reversed: "ep.lim"
	},
	{
		suffix: "mil.ph",
		reversed: "hp.lim"
	},
	{
		suffix: "mil.pl",
		reversed: "lp.lim"
	},
	{
		suffix: "mil.py",
		reversed: "yp.lim"
	},
	{
		suffix: "mil.qa",
		reversed: "aq.lim"
	},
	{
		suffix: "mil.ru",
		reversed: "ur.lim"
	},
	{
		suffix: "mil.rw",
		reversed: "wr.lim"
	},
	{
		suffix: "mil.sh",
		reversed: "hs.lim"
	},
	{
		suffix: "mil.st",
		reversed: "ts.lim"
	},
	{
		suffix: "mil.sy",
		reversed: "ys.lim"
	},
	{
		suffix: "mil.tj",
		reversed: "jt.lim"
	},
	{
		suffix: "mil.tm",
		reversed: "mt.lim"
	},
	{
		suffix: "mil.to",
		reversed: "ot.lim"
	},
	{
		suffix: "mil.tr",
		reversed: "rt.lim"
	},
	{
		suffix: "mil.tw",
		reversed: "wt.lim"
	},
	{
		suffix: "mil.tz",
		reversed: "zt.lim"
	},
	{
		suffix: "mil.uy",
		reversed: "yu.lim"
	},
	{
		suffix: "mil.vc",
		reversed: "cv.lim"
	},
	{
		suffix: "mil.ve",
		reversed: "ev.lim"
	},
	{
		suffix: "mil.ye",
		reversed: "ey.lim"
	},
	{
		suffix: "mil.za",
		reversed: "az.lim"
	},
	{
		suffix: "mil.zm",
		reversed: "mz.lim"
	},
	{
		suffix: "mil.zw",
		reversed: "wz.lim"
	},
	{
		suffix: "milan.it",
		reversed: "ti.nalim"
	},
	{
		suffix: "milano.it",
		reversed: "ti.onalim"
	},
	{
		suffix: "military.museum",
		reversed: "muesum.yratilim"
	},
	{
		suffix: "mill.museum",
		reversed: "muesum.llim"
	},
	{
		suffix: "mima.tokushima.jp",
		reversed: "pj.amihsukot.amim"
	},
	{
		suffix: "mimata.miyazaki.jp",
		reversed: "pj.ikazayim.atamim"
	},
	{
		suffix: "minakami.gunma.jp",
		reversed: "pj.amnug.imakanim"
	},
	{
		suffix: "minamata.kumamoto.jp",
		reversed: "pj.otomamuk.atamanim"
	},
	{
		suffix: "minami-alps.yamanashi.jp",
		reversed: "pj.ihsanamay.spla-imanim"
	},
	{
		suffix: "minami.fukuoka.jp",
		reversed: "pj.akoukuf.imanim"
	},
	{
		suffix: "minami.kyoto.jp",
		reversed: "pj.otoyk.imanim"
	},
	{
		suffix: "minami.tokushima.jp",
		reversed: "pj.amihsukot.imanim"
	},
	{
		suffix: "minamiaiki.nagano.jp",
		reversed: "pj.onagan.ikiaimanim"
	},
	{
		suffix: "minamiashigara.kanagawa.jp",
		reversed: "pj.awaganak.aragihsaimanim"
	},
	{
		suffix: "minamiawaji.hyogo.jp",
		reversed: "pj.ogoyh.ijawaimanim"
	},
	{
		suffix: "minamiboso.chiba.jp",
		reversed: "pj.abihc.osobimanim"
	},
	{
		suffix: "minamidaito.okinawa.jp",
		reversed: "pj.awaniko.otiadimanim"
	},
	{
		suffix: "minamiechizen.fukui.jp",
		reversed: "pj.iukuf.nezihceimanim"
	},
	{
		suffix: "minamifurano.hokkaido.jp",
		reversed: "pj.odiakkoh.onarufimanim"
	},
	{
		suffix: "minamiise.mie.jp",
		reversed: "pj.eim.esiimanim"
	},
	{
		suffix: "minamiizu.shizuoka.jp",
		reversed: "pj.akouzihs.uziimanim"
	},
	{
		suffix: "minamimaki.nagano.jp",
		reversed: "pj.onagan.ikamimanim"
	},
	{
		suffix: "minamiminowa.nagano.jp",
		reversed: "pj.onagan.awonimimanim"
	},
	{
		suffix: "minamioguni.kumamoto.jp",
		reversed: "pj.otomamuk.inugoimanim"
	},
	{
		suffix: "minamisanriku.miyagi.jp",
		reversed: "pj.igayim.ukirnasimanim"
	},
	{
		suffix: "minamitane.kagoshima.jp",
		reversed: "pj.amihsogak.enatimanim"
	},
	{
		suffix: "minamiuonuma.niigata.jp",
		reversed: "pj.atagiin.amunouimanim"
	},
	{
		suffix: "minamiyamashiro.kyoto.jp",
		reversed: "pj.otoyk.orihsamayimanim"
	},
	{
		suffix: "minano.saitama.jp",
		reversed: "pj.amatias.onanim"
	},
	{
		suffix: "minato.osaka.jp",
		reversed: "pj.akaso.otanim"
	},
	{
		suffix: "minato.tokyo.jp",
		reversed: "pj.oykot.otanim"
	},
	{
		suffix: "mincom.tn",
		reversed: "nt.mocnim"
	},
	{
		suffix: "mine.nu",
		reversed: "un.enim"
	},
	{
		suffix: "miners.museum",
		reversed: "muesum.srenim"
	},
	{
		suffix: "mini",
		reversed: "inim"
	},
	{
		suffix: "mining.museum",
		reversed: "muesum.gninim"
	},
	{
		suffix: "miniserver.com",
		reversed: "moc.revresinim"
	},
	{
		suffix: "minisite.ms",
		reversed: "sm.etisinim"
	},
	{
		suffix: "minnesota.museum",
		reversed: "muesum.atosennim"
	},
	{
		suffix: "mino.gifu.jp",
		reversed: "pj.ufig.onim"
	},
	{
		suffix: "minobu.yamanashi.jp",
		reversed: "pj.ihsanamay.ubonim"
	},
	{
		suffix: "minoh.osaka.jp",
		reversed: "pj.akaso.honim"
	},
	{
		suffix: "minokamo.gifu.jp",
		reversed: "pj.ufig.omakonim"
	},
	{
		suffix: "minowa.nagano.jp",
		reversed: "pj.onagan.awonim"
	},
	{
		suffix: "mint",
		reversed: "tnim"
	},
	{
		suffix: "mintere.site",
		reversed: "etis.eretnim"
	},
	{
		suffix: "mircloud.host",
		reversed: "tsoh.duolcrim"
	},
	{
		suffix: "mircloud.ru",
		reversed: "ur.duolcrim"
	},
	{
		suffix: "mircloud.us",
		reversed: "su.duolcrim"
	},
	{
		suffix: "misaki.okayama.jp",
		reversed: "pj.amayako.ikasim"
	},
	{
		suffix: "misaki.osaka.jp",
		reversed: "pj.akaso.ikasim"
	},
	{
		suffix: "misasa.tottori.jp",
		reversed: "pj.irottot.asasim"
	},
	{
		suffix: "misato.akita.jp",
		reversed: "pj.atika.otasim"
	},
	{
		suffix: "misato.miyagi.jp",
		reversed: "pj.igayim.otasim"
	},
	{
		suffix: "misato.saitama.jp",
		reversed: "pj.amatias.otasim"
	},
	{
		suffix: "misato.shimane.jp",
		reversed: "pj.enamihs.otasim"
	},
	{
		suffix: "misato.wakayama.jp",
		reversed: "pj.amayakaw.otasim"
	},
	{
		suffix: "misawa.aomori.jp",
		reversed: "pj.iromoa.awasim"
	},
	{
		suffix: "misconfused.org",
		reversed: "gro.desufnocsim"
	},
	{
		suffix: "mishima.fukushima.jp",
		reversed: "pj.amihsukuf.amihsim"
	},
	{
		suffix: "mishima.shizuoka.jp",
		reversed: "pj.akouzihs.amihsim"
	},
	{
		suffix: "missile.museum",
		reversed: "muesum.elissim"
	},
	{
		suffix: "missoula.museum",
		reversed: "muesum.aluossim"
	},
	{
		suffix: "misugi.mie.jp",
		reversed: "pj.eim.igusim"
	},
	{
		suffix: "mit",
		reversed: "tim"
	},
	{
		suffix: "mitaka.tokyo.jp",
		reversed: "pj.oykot.akatim"
	},
	{
		suffix: "mitake.gifu.jp",
		reversed: "pj.ufig.ekatim"
	},
	{
		suffix: "mitane.akita.jp",
		reversed: "pj.atika.enatim"
	},
	{
		suffix: "mito.ibaraki.jp",
		reversed: "pj.ikarabi.otim"
	},
	{
		suffix: "mitou.yamaguchi.jp",
		reversed: "pj.ihcugamay.uotim"
	},
	{
		suffix: "mitoyo.kagawa.jp",
		reversed: "pj.awagak.oyotim"
	},
	{
		suffix: "mitsubishi",
		reversed: "ihsibustim"
	},
	{
		suffix: "mitsue.nara.jp",
		reversed: "pj.aran.eustim"
	},
	{
		suffix: "mitsuke.niigata.jp",
		reversed: "pj.atagiin.ekustim"
	},
	{
		suffix: "miura.kanagawa.jp",
		reversed: "pj.awaganak.aruim"
	},
	{
		suffix: "miyada.nagano.jp",
		reversed: "pj.onagan.adayim"
	},
	{
		suffix: "miyagi.jp",
		reversed: "pj.igayim"
	},
	{
		suffix: "miyake.nara.jp",
		reversed: "pj.aran.ekayim"
	},
	{
		suffix: "miyako.fukuoka.jp",
		reversed: "pj.akoukuf.okayim"
	},
	{
		suffix: "miyako.iwate.jp",
		reversed: "pj.etawi.okayim"
	},
	{
		suffix: "miyakonojo.miyazaki.jp",
		reversed: "pj.ikazayim.ojonokayim"
	},
	{
		suffix: "miyama.fukuoka.jp",
		reversed: "pj.akoukuf.amayim"
	},
	{
		suffix: "miyama.mie.jp",
		reversed: "pj.eim.amayim"
	},
	{
		suffix: "miyashiro.saitama.jp",
		reversed: "pj.amatias.orihsayim"
	},
	{
		suffix: "miyawaka.fukuoka.jp",
		reversed: "pj.akoukuf.akawayim"
	},
	{
		suffix: "miyazaki.jp",
		reversed: "pj.ikazayim"
	},
	{
		suffix: "miyazaki.miyazaki.jp",
		reversed: "pj.ikazayim.ikazayim"
	},
	{
		suffix: "miyazu.kyoto.jp",
		reversed: "pj.otoyk.uzayim"
	},
	{
		suffix: "miyoshi.aichi.jp",
		reversed: "pj.ihcia.ihsoyim"
	},
	{
		suffix: "miyoshi.hiroshima.jp",
		reversed: "pj.amihsorih.ihsoyim"
	},
	{
		suffix: "miyoshi.saitama.jp",
		reversed: "pj.amatias.ihsoyim"
	},
	{
		suffix: "miyoshi.tokushima.jp",
		reversed: "pj.amihsukot.ihsoyim"
	},
	{
		suffix: "miyota.nagano.jp",
		reversed: "pj.onagan.atoyim"
	},
	{
		suffix: "mizuho.tokyo.jp",
		reversed: "pj.oykot.ohuzim"
	},
	{
		suffix: "mizumaki.fukuoka.jp",
		reversed: "pj.akoukuf.ikamuzim"
	},
	{
		suffix: "mizunami.gifu.jp",
		reversed: "pj.ufig.imanuzim"
	},
	{
		suffix: "mizusawa.iwate.jp",
		reversed: "pj.etawi.awasuzim"
	},
	{
		suffix: "mjondalen.no",
		reversed: "on.neladnojm"
	},
	{
		suffix: "mjøndalen.no",
		reversed: "on.a46-neladnjm--nx"
	},
	{
		suffix: "mk",
		reversed: "km"
	},
	{
		suffix: "mk.eu.org",
		reversed: "gro.ue.km"
	},
	{
		suffix: "mk.ua",
		reversed: "au.km"
	},
	{
		suffix: "ml",
		reversed: "lm"
	},
	{
		suffix: "mlb",
		reversed: "blm"
	},
	{
		suffix: "mlbfan.org",
		reversed: "gro.nafblm"
	},
	{
		suffix: "mls",
		reversed: "slm"
	},
	{
		suffix: "mma",
		reversed: "amm"
	},
	{
		suffix: "mmafan.biz",
		reversed: "zib.nafamm"
	},
	{
		suffix: "mn",
		reversed: "nm"
	},
	{
		suffix: "mn.it",
		reversed: "ti.nm"
	},
	{
		suffix: "mn.us",
		reversed: "su.nm"
	},
	{
		suffix: "mo",
		reversed: "om"
	},
	{
		suffix: "mo-i-rana.no",
		reversed: "on.anar-i-om"
	},
	{
		suffix: "mo-siemens.io",
		reversed: "oi.snemeis-om"
	},
	{
		suffix: "mo.cn",
		reversed: "nc.om"
	},
	{
		suffix: "mo.it",
		reversed: "ti.om"
	},
	{
		suffix: "mo.us",
		reversed: "su.om"
	},
	{
		suffix: "moareke.no",
		reversed: "on.ekeraom"
	},
	{
		suffix: "mobara.chiba.jp",
		reversed: "pj.abihc.arabom"
	},
	{
		suffix: "mobi",
		reversed: "ibom"
	},
	{
		suffix: "mobi.gp",
		reversed: "pg.ibom"
	},
	{
		suffix: "mobi.ke",
		reversed: "ek.ibom"
	},
	{
		suffix: "mobi.na",
		reversed: "an.ibom"
	},
	{
		suffix: "mobi.ng",
		reversed: "gn.ibom"
	},
	{
		suffix: "mobi.tt",
		reversed: "tt.ibom"
	},
	{
		suffix: "mobi.tz",
		reversed: "zt.ibom"
	},
	{
		suffix: "mobile",
		reversed: "elibom"
	},
	{
		suffix: "mochizuki.nagano.jp",
		reversed: "pj.onagan.ikuzihcom"
	},
	{
		suffix: "mock.pstmn.io",
		reversed: "oi.nmtsp.kcom"
	},
	{
		suffix: "mod.gi",
		reversed: "ig.dom"
	},
	{
		suffix: "moda",
		reversed: "adom"
	},
	{
		suffix: "modalen.no",
		reversed: "on.neladom"
	},
	{
		suffix: "modelling.aero",
		reversed: "orea.gnilledom"
	},
	{
		suffix: "modena.it",
		reversed: "ti.anedom"
	},
	{
		suffix: "modern.museum",
		reversed: "muesum.nredom"
	},
	{
		suffix: "mods.jp",
		reversed: "pj.sdom"
	},
	{
		suffix: "modum.no",
		reversed: "on.mudom"
	},
	{
		suffix: "moe",
		reversed: "eom"
	},
	{
		suffix: "moi",
		reversed: "iom"
	},
	{
		suffix: "moka.tochigi.jp",
		reversed: "pj.igihcot.akom"
	},
	{
		suffix: "mol.it",
		reversed: "ti.lom"
	},
	{
		suffix: "molde.no",
		reversed: "on.edlom"
	},
	{
		suffix: "molise.it",
		reversed: "ti.esilom"
	},
	{
		suffix: "mom",
		reversed: "mom"
	},
	{
		suffix: "moma.museum",
		reversed: "muesum.amom"
	},
	{
		suffix: "mombetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebmom"
	},
	{
		suffix: "monash",
		reversed: "hsanom"
	},
	{
		suffix: "mond.jp",
		reversed: "pj.dnom"
	},
	{
		suffix: "money",
		reversed: "yenom"
	},
	{
		suffix: "money.museum",
		reversed: "muesum.yenom"
	},
	{
		suffix: "mongolian.jp",
		reversed: "pj.nailognom"
	},
	{
		suffix: "monmouth.museum",
		reversed: "muesum.htuomnom"
	},
	{
		suffix: "monster",
		reversed: "retsnom"
	},
	{
		suffix: "monticello.museum",
		reversed: "muesum.ollecitnom"
	},
	{
		suffix: "montreal.museum",
		reversed: "muesum.laertnom"
	},
	{
		suffix: "monza-brianza.it",
		reversed: "ti.aznairb-aznom"
	},
	{
		suffix: "monza-e-della-brianza.it",
		reversed: "ti.aznairb-alled-e-aznom"
	},
	{
		suffix: "monza.it",
		reversed: "ti.aznom"
	},
	{
		suffix: "monzabrianza.it",
		reversed: "ti.aznairbaznom"
	},
	{
		suffix: "monzaebrianza.it",
		reversed: "ti.aznairbeaznom"
	},
	{
		suffix: "monzaedellabrianza.it",
		reversed: "ti.aznairballedeaznom"
	},
	{
		suffix: "moo.jp",
		reversed: "pj.oom"
	},
	{
		suffix: "moonscale.net",
		reversed: "ten.elacsnoom"
	},
	{
		suffix: "mordovia.ru",
		reversed: "ur.aivodrom"
	},
	{
		suffix: "mordovia.su",
		reversed: "us.aivodrom"
	},
	{
		suffix: "morena.br",
		reversed: "rb.anerom"
	},
	{
		suffix: "moriguchi.osaka.jp",
		reversed: "pj.akaso.ihcugirom"
	},
	{
		suffix: "morimachi.shizuoka.jp",
		reversed: "pj.akouzihs.ihcamirom"
	},
	{
		suffix: "morioka.iwate.jp",
		reversed: "pj.etawi.akoirom"
	},
	{
		suffix: "moriya.ibaraki.jp",
		reversed: "pj.ikarabi.ayirom"
	},
	{
		suffix: "moriyama.shiga.jp",
		reversed: "pj.agihs.amayirom"
	},
	{
		suffix: "moriyoshi.akita.jp",
		reversed: "pj.atika.ihsoyirom"
	},
	{
		suffix: "mormon",
		reversed: "nomrom"
	},
	{
		suffix: "morotsuka.miyazaki.jp",
		reversed: "pj.ikazayim.akustorom"
	},
	{
		suffix: "moroyama.saitama.jp",
		reversed: "pj.amatias.amayorom"
	},
	{
		suffix: "mortgage",
		reversed: "egagtrom"
	},
	{
		suffix: "moscow",
		reversed: "wocsom"
	},
	{
		suffix: "moscow.museum",
		reversed: "muesum.wocsom"
	},
	{
		suffix: "moseushi.hokkaido.jp",
		reversed: "pj.odiakkoh.ihsuesom"
	},
	{
		suffix: "mosjoen.no",
		reversed: "on.neojsom"
	},
	{
		suffix: "mosjøen.no",
		reversed: "on.aye-nejsom--nx"
	},
	{
		suffix: "moskenes.no",
		reversed: "on.seneksom"
	},
	{
		suffix: "moss.no",
		reversed: "on.ssom"
	},
	{
		suffix: "mosvik.no",
		reversed: "on.kivsom"
	},
	{
		suffix: "motegi.tochigi.jp",
		reversed: "pj.igihcot.igetom"
	},
	{
		suffix: "moto",
		reversed: "otom"
	},
	{
		suffix: "motobu.okinawa.jp",
		reversed: "pj.awaniko.ubotom"
	},
	{
		suffix: "motorcycle.museum",
		reversed: "muesum.elcycrotom"
	},
	{
		suffix: "motorcycles",
		reversed: "selcycrotom"
	},
	{
		suffix: "motosu.gifu.jp",
		reversed: "pj.ufig.usotom"
	},
	{
		suffix: "motoyama.kochi.jp",
		reversed: "pj.ihcok.amayotom"
	},
	{
		suffix: "mov",
		reversed: "vom"
	},
	{
		suffix: "movie",
		reversed: "eivom"
	},
	{
		suffix: "movimiento.bo",
		reversed: "ob.otneimivom"
	},
	{
		suffix: "mozilla-iot.org",
		reversed: "gro.toi-allizom"
	},
	{
		suffix: "moåreke.no",
		reversed: "on.auj-ekerom--nx"
	},
	{
		suffix: "mp",
		reversed: "pm"
	},
	{
		suffix: "mp.br",
		reversed: "rb.pm"
	},
	{
		suffix: "mq",
		reversed: "qm"
	},
	{
		suffix: "mr",
		reversed: "rm"
	},
	{
		suffix: "mr.no",
		reversed: "on.rm"
	},
	{
		suffix: "mragowo.pl",
		reversed: "lp.owogarm"
	},
	{
		suffix: "ms",
		reversed: "sm"
	},
	{
		suffix: "ms.gov.br",
		reversed: "rb.vog.sm"
	},
	{
		suffix: "ms.it",
		reversed: "ti.sm"
	},
	{
		suffix: "ms.kr",
		reversed: "rk.sm"
	},
	{
		suffix: "ms.leg.br",
		reversed: "rb.gel.sm"
	},
	{
		suffix: "ms.us",
		reversed: "su.sm"
	},
	{
		suffix: "msd",
		reversed: "dsm"
	},
	{
		suffix: "msk.ru",
		reversed: "ur.ksm"
	},
	{
		suffix: "msk.su",
		reversed: "us.ksm"
	},
	{
		suffix: "mt",
		reversed: "tm"
	},
	{
		suffix: "mt.eu.org",
		reversed: "gro.ue.tm"
	},
	{
		suffix: "mt.gov.br",
		reversed: "rb.vog.tm"
	},
	{
		suffix: "mt.it",
		reversed: "ti.tm"
	},
	{
		suffix: "mt.leg.br",
		reversed: "rb.gel.tm"
	},
	{
		suffix: "mt.us",
		reversed: "su.tm"
	},
	{
		suffix: "mtn",
		reversed: "ntm"
	},
	{
		suffix: "mtr",
		reversed: "rtm"
	},
	{
		suffix: "mu",
		reversed: "um"
	},
	{
		suffix: "muenchen.museum",
		reversed: "muesum.nehcneum"
	},
	{
		suffix: "muenster.museum",
		reversed: "muesum.retsneum"
	},
	{
		suffix: "mugi.tokushima.jp",
		reversed: "pj.amihsukot.igum"
	},
	{
		suffix: "muika.niigata.jp",
		reversed: "pj.atagiin.akium"
	},
	{
		suffix: "mukawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awakum"
	},
	{
		suffix: "muko.kyoto.jp",
		reversed: "pj.otoyk.okum"
	},
	{
		suffix: "mulhouse.museum",
		reversed: "muesum.esuohlum"
	},
	{
		suffix: "munakata.fukuoka.jp",
		reversed: "pj.akoukuf.atakanum"
	},
	{
		suffix: "muncie.museum",
		reversed: "muesum.eicnum"
	},
	{
		suffix: "muni.il",
		reversed: "li.inum"
	},
	{
		suffix: "muosat.no",
		reversed: "on.tasoum"
	},
	{
		suffix: "muosát.no",
		reversed: "on.aq0-tsoum--nx"
	},
	{
		suffix: "mup.gov.pl",
		reversed: "lp.vog.pum"
	},
	{
		suffix: "murakami.niigata.jp",
		reversed: "pj.atagiin.imakarum"
	},
	{
		suffix: "murata.miyagi.jp",
		reversed: "pj.igayim.atarum"
	},
	{
		suffix: "murayama.yamagata.jp",
		reversed: "pj.atagamay.amayarum"
	},
	{
		suffix: "murmansk.su",
		reversed: "us.ksnamrum"
	},
	{
		suffix: "muroran.hokkaido.jp",
		reversed: "pj.odiakkoh.narorum"
	},
	{
		suffix: "muroto.kochi.jp",
		reversed: "pj.ihcok.otorum"
	},
	{
		suffix: "mus.br",
		reversed: "rb.sum"
	},
	{
		suffix: "mus.mi.us",
		reversed: "su.im.sum"
	},
	{
		suffix: "musashimurayama.tokyo.jp",
		reversed: "pj.oykot.amayarumihsasum"
	},
	{
		suffix: "musashino.tokyo.jp",
		reversed: "pj.oykot.onihsasum"
	},
	{
		suffix: "museet.museum",
		reversed: "muesum.teesum"
	},
	{
		suffix: "museum",
		reversed: "muesum"
	},
	{
		suffix: "museum.mv",
		reversed: "vm.muesum"
	},
	{
		suffix: "museum.mw",
		reversed: "wm.muesum"
	},
	{
		suffix: "museum.no",
		reversed: "on.muesum"
	},
	{
		suffix: "museum.om",
		reversed: "mo.muesum"
	},
	{
		suffix: "museum.tt",
		reversed: "tt.muesum"
	},
	{
		suffix: "museumcenter.museum",
		reversed: "muesum.retnecmuesum"
	},
	{
		suffix: "museumvereniging.museum",
		reversed: "muesum.gniginerevmuesum"
	},
	{
		suffix: "music",
		reversed: "cisum"
	},
	{
		suffix: "music.museum",
		reversed: "muesum.cisum"
	},
	{
		suffix: "musica.ar",
		reversed: "ra.acisum"
	},
	{
		suffix: "musica.bo",
		reversed: "ob.acisum"
	},
	{
		suffix: "musician.io",
		reversed: "oi.naicisum"
	},
	{
		suffix: "mutsu.aomori.jp",
		reversed: "pj.iromoa.ustum"
	},
	{
		suffix: "mutsuzawa.chiba.jp",
		reversed: "pj.abihc.awazustum"
	},
	{
		suffix: "mutual",
		reversed: "lautum"
	},
	{
		suffix: "mutual.ar",
		reversed: "ra.lautum"
	},
	{
		suffix: "mv",
		reversed: "vm"
	},
	{
		suffix: "mw",
		reversed: "wm"
	},
	{
		suffix: "mw.gov.pl",
		reversed: "lp.vog.wm"
	},
	{
		suffix: "mx",
		reversed: "xm"
	},
	{
		suffix: "mx.na",
		reversed: "an.xm"
	},
	{
		suffix: "my",
		reversed: "ym"
	},
	{
		suffix: "my-firewall.org",
		reversed: "gro.llawerif-ym"
	},
	{
		suffix: "my-gateway.de",
		reversed: "ed.yawetag-ym"
	},
	{
		suffix: "my-router.de",
		reversed: "ed.retuor-ym"
	},
	{
		suffix: "my-vigor.de",
		reversed: "ed.rogiv-ym"
	},
	{
		suffix: "my-wan.de",
		reversed: "ed.naw-ym"
	},
	{
		suffix: "my.eu.org",
		reversed: "gro.ue.ym"
	},
	{
		suffix: "my.id",
		reversed: "di.ym"
	},
	{
		suffix: "myactivedirectory.com",
		reversed: "moc.yrotceridevitcaym"
	},
	{
		suffix: "myasustor.com",
		reversed: "moc.rotsusaym"
	},
	{
		suffix: "mycd.eu",
		reversed: "ue.dcym"
	},
	{
		suffix: "mycloud.by",
		reversed: "yb.duolcym"
	},
	{
		suffix: "mydatto.com",
		reversed: "moc.ottadym"
	},
	{
		suffix: "mydatto.net",
		reversed: "ten.ottadym"
	},
	{
		suffix: "myddns.rocks",
		reversed: "skcor.snddym"
	},
	{
		suffix: "mydissent.net",
		reversed: "ten.tnessidym"
	},
	{
		suffix: "mydobiss.com",
		reversed: "moc.ssibodym"
	},
	{
		suffix: "mydrobo.com",
		reversed: "moc.obordym"
	},
	{
		suffix: "myds.me",
		reversed: "em.sdym"
	},
	{
		suffix: "myeffect.net",
		reversed: "ten.tceffeym"
	},
	{
		suffix: "myfast.host",
		reversed: "tsoh.tsafym"
	},
	{
		suffix: "myfast.space",
		reversed: "ecaps.tsafym"
	},
	{
		suffix: "myfirewall.org",
		reversed: "gro.llawerifym"
	},
	{
		suffix: "myforum.community",
		reversed: "ytinummoc.murofym"
	},
	{
		suffix: "myfritz.net",
		reversed: "ten.ztirfym"
	},
	{
		suffix: "myftp.biz",
		reversed: "zib.ptfym"
	},
	{
		suffix: "myftp.org",
		reversed: "gro.ptfym"
	},
	{
		suffix: "myhome-server.de",
		reversed: "ed.revres-emohym"
	},
	{
		suffix: "myiphost.com",
		reversed: "moc.tsohpiym"
	},
	{
		suffix: "myjino.ru",
		reversed: "ur.onijym"
	},
	{
		suffix: "mykolaiv.ua",
		reversed: "au.vialokym"
	},
	{
		suffix: "mymailer.com.tw",
		reversed: "wt.moc.reliamym"
	},
	{
		suffix: "mymediapc.net",
		reversed: "ten.cpaidemym"
	},
	{
		suffix: "myoko.niigata.jp",
		reversed: "pj.atagiin.okoym"
	},
	{
		suffix: "mypep.link",
		reversed: "knil.pepym"
	},
	{
		suffix: "mypets.ws",
		reversed: "sw.stepym"
	},
	{
		suffix: "myphotos.cc",
		reversed: "cc.sotohpym"
	},
	{
		suffix: "mypi.co",
		reversed: "oc.ipym"
	},
	{
		suffix: "mypsx.net",
		reversed: "ten.xspym"
	},
	{
		suffix: "myqnapcloud.com",
		reversed: "moc.duolcpanqym"
	},
	{
		suffix: "myravendb.com",
		reversed: "moc.bdnevarym"
	},
	{
		suffix: "mysecuritycamera.com",
		reversed: "moc.aremacytirucesym"
	},
	{
		suffix: "mysecuritycamera.net",
		reversed: "ten.aremacytirucesym"
	},
	{
		suffix: "mysecuritycamera.org",
		reversed: "gro.aremacytirucesym"
	},
	{
		suffix: "myshopblocks.com",
		reversed: "moc.skcolbpohsym"
	},
	{
		suffix: "myshopify.com",
		reversed: "moc.yfipohsym"
	},
	{
		suffix: "myspreadshop.at",
		reversed: "ta.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.be",
		reversed: "eb.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.ca",
		reversed: "ac.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.ch",
		reversed: "hc.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.co.uk",
		reversed: "ku.oc.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.com",
		reversed: "moc.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.com.au",
		reversed: "ua.moc.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.de",
		reversed: "ed.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.dk",
		reversed: "kd.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.es",
		reversed: "se.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.fi",
		reversed: "if.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.fr",
		reversed: "rf.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.ie",
		reversed: "ei.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.it",
		reversed: "ti.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.net",
		reversed: "ten.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.nl",
		reversed: "ln.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.no",
		reversed: "on.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.pl",
		reversed: "lp.pohsdaerpsym"
	},
	{
		suffix: "myspreadshop.se",
		reversed: "es.pohsdaerpsym"
	},
	{
		suffix: "mytis.ru",
		reversed: "ur.sitym"
	},
	{
		suffix: "mytuleap.com",
		reversed: "moc.paelutym"
	},
	{
		suffix: "myvnc.com",
		reversed: "moc.cnvym"
	},
	{
		suffix: "mywire.org",
		reversed: "gro.eriwym"
	},
	{
		suffix: "mz",
		reversed: "zm"
	},
	{
		suffix: "málatvuopmi.no",
		reversed: "on.a4s-impouvtalm--nx"
	},
	{
		suffix: "mátta-várjjat.no",
		reversed: "on.fa7k-tajjrv-attm--nx"
	},
	{
		suffix: "målselv.no",
		reversed: "on.aui-vleslm--nx"
	},
	{
		suffix: "måsøy.no",
		reversed: "on.h0alu-ysm--nx"
	},
	{
		suffix: "māori.nz",
		reversed: "zn.asq-irom--nx"
	},
	{
		suffix: "n.bg",
		reversed: "gb.n"
	},
	{
		suffix: "n.se",
		reversed: "es.n"
	},
	{
		suffix: "n4t.co",
		reversed: "oc.t4n"
	},
	{
		suffix: "na",
		reversed: "an"
	},
	{
		suffix: "na.it",
		reversed: "ti.an"
	},
	{
		suffix: "na4u.ru",
		reversed: "ur.u4an"
	},
	{
		suffix: "naamesjevuemie.no",
		reversed: "on.eimeuvejsemaan"
	},
	{
		suffix: "nab",
		reversed: "ban"
	},
	{
		suffix: "nabari.mie.jp",
		reversed: "pj.eim.iraban"
	},
	{
		suffix: "nachikatsuura.wakayama.jp",
		reversed: "pj.amayakaw.aruustakihcan"
	},
	{
		suffix: "nagahama.shiga.jp",
		reversed: "pj.agihs.amahagan"
	},
	{
		suffix: "nagai.yamagata.jp",
		reversed: "pj.atagamay.iagan"
	},
	{
		suffix: "nagano.jp",
		reversed: "pj.onagan"
	},
	{
		suffix: "nagano.nagano.jp",
		reversed: "pj.onagan.onagan"
	},
	{
		suffix: "naganohara.gunma.jp",
		reversed: "pj.amnug.arahonagan"
	},
	{
		suffix: "nagaoka.niigata.jp",
		reversed: "pj.atagiin.akoagan"
	},
	{
		suffix: "nagaokakyo.kyoto.jp",
		reversed: "pj.otoyk.oykakoagan"
	},
	{
		suffix: "nagara.chiba.jp",
		reversed: "pj.abihc.aragan"
	},
	{
		suffix: "nagareyama.chiba.jp",
		reversed: "pj.abihc.amayeragan"
	},
	{
		suffix: "nagasaki.jp",
		reversed: "pj.ikasagan"
	},
	{
		suffix: "nagasaki.nagasaki.jp",
		reversed: "pj.ikasagan.ikasagan"
	},
	{
		suffix: "nagasu.kumamoto.jp",
		reversed: "pj.otomamuk.usagan"
	},
	{
		suffix: "nagato.yamaguchi.jp",
		reversed: "pj.ihcugamay.otagan"
	},
	{
		suffix: "nagatoro.saitama.jp",
		reversed: "pj.amatias.orotagan"
	},
	{
		suffix: "nagawa.nagano.jp",
		reversed: "pj.onagan.awagan"
	},
	{
		suffix: "nagi.okayama.jp",
		reversed: "pj.amayako.igan"
	},
	{
		suffix: "nagiso.nagano.jp",
		reversed: "pj.onagan.osigan"
	},
	{
		suffix: "nago.okinawa.jp",
		reversed: "pj.awaniko.ogan"
	},
	{
		suffix: "nagoya",
		reversed: "ayogan"
	},
	{
		suffix: "naha.okinawa.jp",
		reversed: "pj.awaniko.ahan"
	},
	{
		suffix: "nahari.kochi.jp",
		reversed: "pj.ihcok.irahan"
	},
	{
		suffix: "naie.hokkaido.jp",
		reversed: "pj.odiakkoh.eian"
	},
	{
		suffix: "naka.hiroshima.jp",
		reversed: "pj.amihsorih.akan"
	},
	{
		suffix: "naka.ibaraki.jp",
		reversed: "pj.ikarabi.akan"
	},
	{
		suffix: "nakadomari.aomori.jp",
		reversed: "pj.iromoa.iramodakan"
	},
	{
		suffix: "nakagawa.fukuoka.jp",
		reversed: "pj.akoukuf.awagakan"
	},
	{
		suffix: "nakagawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awagakan"
	},
	{
		suffix: "nakagawa.nagano.jp",
		reversed: "pj.onagan.awagakan"
	},
	{
		suffix: "nakagawa.tokushima.jp",
		reversed: "pj.amihsukot.awagakan"
	},
	{
		suffix: "nakagusuku.okinawa.jp",
		reversed: "pj.awaniko.ukusugakan"
	},
	{
		suffix: "nakagyo.kyoto.jp",
		reversed: "pj.otoyk.oygakan"
	},
	{
		suffix: "nakai.kanagawa.jp",
		reversed: "pj.awaganak.iakan"
	},
	{
		suffix: "nakama.fukuoka.jp",
		reversed: "pj.akoukuf.amakan"
	},
	{
		suffix: "nakamichi.yamanashi.jp",
		reversed: "pj.ihsanamay.ihcimakan"
	},
	{
		suffix: "nakamura.kochi.jp",
		reversed: "pj.ihcok.arumakan"
	},
	{
		suffix: "nakaniikawa.toyama.jp",
		reversed: "pj.amayot.awakiinakan"
	},
	{
		suffix: "nakano.nagano.jp",
		reversed: "pj.onagan.onakan"
	},
	{
		suffix: "nakano.tokyo.jp",
		reversed: "pj.oykot.onakan"
	},
	{
		suffix: "nakanojo.gunma.jp",
		reversed: "pj.amnug.ojonakan"
	},
	{
		suffix: "nakanoto.ishikawa.jp",
		reversed: "pj.awakihsi.otonakan"
	},
	{
		suffix: "nakasatsunai.hokkaido.jp",
		reversed: "pj.odiakkoh.ianustasakan"
	},
	{
		suffix: "nakatane.kagoshima.jp",
		reversed: "pj.amihsogak.enatakan"
	},
	{
		suffix: "nakatombetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebmotakan"
	},
	{
		suffix: "nakatsugawa.gifu.jp",
		reversed: "pj.ufig.awagustakan"
	},
	{
		suffix: "nakayama.yamagata.jp",
		reversed: "pj.atagamay.amayakan"
	},
	{
		suffix: "nakijin.okinawa.jp",
		reversed: "pj.awaniko.nijikan"
	},
	{
		suffix: "naklo.pl",
		reversed: "lp.olkan"
	},
	{
		suffix: "nalchik.ru",
		reversed: "ur.kihclan"
	},
	{
		suffix: "nalchik.su",
		reversed: "us.kihclan"
	},
	{
		suffix: "namaste.jp",
		reversed: "pj.etsaman"
	},
	{
		suffix: "namdalseid.no",
		reversed: "on.diesladman"
	},
	{
		suffix: "name",
		reversed: "eman"
	},
	{
		suffix: "name.az",
		reversed: "za.eman"
	},
	{
		suffix: "name.eg",
		reversed: "ge.eman"
	},
	{
		suffix: "name.et",
		reversed: "te.eman"
	},
	{
		suffix: "name.fj",
		reversed: "jf.eman"
	},
	{
		suffix: "name.hr",
		reversed: "rh.eman"
	},
	{
		suffix: "name.jo",
		reversed: "oj.eman"
	},
	{
		suffix: "name.mk",
		reversed: "km.eman"
	},
	{
		suffix: "name.mv",
		reversed: "vm.eman"
	},
	{
		suffix: "name.my",
		reversed: "ym.eman"
	},
	{
		suffix: "name.na",
		reversed: "an.eman"
	},
	{
		suffix: "name.ng",
		reversed: "gn.eman"
	},
	{
		suffix: "name.pm",
		reversed: "mp.eman"
	},
	{
		suffix: "name.pr",
		reversed: "rp.eman"
	},
	{
		suffix: "name.qa",
		reversed: "aq.eman"
	},
	{
		suffix: "name.tj",
		reversed: "jt.eman"
	},
	{
		suffix: "name.tr",
		reversed: "rt.eman"
	},
	{
		suffix: "name.tt",
		reversed: "tt.eman"
	},
	{
		suffix: "name.vn",
		reversed: "nv.eman"
	},
	{
		suffix: "namegata.ibaraki.jp",
		reversed: "pj.ikarabi.atageman"
	},
	{
		suffix: "namegawa.saitama.jp",
		reversed: "pj.amatias.awageman"
	},
	{
		suffix: "namerikawa.toyama.jp",
		reversed: "pj.amayot.awakireman"
	},
	{
		suffix: "namie.fukushima.jp",
		reversed: "pj.amihsukuf.eiman"
	},
	{
		suffix: "namikata.ehime.jp",
		reversed: "pj.emihe.atakiman"
	},
	{
		suffix: "namsos.no",
		reversed: "on.sosman"
	},
	{
		suffix: "namsskogan.no",
		reversed: "on.nagokssman"
	},
	{
		suffix: "nanae.hokkaido.jp",
		reversed: "pj.odiakkoh.eanan"
	},
	{
		suffix: "nanao.ishikawa.jp",
		reversed: "pj.awakihsi.oanan"
	},
	{
		suffix: "nanbu.tottori.jp",
		reversed: "pj.irottot.ubnan"
	},
	{
		suffix: "nanbu.yamanashi.jp",
		reversed: "pj.ihsanamay.ubnan"
	},
	{
		suffix: "nango.fukushima.jp",
		reversed: "pj.amihsukuf.ognan"
	},
	{
		suffix: "nanjo.okinawa.jp",
		reversed: "pj.awaniko.ojnan"
	},
	{
		suffix: "nankoku.kochi.jp",
		reversed: "pj.ihcok.ukoknan"
	},
	{
		suffix: "nanmoku.gunma.jp",
		reversed: "pj.amnug.ukomnan"
	},
	{
		suffix: "nannestad.no",
		reversed: "on.datsennan"
	},
	{
		suffix: "nanporo.hokkaido.jp",
		reversed: "pj.odiakkoh.oropnan"
	},
	{
		suffix: "nantan.kyoto.jp",
		reversed: "pj.otoyk.natnan"
	},
	{
		suffix: "nanto.toyama.jp",
		reversed: "pj.amayot.otnan"
	},
	{
		suffix: "nanyo.yamagata.jp",
		reversed: "pj.atagamay.oynan"
	},
	{
		suffix: "naoshima.kagawa.jp",
		reversed: "pj.awagak.amihsoan"
	},
	{
		suffix: "naples.it",
		reversed: "ti.selpan"
	},
	{
		suffix: "napoli.it",
		reversed: "ti.ilopan"
	},
	{
		suffix: "nara.jp",
		reversed: "pj.aran"
	},
	{
		suffix: "nara.nara.jp",
		reversed: "pj.aran.aran"
	},
	{
		suffix: "narashino.chiba.jp",
		reversed: "pj.abihc.onihsaran"
	},
	{
		suffix: "narita.chiba.jp",
		reversed: "pj.abihc.atiran"
	},
	{
		suffix: "naroy.no",
		reversed: "on.yoran"
	},
	{
		suffix: "narusawa.yamanashi.jp",
		reversed: "pj.ihsanamay.awasuran"
	},
	{
		suffix: "naruto.tokushima.jp",
		reversed: "pj.amihsukot.oturan"
	},
	{
		suffix: "narviika.no",
		reversed: "on.akiivran"
	},
	{
		suffix: "narvik.no",
		reversed: "on.kivran"
	},
	{
		suffix: "nasu.tochigi.jp",
		reversed: "pj.igihcot.usan"
	},
	{
		suffix: "nasushiobara.tochigi.jp",
		reversed: "pj.igihcot.araboihsusan"
	},
	{
		suffix: "nat.tn",
		reversed: "nt.tan"
	},
	{
		suffix: "natal.br",
		reversed: "rb.latan"
	},
	{
		suffix: "national.museum",
		reversed: "muesum.lanoitan"
	},
	{
		suffix: "nationalfirearms.museum",
		reversed: "muesum.smraeriflanoitan"
	},
	{
		suffix: "nationalheritage.museum",
		reversed: "muesum.egatirehlanoitan"
	},
	{
		suffix: "nativeamerican.museum",
		reversed: "muesum.naciremaevitan"
	},
	{
		suffix: "natori.miyagi.jp",
		reversed: "pj.igayim.irotan"
	},
	{
		suffix: "natura",
		reversed: "arutan"
	},
	{
		suffix: "natural.bo",
		reversed: "ob.larutan"
	},
	{
		suffix: "naturalhistory.museum",
		reversed: "muesum.yrotsihlarutan"
	},
	{
		suffix: "naturalhistorymuseum.museum",
		reversed: "muesum.muesumyrotsihlarutan"
	},
	{
		suffix: "naturalsciences.museum",
		reversed: "muesum.secneicslarutan"
	},
	{
		suffix: "naturbruksgymn.se",
		reversed: "es.nmygskurbrutan"
	},
	{
		suffix: "nature.museum",
		reversed: "muesum.erutan"
	},
	{
		suffix: "naturhistorisches.museum",
		reversed: "muesum.sehcsirotsihrutan"
	},
	{
		suffix: "natuurwetenschappen.museum",
		reversed: "muesum.neppahcsnetewruutan"
	},
	{
		suffix: "naumburg.museum",
		reversed: "muesum.grubmuan"
	},
	{
		suffix: "naustdal.no",
		reversed: "on.ladtsuan"
	},
	{
		suffix: "naval.museum",
		reversed: "muesum.lavan"
	},
	{
		suffix: "navigation.aero",
		reversed: "orea.noitagivan"
	},
	{
		suffix: "navoi.su",
		reversed: "us.iovan"
	},
	{
		suffix: "navuotna.no",
		reversed: "on.antouvan"
	},
	{
		suffix: "navy",
		reversed: "yvan"
	},
	{
		suffix: "nayoro.hokkaido.jp",
		reversed: "pj.odiakkoh.oroyan"
	},
	{
		suffix: "nb.ca",
		reversed: "ac.bn"
	},
	{
		suffix: "nba",
		reversed: "abn"
	},
	{
		suffix: "nc",
		reversed: "cn"
	},
	{
		suffix: "nc.tr",
		reversed: "rt.cn"
	},
	{
		suffix: "nc.us",
		reversed: "su.cn"
	},
	{
		suffix: "nd.us",
		reversed: "su.dn"
	},
	{
		suffix: "ne",
		reversed: "en"
	},
	{
		suffix: "ne.jp",
		reversed: "pj.en"
	},
	{
		suffix: "ne.ke",
		reversed: "ek.en"
	},
	{
		suffix: "ne.kr",
		reversed: "rk.en"
	},
	{
		suffix: "ne.pw",
		reversed: "wp.en"
	},
	{
		suffix: "ne.tz",
		reversed: "zt.en"
	},
	{
		suffix: "ne.ug",
		reversed: "gu.en"
	},
	{
		suffix: "ne.us",
		reversed: "su.en"
	},
	{
		suffix: "neat-url.com",
		reversed: "moc.lru-taen"
	},
	{
		suffix: "nebraska.museum",
		reversed: "muesum.aksarben"
	},
	{
		suffix: "nec",
		reversed: "cen"
	},
	{
		suffix: "nedre-eiker.no",
		reversed: "on.rekie-erden"
	},
	{
		suffix: "neko.am",
		reversed: "ma.oken"
	},
	{
		suffix: "nemuro.hokkaido.jp",
		reversed: "pj.odiakkoh.orumen"
	},
	{
		suffix: "nerdpol.ovh",
		reversed: "hvo.lopdren"
	},
	{
		suffix: "nerima.tokyo.jp",
		reversed: "pj.oykot.amiren"
	},
	{
		suffix: "nes.akershus.no",
		reversed: "on.suhsreka.sen"
	},
	{
		suffix: "nes.buskerud.no",
		reversed: "on.dureksub.sen"
	},
	{
		suffix: "nesna.no",
		reversed: "on.ansen"
	},
	{
		suffix: "nesodden.no",
		reversed: "on.neddosen"
	},
	{
		suffix: "nesoddtangen.no",
		reversed: "on.negnatddosen"
	},
	{
		suffix: "nesseby.no",
		reversed: "on.ybessen"
	},
	{
		suffix: "nesset.no",
		reversed: "on.tessen"
	},
	{
		suffix: "net",
		reversed: "ten"
	},
	{
		suffix: "net-freaks.com",
		reversed: "moc.skaerf-ten"
	},
	{
		suffix: "net.ac",
		reversed: "ca.ten"
	},
	{
		suffix: "net.ae",
		reversed: "ea.ten"
	},
	{
		suffix: "net.af",
		reversed: "fa.ten"
	},
	{
		suffix: "net.ag",
		reversed: "ga.ten"
	},
	{
		suffix: "net.ai",
		reversed: "ia.ten"
	},
	{
		suffix: "net.al",
		reversed: "la.ten"
	},
	{
		suffix: "net.am",
		reversed: "ma.ten"
	},
	{
		suffix: "net.ar",
		reversed: "ra.ten"
	},
	{
		suffix: "net.au",
		reversed: "ua.ten"
	},
	{
		suffix: "net.az",
		reversed: "za.ten"
	},
	{
		suffix: "net.ba",
		reversed: "ab.ten"
	},
	{
		suffix: "net.bb",
		reversed: "bb.ten"
	},
	{
		suffix: "net.bh",
		reversed: "hb.ten"
	},
	{
		suffix: "net.bm",
		reversed: "mb.ten"
	},
	{
		suffix: "net.bn",
		reversed: "nb.ten"
	},
	{
		suffix: "net.bo",
		reversed: "ob.ten"
	},
	{
		suffix: "net.br",
		reversed: "rb.ten"
	},
	{
		suffix: "net.bs",
		reversed: "sb.ten"
	},
	{
		suffix: "net.bt",
		reversed: "tb.ten"
	},
	{
		suffix: "net.bz",
		reversed: "zb.ten"
	},
	{
		suffix: "net.ci",
		reversed: "ic.ten"
	},
	{
		suffix: "net.cm",
		reversed: "mc.ten"
	},
	{
		suffix: "net.cn",
		reversed: "nc.ten"
	},
	{
		suffix: "net.co",
		reversed: "oc.ten"
	},
	{
		suffix: "net.cu",
		reversed: "uc.ten"
	},
	{
		suffix: "net.cw",
		reversed: "wc.ten"
	},
	{
		suffix: "net.cy",
		reversed: "yc.ten"
	},
	{
		suffix: "net.dm",
		reversed: "md.ten"
	},
	{
		suffix: "net.do",
		reversed: "od.ten"
	},
	{
		suffix: "net.dz",
		reversed: "zd.ten"
	},
	{
		suffix: "net.ec",
		reversed: "ce.ten"
	},
	{
		suffix: "net.eg",
		reversed: "ge.ten"
	},
	{
		suffix: "net.et",
		reversed: "te.ten"
	},
	{
		suffix: "net.eu.org",
		reversed: "gro.ue.ten"
	},
	{
		suffix: "net.fj",
		reversed: "jf.ten"
	},
	{
		suffix: "net.fm",
		reversed: "mf.ten"
	},
	{
		suffix: "net.ge",
		reversed: "eg.ten"
	},
	{
		suffix: "net.gg",
		reversed: "gg.ten"
	},
	{
		suffix: "net.gl",
		reversed: "lg.ten"
	},
	{
		suffix: "net.gn",
		reversed: "ng.ten"
	},
	{
		suffix: "net.gp",
		reversed: "pg.ten"
	},
	{
		suffix: "net.gr",
		reversed: "rg.ten"
	},
	{
		suffix: "net.gt",
		reversed: "tg.ten"
	},
	{
		suffix: "net.gu",
		reversed: "ug.ten"
	},
	{
		suffix: "net.gy",
		reversed: "yg.ten"
	},
	{
		suffix: "net.hk",
		reversed: "kh.ten"
	},
	{
		suffix: "net.hn",
		reversed: "nh.ten"
	},
	{
		suffix: "net.ht",
		reversed: "th.ten"
	},
	{
		suffix: "net.id",
		reversed: "di.ten"
	},
	{
		suffix: "net.il",
		reversed: "li.ten"
	},
	{
		suffix: "net.im",
		reversed: "mi.ten"
	},
	{
		suffix: "net.in",
		reversed: "ni.ten"
	},
	{
		suffix: "net.iq",
		reversed: "qi.ten"
	},
	{
		suffix: "net.ir",
		reversed: "ri.ten"
	},
	{
		suffix: "net.is",
		reversed: "si.ten"
	},
	{
		suffix: "net.je",
		reversed: "ej.ten"
	},
	{
		suffix: "net.jo",
		reversed: "oj.ten"
	},
	{
		suffix: "net.kg",
		reversed: "gk.ten"
	},
	{
		suffix: "net.ki",
		reversed: "ik.ten"
	},
	{
		suffix: "net.kn",
		reversed: "nk.ten"
	},
	{
		suffix: "net.kw",
		reversed: "wk.ten"
	},
	{
		suffix: "net.ky",
		reversed: "yk.ten"
	},
	{
		suffix: "net.kz",
		reversed: "zk.ten"
	},
	{
		suffix: "net.la",
		reversed: "al.ten"
	},
	{
		suffix: "net.lb",
		reversed: "bl.ten"
	},
	{
		suffix: "net.lc",
		reversed: "cl.ten"
	},
	{
		suffix: "net.lk",
		reversed: "kl.ten"
	},
	{
		suffix: "net.lr",
		reversed: "rl.ten"
	},
	{
		suffix: "net.ls",
		reversed: "sl.ten"
	},
	{
		suffix: "net.lv",
		reversed: "vl.ten"
	},
	{
		suffix: "net.ly",
		reversed: "yl.ten"
	},
	{
		suffix: "net.ma",
		reversed: "am.ten"
	},
	{
		suffix: "net.me",
		reversed: "em.ten"
	},
	{
		suffix: "net.mk",
		reversed: "km.ten"
	},
	{
		suffix: "net.ml",
		reversed: "lm.ten"
	},
	{
		suffix: "net.mo",
		reversed: "om.ten"
	},
	{
		suffix: "net.ms",
		reversed: "sm.ten"
	},
	{
		suffix: "net.mt",
		reversed: "tm.ten"
	},
	{
		suffix: "net.mu",
		reversed: "um.ten"
	},
	{
		suffix: "net.mv",
		reversed: "vm.ten"
	},
	{
		suffix: "net.mw",
		reversed: "wm.ten"
	},
	{
		suffix: "net.mx",
		reversed: "xm.ten"
	},
	{
		suffix: "net.my",
		reversed: "ym.ten"
	},
	{
		suffix: "net.mz",
		reversed: "zm.ten"
	},
	{
		suffix: "net.nf",
		reversed: "fn.ten"
	},
	{
		suffix: "net.ng",
		reversed: "gn.ten"
	},
	{
		suffix: "net.ni",
		reversed: "in.ten"
	},
	{
		suffix: "net.nr",
		reversed: "rn.ten"
	},
	{
		suffix: "net.nz",
		reversed: "zn.ten"
	},
	{
		suffix: "net.om",
		reversed: "mo.ten"
	},
	{
		suffix: "net.pa",
		reversed: "ap.ten"
	},
	{
		suffix: "net.pe",
		reversed: "ep.ten"
	},
	{
		suffix: "net.ph",
		reversed: "hp.ten"
	},
	{
		suffix: "net.pk",
		reversed: "kp.ten"
	},
	{
		suffix: "net.pl",
		reversed: "lp.ten"
	},
	{
		suffix: "net.pn",
		reversed: "np.ten"
	},
	{
		suffix: "net.pr",
		reversed: "rp.ten"
	},
	{
		suffix: "net.ps",
		reversed: "sp.ten"
	},
	{
		suffix: "net.pt",
		reversed: "tp.ten"
	},
	{
		suffix: "net.py",
		reversed: "yp.ten"
	},
	{
		suffix: "net.qa",
		reversed: "aq.ten"
	},
	{
		suffix: "net.ru",
		reversed: "ur.ten"
	},
	{
		suffix: "net.rw",
		reversed: "wr.ten"
	},
	{
		suffix: "net.sa",
		reversed: "as.ten"
	},
	{
		suffix: "net.sb",
		reversed: "bs.ten"
	},
	{
		suffix: "net.sc",
		reversed: "cs.ten"
	},
	{
		suffix: "net.sd",
		reversed: "ds.ten"
	},
	{
		suffix: "net.sg",
		reversed: "gs.ten"
	},
	{
		suffix: "net.sh",
		reversed: "hs.ten"
	},
	{
		suffix: "net.sl",
		reversed: "ls.ten"
	},
	{
		suffix: "net.so",
		reversed: "os.ten"
	},
	{
		suffix: "net.ss",
		reversed: "ss.ten"
	},
	{
		suffix: "net.st",
		reversed: "ts.ten"
	},
	{
		suffix: "net.sy",
		reversed: "ys.ten"
	},
	{
		suffix: "net.th",
		reversed: "ht.ten"
	},
	{
		suffix: "net.tj",
		reversed: "jt.ten"
	},
	{
		suffix: "net.tm",
		reversed: "mt.ten"
	},
	{
		suffix: "net.tn",
		reversed: "nt.ten"
	},
	{
		suffix: "net.to",
		reversed: "ot.ten"
	},
	{
		suffix: "net.tr",
		reversed: "rt.ten"
	},
	{
		suffix: "net.tt",
		reversed: "tt.ten"
	},
	{
		suffix: "net.tw",
		reversed: "wt.ten"
	},
	{
		suffix: "net.ua",
		reversed: "au.ten"
	},
	{
		suffix: "net.uk",
		reversed: "ku.ten"
	},
	{
		suffix: "net.uy",
		reversed: "yu.ten"
	},
	{
		suffix: "net.uz",
		reversed: "zu.ten"
	},
	{
		suffix: "net.vc",
		reversed: "cv.ten"
	},
	{
		suffix: "net.ve",
		reversed: "ev.ten"
	},
	{
		suffix: "net.vi",
		reversed: "iv.ten"
	},
	{
		suffix: "net.vn",
		reversed: "nv.ten"
	},
	{
		suffix: "net.vu",
		reversed: "uv.ten"
	},
	{
		suffix: "net.ws",
		reversed: "sw.ten"
	},
	{
		suffix: "net.ye",
		reversed: "ey.ten"
	},
	{
		suffix: "net.za",
		reversed: "az.ten"
	},
	{
		suffix: "net.zm",
		reversed: "mz.ten"
	},
	{
		suffix: "netbank",
		reversed: "knabten"
	},
	{
		suffix: "netflix",
		reversed: "xilften"
	},
	{
		suffix: "netlify.app",
		reversed: "ppa.yfilten"
	},
	{
		suffix: "network",
		reversed: "krowten"
	},
	{
		suffix: "neues.museum",
		reversed: "muesum.seuen"
	},
	{
		suffix: "neustar",
		reversed: "ratsuen"
	},
	{
		suffix: "new",
		reversed: "wen"
	},
	{
		suffix: "newhampshire.museum",
		reversed: "muesum.erihspmahwen"
	},
	{
		suffix: "newjersey.museum",
		reversed: "muesum.yesrejwen"
	},
	{
		suffix: "newmexico.museum",
		reversed: "muesum.ocixemwen"
	},
	{
		suffix: "newport.museum",
		reversed: "muesum.tropwen"
	},
	{
		suffix: "news",
		reversed: "swen"
	},
	{
		suffix: "news.hu",
		reversed: "uh.swen"
	},
	{
		suffix: "newspaper.museum",
		reversed: "muesum.repapswen"
	},
	{
		suffix: "newyork.museum",
		reversed: "muesum.kroywen"
	},
	{
		suffix: "next",
		reversed: "txen"
	},
	{
		suffix: "nextdirect",
		reversed: "tceridtxen"
	},
	{
		suffix: "nexus",
		reversed: "suxen"
	},
	{
		suffix: "neyagawa.osaka.jp",
		reversed: "pj.akaso.awagayen"
	},
	{
		suffix: "nf",
		reversed: "fn"
	},
	{
		suffix: "nf.ca",
		reversed: "ac.fn"
	},
	{
		suffix: "nfl",
		reversed: "lfn"
	},
	{
		suffix: "nflfan.org",
		reversed: "gro.naflfn"
	},
	{
		suffix: "nfshost.com",
		reversed: "moc.tsohsfn"
	},
	{
		suffix: "ng",
		reversed: "gn"
	},
	{
		suffix: "ng.eu.org",
		reversed: "gro.ue.gn"
	},
	{
		suffix: "ngo",
		reversed: "ogn"
	},
	{
		suffix: "ngo.lk",
		reversed: "kl.ogn"
	},
	{
		suffix: "ngo.ng",
		reversed: "gn.ogn"
	},
	{
		suffix: "ngo.ph",
		reversed: "hp.ogn"
	},
	{
		suffix: "ngo.za",
		reversed: "az.ogn"
	},
	{
		suffix: "ngrok.io",
		reversed: "oi.korgn"
	},
	{
		suffix: "nh-serv.co.uk",
		reversed: "ku.oc.vres-hn"
	},
	{
		suffix: "nh.us",
		reversed: "su.hn"
	},
	{
		suffix: "nhk",
		reversed: "khn"
	},
	{
		suffix: "nhlfan.net",
		reversed: "ten.naflhn"
	},
	{
		suffix: "nhs.uk",
		reversed: "ku.shn"
	},
	{
		suffix: "ni",
		reversed: "in"
	},
	{
		suffix: "nic.in",
		reversed: "ni.cin"
	},
	{
		suffix: "nic.tj",
		reversed: "jt.cin"
	},
	{
		suffix: "nic.za",
		reversed: "az.cin"
	},
	{
		suffix: "nichinan.miyazaki.jp",
		reversed: "pj.ikazayim.nanihcin"
	},
	{
		suffix: "nichinan.tottori.jp",
		reversed: "pj.irottot.nanihcin"
	},
	{
		suffix: "nico",
		reversed: "ocin"
	},
	{
		suffix: "nid.io",
		reversed: "oi.din"
	},
	{
		suffix: "niepce.museum",
		reversed: "muesum.ecpein"
	},
	{
		suffix: "nieruchomosci.pl",
		reversed: "lp.icsomohcurein"
	},
	{
		suffix: "niigata.jp",
		reversed: "pj.atagiin"
	},
	{
		suffix: "niigata.niigata.jp",
		reversed: "pj.atagiin.atagiin"
	},
	{
		suffix: "niihama.ehime.jp",
		reversed: "pj.emihe.amahiin"
	},
	{
		suffix: "niikappu.hokkaido.jp",
		reversed: "pj.odiakkoh.uppakiin"
	},
	{
		suffix: "niimi.okayama.jp",
		reversed: "pj.amayako.imiin"
	},
	{
		suffix: "niiza.saitama.jp",
		reversed: "pj.amatias.aziin"
	},
	{
		suffix: "nikaho.akita.jp",
		reversed: "pj.atika.ohakin"
	},
	{
		suffix: "nike",
		reversed: "ekin"
	},
	{
		suffix: "niki.hokkaido.jp",
		reversed: "pj.odiakkoh.ikin"
	},
	{
		suffix: "nikita.jp",
		reversed: "pj.atikin"
	},
	{
		suffix: "nikko.tochigi.jp",
		reversed: "pj.igihcot.okkin"
	},
	{
		suffix: "nikolaev.ua",
		reversed: "au.vealokin"
	},
	{
		suffix: "nikon",
		reversed: "nokin"
	},
	{
		suffix: "ninja",
		reversed: "ajnin"
	},
	{
		suffix: "ninohe.iwate.jp",
		reversed: "pj.etawi.ehonin"
	},
	{
		suffix: "ninomiya.kanagawa.jp",
		reversed: "pj.awaganak.ayimonin"
	},
	{
		suffix: "nirasaki.yamanashi.jp",
		reversed: "pj.ihsanamay.ikasarin"
	},
	{
		suffix: "nis.za",
		reversed: "az.sin"
	},
	{
		suffix: "nishi.fukuoka.jp",
		reversed: "pj.akoukuf.ihsin"
	},
	{
		suffix: "nishi.osaka.jp",
		reversed: "pj.akaso.ihsin"
	},
	{
		suffix: "nishiaizu.fukushima.jp",
		reversed: "pj.amihsukuf.uziaihsin"
	},
	{
		suffix: "nishiarita.saga.jp",
		reversed: "pj.agas.atiraihsin"
	},
	{
		suffix: "nishiawakura.okayama.jp",
		reversed: "pj.amayako.arukawaihsin"
	},
	{
		suffix: "nishiazai.shiga.jp",
		reversed: "pj.agihs.iazaihsin"
	},
	{
		suffix: "nishigo.fukushima.jp",
		reversed: "pj.amihsukuf.ogihsin"
	},
	{
		suffix: "nishihara.kumamoto.jp",
		reversed: "pj.otomamuk.arahihsin"
	},
	{
		suffix: "nishihara.okinawa.jp",
		reversed: "pj.awaniko.arahihsin"
	},
	{
		suffix: "nishiizu.shizuoka.jp",
		reversed: "pj.akouzihs.uziihsin"
	},
	{
		suffix: "nishikata.tochigi.jp",
		reversed: "pj.igihcot.atakihsin"
	},
	{
		suffix: "nishikatsura.yamanashi.jp",
		reversed: "pj.ihsanamay.arustakihsin"
	},
	{
		suffix: "nishikawa.yamagata.jp",
		reversed: "pj.atagamay.awakihsin"
	},
	{
		suffix: "nishimera.miyazaki.jp",
		reversed: "pj.ikazayim.aremihsin"
	},
	{
		suffix: "nishinomiya.hyogo.jp",
		reversed: "pj.ogoyh.ayimonihsin"
	},
	{
		suffix: "nishinoomote.kagoshima.jp",
		reversed: "pj.amihsogak.etomoonihsin"
	},
	{
		suffix: "nishinoshima.shimane.jp",
		reversed: "pj.enamihs.amihsonihsin"
	},
	{
		suffix: "nishio.aichi.jp",
		reversed: "pj.ihcia.oihsin"
	},
	{
		suffix: "nishiokoppe.hokkaido.jp",
		reversed: "pj.odiakkoh.eppokoihsin"
	},
	{
		suffix: "nishitosa.kochi.jp",
		reversed: "pj.ihcok.asotihsin"
	},
	{
		suffix: "nishiwaki.hyogo.jp",
		reversed: "pj.ogoyh.ikawihsin"
	},
	{
		suffix: "nissan",
		reversed: "nassin"
	},
	{
		suffix: "nissay",
		reversed: "yassin"
	},
	{
		suffix: "nissedal.no",
		reversed: "on.ladessin"
	},
	{
		suffix: "nisshin.aichi.jp",
		reversed: "pj.ihcia.nihssin"
	},
	{
		suffix: "niteroi.br",
		reversed: "rb.ioretin"
	},
	{
		suffix: "nittedal.no",
		reversed: "on.ladettin"
	},
	{
		suffix: "niyodogawa.kochi.jp",
		reversed: "pj.ihcok.awagodoyin"
	},
	{
		suffix: "nj.us",
		reversed: "su.jn"
	},
	{
		suffix: "njs.jelastic.vps-host.net",
		reversed: "ten.tsoh-spv.citsalej.sjn"
	},
	{
		suffix: "nl",
		reversed: "ln"
	},
	{
		suffix: "nl-ams-1.baremetal.scw.cloud",
		reversed: "duolc.wcs.latemerab.1-sma-ln"
	},
	{
		suffix: "nl.ca",
		reversed: "ac.ln"
	},
	{
		suffix: "nl.ci",
		reversed: "ic.ln"
	},
	{
		suffix: "nl.eu.org",
		reversed: "gro.ue.ln"
	},
	{
		suffix: "nl.no",
		reversed: "on.ln"
	},
	{
		suffix: "nm.cn",
		reversed: "nc.mn"
	},
	{
		suffix: "nm.us",
		reversed: "su.mn"
	},
	{
		suffix: "no",
		reversed: "on"
	},
	{
		suffix: "no-ip.biz",
		reversed: "zib.pi-on"
	},
	{
		suffix: "no-ip.ca",
		reversed: "ac.pi-on"
	},
	{
		suffix: "no-ip.co.uk",
		reversed: "ku.oc.pi-on"
	},
	{
		suffix: "no-ip.info",
		reversed: "ofni.pi-on"
	},
	{
		suffix: "no-ip.net",
		reversed: "ten.pi-on"
	},
	{
		suffix: "no-ip.org",
		reversed: "gro.pi-on"
	},
	{
		suffix: "no.com",
		reversed: "moc.on"
	},
	{
		suffix: "no.eu.org",
		reversed: "gro.ue.on"
	},
	{
		suffix: "no.it",
		reversed: "ti.on"
	},
	{
		suffix: "nobeoka.miyazaki.jp",
		reversed: "pj.ikazayim.akoebon"
	},
	{
		suffix: "noboribetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebirobon"
	},
	{
		suffix: "nobushi.jp",
		reversed: "pj.ihsubon"
	},
	{
		suffix: "noda.chiba.jp",
		reversed: "pj.abihc.adon"
	},
	{
		suffix: "noda.iwate.jp",
		reversed: "pj.etawi.adon"
	},
	{
		suffix: "nodes.k8s.fr-par.scw.cloud",
		reversed: "duolc.wcs.rap-rf.s8k.sedon"
	},
	{
		suffix: "nodes.k8s.nl-ams.scw.cloud",
		reversed: "duolc.wcs.sma-ln.s8k.sedon"
	},
	{
		suffix: "nodes.k8s.pl-waw.scw.cloud",
		reversed: "duolc.wcs.waw-lp.s8k.sedon"
	},
	{
		suffix: "nog.community",
		reversed: "ytinummoc.gon"
	},
	{
		suffix: "nogata.fukuoka.jp",
		reversed: "pj.akoukuf.atagon"
	},
	{
		suffix: "nogi.tochigi.jp",
		reversed: "pj.igihcot.igon"
	},
	{
		suffix: "noheji.aomori.jp",
		reversed: "pj.iromoa.ijehon"
	},
	{
		suffix: "noho.st",
		reversed: "ts.ohon"
	},
	{
		suffix: "nohost.me",
		reversed: "em.tsohon"
	},
	{
		suffix: "noip.me",
		reversed: "em.pion"
	},
	{
		suffix: "noip.us",
		reversed: "su.pion"
	},
	{
		suffix: "nokia",
		reversed: "aikon"
	},
	{
		suffix: "nom.ad",
		reversed: "da.mon"
	},
	{
		suffix: "nom.ag",
		reversed: "ga.mon"
	},
	{
		suffix: "nom.co",
		reversed: "oc.mon"
	},
	{
		suffix: "nom.es",
		reversed: "se.mon"
	},
	{
		suffix: "nom.fr",
		reversed: "rf.mon"
	},
	{
		suffix: "nom.km",
		reversed: "mk.mon"
	},
	{
		suffix: "nom.mg",
		reversed: "gm.mon"
	},
	{
		suffix: "nom.nc",
		reversed: "cn.mon"
	},
	{
		suffix: "nom.ni",
		reversed: "in.mon"
	},
	{
		suffix: "nom.pa",
		reversed: "ap.mon"
	},
	{
		suffix: "nom.pe",
		reversed: "ep.mon"
	},
	{
		suffix: "nom.pl",
		reversed: "lp.mon"
	},
	{
		suffix: "nom.re",
		reversed: "er.mon"
	},
	{
		suffix: "nom.ro",
		reversed: "or.mon"
	},
	{
		suffix: "nom.tm",
		reversed: "mt.mon"
	},
	{
		suffix: "nom.ve",
		reversed: "ev.mon"
	},
	{
		suffix: "nom.za",
		reversed: "az.mon"
	},
	{
		suffix: "nombre.bo",
		reversed: "ob.erbmon"
	},
	{
		suffix: "nome.cv",
		reversed: "vc.emon"
	},
	{
		suffix: "nome.pt",
		reversed: "tp.emon"
	},
	{
		suffix: "nomi.ishikawa.jp",
		reversed: "pj.awakihsi.imon"
	},
	{
		suffix: "nonoichi.ishikawa.jp",
		reversed: "pj.awakihsi.ihcionon"
	},
	{
		suffix: "noop.app",
		reversed: "ppa.poon"
	},
	{
		suffix: "noor.jp",
		reversed: "pj.roon"
	},
	{
		suffix: "nord-aurdal.no",
		reversed: "on.ladrua-dron"
	},
	{
		suffix: "nord-fron.no",
		reversed: "on.norf-dron"
	},
	{
		suffix: "nord-odal.no",
		reversed: "on.lado-dron"
	},
	{
		suffix: "norddal.no",
		reversed: "on.laddron"
	},
	{
		suffix: "nordeste-idc.saveincloud.net",
		reversed: "ten.duolcnievas.cdi-etsedron"
	},
	{
		suffix: "nordkapp.no",
		reversed: "on.ppakdron"
	},
	{
		suffix: "nordre-land.no",
		reversed: "on.dnal-erdron"
	},
	{
		suffix: "nordreisa.no",
		reversed: "on.asierdron"
	},
	{
		suffix: "nore-og-uvdal.no",
		reversed: "on.ladvu-go-eron"
	},
	{
		suffix: "norfolk.museum",
		reversed: "muesum.klofron"
	},
	{
		suffix: "north-kazakhstan.su",
		reversed: "us.natshkazak-htron"
	},
	{
		suffix: "north.museum",
		reversed: "muesum.htron"
	},
	{
		suffix: "northwesternmutual",
		reversed: "lautumnretsewhtron"
	},
	{
		suffix: "norton",
		reversed: "notron"
	},
	{
		suffix: "nose.osaka.jp",
		reversed: "pj.akaso.eson"
	},
	{
		suffix: "nosegawa.nara.jp",
		reversed: "pj.aran.awageson"
	},
	{
		suffix: "noshiro.akita.jp",
		reversed: "pj.atika.orihson"
	},
	{
		suffix: "not.br",
		reversed: "rb.ton"
	},
	{
		suffix: "notaires.fr",
		reversed: "rf.seriaton"
	},
	{
		suffix: "notaires.km",
		reversed: "mk.seriaton"
	},
	{
		suffix: "noticeable.news",
		reversed: "swen.elbaeciton"
	},
	{
		suffix: "noticias.bo",
		reversed: "ob.saiciton"
	},
	{
		suffix: "noto.ishikawa.jp",
		reversed: "pj.awakihsi.oton"
	},
	{
		suffix: "notodden.no",
		reversed: "on.neddoton"
	},
	{
		suffix: "notogawa.shiga.jp",
		reversed: "pj.agihs.awagoton"
	},
	{
		suffix: "notteroy.no",
		reversed: "on.yoretton"
	},
	{
		suffix: "nov.ru",
		reversed: "ur.von"
	},
	{
		suffix: "nov.su",
		reversed: "us.von"
	},
	{
		suffix: "novara.it",
		reversed: "ti.aravon"
	},
	{
		suffix: "novecore.site",
		reversed: "etis.erocevon"
	},
	{
		suffix: "now",
		reversed: "won"
	},
	{
		suffix: "now-dns.net",
		reversed: "ten.snd-won"
	},
	{
		suffix: "now-dns.org",
		reversed: "gro.snd-won"
	},
	{
		suffix: "now-dns.top",
		reversed: "pot.snd-won"
	},
	{
		suffix: "now.sh",
		reversed: "hs.won"
	},
	{
		suffix: "nowaruda.pl",
		reversed: "lp.adurawon"
	},
	{
		suffix: "nowruz",
		reversed: "zurwon"
	},
	{
		suffix: "nowtv",
		reversed: "vtwon"
	},
	{
		suffix: "nozawaonsen.nagano.jp",
		reversed: "pj.onagan.nesnoawazon"
	},
	{
		suffix: "nr",
		reversed: "rn"
	},
	{
		suffix: "nra",
		reversed: "arn"
	},
	{
		suffix: "nrw",
		reversed: "wrn"
	},
	{
		suffix: "nrw.museum",
		reversed: "muesum.wrn"
	},
	{
		suffix: "ns.ca",
		reversed: "ac.sn"
	},
	{
		suffix: "nsn.us",
		reversed: "su.nsn"
	},
	{
		suffix: "nsupdate.info",
		reversed: "ofni.etadpusn"
	},
	{
		suffix: "nsw.au",
		reversed: "ua.wsn"
	},
	{
		suffix: "nsw.edu.au",
		reversed: "ua.ude.wsn"
	},
	{
		suffix: "nt.au",
		reversed: "ua.tn"
	},
	{
		suffix: "nt.ca",
		reversed: "ac.tn"
	},
	{
		suffix: "nt.edu.au",
		reversed: "ua.ude.tn"
	},
	{
		suffix: "nt.no",
		reversed: "on.tn"
	},
	{
		suffix: "nt.ro",
		reversed: "or.tn"
	},
	{
		suffix: "ntdll.top",
		reversed: "pot.lldtn"
	},
	{
		suffix: "ntr.br",
		reversed: "rb.rtn"
	},
	{
		suffix: "ntt",
		reversed: "ttn"
	},
	{
		suffix: "nu",
		reversed: "un"
	},
	{
		suffix: "nu.ca",
		reversed: "ac.un"
	},
	{
		suffix: "nu.it",
		reversed: "ti.un"
	},
	{
		suffix: "numata.gunma.jp",
		reversed: "pj.amnug.atamun"
	},
	{
		suffix: "numata.hokkaido.jp",
		reversed: "pj.odiakkoh.atamun"
	},
	{
		suffix: "numazu.shizuoka.jp",
		reversed: "pj.akouzihs.uzamun"
	},
	{
		suffix: "nuoro.it",
		reversed: "ti.oroun"
	},
	{
		suffix: "nv.us",
		reversed: "su.vn"
	},
	{
		suffix: "nx.cn",
		reversed: "nc.xn"
	},
	{
		suffix: "ny-1.paas.massivegrid.net",
		reversed: "ten.dirgevissam.saap.1-yn"
	},
	{
		suffix: "ny-2.paas.massivegrid.net",
		reversed: "ten.dirgevissam.saap.2-yn"
	},
	{
		suffix: "ny.us",
		reversed: "su.yn"
	},
	{
		suffix: "nyaa.am",
		reversed: "ma.aayn"
	},
	{
		suffix: "nyan.to",
		reversed: "ot.nayn"
	},
	{
		suffix: "nyc",
		reversed: "cyn"
	},
	{
		suffix: "nyc.mn",
		reversed: "nm.cyn"
	},
	{
		suffix: "nyc.museum",
		reversed: "muesum.cyn"
	},
	{
		suffix: "nyny.museum",
		reversed: "muesum.ynyn"
	},
	{
		suffix: "nysa.pl",
		reversed: "lp.asyn"
	},
	{
		suffix: "nyuzen.toyama.jp",
		reversed: "pj.amayot.nezuyn"
	},
	{
		suffix: "nz",
		reversed: "zn"
	},
	{
		suffix: "nz.basketball",
		reversed: "llabteksab.zn"
	},
	{
		suffix: "nz.eu.org",
		reversed: "gro.ue.zn"
	},
	{
		suffix: "návuotna.no",
		reversed: "on.awh-antouvn--nx"
	},
	{
		suffix: "nååmesjevuemie.no",
		reversed: "on.abct-eimeuvejsemn--nx"
	},
	{
		suffix: "nærøy.no",
		reversed: "on.g5aly-yrn--nx"
	},
	{
		suffix: "nøtterøy.no",
		reversed: "on.eayb-yrettn--nx"
	},
	{
		suffix: "o.bg",
		reversed: "gb.o"
	},
	{
		suffix: "o.se",
		reversed: "es.o"
	},
	{
		suffix: "oamishirasato.chiba.jp",
		reversed: "pj.abihc.otasarihsimao"
	},
	{
		suffix: "oarai.ibaraki.jp",
		reversed: "pj.ikarabi.iarao"
	},
	{
		suffix: "obama.fukui.jp",
		reversed: "pj.iukuf.amabo"
	},
	{
		suffix: "obama.nagasaki.jp",
		reversed: "pj.ikasagan.amabo"
	},
	{
		suffix: "obanazawa.yamagata.jp",
		reversed: "pj.atagamay.awazanabo"
	},
	{
		suffix: "obi",
		reversed: "ibo"
	},
	{
		suffix: "obihiro.hokkaido.jp",
		reversed: "pj.odiakkoh.orihibo"
	},
	{
		suffix: "obira.hokkaido.jp",
		reversed: "pj.odiakkoh.aribo"
	},
	{
		suffix: "obninsk.su",
		reversed: "us.ksninbo"
	},
	{
		suffix: "observer",
		reversed: "revresbo"
	},
	{
		suffix: "obu.aichi.jp",
		reversed: "pj.ihcia.ubo"
	},
	{
		suffix: "obuse.nagano.jp",
		reversed: "pj.onagan.esubo"
	},
	{
		suffix: "oceanographic.museum",
		reversed: "muesum.cihpargonaeco"
	},
	{
		suffix: "oceanographique.museum",
		reversed: "muesum.euqihpargonaeco"
	},
	{
		suffix: "ocelot.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.toleco"
	},
	{
		suffix: "ochi.kochi.jp",
		reversed: "pj.ihcok.ihco"
	},
	{
		suffix: "od.ua",
		reversed: "au.do"
	},
	{
		suffix: "odate.akita.jp",
		reversed: "pj.atika.etado"
	},
	{
		suffix: "odawara.kanagawa.jp",
		reversed: "pj.awaganak.arawado"
	},
	{
		suffix: "odda.no",
		reversed: "on.addo"
	},
	{
		suffix: "odesa.ua",
		reversed: "au.asedo"
	},
	{
		suffix: "odessa.ua",
		reversed: "au.assedo"
	},
	{
		suffix: "odo.br",
		reversed: "rb.odo"
	},
	{
		suffix: "oe.yamagata.jp",
		reversed: "pj.atagamay.eo"
	},
	{
		suffix: "of.by",
		reversed: "yb.fo"
	},
	{
		suffix: "of.je",
		reversed: "ej.fo"
	},
	{
		suffix: "of.no",
		reversed: "on.fo"
	},
	{
		suffix: "off.ai",
		reversed: "ia.ffo"
	},
	{
		suffix: "office",
		reversed: "eciffo"
	},
	{
		suffix: "office-on-the.net",
		reversed: "ten.eht-no-eciffo"
	},
	{
		suffix: "official.academy",
		reversed: "ymedaca.laiciffo"
	},
	{
		suffix: "official.ec",
		reversed: "ce.laiciffo"
	},
	{
		suffix: "ofunato.iwate.jp",
		reversed: "pj.etawi.otanufo"
	},
	{
		suffix: "og.ao",
		reversed: "oa.go"
	},
	{
		suffix: "og.it",
		reversed: "ti.go"
	},
	{
		suffix: "oga.akita.jp",
		reversed: "pj.atika.ago"
	},
	{
		suffix: "ogaki.gifu.jp",
		reversed: "pj.ufig.ikago"
	},
	{
		suffix: "ogano.saitama.jp",
		reversed: "pj.amatias.onago"
	},
	{
		suffix: "ogasawara.tokyo.jp",
		reversed: "pj.oykot.arawasago"
	},
	{
		suffix: "ogata.akita.jp",
		reversed: "pj.atika.atago"
	},
	{
		suffix: "ogawa.ibaraki.jp",
		reversed: "pj.ikarabi.awago"
	},
	{
		suffix: "ogawa.nagano.jp",
		reversed: "pj.onagan.awago"
	},
	{
		suffix: "ogawa.saitama.jp",
		reversed: "pj.amatias.awago"
	},
	{
		suffix: "ogawara.miyagi.jp",
		reversed: "pj.igayim.arawago"
	},
	{
		suffix: "ogi.saga.jp",
		reversed: "pj.agas.igo"
	},
	{
		suffix: "ogimi.okinawa.jp",
		reversed: "pj.awaniko.imigo"
	},
	{
		suffix: "ogliastra.it",
		reversed: "ti.artsailgo"
	},
	{
		suffix: "ogori.fukuoka.jp",
		reversed: "pj.akoukuf.irogo"
	},
	{
		suffix: "ogose.saitama.jp",
		reversed: "pj.amatias.esogo"
	},
	{
		suffix: "oguchi.aichi.jp",
		reversed: "pj.ihcia.ihcugo"
	},
	{
		suffix: "oguni.kumamoto.jp",
		reversed: "pj.otomamuk.inugo"
	},
	{
		suffix: "oguni.yamagata.jp",
		reversed: "pj.atagamay.inugo"
	},
	{
		suffix: "oh.us",
		reversed: "su.ho"
	},
	{
		suffix: "oharu.aichi.jp",
		reversed: "pj.ihcia.uraho"
	},
	{
		suffix: "ohda.shimane.jp",
		reversed: "pj.enamihs.adho"
	},
	{
		suffix: "ohi.fukui.jp",
		reversed: "pj.iukuf.iho"
	},
	{
		suffix: "ohira.miyagi.jp",
		reversed: "pj.igayim.ariho"
	},
	{
		suffix: "ohira.tochigi.jp",
		reversed: "pj.igihcot.ariho"
	},
	{
		suffix: "ohkura.yamagata.jp",
		reversed: "pj.atagamay.arukho"
	},
	{
		suffix: "ohtawara.tochigi.jp",
		reversed: "pj.igihcot.arawatho"
	},
	{
		suffix: "oi.kanagawa.jp",
		reversed: "pj.awaganak.io"
	},
	{
		suffix: "oirase.aomori.jp",
		reversed: "pj.iromoa.esario"
	},
	{
		suffix: "oirm.gov.pl",
		reversed: "lp.vog.mrio"
	},
	{
		suffix: "oishida.yamagata.jp",
		reversed: "pj.atagamay.adihsio"
	},
	{
		suffix: "oiso.kanagawa.jp",
		reversed: "pj.awaganak.osio"
	},
	{
		suffix: "oita.jp",
		reversed: "pj.atio"
	},
	{
		suffix: "oita.oita.jp",
		reversed: "pj.atio.atio"
	},
	{
		suffix: "oizumi.gunma.jp",
		reversed: "pj.amnug.imuzio"
	},
	{
		suffix: "oji.nara.jp",
		reversed: "pj.aran.ijo"
	},
	{
		suffix: "ojiya.niigata.jp",
		reversed: "pj.atagiin.ayijo"
	},
	{
		suffix: "ok.us",
		reversed: "su.ko"
	},
	{
		suffix: "okagaki.fukuoka.jp",
		reversed: "pj.akoukuf.ikagako"
	},
	{
		suffix: "okawa.fukuoka.jp",
		reversed: "pj.akoukuf.awako"
	},
	{
		suffix: "okawa.kochi.jp",
		reversed: "pj.ihcok.awako"
	},
	{
		suffix: "okaya.nagano.jp",
		reversed: "pj.onagan.ayako"
	},
	{
		suffix: "okayama.jp",
		reversed: "pj.amayako"
	},
	{
		suffix: "okayama.okayama.jp",
		reversed: "pj.amayako.amayako"
	},
	{
		suffix: "okazaki.aichi.jp",
		reversed: "pj.ihcia.ikazako"
	},
	{
		suffix: "okegawa.saitama.jp",
		reversed: "pj.amatias.awageko"
	},
	{
		suffix: "oketo.hokkaido.jp",
		reversed: "pj.odiakkoh.oteko"
	},
	{
		suffix: "oki.fukuoka.jp",
		reversed: "pj.akoukuf.iko"
	},
	{
		suffix: "okinawa",
		reversed: "awaniko"
	},
	{
		suffix: "okinawa.jp",
		reversed: "pj.awaniko"
	},
	{
		suffix: "okinawa.okinawa.jp",
		reversed: "pj.awaniko.awaniko"
	},
	{
		suffix: "okinoshima.shimane.jp",
		reversed: "pj.enamihs.amihsoniko"
	},
	{
		suffix: "okoppe.hokkaido.jp",
		reversed: "pj.odiakkoh.eppoko"
	},
	{
		suffix: "oksnes.no",
		reversed: "on.sensko"
	},
	{
		suffix: "okuizumo.shimane.jp",
		reversed: "pj.enamihs.omuziuko"
	},
	{
		suffix: "okuma.fukushima.jp",
		reversed: "pj.amihsukuf.amuko"
	},
	{
		suffix: "okutama.tokyo.jp",
		reversed: "pj.oykot.amatuko"
	},
	{
		suffix: "ol.no",
		reversed: "on.lo"
	},
	{
		suffix: "olawa.pl",
		reversed: "lp.awalo"
	},
	{
		suffix: "olayan",
		reversed: "nayalo"
	},
	{
		suffix: "olayangroup",
		reversed: "puorgnayalo"
	},
	{
		suffix: "olbia-tempio.it",
		reversed: "ti.oipmet-aiblo"
	},
	{
		suffix: "olbiatempio.it",
		reversed: "ti.oipmetaiblo"
	},
	{
		suffix: "oldnavy",
		reversed: "yvandlo"
	},
	{
		suffix: "olecko.pl",
		reversed: "lp.okcelo"
	},
	{
		suffix: "olkusz.pl",
		reversed: "lp.zsuklo"
	},
	{
		suffix: "ollo",
		reversed: "ollo"
	},
	{
		suffix: "olsztyn.pl",
		reversed: "lp.nytzslo"
	},
	{
		suffix: "om",
		reversed: "mo"
	},
	{
		suffix: "omachi.nagano.jp",
		reversed: "pj.onagan.ihcamo"
	},
	{
		suffix: "omachi.saga.jp",
		reversed: "pj.agas.ihcamo"
	},
	{
		suffix: "omaezaki.shizuoka.jp",
		reversed: "pj.akouzihs.ikazeamo"
	},
	{
		suffix: "omaha.museum",
		reversed: "muesum.ahamo"
	},
	{
		suffix: "omasvuotna.no",
		reversed: "on.antouvsamo"
	},
	{
		suffix: "ome.tokyo.jp",
		reversed: "pj.oykot.emo"
	},
	{
		suffix: "omega",
		reversed: "agemo"
	},
	{
		suffix: "omg.lol",
		reversed: "lol.gmo"
	},
	{
		suffix: "omi.nagano.jp",
		reversed: "pj.onagan.imo"
	},
	{
		suffix: "omi.niigata.jp",
		reversed: "pj.atagiin.imo"
	},
	{
		suffix: "omigawa.chiba.jp",
		reversed: "pj.abihc.awagimo"
	},
	{
		suffix: "omihachiman.shiga.jp",
		reversed: "pj.agihs.namihcahimo"
	},
	{
		suffix: "omitama.ibaraki.jp",
		reversed: "pj.ikarabi.amatimo"
	},
	{
		suffix: "omiya.saitama.jp",
		reversed: "pj.amatias.ayimo"
	},
	{
		suffix: "omniwe.site",
		reversed: "etis.ewinmo"
	},
	{
		suffix: "omotego.fukushima.jp",
		reversed: "pj.amihsukuf.ogetomo"
	},
	{
		suffix: "omura.nagasaki.jp",
		reversed: "pj.ikasagan.arumo"
	},
	{
		suffix: "omuta.fukuoka.jp",
		reversed: "pj.akoukuf.atumo"
	},
	{
		suffix: "on-aptible.com",
		reversed: "moc.elbitpa-no"
	},
	{
		suffix: "on-the-web.tv",
		reversed: "vt.bew-eht-no"
	},
	{
		suffix: "on-web.fr",
		reversed: "rf.bew-no"
	},
	{
		suffix: "on.ca",
		reversed: "ac.no"
	},
	{
		suffix: "onagawa.miyagi.jp",
		reversed: "pj.igayim.awagano"
	},
	{
		suffix: "onavstack.net",
		reversed: "ten.kcatsvano"
	},
	{
		suffix: "oncilla.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.allicno"
	},
	{
		suffix: "ondigitalocean.app",
		reversed: "ppa.naecolatigidno"
	},
	{
		suffix: "one",
		reversed: "eno"
	},
	{
		suffix: "onfabrica.com",
		reversed: "moc.acirbafno"
	},
	{
		suffix: "onflashdrive.app",
		reversed: "ppa.evirdhsalfno"
	},
	{
		suffix: "ong",
		reversed: "gno"
	},
	{
		suffix: "ong.br",
		reversed: "rb.gno"
	},
	{
		suffix: "onga.fukuoka.jp",
		reversed: "pj.akoukuf.agno"
	},
	{
		suffix: "onion",
		reversed: "noino"
	},
	{
		suffix: "onjuku.chiba.jp",
		reversed: "pj.abihc.ukujno"
	},
	{
		suffix: "onl",
		reversed: "lno"
	},
	{
		suffix: "online",
		reversed: "enilno"
	},
	{
		suffix: "online.museum",
		reversed: "muesum.enilno"
	},
	{
		suffix: "online.th",
		reversed: "ht.enilno"
	},
	{
		suffix: "onna.okinawa.jp",
		reversed: "pj.awaniko.anno"
	},
	{
		suffix: "ono.fukui.jp",
		reversed: "pj.iukuf.ono"
	},
	{
		suffix: "ono.fukushima.jp",
		reversed: "pj.amihsukuf.ono"
	},
	{
		suffix: "ono.hyogo.jp",
		reversed: "pj.ogoyh.ono"
	},
	{
		suffix: "onojo.fukuoka.jp",
		reversed: "pj.akoukuf.ojono"
	},
	{
		suffix: "onomichi.hiroshima.jp",
		reversed: "pj.amihsorih.ihcimono"
	},
	{
		suffix: "onporter.run",
		reversed: "nur.retropno"
	},
	{
		suffix: "onred.one",
		reversed: "eno.derno"
	},
	{
		suffix: "onrender.com",
		reversed: "moc.rednerno"
	},
	{
		suffix: "ontario.museum",
		reversed: "muesum.oiratno"
	},
	{
		suffix: "onthewifi.com",
		reversed: "moc.ifiwehtno"
	},
	{
		suffix: "onza.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.azno"
	},
	{
		suffix: "ooguy.com",
		reversed: "moc.yugoo"
	},
	{
		suffix: "ookuwa.nagano.jp",
		reversed: "pj.onagan.awukoo"
	},
	{
		suffix: "ooo",
		reversed: "ooo"
	},
	{
		suffix: "oops.jp",
		reversed: "pj.spoo"
	},
	{
		suffix: "ooshika.nagano.jp",
		reversed: "pj.onagan.akihsoo"
	},
	{
		suffix: "open",
		reversed: "nepo"
	},
	{
		suffix: "openair.museum",
		reversed: "muesum.rianepo"
	},
	{
		suffix: "opencraft.hosting",
		reversed: "gnitsoh.tfarcnepo"
	},
	{
		suffix: "opensocial.site",
		reversed: "etis.laicosnepo"
	},
	{
		suffix: "operaunite.com",
		reversed: "moc.etinuarepo"
	},
	{
		suffix: "opoczno.pl",
		reversed: "lp.onzcopo"
	},
	{
		suffix: "opole.pl",
		reversed: "lp.elopo"
	},
	{
		suffix: "oppdal.no",
		reversed: "on.ladppo"
	},
	{
		suffix: "oppegard.no",
		reversed: "on.drageppo"
	},
	{
		suffix: "oppegård.no",
		reversed: "on.axi-drgeppo--nx"
	},
	{
		suffix: "or.at",
		reversed: "ta.ro"
	},
	{
		suffix: "or.bi",
		reversed: "ib.ro"
	},
	{
		suffix: "or.ci",
		reversed: "ic.ro"
	},
	{
		suffix: "or.cr",
		reversed: "rc.ro"
	},
	{
		suffix: "or.id",
		reversed: "di.ro"
	},
	{
		suffix: "or.it",
		reversed: "ti.ro"
	},
	{
		suffix: "or.jp",
		reversed: "pj.ro"
	},
	{
		suffix: "or.ke",
		reversed: "ek.ro"
	},
	{
		suffix: "or.kr",
		reversed: "rk.ro"
	},
	{
		suffix: "or.mu",
		reversed: "um.ro"
	},
	{
		suffix: "or.na",
		reversed: "an.ro"
	},
	{
		suffix: "or.pw",
		reversed: "wp.ro"
	},
	{
		suffix: "or.th",
		reversed: "ht.ro"
	},
	{
		suffix: "or.tz",
		reversed: "zt.ro"
	},
	{
		suffix: "or.ug",
		reversed: "gu.ro"
	},
	{
		suffix: "or.us",
		reversed: "su.ro"
	},
	{
		suffix: "ora.gunma.jp",
		reversed: "pj.amnug.aro"
	},
	{
		suffix: "oracle",
		reversed: "elcaro"
	},
	{
		suffix: "orange",
		reversed: "egnaro"
	},
	{
		suffix: "orangecloud.tn",
		reversed: "nt.duolcegnaro"
	},
	{
		suffix: "oregon.museum",
		reversed: "muesum.nogero"
	},
	{
		suffix: "oregontrail.museum",
		reversed: "muesum.liartnogero"
	},
	{
		suffix: "org",
		reversed: "gro"
	},
	{
		suffix: "org.ac",
		reversed: "ca.gro"
	},
	{
		suffix: "org.ae",
		reversed: "ea.gro"
	},
	{
		suffix: "org.af",
		reversed: "fa.gro"
	},
	{
		suffix: "org.ag",
		reversed: "ga.gro"
	},
	{
		suffix: "org.ai",
		reversed: "ia.gro"
	},
	{
		suffix: "org.al",
		reversed: "la.gro"
	},
	{
		suffix: "org.am",
		reversed: "ma.gro"
	},
	{
		suffix: "org.ar",
		reversed: "ra.gro"
	},
	{
		suffix: "org.au",
		reversed: "ua.gro"
	},
	{
		suffix: "org.az",
		reversed: "za.gro"
	},
	{
		suffix: "org.ba",
		reversed: "ab.gro"
	},
	{
		suffix: "org.bb",
		reversed: "bb.gro"
	},
	{
		suffix: "org.bh",
		reversed: "hb.gro"
	},
	{
		suffix: "org.bi",
		reversed: "ib.gro"
	},
	{
		suffix: "org.bm",
		reversed: "mb.gro"
	},
	{
		suffix: "org.bn",
		reversed: "nb.gro"
	},
	{
		suffix: "org.bo",
		reversed: "ob.gro"
	},
	{
		suffix: "org.br",
		reversed: "rb.gro"
	},
	{
		suffix: "org.bs",
		reversed: "sb.gro"
	},
	{
		suffix: "org.bt",
		reversed: "tb.gro"
	},
	{
		suffix: "org.bw",
		reversed: "wb.gro"
	},
	{
		suffix: "org.bz",
		reversed: "zb.gro"
	},
	{
		suffix: "org.ci",
		reversed: "ic.gro"
	},
	{
		suffix: "org.cn",
		reversed: "nc.gro"
	},
	{
		suffix: "org.co",
		reversed: "oc.gro"
	},
	{
		suffix: "org.cu",
		reversed: "uc.gro"
	},
	{
		suffix: "org.cv",
		reversed: "vc.gro"
	},
	{
		suffix: "org.cw",
		reversed: "wc.gro"
	},
	{
		suffix: "org.cy",
		reversed: "yc.gro"
	},
	{
		suffix: "org.dm",
		reversed: "md.gro"
	},
	{
		suffix: "org.do",
		reversed: "od.gro"
	},
	{
		suffix: "org.dz",
		reversed: "zd.gro"
	},
	{
		suffix: "org.ec",
		reversed: "ce.gro"
	},
	{
		suffix: "org.ee",
		reversed: "ee.gro"
	},
	{
		suffix: "org.eg",
		reversed: "ge.gro"
	},
	{
		suffix: "org.es",
		reversed: "se.gro"
	},
	{
		suffix: "org.et",
		reversed: "te.gro"
	},
	{
		suffix: "org.fj",
		reversed: "jf.gro"
	},
	{
		suffix: "org.fm",
		reversed: "mf.gro"
	},
	{
		suffix: "org.ge",
		reversed: "eg.gro"
	},
	{
		suffix: "org.gg",
		reversed: "gg.gro"
	},
	{
		suffix: "org.gh",
		reversed: "hg.gro"
	},
	{
		suffix: "org.gi",
		reversed: "ig.gro"
	},
	{
		suffix: "org.gl",
		reversed: "lg.gro"
	},
	{
		suffix: "org.gn",
		reversed: "ng.gro"
	},
	{
		suffix: "org.gp",
		reversed: "pg.gro"
	},
	{
		suffix: "org.gr",
		reversed: "rg.gro"
	},
	{
		suffix: "org.gt",
		reversed: "tg.gro"
	},
	{
		suffix: "org.gu",
		reversed: "ug.gro"
	},
	{
		suffix: "org.gy",
		reversed: "yg.gro"
	},
	{
		suffix: "org.hk",
		reversed: "kh.gro"
	},
	{
		suffix: "org.hn",
		reversed: "nh.gro"
	},
	{
		suffix: "org.ht",
		reversed: "th.gro"
	},
	{
		suffix: "org.hu",
		reversed: "uh.gro"
	},
	{
		suffix: "org.il",
		reversed: "li.gro"
	},
	{
		suffix: "org.im",
		reversed: "mi.gro"
	},
	{
		suffix: "org.in",
		reversed: "ni.gro"
	},
	{
		suffix: "org.iq",
		reversed: "qi.gro"
	},
	{
		suffix: "org.ir",
		reversed: "ri.gro"
	},
	{
		suffix: "org.is",
		reversed: "si.gro"
	},
	{
		suffix: "org.je",
		reversed: "ej.gro"
	},
	{
		suffix: "org.jo",
		reversed: "oj.gro"
	},
	{
		suffix: "org.kg",
		reversed: "gk.gro"
	},
	{
		suffix: "org.ki",
		reversed: "ik.gro"
	},
	{
		suffix: "org.km",
		reversed: "mk.gro"
	},
	{
		suffix: "org.kn",
		reversed: "nk.gro"
	},
	{
		suffix: "org.kp",
		reversed: "pk.gro"
	},
	{
		suffix: "org.kw",
		reversed: "wk.gro"
	},
	{
		suffix: "org.ky",
		reversed: "yk.gro"
	},
	{
		suffix: "org.kz",
		reversed: "zk.gro"
	},
	{
		suffix: "org.la",
		reversed: "al.gro"
	},
	{
		suffix: "org.lb",
		reversed: "bl.gro"
	},
	{
		suffix: "org.lc",
		reversed: "cl.gro"
	},
	{
		suffix: "org.lk",
		reversed: "kl.gro"
	},
	{
		suffix: "org.lr",
		reversed: "rl.gro"
	},
	{
		suffix: "org.ls",
		reversed: "sl.gro"
	},
	{
		suffix: "org.lv",
		reversed: "vl.gro"
	},
	{
		suffix: "org.ly",
		reversed: "yl.gro"
	},
	{
		suffix: "org.ma",
		reversed: "am.gro"
	},
	{
		suffix: "org.me",
		reversed: "em.gro"
	},
	{
		suffix: "org.mg",
		reversed: "gm.gro"
	},
	{
		suffix: "org.mk",
		reversed: "km.gro"
	},
	{
		suffix: "org.ml",
		reversed: "lm.gro"
	},
	{
		suffix: "org.mn",
		reversed: "nm.gro"
	},
	{
		suffix: "org.mo",
		reversed: "om.gro"
	},
	{
		suffix: "org.ms",
		reversed: "sm.gro"
	},
	{
		suffix: "org.mt",
		reversed: "tm.gro"
	},
	{
		suffix: "org.mu",
		reversed: "um.gro"
	},
	{
		suffix: "org.mv",
		reversed: "vm.gro"
	},
	{
		suffix: "org.mw",
		reversed: "wm.gro"
	},
	{
		suffix: "org.mx",
		reversed: "xm.gro"
	},
	{
		suffix: "org.my",
		reversed: "ym.gro"
	},
	{
		suffix: "org.mz",
		reversed: "zm.gro"
	},
	{
		suffix: "org.na",
		reversed: "an.gro"
	},
	{
		suffix: "org.ng",
		reversed: "gn.gro"
	},
	{
		suffix: "org.ni",
		reversed: "in.gro"
	},
	{
		suffix: "org.nr",
		reversed: "rn.gro"
	},
	{
		suffix: "org.nz",
		reversed: "zn.gro"
	},
	{
		suffix: "org.om",
		reversed: "mo.gro"
	},
	{
		suffix: "org.pa",
		reversed: "ap.gro"
	},
	{
		suffix: "org.pe",
		reversed: "ep.gro"
	},
	{
		suffix: "org.pf",
		reversed: "fp.gro"
	},
	{
		suffix: "org.ph",
		reversed: "hp.gro"
	},
	{
		suffix: "org.pk",
		reversed: "kp.gro"
	},
	{
		suffix: "org.pl",
		reversed: "lp.gro"
	},
	{
		suffix: "org.pn",
		reversed: "np.gro"
	},
	{
		suffix: "org.pr",
		reversed: "rp.gro"
	},
	{
		suffix: "org.ps",
		reversed: "sp.gro"
	},
	{
		suffix: "org.pt",
		reversed: "tp.gro"
	},
	{
		suffix: "org.py",
		reversed: "yp.gro"
	},
	{
		suffix: "org.qa",
		reversed: "aq.gro"
	},
	{
		suffix: "org.ro",
		reversed: "or.gro"
	},
	{
		suffix: "org.rs",
		reversed: "sr.gro"
	},
	{
		suffix: "org.ru",
		reversed: "ur.gro"
	},
	{
		suffix: "org.rw",
		reversed: "wr.gro"
	},
	{
		suffix: "org.sa",
		reversed: "as.gro"
	},
	{
		suffix: "org.sb",
		reversed: "bs.gro"
	},
	{
		suffix: "org.sc",
		reversed: "cs.gro"
	},
	{
		suffix: "org.sd",
		reversed: "ds.gro"
	},
	{
		suffix: "org.se",
		reversed: "es.gro"
	},
	{
		suffix: "org.sg",
		reversed: "gs.gro"
	},
	{
		suffix: "org.sh",
		reversed: "hs.gro"
	},
	{
		suffix: "org.sl",
		reversed: "ls.gro"
	},
	{
		suffix: "org.sn",
		reversed: "ns.gro"
	},
	{
		suffix: "org.so",
		reversed: "os.gro"
	},
	{
		suffix: "org.ss",
		reversed: "ss.gro"
	},
	{
		suffix: "org.st",
		reversed: "ts.gro"
	},
	{
		suffix: "org.sv",
		reversed: "vs.gro"
	},
	{
		suffix: "org.sy",
		reversed: "ys.gro"
	},
	{
		suffix: "org.sz",
		reversed: "zs.gro"
	},
	{
		suffix: "org.tj",
		reversed: "jt.gro"
	},
	{
		suffix: "org.tm",
		reversed: "mt.gro"
	},
	{
		suffix: "org.tn",
		reversed: "nt.gro"
	},
	{
		suffix: "org.to",
		reversed: "ot.gro"
	},
	{
		suffix: "org.tr",
		reversed: "rt.gro"
	},
	{
		suffix: "org.tt",
		reversed: "tt.gro"
	},
	{
		suffix: "org.tw",
		reversed: "wt.gro"
	},
	{
		suffix: "org.ua",
		reversed: "au.gro"
	},
	{
		suffix: "org.ug",
		reversed: "gu.gro"
	},
	{
		suffix: "org.uk",
		reversed: "ku.gro"
	},
	{
		suffix: "org.uy",
		reversed: "yu.gro"
	},
	{
		suffix: "org.uz",
		reversed: "zu.gro"
	},
	{
		suffix: "org.vc",
		reversed: "cv.gro"
	},
	{
		suffix: "org.ve",
		reversed: "ev.gro"
	},
	{
		suffix: "org.vi",
		reversed: "iv.gro"
	},
	{
		suffix: "org.vn",
		reversed: "nv.gro"
	},
	{
		suffix: "org.vu",
		reversed: "uv.gro"
	},
	{
		suffix: "org.ws",
		reversed: "sw.gro"
	},
	{
		suffix: "org.ye",
		reversed: "ey.gro"
	},
	{
		suffix: "org.yt",
		reversed: "ty.gro"
	},
	{
		suffix: "org.za",
		reversed: "az.gro"
	},
	{
		suffix: "org.zm",
		reversed: "mz.gro"
	},
	{
		suffix: "org.zw",
		reversed: "wz.gro"
	},
	{
		suffix: "organic",
		reversed: "cinagro"
	},
	{
		suffix: "origins",
		reversed: "snigiro"
	},
	{
		suffix: "oristano.it",
		reversed: "ti.onatsiro"
	},
	{
		suffix: "orkanger.no",
		reversed: "on.regnakro"
	},
	{
		suffix: "orkdal.no",
		reversed: "on.ladkro"
	},
	{
		suffix: "orland.no",
		reversed: "on.dnalro"
	},
	{
		suffix: "orsites.com",
		reversed: "moc.setisro"
	},
	{
		suffix: "orskog.no",
		reversed: "on.goksro"
	},
	{
		suffix: "orsta.no",
		reversed: "on.atsro"
	},
	{
		suffix: "orx.biz",
		reversed: "zib.xro"
	},
	{
		suffix: "os.hedmark.no",
		reversed: "on.kramdeh.so"
	},
	{
		suffix: "os.hordaland.no",
		reversed: "on.dnaladroh.so"
	},
	{
		suffix: "osaka",
		reversed: "akaso"
	},
	{
		suffix: "osaka.jp",
		reversed: "pj.akaso"
	},
	{
		suffix: "osakasayama.osaka.jp",
		reversed: "pj.akaso.amayasakaso"
	},
	{
		suffix: "osaki.miyagi.jp",
		reversed: "pj.igayim.ikaso"
	},
	{
		suffix: "osakikamijima.hiroshima.jp",
		reversed: "pj.amihsorih.amijimakikaso"
	},
	{
		suffix: "osasco.br",
		reversed: "rb.ocsaso"
	},
	{
		suffix: "osen.no",
		reversed: "on.neso"
	},
	{
		suffix: "oseto.nagasaki.jp",
		reversed: "pj.ikasagan.oteso"
	},
	{
		suffix: "oshima.tokyo.jp",
		reversed: "pj.oykot.amihso"
	},
	{
		suffix: "oshima.yamaguchi.jp",
		reversed: "pj.ihcugamay.amihso"
	},
	{
		suffix: "oshino.yamanashi.jp",
		reversed: "pj.ihsanamay.onihso"
	},
	{
		suffix: "oshu.iwate.jp",
		reversed: "pj.etawi.uhso"
	},
	{
		suffix: "oslo.no",
		reversed: "on.olso"
	},
	{
		suffix: "osoyro.no",
		reversed: "on.oryoso"
	},
	{
		suffix: "osteroy.no",
		reversed: "on.yoretso"
	},
	{
		suffix: "osterøy.no",
		reversed: "on.ayf-yretso--nx"
	},
	{
		suffix: "ostre-toten.no",
		reversed: "on.netot-ertso"
	},
	{
		suffix: "ostroda.pl",
		reversed: "lp.adortso"
	},
	{
		suffix: "ostroleka.pl",
		reversed: "lp.akelortso"
	},
	{
		suffix: "ostrowiec.pl",
		reversed: "lp.ceiwortso"
	},
	{
		suffix: "ostrowwlkp.pl",
		reversed: "lp.pklwwortso"
	},
	{
		suffix: "osøyro.no",
		reversed: "on.auw-oryso--nx"
	},
	{
		suffix: "ot.it",
		reversed: "ti.to"
	},
	{
		suffix: "ota.gunma.jp",
		reversed: "pj.amnug.ato"
	},
	{
		suffix: "ota.tokyo.jp",
		reversed: "pj.oykot.ato"
	},
	{
		suffix: "otago.museum",
		reversed: "muesum.ogato"
	},
	{
		suffix: "otake.hiroshima.jp",
		reversed: "pj.amihsorih.ekato"
	},
	{
		suffix: "otaki.chiba.jp",
		reversed: "pj.abihc.ikato"
	},
	{
		suffix: "otaki.nagano.jp",
		reversed: "pj.onagan.ikato"
	},
	{
		suffix: "otaki.saitama.jp",
		reversed: "pj.amatias.ikato"
	},
	{
		suffix: "otama.fukushima.jp",
		reversed: "pj.amihsukuf.amato"
	},
	{
		suffix: "otari.nagano.jp",
		reversed: "pj.onagan.irato"
	},
	{
		suffix: "otaru.hokkaido.jp",
		reversed: "pj.odiakkoh.urato"
	},
	{
		suffix: "other.nf",
		reversed: "fn.rehto"
	},
	{
		suffix: "oto.fukuoka.jp",
		reversed: "pj.akoukuf.oto"
	},
	{
		suffix: "otobe.hokkaido.jp",
		reversed: "pj.odiakkoh.eboto"
	},
	{
		suffix: "otofuke.hokkaido.jp",
		reversed: "pj.odiakkoh.ekufoto"
	},
	{
		suffix: "otoineppu.hokkaido.jp",
		reversed: "pj.odiakkoh.uppenioto"
	},
	{
		suffix: "otoyo.kochi.jp",
		reversed: "pj.ihcok.oyoto"
	},
	{
		suffix: "otsu.shiga.jp",
		reversed: "pj.agihs.usto"
	},
	{
		suffix: "otsuchi.iwate.jp",
		reversed: "pj.etawi.ihcusto"
	},
	{
		suffix: "otsuka",
		reversed: "akusto"
	},
	{
		suffix: "otsuki.kochi.jp",
		reversed: "pj.ihcok.ikusto"
	},
	{
		suffix: "otsuki.yamanashi.jp",
		reversed: "pj.ihsanamay.ikusto"
	},
	{
		suffix: "ott",
		reversed: "tto"
	},
	{
		suffix: "ouchi.saga.jp",
		reversed: "pj.agas.ihcuo"
	},
	{
		suffix: "ouda.nara.jp",
		reversed: "pj.aran.aduo"
	},
	{
		suffix: "oum.gov.pl",
		reversed: "lp.vog.muo"
	},
	{
		suffix: "oumu.hokkaido.jp",
		reversed: "pj.odiakkoh.umuo"
	},
	{
		suffix: "outsystemscloud.com",
		reversed: "moc.duolcsmetsystuo"
	},
	{
		suffix: "overhalla.no",
		reversed: "on.allahrevo"
	},
	{
		suffix: "ovh",
		reversed: "hvo"
	},
	{
		suffix: "ovre-eiker.no",
		reversed: "on.rekie-ervo"
	},
	{
		suffix: "owani.aomori.jp",
		reversed: "pj.iromoa.inawo"
	},
	{
		suffix: "owariasahi.aichi.jp",
		reversed: "pj.ihcia.ihasairawo"
	},
	{
		suffix: "own.pm",
		reversed: "mp.nwo"
	},
	{
		suffix: "ownip.net",
		reversed: "ten.pinwo"
	},
	{
		suffix: "ownprovider.com",
		reversed: "moc.redivorpnwo"
	},
	{
		suffix: "ox.rs",
		reversed: "sr.xo"
	},
	{
		suffix: "oxa.cloud",
		reversed: "duolc.axo"
	},
	{
		suffix: "oxford.museum",
		reversed: "muesum.drofxo"
	},
	{
		suffix: "oy.lc",
		reversed: "cl.yo"
	},
	{
		suffix: "oya.to",
		reversed: "ot.ayo"
	},
	{
		suffix: "oyabe.toyama.jp",
		reversed: "pj.amayot.ebayo"
	},
	{
		suffix: "oyama.tochigi.jp",
		reversed: "pj.igihcot.amayo"
	},
	{
		suffix: "oyamazaki.kyoto.jp",
		reversed: "pj.otoyk.ikazamayo"
	},
	{
		suffix: "oyer.no",
		reversed: "on.reyo"
	},
	{
		suffix: "oygarden.no",
		reversed: "on.nedragyo"
	},
	{
		suffix: "oyodo.nara.jp",
		reversed: "pj.aran.odoyo"
	},
	{
		suffix: "oystre-slidre.no",
		reversed: "on.erdils-ertsyo"
	},
	{
		suffix: "oz.au",
		reversed: "ua.zo"
	},
	{
		suffix: "ozora.hokkaido.jp",
		reversed: "pj.odiakkoh.arozo"
	},
	{
		suffix: "ozu.ehime.jp",
		reversed: "pj.emihe.uzo"
	},
	{
		suffix: "ozu.kumamoto.jp",
		reversed: "pj.otomamuk.uzo"
	},
	{
		suffix: "p.bg",
		reversed: "gb.p"
	},
	{
		suffix: "p.se",
		reversed: "es.p"
	},
	{
		suffix: "pa",
		reversed: "ap"
	},
	{
		suffix: "pa.gov.br",
		reversed: "rb.vog.ap"
	},
	{
		suffix: "pa.gov.pl",
		reversed: "lp.vog.ap"
	},
	{
		suffix: "pa.it",
		reversed: "ti.ap"
	},
	{
		suffix: "pa.leg.br",
		reversed: "rb.gel.ap"
	},
	{
		suffix: "pa.us",
		reversed: "su.ap"
	},
	{
		suffix: "paas.beebyte.io",
		reversed: "oi.etybeeb.saap"
	},
	{
		suffix: "paas.datacenter.fi",
		reversed: "if.retnecatad.saap"
	},
	{
		suffix: "paas.hosted-by-previder.com",
		reversed: "moc.rediverp-yb-detsoh.saap"
	},
	{
		suffix: "paas.massivegrid.com",
		reversed: "moc.dirgevissam.saap"
	},
	{
		suffix: "pacific.museum",
		reversed: "muesum.cificap"
	},
	{
		suffix: "paderborn.museum",
		reversed: "muesum.nrobredap"
	},
	{
		suffix: "padova.it",
		reversed: "ti.avodap"
	},
	{
		suffix: "padua.it",
		reversed: "ti.audap"
	},
	{
		suffix: "page",
		reversed: "egap"
	},
	{
		suffix: "pagefrontapp.com",
		reversed: "moc.ppatnorfegap"
	},
	{
		suffix: "pages.dev",
		reversed: "ved.segap"
	},
	{
		suffix: "pages.it.hs-heilbronn.de",
		reversed: "ed.nnorblieh-sh.ti.segap"
	},
	{
		suffix: "pages.torproject.net",
		reversed: "ten.tcejorprot.segap"
	},
	{
		suffix: "pages.wiardweb.com",
		reversed: "moc.bewdraiw.segap"
	},
	{
		suffix: "pagespeedmobilizer.com",
		reversed: "moc.rezilibomdeepsegap"
	},
	{
		suffix: "pagexl.com",
		reversed: "moc.lxegap"
	},
	{
		suffix: "palace.museum",
		reversed: "muesum.ecalap"
	},
	{
		suffix: "paleo.museum",
		reversed: "muesum.oelap"
	},
	{
		suffix: "palermo.it",
		reversed: "ti.omrelap"
	},
	{
		suffix: "palmas.br",
		reversed: "rb.samlap"
	},
	{
		suffix: "palmsprings.museum",
		reversed: "muesum.sgnirpsmlap"
	},
	{
		suffix: "panama.museum",
		reversed: "muesum.amanap"
	},
	{
		suffix: "panasonic",
		reversed: "cinosanap"
	},
	{
		suffix: "panel.gg",
		reversed: "gg.lenap"
	},
	{
		suffix: "pantheonsite.io",
		reversed: "oi.etisnoehtnap"
	},
	{
		suffix: "parachuting.aero",
		reversed: "orea.gnituhcarap"
	},
	{
		suffix: "paragliding.aero",
		reversed: "orea.gnidilgarap"
	},
	{
		suffix: "parallel.jp",
		reversed: "pj.lellarap"
	},
	{
		suffix: "parasite.jp",
		reversed: "pj.etisarap"
	},
	{
		suffix: "paris",
		reversed: "sirap"
	},
	{
		suffix: "paris.eu.org",
		reversed: "gro.ue.sirap"
	},
	{
		suffix: "paris.museum",
		reversed: "muesum.sirap"
	},
	{
		suffix: "parliament.nz",
		reversed: "zn.tnemailrap"
	},
	{
		suffix: "parma.it",
		reversed: "ti.amrap"
	},
	{
		suffix: "paroch.k12.ma.us",
		reversed: "su.am.21k.hcorap"
	},
	{
		suffix: "pars",
		reversed: "srap"
	},
	{
		suffix: "parti.se",
		reversed: "es.itrap"
	},
	{
		suffix: "partners",
		reversed: "srentrap"
	},
	{
		suffix: "parts",
		reversed: "strap"
	},
	{
		suffix: "party",
		reversed: "ytrap"
	},
	{
		suffix: "pasadena.museum",
		reversed: "muesum.anedasap"
	},
	{
		suffix: "passagens",
		reversed: "snegassap"
	},
	{
		suffix: "passenger-association.aero",
		reversed: "orea.noitaicossa-regnessap"
	},
	{
		suffix: "patria.bo",
		reversed: "ob.airtap"
	},
	{
		suffix: "pavia.it",
		reversed: "ti.aivap"
	},
	{
		suffix: "pay",
		reversed: "yap"
	},
	{
		suffix: "pb.ao",
		reversed: "oa.bp"
	},
	{
		suffix: "pb.gov.br",
		reversed: "rb.vog.bp"
	},
	{
		suffix: "pb.leg.br",
		reversed: "rb.gel.bp"
	},
	{
		suffix: "pc.it",
		reversed: "ti.cp"
	},
	{
		suffix: "pc.pl",
		reversed: "lp.cp"
	},
	{
		suffix: "pccw",
		reversed: "wccp"
	},
	{
		suffix: "pcloud.host",
		reversed: "tsoh.duolcp"
	},
	{
		suffix: "pd.it",
		reversed: "ti.dp"
	},
	{
		suffix: "pdns.page",
		reversed: "egap.sndp"
	},
	{
		suffix: "pe",
		reversed: "ep"
	},
	{
		suffix: "pe.ca",
		reversed: "ac.ep"
	},
	{
		suffix: "pe.gov.br",
		reversed: "rb.vog.ep"
	},
	{
		suffix: "pe.it",
		reversed: "ti.ep"
	},
	{
		suffix: "pe.kr",
		reversed: "rk.ep"
	},
	{
		suffix: "pe.leg.br",
		reversed: "rb.gel.ep"
	},
	{
		suffix: "pecori.jp",
		reversed: "pj.irocep"
	},
	{
		suffix: "peewee.jp",
		reversed: "pj.eeweep"
	},
	{
		suffix: "penne.jp",
		reversed: "pj.ennep"
	},
	{
		suffix: "penza.su",
		reversed: "us.aznep"
	},
	{
		suffix: "pepper.jp",
		reversed: "pj.reppep"
	},
	{
		suffix: "per.la",
		reversed: "al.rep"
	},
	{
		suffix: "per.nf",
		reversed: "fn.rep"
	},
	{
		suffix: "per.sg",
		reversed: "gs.rep"
	},
	{
		suffix: "perma.jp",
		reversed: "pj.amrep"
	},
	{
		suffix: "perso.ht",
		reversed: "th.osrep"
	},
	{
		suffix: "perso.sn",
		reversed: "ns.osrep"
	},
	{
		suffix: "perso.tn",
		reversed: "nt.osrep"
	},
	{
		suffix: "perspecta.cloud",
		reversed: "duolc.atcepsrep"
	},
	{
		suffix: "perugia.it",
		reversed: "ti.aigurep"
	},
	{
		suffix: "pesaro-urbino.it",
		reversed: "ti.onibru-orasep"
	},
	{
		suffix: "pesarourbino.it",
		reversed: "ti.onibruorasep"
	},
	{
		suffix: "pescara.it",
		reversed: "ti.aracsep"
	},
	{
		suffix: "pet",
		reversed: "tep"
	},
	{
		suffix: "pf",
		reversed: "fp"
	},
	{
		suffix: "pfizer",
		reversed: "rezifp"
	},
	{
		suffix: "pg.in",
		reversed: "ni.gp"
	},
	{
		suffix: "pg.it",
		reversed: "ti.gp"
	},
	{
		suffix: "pgafan.net",
		reversed: "ten.nafagp"
	},
	{
		suffix: "pgfog.com",
		reversed: "moc.gofgp"
	},
	{
		suffix: "ph",
		reversed: "hp"
	},
	{
		suffix: "pharmacien.fr",
		reversed: "rf.neicamrahp"
	},
	{
		suffix: "pharmaciens.km",
		reversed: "mk.sneicamrahp"
	},
	{
		suffix: "pharmacy",
		reversed: "ycamrahp"
	},
	{
		suffix: "pharmacy.museum",
		reversed: "muesum.ycamrahp"
	},
	{
		suffix: "phd",
		reversed: "dhp"
	},
	{
		suffix: "philadelphia.museum",
		reversed: "muesum.aihpledalihp"
	},
	{
		suffix: "philadelphiaarea.museum",
		reversed: "muesum.aeraaihpledalihp"
	},
	{
		suffix: "philately.museum",
		reversed: "muesum.yletalihp"
	},
	{
		suffix: "philips",
		reversed: "spilihp"
	},
	{
		suffix: "phoenix.museum",
		reversed: "muesum.xineohp"
	},
	{
		suffix: "phone",
		reversed: "enohp"
	},
	{
		suffix: "photo",
		reversed: "otohp"
	},
	{
		suffix: "photography",
		reversed: "yhpargotohp"
	},
	{
		suffix: "photography.museum",
		reversed: "muesum.yhpargotohp"
	},
	{
		suffix: "photos",
		reversed: "sotohp"
	},
	{
		suffix: "phx.enscaled.us",
		reversed: "su.delacsne.xhp"
	},
	{
		suffix: "physio",
		reversed: "oisyhp"
	},
	{
		suffix: "pi.gov.br",
		reversed: "rb.vog.ip"
	},
	{
		suffix: "pi.it",
		reversed: "ti.ip"
	},
	{
		suffix: "pi.leg.br",
		reversed: "rb.gel.ip"
	},
	{
		suffix: "piacenza.it",
		reversed: "ti.aznecaip"
	},
	{
		suffix: "pics",
		reversed: "scip"
	},
	{
		suffix: "pictet",
		reversed: "tetcip"
	},
	{
		suffix: "pictures",
		reversed: "serutcip"
	},
	{
		suffix: "pid",
		reversed: "dip"
	},
	{
		suffix: "piedmont.it",
		reversed: "ti.tnomdeip"
	},
	{
		suffix: "piemonte.it",
		reversed: "ti.etnomeip"
	},
	{
		suffix: "pigboat.jp",
		reversed: "pj.taobgip"
	},
	{
		suffix: "pila.pl",
		reversed: "lp.alip"
	},
	{
		suffix: "pilot.aero",
		reversed: "orea.tolip"
	},
	{
		suffix: "pilots.museum",
		reversed: "muesum.stolip"
	},
	{
		suffix: "pimienta.org",
		reversed: "gro.atneimip"
	},
	{
		suffix: "pin",
		reversed: "nip"
	},
	{
		suffix: "pinb.gov.pl",
		reversed: "lp.vog.bnip"
	},
	{
		suffix: "ping",
		reversed: "gnip"
	},
	{
		suffix: "pink",
		reversed: "knip"
	},
	{
		suffix: "pinoko.jp",
		reversed: "pj.okonip"
	},
	{
		suffix: "pioneer",
		reversed: "reenoip"
	},
	{
		suffix: "pippu.hokkaido.jp",
		reversed: "pj.odiakkoh.uppip"
	},
	{
		suffix: "pisa.it",
		reversed: "ti.asip"
	},
	{
		suffix: "pistoia.it",
		reversed: "ti.aiotsip"
	},
	{
		suffix: "pisz.pl",
		reversed: "lp.zsip"
	},
	{
		suffix: "pittsburgh.museum",
		reversed: "muesum.hgrubsttip"
	},
	{
		suffix: "piw.gov.pl",
		reversed: "lp.vog.wip"
	},
	{
		suffix: "pixolino.com",
		reversed: "moc.oniloxip"
	},
	{
		suffix: "pizza",
		reversed: "azzip"
	},
	{
		suffix: "pk",
		reversed: "kp"
	},
	{
		suffix: "pl",
		reversed: "lp"
	},
	{
		suffix: "pl.eu.org",
		reversed: "gro.ue.lp"
	},
	{
		suffix: "pl.ua",
		reversed: "au.lp"
	},
	{
		suffix: "place",
		reversed: "ecalp"
	},
	{
		suffix: "planetarium.museum",
		reversed: "muesum.muiratenalp"
	},
	{
		suffix: "plantation.museum",
		reversed: "muesum.noitatnalp"
	},
	{
		suffix: "plants.museum",
		reversed: "muesum.stnalp"
	},
	{
		suffix: "platform0.app",
		reversed: "ppa.0mroftalp"
	},
	{
		suffix: "platter-app.com",
		reversed: "moc.ppa-rettalp"
	},
	{
		suffix: "platter-app.dev",
		reversed: "ved.ppa-rettalp"
	},
	{
		suffix: "platterp.us",
		reversed: "su.prettalp"
	},
	{
		suffix: "play",
		reversed: "yalp"
	},
	{
		suffix: "playstation",
		reversed: "noitatsyalp"
	},
	{
		suffix: "playstation-cloud.com",
		reversed: "moc.duolc-noitatsyalp"
	},
	{
		suffix: "plaza.museum",
		reversed: "muesum.azalp"
	},
	{
		suffix: "plc.co.im",
		reversed: "mi.oc.clp"
	},
	{
		suffix: "plc.ly",
		reversed: "yl.clp"
	},
	{
		suffix: "plc.uk",
		reversed: "ku.clp"
	},
	{
		suffix: "plesk.page",
		reversed: "egap.kselp"
	},
	{
		suffix: "pleskns.com",
		reversed: "moc.snkselp"
	},
	{
		suffix: "plo.ps",
		reversed: "sp.olp"
	},
	{
		suffix: "plumbing",
		reversed: "gnibmulp"
	},
	{
		suffix: "plurinacional.bo",
		reversed: "ob.lanoicanirulp"
	},
	{
		suffix: "plus",
		reversed: "sulp"
	},
	{
		suffix: "pm",
		reversed: "mp"
	},
	{
		suffix: "pmn.it",
		reversed: "ti.nmp"
	},
	{
		suffix: "pn",
		reversed: "np"
	},
	{
		suffix: "pn.it",
		reversed: "ti.np"
	},
	{
		suffix: "pnc",
		reversed: "cnp"
	},
	{
		suffix: "po.gov.pl",
		reversed: "lp.vog.op"
	},
	{
		suffix: "po.it",
		reversed: "ti.op"
	},
	{
		suffix: "poa.br",
		reversed: "rb.aop"
	},
	{
		suffix: "podhale.pl",
		reversed: "lp.elahdop"
	},
	{
		suffix: "podlasie.pl",
		reversed: "lp.eisaldop"
	},
	{
		suffix: "podzone.net",
		reversed: "ten.enozdop"
	},
	{
		suffix: "podzone.org",
		reversed: "gro.enozdop"
	},
	{
		suffix: "pohl",
		reversed: "lhop"
	},
	{
		suffix: "point2this.com",
		reversed: "moc.siht2tniop"
	},
	{
		suffix: "pointto.us",
		reversed: "su.ottniop"
	},
	{
		suffix: "poivron.org",
		reversed: "gro.norviop"
	},
	{
		suffix: "poker",
		reversed: "rekop"
	},
	{
		suffix: "pokrovsk.su",
		reversed: "us.ksvorkop"
	},
	{
		suffix: "pol.dz",
		reversed: "zd.lop"
	},
	{
		suffix: "pol.ht",
		reversed: "th.lop"
	},
	{
		suffix: "pol.tr",
		reversed: "rt.lop"
	},
	{
		suffix: "police.uk",
		reversed: "ku.ecilop"
	},
	{
		suffix: "politica.bo",
		reversed: "ob.acitilop"
	},
	{
		suffix: "politie",
		reversed: "eitilop"
	},
	{
		suffix: "polkowice.pl",
		reversed: "lp.eciwoklop"
	},
	{
		suffix: "poltava.ua",
		reversed: "au.avatlop"
	},
	{
		suffix: "pomorskie.pl",
		reversed: "lp.eiksromop"
	},
	{
		suffix: "pomorze.pl",
		reversed: "lp.ezromop"
	},
	{
		suffix: "poniatowa.pl",
		reversed: "lp.awotainop"
	},
	{
		suffix: "ponpes.id",
		reversed: "di.sepnop"
	},
	{
		suffix: "pordenone.it",
		reversed: "ti.enonedrop"
	},
	{
		suffix: "porn",
		reversed: "nrop"
	},
	{
		suffix: "porsanger.no",
		reversed: "on.regnasrop"
	},
	{
		suffix: "porsangu.no",
		reversed: "on.ugnasrop"
	},
	{
		suffix: "porsgrunn.no",
		reversed: "on.nnurgsrop"
	},
	{
		suffix: "porsáŋgu.no",
		reversed: "on.f62ats-ugsrop--nx"
	},
	{
		suffix: "port.fr",
		reversed: "rf.trop"
	},
	{
		suffix: "portal.museum",
		reversed: "muesum.latrop"
	},
	{
		suffix: "portland.museum",
		reversed: "muesum.dnaltrop"
	},
	{
		suffix: "portlligat.museum",
		reversed: "muesum.tagilltrop"
	},
	{
		suffix: "post",
		reversed: "tsop"
	},
	{
		suffix: "post.in",
		reversed: "ni.tsop"
	},
	{
		suffix: "postman-echo.com",
		reversed: "moc.ohce-namtsop"
	},
	{
		suffix: "posts-and-telecommunications.museum",
		reversed: "muesum.snoitacinummocelet-dna-stsop"
	},
	{
		suffix: "potager.org",
		reversed: "gro.regatop"
	},
	{
		suffix: "potenza.it",
		reversed: "ti.aznetop"
	},
	{
		suffix: "powiat.pl",
		reversed: "lp.taiwop"
	},
	{
		suffix: "poznan.pl",
		reversed: "lp.nanzop"
	},
	{
		suffix: "pp.az",
		reversed: "za.pp"
	},
	{
		suffix: "pp.ru",
		reversed: "ur.pp"
	},
	{
		suffix: "pp.se",
		reversed: "es.pp"
	},
	{
		suffix: "pp.ua",
		reversed: "au.pp"
	},
	{
		suffix: "ppg.br",
		reversed: "rb.gpp"
	},
	{
		suffix: "pr",
		reversed: "rp"
	},
	{
		suffix: "pr.gov.br",
		reversed: "rb.vog.rp"
	},
	{
		suffix: "pr.it",
		reversed: "ti.rp"
	},
	{
		suffix: "pr.leg.br",
		reversed: "rb.gel.rp"
	},
	{
		suffix: "pr.us",
		reversed: "su.rp"
	},
	{
		suffix: "pramerica",
		reversed: "aciremarp"
	},
	{
		suffix: "prato.it",
		reversed: "ti.otarp"
	},
	{
		suffix: "praxi",
		reversed: "ixarp"
	},
	{
		suffix: "prd.fr",
		reversed: "rf.drp"
	},
	{
		suffix: "prd.km",
		reversed: "mk.drp"
	},
	{
		suffix: "prd.mg",
		reversed: "gm.drp"
	},
	{
		suffix: "prequalifyme.today",
		reversed: "yadot.emyfilauqerp"
	},
	{
		suffix: "preservation.museum",
		reversed: "muesum.noitavreserp"
	},
	{
		suffix: "presidio.museum",
		reversed: "muesum.oidiserp"
	},
	{
		suffix: "press",
		reversed: "sserp"
	},
	{
		suffix: "press.aero",
		reversed: "orea.sserp"
	},
	{
		suffix: "press.cy",
		reversed: "yc.sserp"
	},
	{
		suffix: "press.ma",
		reversed: "am.sserp"
	},
	{
		suffix: "press.museum",
		reversed: "muesum.sserp"
	},
	{
		suffix: "press.se",
		reversed: "es.sserp"
	},
	{
		suffix: "presse.ci",
		reversed: "ic.esserp"
	},
	{
		suffix: "presse.km",
		reversed: "mk.esserp"
	},
	{
		suffix: "presse.ml",
		reversed: "lm.esserp"
	},
	{
		suffix: "pri.ee",
		reversed: "ee.irp"
	},
	{
		suffix: "prime",
		reversed: "emirp"
	},
	{
		suffix: "primetel.cloud",
		reversed: "duolc.letemirp"
	},
	{
		suffix: "principe.st",
		reversed: "ts.epicnirp"
	},
	{
		suffix: "priv.at",
		reversed: "ta.virp"
	},
	{
		suffix: "priv.hu",
		reversed: "uh.virp"
	},
	{
		suffix: "priv.instances.scw.cloud",
		reversed: "duolc.wcs.secnatsni.virp"
	},
	{
		suffix: "priv.me",
		reversed: "em.virp"
	},
	{
		suffix: "priv.no",
		reversed: "on.virp"
	},
	{
		suffix: "priv.pl",
		reversed: "lp.virp"
	},
	{
		suffix: "privatizehealthinsurance.net",
		reversed: "ten.ecnarusnihtlaehezitavirp"
	},
	{
		suffix: "pro",
		reversed: "orp"
	},
	{
		suffix: "pro.az",
		reversed: "za.orp"
	},
	{
		suffix: "pro.br",
		reversed: "rb.orp"
	},
	{
		suffix: "pro.cy",
		reversed: "yc.orp"
	},
	{
		suffix: "pro.ec",
		reversed: "ce.orp"
	},
	{
		suffix: "pro.fj",
		reversed: "jf.orp"
	},
	{
		suffix: "pro.ht",
		reversed: "th.orp"
	},
	{
		suffix: "pro.in",
		reversed: "ni.orp"
	},
	{
		suffix: "pro.mv",
		reversed: "vm.orp"
	},
	{
		suffix: "pro.na",
		reversed: "an.orp"
	},
	{
		suffix: "pro.om",
		reversed: "mo.orp"
	},
	{
		suffix: "pro.pr",
		reversed: "rp.orp"
	},
	{
		suffix: "pro.tt",
		reversed: "tt.orp"
	},
	{
		suffix: "pro.typeform.com",
		reversed: "moc.mrofepyt.orp"
	},
	{
		suffix: "pro.vn",
		reversed: "nv.orp"
	},
	{
		suffix: "prochowice.pl",
		reversed: "lp.eciwohcorp"
	},
	{
		suffix: "prod",
		reversed: "dorp"
	},
	{
		suffix: "production.aero",
		reversed: "orea.noitcudorp"
	},
	{
		suffix: "productions",
		reversed: "snoitcudorp"
	},
	{
		suffix: "prof",
		reversed: "forp"
	},
	{
		suffix: "prof.pr",
		reversed: "rp.forp"
	},
	{
		suffix: "profesional.bo",
		reversed: "ob.lanoiseforp"
	},
	{
		suffix: "progressive",
		reversed: "evissergorp"
	},
	{
		suffix: "project.museum",
		reversed: "muesum.tcejorp"
	},
	{
		suffix: "promo",
		reversed: "omorp"
	},
	{
		suffix: "properties",
		reversed: "seitreporp"
	},
	{
		suffix: "property",
		reversed: "ytreporp"
	},
	{
		suffix: "protection",
		reversed: "noitcetorp"
	},
	{
		suffix: "protonet.io",
		reversed: "oi.tenotorp"
	},
	{
		suffix: "pru",
		reversed: "urp"
	},
	{
		suffix: "prudential",
		reversed: "laitnedurp"
	},
	{
		suffix: "pruszkow.pl",
		reversed: "lp.wokzsurp"
	},
	{
		suffix: "prvcy.page",
		reversed: "egap.ycvrp"
	},
	{
		suffix: "przeworsk.pl",
		reversed: "lp.ksrowezrp"
	},
	{
		suffix: "ps",
		reversed: "sp"
	},
	{
		suffix: "psc.br",
		reversed: "rb.csp"
	},
	{
		suffix: "psi.br",
		reversed: "rb.isp"
	},
	{
		suffix: "psp.gov.pl",
		reversed: "lp.vog.psp"
	},
	{
		suffix: "psse.gov.pl",
		reversed: "lp.vog.essp"
	},
	{
		suffix: "pstmn.io",
		reversed: "oi.nmtsp"
	},
	{
		suffix: "pt",
		reversed: "tp"
	},
	{
		suffix: "pt.eu.org",
		reversed: "gro.ue.tp"
	},
	{
		suffix: "pt.it",
		reversed: "ti.tp"
	},
	{
		suffix: "pu.it",
		reversed: "ti.up"
	},
	{
		suffix: "pub",
		reversed: "bup"
	},
	{
		suffix: "pub.instances.scw.cloud",
		reversed: "duolc.wcs.secnatsni.bup"
	},
	{
		suffix: "pub.sa",
		reversed: "as.bup"
	},
	{
		suffix: "publ.pt",
		reversed: "tp.lbup"
	},
	{
		suffix: "public-inquiry.uk",
		reversed: "ku.yriuqni-cilbup"
	},
	{
		suffix: "public.museum",
		reversed: "muesum.cilbup"
	},
	{
		suffix: "publishproxy.com",
		reversed: "moc.yxorphsilbup"
	},
	{
		suffix: "pubol.museum",
		reversed: "muesum.lobup"
	},
	{
		suffix: "pubtls.org",
		reversed: "gro.sltbup"
	},
	{
		suffix: "pueblo.bo",
		reversed: "ob.olbeup"
	},
	{
		suffix: "pug.it",
		reversed: "ti.gup"
	},
	{
		suffix: "puglia.it",
		reversed: "ti.ailgup"
	},
	{
		suffix: "pulawy.pl",
		reversed: "lp.ywalup"
	},
	{
		suffix: "punyu.jp",
		reversed: "pj.uynup"
	},
	{
		suffix: "pup.gov.pl",
		reversed: "lp.vog.pup"
	},
	{
		suffix: "pupu.jp",
		reversed: "pj.upup"
	},
	{
		suffix: "pussycat.jp",
		reversed: "pj.tacyssup"
	},
	{
		suffix: "pv.it",
		reversed: "ti.vp"
	},
	{
		suffix: "pvh.br",
		reversed: "rb.hvp"
	},
	{
		suffix: "pvt.ge",
		reversed: "eg.tvp"
	},
	{
		suffix: "pvt.k12.ma.us",
		reversed: "su.am.21k.tvp"
	},
	{
		suffix: "pw",
		reversed: "wp"
	},
	{
		suffix: "pwc",
		reversed: "cwp"
	},
	{
		suffix: "py",
		reversed: "yp"
	},
	{
		suffix: "pya.jp",
		reversed: "pj.ayp"
	},
	{
		suffix: "pyatigorsk.ru",
		reversed: "ur.ksrogitayp"
	},
	{
		suffix: "pymnt.uk",
		reversed: "ku.tnmyp"
	},
	{
		suffix: "pythonanywhere.com",
		reversed: "moc.erehwynanohtyp"
	},
	{
		suffix: "pz.it",
		reversed: "ti.zp"
	},
	{
		suffix: "q-a.eu.org",
		reversed: "gro.ue.a-q"
	},
	{
		suffix: "q.bg",
		reversed: "gb.q"
	},
	{
		suffix: "qa",
		reversed: "aq"
	},
	{
		suffix: "qa2.com",
		reversed: "moc.2aq"
	},
	{
		suffix: "qbuser.com",
		reversed: "moc.resubq"
	},
	{
		suffix: "qc.ca",
		reversed: "ac.cq"
	},
	{
		suffix: "qc.com",
		reversed: "moc.cq"
	},
	{
		suffix: "qcx.io",
		reversed: "oi.xcq"
	},
	{
		suffix: "qh.cn",
		reversed: "nc.hq"
	},
	{
		suffix: "qld.au",
		reversed: "ua.dlq"
	},
	{
		suffix: "qld.edu.au",
		reversed: "ua.ude.dlq"
	},
	{
		suffix: "qld.gov.au",
		reversed: "ua.vog.dlq"
	},
	{
		suffix: "qoto.io",
		reversed: "oi.otoq"
	},
	{
		suffix: "qpon",
		reversed: "nopq"
	},
	{
		suffix: "qsl.br",
		reversed: "rb.lsq"
	},
	{
		suffix: "qualifioapp.com",
		reversed: "moc.ppaoifilauq"
	},
	{
		suffix: "quebec",
		reversed: "cebeuq"
	},
	{
		suffix: "quebec.museum",
		reversed: "muesum.cebeuq"
	},
	{
		suffix: "quest",
		reversed: "tseuq"
	},
	{
		suffix: "quicksytes.com",
		reversed: "moc.setyskciuq"
	},
	{
		suffix: "r.bg",
		reversed: "gb.r"
	},
	{
		suffix: "r.cdn77.net",
		reversed: "ten.77ndc.r"
	},
	{
		suffix: "r.se",
		reversed: "es.r"
	},
	{
		suffix: "ra.it",
		reversed: "ti.ar"
	},
	{
		suffix: "racing",
		reversed: "gnicar"
	},
	{
		suffix: "rackmaze.com",
		reversed: "moc.ezamkcar"
	},
	{
		suffix: "rackmaze.net",
		reversed: "ten.ezamkcar"
	},
	{
		suffix: "rade.no",
		reversed: "on.edar"
	},
	{
		suffix: "radio",
		reversed: "oidar"
	},
	{
		suffix: "radio.am",
		reversed: "ma.oidar"
	},
	{
		suffix: "radio.br",
		reversed: "rb.oidar"
	},
	{
		suffix: "radio.fm",
		reversed: "mf.oidar"
	},
	{
		suffix: "radom.pl",
		reversed: "lp.modar"
	},
	{
		suffix: "radoy.no",
		reversed: "on.yodar"
	},
	{
		suffix: "radøy.no",
		reversed: "on.ari-ydar--nx"
	},
	{
		suffix: "raffleentry.org.uk",
		reversed: "ku.gro.yrtneelffar"
	},
	{
		suffix: "rag-cloud-ch.hosteur.com",
		reversed: "moc.ruetsoh.hc-duolc-gar"
	},
	{
		suffix: "rag-cloud.hosteur.com",
		reversed: "moc.ruetsoh.duolc-gar"
	},
	{
		suffix: "ragusa.it",
		reversed: "ti.asugar"
	},
	{
		suffix: "rahkkeravju.no",
		reversed: "on.ujvarekkhar"
	},
	{
		suffix: "raholt.no",
		reversed: "on.tlohar"
	},
	{
		suffix: "railroad.museum",
		reversed: "muesum.daorliar"
	},
	{
		suffix: "railway.museum",
		reversed: "muesum.yawliar"
	},
	{
		suffix: "raindrop.jp",
		reversed: "pj.pordniar"
	},
	{
		suffix: "raisa.no",
		reversed: "on.asiar"
	},
	{
		suffix: "rakkestad.no",
		reversed: "on.datsekkar"
	},
	{
		suffix: "ralingen.no",
		reversed: "on.negnilar"
	},
	{
		suffix: "rana.no",
		reversed: "on.anar"
	},
	{
		suffix: "randaberg.no",
		reversed: "on.grebadnar"
	},
	{
		suffix: "rankoshi.hokkaido.jp",
		reversed: "pj.odiakkoh.ihsoknar"
	},
	{
		suffix: "ranzan.saitama.jp",
		reversed: "pj.amatias.naznar"
	},
	{
		suffix: "rar.ve",
		reversed: "ev.rar"
	},
	{
		suffix: "ras.ru",
		reversed: "ur.sar"
	},
	{
		suffix: "rauma.no",
		reversed: "on.amuar"
	},
	{
		suffix: "ravendb.cloud",
		reversed: "duolc.bdnevar"
	},
	{
		suffix: "ravendb.community",
		reversed: "ytinummoc.bdnevar"
	},
	{
		suffix: "ravendb.me",
		reversed: "em.bdnevar"
	},
	{
		suffix: "ravendb.run",
		reversed: "nur.bdnevar"
	},
	{
		suffix: "ravenna.it",
		reversed: "ti.annevar"
	},
	{
		suffix: "ravpage.co.il",
		reversed: "li.oc.egapvar"
	},
	{
		suffix: "rawa-maz.pl",
		reversed: "lp.zam-awar"
	},
	{
		suffix: "rc.it",
		reversed: "ti.cr"
	},
	{
		suffix: "rdv.to",
		reversed: "ot.vdr"
	},
	{
		suffix: "re",
		reversed: "er"
	},
	{
		suffix: "re.it",
		reversed: "ti.er"
	},
	{
		suffix: "re.kr",
		reversed: "rk.er"
	},
	{
		suffix: "read",
		reversed: "daer"
	},
	{
		suffix: "read-books.org",
		reversed: "gro.skoob-daer"
	},
	{
		suffix: "readmyblog.org",
		reversed: "gro.golbymdaer"
	},
	{
		suffix: "readthedocs.io",
		reversed: "oi.scodehtdaer"
	},
	{
		suffix: "readymade.jp",
		reversed: "pj.edamydaer"
	},
	{
		suffix: "realestate",
		reversed: "etatselaer"
	},
	{
		suffix: "realestate.pl",
		reversed: "lp.etatselaer"
	},
	{
		suffix: "realm.cz",
		reversed: "zc.mlaer"
	},
	{
		suffix: "realtor",
		reversed: "rotlaer"
	},
	{
		suffix: "realty",
		reversed: "ytlaer"
	},
	{
		suffix: "rebun.hokkaido.jp",
		reversed: "pj.odiakkoh.nuber"
	},
	{
		suffix: "rec.br",
		reversed: "rb.cer"
	},
	{
		suffix: "rec.co",
		reversed: "oc.cer"
	},
	{
		suffix: "rec.nf",
		reversed: "fn.cer"
	},
	{
		suffix: "rec.ro",
		reversed: "or.cer"
	},
	{
		suffix: "rec.ve",
		reversed: "ev.cer"
	},
	{
		suffix: "recht.pro",
		reversed: "orp.thcer"
	},
	{
		suffix: "recife.br",
		reversed: "rb.eficer"
	},
	{
		suffix: "recipes",
		reversed: "sepicer"
	},
	{
		suffix: "recreation.aero",
		reversed: "orea.noitaercer"
	},
	{
		suffix: "red",
		reversed: "der"
	},
	{
		suffix: "red.sv",
		reversed: "vs.der"
	},
	{
		suffix: "redirectme.net",
		reversed: "ten.emtcerider"
	},
	{
		suffix: "redstone",
		reversed: "enotsder"
	},
	{
		suffix: "redumbrella",
		reversed: "allerbmuder"
	},
	{
		suffix: "reg.dk",
		reversed: "kd.ger"
	},
	{
		suffix: "reggio-calabria.it",
		reversed: "ti.airbalac-oigger"
	},
	{
		suffix: "reggio-emilia.it",
		reversed: "ti.ailime-oigger"
	},
	{
		suffix: "reggiocalabria.it",
		reversed: "ti.airbalacoigger"
	},
	{
		suffix: "reggioemilia.it",
		reversed: "ti.ailimeoigger"
	},
	{
		suffix: "rehab",
		reversed: "baher"
	},
	{
		suffix: "reise",
		reversed: "esier"
	},
	{
		suffix: "reisen",
		reversed: "nesier"
	},
	{
		suffix: "reit",
		reversed: "tier"
	},
	{
		suffix: "reklam.hu",
		reversed: "uh.malker"
	},
	{
		suffix: "rel.ht",
		reversed: "th.ler"
	},
	{
		suffix: "rel.pl",
		reversed: "lp.ler"
	},
	{
		suffix: "reliance",
		reversed: "ecnailer"
	},
	{
		suffix: "remotewd.com",
		reversed: "moc.dwetomer"
	},
	{
		suffix: "ren",
		reversed: "ner"
	},
	{
		suffix: "rendalen.no",
		reversed: "on.neladner"
	},
	{
		suffix: "rennebu.no",
		reversed: "on.ubenner"
	},
	{
		suffix: "rennesoy.no",
		reversed: "on.yosenner"
	},
	{
		suffix: "rennesøy.no",
		reversed: "on.a1v-ysenner--nx"
	},
	{
		suffix: "rent",
		reversed: "tner"
	},
	{
		suffix: "rentals",
		reversed: "slatner"
	},
	{
		suffix: "rep.br",
		reversed: "rb.per"
	},
	{
		suffix: "rep.kp",
		reversed: "pk.per"
	},
	{
		suffix: "repair",
		reversed: "riaper"
	},
	{
		suffix: "repbody.aero",
		reversed: "orea.ydobper"
	},
	{
		suffix: "repl.co",
		reversed: "oc.lper"
	},
	{
		suffix: "repl.run",
		reversed: "nur.lper"
	},
	{
		suffix: "report",
		reversed: "troper"
	},
	{
		suffix: "republican",
		reversed: "nacilbuper"
	},
	{
		suffix: "res.aero",
		reversed: "orea.ser"
	},
	{
		suffix: "res.in",
		reversed: "ni.ser"
	},
	{
		suffix: "research.aero",
		reversed: "orea.hcraeser"
	},
	{
		suffix: "research.museum",
		reversed: "muesum.hcraeser"
	},
	{
		suffix: "reservd.com",
		reversed: "moc.dvreser"
	},
	{
		suffix: "reservd.dev.thingdust.io",
		reversed: "oi.tsudgniht.ved.dvreser"
	},
	{
		suffix: "reservd.disrec.thingdust.io",
		reversed: "oi.tsudgniht.cersid.dvreser"
	},
	{
		suffix: "reservd.testing.thingdust.io",
		reversed: "oi.tsudgniht.gnitset.dvreser"
	},
	{
		suffix: "reserve-online.com",
		reversed: "moc.enilno-evreser"
	},
	{
		suffix: "reserve-online.net",
		reversed: "ten.enilno-evreser"
	},
	{
		suffix: "resindevice.io",
		reversed: "oi.ecivedniser"
	},
	{
		suffix: "resistance.museum",
		reversed: "muesum.ecnatsiser"
	},
	{
		suffix: "rest",
		reversed: "tser"
	},
	{
		suffix: "restaurant",
		reversed: "tnaruatser"
	},
	{
		suffix: "review",
		reversed: "weiver"
	},
	{
		suffix: "reviews",
		reversed: "sweiver"
	},
	{
		suffix: "revista.bo",
		reversed: "ob.atsiver"
	},
	{
		suffix: "rexroth",
		reversed: "htorxer"
	},
	{
		suffix: "rg.it",
		reversed: "ti.gr"
	},
	{
		suffix: "rhcloud.com",
		reversed: "moc.duolchr"
	},
	{
		suffix: "ri.it",
		reversed: "ti.ir"
	},
	{
		suffix: "ri.us",
		reversed: "su.ir"
	},
	{
		suffix: "ribeirao.br",
		reversed: "rb.oariebir"
	},
	{
		suffix: "ric.jelastic.vps-host.net",
		reversed: "ten.tsoh-spv.citsalej.cir"
	},
	{
		suffix: "rich",
		reversed: "hcir"
	},
	{
		suffix: "richardli",
		reversed: "ildrahcir"
	},
	{
		suffix: "ricoh",
		reversed: "hocir"
	},
	{
		suffix: "rieti.it",
		reversed: "ti.iteir"
	},
	{
		suffix: "rifu.miyagi.jp",
		reversed: "pj.igayim.ufir"
	},
	{
		suffix: "riik.ee",
		reversed: "ee.kiir"
	},
	{
		suffix: "rikubetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebukir"
	},
	{
		suffix: "rikuzentakata.iwate.jp",
		reversed: "pj.etawi.atakatnezukir"
	},
	{
		suffix: "ril",
		reversed: "lir"
	},
	{
		suffix: "rimini.it",
		reversed: "ti.inimir"
	},
	{
		suffix: "rindal.no",
		reversed: "on.ladnir"
	},
	{
		suffix: "ringebu.no",
		reversed: "on.ubegnir"
	},
	{
		suffix: "ringerike.no",
		reversed: "on.ekiregnir"
	},
	{
		suffix: "ringsaker.no",
		reversed: "on.rekasgnir"
	},
	{
		suffix: "rio",
		reversed: "oir"
	},
	{
		suffix: "rio.br",
		reversed: "rb.oir"
	},
	{
		suffix: "riobranco.br",
		reversed: "rb.ocnarboir"
	},
	{
		suffix: "riodejaneiro.museum",
		reversed: "muesum.orienajedoir"
	},
	{
		suffix: "riopreto.br",
		reversed: "rb.oterpoir"
	},
	{
		suffix: "rip",
		reversed: "pir"
	},
	{
		suffix: "rishiri.hokkaido.jp",
		reversed: "pj.odiakkoh.irihsir"
	},
	{
		suffix: "rishirifuji.hokkaido.jp",
		reversed: "pj.odiakkoh.ijufirihsir"
	},
	{
		suffix: "risor.no",
		reversed: "on.rosir"
	},
	{
		suffix: "rissa.no",
		reversed: "on.assir"
	},
	{
		suffix: "risør.no",
		reversed: "on.ari-rsir--nx"
	},
	{
		suffix: "ritto.shiga.jp",
		reversed: "pj.agihs.ottir"
	},
	{
		suffix: "rivne.ua",
		reversed: "au.envir"
	},
	{
		suffix: "rj.gov.br",
		reversed: "rb.vog.jr"
	},
	{
		suffix: "rj.leg.br",
		reversed: "rb.gel.jr"
	},
	{
		suffix: "rl.no",
		reversed: "on.lr"
	},
	{
		suffix: "rm.it",
		reversed: "ti.mr"
	},
	{
		suffix: "rn.gov.br",
		reversed: "rb.vog.nr"
	},
	{
		suffix: "rn.it",
		reversed: "ti.nr"
	},
	{
		suffix: "rn.leg.br",
		reversed: "rb.gel.nr"
	},
	{
		suffix: "ro",
		reversed: "or"
	},
	{
		suffix: "ro.eu.org",
		reversed: "gro.ue.or"
	},
	{
		suffix: "ro.gov.br",
		reversed: "rb.vog.or"
	},
	{
		suffix: "ro.im",
		reversed: "mi.or"
	},
	{
		suffix: "ro.it",
		reversed: "ti.or"
	},
	{
		suffix: "ro.leg.br",
		reversed: "rb.gel.or"
	},
	{
		suffix: "roan.no",
		reversed: "on.naor"
	},
	{
		suffix: "rocher",
		reversed: "rehcor"
	},
	{
		suffix: "rochester.museum",
		reversed: "muesum.retsehcor"
	},
	{
		suffix: "rockart.museum",
		reversed: "muesum.trakcor"
	},
	{
		suffix: "rocks",
		reversed: "skcor"
	},
	{
		suffix: "rocky.page",
		reversed: "egap.ykcor"
	},
	{
		suffix: "rodeo",
		reversed: "oedor"
	},
	{
		suffix: "rodoy.no",
		reversed: "on.yodor"
	},
	{
		suffix: "rogers",
		reversed: "sregor"
	},
	{
		suffix: "rokunohe.aomori.jp",
		reversed: "pj.iromoa.ehonukor"
	},
	{
		suffix: "rollag.no",
		reversed: "on.gallor"
	},
	{
		suffix: "roma.it",
		reversed: "ti.amor"
	},
	{
		suffix: "roma.museum",
		reversed: "muesum.amor"
	},
	{
		suffix: "rome.it",
		reversed: "ti.emor"
	},
	{
		suffix: "romsa.no",
		reversed: "on.asmor"
	},
	{
		suffix: "romskog.no",
		reversed: "on.goksmor"
	},
	{
		suffix: "room",
		reversed: "moor"
	},
	{
		suffix: "roros.no",
		reversed: "on.soror"
	},
	{
		suffix: "rost.no",
		reversed: "on.tsor"
	},
	{
		suffix: "rotorcraft.aero",
		reversed: "orea.tfarcrotor"
	},
	{
		suffix: "router.management",
		reversed: "tnemeganam.retuor"
	},
	{
		suffix: "rovigo.it",
		reversed: "ti.ogivor"
	},
	{
		suffix: "rovno.ua",
		reversed: "au.onvor"
	},
	{
		suffix: "royal-commission.uk",
		reversed: "ku.noissimmoc-layor"
	},
	{
		suffix: "royken.no",
		reversed: "on.nekyor"
	},
	{
		suffix: "royrvik.no",
		reversed: "on.kivryor"
	},
	{
		suffix: "rr.gov.br",
		reversed: "rb.vog.rr"
	},
	{
		suffix: "rr.leg.br",
		reversed: "rb.gel.rr"
	},
	{
		suffix: "rs",
		reversed: "sr"
	},
	{
		suffix: "rs.ba",
		reversed: "ab.sr"
	},
	{
		suffix: "rs.gov.br",
		reversed: "rb.vog.sr"
	},
	{
		suffix: "rs.leg.br",
		reversed: "rb.gel.sr"
	},
	{
		suffix: "rsc.cdn77.org",
		reversed: "gro.77ndc.csr"
	},
	{
		suffix: "rsvp",
		reversed: "pvsr"
	},
	{
		suffix: "ru",
		reversed: "ur"
	},
	{
		suffix: "ru.com",
		reversed: "moc.ur"
	},
	{
		suffix: "ru.eu.org",
		reversed: "gro.ue.ur"
	},
	{
		suffix: "ru.net",
		reversed: "ten.ur"
	},
	{
		suffix: "rugby",
		reversed: "ybgur"
	},
	{
		suffix: "ruhr",
		reversed: "rhur"
	},
	{
		suffix: "run",
		reversed: "nur"
	},
	{
		suffix: "run.app",
		reversed: "ppa.nur"
	},
	{
		suffix: "ruovat.no",
		reversed: "on.tavour"
	},
	{
		suffix: "russia.museum",
		reversed: "muesum.aissur"
	},
	{
		suffix: "rv.ua",
		reversed: "au.vr"
	},
	{
		suffix: "rw",
		reversed: "wr"
	},
	{
		suffix: "rwe",
		reversed: "ewr"
	},
	{
		suffix: "rybnik.pl",
		reversed: "lp.kinbyr"
	},
	{
		suffix: "ryd.wafaicloud.com",
		reversed: "moc.duolciafaw.dyr"
	},
	{
		suffix: "rygge.no",
		reversed: "on.eggyr"
	},
	{
		suffix: "ryokami.saitama.jp",
		reversed: "pj.amatias.imakoyr"
	},
	{
		suffix: "ryugasaki.ibaraki.jp",
		reversed: "pj.ikarabi.ikasaguyr"
	},
	{
		suffix: "ryukyu",
		reversed: "uykuyr"
	},
	{
		suffix: "ryuoh.shiga.jp",
		reversed: "pj.agihs.houyr"
	},
	{
		suffix: "rzeszow.pl",
		reversed: "lp.wozsezr"
	},
	{
		suffix: "rzgw.gov.pl",
		reversed: "lp.vog.wgzr"
	},
	{
		suffix: "ráhkkerávju.no",
		reversed: "on.fa10-ujvrekkhr--nx"
	},
	{
		suffix: "ráisa.no",
		reversed: "on.an5-asir--nx"
	},
	{
		suffix: "råde.no",
		reversed: "on.alu-edr--nx"
	},
	{
		suffix: "råholt.no",
		reversed: "on.arm-tlohr--nx"
	},
	{
		suffix: "rælingen.no",
		reversed: "on.axm-negnilr--nx"
	},
	{
		suffix: "rødøy.no",
		reversed: "on.ban0-ydr--nx"
	},
	{
		suffix: "rømskog.no",
		reversed: "on.ayb-goksmr--nx"
	},
	{
		suffix: "røros.no",
		reversed: "on.arg-sorr--nx"
	},
	{
		suffix: "røst.no",
		reversed: "on.an0-tsr--nx"
	},
	{
		suffix: "røyken.no",
		reversed: "on.auv-nekyr--nx"
	},
	{
		suffix: "røyrvik.no",
		reversed: "on.ayb-kivryr--nx"
	},
	{
		suffix: "s.bg",
		reversed: "gb.s"
	},
	{
		suffix: "s.se",
		reversed: "es.s"
	},
	{
		suffix: "s3-ap-northeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtron-pa-3s"
	},
	{
		suffix: "s3-ap-northeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtron-pa-3s"
	},
	{
		suffix: "s3-ap-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-pa-3s"
	},
	{
		suffix: "s3-ap-southeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtuos-pa-3s"
	},
	{
		suffix: "s3-ap-southeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtuos-pa-3s"
	},
	{
		suffix: "s3-ca-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ac-3s"
	},
	{
		suffix: "s3-eu-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ue-3s"
	},
	{
		suffix: "s3-eu-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-ue-3s"
	},
	{
		suffix: "s3-eu-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-ue-3s"
	},
	{
		suffix: "s3-eu-west-3.amazonaws.com",
		reversed: "moc.swanozama.3-tsew-ue-3s"
	},
	{
		suffix: "s3-external-1.amazonaws.com",
		reversed: "moc.swanozama.1-lanretxe-3s"
	},
	{
		suffix: "s3-fips-us-gov-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-vog-su-spif-3s"
	},
	{
		suffix: "s3-sa-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-as-3s"
	},
	{
		suffix: "s3-us-east-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsae-su-3s"
	},
	{
		suffix: "s3-us-gov-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-vog-su-3s"
	},
	{
		suffix: "s3-us-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-su-3s"
	},
	{
		suffix: "s3-us-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-su-3s"
	},
	{
		suffix: "s3-website-ap-northeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtron-pa-etisbew-3s"
	},
	{
		suffix: "s3-website-ap-southeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtuos-pa-etisbew-3s"
	},
	{
		suffix: "s3-website-ap-southeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtuos-pa-etisbew-3s"
	},
	{
		suffix: "s3-website-eu-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-ue-etisbew-3s"
	},
	{
		suffix: "s3-website-sa-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-as-etisbew-3s"
	},
	{
		suffix: "s3-website-us-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-su-etisbew-3s"
	},
	{
		suffix: "s3-website-us-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-su-etisbew-3s"
	},
	{
		suffix: "s3-website-us-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-su-etisbew-3s"
	},
	{
		suffix: "s3-website.ap-northeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtron-pa.etisbew-3s"
	},
	{
		suffix: "s3-website.ap-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-pa.etisbew-3s"
	},
	{
		suffix: "s3-website.ca-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ac.etisbew-3s"
	},
	{
		suffix: "s3-website.eu-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ue.etisbew-3s"
	},
	{
		suffix: "s3-website.eu-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-ue.etisbew-3s"
	},
	{
		suffix: "s3-website.eu-west-3.amazonaws.com",
		reversed: "moc.swanozama.3-tsew-ue.etisbew-3s"
	},
	{
		suffix: "s3-website.fr-par.scw.cloud",
		reversed: "duolc.wcs.rap-rf.etisbew-3s"
	},
	{
		suffix: "s3-website.nl-ams.scw.cloud",
		reversed: "duolc.wcs.sma-ln.etisbew-3s"
	},
	{
		suffix: "s3-website.pl-waw.scw.cloud",
		reversed: "duolc.wcs.waw-lp.etisbew-3s"
	},
	{
		suffix: "s3-website.us-east-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsae-su.etisbew-3s"
	},
	{
		suffix: "s3.amazonaws.com",
		reversed: "moc.swanozama.3s"
	},
	{
		suffix: "s3.ap-northeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtron-pa.3s"
	},
	{
		suffix: "s3.ap-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-pa.3s"
	},
	{
		suffix: "s3.ca-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ac.3s"
	},
	{
		suffix: "s3.cn-north-1.amazonaws.com.cn",
		reversed: "nc.moc.swanozama.1-htron-nc.3s"
	},
	{
		suffix: "s3.dualstack.ap-northeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtron-pa.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.ap-northeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtron-pa.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.ap-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-pa.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.ap-southeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtuos-pa.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.ap-southeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtuos-pa.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.ca-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ac.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.eu-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ue.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.eu-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-ue.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.eu-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-ue.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.eu-west-3.amazonaws.com",
		reversed: "moc.swanozama.3-tsew-ue.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.sa-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-as.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.us-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-su.kcatslaud.3s"
	},
	{
		suffix: "s3.dualstack.us-east-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsae-su.kcatslaud.3s"
	},
	{
		suffix: "s3.eu-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ue.3s"
	},
	{
		suffix: "s3.eu-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-ue.3s"
	},
	{
		suffix: "s3.eu-west-3.amazonaws.com",
		reversed: "moc.swanozama.3-tsew-ue.3s"
	},
	{
		suffix: "s3.fr-par.scw.cloud",
		reversed: "duolc.wcs.rap-rf.3s"
	},
	{
		suffix: "s3.nl-ams.scw.cloud",
		reversed: "duolc.wcs.sma-ln.3s"
	},
	{
		suffix: "s3.pl-waw.scw.cloud",
		reversed: "duolc.wcs.waw-lp.3s"
	},
	{
		suffix: "s3.teckids.org",
		reversed: "gro.sdikcet.3s"
	},
	{
		suffix: "s3.us-east-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsae-su.3s"
	},
	{
		suffix: "sa",
		reversed: "as"
	},
	{
		suffix: "sa-east-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-tsae-as"
	},
	{
		suffix: "sa.au",
		reversed: "ua.as"
	},
	{
		suffix: "sa.com",
		reversed: "moc.as"
	},
	{
		suffix: "sa.cr",
		reversed: "rc.as"
	},
	{
		suffix: "sa.edu.au",
		reversed: "ua.ude.as"
	},
	{
		suffix: "sa.gov.au",
		reversed: "ua.vog.as"
	},
	{
		suffix: "sa.gov.pl",
		reversed: "lp.vog.as"
	},
	{
		suffix: "sa.it",
		reversed: "ti.as"
	},
	{
		suffix: "saarland",
		reversed: "dnalraas"
	},
	{
		suffix: "sabae.fukui.jp",
		reversed: "pj.iukuf.eabas"
	},
	{
		suffix: "sadist.jp",
		reversed: "pj.tsidas"
	},
	{
		suffix: "sado.niigata.jp",
		reversed: "pj.atagiin.odas"
	},
	{
		suffix: "safe",
		reversed: "efas"
	},
	{
		suffix: "safety",
		reversed: "ytefas"
	},
	{
		suffix: "safety.aero",
		reversed: "orea.ytefas"
	},
	{
		suffix: "saga.jp",
		reversed: "pj.agas"
	},
	{
		suffix: "saga.saga.jp",
		reversed: "pj.agas.agas"
	},
	{
		suffix: "sagae.yamagata.jp",
		reversed: "pj.atagamay.eagas"
	},
	{
		suffix: "sagamihara.kanagawa.jp",
		reversed: "pj.awaganak.arahimagas"
	},
	{
		suffix: "saigawa.fukuoka.jp",
		reversed: "pj.akoukuf.awagias"
	},
	{
		suffix: "saijo.ehime.jp",
		reversed: "pj.emihe.ojias"
	},
	{
		suffix: "saikai.nagasaki.jp",
		reversed: "pj.ikasagan.iakias"
	},
	{
		suffix: "saiki.oita.jp",
		reversed: "pj.atio.ikias"
	},
	{
		suffix: "saintlouis.museum",
		reversed: "muesum.siuoltnias"
	},
	{
		suffix: "saitama.jp",
		reversed: "pj.amatias"
	},
	{
		suffix: "saitama.saitama.jp",
		reversed: "pj.amatias.amatias"
	},
	{
		suffix: "saito.miyazaki.jp",
		reversed: "pj.ikazayim.otias"
	},
	{
		suffix: "saka.hiroshima.jp",
		reversed: "pj.amihsorih.akas"
	},
	{
		suffix: "sakado.saitama.jp",
		reversed: "pj.amatias.odakas"
	},
	{
		suffix: "sakae.chiba.jp",
		reversed: "pj.abihc.eakas"
	},
	{
		suffix: "sakae.nagano.jp",
		reversed: "pj.onagan.eakas"
	},
	{
		suffix: "sakahogi.gifu.jp",
		reversed: "pj.ufig.igohakas"
	},
	{
		suffix: "sakai.fukui.jp",
		reversed: "pj.iukuf.iakas"
	},
	{
		suffix: "sakai.ibaraki.jp",
		reversed: "pj.ikarabi.iakas"
	},
	{
		suffix: "sakai.osaka.jp",
		reversed: "pj.akaso.iakas"
	},
	{
		suffix: "sakaiminato.tottori.jp",
		reversed: "pj.irottot.otanimiakas"
	},
	{
		suffix: "sakaki.nagano.jp",
		reversed: "pj.onagan.ikakas"
	},
	{
		suffix: "sakata.yamagata.jp",
		reversed: "pj.atagamay.atakas"
	},
	{
		suffix: "sakawa.kochi.jp",
		reversed: "pj.ihcok.awakas"
	},
	{
		suffix: "sakegawa.yamagata.jp",
		reversed: "pj.atagamay.awagekas"
	},
	{
		suffix: "saku.nagano.jp",
		reversed: "pj.onagan.ukas"
	},
	{
		suffix: "sakuho.nagano.jp",
		reversed: "pj.onagan.ohukas"
	},
	{
		suffix: "sakura",
		reversed: "arukas"
	},
	{
		suffix: "sakura.chiba.jp",
		reversed: "pj.abihc.arukas"
	},
	{
		suffix: "sakura.tochigi.jp",
		reversed: "pj.igihcot.arukas"
	},
	{
		suffix: "sakuragawa.ibaraki.jp",
		reversed: "pj.ikarabi.awagarukas"
	},
	{
		suffix: "sakurai.nara.jp",
		reversed: "pj.aran.iarukas"
	},
	{
		suffix: "sakyo.kyoto.jp",
		reversed: "pj.otoyk.oykas"
	},
	{
		suffix: "salangen.no",
		reversed: "on.negnalas"
	},
	{
		suffix: "salat.no",
		reversed: "on.talas"
	},
	{
		suffix: "sale",
		reversed: "elas"
	},
	{
		suffix: "salem.museum",
		reversed: "muesum.melas"
	},
	{
		suffix: "salerno.it",
		reversed: "ti.onrelas"
	},
	{
		suffix: "salon",
		reversed: "nolas"
	},
	{
		suffix: "saltdal.no",
		reversed: "on.ladtlas"
	},
	{
		suffix: "salud.bo",
		reversed: "ob.dulas"
	},
	{
		suffix: "salvador.br",
		reversed: "rb.rodavlas"
	},
	{
		suffix: "salvadordali.museum",
		reversed: "muesum.iladrodavlas"
	},
	{
		suffix: "salzburg.museum",
		reversed: "muesum.grubzlas"
	},
	{
		suffix: "samegawa.fukushima.jp",
		reversed: "pj.amihsukuf.awagemas"
	},
	{
		suffix: "samnanger.no",
		reversed: "on.regnanmas"
	},
	{
		suffix: "sampa.br",
		reversed: "rb.apmas"
	},
	{
		suffix: "samsclub",
		reversed: "bulcsmas"
	},
	{
		suffix: "samsung",
		reversed: "gnusmas"
	},
	{
		suffix: "samukawa.kanagawa.jp",
		reversed: "pj.awaganak.awakumas"
	},
	{
		suffix: "sanagochi.tokushima.jp",
		reversed: "pj.amihsukot.ihcoganas"
	},
	{
		suffix: "sanda.hyogo.jp",
		reversed: "pj.ogoyh.adnas"
	},
	{
		suffix: "sandcats.io",
		reversed: "oi.stacdnas"
	},
	{
		suffix: "sande.more-og-romsdal.no",
		reversed: "on.ladsmor-go-erom.ednas"
	},
	{
		suffix: "sande.møre-og-romsdal.no",
		reversed: "on.bqq-ladsmor-go-erm--nx.ednas"
	},
	{
		suffix: "sande.vestfold.no",
		reversed: "on.dloftsev.ednas"
	},
	{
		suffix: "sandefjord.no",
		reversed: "on.drojfednas"
	},
	{
		suffix: "sandiego.museum",
		reversed: "muesum.ogeidnas"
	},
	{
		suffix: "sandnes.no",
		reversed: "on.sendnas"
	},
	{
		suffix: "sandnessjoen.no",
		reversed: "on.neojssendnas"
	},
	{
		suffix: "sandnessjøen.no",
		reversed: "on.bgo-nejssendnas--nx"
	},
	{
		suffix: "sandoy.no",
		reversed: "on.yodnas"
	},
	{
		suffix: "sandvik",
		reversed: "kivdnas"
	},
	{
		suffix: "sandvikcoromant",
		reversed: "tnamorockivdnas"
	},
	{
		suffix: "sandøy.no",
		reversed: "on.auy-ydnas--nx"
	},
	{
		suffix: "sanfrancisco.museum",
		reversed: "muesum.ocsicnarfnas"
	},
	{
		suffix: "sango.nara.jp",
		reversed: "pj.aran.ognas"
	},
	{
		suffix: "sanjo.niigata.jp",
		reversed: "pj.atagiin.ojnas"
	},
	{
		suffix: "sannan.hyogo.jp",
		reversed: "pj.ogoyh.nannas"
	},
	{
		suffix: "sannohe.aomori.jp",
		reversed: "pj.iromoa.ehonnas"
	},
	{
		suffix: "sano.tochigi.jp",
		reversed: "pj.igihcot.onas"
	},
	{
		suffix: "sanofi",
		reversed: "ifonas"
	},
	{
		suffix: "sanok.pl",
		reversed: "lp.konas"
	},
	{
		suffix: "santabarbara.museum",
		reversed: "muesum.arabrabatnas"
	},
	{
		suffix: "santacruz.museum",
		reversed: "muesum.zurcatnas"
	},
	{
		suffix: "santafe.museum",
		reversed: "muesum.efatnas"
	},
	{
		suffix: "santamaria.br",
		reversed: "rb.airamatnas"
	},
	{
		suffix: "santoandre.br",
		reversed: "rb.erdnaotnas"
	},
	{
		suffix: "sanuki.kagawa.jp",
		reversed: "pj.awagak.ikunas"
	},
	{
		suffix: "saobernardo.br",
		reversed: "rb.odranreboas"
	},
	{
		suffix: "saogonca.br",
		reversed: "rb.acnogoas"
	},
	{
		suffix: "saotome.st",
		reversed: "ts.emotoas"
	},
	{
		suffix: "sap",
		reversed: "pas"
	},
	{
		suffix: "sar.it",
		reversed: "ti.ras"
	},
	{
		suffix: "sardegna.it",
		reversed: "ti.angedras"
	},
	{
		suffix: "sardinia.it",
		reversed: "ti.ainidras"
	},
	{
		suffix: "sarl",
		reversed: "lras"
	},
	{
		suffix: "saroma.hokkaido.jp",
		reversed: "pj.odiakkoh.amoras"
	},
	{
		suffix: "sarpsborg.no",
		reversed: "on.grobspras"
	},
	{
		suffix: "sarufutsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustufuras"
	},
	{
		suffix: "sas",
		reversed: "sas"
	},
	{
		suffix: "sasaguri.fukuoka.jp",
		reversed: "pj.akoukuf.irugasas"
	},
	{
		suffix: "sasayama.hyogo.jp",
		reversed: "pj.ogoyh.amayasas"
	},
	{
		suffix: "sasebo.nagasaki.jp",
		reversed: "pj.ikasagan.obesas"
	},
	{
		suffix: "saskatchewan.museum",
		reversed: "muesum.nawehctaksas"
	},
	{
		suffix: "sassari.it",
		reversed: "ti.irassas"
	},
	{
		suffix: "satosho.okayama.jp",
		reversed: "pj.amayako.ohsotas"
	},
	{
		suffix: "satsumasendai.kagoshima.jp",
		reversed: "pj.amihsogak.iadnesamustas"
	},
	{
		suffix: "satte.saitama.jp",
		reversed: "pj.amatias.ettas"
	},
	{
		suffix: "satx.museum",
		reversed: "muesum.xtas"
	},
	{
		suffix: "sauda.no",
		reversed: "on.aduas"
	},
	{
		suffix: "sauherad.no",
		reversed: "on.darehuas"
	},
	{
		suffix: "savannahga.museum",
		reversed: "muesum.aghannavas"
	},
	{
		suffix: "save",
		reversed: "evas"
	},
	{
		suffix: "saves-the-whales.com",
		reversed: "moc.selahw-eht-sevas"
	},
	{
		suffix: "savona.it",
		reversed: "ti.anovas"
	},
	{
		suffix: "saxo",
		reversed: "oxas"
	},
	{
		suffix: "sayama.osaka.jp",
		reversed: "pj.akaso.amayas"
	},
	{
		suffix: "sayama.saitama.jp",
		reversed: "pj.amatias.amayas"
	},
	{
		suffix: "sayo.hyogo.jp",
		reversed: "pj.ogoyh.oyas"
	},
	{
		suffix: "sb",
		reversed: "bs"
	},
	{
		suffix: "sb.ua",
		reversed: "au.bs"
	},
	{
		suffix: "sbi",
		reversed: "ibs"
	},
	{
		suffix: "sbs",
		reversed: "sbs"
	},
	{
		suffix: "sc",
		reversed: "cs"
	},
	{
		suffix: "sc.cn",
		reversed: "nc.cs"
	},
	{
		suffix: "sc.gov.br",
		reversed: "rb.vog.cs"
	},
	{
		suffix: "sc.ke",
		reversed: "ek.cs"
	},
	{
		suffix: "sc.kr",
		reversed: "rk.cs"
	},
	{
		suffix: "sc.leg.br",
		reversed: "rb.gel.cs"
	},
	{
		suffix: "sc.ls",
		reversed: "sl.cs"
	},
	{
		suffix: "sc.tz",
		reversed: "zt.cs"
	},
	{
		suffix: "sc.ug",
		reversed: "gu.cs"
	},
	{
		suffix: "sc.us",
		reversed: "su.cs"
	},
	{
		suffix: "sca",
		reversed: "acs"
	},
	{
		suffix: "scalebook.scw.cloud",
		reversed: "duolc.wcs.koobelacs"
	},
	{
		suffix: "scb",
		reversed: "bcs"
	},
	{
		suffix: "sch.ae",
		reversed: "ea.hcs"
	},
	{
		suffix: "sch.id",
		reversed: "di.hcs"
	},
	{
		suffix: "sch.ir",
		reversed: "ri.hcs"
	},
	{
		suffix: "sch.jo",
		reversed: "oj.hcs"
	},
	{
		suffix: "sch.lk",
		reversed: "kl.hcs"
	},
	{
		suffix: "sch.ly",
		reversed: "yl.hcs"
	},
	{
		suffix: "sch.ng",
		reversed: "gn.hcs"
	},
	{
		suffix: "sch.qa",
		reversed: "aq.hcs"
	},
	{
		suffix: "sch.sa",
		reversed: "as.hcs"
	},
	{
		suffix: "sch.so",
		reversed: "os.hcs"
	},
	{
		suffix: "sch.ss",
		reversed: "ss.hcs"
	},
	{
		suffix: "sch.tf",
		reversed: "ft.hcs"
	},
	{
		suffix: "sch.wf",
		reversed: "fw.hcs"
	},
	{
		suffix: "sch.zm",
		reversed: "mz.hcs"
	},
	{
		suffix: "schaeffler",
		reversed: "relffeahcs"
	},
	{
		suffix: "schlesisches.museum",
		reversed: "muesum.sehcsiselhcs"
	},
	{
		suffix: "schmidt",
		reversed: "tdimhcs"
	},
	{
		suffix: "schoenbrunn.museum",
		reversed: "muesum.nnurbneohcs"
	},
	{
		suffix: "schokokeks.net",
		reversed: "ten.skekokohcs"
	},
	{
		suffix: "schokoladen.museum",
		reversed: "muesum.nedalokohcs"
	},
	{
		suffix: "scholarships",
		reversed: "spihsralohcs"
	},
	{
		suffix: "school",
		reversed: "loohcs"
	},
	{
		suffix: "school.museum",
		reversed: "muesum.loohcs"
	},
	{
		suffix: "school.na",
		reversed: "an.loohcs"
	},
	{
		suffix: "school.nz",
		reversed: "zn.loohcs"
	},
	{
		suffix: "school.za",
		reversed: "az.loohcs"
	},
	{
		suffix: "schoolbus.jp",
		reversed: "pj.subloohcs"
	},
	{
		suffix: "schools.nsw.edu.au",
		reversed: "ua.ude.wsn.sloohcs"
	},
	{
		suffix: "schule",
		reversed: "eluhcs"
	},
	{
		suffix: "schulplattform.de",
		reversed: "ed.mrofttalpluhcs"
	},
	{
		suffix: "schulserver.de",
		reversed: "ed.revresluhcs"
	},
	{
		suffix: "schwarz",
		reversed: "zrawhcs"
	},
	{
		suffix: "schweiz.museum",
		reversed: "muesum.ziewhcs"
	},
	{
		suffix: "sci.eg",
		reversed: "ge.ics"
	},
	{
		suffix: "science",
		reversed: "ecneics"
	},
	{
		suffix: "science-fiction.museum",
		reversed: "muesum.noitcif-ecneics"
	},
	{
		suffix: "science.museum",
		reversed: "muesum.ecneics"
	},
	{
		suffix: "scienceandhistory.museum",
		reversed: "muesum.yrotsihdnaecneics"
	},
	{
		suffix: "scienceandindustry.museum",
		reversed: "muesum.yrtsudnidnaecneics"
	},
	{
		suffix: "sciencecenter.museum",
		reversed: "muesum.retnececneics"
	},
	{
		suffix: "sciencecenters.museum",
		reversed: "muesum.sretnececneics"
	},
	{
		suffix: "sciencehistory.museum",
		reversed: "muesum.yrotsihecneics"
	},
	{
		suffix: "sciences.museum",
		reversed: "muesum.secneics"
	},
	{
		suffix: "sciencesnaturelles.museum",
		reversed: "muesum.sellerutansecneics"
	},
	{
		suffix: "scientist.aero",
		reversed: "orea.tsitneics"
	},
	{
		suffix: "scot",
		reversed: "tocs"
	},
	{
		suffix: "scotland.museum",
		reversed: "muesum.dnaltocs"
	},
	{
		suffix: "scrapper-site.net",
		reversed: "ten.etis-repparcs"
	},
	{
		suffix: "scrapping.cc",
		reversed: "cc.gnipparcs"
	},
	{
		suffix: "scrysec.com",
		reversed: "moc.cesyrcs"
	},
	{
		suffix: "sd",
		reversed: "ds"
	},
	{
		suffix: "sd.cn",
		reversed: "nc.ds"
	},
	{
		suffix: "sd.us",
		reversed: "su.ds"
	},
	{
		suffix: "sdn.gov.pl",
		reversed: "lp.vog.nds"
	},
	{
		suffix: "sdscloud.pl",
		reversed: "lp.duolcsds"
	},
	{
		suffix: "se",
		reversed: "es"
	},
	{
		suffix: "se.eu.org",
		reversed: "gro.ue.es"
	},
	{
		suffix: "se.gov.br",
		reversed: "rb.vog.es"
	},
	{
		suffix: "se.leg.br",
		reversed: "rb.gel.es"
	},
	{
		suffix: "se.net",
		reversed: "ten.es"
	},
	{
		suffix: "seaport.museum",
		reversed: "muesum.tropaes"
	},
	{
		suffix: "search",
		reversed: "hcraes"
	},
	{
		suffix: "seat",
		reversed: "taes"
	},
	{
		suffix: "sebastopol.ua",
		reversed: "au.lopotsabes"
	},
	{
		suffix: "sec.ps",
		reversed: "sp.ces"
	},
	{
		suffix: "secaas.hk",
		reversed: "kh.saaces"
	},
	{
		suffix: "secret.jp",
		reversed: "pj.terces"
	},
	{
		suffix: "secure",
		reversed: "eruces"
	},
	{
		suffix: "security",
		reversed: "ytiruces"
	},
	{
		suffix: "securitytactics.com",
		reversed: "moc.scitcatytiruces"
	},
	{
		suffix: "seek",
		reversed: "kees"
	},
	{
		suffix: "seg.br",
		reversed: "rb.ges"
	},
	{
		suffix: "seidat.net",
		reversed: "ten.tadies"
	},
	{
		suffix: "seihi.nagasaki.jp",
		reversed: "pj.ikasagan.ihies"
	},
	{
		suffix: "seika.kyoto.jp",
		reversed: "pj.otoyk.akies"
	},
	{
		suffix: "seiro.niigata.jp",
		reversed: "pj.atagiin.ories"
	},
	{
		suffix: "seirou.niigata.jp",
		reversed: "pj.atagiin.uories"
	},
	{
		suffix: "seiyo.ehime.jp",
		reversed: "pj.emihe.oyies"
	},
	{
		suffix: "sejny.pl",
		reversed: "lp.ynjes"
	},
	{
		suffix: "sekd1.beebyteapp.io",
		reversed: "oi.ppaetybeeb.1dkes"
	},
	{
		suffix: "seki.gifu.jp",
		reversed: "pj.ufig.ikes"
	},
	{
		suffix: "sekigahara.gifu.jp",
		reversed: "pj.ufig.arahagikes"
	},
	{
		suffix: "sekikawa.niigata.jp",
		reversed: "pj.atagiin.awakikes"
	},
	{
		suffix: "sel.no",
		reversed: "on.les"
	},
	{
		suffix: "selbu.no",
		reversed: "on.ubles"
	},
	{
		suffix: "select",
		reversed: "tceles"
	},
	{
		suffix: "selfip.biz",
		reversed: "zib.pifles"
	},
	{
		suffix: "selfip.com",
		reversed: "moc.pifles"
	},
	{
		suffix: "selfip.info",
		reversed: "ofni.pifles"
	},
	{
		suffix: "selfip.net",
		reversed: "ten.pifles"
	},
	{
		suffix: "selfip.org",
		reversed: "gro.pifles"
	},
	{
		suffix: "selje.no",
		reversed: "on.ejles"
	},
	{
		suffix: "seljord.no",
		reversed: "on.drojles"
	},
	{
		suffix: "sellfy.store",
		reversed: "erots.yflles"
	},
	{
		suffix: "sells-for-less.com",
		reversed: "moc.ssel-rof-slles"
	},
	{
		suffix: "sells-for-u.com",
		reversed: "moc.u-rof-slles"
	},
	{
		suffix: "sells-it.net",
		reversed: "ten.ti-slles"
	},
	{
		suffix: "sellsyourhome.org",
		reversed: "gro.emohruoyslles"
	},
	{
		suffix: "semboku.akita.jp",
		reversed: "pj.atika.ukobmes"
	},
	{
		suffix: "semine.miyagi.jp",
		reversed: "pj.igayim.enimes"
	},
	{
		suffix: "senasa.ar",
		reversed: "ra.asanes"
	},
	{
		suffix: "sener",
		reversed: "renes"
	},
	{
		suffix: "sennan.osaka.jp",
		reversed: "pj.akaso.nannes"
	},
	{
		suffix: "senseering.net",
		reversed: "ten.gnireesnes"
	},
	{
		suffix: "seoul.kr",
		reversed: "rk.luoes"
	},
	{
		suffix: "sera.hiroshima.jp",
		reversed: "pj.amihsorih.ares"
	},
	{
		suffix: "seranishi.hiroshima.jp",
		reversed: "pj.amihsorih.ihsinares"
	},
	{
		suffix: "servebbs.com",
		reversed: "moc.sbbevres"
	},
	{
		suffix: "servebbs.net",
		reversed: "ten.sbbevres"
	},
	{
		suffix: "servebbs.org",
		reversed: "gro.sbbevres"
	},
	{
		suffix: "servebeer.com",
		reversed: "moc.reebevres"
	},
	{
		suffix: "serveblog.net",
		reversed: "ten.golbevres"
	},
	{
		suffix: "servecounterstrike.com",
		reversed: "moc.ekirtsretnuocevres"
	},
	{
		suffix: "serveexchange.com",
		reversed: "moc.egnahcxeevres"
	},
	{
		suffix: "serveftp.com",
		reversed: "moc.ptfevres"
	},
	{
		suffix: "serveftp.net",
		reversed: "ten.ptfevres"
	},
	{
		suffix: "serveftp.org",
		reversed: "gro.ptfevres"
	},
	{
		suffix: "servegame.com",
		reversed: "moc.emagevres"
	},
	{
		suffix: "servegame.org",
		reversed: "gro.emagevres"
	},
	{
		suffix: "servehalflife.com",
		reversed: "moc.efilflahevres"
	},
	{
		suffix: "servehttp.com",
		reversed: "moc.ptthevres"
	},
	{
		suffix: "servehumour.com",
		reversed: "moc.ruomuhevres"
	},
	{
		suffix: "serveirc.com",
		reversed: "moc.crievres"
	},
	{
		suffix: "serveminecraft.net",
		reversed: "ten.tfarcenimevres"
	},
	{
		suffix: "servemp3.com",
		reversed: "moc.3pmevres"
	},
	{
		suffix: "servep2p.com",
		reversed: "moc.p2pevres"
	},
	{
		suffix: "servepics.com",
		reversed: "moc.scipevres"
	},
	{
		suffix: "servequake.com",
		reversed: "moc.ekauqevres"
	},
	{
		suffix: "servers.run",
		reversed: "nur.srevres"
	},
	{
		suffix: "servesarcasm.com",
		reversed: "moc.msacrasevres"
	},
	{
		suffix: "service.gov.scot",
		reversed: "tocs.vog.ecivres"
	},
	{
		suffix: "service.gov.uk",
		reversed: "ku.vog.ecivres"
	},
	{
		suffix: "service.one",
		reversed: "eno.ecivres"
	},
	{
		suffix: "services",
		reversed: "secivres"
	},
	{
		suffix: "services.aero",
		reversed: "orea.secivres"
	},
	{
		suffix: "ses",
		reversed: "ses"
	},
	{
		suffix: "setagaya.tokyo.jp",
		reversed: "pj.oykot.ayagates"
	},
	{
		suffix: "seto.aichi.jp",
		reversed: "pj.ihcia.otes"
	},
	{
		suffix: "setouchi.okayama.jp",
		reversed: "pj.amayako.ihcuotes"
	},
	{
		suffix: "settlement.museum",
		reversed: "muesum.tnemelttes"
	},
	{
		suffix: "settlers.museum",
		reversed: "muesum.srelttes"
	},
	{
		suffix: "settsu.osaka.jp",
		reversed: "pj.akaso.usttes"
	},
	{
		suffix: "sevastopol.ua",
		reversed: "au.lopotsaves"
	},
	{
		suffix: "seven",
		reversed: "neves"
	},
	{
		suffix: "sew",
		reversed: "wes"
	},
	{
		suffix: "sex",
		reversed: "xes"
	},
	{
		suffix: "sex.hu",
		reversed: "uh.xes"
	},
	{
		suffix: "sex.pl",
		reversed: "lp.xes"
	},
	{
		suffix: "sexy",
		reversed: "yxes"
	},
	{
		suffix: "sf.no",
		reversed: "on.fs"
	},
	{
		suffix: "sfr",
		reversed: "rfs"
	},
	{
		suffix: "sg",
		reversed: "gs"
	},
	{
		suffix: "sg-1.paas.massivegrid.net",
		reversed: "ten.dirgevissam.saap.1-gs"
	},
	{
		suffix: "sh",
		reversed: "hs"
	},
	{
		suffix: "sh.cn",
		reversed: "nc.hs"
	},
	{
		suffix: "shacknet.nu",
		reversed: "un.tenkcahs"
	},
	{
		suffix: "shakotan.hokkaido.jp",
		reversed: "pj.odiakkoh.natokahs"
	},
	{
		suffix: "shangrila",
		reversed: "alirgnahs"
	},
	{
		suffix: "shari.hokkaido.jp",
		reversed: "pj.odiakkoh.irahs"
	},
	{
		suffix: "sharp",
		reversed: "prahs"
	},
	{
		suffix: "shaw",
		reversed: "wahs"
	},
	{
		suffix: "shell",
		reversed: "llehs"
	},
	{
		suffix: "shell.museum",
		reversed: "muesum.llehs"
	},
	{
		suffix: "sherbrooke.museum",
		reversed: "muesum.ekoorbrehs"
	},
	{
		suffix: "shia",
		reversed: "aihs"
	},
	{
		suffix: "shibata.miyagi.jp",
		reversed: "pj.igayim.atabihs"
	},
	{
		suffix: "shibata.niigata.jp",
		reversed: "pj.atagiin.atabihs"
	},
	{
		suffix: "shibecha.hokkaido.jp",
		reversed: "pj.odiakkoh.ahcebihs"
	},
	{
		suffix: "shibetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebihs"
	},
	{
		suffix: "shibukawa.gunma.jp",
		reversed: "pj.amnug.awakubihs"
	},
	{
		suffix: "shibuya.tokyo.jp",
		reversed: "pj.oykot.ayubihs"
	},
	{
		suffix: "shichikashuku.miyagi.jp",
		reversed: "pj.igayim.ukuhsakihcihs"
	},
	{
		suffix: "shichinohe.aomori.jp",
		reversed: "pj.iromoa.ehonihcihs"
	},
	{
		suffix: "shiftcrypto.dev",
		reversed: "ved.otpyrctfihs"
	},
	{
		suffix: "shiftcrypto.io",
		reversed: "oi.otpyrctfihs"
	},
	{
		suffix: "shiftedit.io",
		reversed: "oi.tidetfihs"
	},
	{
		suffix: "shiga.jp",
		reversed: "pj.agihs"
	},
	{
		suffix: "shiiba.miyazaki.jp",
		reversed: "pj.ikazayim.abiihs"
	},
	{
		suffix: "shijonawate.osaka.jp",
		reversed: "pj.akaso.etawanojihs"
	},
	{
		suffix: "shika.ishikawa.jp",
		reversed: "pj.awakihsi.akihs"
	},
	{
		suffix: "shikabe.hokkaido.jp",
		reversed: "pj.odiakkoh.ebakihs"
	},
	{
		suffix: "shikama.miyagi.jp",
		reversed: "pj.igayim.amakihs"
	},
	{
		suffix: "shikaoi.hokkaido.jp",
		reversed: "pj.odiakkoh.ioakihs"
	},
	{
		suffix: "shikatsu.aichi.jp",
		reversed: "pj.ihcia.ustakihs"
	},
	{
		suffix: "shiki.saitama.jp",
		reversed: "pj.amatias.ikihs"
	},
	{
		suffix: "shikokuchuo.ehime.jp",
		reversed: "pj.emihe.ouhcukokihs"
	},
	{
		suffix: "shiksha",
		reversed: "ahskihs"
	},
	{
		suffix: "shima.mie.jp",
		reversed: "pj.eim.amihs"
	},
	{
		suffix: "shimabara.nagasaki.jp",
		reversed: "pj.ikasagan.arabamihs"
	},
	{
		suffix: "shimada.shizuoka.jp",
		reversed: "pj.akouzihs.adamihs"
	},
	{
		suffix: "shimamaki.hokkaido.jp",
		reversed: "pj.odiakkoh.ikamamihs"
	},
	{
		suffix: "shimamoto.osaka.jp",
		reversed: "pj.akaso.otomamihs"
	},
	{
		suffix: "shimane.jp",
		reversed: "pj.enamihs"
	},
	{
		suffix: "shimane.shimane.jp",
		reversed: "pj.enamihs.enamihs"
	},
	{
		suffix: "shimizu.hokkaido.jp",
		reversed: "pj.odiakkoh.uzimihs"
	},
	{
		suffix: "shimizu.shizuoka.jp",
		reversed: "pj.akouzihs.uzimihs"
	},
	{
		suffix: "shimoda.shizuoka.jp",
		reversed: "pj.akouzihs.adomihs"
	},
	{
		suffix: "shimodate.ibaraki.jp",
		reversed: "pj.ikarabi.etadomihs"
	},
	{
		suffix: "shimofusa.chiba.jp",
		reversed: "pj.abihc.asufomihs"
	},
	{
		suffix: "shimogo.fukushima.jp",
		reversed: "pj.amihsukuf.ogomihs"
	},
	{
		suffix: "shimoichi.nara.jp",
		reversed: "pj.aran.ihciomihs"
	},
	{
		suffix: "shimoji.okinawa.jp",
		reversed: "pj.awaniko.ijomihs"
	},
	{
		suffix: "shimokawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awakomihs"
	},
	{
		suffix: "shimokitayama.nara.jp",
		reversed: "pj.aran.amayatikomihs"
	},
	{
		suffix: "shimonita.gunma.jp",
		reversed: "pj.amnug.atinomihs"
	},
	{
		suffix: "shimonoseki.yamaguchi.jp",
		reversed: "pj.ihcugamay.ikesonomihs"
	},
	{
		suffix: "shimosuwa.nagano.jp",
		reversed: "pj.onagan.awusomihs"
	},
	{
		suffix: "shimotsuke.tochigi.jp",
		reversed: "pj.igihcot.ekustomihs"
	},
	{
		suffix: "shimotsuma.ibaraki.jp",
		reversed: "pj.ikarabi.amustomihs"
	},
	{
		suffix: "shinagawa.tokyo.jp",
		reversed: "pj.oykot.awaganihs"
	},
	{
		suffix: "shinanomachi.nagano.jp",
		reversed: "pj.onagan.ihcamonanihs"
	},
	{
		suffix: "shingo.aomori.jp",
		reversed: "pj.iromoa.ognihs"
	},
	{
		suffix: "shingu.fukuoka.jp",
		reversed: "pj.akoukuf.ugnihs"
	},
	{
		suffix: "shingu.hyogo.jp",
		reversed: "pj.ogoyh.ugnihs"
	},
	{
		suffix: "shingu.wakayama.jp",
		reversed: "pj.amayakaw.ugnihs"
	},
	{
		suffix: "shinichi.hiroshima.jp",
		reversed: "pj.amihsorih.ihcinihs"
	},
	{
		suffix: "shinjo.nara.jp",
		reversed: "pj.aran.ojnihs"
	},
	{
		suffix: "shinjo.okayama.jp",
		reversed: "pj.amayako.ojnihs"
	},
	{
		suffix: "shinjo.yamagata.jp",
		reversed: "pj.atagamay.ojnihs"
	},
	{
		suffix: "shinjuku.tokyo.jp",
		reversed: "pj.oykot.ukujnihs"
	},
	{
		suffix: "shinkamigoto.nagasaki.jp",
		reversed: "pj.ikasagan.otogimaknihs"
	},
	{
		suffix: "shinonsen.hyogo.jp",
		reversed: "pj.ogoyh.nesnonihs"
	},
	{
		suffix: "shinshinotsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustonihsnihs"
	},
	{
		suffix: "shinshiro.aichi.jp",
		reversed: "pj.ihcia.orihsnihs"
	},
	{
		suffix: "shinto.gunma.jp",
		reversed: "pj.amnug.otnihs"
	},
	{
		suffix: "shintoku.hokkaido.jp",
		reversed: "pj.odiakkoh.ukotnihs"
	},
	{
		suffix: "shintomi.miyazaki.jp",
		reversed: "pj.ikazayim.imotnihs"
	},
	{
		suffix: "shinyoshitomi.fukuoka.jp",
		reversed: "pj.akoukuf.imotihsoynihs"
	},
	{
		suffix: "shiogama.miyagi.jp",
		reversed: "pj.igayim.amagoihs"
	},
	{
		suffix: "shiojiri.nagano.jp",
		reversed: "pj.onagan.irijoihs"
	},
	{
		suffix: "shioya.tochigi.jp",
		reversed: "pj.igihcot.ayoihs"
	},
	{
		suffix: "shirahama.wakayama.jp",
		reversed: "pj.amayakaw.amaharihs"
	},
	{
		suffix: "shirakawa.fukushima.jp",
		reversed: "pj.amihsukuf.awakarihs"
	},
	{
		suffix: "shirakawa.gifu.jp",
		reversed: "pj.ufig.awakarihs"
	},
	{
		suffix: "shirako.chiba.jp",
		reversed: "pj.abihc.okarihs"
	},
	{
		suffix: "shiranuka.hokkaido.jp",
		reversed: "pj.odiakkoh.akunarihs"
	},
	{
		suffix: "shiraoi.hokkaido.jp",
		reversed: "pj.odiakkoh.ioarihs"
	},
	{
		suffix: "shiraoka.saitama.jp",
		reversed: "pj.amatias.akoarihs"
	},
	{
		suffix: "shirataka.yamagata.jp",
		reversed: "pj.atagamay.akatarihs"
	},
	{
		suffix: "shiriuchi.hokkaido.jp",
		reversed: "pj.odiakkoh.ihcuirihs"
	},
	{
		suffix: "shiroi.chiba.jp",
		reversed: "pj.abihc.iorihs"
	},
	{
		suffix: "shiroishi.miyagi.jp",
		reversed: "pj.igayim.ihsiorihs"
	},
	{
		suffix: "shiroishi.saga.jp",
		reversed: "pj.agas.ihsiorihs"
	},
	{
		suffix: "shirosato.ibaraki.jp",
		reversed: "pj.ikarabi.otasorihs"
	},
	{
		suffix: "shishikui.tokushima.jp",
		reversed: "pj.amihsukot.iukihsihs"
	},
	{
		suffix: "shiso.hyogo.jp",
		reversed: "pj.ogoyh.osihs"
	},
	{
		suffix: "shisui.chiba.jp",
		reversed: "pj.abihc.iusihs"
	},
	{
		suffix: "shitara.aichi.jp",
		reversed: "pj.ihcia.aratihs"
	},
	{
		suffix: "shiwa.iwate.jp",
		reversed: "pj.etawi.awihs"
	},
	{
		suffix: "shizukuishi.iwate.jp",
		reversed: "pj.etawi.ihsiukuzihs"
	},
	{
		suffix: "shizuoka.jp",
		reversed: "pj.akouzihs"
	},
	{
		suffix: "shizuoka.shizuoka.jp",
		reversed: "pj.akouzihs.akouzihs"
	},
	{
		suffix: "shobara.hiroshima.jp",
		reversed: "pj.amihsorih.arabohs"
	},
	{
		suffix: "shoes",
		reversed: "seohs"
	},
	{
		suffix: "shonai.fukuoka.jp",
		reversed: "pj.akoukuf.ianohs"
	},
	{
		suffix: "shonai.yamagata.jp",
		reversed: "pj.atagamay.ianohs"
	},
	{
		suffix: "shoo.okayama.jp",
		reversed: "pj.amayako.oohs"
	},
	{
		suffix: "shop",
		reversed: "pohs"
	},
	{
		suffix: "shop.brendly.rs",
		reversed: "sr.yldnerb.pohs"
	},
	{
		suffix: "shop.ht",
		reversed: "th.pohs"
	},
	{
		suffix: "shop.hu",
		reversed: "uh.pohs"
	},
	{
		suffix: "shop.pl",
		reversed: "lp.pohs"
	},
	{
		suffix: "shop.ro",
		reversed: "or.pohs"
	},
	{
		suffix: "shop.th",
		reversed: "ht.pohs"
	},
	{
		suffix: "shoparena.pl",
		reversed: "lp.anerapohs"
	},
	{
		suffix: "shopitsite.com",
		reversed: "moc.etistipohs"
	},
	{
		suffix: "shopping",
		reversed: "gnippohs"
	},
	{
		suffix: "shopselect.net",
		reversed: "ten.tcelespohs"
	},
	{
		suffix: "shopware.store",
		reversed: "erots.erawpohs"
	},
	{
		suffix: "shouji",
		reversed: "ijuohs"
	},
	{
		suffix: "show",
		reversed: "wohs"
	},
	{
		suffix: "show.aero",
		reversed: "orea.wohs"
	},
	{
		suffix: "showa.fukushima.jp",
		reversed: "pj.amihsukuf.awohs"
	},
	{
		suffix: "showa.gunma.jp",
		reversed: "pj.amnug.awohs"
	},
	{
		suffix: "showa.yamanashi.jp",
		reversed: "pj.ihsanamay.awohs"
	},
	{
		suffix: "showtime",
		reversed: "emitwohs"
	},
	{
		suffix: "shunan.yamaguchi.jp",
		reversed: "pj.ihcugamay.nanuhs"
	},
	{
		suffix: "shw.io",
		reversed: "oi.whs"
	},
	{
		suffix: "si",
		reversed: "is"
	},
	{
		suffix: "si.eu.org",
		reversed: "gro.ue.is"
	},
	{
		suffix: "si.it",
		reversed: "ti.is"
	},
	{
		suffix: "sibenik.museum",
		reversed: "muesum.kinebis"
	},
	{
		suffix: "sic.it",
		reversed: "ti.cis"
	},
	{
		suffix: "sicilia.it",
		reversed: "ti.ailicis"
	},
	{
		suffix: "sicily.it",
		reversed: "ti.ylicis"
	},
	{
		suffix: "siellak.no",
		reversed: "on.kalleis"
	},
	{
		suffix: "siena.it",
		reversed: "ti.aneis"
	},
	{
		suffix: "sigdal.no",
		reversed: "on.ladgis"
	},
	{
		suffix: "siiites.com",
		reversed: "moc.setiiis"
	},
	{
		suffix: "siljan.no",
		reversed: "on.najlis"
	},
	{
		suffix: "silk",
		reversed: "klis"
	},
	{
		suffix: "silk.museum",
		reversed: "muesum.klis"
	},
	{
		suffix: "simple-url.com",
		reversed: "moc.lru-elpmis"
	},
	{
		suffix: "simplesite.com",
		reversed: "moc.etiselpmis"
	},
	{
		suffix: "simplesite.com.br",
		reversed: "rb.moc.etiselpmis"
	},
	{
		suffix: "simplesite.gr",
		reversed: "rg.etiselpmis"
	},
	{
		suffix: "simplesite.pl",
		reversed: "lp.etiselpmis"
	},
	{
		suffix: "sina",
		reversed: "anis"
	},
	{
		suffix: "sinaapp.com",
		reversed: "moc.ppaanis"
	},
	{
		suffix: "singles",
		reversed: "selgnis"
	},
	{
		suffix: "siracusa.it",
		reversed: "ti.asucaris"
	},
	{
		suffix: "sirdal.no",
		reversed: "on.ladris"
	},
	{
		suffix: "site",
		reversed: "etis"
	},
	{
		suffix: "site.tb-hosting.com",
		reversed: "moc.gnitsoh-bt.etis"
	},
	{
		suffix: "site.transip.me",
		reversed: "em.pisnart.etis"
	},
	{
		suffix: "siteleaf.net",
		reversed: "ten.faeletis"
	},
	{
		suffix: "sites.static.land",
		reversed: "dnal.citats.setis"
	},
	{
		suffix: "sj",
		reversed: "js"
	},
	{
		suffix: "sjc.br",
		reversed: "rb.cjs"
	},
	{
		suffix: "sk",
		reversed: "ks"
	},
	{
		suffix: "sk.ca",
		reversed: "ac.ks"
	},
	{
		suffix: "sk.eu.org",
		reversed: "gro.ue.ks"
	},
	{
		suffix: "skanit.no",
		reversed: "on.tinaks"
	},
	{
		suffix: "skanland.no",
		reversed: "on.dnalnaks"
	},
	{
		suffix: "skaun.no",
		reversed: "on.nuaks"
	},
	{
		suffix: "skedsmo.no",
		reversed: "on.omsdeks"
	},
	{
		suffix: "skedsmokorset.no",
		reversed: "on.tesrokomsdeks"
	},
	{
		suffix: "ski",
		reversed: "iks"
	},
	{
		suffix: "ski.museum",
		reversed: "muesum.iks"
	},
	{
		suffix: "ski.no",
		reversed: "on.iks"
	},
	{
		suffix: "skien.no",
		reversed: "on.neiks"
	},
	{
		suffix: "skierva.no",
		reversed: "on.avreiks"
	},
	{
		suffix: "skiervá.no",
		reversed: "on.atu-vreiks--nx"
	},
	{
		suffix: "skin",
		reversed: "niks"
	},
	{
		suffix: "skiptvet.no",
		reversed: "on.tevtpiks"
	},
	{
		suffix: "skjak.no",
		reversed: "on.kajks"
	},
	{
		suffix: "skjervoy.no",
		reversed: "on.yovrejks"
	},
	{
		suffix: "skjervøy.no",
		reversed: "on.a1v-yvrejks--nx"
	},
	{
		suffix: "skjåk.no",
		reversed: "on.aos-kjks--nx"
	},
	{
		suffix: "sklep.pl",
		reversed: "lp.pelks"
	},
	{
		suffix: "sko.gov.pl",
		reversed: "lp.vog.oks"
	},
	{
		suffix: "skoczow.pl",
		reversed: "lp.wozcoks"
	},
	{
		suffix: "skodje.no",
		reversed: "on.ejdoks"
	},
	{
		suffix: "skole.museum",
		reversed: "muesum.eloks"
	},
	{
		suffix: "sky",
		reversed: "yks"
	},
	{
		suffix: "skydiving.aero",
		reversed: "orea.gnividyks"
	},
	{
		suffix: "skygearapp.com",
		reversed: "moc.pparaegyks"
	},
	{
		suffix: "skype",
		reversed: "epyks"
	},
	{
		suffix: "skánit.no",
		reversed: "on.aqy-tinks--nx"
	},
	{
		suffix: "skånland.no",
		reversed: "on.axf-dnalnks--nx"
	},
	{
		suffix: "sl",
		reversed: "ls"
	},
	{
		suffix: "slask.pl",
		reversed: "lp.ksals"
	},
	{
		suffix: "slattum.no",
		reversed: "on.muttals"
	},
	{
		suffix: "sld.do",
		reversed: "od.dls"
	},
	{
		suffix: "sld.pa",
		reversed: "ap.dls"
	},
	{
		suffix: "slg.br",
		reversed: "rb.gls"
	},
	{
		suffix: "sling",
		reversed: "gnils"
	},
	{
		suffix: "slupsk.pl",
		reversed: "lp.kspuls"
	},
	{
		suffix: "slz.br",
		reversed: "rb.zls"
	},
	{
		suffix: "sm",
		reversed: "ms"
	},
	{
		suffix: "sm.ua",
		reversed: "au.ms"
	},
	{
		suffix: "small-web.org",
		reversed: "gro.bew-llams"
	},
	{
		suffix: "smart",
		reversed: "trams"
	},
	{
		suffix: "smartlabeling.scw.cloud",
		reversed: "duolc.wcs.gnilebaltrams"
	},
	{
		suffix: "smile",
		reversed: "elims"
	},
	{
		suffix: "smola.no",
		reversed: "on.aloms"
	},
	{
		suffix: "smushcdn.com",
		reversed: "moc.ndchsums"
	},
	{
		suffix: "smøla.no",
		reversed: "on.arh-alms--nx"
	},
	{
		suffix: "sn",
		reversed: "ns"
	},
	{
		suffix: "sn.cn",
		reversed: "nc.ns"
	},
	{
		suffix: "snaase.no",
		reversed: "on.esaans"
	},
	{
		suffix: "snasa.no",
		reversed: "on.asans"
	},
	{
		suffix: "sncf",
		reversed: "fcns"
	},
	{
		suffix: "snillfjord.no",
		reversed: "on.drojfllins"
	},
	{
		suffix: "snoasa.no",
		reversed: "on.asaons"
	},
	{
		suffix: "snåase.no",
		reversed: "on.arn-esans--nx"
	},
	{
		suffix: "snåsa.no",
		reversed: "on.aor-asns--nx"
	},
	{
		suffix: "so",
		reversed: "os"
	},
	{
		suffix: "so.gov.pl",
		reversed: "lp.vog.os"
	},
	{
		suffix: "so.it",
		reversed: "ti.os"
	},
	{
		suffix: "sobetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebos"
	},
	{
		suffix: "soc.dz",
		reversed: "zd.cos"
	},
	{
		suffix: "soc.lk",
		reversed: "kl.cos"
	},
	{
		suffix: "soc.srcf.net",
		reversed: "ten.fcrs.cos"
	},
	{
		suffix: "soccer",
		reversed: "reccos"
	},
	{
		suffix: "sochi.su",
		reversed: "us.ihcos"
	},
	{
		suffix: "social",
		reversed: "laicos"
	},
	{
		suffix: "society.museum",
		reversed: "muesum.yteicos"
	},
	{
		suffix: "sodegaura.chiba.jp",
		reversed: "pj.abihc.aruagedos"
	},
	{
		suffix: "soeda.fukuoka.jp",
		reversed: "pj.akoukuf.adeos"
	},
	{
		suffix: "softbank",
		reversed: "knabtfos"
	},
	{
		suffix: "software",
		reversed: "erawtfos"
	},
	{
		suffix: "software.aero",
		reversed: "orea.erawtfos"
	},
	{
		suffix: "sogndal.no",
		reversed: "on.ladngos"
	},
	{
		suffix: "sogne.no",
		reversed: "on.engos"
	},
	{
		suffix: "sohu",
		reversed: "uhos"
	},
	{
		suffix: "soja.okayama.jp",
		reversed: "pj.amayako.ajos"
	},
	{
		suffix: "soka.saitama.jp",
		reversed: "pj.amatias.akos"
	},
	{
		suffix: "sokndal.no",
		reversed: "on.ladnkos"
	},
	{
		suffix: "sola.no",
		reversed: "on.alos"
	},
	{
		suffix: "solar",
		reversed: "ralos"
	},
	{
		suffix: "sologne.museum",
		reversed: "muesum.engolos"
	},
	{
		suffix: "solund.no",
		reversed: "on.dnulos"
	},
	{
		suffix: "solutions",
		reversed: "snoitulos"
	},
	{
		suffix: "soma.fukushima.jp",
		reversed: "pj.amihsukuf.amos"
	},
	{
		suffix: "somna.no",
		reversed: "on.anmos"
	},
	{
		suffix: "sondre-land.no",
		reversed: "on.dnal-erdnos"
	},
	{
		suffix: "sondrio.it",
		reversed: "ti.oirdnos"
	},
	{
		suffix: "song",
		reversed: "gnos"
	},
	{
		suffix: "songdalen.no",
		reversed: "on.neladgnos"
	},
	{
		suffix: "soni.nara.jp",
		reversed: "pj.aran.inos"
	},
	{
		suffix: "sony",
		reversed: "ynos"
	},
	{
		suffix: "soo.kagoshima.jp",
		reversed: "pj.amihsogak.oos"
	},
	{
		suffix: "sopot.pl",
		reversed: "lp.topos"
	},
	{
		suffix: "sor-aurdal.no",
		reversed: "on.ladrua-ros"
	},
	{
		suffix: "sor-fron.no",
		reversed: "on.norf-ros"
	},
	{
		suffix: "sor-odal.no",
		reversed: "on.lado-ros"
	},
	{
		suffix: "sor-varanger.no",
		reversed: "on.regnarav-ros"
	},
	{
		suffix: "sorfold.no",
		reversed: "on.dlofros"
	},
	{
		suffix: "sorocaba.br",
		reversed: "rb.abacoros"
	},
	{
		suffix: "sorreisa.no",
		reversed: "on.asierros"
	},
	{
		suffix: "sortland.no",
		reversed: "on.dnaltros"
	},
	{
		suffix: "sorum.no",
		reversed: "on.muros"
	},
	{
		suffix: "sos.pl",
		reversed: "lp.sos"
	},
	{
		suffix: "sosa.chiba.jp",
		reversed: "pj.abihc.asos"
	},
	{
		suffix: "sosnowiec.pl",
		reversed: "lp.ceiwonsos"
	},
	{
		suffix: "soundandvision.museum",
		reversed: "muesum.noisivdnadnuos"
	},
	{
		suffix: "soundcast.me",
		reversed: "em.tsacdnuos"
	},
	{
		suffix: "southcarolina.museum",
		reversed: "muesum.anilorachtuos"
	},
	{
		suffix: "southwest.museum",
		reversed: "muesum.tsewhtuos"
	},
	{
		suffix: "sowa.ibaraki.jp",
		reversed: "pj.ikarabi.awos"
	},
	{
		suffix: "soy",
		reversed: "yos"
	},
	{
		suffix: "sp.gov.br",
		reversed: "rb.vog.ps"
	},
	{
		suffix: "sp.it",
		reversed: "ti.ps"
	},
	{
		suffix: "sp.leg.br",
		reversed: "rb.gel.ps"
	},
	{
		suffix: "spa",
		reversed: "aps"
	},
	{
		suffix: "space",
		reversed: "ecaps"
	},
	{
		suffix: "space-to-rent.com",
		reversed: "moc.tner-ot-ecaps"
	},
	{
		suffix: "space.museum",
		reversed: "muesum.ecaps"
	},
	{
		suffix: "spacekit.io",
		reversed: "oi.tikecaps"
	},
	{
		suffix: "spb.ru",
		reversed: "ur.bps"
	},
	{
		suffix: "spb.su",
		reversed: "us.bps"
	},
	{
		suffix: "spdns.de",
		reversed: "ed.sndps"
	},
	{
		suffix: "spdns.eu",
		reversed: "ue.sndps"
	},
	{
		suffix: "spdns.org",
		reversed: "gro.sndps"
	},
	{
		suffix: "sphinx.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.xnihps"
	},
	{
		suffix: "spjelkavik.no",
		reversed: "on.kivaklejps"
	},
	{
		suffix: "sport",
		reversed: "trops"
	},
	{
		suffix: "sport.hu",
		reversed: "uh.trops"
	},
	{
		suffix: "spot",
		reversed: "tops"
	},
	{
		suffix: "spy.museum",
		reversed: "muesum.yps"
	},
	{
		suffix: "spydeberg.no",
		reversed: "on.grebedyps"
	},
	{
		suffix: "square.museum",
		reversed: "muesum.erauqs"
	},
	{
		suffix: "square7.ch",
		reversed: "hc.7erauqs"
	},
	{
		suffix: "square7.de",
		reversed: "ed.7erauqs"
	},
	{
		suffix: "square7.net",
		reversed: "ten.7erauqs"
	},
	{
		suffix: "sr",
		reversed: "rs"
	},
	{
		suffix: "sr.gov.pl",
		reversed: "lp.vog.rs"
	},
	{
		suffix: "sr.it",
		reversed: "ti.rs"
	},
	{
		suffix: "srht.site",
		reversed: "etis.thrs"
	},
	{
		suffix: "srl",
		reversed: "lrs"
	},
	{
		suffix: "srv.br",
		reversed: "rb.vrs"
	},
	{
		suffix: "ss",
		reversed: "ss"
	},
	{
		suffix: "ss.it",
		reversed: "ti.ss"
	},
	{
		suffix: "ssl.origin.cdn77-secure.org",
		reversed: "gro.eruces-77ndc.nigiro.lss"
	},
	{
		suffix: "st",
		reversed: "ts"
	},
	{
		suffix: "st.no",
		reversed: "on.ts"
	},
	{
		suffix: "staba.jp",
		reversed: "pj.abats"
	},
	{
		suffix: "stackhero-network.com",
		reversed: "moc.krowten-orehkcats"
	},
	{
		suffix: "stada",
		reversed: "adats"
	},
	{
		suffix: "stadt.museum",
		reversed: "muesum.tdats"
	},
	{
		suffix: "stage.nodeart.io",
		reversed: "oi.traedon.egats"
	},
	{
		suffix: "staging.onred.one",
		reversed: "eno.derno.gnigats"
	},
	{
		suffix: "stalbans.museum",
		reversed: "muesum.snablats"
	},
	{
		suffix: "stalowa-wola.pl",
		reversed: "lp.alow-awolats"
	},
	{
		suffix: "stange.no",
		reversed: "on.egnats"
	},
	{
		suffix: "staples",
		reversed: "selpats"
	},
	{
		suffix: "star",
		reversed: "rats"
	},
	{
		suffix: "starachowice.pl",
		reversed: "lp.eciwohcarats"
	},
	{
		suffix: "stargard.pl",
		reversed: "lp.dragrats"
	},
	{
		suffix: "starnberg.museum",
		reversed: "muesum.grebnrats"
	},
	{
		suffix: "starostwo.gov.pl",
		reversed: "lp.vog.owtsorats"
	},
	{
		suffix: "stat.no",
		reversed: "on.tats"
	},
	{
		suffix: "state.museum",
		reversed: "muesum.etats"
	},
	{
		suffix: "statebank",
		reversed: "knabetats"
	},
	{
		suffix: "statefarm",
		reversed: "mrafetats"
	},
	{
		suffix: "stateofdelaware.museum",
		reversed: "muesum.erawaledfoetats"
	},
	{
		suffix: "stathelle.no",
		reversed: "on.ellehtats"
	},
	{
		suffix: "static-access.net",
		reversed: "ten.ssecca-citats"
	},
	{
		suffix: "static.land",
		reversed: "dnal.citats"
	},
	{
		suffix: "static.observableusercontent.com",
		reversed: "moc.tnetnocresuelbavresbo.citats"
	},
	{
		suffix: "station.museum",
		reversed: "muesum.noitats"
	},
	{
		suffix: "stavanger.no",
		reversed: "on.regnavats"
	},
	{
		suffix: "stavern.no",
		reversed: "on.nrevats"
	},
	{
		suffix: "stc",
		reversed: "cts"
	},
	{
		suffix: "stcgroup",
		reversed: "puorgcts"
	},
	{
		suffix: "steam.museum",
		reversed: "muesum.maets"
	},
	{
		suffix: "steiermark.museum",
		reversed: "muesum.kramreiets"
	},
	{
		suffix: "steigen.no",
		reversed: "on.negiets"
	},
	{
		suffix: "steinkjer.no",
		reversed: "on.rejkniets"
	},
	{
		suffix: "sth.ac.at",
		reversed: "ta.ca.hts"
	},
	{
		suffix: "stjohn.museum",
		reversed: "muesum.nhojts"
	},
	{
		suffix: "stjordal.no",
		reversed: "on.ladrojts"
	},
	{
		suffix: "stjordalshalsen.no",
		reversed: "on.neslahsladrojts"
	},
	{
		suffix: "stjørdal.no",
		reversed: "on.a1s-ladrjts--nx"
	},
	{
		suffix: "stjørdalshalsen.no",
		reversed: "on.bqs-neslahsladrjts--nx"
	},
	{
		suffix: "stockholm",
		reversed: "mlohkcots"
	},
	{
		suffix: "stockholm.museum",
		reversed: "muesum.mlohkcots"
	},
	{
		suffix: "stokke.no",
		reversed: "on.ekkots"
	},
	{
		suffix: "stor-elvdal.no",
		reversed: "on.ladvle-rots"
	},
	{
		suffix: "storage",
		reversed: "egarots"
	},
	{
		suffix: "storage.yandexcloud.net",
		reversed: "ten.duolcxednay.egarots"
	},
	{
		suffix: "stord.no",
		reversed: "on.drots"
	},
	{
		suffix: "stordal.no",
		reversed: "on.ladrots"
	},
	{
		suffix: "store",
		reversed: "erots"
	},
	{
		suffix: "store.bb",
		reversed: "bb.erots"
	},
	{
		suffix: "store.dk",
		reversed: "kd.erots"
	},
	{
		suffix: "store.nf",
		reversed: "fn.erots"
	},
	{
		suffix: "store.ro",
		reversed: "or.erots"
	},
	{
		suffix: "store.st",
		reversed: "ts.erots"
	},
	{
		suffix: "store.ve",
		reversed: "ev.erots"
	},
	{
		suffix: "storebase.store",
		reversed: "erots.esaberots"
	},
	{
		suffix: "storfjord.no",
		reversed: "on.drojfrots"
	},
	{
		suffix: "storj.farm",
		reversed: "mraf.jrots"
	},
	{
		suffix: "stpetersburg.museum",
		reversed: "muesum.grubsretepts"
	},
	{
		suffix: "strand.no",
		reversed: "on.dnarts"
	},
	{
		suffix: "stranda.no",
		reversed: "on.adnarts"
	},
	{
		suffix: "stream",
		reversed: "maerts"
	},
	{
		suffix: "streamlitapp.com",
		reversed: "moc.ppatilmaerts"
	},
	{
		suffix: "stripper.jp",
		reversed: "pj.reppirts"
	},
	{
		suffix: "stryn.no",
		reversed: "on.nyrts"
	},
	{
		suffix: "student.aero",
		reversed: "orea.tneduts"
	},
	{
		suffix: "studio",
		reversed: "oiduts"
	},
	{
		suffix: "study",
		reversed: "yduts"
	},
	{
		suffix: "stuff-4-sale.org",
		reversed: "gro.elas-4-ffuts"
	},
	{
		suffix: "stuff-4-sale.us",
		reversed: "su.elas-4-ffuts"
	},
	{
		suffix: "stufftoread.com",
		reversed: "moc.daerotffuts"
	},
	{
		suffix: "stuttgart.museum",
		reversed: "muesum.tragttuts"
	},
	{
		suffix: "style",
		reversed: "elyts"
	},
	{
		suffix: "su",
		reversed: "us"
	},
	{
		suffix: "su.paba.se",
		reversed: "es.abap.us"
	},
	{
		suffix: "sub.jp",
		reversed: "pj.bus"
	},
	{
		suffix: "sucks",
		reversed: "skcus"
	},
	{
		suffix: "sue.fukuoka.jp",
		reversed: "pj.akoukuf.eus"
	},
	{
		suffix: "suedtirol.it",
		reversed: "ti.loritdeus"
	},
	{
		suffix: "suginami.tokyo.jp",
		reversed: "pj.oykot.imanigus"
	},
	{
		suffix: "sugito.saitama.jp",
		reversed: "pj.amatias.otigus"
	},
	{
		suffix: "suifu.ibaraki.jp",
		reversed: "pj.ikarabi.ufius"
	},
	{
		suffix: "suisse.museum",
		reversed: "muesum.essius"
	},
	{
		suffix: "suita.osaka.jp",
		reversed: "pj.akaso.atius"
	},
	{
		suffix: "sukagawa.fukushima.jp",
		reversed: "pj.amihsukuf.awagakus"
	},
	{
		suffix: "sukumo.kochi.jp",
		reversed: "pj.ihcok.omukus"
	},
	{
		suffix: "sula.no",
		reversed: "on.alus"
	},
	{
		suffix: "suldal.no",
		reversed: "on.ladlus"
	},
	{
		suffix: "suli.hu",
		reversed: "uh.ilus"
	},
	{
		suffix: "sumida.tokyo.jp",
		reversed: "pj.oykot.adimus"
	},
	{
		suffix: "sumita.iwate.jp",
		reversed: "pj.etawi.atimus"
	},
	{
		suffix: "sumoto.hyogo.jp",
		reversed: "pj.ogoyh.otomus"
	},
	{
		suffix: "sumoto.kumamoto.jp",
		reversed: "pj.otomamuk.otomus"
	},
	{
		suffix: "sumy.ua",
		reversed: "au.ymus"
	},
	{
		suffix: "sunagawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awaganus"
	},
	{
		suffix: "sund.no",
		reversed: "on.dnus"
	},
	{
		suffix: "sunndal.no",
		reversed: "on.ladnnus"
	},
	{
		suffix: "sunnyday.jp",
		reversed: "pj.yadynnus"
	},
	{
		suffix: "supabase.co",
		reversed: "oc.esabapus"
	},
	{
		suffix: "supabase.in",
		reversed: "ni.esabapus"
	},
	{
		suffix: "supabase.net",
		reversed: "ten.esabapus"
	},
	{
		suffix: "supersale.jp",
		reversed: "pj.elasrepus"
	},
	{
		suffix: "supplies",
		reversed: "seilppus"
	},
	{
		suffix: "supply",
		reversed: "ylppus"
	},
	{
		suffix: "support",
		reversed: "troppus"
	},
	{
		suffix: "surf",
		reversed: "frus"
	},
	{
		suffix: "surgeonshall.museum",
		reversed: "muesum.llahsnoegrus"
	},
	{
		suffix: "surgery",
		reversed: "yregrus"
	},
	{
		suffix: "surnadal.no",
		reversed: "on.ladanrus"
	},
	{
		suffix: "surrey.museum",
		reversed: "muesum.yerrus"
	},
	{
		suffix: "susaki.kochi.jp",
		reversed: "pj.ihcok.ikasus"
	},
	{
		suffix: "susono.shizuoka.jp",
		reversed: "pj.akouzihs.onosus"
	},
	{
		suffix: "suwa.nagano.jp",
		reversed: "pj.onagan.awus"
	},
	{
		suffix: "suwalki.pl",
		reversed: "lp.iklawus"
	},
	{
		suffix: "suzaka.nagano.jp",
		reversed: "pj.onagan.akazus"
	},
	{
		suffix: "suzu.ishikawa.jp",
		reversed: "pj.awakihsi.uzus"
	},
	{
		suffix: "suzuka.mie.jp",
		reversed: "pj.eim.akuzus"
	},
	{
		suffix: "suzuki",
		reversed: "ikuzus"
	},
	{
		suffix: "sv",
		reversed: "vs"
	},
	{
		suffix: "sv.it",
		reversed: "ti.vs"
	},
	{
		suffix: "svalbard.no",
		reversed: "on.drablavs"
	},
	{
		suffix: "sveio.no",
		reversed: "on.oievs"
	},
	{
		suffix: "svelvik.no",
		reversed: "on.kivlevs"
	},
	{
		suffix: "svizzera.museum",
		reversed: "muesum.arezzivs"
	},
	{
		suffix: "svn-repos.de",
		reversed: "ed.soper-nvs"
	},
	{
		suffix: "swatch",
		reversed: "hctaws"
	},
	{
		suffix: "sweden.museum",
		reversed: "muesum.nedews"
	},
	{
		suffix: "sweetpepper.org",
		reversed: "gro.reppepteews"
	},
	{
		suffix: "swidnica.pl",
		reversed: "lp.acindiws"
	},
	{
		suffix: "swidnik.pl",
		reversed: "lp.kindiws"
	},
	{
		suffix: "swiebodzin.pl",
		reversed: "lp.nizdobeiws"
	},
	{
		suffix: "swinoujscie.pl",
		reversed: "lp.eicsjuoniws"
	},
	{
		suffix: "swiss",
		reversed: "ssiws"
	},
	{
		suffix: "sx",
		reversed: "xs"
	},
	{
		suffix: "sx.cn",
		reversed: "nc.xs"
	},
	{
		suffix: "sy",
		reversed: "ys"
	},
	{
		suffix: "sydney",
		reversed: "yendys"
	},
	{
		suffix: "sydney.museum",
		reversed: "muesum.yendys"
	},
	{
		suffix: "sykkylven.no",
		reversed: "on.nevlykkys"
	},
	{
		suffix: "syncloud.it",
		reversed: "ti.duolcnys"
	},
	{
		suffix: "syno-ds.de",
		reversed: "ed.sd-onys"
	},
	{
		suffix: "synology-diskstation.de",
		reversed: "ed.noitatsksid-ygolonys"
	},
	{
		suffix: "synology-ds.de",
		reversed: "ed.sd-ygolonys"
	},
	{
		suffix: "synology.me",
		reversed: "em.ygolonys"
	},
	{
		suffix: "systems",
		reversed: "smetsys"
	},
	{
		suffix: "sytes.net",
		reversed: "ten.setys"
	},
	{
		suffix: "sz",
		reversed: "zs"
	},
	{
		suffix: "szczecin.pl",
		reversed: "lp.nicezczs"
	},
	{
		suffix: "szczytno.pl",
		reversed: "lp.ontyzczs"
	},
	{
		suffix: "szex.hu",
		reversed: "uh.xezs"
	},
	{
		suffix: "szkola.pl",
		reversed: "lp.alokzs"
	},
	{
		suffix: "sálat.no",
		reversed: "on.an5-tals--nx"
	},
	{
		suffix: "sálát.no",
		reversed: "on.bale-tls--nx"
	},
	{
		suffix: "søgne.no",
		reversed: "on.arg-engs--nx"
	},
	{
		suffix: "sømna.no",
		reversed: "on.arg-anms--nx"
	},
	{
		suffix: "søndre-land.no",
		reversed: "on.bc0-dnal-erdns--nx"
	},
	{
		suffix: "sør-aurdal.no",
		reversed: "on.a8l-ladrua-rs--nx"
	},
	{
		suffix: "sør-fron.no",
		reversed: "on.a1q-norf-rs--nx"
	},
	{
		suffix: "sør-odal.no",
		reversed: "on.a1q-lado-rs--nx"
	},
	{
		suffix: "sør-varanger.no",
		reversed: "on.bgg-regnarav-rs--nx"
	},
	{
		suffix: "sørfold.no",
		reversed: "on.ayb-dlofrs--nx"
	},
	{
		suffix: "sørreisa.no",
		reversed: "on.a1q-asierrs--nx"
	},
	{
		suffix: "sørum.no",
		reversed: "on.arg-murs--nx"
	},
	{
		suffix: "südtirol.it",
		reversed: "ti.a2n-loritds--nx"
	},
	{
		suffix: "t.bg",
		reversed: "gb.t"
	},
	{
		suffix: "t.se",
		reversed: "es.t"
	},
	{
		suffix: "t3l3p0rt.net",
		reversed: "ten.tr0p3l3t"
	},
	{
		suffix: "ta.it",
		reversed: "ti.at"
	},
	{
		suffix: "taa.it",
		reversed: "ti.aat"
	},
	{
		suffix: "tab",
		reversed: "bat"
	},
	{
		suffix: "tabayama.yamanashi.jp",
		reversed: "pj.ihsanamay.amayabat"
	},
	{
		suffix: "tabitorder.co.il",
		reversed: "li.oc.redrotibat"
	},
	{
		suffix: "tabuse.yamaguchi.jp",
		reversed: "pj.ihcugamay.esubat"
	},
	{
		suffix: "tachiarai.fukuoka.jp",
		reversed: "pj.akoukuf.iaraihcat"
	},
	{
		suffix: "tachikawa.tokyo.jp",
		reversed: "pj.oykot.awakihcat"
	},
	{
		suffix: "tadaoka.osaka.jp",
		reversed: "pj.akaso.akoadat"
	},
	{
		suffix: "tado.mie.jp",
		reversed: "pj.eim.odat"
	},
	{
		suffix: "tadotsu.kagawa.jp",
		reversed: "pj.awagak.ustodat"
	},
	{
		suffix: "tagajo.miyagi.jp",
		reversed: "pj.igayim.ojagat"
	},
	{
		suffix: "tagami.niigata.jp",
		reversed: "pj.atagiin.imagat"
	},
	{
		suffix: "tagawa.fukuoka.jp",
		reversed: "pj.akoukuf.awagat"
	},
	{
		suffix: "tahara.aichi.jp",
		reversed: "pj.ihcia.arahat"
	},
	{
		suffix: "taifun-dns.de",
		reversed: "ed.snd-nufiat"
	},
	{
		suffix: "taiji.wakayama.jp",
		reversed: "pj.amayakaw.ijiat"
	},
	{
		suffix: "taiki.hokkaido.jp",
		reversed: "pj.odiakkoh.ikiat"
	},
	{
		suffix: "taiki.mie.jp",
		reversed: "pj.eim.ikiat"
	},
	{
		suffix: "tainai.niigata.jp",
		reversed: "pj.atagiin.ianiat"
	},
	{
		suffix: "taipei",
		reversed: "iepiat"
	},
	{
		suffix: "taira.toyama.jp",
		reversed: "pj.amayot.ariat"
	},
	{
		suffix: "taishi.hyogo.jp",
		reversed: "pj.ogoyh.ihsiat"
	},
	{
		suffix: "taishi.osaka.jp",
		reversed: "pj.akaso.ihsiat"
	},
	{
		suffix: "taishin.fukushima.jp",
		reversed: "pj.amihsukuf.nihsiat"
	},
	{
		suffix: "taito.tokyo.jp",
		reversed: "pj.oykot.otiat"
	},
	{
		suffix: "taiwa.miyagi.jp",
		reversed: "pj.igayim.awiat"
	},
	{
		suffix: "tajimi.gifu.jp",
		reversed: "pj.ufig.imijat"
	},
	{
		suffix: "tajiri.osaka.jp",
		reversed: "pj.akaso.irijat"
	},
	{
		suffix: "taka.hyogo.jp",
		reversed: "pj.ogoyh.akat"
	},
	{
		suffix: "takagi.nagano.jp",
		reversed: "pj.onagan.igakat"
	},
	{
		suffix: "takahagi.ibaraki.jp",
		reversed: "pj.ikarabi.igahakat"
	},
	{
		suffix: "takahama.aichi.jp",
		reversed: "pj.ihcia.amahakat"
	},
	{
		suffix: "takahama.fukui.jp",
		reversed: "pj.iukuf.amahakat"
	},
	{
		suffix: "takaharu.miyazaki.jp",
		reversed: "pj.ikazayim.urahakat"
	},
	{
		suffix: "takahashi.okayama.jp",
		reversed: "pj.amayako.ihsahakat"
	},
	{
		suffix: "takahata.yamagata.jp",
		reversed: "pj.atagamay.atahakat"
	},
	{
		suffix: "takaishi.osaka.jp",
		reversed: "pj.akaso.ihsiakat"
	},
	{
		suffix: "takamatsu.kagawa.jp",
		reversed: "pj.awagak.ustamakat"
	},
	{
		suffix: "takamori.kumamoto.jp",
		reversed: "pj.otomamuk.iromakat"
	},
	{
		suffix: "takamori.nagano.jp",
		reversed: "pj.onagan.iromakat"
	},
	{
		suffix: "takanabe.miyazaki.jp",
		reversed: "pj.ikazayim.ebanakat"
	},
	{
		suffix: "takanezawa.tochigi.jp",
		reversed: "pj.igihcot.awazenakat"
	},
	{
		suffix: "takaoka.toyama.jp",
		reversed: "pj.amayot.akoakat"
	},
	{
		suffix: "takarazuka.hyogo.jp",
		reversed: "pj.ogoyh.akuzarakat"
	},
	{
		suffix: "takasago.hyogo.jp",
		reversed: "pj.ogoyh.ogasakat"
	},
	{
		suffix: "takasaki.gunma.jp",
		reversed: "pj.amnug.ikasakat"
	},
	{
		suffix: "takashima.shiga.jp",
		reversed: "pj.agihs.amihsakat"
	},
	{
		suffix: "takasu.hokkaido.jp",
		reversed: "pj.odiakkoh.usakat"
	},
	{
		suffix: "takata.fukuoka.jp",
		reversed: "pj.akoukuf.atakat"
	},
	{
		suffix: "takatori.nara.jp",
		reversed: "pj.aran.irotakat"
	},
	{
		suffix: "takatsuki.osaka.jp",
		reversed: "pj.akaso.ikustakat"
	},
	{
		suffix: "takatsuki.shiga.jp",
		reversed: "pj.agihs.ikustakat"
	},
	{
		suffix: "takayama.gifu.jp",
		reversed: "pj.ufig.amayakat"
	},
	{
		suffix: "takayama.gunma.jp",
		reversed: "pj.amnug.amayakat"
	},
	{
		suffix: "takayama.nagano.jp",
		reversed: "pj.onagan.amayakat"
	},
	{
		suffix: "takazaki.miyazaki.jp",
		reversed: "pj.ikazayim.ikazakat"
	},
	{
		suffix: "takehara.hiroshima.jp",
		reversed: "pj.amihsorih.arahekat"
	},
	{
		suffix: "taketa.oita.jp",
		reversed: "pj.atio.atekat"
	},
	{
		suffix: "taketomi.okinawa.jp",
		reversed: "pj.awaniko.imotekat"
	},
	{
		suffix: "taki.mie.jp",
		reversed: "pj.eim.ikat"
	},
	{
		suffix: "takikawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awakikat"
	},
	{
		suffix: "takino.hyogo.jp",
		reversed: "pj.ogoyh.onikat"
	},
	{
		suffix: "takinoue.hokkaido.jp",
		reversed: "pj.odiakkoh.euonikat"
	},
	{
		suffix: "takko.aomori.jp",
		reversed: "pj.iromoa.okkat"
	},
	{
		suffix: "tako.chiba.jp",
		reversed: "pj.abihc.okat"
	},
	{
		suffix: "taku.saga.jp",
		reversed: "pj.agas.ukat"
	},
	{
		suffix: "talk",
		reversed: "klat"
	},
	{
		suffix: "tama.tokyo.jp",
		reversed: "pj.oykot.amat"
	},
	{
		suffix: "tamakawa.fukushima.jp",
		reversed: "pj.amihsukuf.awakamat"
	},
	{
		suffix: "tamaki.mie.jp",
		reversed: "pj.eim.ikamat"
	},
	{
		suffix: "tamamura.gunma.jp",
		reversed: "pj.amnug.arumamat"
	},
	{
		suffix: "tamano.okayama.jp",
		reversed: "pj.amayako.onamat"
	},
	{
		suffix: "tamatsukuri.ibaraki.jp",
		reversed: "pj.ikarabi.irukustamat"
	},
	{
		suffix: "tamayu.shimane.jp",
		reversed: "pj.enamihs.uyamat"
	},
	{
		suffix: "tamba.hyogo.jp",
		reversed: "pj.ogoyh.abmat"
	},
	{
		suffix: "tana.no",
		reversed: "on.anat"
	},
	{
		suffix: "tanabe.kyoto.jp",
		reversed: "pj.otoyk.ebanat"
	},
	{
		suffix: "tanabe.wakayama.jp",
		reversed: "pj.amayakaw.ebanat"
	},
	{
		suffix: "tanagura.fukushima.jp",
		reversed: "pj.amihsukuf.aruganat"
	},
	{
		suffix: "tananger.no",
		reversed: "on.regnanat"
	},
	{
		suffix: "tank.museum",
		reversed: "muesum.knat"
	},
	{
		suffix: "tanohata.iwate.jp",
		reversed: "pj.etawi.atahonat"
	},
	{
		suffix: "taobao",
		reversed: "oaboat"
	},
	{
		suffix: "tara.saga.jp",
		reversed: "pj.agas.arat"
	},
	{
		suffix: "tarama.okinawa.jp",
		reversed: "pj.awaniko.amarat"
	},
	{
		suffix: "taranto.it",
		reversed: "ti.otnarat"
	},
	{
		suffix: "target",
		reversed: "tegrat"
	},
	{
		suffix: "targi.pl",
		reversed: "lp.igrat"
	},
	{
		suffix: "tarnobrzeg.pl",
		reversed: "lp.gezrbonrat"
	},
	{
		suffix: "tarui.gifu.jp",
		reversed: "pj.ufig.iurat"
	},
	{
		suffix: "tarumizu.kagoshima.jp",
		reversed: "pj.amihsogak.uzimurat"
	},
	{
		suffix: "tas.au",
		reversed: "ua.sat"
	},
	{
		suffix: "tas.edu.au",
		reversed: "ua.ude.sat"
	},
	{
		suffix: "tas.gov.au",
		reversed: "ua.vog.sat"
	},
	{
		suffix: "tashkent.su",
		reversed: "us.tnekhsat"
	},
	{
		suffix: "tatamotors",
		reversed: "srotomatat"
	},
	{
		suffix: "tatar",
		reversed: "ratat"
	},
	{
		suffix: "tatebayashi.gunma.jp",
		reversed: "pj.amnug.ihsayabetat"
	},
	{
		suffix: "tateshina.nagano.jp",
		reversed: "pj.onagan.anihsetat"
	},
	{
		suffix: "tateyama.chiba.jp",
		reversed: "pj.abihc.amayetat"
	},
	{
		suffix: "tateyama.toyama.jp",
		reversed: "pj.amayot.amayetat"
	},
	{
		suffix: "tatsuno.hyogo.jp",
		reversed: "pj.ogoyh.onustat"
	},
	{
		suffix: "tatsuno.nagano.jp",
		reversed: "pj.onagan.onustat"
	},
	{
		suffix: "tattoo",
		reversed: "oottat"
	},
	{
		suffix: "tawaramoto.nara.jp",
		reversed: "pj.aran.otomarawat"
	},
	{
		suffix: "tax",
		reversed: "xat"
	},
	{
		suffix: "taxi",
		reversed: "ixat"
	},
	{
		suffix: "taxi.br",
		reversed: "rb.ixat"
	},
	{
		suffix: "tbits.me",
		reversed: "em.stibt"
	},
	{
		suffix: "tc",
		reversed: "ct"
	},
	{
		suffix: "tc.br",
		reversed: "rb.ct"
	},
	{
		suffix: "tci",
		reversed: "ict"
	},
	{
		suffix: "tcm.museum",
		reversed: "muesum.mct"
	},
	{
		suffix: "tcp4.me",
		reversed: "em.4pct"
	},
	{
		suffix: "td",
		reversed: "dt"
	},
	{
		suffix: "tdk",
		reversed: "kdt"
	},
	{
		suffix: "te.it",
		reversed: "ti.et"
	},
	{
		suffix: "te.ua",
		reversed: "au.et"
	},
	{
		suffix: "teaches-yoga.com",
		reversed: "moc.agoy-sehcaet"
	},
	{
		suffix: "team",
		reversed: "maet"
	},
	{
		suffix: "tec.br",
		reversed: "rb.cet"
	},
	{
		suffix: "tec.mi.us",
		reversed: "su.im.cet"
	},
	{
		suffix: "tec.ve",
		reversed: "ev.cet"
	},
	{
		suffix: "tech",
		reversed: "hcet"
	},
	{
		suffix: "tech.orange",
		reversed: "egnaro.hcet"
	},
	{
		suffix: "technology",
		reversed: "ygolonhcet"
	},
	{
		suffix: "technology.museum",
		reversed: "muesum.ygolonhcet"
	},
	{
		suffix: "tecnologia.bo",
		reversed: "ob.aigoloncet"
	},
	{
		suffix: "tel",
		reversed: "let"
	},
	{
		suffix: "tel.tr",
		reversed: "rt.let"
	},
	{
		suffix: "tele.amune.org",
		reversed: "gro.enuma.elet"
	},
	{
		suffix: "telebit.app",
		reversed: "ppa.tibelet"
	},
	{
		suffix: "telebit.io",
		reversed: "oi.tibelet"
	},
	{
		suffix: "telekommunikation.museum",
		reversed: "muesum.noitakinummokelet"
	},
	{
		suffix: "television.museum",
		reversed: "muesum.noisivelet"
	},
	{
		suffix: "temasek",
		reversed: "kesamet"
	},
	{
		suffix: "temp-dns.com",
		reversed: "moc.snd-pmet"
	},
	{
		suffix: "tempio-olbia.it",
		reversed: "ti.aiblo-oipmet"
	},
	{
		suffix: "tempioolbia.it",
		reversed: "ti.aiblooipmet"
	},
	{
		suffix: "tempurl.host",
		reversed: "tsoh.lrupmet"
	},
	{
		suffix: "tendo.yamagata.jp",
		reversed: "pj.atagamay.odnet"
	},
	{
		suffix: "tenei.fukushima.jp",
		reversed: "pj.amihsukuf.ienet"
	},
	{
		suffix: "tenkawa.nara.jp",
		reversed: "pj.aran.awaknet"
	},
	{
		suffix: "tennis",
		reversed: "sinnet"
	},
	{
		suffix: "tenri.nara.jp",
		reversed: "pj.aran.irnet"
	},
	{
		suffix: "teo.br",
		reversed: "rb.oet"
	},
	{
		suffix: "teramo.it",
		reversed: "ti.omaret"
	},
	{
		suffix: "termez.su",
		reversed: "us.zemret"
	},
	{
		suffix: "terni.it",
		reversed: "ti.inret"
	},
	{
		suffix: "ternopil.ua",
		reversed: "au.liponret"
	},
	{
		suffix: "teshikaga.hokkaido.jp",
		reversed: "pj.odiakkoh.agakihset"
	},
	{
		suffix: "test-iserv.de",
		reversed: "ed.vresi-tset"
	},
	{
		suffix: "test.ru",
		reversed: "ur.tset"
	},
	{
		suffix: "test.tj",
		reversed: "jt.tset"
	},
	{
		suffix: "teva",
		reversed: "avet"
	},
	{
		suffix: "texas.museum",
		reversed: "muesum.saxet"
	},
	{
		suffix: "textile.museum",
		reversed: "muesum.elitxet"
	},
	{
		suffix: "tf",
		reversed: "ft"
	},
	{
		suffix: "tg",
		reversed: "gt"
	},
	{
		suffix: "tgory.pl",
		reversed: "lp.yrogt"
	},
	{
		suffix: "th",
		reversed: "ht"
	},
	{
		suffix: "thd",
		reversed: "dht"
	},
	{
		suffix: "the.br",
		reversed: "rb.eht"
	},
	{
		suffix: "theater",
		reversed: "retaeht"
	},
	{
		suffix: "theater.museum",
		reversed: "muesum.retaeht"
	},
	{
		suffix: "theatre",
		reversed: "ertaeht"
	},
	{
		suffix: "theshop.jp",
		reversed: "pj.pohseht"
	},
	{
		suffix: "theworkpc.com",
		reversed: "moc.cpkroweht"
	},
	{
		suffix: "thick.jp",
		reversed: "pj.kciht"
	},
	{
		suffix: "thingdustdata.com",
		reversed: "moc.atadtsudgniht"
	},
	{
		suffix: "thruhere.net",
		reversed: "ten.erehurht"
	},
	{
		suffix: "tiaa",
		reversed: "aait"
	},
	{
		suffix: "tickets",
		reversed: "stekcit"
	},
	{
		suffix: "tickets.io",
		reversed: "oi.stekcit"
	},
	{
		suffix: "tienda",
		reversed: "adneit"
	},
	{
		suffix: "tiffany",
		reversed: "ynaffit"
	},
	{
		suffix: "time.museum",
		reversed: "muesum.emit"
	},
	{
		suffix: "time.no",
		reversed: "on.emit"
	},
	{
		suffix: "timekeeping.museum",
		reversed: "muesum.gnipeekemit"
	},
	{
		suffix: "tingvoll.no",
		reversed: "on.llovgnit"
	},
	{
		suffix: "tinn.no",
		reversed: "on.nnit"
	},
	{
		suffix: "tips",
		reversed: "spit"
	},
	{
		suffix: "tires",
		reversed: "serit"
	},
	{
		suffix: "tirol",
		reversed: "lorit"
	},
	{
		suffix: "tj",
		reversed: "jt"
	},
	{
		suffix: "tj.cn",
		reversed: "nc.jt"
	},
	{
		suffix: "tjeldsund.no",
		reversed: "on.dnusdlejt"
	},
	{
		suffix: "tjmaxx",
		reversed: "xxamjt"
	},
	{
		suffix: "tjome.no",
		reversed: "on.emojt"
	},
	{
		suffix: "tjx",
		reversed: "xjt"
	},
	{
		suffix: "tjøme.no",
		reversed: "on.arh-emjt--nx"
	},
	{
		suffix: "tk",
		reversed: "kt"
	},
	{
		suffix: "tkmaxx",
		reversed: "xxamkt"
	},
	{
		suffix: "tksat.bo",
		reversed: "ob.taskt"
	},
	{
		suffix: "tl",
		reversed: "lt"
	},
	{
		suffix: "tlon.network",
		reversed: "krowten.nolt"
	},
	{
		suffix: "tm",
		reversed: "mt"
	},
	{
		suffix: "tm.cy",
		reversed: "yc.mt"
	},
	{
		suffix: "tm.dz",
		reversed: "zd.mt"
	},
	{
		suffix: "tm.fr",
		reversed: "rf.mt"
	},
	{
		suffix: "tm.hu",
		reversed: "uh.mt"
	},
	{
		suffix: "tm.km",
		reversed: "mk.mt"
	},
	{
		suffix: "tm.mc",
		reversed: "cm.mt"
	},
	{
		suffix: "tm.mg",
		reversed: "gm.mt"
	},
	{
		suffix: "tm.no",
		reversed: "on.mt"
	},
	{
		suffix: "tm.pl",
		reversed: "lp.mt"
	},
	{
		suffix: "tm.ro",
		reversed: "or.mt"
	},
	{
		suffix: "tm.se",
		reversed: "es.mt"
	},
	{
		suffix: "tm.za",
		reversed: "az.mt"
	},
	{
		suffix: "tmall",
		reversed: "llamt"
	},
	{
		suffix: "tmp.br",
		reversed: "rb.pmt"
	},
	{
		suffix: "tn",
		reversed: "nt"
	},
	{
		suffix: "tn.it",
		reversed: "ti.nt"
	},
	{
		suffix: "tn.oxa.cloud",
		reversed: "duolc.axo.nt"
	},
	{
		suffix: "tn.us",
		reversed: "su.nt"
	},
	{
		suffix: "to",
		reversed: "ot"
	},
	{
		suffix: "to.gov.br",
		reversed: "rb.vog.ot"
	},
	{
		suffix: "to.gt",
		reversed: "tg.ot"
	},
	{
		suffix: "to.it",
		reversed: "ti.ot"
	},
	{
		suffix: "to.leg.br",
		reversed: "rb.gel.ot"
	},
	{
		suffix: "to.md",
		reversed: "dm.ot"
	},
	{
		suffix: "toba.mie.jp",
		reversed: "pj.eim.abot"
	},
	{
		suffix: "tobe.ehime.jp",
		reversed: "pj.emihe.ebot"
	},
	{
		suffix: "tobetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebot"
	},
	{
		suffix: "tobishima.aichi.jp",
		reversed: "pj.ihcia.amihsibot"
	},
	{
		suffix: "tochigi.jp",
		reversed: "pj.igihcot"
	},
	{
		suffix: "tochigi.tochigi.jp",
		reversed: "pj.igihcot.igihcot"
	},
	{
		suffix: "tochio.niigata.jp",
		reversed: "pj.atagiin.oihcot"
	},
	{
		suffix: "toda.saitama.jp",
		reversed: "pj.amatias.adot"
	},
	{
		suffix: "today",
		reversed: "yadot"
	},
	{
		suffix: "toei.aichi.jp",
		reversed: "pj.ihcia.ieot"
	},
	{
		suffix: "toga.toyama.jp",
		reversed: "pj.amayot.agot"
	},
	{
		suffix: "togakushi.nagano.jp",
		reversed: "pj.onagan.ihsukagot"
	},
	{
		suffix: "togane.chiba.jp",
		reversed: "pj.abihc.enagot"
	},
	{
		suffix: "togitsu.nagasaki.jp",
		reversed: "pj.ikasagan.ustigot"
	},
	{
		suffix: "togliatti.su",
		reversed: "us.ittailgot"
	},
	{
		suffix: "togo.aichi.jp",
		reversed: "pj.ihcia.ogot"
	},
	{
		suffix: "togura.nagano.jp",
		reversed: "pj.onagan.arugot"
	},
	{
		suffix: "tohma.hokkaido.jp",
		reversed: "pj.odiakkoh.amhot"
	},
	{
		suffix: "tohnosho.chiba.jp",
		reversed: "pj.abihc.ohsonhot"
	},
	{
		suffix: "toho.fukuoka.jp",
		reversed: "pj.akoukuf.ohot"
	},
	{
		suffix: "tokai.aichi.jp",
		reversed: "pj.ihcia.iakot"
	},
	{
		suffix: "tokai.ibaraki.jp",
		reversed: "pj.ikarabi.iakot"
	},
	{
		suffix: "tokamachi.niigata.jp",
		reversed: "pj.atagiin.ihcamakot"
	},
	{
		suffix: "tokashiki.okinawa.jp",
		reversed: "pj.awaniko.ikihsakot"
	},
	{
		suffix: "toki.gifu.jp",
		reversed: "pj.ufig.ikot"
	},
	{
		suffix: "tokigawa.saitama.jp",
		reversed: "pj.amatias.awagikot"
	},
	{
		suffix: "tokke.no",
		reversed: "on.ekkot"
	},
	{
		suffix: "tokoname.aichi.jp",
		reversed: "pj.ihcia.emanokot"
	},
	{
		suffix: "tokorozawa.saitama.jp",
		reversed: "pj.amatias.awazorokot"
	},
	{
		suffix: "tokushima.jp",
		reversed: "pj.amihsukot"
	},
	{
		suffix: "tokushima.tokushima.jp",
		reversed: "pj.amihsukot.amihsukot"
	},
	{
		suffix: "tokuyama.yamaguchi.jp",
		reversed: "pj.ihcugamay.amayukot"
	},
	{
		suffix: "tokyo",
		reversed: "oykot"
	},
	{
		suffix: "tokyo.jp",
		reversed: "pj.oykot"
	},
	{
		suffix: "tolga.no",
		reversed: "on.aglot"
	},
	{
		suffix: "tomakomai.hokkaido.jp",
		reversed: "pj.odiakkoh.iamokamot"
	},
	{
		suffix: "tomari.hokkaido.jp",
		reversed: "pj.odiakkoh.iramot"
	},
	{
		suffix: "tome.miyagi.jp",
		reversed: "pj.igayim.emot"
	},
	{
		suffix: "tomi.nagano.jp",
		reversed: "pj.onagan.imot"
	},
	{
		suffix: "tomigusuku.okinawa.jp",
		reversed: "pj.awaniko.ukusugimot"
	},
	{
		suffix: "tomika.gifu.jp",
		reversed: "pj.ufig.akimot"
	},
	{
		suffix: "tomioka.gunma.jp",
		reversed: "pj.amnug.akoimot"
	},
	{
		suffix: "tomisato.chiba.jp",
		reversed: "pj.abihc.otasimot"
	},
	{
		suffix: "tomiya.miyagi.jp",
		reversed: "pj.igayim.ayimot"
	},
	{
		suffix: "tomobe.ibaraki.jp",
		reversed: "pj.ikarabi.ebomot"
	},
	{
		suffix: "tonaki.okinawa.jp",
		reversed: "pj.awaniko.ikanot"
	},
	{
		suffix: "tonami.toyama.jp",
		reversed: "pj.amayot.imanot"
	},
	{
		suffix: "tondabayashi.osaka.jp",
		reversed: "pj.akaso.ihsayabadnot"
	},
	{
		suffix: "tone.ibaraki.jp",
		reversed: "pj.ikarabi.enot"
	},
	{
		suffix: "tonkotsu.jp",
		reversed: "pj.ustoknot"
	},
	{
		suffix: "tono.iwate.jp",
		reversed: "pj.etawi.onot"
	},
	{
		suffix: "tonosho.kagawa.jp",
		reversed: "pj.awagak.ohsonot"
	},
	{
		suffix: "tonsberg.no",
		reversed: "on.grebsnot"
	},
	{
		suffix: "toolforge.org",
		reversed: "gro.egrofloot"
	},
	{
		suffix: "tools",
		reversed: "sloot"
	},
	{
		suffix: "toon.ehime.jp",
		reversed: "pj.emihe.noot"
	},
	{
		suffix: "top",
		reversed: "pot"
	},
	{
		suffix: "topology.museum",
		reversed: "muesum.ygolopot"
	},
	{
		suffix: "torahime.shiga.jp",
		reversed: "pj.agihs.emiharot"
	},
	{
		suffix: "toray",
		reversed: "yarot"
	},
	{
		suffix: "toride.ibaraki.jp",
		reversed: "pj.ikarabi.edirot"
	},
	{
		suffix: "torino.it",
		reversed: "ti.onirot"
	},
	{
		suffix: "torino.museum",
		reversed: "muesum.onirot"
	},
	{
		suffix: "torproject.net",
		reversed: "ten.tcejorprot"
	},
	{
		suffix: "torsken.no",
		reversed: "on.neksrot"
	},
	{
		suffix: "tos.it",
		reversed: "ti.sot"
	},
	{
		suffix: "tosa.kochi.jp",
		reversed: "pj.ihcok.asot"
	},
	{
		suffix: "tosashimizu.kochi.jp",
		reversed: "pj.ihcok.uzimihsasot"
	},
	{
		suffix: "toscana.it",
		reversed: "ti.anacsot"
	},
	{
		suffix: "toshiba",
		reversed: "abihsot"
	},
	{
		suffix: "toshima.tokyo.jp",
		reversed: "pj.oykot.amihsot"
	},
	{
		suffix: "tosu.saga.jp",
		reversed: "pj.agas.usot"
	},
	{
		suffix: "total",
		reversed: "latot"
	},
	{
		suffix: "tottori.jp",
		reversed: "pj.irottot"
	},
	{
		suffix: "tottori.tottori.jp",
		reversed: "pj.irottot.irottot"
	},
	{
		suffix: "touch.museum",
		reversed: "muesum.hcuot"
	},
	{
		suffix: "tourism.pl",
		reversed: "lp.msiruot"
	},
	{
		suffix: "tourism.tn",
		reversed: "nt.msiruot"
	},
	{
		suffix: "tours",
		reversed: "sruot"
	},
	{
		suffix: "towada.aomori.jp",
		reversed: "pj.iromoa.adawot"
	},
	{
		suffix: "town",
		reversed: "nwot"
	},
	{
		suffix: "town.museum",
		reversed: "muesum.nwot"
	},
	{
		suffix: "townnews-staging.com",
		reversed: "moc.gnigats-swennwot"
	},
	{
		suffix: "toya.hokkaido.jp",
		reversed: "pj.odiakkoh.ayot"
	},
	{
		suffix: "toyako.hokkaido.jp",
		reversed: "pj.odiakkoh.okayot"
	},
	{
		suffix: "toyama.jp",
		reversed: "pj.amayot"
	},
	{
		suffix: "toyama.toyama.jp",
		reversed: "pj.amayot.amayot"
	},
	{
		suffix: "toyo.kochi.jp",
		reversed: "pj.ihcok.oyot"
	},
	{
		suffix: "toyoake.aichi.jp",
		reversed: "pj.ihcia.ekaoyot"
	},
	{
		suffix: "toyohashi.aichi.jp",
		reversed: "pj.ihcia.ihsahoyot"
	},
	{
		suffix: "toyokawa.aichi.jp",
		reversed: "pj.ihcia.awakoyot"
	},
	{
		suffix: "toyonaka.osaka.jp",
		reversed: "pj.akaso.akanoyot"
	},
	{
		suffix: "toyone.aichi.jp",
		reversed: "pj.ihcia.enoyot"
	},
	{
		suffix: "toyono.osaka.jp",
		reversed: "pj.akaso.onoyot"
	},
	{
		suffix: "toyooka.hyogo.jp",
		reversed: "pj.ogoyh.akooyot"
	},
	{
		suffix: "toyosato.shiga.jp",
		reversed: "pj.agihs.otasoyot"
	},
	{
		suffix: "toyota",
		reversed: "atoyot"
	},
	{
		suffix: "toyota.aichi.jp",
		reversed: "pj.ihcia.atoyot"
	},
	{
		suffix: "toyota.yamaguchi.jp",
		reversed: "pj.ihcugamay.atoyot"
	},
	{
		suffix: "toyotomi.hokkaido.jp",
		reversed: "pj.odiakkoh.imotoyot"
	},
	{
		suffix: "toyotsu.fukuoka.jp",
		reversed: "pj.akoukuf.ustoyot"
	},
	{
		suffix: "toyoura.hokkaido.jp",
		reversed: "pj.odiakkoh.aruoyot"
	},
	{
		suffix: "toys",
		reversed: "syot"
	},
	{
		suffix: "tozawa.yamagata.jp",
		reversed: "pj.atagamay.awazot"
	},
	{
		suffix: "tozsde.hu",
		reversed: "uh.edszot"
	},
	{
		suffix: "tp.it",
		reversed: "ti.pt"
	},
	{
		suffix: "tr",
		reversed: "rt"
	},
	{
		suffix: "tr.eu.org",
		reversed: "gro.ue.rt"
	},
	{
		suffix: "tr.it",
		reversed: "ti.rt"
	},
	{
		suffix: "tr.no",
		reversed: "on.rt"
	},
	{
		suffix: "tra.kp",
		reversed: "pk.art"
	},
	{
		suffix: "trade",
		reversed: "edart"
	},
	{
		suffix: "trader.aero",
		reversed: "orea.redart"
	},
	{
		suffix: "trading",
		reversed: "gnidart"
	},
	{
		suffix: "trading.aero",
		reversed: "orea.gnidart"
	},
	{
		suffix: "traeumtgerade.de",
		reversed: "ed.edaregtmueart"
	},
	{
		suffix: "trafficplex.cloud",
		reversed: "duolc.xelpciffart"
	},
	{
		suffix: "trainer.aero",
		reversed: "orea.reniart"
	},
	{
		suffix: "training",
		reversed: "gniniart"
	},
	{
		suffix: "trana.no",
		reversed: "on.anart"
	},
	{
		suffix: "tranby.no",
		reversed: "on.ybnart"
	},
	{
		suffix: "trani-andria-barletta.it",
		reversed: "ti.attelrab-airdna-inart"
	},
	{
		suffix: "trani-barletta-andria.it",
		reversed: "ti.airdna-attelrab-inart"
	},
	{
		suffix: "traniandriabarletta.it",
		reversed: "ti.attelrabairdnainart"
	},
	{
		suffix: "tranibarlettaandria.it",
		reversed: "ti.airdnaattelrabinart"
	},
	{
		suffix: "tranoy.no",
		reversed: "on.yonart"
	},
	{
		suffix: "translate.goog",
		reversed: "goog.etalsnart"
	},
	{
		suffix: "translated.page",
		reversed: "egap.detalsnart"
	},
	{
		suffix: "transport.museum",
		reversed: "muesum.tropsnart"
	},
	{
		suffix: "transporte.bo",
		reversed: "ob.etropsnart"
	},
	{
		suffix: "tranøy.no",
		reversed: "on.auy-ynart--nx"
	},
	{
		suffix: "trapani.it",
		reversed: "ti.inapart"
	},
	{
		suffix: "travel",
		reversed: "levart"
	},
	{
		suffix: "travel.in",
		reversed: "ni.levart"
	},
	{
		suffix: "travel.pl",
		reversed: "lp.levart"
	},
	{
		suffix: "travel.tt",
		reversed: "tt.levart"
	},
	{
		suffix: "travelchannel",
		reversed: "lennahclevart"
	},
	{
		suffix: "travelers",
		reversed: "srelevart"
	},
	{
		suffix: "travelersinsurance",
		reversed: "ecnarusnisrelevart"
	},
	{
		suffix: "trd.br",
		reversed: "rb.drt"
	},
	{
		suffix: "tree.museum",
		reversed: "muesum.eert"
	},
	{
		suffix: "trentin-sud-tirol.it",
		reversed: "ti.lorit-dus-nitnert"
	},
	{
		suffix: "trentin-sudtirol.it",
		reversed: "ti.loritdus-nitnert"
	},
	{
		suffix: "trentin-sued-tirol.it",
		reversed: "ti.lorit-deus-nitnert"
	},
	{
		suffix: "trentin-suedtirol.it",
		reversed: "ti.loritdeus-nitnert"
	},
	{
		suffix: "trentin-süd-tirol.it",
		reversed: "ti.bzr-lorit-ds-nitnert--nx"
	},
	{
		suffix: "trentin-südtirol.it",
		reversed: "ti.bv7-loritds-nitnert--nx"
	},
	{
		suffix: "trentino-a-adige.it",
		reversed: "ti.egida-a-onitnert"
	},
	{
		suffix: "trentino-aadige.it",
		reversed: "ti.egidaa-onitnert"
	},
	{
		suffix: "trentino-alto-adige.it",
		reversed: "ti.egida-otla-onitnert"
	},
	{
		suffix: "trentino-altoadige.it",
		reversed: "ti.egidaotla-onitnert"
	},
	{
		suffix: "trentino-s-tirol.it",
		reversed: "ti.lorit-s-onitnert"
	},
	{
		suffix: "trentino-stirol.it",
		reversed: "ti.lorits-onitnert"
	},
	{
		suffix: "trentino-sud-tirol.it",
		reversed: "ti.lorit-dus-onitnert"
	},
	{
		suffix: "trentino-sudtirol.it",
		reversed: "ti.loritdus-onitnert"
	},
	{
		suffix: "trentino-sued-tirol.it",
		reversed: "ti.lorit-deus-onitnert"
	},
	{
		suffix: "trentino-suedtirol.it",
		reversed: "ti.loritdeus-onitnert"
	},
	{
		suffix: "trentino-süd-tirol.it",
		reversed: "ti.b3c-lorit-ds-onitnert--nx"
	},
	{
		suffix: "trentino-südtirol.it",
		reversed: "ti.bzs-loritds-onitnert--nx"
	},
	{
		suffix: "trentino.it",
		reversed: "ti.onitnert"
	},
	{
		suffix: "trentinoa-adige.it",
		reversed: "ti.egida-aonitnert"
	},
	{
		suffix: "trentinoaadige.it",
		reversed: "ti.egidaaonitnert"
	},
	{
		suffix: "trentinoalto-adige.it",
		reversed: "ti.egida-otlaonitnert"
	},
	{
		suffix: "trentinoaltoadige.it",
		reversed: "ti.egidaotlaonitnert"
	},
	{
		suffix: "trentinos-tirol.it",
		reversed: "ti.lorit-sonitnert"
	},
	{
		suffix: "trentinostirol.it",
		reversed: "ti.loritsonitnert"
	},
	{
		suffix: "trentinosud-tirol.it",
		reversed: "ti.lorit-dusonitnert"
	},
	{
		suffix: "trentinosudtirol.it",
		reversed: "ti.loritdusonitnert"
	},
	{
		suffix: "trentinosued-tirol.it",
		reversed: "ti.lorit-deusonitnert"
	},
	{
		suffix: "trentinosuedtirol.it",
		reversed: "ti.loritdeusonitnert"
	},
	{
		suffix: "trentinosüd-tirol.it",
		reversed: "ti.bzr-lorit-dsonitnert--nx"
	},
	{
		suffix: "trentinosüdtirol.it",
		reversed: "ti.bv7-loritdsonitnert--nx"
	},
	{
		suffix: "trentinsud-tirol.it",
		reversed: "ti.lorit-dusnitnert"
	},
	{
		suffix: "trentinsudtirol.it",
		reversed: "ti.loritdusnitnert"
	},
	{
		suffix: "trentinsued-tirol.it",
		reversed: "ti.lorit-deusnitnert"
	},
	{
		suffix: "trentinsuedtirol.it",
		reversed: "ti.loritdeusnitnert"
	},
	{
		suffix: "trentinsüd-tirol.it",
		reversed: "ti.bv6-lorit-dsnitnert--nx"
	},
	{
		suffix: "trentinsüdtirol.it",
		reversed: "ti.bsn-loritdsnitnert--nx"
	},
	{
		suffix: "trento.it",
		reversed: "ti.otnert"
	},
	{
		suffix: "treviso.it",
		reversed: "ti.osivert"
	},
	{
		suffix: "trieste.it",
		reversed: "ti.etseirt"
	},
	{
		suffix: "troandin.no",
		reversed: "on.nidnaort"
	},
	{
		suffix: "trogstad.no",
		reversed: "on.datsgort"
	},
	{
		suffix: "troitsk.su",
		reversed: "us.kstiort"
	},
	{
		suffix: "trolley.museum",
		reversed: "muesum.yellort"
	},
	{
		suffix: "tromsa.no",
		reversed: "on.asmort"
	},
	{
		suffix: "tromso.no",
		reversed: "on.osmort"
	},
	{
		suffix: "tromsø.no",
		reversed: "on.auz-smort--nx"
	},
	{
		suffix: "trondheim.no",
		reversed: "on.miehdnort"
	},
	{
		suffix: "trust",
		reversed: "tsurt"
	},
	{
		suffix: "trust.museum",
		reversed: "muesum.tsurt"
	},
	{
		suffix: "trustee.museum",
		reversed: "muesum.eetsurt"
	},
	{
		suffix: "trv",
		reversed: "vrt"
	},
	{
		suffix: "try-snowplow.com",
		reversed: "moc.wolpwons-yrt"
	},
	{
		suffix: "trycloudflare.com",
		reversed: "moc.eralfduolcyrt"
	},
	{
		suffix: "trysil.no",
		reversed: "on.lisyrt"
	},
	{
		suffix: "træna.no",
		reversed: "on.aow-anrt--nx"
	},
	{
		suffix: "trøgstad.no",
		reversed: "on.a1r-datsgrt--nx"
	},
	{
		suffix: "ts.it",
		reversed: "ti.st"
	},
	{
		suffix: "ts.net",
		reversed: "ten.st"
	},
	{
		suffix: "tselinograd.su",
		reversed: "us.dargonilest"
	},
	{
		suffix: "tsk.tr",
		reversed: "rt.kst"
	},
	{
		suffix: "tsu.mie.jp",
		reversed: "pj.eim.ust"
	},
	{
		suffix: "tsubame.niigata.jp",
		reversed: "pj.atagiin.emabust"
	},
	{
		suffix: "tsubata.ishikawa.jp",
		reversed: "pj.awakihsi.atabust"
	},
	{
		suffix: "tsubetsu.hokkaido.jp",
		reversed: "pj.odiakkoh.ustebust"
	},
	{
		suffix: "tsuchiura.ibaraki.jp",
		reversed: "pj.ikarabi.aruihcust"
	},
	{
		suffix: "tsuga.tochigi.jp",
		reversed: "pj.igihcot.agust"
	},
	{
		suffix: "tsugaru.aomori.jp",
		reversed: "pj.iromoa.uragust"
	},
	{
		suffix: "tsuiki.fukuoka.jp",
		reversed: "pj.akoukuf.ikiust"
	},
	{
		suffix: "tsukigata.hokkaido.jp",
		reversed: "pj.odiakkoh.atagikust"
	},
	{
		suffix: "tsukiyono.gunma.jp",
		reversed: "pj.amnug.onoyikust"
	},
	{
		suffix: "tsukuba.ibaraki.jp",
		reversed: "pj.ikarabi.abukust"
	},
	{
		suffix: "tsukui.kanagawa.jp",
		reversed: "pj.awaganak.iukust"
	},
	{
		suffix: "tsukumi.oita.jp",
		reversed: "pj.atio.imukust"
	},
	{
		suffix: "tsumagoi.gunma.jp",
		reversed: "pj.amnug.iogamust"
	},
	{
		suffix: "tsunan.niigata.jp",
		reversed: "pj.atagiin.nanust"
	},
	{
		suffix: "tsuno.kochi.jp",
		reversed: "pj.ihcok.onust"
	},
	{
		suffix: "tsuno.miyazaki.jp",
		reversed: "pj.ikazayim.onust"
	},
	{
		suffix: "tsuru.yamanashi.jp",
		reversed: "pj.ihsanamay.urust"
	},
	{
		suffix: "tsuruga.fukui.jp",
		reversed: "pj.iukuf.agurust"
	},
	{
		suffix: "tsurugashima.saitama.jp",
		reversed: "pj.amatias.amihsagurust"
	},
	{
		suffix: "tsurugi.ishikawa.jp",
		reversed: "pj.awakihsi.igurust"
	},
	{
		suffix: "tsuruoka.yamagata.jp",
		reversed: "pj.atagamay.akourust"
	},
	{
		suffix: "tsuruta.aomori.jp",
		reversed: "pj.iromoa.aturust"
	},
	{
		suffix: "tsushima.aichi.jp",
		reversed: "pj.ihcia.amihsust"
	},
	{
		suffix: "tsushima.nagasaki.jp",
		reversed: "pj.ikasagan.amihsust"
	},
	{
		suffix: "tsuwano.shimane.jp",
		reversed: "pj.enamihs.onawust"
	},
	{
		suffix: "tsuyama.okayama.jp",
		reversed: "pj.amayako.amayust"
	},
	{
		suffix: "tt",
		reversed: "tt"
	},
	{
		suffix: "tt.im",
		reversed: "mi.tt"
	},
	{
		suffix: "tube",
		reversed: "ebut"
	},
	{
		suffix: "tui",
		reversed: "iut"
	},
	{
		suffix: "tula.su",
		reversed: "us.alut"
	},
	{
		suffix: "tuleap-partners.com",
		reversed: "moc.srentrap-paelut"
	},
	{
		suffix: "tunes",
		reversed: "senut"
	},
	{
		suffix: "tunk.org",
		reversed: "gro.knut"
	},
	{
		suffix: "tur.ar",
		reversed: "ra.rut"
	},
	{
		suffix: "tur.br",
		reversed: "rb.rut"
	},
	{
		suffix: "turek.pl",
		reversed: "lp.kerut"
	},
	{
		suffix: "turin.it",
		reversed: "ti.nirut"
	},
	{
		suffix: "turystyka.pl",
		reversed: "lp.akytsyrut"
	},
	{
		suffix: "tuscany.it",
		reversed: "ti.ynacsut"
	},
	{
		suffix: "tushu",
		reversed: "uhsut"
	},
	{
		suffix: "tuva.su",
		reversed: "us.avut"
	},
	{
		suffix: "tuxfamily.org",
		reversed: "gro.ylimafxut"
	},
	{
		suffix: "tv",
		reversed: "vt"
	},
	{
		suffix: "tv.bb",
		reversed: "bb.vt"
	},
	{
		suffix: "tv.bo",
		reversed: "ob.vt"
	},
	{
		suffix: "tv.br",
		reversed: "rb.vt"
	},
	{
		suffix: "tv.im",
		reversed: "mi.vt"
	},
	{
		suffix: "tv.in",
		reversed: "ni.vt"
	},
	{
		suffix: "tv.it",
		reversed: "ti.vt"
	},
	{
		suffix: "tv.kg",
		reversed: "gk.vt"
	},
	{
		suffix: "tv.na",
		reversed: "an.vt"
	},
	{
		suffix: "tv.sd",
		reversed: "ds.vt"
	},
	{
		suffix: "tv.tr",
		reversed: "rt.vt"
	},
	{
		suffix: "tv.tz",
		reversed: "zt.vt"
	},
	{
		suffix: "tvedestrand.no",
		reversed: "on.dnartsedevt"
	},
	{
		suffix: "tvs",
		reversed: "svt"
	},
	{
		suffix: "tw",
		reversed: "wt"
	},
	{
		suffix: "tw.cn",
		reversed: "nc.wt"
	},
	{
		suffix: "twmail.cc",
		reversed: "cc.liamwt"
	},
	{
		suffix: "twmail.net",
		reversed: "ten.liamwt"
	},
	{
		suffix: "twmail.org",
		reversed: "gro.liamwt"
	},
	{
		suffix: "tx.us",
		reversed: "su.xt"
	},
	{
		suffix: "tychy.pl",
		reversed: "lp.yhcyt"
	},
	{
		suffix: "tydal.no",
		reversed: "on.ladyt"
	},
	{
		suffix: "tynset.no",
		reversed: "on.tesnyt"
	},
	{
		suffix: "typedream.app",
		reversed: "ppa.maerdepyt"
	},
	{
		suffix: "tysfjord.no",
		reversed: "on.drojfsyt"
	},
	{
		suffix: "tysnes.no",
		reversed: "on.sensyt"
	},
	{
		suffix: "tysvar.no",
		reversed: "on.ravsyt"
	},
	{
		suffix: "tysvær.no",
		reversed: "on.arv-rvsyt--nx"
	},
	{
		suffix: "tz",
		reversed: "zt"
	},
	{
		suffix: "tønsberg.no",
		reversed: "on.a1q-grebsnt--nx"
	},
	{
		suffix: "u.bg",
		reversed: "gb.u"
	},
	{
		suffix: "u.channelsdvr.net",
		reversed: "ten.rvdslennahc.u"
	},
	{
		suffix: "u.se",
		reversed: "es.u"
	},
	{
		suffix: "u2-local.xnbay.com",
		reversed: "moc.yabnx.lacol-2u"
	},
	{
		suffix: "u2.xnbay.com",
		reversed: "moc.yabnx.2u"
	},
	{
		suffix: "ua",
		reversed: "au"
	},
	{
		suffix: "ua.rs",
		reversed: "sr.au"
	},
	{
		suffix: "ubank",
		reversed: "knabu"
	},
	{
		suffix: "ube.yamaguchi.jp",
		reversed: "pj.ihcugamay.ebu"
	},
	{
		suffix: "uber.space",
		reversed: "ecaps.rebu"
	},
	{
		suffix: "ubs",
		reversed: "sbu"
	},
	{
		suffix: "uchihara.ibaraki.jp",
		reversed: "pj.ikarabi.arahihcu"
	},
	{
		suffix: "uchiko.ehime.jp",
		reversed: "pj.emihe.okihcu"
	},
	{
		suffix: "uchinada.ishikawa.jp",
		reversed: "pj.awakihsi.adanihcu"
	},
	{
		suffix: "uchinomi.kagawa.jp",
		reversed: "pj.awagak.imonihcu"
	},
	{
		suffix: "ud.it",
		reversed: "ti.du"
	},
	{
		suffix: "uda.nara.jp",
		reversed: "pj.aran.adu"
	},
	{
		suffix: "udi.br",
		reversed: "rb.idu"
	},
	{
		suffix: "udine.it",
		reversed: "ti.enidu"
	},
	{
		suffix: "udono.mie.jp",
		reversed: "pj.eim.onodu"
	},
	{
		suffix: "ueda.nagano.jp",
		reversed: "pj.onagan.adeu"
	},
	{
		suffix: "ueno.gunma.jp",
		reversed: "pj.amnug.oneu"
	},
	{
		suffix: "uenohara.yamanashi.jp",
		reversed: "pj.ihsanamay.arahoneu"
	},
	{
		suffix: "ufcfan.org",
		reversed: "gro.nafcfu"
	},
	{
		suffix: "ug",
		reversed: "gu"
	},
	{
		suffix: "ug.gov.pl",
		reversed: "lp.vog.gu"
	},
	{
		suffix: "ugim.gov.pl",
		reversed: "lp.vog.migu"
	},
	{
		suffix: "uhren.museum",
		reversed: "muesum.nerhu"
	},
	{
		suffix: "ui.nabu.casa",
		reversed: "asac.uban.iu"
	},
	{
		suffix: "uji.kyoto.jp",
		reversed: "pj.otoyk.iju"
	},
	{
		suffix: "ujiie.tochigi.jp",
		reversed: "pj.igihcot.eiiju"
	},
	{
		suffix: "ujitawara.kyoto.jp",
		reversed: "pj.otoyk.arawatiju"
	},
	{
		suffix: "uk",
		reversed: "ku"
	},
	{
		suffix: "uk.com",
		reversed: "moc.ku"
	},
	{
		suffix: "uk.eu.org",
		reversed: "gro.ue.ku"
	},
	{
		suffix: "uk.in",
		reversed: "ni.ku"
	},
	{
		suffix: "uk.kg",
		reversed: "gk.ku"
	},
	{
		suffix: "uk.net",
		reversed: "ten.ku"
	},
	{
		suffix: "uk.oxa.cloud",
		reversed: "duolc.axo.ku"
	},
	{
		suffix: "uk.primetel.cloud",
		reversed: "duolc.letemirp.ku"
	},
	{
		suffix: "uk.reclaim.cloud",
		reversed: "duolc.mialcer.ku"
	},
	{
		suffix: "uk0.bigv.io",
		reversed: "oi.vgib.0ku"
	},
	{
		suffix: "uki.kumamoto.jp",
		reversed: "pj.otomamuk.iku"
	},
	{
		suffix: "ukiha.fukuoka.jp",
		reversed: "pj.akoukuf.ahiku"
	},
	{
		suffix: "ullensaker.no",
		reversed: "on.rekasnellu"
	},
	{
		suffix: "ullensvang.no",
		reversed: "on.gnavsnellu"
	},
	{
		suffix: "ulm.museum",
		reversed: "muesum.mlu"
	},
	{
		suffix: "ulsan.kr",
		reversed: "rk.naslu"
	},
	{
		suffix: "ulvik.no",
		reversed: "on.kivlu"
	},
	{
		suffix: "um.gov.pl",
		reversed: "lp.vog.mu"
	},
	{
		suffix: "umaji.kochi.jp",
		reversed: "pj.ihcok.ijamu"
	},
	{
		suffix: "umb.it",
		reversed: "ti.bmu"
	},
	{
		suffix: "umbria.it",
		reversed: "ti.airbmu"
	},
	{
		suffix: "umi.fukuoka.jp",
		reversed: "pj.akoukuf.imu"
	},
	{
		suffix: "umig.gov.pl",
		reversed: "lp.vog.gimu"
	},
	{
		suffix: "unazuki.toyama.jp",
		reversed: "pj.amayot.ikuzanu"
	},
	{
		suffix: "under.jp",
		reversed: "pj.rednu"
	},
	{
		suffix: "undersea.museum",
		reversed: "muesum.aesrednu"
	},
	{
		suffix: "uni5.net",
		reversed: "ten.5inu"
	},
	{
		suffix: "unicloud.pl",
		reversed: "lp.duolcinu"
	},
	{
		suffix: "unicom",
		reversed: "mocinu"
	},
	{
		suffix: "union.aero",
		reversed: "orea.noinu"
	},
	{
		suffix: "univ.sn",
		reversed: "ns.vinu"
	},
	{
		suffix: "university",
		reversed: "ytisrevinu"
	},
	{
		suffix: "university.museum",
		reversed: "muesum.ytisrevinu"
	},
	{
		suffix: "unjarga.no",
		reversed: "on.agrajnu"
	},
	{
		suffix: "unjárga.no",
		reversed: "on.atr-agrjnu--nx"
	},
	{
		suffix: "unnan.shimane.jp",
		reversed: "pj.enamihs.nannu"
	},
	{
		suffix: "uno",
		reversed: "onu"
	},
	{
		suffix: "unusualperson.com",
		reversed: "moc.nosreplausunu"
	},
	{
		suffix: "unzen.nagasaki.jp",
		reversed: "pj.ikasagan.neznu"
	},
	{
		suffix: "uol",
		reversed: "lou"
	},
	{
		suffix: "uonuma.niigata.jp",
		reversed: "pj.atagiin.amunou"
	},
	{
		suffix: "uozu.toyama.jp",
		reversed: "pj.amayot.uzou"
	},
	{
		suffix: "up.in",
		reversed: "ni.pu"
	},
	{
		suffix: "upaas.kazteleport.kz",
		reversed: "zk.tropeletzak.saapu"
	},
	{
		suffix: "upli.io",
		reversed: "oi.ilpu"
	},
	{
		suffix: "upow.gov.pl",
		reversed: "lp.vog.wopu"
	},
	{
		suffix: "upper.jp",
		reversed: "pj.reppu"
	},
	{
		suffix: "uppo.gov.pl",
		reversed: "lp.vog.oppu"
	},
	{
		suffix: "ups",
		reversed: "spu"
	},
	{
		suffix: "urakawa.hokkaido.jp",
		reversed: "pj.odiakkoh.awakaru"
	},
	{
		suffix: "urasoe.okinawa.jp",
		reversed: "pj.awaniko.eosaru"
	},
	{
		suffix: "urausu.hokkaido.jp",
		reversed: "pj.odiakkoh.usuaru"
	},
	{
		suffix: "urawa.saitama.jp",
		reversed: "pj.amatias.awaru"
	},
	{
		suffix: "urayasu.chiba.jp",
		reversed: "pj.abihc.usayaru"
	},
	{
		suffix: "urbino-pesaro.it",
		reversed: "ti.orasep-onibru"
	},
	{
		suffix: "urbinopesaro.it",
		reversed: "ti.oraseponibru"
	},
	{
		suffix: "ureshino.mie.jp",
		reversed: "pj.eim.onihseru"
	},
	{
		suffix: "uri.arpa",
		reversed: "apra.iru"
	},
	{
		suffix: "url.tw",
		reversed: "wt.lru"
	},
	{
		suffix: "urn.arpa",
		reversed: "apra.nru"
	},
	{
		suffix: "urown.cloud",
		reversed: "duolc.nworu"
	},
	{
		suffix: "uruma.okinawa.jp",
		reversed: "pj.awaniko.amuru"
	},
	{
		suffix: "uryu.hokkaido.jp",
		reversed: "pj.odiakkoh.uyru"
	},
	{
		suffix: "us",
		reversed: "su"
	},
	{
		suffix: "us-1.evennode.com",
		reversed: "moc.edonneve.1-su"
	},
	{
		suffix: "us-2.evennode.com",
		reversed: "moc.edonneve.2-su"
	},
	{
		suffix: "us-3.evennode.com",
		reversed: "moc.edonneve.3-su"
	},
	{
		suffix: "us-4.evennode.com",
		reversed: "moc.edonneve.4-su"
	},
	{
		suffix: "us-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-su"
	},
	{
		suffix: "us-east-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-tsae-su"
	},
	{
		suffix: "us-east-2.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.2-tsae-su"
	},
	{
		suffix: "us-gov-west-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-tsew-vog-su"
	},
	{
		suffix: "us-west-1.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.1-tsew-su"
	},
	{
		suffix: "us-west-2.elasticbeanstalk.com",
		reversed: "moc.klatsnaebcitsale.2-tsew-su"
	},
	{
		suffix: "us.ax",
		reversed: "xa.su"
	},
	{
		suffix: "us.com",
		reversed: "moc.su"
	},
	{
		suffix: "us.eu.org",
		reversed: "gro.ue.su"
	},
	{
		suffix: "us.gov.pl",
		reversed: "lp.vog.su"
	},
	{
		suffix: "us.in",
		reversed: "ni.su"
	},
	{
		suffix: "us.kg",
		reversed: "gk.su"
	},
	{
		suffix: "us.na",
		reversed: "an.su"
	},
	{
		suffix: "us.org",
		reversed: "gro.su"
	},
	{
		suffix: "us.platform.sh",
		reversed: "hs.mroftalp.su"
	},
	{
		suffix: "us.reclaim.cloud",
		reversed: "duolc.mialcer.su"
	},
	{
		suffix: "usa.museum",
		reversed: "muesum.asu"
	},
	{
		suffix: "usa.oita.jp",
		reversed: "pj.atio.asu"
	},
	{
		suffix: "usantiques.museum",
		reversed: "muesum.seuqitnasu"
	},
	{
		suffix: "usarts.museum",
		reversed: "muesum.strasu"
	},
	{
		suffix: "uscountryestate.museum",
		reversed: "muesum.etatseyrtnuocsu"
	},
	{
		suffix: "usculture.museum",
		reversed: "muesum.erutlucsu"
	},
	{
		suffix: "usdecorativearts.museum",
		reversed: "muesum.straevitarocedsu"
	},
	{
		suffix: "user.aseinet.ne.jp",
		reversed: "pj.en.teniesa.resu"
	},
	{
		suffix: "user.party.eus",
		reversed: "sue.ytrap.resu"
	},
	{
		suffix: "user.srcf.net",
		reversed: "ten.fcrs.resu"
	},
	{
		suffix: "usercontent.jp",
		reversed: "pj.tnetnocresu"
	},
	{
		suffix: "users.scale.virtualcloud.com.br",
		reversed: "rb.moc.duolclautriv.elacs.sresu"
	},
	{
		suffix: "usgarden.museum",
		reversed: "muesum.nedragsu"
	},
	{
		suffix: "ushiku.ibaraki.jp",
		reversed: "pj.ikarabi.ukihsu"
	},
	{
		suffix: "ushistory.museum",
		reversed: "muesum.yrotsihsu"
	},
	{
		suffix: "ushuaia.museum",
		reversed: "muesum.aiauhsu"
	},
	{
		suffix: "uslivinghistory.museum",
		reversed: "muesum.yrotsihgnivilsu"
	},
	{
		suffix: "usr.cloud.muni.cz",
		reversed: "zc.inum.duolc.rsu"
	},
	{
		suffix: "ustka.pl",
		reversed: "lp.aktsu"
	},
	{
		suffix: "usui.fukuoka.jp",
		reversed: "pj.akoukuf.iusu"
	},
	{
		suffix: "usuki.oita.jp",
		reversed: "pj.atio.ikusu"
	},
	{
		suffix: "ut.us",
		reversed: "su.tu"
	},
	{
		suffix: "utah.museum",
		reversed: "muesum.hatu"
	},
	{
		suffix: "utashinai.hokkaido.jp",
		reversed: "pj.odiakkoh.ianihsatu"
	},
	{
		suffix: "utazas.hu",
		reversed: "uh.sazatu"
	},
	{
		suffix: "utazu.kagawa.jp",
		reversed: "pj.awagak.uzatu"
	},
	{
		suffix: "uto.kumamoto.jp",
		reversed: "pj.otomamuk.otu"
	},
	{
		suffix: "utsira.no",
		reversed: "on.aristu"
	},
	{
		suffix: "utsunomiya.tochigi.jp",
		reversed: "pj.igihcot.ayimonustu"
	},
	{
		suffix: "utwente.io",
		reversed: "oi.etnewtu"
	},
	{
		suffix: "uvic.museum",
		reversed: "muesum.civu"
	},
	{
		suffix: "uw.gov.pl",
		reversed: "lp.vog.wu"
	},
	{
		suffix: "uwajima.ehime.jp",
		reversed: "pj.emihe.amijawu"
	},
	{
		suffix: "uwu.ai",
		reversed: "ia.uwu"
	},
	{
		suffix: "uy",
		reversed: "yu"
	},
	{
		suffix: "uy.com",
		reversed: "moc.yu"
	},
	{
		suffix: "uz",
		reversed: "zu"
	},
	{
		suffix: "uz.ua",
		reversed: "au.zu"
	},
	{
		suffix: "uzhgorod.ua",
		reversed: "au.doroghzu"
	},
	{
		suffix: "uzs.gov.pl",
		reversed: "lp.vog.szu"
	},
	{
		suffix: "v-info.info",
		reversed: "ofni.ofni-v"
	},
	{
		suffix: "v.bg",
		reversed: "gb.v"
	},
	{
		suffix: "v.ua",
		reversed: "au.v"
	},
	{
		suffix: "va",
		reversed: "av"
	},
	{
		suffix: "va.it",
		reversed: "ti.av"
	},
	{
		suffix: "va.no",
		reversed: "on.av"
	},
	{
		suffix: "va.us",
		reversed: "su.av"
	},
	{
		suffix: "vaapste.no",
		reversed: "on.etspaav"
	},
	{
		suffix: "vacations",
		reversed: "snoitacav"
	},
	{
		suffix: "vadso.no",
		reversed: "on.osdav"
	},
	{
		suffix: "vadsø.no",
		reversed: "on.arj-sdav--nx"
	},
	{
		suffix: "vaga.no",
		reversed: "on.agav"
	},
	{
		suffix: "vagan.no",
		reversed: "on.nagav"
	},
	{
		suffix: "vagsoy.no",
		reversed: "on.yosgav"
	},
	{
		suffix: "vaksdal.no",
		reversed: "on.ladskav"
	},
	{
		suffix: "val-d-aosta.it",
		reversed: "ti.atsoa-d-lav"
	},
	{
		suffix: "val-daosta.it",
		reversed: "ti.atsoad-lav"
	},
	{
		suffix: "vald-aosta.it",
		reversed: "ti.atsoa-dlav"
	},
	{
		suffix: "valdaosta.it",
		reversed: "ti.atsoadlav"
	},
	{
		suffix: "valer.hedmark.no",
		reversed: "on.kramdeh.relav"
	},
	{
		suffix: "valer.ostfold.no",
		reversed: "on.dloftso.relav"
	},
	{
		suffix: "valle-aosta.it",
		reversed: "ti.atsoa-ellav"
	},
	{
		suffix: "valle-d-aosta.it",
		reversed: "ti.atsoa-d-ellav"
	},
	{
		suffix: "valle-daosta.it",
		reversed: "ti.atsoad-ellav"
	},
	{
		suffix: "valle.no",
		reversed: "on.ellav"
	},
	{
		suffix: "valleaosta.it",
		reversed: "ti.atsoaellav"
	},
	{
		suffix: "valled-aosta.it",
		reversed: "ti.atsoa-dellav"
	},
	{
		suffix: "valledaosta.it",
		reversed: "ti.atsoadellav"
	},
	{
		suffix: "vallee-aoste.it",
		reversed: "ti.etsoa-eellav"
	},
	{
		suffix: "vallee-d-aoste.it",
		reversed: "ti.etsoa-d-eellav"
	},
	{
		suffix: "valleeaoste.it",
		reversed: "ti.etsoaeellav"
	},
	{
		suffix: "valleedaoste.it",
		reversed: "ti.etsoadeellav"
	},
	{
		suffix: "valley.museum",
		reversed: "muesum.yellav"
	},
	{
		suffix: "vallée-aoste.it",
		reversed: "ti.bbe-etsoa-ellav--nx"
	},
	{
		suffix: "vallée-d-aoste.it",
		reversed: "ti.bhe-etsoa-d-ellav--nx"
	},
	{
		suffix: "valléeaoste.it",
		reversed: "ti.a7e-etsoaellav--nx"
	},
	{
		suffix: "valléedaoste.it",
		reversed: "ti.bbe-etsoadellav--nx"
	},
	{
		suffix: "vana",
		reversed: "anav"
	},
	{
		suffix: "vang.no",
		reversed: "on.gnav"
	},
	{
		suffix: "vanguard",
		reversed: "draugnav"
	},
	{
		suffix: "vantaa.museum",
		reversed: "muesum.aatnav"
	},
	{
		suffix: "vanylven.no",
		reversed: "on.nevlynav"
	},
	{
		suffix: "vao.it",
		reversed: "ti.oav"
	},
	{
		suffix: "vapor.cloud",
		reversed: "duolc.ropav"
	},
	{
		suffix: "vaporcloud.io",
		reversed: "oi.duolcropav"
	},
	{
		suffix: "vardo.no",
		reversed: "on.odrav"
	},
	{
		suffix: "vardø.no",
		reversed: "on.arj-drav--nx"
	},
	{
		suffix: "varese.it",
		reversed: "ti.eserav"
	},
	{
		suffix: "varggat.no",
		reversed: "on.taggrav"
	},
	{
		suffix: "varoy.no",
		reversed: "on.yorav"
	},
	{
		suffix: "vb.it",
		reversed: "ti.bv"
	},
	{
		suffix: "vc",
		reversed: "cv"
	},
	{
		suffix: "vc.it",
		reversed: "ti.cv"
	},
	{
		suffix: "vda.it",
		reversed: "ti.adv"
	},
	{
		suffix: "ve",
		reversed: "ev"
	},
	{
		suffix: "ve.it",
		reversed: "ti.ev"
	},
	{
		suffix: "vefsn.no",
		reversed: "on.nsfev"
	},
	{
		suffix: "vega.no",
		reversed: "on.agev"
	},
	{
		suffix: "vegarshei.no",
		reversed: "on.iehsragev"
	},
	{
		suffix: "vegas",
		reversed: "sagev"
	},
	{
		suffix: "vegårshei.no",
		reversed: "on.a0c-iehsrgev--nx"
	},
	{
		suffix: "velvet.jp",
		reversed: "pj.tevlev"
	},
	{
		suffix: "ven.it",
		reversed: "ti.nev"
	},
	{
		suffix: "veneto.it",
		reversed: "ti.otenev"
	},
	{
		suffix: "venezia.it",
		reversed: "ti.aizenev"
	},
	{
		suffix: "venice.it",
		reversed: "ti.ecinev"
	},
	{
		suffix: "vennesla.no",
		reversed: "on.alsennev"
	},
	{
		suffix: "ventures",
		reversed: "serutnev"
	},
	{
		suffix: "verbania.it",
		reversed: "ti.ainabrev"
	},
	{
		suffix: "vercel.app",
		reversed: "ppa.lecrev"
	},
	{
		suffix: "vercel.dev",
		reversed: "ved.lecrev"
	},
	{
		suffix: "vercelli.it",
		reversed: "ti.illecrev"
	},
	{
		suffix: "verdal.no",
		reversed: "on.ladrev"
	},
	{
		suffix: "verisign",
		reversed: "ngisirev"
	},
	{
		suffix: "vermögensberater",
		reversed: "btc-retarebsnegmrev--nx"
	},
	{
		suffix: "vermögensberatung",
		reversed: "bwp-gnutarebsnegmrev--nx"
	},
	{
		suffix: "verona.it",
		reversed: "ti.anorev"
	},
	{
		suffix: "verran.no",
		reversed: "on.narrev"
	},
	{
		suffix: "versailles.museum",
		reversed: "muesum.selliasrev"
	},
	{
		suffix: "verse.jp",
		reversed: "pj.esrev"
	},
	{
		suffix: "versicherung",
		reversed: "gnurehcisrev"
	},
	{
		suffix: "versus.jp",
		reversed: "pj.susrev"
	},
	{
		suffix: "vestby.no",
		reversed: "on.ybtsev"
	},
	{
		suffix: "vestnes.no",
		reversed: "on.sentsev"
	},
	{
		suffix: "vestre-slidre.no",
		reversed: "on.erdils-ertsev"
	},
	{
		suffix: "vestre-toten.no",
		reversed: "on.netot-ertsev"
	},
	{
		suffix: "vestvagoy.no",
		reversed: "on.yogavtsev"
	},
	{
		suffix: "vestvågøy.no",
		reversed: "on.o6axi-ygvtsev--nx"
	},
	{
		suffix: "vet",
		reversed: "tev"
	},
	{
		suffix: "vet.br",
		reversed: "rb.tev"
	},
	{
		suffix: "veterinaire.fr",
		reversed: "rf.erianiretev"
	},
	{
		suffix: "veterinaire.km",
		reversed: "mk.erianiretev"
	},
	{
		suffix: "vevelstad.no",
		reversed: "on.datslevev"
	},
	{
		suffix: "vf.no",
		reversed: "on.fv"
	},
	{
		suffix: "vfs.cloud9.af-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-fa.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.ap-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-pa.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.ap-northeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtron-pa.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.ap-northeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtron-pa.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.ap-northeast-3.amazonaws.com",
		reversed: "moc.swanozama.3-tsaehtron-pa.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.ap-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-pa.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.ap-southeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtuos-pa.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.ap-southeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtuos-pa.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.ca-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ac.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.eu-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ue.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.eu-north-1.amazonaws.com",
		reversed: "moc.swanozama.1-htron-ue.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.eu-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-ue.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.eu-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-ue.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.eu-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-ue.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.eu-west-3.amazonaws.com",
		reversed: "moc.swanozama.3-tsew-ue.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.me-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-em.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.sa-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-as.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.us-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-su.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.us-east-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsae-su.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.us-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-su.9duolc.sfv"
	},
	{
		suffix: "vfs.cloud9.us-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-su.9duolc.sfv"
	},
	{
		suffix: "vg",
		reversed: "gv"
	},
	{
		suffix: "vgs.no",
		reversed: "on.sgv"
	},
	{
		suffix: "vi",
		reversed: "iv"
	},
	{
		suffix: "vi.it",
		reversed: "ti.iv"
	},
	{
		suffix: "vi.us",
		reversed: "su.iv"
	},
	{
		suffix: "viajes",
		reversed: "sejaiv"
	},
	{
		suffix: "vibo-valentia.it",
		reversed: "ti.aitnelav-obiv"
	},
	{
		suffix: "vibovalentia.it",
		reversed: "ti.aitnelavobiv"
	},
	{
		suffix: "vic.au",
		reversed: "ua.civ"
	},
	{
		suffix: "vic.edu.au",
		reversed: "ua.ude.civ"
	},
	{
		suffix: "vic.gov.au",
		reversed: "ua.vog.civ"
	},
	{
		suffix: "vicenza.it",
		reversed: "ti.azneciv"
	},
	{
		suffix: "video",
		reversed: "oediv"
	},
	{
		suffix: "video.hu",
		reversed: "uh.oediv"
	},
	{
		suffix: "vig",
		reversed: "giv"
	},
	{
		suffix: "vik.no",
		reversed: "on.kiv"
	},
	{
		suffix: "viking",
		reversed: "gnikiv"
	},
	{
		suffix: "viking.museum",
		reversed: "muesum.gnikiv"
	},
	{
		suffix: "vikna.no",
		reversed: "on.ankiv"
	},
	{
		suffix: "village.museum",
		reversed: "muesum.egalliv"
	},
	{
		suffix: "villas",
		reversed: "salliv"
	},
	{
		suffix: "vin",
		reversed: "niv"
	},
	{
		suffix: "vindafjord.no",
		reversed: "on.drojfadniv"
	},
	{
		suffix: "vinnica.ua",
		reversed: "au.acinniv"
	},
	{
		suffix: "vinnytsia.ua",
		reversed: "au.aistynniv"
	},
	{
		suffix: "vip",
		reversed: "piv"
	},
	{
		suffix: "vip.jelastic.cloud",
		reversed: "duolc.citsalej.piv"
	},
	{
		suffix: "vipsinaapp.com",
		reversed: "moc.ppaanispiv"
	},
	{
		suffix: "virgin",
		reversed: "nigriv"
	},
	{
		suffix: "virginia.museum",
		reversed: "muesum.ainigriv"
	},
	{
		suffix: "virtual-user.de",
		reversed: "ed.resu-lautriv"
	},
	{
		suffix: "virtual.museum",
		reversed: "muesum.lautriv"
	},
	{
		suffix: "virtualserver.io",
		reversed: "oi.revreslautriv"
	},
	{
		suffix: "virtualuser.de",
		reversed: "ed.resulautriv"
	},
	{
		suffix: "virtuel.museum",
		reversed: "muesum.leutriv"
	},
	{
		suffix: "visa",
		reversed: "asiv"
	},
	{
		suffix: "vision",
		reversed: "noisiv"
	},
	{
		suffix: "viterbo.it",
		reversed: "ti.obretiv"
	},
	{
		suffix: "viva",
		reversed: "aviv"
	},
	{
		suffix: "vivian.jp",
		reversed: "pj.naiviv"
	},
	{
		suffix: "vivo",
		reversed: "oviv"
	},
	{
		suffix: "vix.br",
		reversed: "rb.xiv"
	},
	{
		suffix: "vlaanderen",
		reversed: "nerednaalv"
	},
	{
		suffix: "vlaanderen.museum",
		reversed: "muesum.nerednaalv"
	},
	{
		suffix: "vladikavkaz.ru",
		reversed: "ur.zakvakidalv"
	},
	{
		suffix: "vladikavkaz.su",
		reversed: "us.zakvakidalv"
	},
	{
		suffix: "vladimir.ru",
		reversed: "ur.rimidalv"
	},
	{
		suffix: "vladimir.su",
		reversed: "us.rimidalv"
	},
	{
		suffix: "vlog.br",
		reversed: "rb.golv"
	},
	{
		suffix: "vm.bytemark.co.uk",
		reversed: "ku.oc.krametyb.mv"
	},
	{
		suffix: "vn",
		reversed: "nv"
	},
	{
		suffix: "vn.ua",
		reversed: "au.nv"
	},
	{
		suffix: "voagat.no",
		reversed: "on.tagaov"
	},
	{
		suffix: "vodka",
		reversed: "akdov"
	},
	{
		suffix: "volda.no",
		reversed: "on.adlov"
	},
	{
		suffix: "volkenkunde.museum",
		reversed: "muesum.ednukneklov"
	},
	{
		suffix: "volkswagen",
		reversed: "negawsklov"
	},
	{
		suffix: "vologda.su",
		reversed: "us.adgolov"
	},
	{
		suffix: "volvo",
		reversed: "ovlov"
	},
	{
		suffix: "volyn.ua",
		reversed: "au.nylov"
	},
	{
		suffix: "voorloper.cloud",
		reversed: "duolc.repolroov"
	},
	{
		suffix: "voss.no",
		reversed: "on.ssov"
	},
	{
		suffix: "vossevangen.no",
		reversed: "on.negnavessov"
	},
	{
		suffix: "vote",
		reversed: "etov"
	},
	{
		suffix: "voting",
		reversed: "gnitov"
	},
	{
		suffix: "voto",
		reversed: "otov"
	},
	{
		suffix: "voyage",
		reversed: "egayov"
	},
	{
		suffix: "vp4.me",
		reversed: "em.4pv"
	},
	{
		suffix: "vpndns.net",
		reversed: "ten.sndnpv"
	},
	{
		suffix: "vpnplus.to",
		reversed: "ot.sulpnpv"
	},
	{
		suffix: "vps-host.net",
		reversed: "ten.tsoh-spv"
	},
	{
		suffix: "vps.mcdir.ru",
		reversed: "ur.ridcm.spv"
	},
	{
		suffix: "vr.it",
		reversed: "ti.rv"
	},
	{
		suffix: "vs.it",
		reversed: "ti.sv"
	},
	{
		suffix: "vs.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.sv"
	},
	{
		suffix: "vt.it",
		reversed: "ti.tv"
	},
	{
		suffix: "vt.us",
		reversed: "su.tv"
	},
	{
		suffix: "vu",
		reversed: "uv"
	},
	{
		suffix: "vuelos",
		reversed: "soleuv"
	},
	{
		suffix: "vv.it",
		reversed: "ti.vv"
	},
	{
		suffix: "vxl.sh",
		reversed: "hs.lxv"
	},
	{
		suffix: "várggát.no",
		reversed: "on.daqx-tggrv--nx"
	},
	{
		suffix: "vågan.no",
		reversed: "on.aoq-nagv--nx"
	},
	{
		suffix: "vågsøy.no",
		reversed: "on.j0aoq-ysgv--nx"
	},
	{
		suffix: "vågå.no",
		reversed: "on.baiy-gv--nx"
	},
	{
		suffix: "våler.hedmark.no",
		reversed: "on.kramdeh.aoq-relv--nx"
	},
	{
		suffix: "våler.østfold.no",
		reversed: "on.ax9-dlofts--nx.aoq-relv--nx"
	},
	{
		suffix: "værøy.no",
		reversed: "on.g5aly-yrv--nx"
	},
	{
		suffix: "w.bg",
		reversed: "gb.w"
	},
	{
		suffix: "w.se",
		reversed: "es.w"
	},
	{
		suffix: "wa.au",
		reversed: "ua.aw"
	},
	{
		suffix: "wa.edu.au",
		reversed: "ua.ude.aw"
	},
	{
		suffix: "wa.gov.au",
		reversed: "ua.vog.aw"
	},
	{
		suffix: "wa.us",
		reversed: "su.aw"
	},
	{
		suffix: "wada.nagano.jp",
		reversed: "pj.onagan.adaw"
	},
	{
		suffix: "wafflecell.com",
		reversed: "moc.llecelffaw"
	},
	{
		suffix: "wajiki.tokushima.jp",
		reversed: "pj.amihsukot.ikijaw"
	},
	{
		suffix: "wajima.ishikawa.jp",
		reversed: "pj.awakihsi.amijaw"
	},
	{
		suffix: "wakasa.fukui.jp",
		reversed: "pj.iukuf.asakaw"
	},
	{
		suffix: "wakasa.tottori.jp",
		reversed: "pj.irottot.asakaw"
	},
	{
		suffix: "wakayama.jp",
		reversed: "pj.amayakaw"
	},
	{
		suffix: "wakayama.wakayama.jp",
		reversed: "pj.amayakaw.amayakaw"
	},
	{
		suffix: "wake.okayama.jp",
		reversed: "pj.amayako.ekaw"
	},
	{
		suffix: "wakkanai.hokkaido.jp",
		reversed: "pj.odiakkoh.ianakkaw"
	},
	{
		suffix: "wakuya.miyagi.jp",
		reversed: "pj.igayim.ayukaw"
	},
	{
		suffix: "walbrzych.pl",
		reversed: "lp.hcyzrblaw"
	},
	{
		suffix: "wales",
		reversed: "selaw"
	},
	{
		suffix: "wales.museum",
		reversed: "muesum.selaw"
	},
	{
		suffix: "wallonie.museum",
		reversed: "muesum.einollaw"
	},
	{
		suffix: "walmart",
		reversed: "tramlaw"
	},
	{
		suffix: "walter",
		reversed: "retlaw"
	},
	{
		suffix: "wang",
		reversed: "gnaw"
	},
	{
		suffix: "wanggou",
		reversed: "uoggnaw"
	},
	{
		suffix: "wanouchi.gifu.jp",
		reversed: "pj.ufig.ihcuonaw"
	},
	{
		suffix: "war.museum",
		reversed: "muesum.raw"
	},
	{
		suffix: "warabi.saitama.jp",
		reversed: "pj.amatias.ibaraw"
	},
	{
		suffix: "warmia.pl",
		reversed: "lp.aimraw"
	},
	{
		suffix: "warszawa.pl",
		reversed: "lp.awazsraw"
	},
	{
		suffix: "washingtondc.museum",
		reversed: "muesum.cdnotgnihsaw"
	},
	{
		suffix: "washtenaw.mi.us",
		reversed: "su.im.wanethsaw"
	},
	{
		suffix: "wassamu.hokkaido.jp",
		reversed: "pj.odiakkoh.umassaw"
	},
	{
		suffix: "watarai.mie.jp",
		reversed: "pj.eim.iarataw"
	},
	{
		suffix: "watari.miyagi.jp",
		reversed: "pj.igayim.irataw"
	},
	{
		suffix: "watch",
		reversed: "hctaw"
	},
	{
		suffix: "watch-and-clock.museum",
		reversed: "muesum.kcolc-dna-hctaw"
	},
	{
		suffix: "watchandclock.museum",
		reversed: "muesum.kcolcdnahctaw"
	},
	{
		suffix: "watches",
		reversed: "sehctaw"
	},
	{
		suffix: "watson.jp",
		reversed: "pj.nostaw"
	},
	{
		suffix: "waw.pl",
		reversed: "lp.waw"
	},
	{
		suffix: "wazuka.kyoto.jp",
		reversed: "pj.otoyk.akuzaw"
	},
	{
		suffix: "we.bs",
		reversed: "sb.ew"
	},
	{
		suffix: "we.tc",
		reversed: "ct.ew"
	},
	{
		suffix: "weather",
		reversed: "rehtaew"
	},
	{
		suffix: "weatherchannel",
		reversed: "lennahcrehtaew"
	},
	{
		suffix: "web.app",
		reversed: "ppa.bew"
	},
	{
		suffix: "web.bo",
		reversed: "ob.bew"
	},
	{
		suffix: "web.co",
		reversed: "oc.bew"
	},
	{
		suffix: "web.do",
		reversed: "od.bew"
	},
	{
		suffix: "web.gu",
		reversed: "ug.bew"
	},
	{
		suffix: "web.id",
		reversed: "di.bew"
	},
	{
		suffix: "web.in",
		reversed: "ni.bew"
	},
	{
		suffix: "web.lk",
		reversed: "kl.bew"
	},
	{
		suffix: "web.nf",
		reversed: "fn.bew"
	},
	{
		suffix: "web.ni",
		reversed: "in.bew"
	},
	{
		suffix: "web.pk",
		reversed: "kp.bew"
	},
	{
		suffix: "web.tj",
		reversed: "jt.bew"
	},
	{
		suffix: "web.tr",
		reversed: "rt.bew"
	},
	{
		suffix: "web.ve",
		reversed: "ev.bew"
	},
	{
		suffix: "web.za",
		reversed: "az.bew"
	},
	{
		suffix: "webcam",
		reversed: "macbew"
	},
	{
		suffix: "weber",
		reversed: "rebew"
	},
	{
		suffix: "webhop.biz",
		reversed: "zib.pohbew"
	},
	{
		suffix: "webhop.info",
		reversed: "ofni.pohbew"
	},
	{
		suffix: "webhop.me",
		reversed: "em.pohbew"
	},
	{
		suffix: "webhop.net",
		reversed: "ten.pohbew"
	},
	{
		suffix: "webhop.org",
		reversed: "gro.pohbew"
	},
	{
		suffix: "webhosting.be",
		reversed: "eb.gnitsohbew"
	},
	{
		suffix: "weblike.jp",
		reversed: "pj.ekilbew"
	},
	{
		suffix: "webredirect.org",
		reversed: "gro.tceriderbew"
	},
	{
		suffix: "website",
		reversed: "etisbew"
	},
	{
		suffix: "website.yandexcloud.net",
		reversed: "ten.duolcxednay.etisbew"
	},
	{
		suffix: "webspace.rocks",
		reversed: "skcor.ecapsbew"
	},
	{
		suffix: "webthings.io",
		reversed: "oi.sgnihtbew"
	},
	{
		suffix: "webview-assets.cloud9.af-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-fa.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.ap-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-pa.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.ap-northeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtron-pa.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.ap-northeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtron-pa.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.ap-northeast-3.amazonaws.com",
		reversed: "moc.swanozama.3-tsaehtron-pa.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.ap-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-pa.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.ap-southeast-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsaehtuos-pa.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.ap-southeast-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsaehtuos-pa.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.ca-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ac.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.eu-central-1.amazonaws.com",
		reversed: "moc.swanozama.1-lartnec-ue.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.eu-north-1.amazonaws.com",
		reversed: "moc.swanozama.1-htron-ue.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.eu-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-ue.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.eu-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-ue.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.eu-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-ue.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.eu-west-3.amazonaws.com",
		reversed: "moc.swanozama.3-tsew-ue.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.me-south-1.amazonaws.com",
		reversed: "moc.swanozama.1-htuos-em.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.sa-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-as.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.us-east-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsae-su.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.us-east-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsae-su.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.us-west-1.amazonaws.com",
		reversed: "moc.swanozama.1-tsew-su.9duolc.stessa-weivbew"
	},
	{
		suffix: "webview-assets.cloud9.us-west-2.amazonaws.com",
		reversed: "moc.swanozama.2-tsew-su.9duolc.stessa-weivbew"
	},
	{
		suffix: "wedding",
		reversed: "gniddew"
	},
	{
		suffix: "wedeploy.io",
		reversed: "oi.yolpedew"
	},
	{
		suffix: "wedeploy.me",
		reversed: "em.yolpedew"
	},
	{
		suffix: "wedeploy.sh",
		reversed: "hs.yolpedew"
	},
	{
		suffix: "weeklylottery.org.uk",
		reversed: "ku.gro.yrettolylkeew"
	},
	{
		suffix: "wegrow.pl",
		reversed: "lp.worgew"
	},
	{
		suffix: "weibo",
		reversed: "obiew"
	},
	{
		suffix: "weir",
		reversed: "riew"
	},
	{
		suffix: "wellbeingzone.co.uk",
		reversed: "ku.oc.enozgniebllew"
	},
	{
		suffix: "wellbeingzone.eu",
		reversed: "ue.enozgniebllew"
	},
	{
		suffix: "west1-us.cloudjiffy.net",
		reversed: "ten.yffijduolc.su-1tsew"
	},
	{
		suffix: "western.museum",
		reversed: "muesum.nretsew"
	},
	{
		suffix: "westeurope.azurestaticapps.net",
		reversed: "ten.sppacitatseruza.eporuetsew"
	},
	{
		suffix: "westfalen.museum",
		reversed: "muesum.nelaftsew"
	},
	{
		suffix: "westus2.azurestaticapps.net",
		reversed: "ten.sppacitatseruza.2sutsew"
	},
	{
		suffix: "wf",
		reversed: "fw"
	},
	{
		suffix: "whaling.museum",
		reversed: "muesum.gnilahw"
	},
	{
		suffix: "whitesnow.jp",
		reversed: "pj.wonsetihw"
	},
	{
		suffix: "whm.fr-par.scw.cloud",
		reversed: "duolc.wcs.rap-rf.mhw"
	},
	{
		suffix: "whm.nl-ams.scw.cloud",
		reversed: "duolc.wcs.sma-ln.mhw"
	},
	{
		suffix: "whoswho",
		reversed: "ohwsohw"
	},
	{
		suffix: "wi.us",
		reversed: "su.iw"
	},
	{
		suffix: "wielun.pl",
		reversed: "lp.nuleiw"
	},
	{
		suffix: "wien",
		reversed: "neiw"
	},
	{
		suffix: "wien.funkfeuer.at",
		reversed: "ta.reuefknuf.neiw"
	},
	{
		suffix: "wif.gov.pl",
		reversed: "lp.vog.fiw"
	},
	{
		suffix: "wiih.gov.pl",
		reversed: "lp.vog.hiiw"
	},
	{
		suffix: "wiki",
		reversed: "ikiw"
	},
	{
		suffix: "wiki.bo",
		reversed: "ob.ikiw"
	},
	{
		suffix: "wiki.br",
		reversed: "rb.ikiw"
	},
	{
		suffix: "wildlife.museum",
		reversed: "muesum.efildliw"
	},
	{
		suffix: "williamhill",
		reversed: "llihmailliw"
	},
	{
		suffix: "williamsburg.museum",
		reversed: "muesum.grubsmailliw"
	},
	{
		suffix: "win",
		reversed: "niw"
	},
	{
		suffix: "winb.gov.pl",
		reversed: "lp.vog.bniw"
	},
	{
		suffix: "windmill.museum",
		reversed: "muesum.llimdniw"
	},
	{
		suffix: "windows",
		reversed: "swodniw"
	},
	{
		suffix: "wine",
		reversed: "eniw"
	},
	{
		suffix: "winners",
		reversed: "srenniw"
	},
	{
		suffix: "wios.gov.pl",
		reversed: "lp.vog.soiw"
	},
	{
		suffix: "witd.gov.pl",
		reversed: "lp.vog.dtiw"
	},
	{
		suffix: "withgoogle.com",
		reversed: "moc.elgooghtiw"
	},
	{
		suffix: "withyoutube.com",
		reversed: "moc.ebutuoyhtiw"
	},
	{
		suffix: "wiw.gov.pl",
		reversed: "lp.vog.wiw"
	},
	{
		suffix: "wixsite.com",
		reversed: "moc.etisxiw"
	},
	{
		suffix: "wlocl.pl",
		reversed: "lp.lcolw"
	},
	{
		suffix: "wloclawek.pl",
		reversed: "lp.kewalcolw"
	},
	{
		suffix: "wmcloud.org",
		reversed: "gro.duolcmw"
	},
	{
		suffix: "wme",
		reversed: "emw"
	},
	{
		suffix: "wmflabs.org",
		reversed: "gro.sbalfmw"
	},
	{
		suffix: "wnext.app",
		reversed: "ppa.txenw"
	},
	{
		suffix: "wodzislaw.pl",
		reversed: "lp.walsizdow"
	},
	{
		suffix: "wolomin.pl",
		reversed: "lp.nimolow"
	},
	{
		suffix: "wolterskluwer",
		reversed: "rewulksretlow"
	},
	{
		suffix: "woltlab-demo.com",
		reversed: "moc.omed-baltlow"
	},
	{
		suffix: "woodside",
		reversed: "edisdoow"
	},
	{
		suffix: "work",
		reversed: "krow"
	},
	{
		suffix: "workers.dev",
		reversed: "ved.srekrow"
	},
	{
		suffix: "workinggroup.aero",
		reversed: "orea.puorggnikrow"
	},
	{
		suffix: "workisboring.com",
		reversed: "moc.gnirobsikrow"
	},
	{
		suffix: "works",
		reversed: "skrow"
	},
	{
		suffix: "works.aero",
		reversed: "orea.skrow"
	},
	{
		suffix: "workshop.museum",
		reversed: "muesum.pohskrow"
	},
	{
		suffix: "world",
		reversed: "dlrow"
	},
	{
		suffix: "worse-than.tv",
		reversed: "vt.naht-esrow"
	},
	{
		suffix: "wow",
		reversed: "wow"
	},
	{
		suffix: "wpdevcloud.com",
		reversed: "moc.duolcvedpw"
	},
	{
		suffix: "wpenginepowered.com",
		reversed: "moc.derewopenignepw"
	},
	{
		suffix: "wphostedmail.com",
		reversed: "moc.liamdetsohpw"
	},
	{
		suffix: "wpmucdn.com",
		reversed: "moc.ndcumpw"
	},
	{
		suffix: "wpmudev.host",
		reversed: "tsoh.vedumpw"
	},
	{
		suffix: "writesthisblog.com",
		reversed: "moc.golbsihtsetirw"
	},
	{
		suffix: "wroc.pl",
		reversed: "lp.corw"
	},
	{
		suffix: "wroclaw.pl",
		reversed: "lp.walcorw"
	},
	{
		suffix: "ws",
		reversed: "sw"
	},
	{
		suffix: "ws.na",
		reversed: "an.sw"
	},
	{
		suffix: "wsa.gov.pl",
		reversed: "lp.vog.asw"
	},
	{
		suffix: "wskr.gov.pl",
		reversed: "lp.vog.rksw"
	},
	{
		suffix: "wtc",
		reversed: "ctw"
	},
	{
		suffix: "wtf",
		reversed: "ftw"
	},
	{
		suffix: "wuoz.gov.pl",
		reversed: "lp.vog.zouw"
	},
	{
		suffix: "wv.us",
		reversed: "su.vw"
	},
	{
		suffix: "www.ro",
		reversed: "or.www"
	},
	{
		suffix: "wy.us",
		reversed: "su.yw"
	},
	{
		suffix: "wzmiuw.gov.pl",
		reversed: "lp.vog.wuimzw"
	},
	{
		suffix: "x.bg",
		reversed: "gb.x"
	},
	{
		suffix: "x.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.x"
	},
	{
		suffix: "x.se",
		reversed: "es.x"
	},
	{
		suffix: "x443.pw",
		reversed: "wp.344x"
	},
	{
		suffix: "xbox",
		reversed: "xobx"
	},
	{
		suffix: "xen.prgmr.com",
		reversed: "moc.rmgrp.nex"
	},
	{
		suffix: "xerox",
		reversed: "xorex"
	},
	{
		suffix: "xfinity",
		reversed: "ytinifx"
	},
	{
		suffix: "xihuan",
		reversed: "nauhix"
	},
	{
		suffix: "xin",
		reversed: "nix"
	},
	{
		suffix: "xj.cn",
		reversed: "nc.jx"
	},
	{
		suffix: "xnbay.com",
		reversed: "moc.yabnx"
	},
	{
		suffix: "xs4all.space",
		reversed: "ecaps.lla4sx"
	},
	{
		suffix: "xx.gl",
		reversed: "lg.xx"
	},
	{
		suffix: "xxx",
		reversed: "xxx"
	},
	{
		suffix: "xy.ax",
		reversed: "xa.yx"
	},
	{
		suffix: "xyz",
		reversed: "zyx"
	},
	{
		suffix: "xz.cn",
		reversed: "nc.zx"
	},
	{
		suffix: "y.bg",
		reversed: "gb.y"
	},
	{
		suffix: "y.se",
		reversed: "es.y"
	},
	{
		suffix: "yabu.hyogo.jp",
		reversed: "pj.ogoyh.ubay"
	},
	{
		suffix: "yabuki.fukushima.jp",
		reversed: "pj.amihsukuf.ikubay"
	},
	{
		suffix: "yachimata.chiba.jp",
		reversed: "pj.abihc.atamihcay"
	},
	{
		suffix: "yachiyo.chiba.jp",
		reversed: "pj.abihc.oyihcay"
	},
	{
		suffix: "yachiyo.ibaraki.jp",
		reversed: "pj.ikarabi.oyihcay"
	},
	{
		suffix: "yachts",
		reversed: "sthcay"
	},
	{
		suffix: "yaese.okinawa.jp",
		reversed: "pj.awaniko.eseay"
	},
	{
		suffix: "yahaba.iwate.jp",
		reversed: "pj.etawi.abahay"
	},
	{
		suffix: "yahiko.niigata.jp",
		reversed: "pj.atagiin.okihay"
	},
	{
		suffix: "yahoo",
		reversed: "oohay"
	},
	{
		suffix: "yaita.tochigi.jp",
		reversed: "pj.igihcot.atiay"
	},
	{
		suffix: "yaizu.shizuoka.jp",
		reversed: "pj.akouzihs.uziay"
	},
	{
		suffix: "yakage.okayama.jp",
		reversed: "pj.amayako.egakay"
	},
	{
		suffix: "yakumo.hokkaido.jp",
		reversed: "pj.odiakkoh.omukay"
	},
	{
		suffix: "yakumo.shimane.jp",
		reversed: "pj.enamihs.omukay"
	},
	{
		suffix: "yali.mythic-beasts.com",
		reversed: "moc.stsaeb-cihtym.ilay"
	},
	{
		suffix: "yalta.ua",
		reversed: "au.atlay"
	},
	{
		suffix: "yamada.fukuoka.jp",
		reversed: "pj.akoukuf.adamay"
	},
	{
		suffix: "yamada.iwate.jp",
		reversed: "pj.etawi.adamay"
	},
	{
		suffix: "yamada.toyama.jp",
		reversed: "pj.amayot.adamay"
	},
	{
		suffix: "yamaga.kumamoto.jp",
		reversed: "pj.otomamuk.agamay"
	},
	{
		suffix: "yamagata.gifu.jp",
		reversed: "pj.ufig.atagamay"
	},
	{
		suffix: "yamagata.ibaraki.jp",
		reversed: "pj.ikarabi.atagamay"
	},
	{
		suffix: "yamagata.jp",
		reversed: "pj.atagamay"
	},
	{
		suffix: "yamagata.nagano.jp",
		reversed: "pj.onagan.atagamay"
	},
	{
		suffix: "yamagata.yamagata.jp",
		reversed: "pj.atagamay.atagamay"
	},
	{
		suffix: "yamaguchi.jp",
		reversed: "pj.ihcugamay"
	},
	{
		suffix: "yamakita.kanagawa.jp",
		reversed: "pj.awaganak.atikamay"
	},
	{
		suffix: "yamamoto.miyagi.jp",
		reversed: "pj.igayim.otomamay"
	},
	{
		suffix: "yamanakako.yamanashi.jp",
		reversed: "pj.ihsanamay.okakanamay"
	},
	{
		suffix: "yamanashi.jp",
		reversed: "pj.ihsanamay"
	},
	{
		suffix: "yamanashi.yamanashi.jp",
		reversed: "pj.ihsanamay.ihsanamay"
	},
	{
		suffix: "yamanobe.yamagata.jp",
		reversed: "pj.atagamay.ebonamay"
	},
	{
		suffix: "yamanouchi.nagano.jp",
		reversed: "pj.onagan.ihcuonamay"
	},
	{
		suffix: "yamashina.kyoto.jp",
		reversed: "pj.otoyk.anihsamay"
	},
	{
		suffix: "yamato.fukushima.jp",
		reversed: "pj.amihsukuf.otamay"
	},
	{
		suffix: "yamato.kanagawa.jp",
		reversed: "pj.awaganak.otamay"
	},
	{
		suffix: "yamato.kumamoto.jp",
		reversed: "pj.otomamuk.otamay"
	},
	{
		suffix: "yamatokoriyama.nara.jp",
		reversed: "pj.aran.amayirokotamay"
	},
	{
		suffix: "yamatotakada.nara.jp",
		reversed: "pj.aran.adakatotamay"
	},
	{
		suffix: "yamatsuri.fukushima.jp",
		reversed: "pj.amihsukuf.irustamay"
	},
	{
		suffix: "yamaxun",
		reversed: "nuxamay"
	},
	{
		suffix: "yamazoe.nara.jp",
		reversed: "pj.aran.eozamay"
	},
	{
		suffix: "yame.fukuoka.jp",
		reversed: "pj.akoukuf.emay"
	},
	{
		suffix: "yanagawa.fukuoka.jp",
		reversed: "pj.akoukuf.awaganay"
	},
	{
		suffix: "yanaizu.fukushima.jp",
		reversed: "pj.amihsukuf.uzianay"
	},
	{
		suffix: "yandex",
		reversed: "xednay"
	},
	{
		suffix: "yandexcloud.net",
		reversed: "ten.duolcxednay"
	},
	{
		suffix: "yao.osaka.jp",
		reversed: "pj.akaso.oay"
	},
	{
		suffix: "yaotsu.gifu.jp",
		reversed: "pj.ufig.ustoay"
	},
	{
		suffix: "yasaka.nagano.jp",
		reversed: "pj.onagan.akasay"
	},
	{
		suffix: "yashio.saitama.jp",
		reversed: "pj.amatias.oihsay"
	},
	{
		suffix: "yashiro.hyogo.jp",
		reversed: "pj.ogoyh.orihsay"
	},
	{
		suffix: "yasu.shiga.jp",
		reversed: "pj.agihs.usay"
	},
	{
		suffix: "yasuda.kochi.jp",
		reversed: "pj.ihcok.adusay"
	},
	{
		suffix: "yasugi.shimane.jp",
		reversed: "pj.enamihs.igusay"
	},
	{
		suffix: "yasuoka.nagano.jp",
		reversed: "pj.onagan.akousay"
	},
	{
		suffix: "yatomi.aichi.jp",
		reversed: "pj.ihcia.imotay"
	},
	{
		suffix: "yatsuka.shimane.jp",
		reversed: "pj.enamihs.akustay"
	},
	{
		suffix: "yatsushiro.kumamoto.jp",
		reversed: "pj.otomamuk.orihsustay"
	},
	{
		suffix: "yawara.ibaraki.jp",
		reversed: "pj.ikarabi.araway"
	},
	{
		suffix: "yawata.kyoto.jp",
		reversed: "pj.otoyk.ataway"
	},
	{
		suffix: "yawatahama.ehime.jp",
		reversed: "pj.emihe.amahataway"
	},
	{
		suffix: "yazu.tottori.jp",
		reversed: "pj.irottot.uzay"
	},
	{
		suffix: "ybo.faith",
		reversed: "htiaf.oby"
	},
	{
		suffix: "ybo.party",
		reversed: "ytrap.oby"
	},
	{
		suffix: "ybo.review",
		reversed: "weiver.oby"
	},
	{
		suffix: "ybo.science",
		reversed: "ecneics.oby"
	},
	{
		suffix: "ybo.trade",
		reversed: "edart.oby"
	},
	{
		suffix: "ye",
		reversed: "ey"
	},
	{
		suffix: "yk.ca",
		reversed: "ac.ky"
	},
	{
		suffix: "yn.cn",
		reversed: "nc.ny"
	},
	{
		suffix: "ynh.fr",
		reversed: "rf.hny"
	},
	{
		suffix: "yodobashi",
		reversed: "ihsabodoy"
	},
	{
		suffix: "yoga",
		reversed: "agoy"
	},
	{
		suffix: "yoichi.hokkaido.jp",
		reversed: "pj.odiakkoh.ihcioy"
	},
	{
		suffix: "yoita.niigata.jp",
		reversed: "pj.atagiin.atioy"
	},
	{
		suffix: "yoka.hyogo.jp",
		reversed: "pj.ogoyh.akoy"
	},
	{
		suffix: "yokaichiba.chiba.jp",
		reversed: "pj.abihc.abihciakoy"
	},
	{
		suffix: "yokawa.hyogo.jp",
		reversed: "pj.ogoyh.awakoy"
	},
	{
		suffix: "yokkaichi.mie.jp",
		reversed: "pj.eim.ihciakkoy"
	},
	{
		suffix: "yokohama",
		reversed: "amahokoy"
	},
	{
		suffix: "yokoshibahikari.chiba.jp",
		reversed: "pj.abihc.irakihabihsokoy"
	},
	{
		suffix: "yokosuka.kanagawa.jp",
		reversed: "pj.awaganak.akusokoy"
	},
	{
		suffix: "yokote.akita.jp",
		reversed: "pj.atika.etokoy"
	},
	{
		suffix: "yokoze.saitama.jp",
		reversed: "pj.amatias.ezokoy"
	},
	{
		suffix: "yolasite.com",
		reversed: "moc.etisaloy"
	},
	{
		suffix: "yombo.me",
		reversed: "em.obmoy"
	},
	{
		suffix: "yomitan.okinawa.jp",
		reversed: "pj.awaniko.natimoy"
	},
	{
		suffix: "yonabaru.okinawa.jp",
		reversed: "pj.awaniko.urabanoy"
	},
	{
		suffix: "yonago.tottori.jp",
		reversed: "pj.irottot.oganoy"
	},
	{
		suffix: "yonaguni.okinawa.jp",
		reversed: "pj.awaniko.inuganoy"
	},
	{
		suffix: "yonezawa.yamagata.jp",
		reversed: "pj.atagamay.awazenoy"
	},
	{
		suffix: "yono.saitama.jp",
		reversed: "pj.amatias.onoy"
	},
	{
		suffix: "yorii.saitama.jp",
		reversed: "pj.amatias.iiroy"
	},
	{
		suffix: "york.museum",
		reversed: "muesum.kroy"
	},
	{
		suffix: "yorkshire.museum",
		reversed: "muesum.erihskroy"
	},
	{
		suffix: "yoro.gifu.jp",
		reversed: "pj.ufig.oroy"
	},
	{
		suffix: "yosemite.museum",
		reversed: "muesum.etimesoy"
	},
	{
		suffix: "yoshida.saitama.jp",
		reversed: "pj.amatias.adihsoy"
	},
	{
		suffix: "yoshida.shizuoka.jp",
		reversed: "pj.akouzihs.adihsoy"
	},
	{
		suffix: "yoshikawa.saitama.jp",
		reversed: "pj.amatias.awakihsoy"
	},
	{
		suffix: "yoshimi.saitama.jp",
		reversed: "pj.amatias.imihsoy"
	},
	{
		suffix: "yoshino.nara.jp",
		reversed: "pj.aran.onihsoy"
	},
	{
		suffix: "yoshinogari.saga.jp",
		reversed: "pj.agas.iragonihsoy"
	},
	{
		suffix: "yoshioka.gunma.jp",
		reversed: "pj.amnug.akoihsoy"
	},
	{
		suffix: "yotsukaido.chiba.jp",
		reversed: "pj.abihc.odiakustoy"
	},
	{
		suffix: "you",
		reversed: "uoy"
	},
	{
		suffix: "youth.museum",
		reversed: "muesum.htuoy"
	},
	{
		suffix: "youtube",
		reversed: "ebutuoy"
	},
	{
		suffix: "yt",
		reversed: "ty"
	},
	{
		suffix: "yuasa.wakayama.jp",
		reversed: "pj.amayakaw.asauy"
	},
	{
		suffix: "yufu.oita.jp",
		reversed: "pj.atio.ufuy"
	},
	{
		suffix: "yugawa.fukushima.jp",
		reversed: "pj.amihsukuf.awaguy"
	},
	{
		suffix: "yugawara.kanagawa.jp",
		reversed: "pj.awaganak.arawaguy"
	},
	{
		suffix: "yuki.ibaraki.jp",
		reversed: "pj.ikarabi.ikuy"
	},
	{
		suffix: "yukuhashi.fukuoka.jp",
		reversed: "pj.akoukuf.ihsahukuy"
	},
	{
		suffix: "yun",
		reversed: "nuy"
	},
	{
		suffix: "yura.wakayama.jp",
		reversed: "pj.amayakaw.aruy"
	},
	{
		suffix: "yurihonjo.akita.jp",
		reversed: "pj.atika.ojnohiruy"
	},
	{
		suffix: "yusuhara.kochi.jp",
		reversed: "pj.ihcok.arahusuy"
	},
	{
		suffix: "yusui.kagoshima.jp",
		reversed: "pj.amihsogak.iusuy"
	},
	{
		suffix: "yuu.yamaguchi.jp",
		reversed: "pj.ihcugamay.uuy"
	},
	{
		suffix: "yuza.yamagata.jp",
		reversed: "pj.atagamay.azuy"
	},
	{
		suffix: "yuzawa.niigata.jp",
		reversed: "pj.atagiin.awazuy"
	},
	{
		suffix: "z.bg",
		reversed: "gb.z"
	},
	{
		suffix: "z.se",
		reversed: "es.z"
	},
	{
		suffix: "za.bz",
		reversed: "zb.az"
	},
	{
		suffix: "za.com",
		reversed: "moc.az"
	},
	{
		suffix: "za.net",
		reversed: "ten.az"
	},
	{
		suffix: "za.org",
		reversed: "gro.az"
	},
	{
		suffix: "zachpomor.pl",
		reversed: "lp.romophcaz"
	},
	{
		suffix: "zagan.pl",
		reversed: "lp.nagaz"
	},
	{
		suffix: "zakopane.pl",
		reversed: "lp.enapokaz"
	},
	{
		suffix: "zama.kanagawa.jp",
		reversed: "pj.awaganak.amaz"
	},
	{
		suffix: "zamami.okinawa.jp",
		reversed: "pj.awaniko.imamaz"
	},
	{
		suffix: "zao.miyagi.jp",
		reversed: "pj.igayim.oaz"
	},
	{
		suffix: "zaporizhzhe.ua",
		reversed: "au.ehzhziropaz"
	},
	{
		suffix: "zaporizhzhia.ua",
		reversed: "au.aihzhziropaz"
	},
	{
		suffix: "zappos",
		reversed: "soppaz"
	},
	{
		suffix: "zapto.org",
		reversed: "gro.otpaz"
	},
	{
		suffix: "zapto.xyz",
		reversed: "zyx.otpaz"
	},
	{
		suffix: "zara",
		reversed: "araz"
	},
	{
		suffix: "zarow.pl",
		reversed: "lp.woraz"
	},
	{
		suffix: "zentsuji.kagawa.jp",
		reversed: "pj.awagak.ijustnez"
	},
	{
		suffix: "zero",
		reversed: "orez"
	},
	{
		suffix: "zgora.pl",
		reversed: "lp.arogz"
	},
	{
		suffix: "zgorzelec.pl",
		reversed: "lp.celezrogz"
	},
	{
		suffix: "zhitomir.ua",
		reversed: "au.rimotihz"
	},
	{
		suffix: "zhytomyr.ua",
		reversed: "au.rymotyhz"
	},
	{
		suffix: "zip",
		reversed: "piz"
	},
	{
		suffix: "zj.cn",
		reversed: "nc.jz"
	},
	{
		suffix: "zlg.br",
		reversed: "rb.glz"
	},
	{
		suffix: "zm",
		reversed: "mz"
	},
	{
		suffix: "zombie.jp",
		reversed: "pj.eibmoz"
	},
	{
		suffix: "zone",
		reversed: "enoz"
	},
	{
		suffix: "zoological.museum",
		reversed: "muesum.lacigolooz"
	},
	{
		suffix: "zoology.museum",
		reversed: "muesum.ygolooz"
	},
	{
		suffix: "zp.gov.pl",
		reversed: "lp.vog.pz"
	},
	{
		suffix: "zp.ua",
		reversed: "au.pz"
	},
	{
		suffix: "zt.ua",
		reversed: "au.tz"
	},
	{
		suffix: "zuerich",
		reversed: "hcireuz"
	},
	{
		suffix: "zushi.kanagawa.jp",
		reversed: "pj.awaganak.ihsuz"
	},
	{
		suffix: "zw",
		reversed: "wz"
	},
	{
		suffix: "ákŋoluokta.no",
		reversed: "on.h75ay7-atkoulok--nx"
	},
	{
		suffix: "álaheadju.no",
		reversed: "on.ay7-ujdaehal--nx"
	},
	{
		suffix: "áltá.no",
		reversed: "on.cail-tl--nx"
	},
	{
		suffix: "åfjord.no",
		reversed: "on.arl-drojf--nx"
	},
	{
		suffix: "åkrehamn.no",
		reversed: "on.axd-nmaherk--nx"
	},
	{
		suffix: "ål.no",
		reversed: "on.af1-l--nx"
	},
	{
		suffix: "ålesund.no",
		reversed: "on.auh-dnusel--nx"
	},
	{
		suffix: "ålgård.no",
		reversed: "on.caop-drgl--nx"
	},
	{
		suffix: "åmli.no",
		reversed: "on.alt-ilm--nx"
	},
	{
		suffix: "åmot.no",
		reversed: "on.alt-tom--nx"
	},
	{
		suffix: "årdal.no",
		reversed: "on.aop-ladr--nx"
	},
	{
		suffix: "ås.no",
		reversed: "on.af1-s--nx"
	},
	{
		suffix: "åseral.no",
		reversed: "on.arl-lares--nx"
	},
	{
		suffix: "åsnes.no",
		reversed: "on.aop-sens--nx"
	},
	{
		suffix: "øksnes.no",
		reversed: "on.auu-sensk--nx"
	},
	{
		suffix: "ørland.no",
		reversed: "on.auu-dnalr--nx"
	},
	{
		suffix: "ørskog.no",
		reversed: "on.auu-goksr--nx"
	},
	{
		suffix: "ørsta.no",
		reversed: "on.arf-atsr--nx"
	},
	{
		suffix: "østre-toten.no",
		reversed: "on.bcz-netot-erts--nx"
	},
	{
		suffix: "øvre-eiker.no",
		reversed: "on.a8k-rekie-erv--nx"
	},
	{
		suffix: "øyer.no",
		reversed: "on.anz-rey--nx"
	},
	{
		suffix: "øygarden.no",
		reversed: "on.a1p-nedragy--nx"
	},
	{
		suffix: "øystre-slidre.no",
		reversed: "on.bju-erdils-ertsy--nx"
	},
	{
		suffix: "čáhcesuolo.no",
		reversed: "on.b53ay7-olousech--nx"
	},
	{
		suffix: "ελ",
		reversed: "maxq--nx"
	},
	{
		suffix: "ευ",
		reversed: "a6axq--nx"
	},
	{
		suffix: "ак.срб",
		reversed: "ca3a09--nx.ua08--nx"
	},
	{
		suffix: "бг",
		reversed: "ea09--nx"
	},
	{
		suffix: "бел",
		reversed: "sia09--nx"
	},
	{
		suffix: "биз.рус",
		reversed: "fca1p--nx.cma09--nx"
	},
	{
		suffix: "дети",
		reversed: "b3jca1d--nx"
	},
	{
		suffix: "ею",
		reversed: "c4a1e--nx"
	},
	{
		suffix: "иком.museum",
		reversed: "muesum.hgea1h--nx"
	},
	{
		suffix: "католик",
		reversed: "a1rdceqa08--nx"
	},
	{
		suffix: "ком",
		reversed: "fea1j--nx"
	},
	{
		suffix: "ком.рус",
		reversed: "fca1p--nx.fea1j--nx"
	},
	{
		suffix: "крым.рус",
		reversed: "fca1p--nx.b8lea1j--nx"
	},
	{
		suffix: "мир.рус",
		reversed: "fca1p--nx.nha1h--nx"
	},
	{
		suffix: "мкд",
		reversed: "fla1d--nx"
	},
	{
		suffix: "мон",
		reversed: "cca1l--nx"
	},
	{
		suffix: "москва",
		reversed: "skhxda08--nx"
	},
	{
		suffix: "мск.рус",
		reversed: "fca1p--nx.pda1j--nx"
	},
	{
		suffix: "обр.срб",
		reversed: "ca3a09--nx.hza09--nx"
	},
	{
		suffix: "од.срб",
		reversed: "ca3a09--nx.ta1d--nx"
	},
	{
		suffix: "онлайн",
		reversed: "bdhesa08--nx"
	},
	{
		suffix: "орг",
		reversed: "gva1c--nx"
	},
	{
		suffix: "орг.рус",
		reversed: "fca1p--nx.gva1c--nx"
	},
	{
		suffix: "орг.срб",
		reversed: "ca3a09--nx.gva1c--nx"
	},
	{
		suffix: "пр.срб",
		reversed: "ca3a09--nx.ca1o--nx"
	},
	{
		suffix: "рус",
		reversed: "fca1p--nx"
	},
	{
		suffix: "рф",
		reversed: "ia1p--nx"
	},
	{
		suffix: "сайт",
		reversed: "gwsa08--nx"
	},
	{
		suffix: "самара.рус",
		reversed: "fca1p--nx.cavc0aaa08--nx"
	},
	{
		suffix: "сочи.рус",
		reversed: "fca1p--nx.zila1h--nx"
	},
	{
		suffix: "спб.рус",
		reversed: "fca1p--nx.fa1a09--nx"
	},
	{
		suffix: "срб",
		reversed: "ca3a09--nx"
	},
	{
		suffix: "укр",
		reversed: "hma1j--nx"
	},
	{
		suffix: "упр.срб",
		reversed: "ca3a09--nx.hca1o--nx"
	},
	{
		suffix: "я.рус",
		reversed: "fca1p--nx.a14--nx"
	},
	{
		suffix: "қаз",
		reversed: "a12oa08--nx"
	},
	{
		suffix: "հայ",
		reversed: "qa3a9y--nx"
	},
	{
		suffix: "אקדמיה.ישראל",
		reversed: "ec0krbd4--nx.c6ytdgbd4--nx"
	},
	{
		suffix: "ירושלים.museum",
		reversed: "muesum.id6glbhbd9--nx"
	},
	{
		suffix: "ישוב.ישראל",
		reversed: "ec0krbd4--nx.d8lhbd5--nx"
	},
	{
		suffix: "ישראל",
		reversed: "ec0krbd4--nx"
	},
	{
		suffix: "ממשל.ישראל",
		reversed: "ec0krbd4--nx.b8adbeh--nx"
	},
	{
		suffix: "צהל.ישראל",
		reversed: "ec0krbd4--nx.a2qbd8--nx"
	},
	{
		suffix: "קום",
		reversed: "a2qbd9--nx"
	},
	{
		suffix: "ابوظبي",
		reversed: "odzd7acbgm--nx"
	},
	{
		suffix: "اتصالات",
		reversed: "fvd7ckaabgm--nx"
	},
	{
		suffix: "ارامكو",
		reversed: "tje3a3abgm--nx"
	},
	{
		suffix: "الاردن",
		reversed: "apg7hyabgm--nx"
	},
	{
		suffix: "البحرين",
		reversed: "a1apg6qpcbgm--nx"
	},
	{
		suffix: "الجزائر",
		reversed: "j8da1tabbgl--nx"
	},
	{
		suffix: "السعودية",
		reversed: "ra4d5a4prebgm--nx"
	},
	{
		suffix: "السعوديه",
		reversed: "rfavc7ylqbgm--nx"
	},
	{
		suffix: "السعودیة",
		reversed: "g78a4d5a4prebgm--nx"
	},
	{
		suffix: "السعودیۃ",
		reversed: "cbf76a0c7ylqbgm--nx"
	},
	{
		suffix: "العليان",
		reversed: "a0nbb0c7abgm--nx"
	},
	{
		suffix: "المغرب",
		reversed: "gcza9a0cbgm--nx"
	},
	{
		suffix: "اليمن",
		reversed: "sedd2bgm--nx"
	},
	{
		suffix: "امارات",
		reversed: "h8a7maabgm--nx"
	},
	{
		suffix: "ايران",
		reversed: "arf4a3abgm--nx"
	},
	{
		suffix: "ايران.ir",
		reversed: "ri.arf4a3abgm--nx"
	},
	{
		suffix: "ایران",
		reversed: "a61f4a3abgm--nx"
	},
	{
		suffix: "ایران.ir",
		reversed: "ri.a61f4a3abgm--nx"
	},
	{
		suffix: "بارت",
		reversed: "a1hbbgm--nx"
	},
	{
		suffix: "بازار",
		reversed: "db2babgm--nx"
	},
	{
		suffix: "بيتك",
		reversed: "a0e9ebgn--nx"
	},
	{
		suffix: "بھارت",
		reversed: "e17a1hbbgm--nx"
	},
	{
		suffix: "تونس",
		reversed: "hd0sbgp--nx"
	},
	{
		suffix: "سودان",
		reversed: "hf2lpbgm--nx"
	},
	{
		suffix: "سوريا",
		reversed: "lf8ftbgm--nx"
	},
	{
		suffix: "سورية",
		reversed: "lf8fpbgo--nx"
	},
	{
		suffix: "شبكة",
		reversed: "dza5cbgn--nx"
	},
	{
		suffix: "عراق",
		reversed: "b2xtbgm--nx"
	},
	{
		suffix: "عرب",
		reversed: "xrbgn--nx"
	},
	{
		suffix: "عمان",
		reversed: "fbwa9bgm--nx"
	},
	{
		suffix: "فلسطين",
		reversed: "xmma2ibgy--nx"
	},
	{
		suffix: "قطر",
		reversed: "a6lbgw--nx"
	},
	{
		suffix: "كاثوليك",
		reversed: "pxece4ibgm--nx"
	},
	{
		suffix: "كوم",
		reversed: "iebhf--nx"
	},
	{
		suffix: "مصر",
		reversed: "c1hbgw--nx"
	},
	{
		suffix: "مليسيا",
		reversed: "ba0dc4xbgm--nx"
	},
	{
		suffix: "موريتانيا",
		reversed: "drkjh3a1habgm--nx"
	},
	{
		suffix: "موقع",
		reversed: "mirbg4--nx"
	},
	{
		suffix: "همراه",
		reversed: "dhd3tbgm--nx"
	},
	{
		suffix: "پاكستان",
		reversed: "b00ave5a9iabgm--nx"
	},
	{
		suffix: "پاکستان",
		reversed: "j6pqgza9iabgm--nx"
	},
	{
		suffix: "ڀارت",
		reversed: "a28ugbgm--nx"
	},
	{
		suffix: "कॉम",
		reversed: "d3c4b11--nx"
	},
	{
		suffix: "नेट",
		reversed: "g7rb2c--nx"
	},
	{
		suffix: "भारत",
		reversed: "c9jrb2h--nx"
	},
	{
		suffix: "भारतम्",
		reversed: "eve3gerb2h--nx"
	},
	{
		suffix: "भारोत",
		reversed: "c8c9jrb2h--nx"
	},
	{
		suffix: "संगठन",
		reversed: "e2a6a1b6b1i--nx"
	},
	{
		suffix: "বাংলা",
		reversed: "cc0atf7b45--nx"
	},
	{
		suffix: "ভারত",
		reversed: "c9jrb54--nx"
	},
	{
		suffix: "ভাৰত",
		reversed: "lyc5rb54--nx"
	},
	{
		suffix: "ਭਾਰਤ",
		reversed: "c9jrb9s--nx"
	},
	{
		suffix: "ભારત",
		reversed: "c9jrceg--nx"
	},
	{
		suffix: "ଭାରତ",
		reversed: "c9jrch3--nx"
	},
	{
		suffix: "இந்தியா",
		reversed: "h0ee5a3ld2ckx--nx"
	},
	{
		suffix: "இலங்கை",
		reversed: "a2eyh3la2ckx--nx"
	},
	{
		suffix: "சிங்கப்பூர்",
		reversed: "dcg9a2g2b0ae0chclc--nx"
	},
	{
		suffix: "భారత్",
		reversed: "d3c9jrcpf--nx"
	},
	{
		suffix: "ಭಾರತ",
		reversed: "c9jrcs2--nx"
	},
	{
		suffix: "ഭാരതം",
		reversed: "e3ma0e1cvr--nx"
	},
	{
		suffix: "ලංකා",
		reversed: "c2e9c2czf--nx"
	},
	{
		suffix: "คอม",
		reversed: "a9d2c24--nx"
	},
	{
		suffix: "ทหาร.ไทย",
		reversed: "h4wc3o--nx.a2xyc3o--nx"
	},
	{
		suffix: "ธุรกิจ.ไทย",
		reversed: "h4wc3o--nx.ave4b3c0oc21--nx"
	},
	{
		suffix: "รัฐบาล.ไทย",
		reversed: "h4wc3o--nx.id1kzuc3h--nx"
	},
	{
		suffix: "ศึกษา.ไทย",
		reversed: "h4wc3o--nx.rb0ef1c21--nx"
	},
	{
		suffix: "องค์กร.ไทย",
		reversed: "h4wc3o--nx.l8bxi8ifc21--nx"
	},
	{
		suffix: "เน็ต.ไทย",
		reversed: "h4wc3o--nx.a3j0hc3m--nx"
	},
	{
		suffix: "ไทย",
		reversed: "h4wc3o--nx"
	},
	{
		suffix: "ລາວ",
		reversed: "a6ec7q--nx"
	},
	{
		suffix: "გე",
		reversed: "edon--nx"
	},
	{
		suffix: "みんな",
		reversed: "c4byj9q--nx"
	},
	{
		suffix: "アマゾン",
		reversed: "dtexcwkcc--nx"
	},
	{
		suffix: "クラウド",
		reversed: "f0f3rkcg--nx"
	},
	{
		suffix: "グーグル",
		reversed: "cmp1akcq--nx"
	},
	{
		suffix: "コム",
		reversed: "ewkct--nx"
	},
	{
		suffix: "ストア",
		reversed: "b3b2kcc--nx"
	},
	{
		suffix: "セール",
		reversed: "b1e2kc1--nx"
	},
	{
		suffix: "ファッション",
		reversed: "c4erd5a9b1kcb--nx"
	},
	{
		suffix: "ポイント",
		reversed: "d9ctdvkce--nx"
	},
	{
		suffix: "三重.jp",
		reversed: "pj.n65zqhe--nx"
	},
	{
		suffix: "世界",
		reversed: "g69vqhr--nx"
	},
	{
		suffix: "个人.hk",
		reversed: "kh.npqic--nx"
	},
	{
		suffix: "中信",
		reversed: "b46qif--nx"
	},
	{
		suffix: "中国",
		reversed: "s8sqif--nx"
	},
	{
		suffix: "中國",
		reversed: "s9zqif--nx"
	},
	{
		suffix: "中文网",
		reversed: "sh5c822qif--nx"
	},
	{
		suffix: "亚马逊",
		reversed: "gr2n084qlj--nx"
	},
	{
		suffix: "京都.jp",
		reversed: "pj.n30sql1--nx"
	},
	{
		suffix: "企业",
		reversed: "vuqhv--nx"
	},
	{
		suffix: "佐賀.jp",
		reversed: "pj.m11tqqq--nx"
	},
	{
		suffix: "佛山",
		reversed: "a32wqq1--nx"
	},
	{
		suffix: "信息",
		reversed: "b168quv--nx"
	},
	{
		suffix: "個人.hk",
		reversed: "kh.a5wqmg--nx"
	},
	{
		suffix: "個人.香港",
		reversed: "g391w6j--nx.a5wqmg--nx"
	},
	{
		suffix: "健康",
		reversed: "a62yqyn--nx"
	},
	{
		suffix: "八卦",
		reversed: "c11q54--nx"
	},
	{
		suffix: "公司",
		reversed: "d5xq55--nx"
	},
	{
		suffix: "公司.cn",
		reversed: "nc.d5xq55--nx"
	},
	{
		suffix: "公司.hk",
		reversed: "kh.d5xq55--nx"
	},
	{
		suffix: "公司.香港",
		reversed: "g391w6j--nx.d5xq55--nx"
	},
	{
		suffix: "公益",
		reversed: "g24wq55--nx"
	},
	{
		suffix: "兵庫.jp",
		reversed: "pj.a35xq6f--nx"
	},
	{
		suffix: "北海道.jp",
		reversed: "pj.yu6d27srjd--nx"
	},
	{
		suffix: "千葉.jp",
		reversed: "pj.i54urkm--nx"
	},
	{
		suffix: "台湾",
		reversed: "d31wrpk--nx"
	},
	{
		suffix: "台灣",
		reversed: "d75yrpk--nx"
	},
	{
		suffix: "和歌山.jp",
		reversed: "pj.nn7p7qrt0--nx"
	},
	{
		suffix: "商城",
		reversed: "d2urzc--nx"
	},
	{
		suffix: "商店",
		reversed: "t0srzc--nx"
	},
	{
		suffix: "商标",
		reversed: "b496rzc--nx"
	},
	{
		suffix: "商業.tw",
		reversed: "wt.b82wrzc--nx"
	},
	{
		suffix: "嘉里",
		reversed: "l04sr4w--nx"
	},
	{
		suffix: "嘉里大酒店",
		reversed: "arnd5uhf8le58r4w--nx"
	},
	{
		suffix: "在线",
		reversed: "g344sd3--nx"
	},
	{
		suffix: "埼玉.jp",
		reversed: "pj.d540sj5--nx"
	},
	{
		suffix: "大分.jp",
		reversed: "pj.o7qrbk--nx"
	},
	{
		suffix: "大拿",
		reversed: "u2yssp--nx"
	},
	{
		suffix: "大阪.jp",
		reversed: "pj.l33ussp--nx"
	},
	{
		suffix: "天主教",
		reversed: "jyqx94qit--nx"
	},
	{
		suffix: "奈良.jp",
		reversed: "pj.g71qstn--nx"
	},
	{
		suffix: "娱乐",
		reversed: "a027qjf--nx"
	},
	{
		suffix: "宮城.jp",
		reversed: "pj.g3zsiu--nx"
	},
	{
		suffix: "宮崎.jp",
		reversed: "pj.a5wtb6--nx"
	},
	{
		suffix: "家電",
		reversed: "k924tcf--nx"
	},
	{
		suffix: "富山.jp",
		reversed: "pj.owtc1--nx"
	},
	{
		suffix: "山口.jp",
		reversed: "pj.r2xro6--nx"
	},
	{
		suffix: "山形.jp",
		reversed: "pj.e16thr--nx"
	},
	{
		suffix: "山梨.jp",
		reversed: "pj.z72thr--nx"
	},
	{
		suffix: "岐阜.jp",
		reversed: "pj.k522tin--nx"
	},
	{
		suffix: "岡山.jp",
		reversed: "pj.d3thr--nx"
	},
	{
		suffix: "岩手.jp",
		reversed: "pj.k4ytjd--nx"
	},
	{
		suffix: "島根.jp",
		reversed: "pj.x5ytlk--nx"
	},
	{
		suffix: "广东",
		reversed: "b125qhx--nx"
	},
	{
		suffix: "広島.jp",
		reversed: "pj.a9xtlk--nx"
	},
	{
		suffix: "微博",
		reversed: "a00trk9--nx"
	},
	{
		suffix: "徳島.jp",
		reversed: "pj.d7ptlk--nx"
	},
	{
		suffix: "愛媛.jp",
		reversed: "pj.m41s3c--nx"
	},
	{
		suffix: "愛知.jp",
		reversed: "pj.c204ugv--nx"
	},
	{
		suffix: "慈善",
		reversed: "y7rr03--nx"
	},
	{
		suffix: "我爱你",
		reversed: "lx3b689qq6--nx"
	},
	{
		suffix: "手机",
		reversed: "i3tupk--nx"
	},
	{
		suffix: "招聘",
		reversed: "d697uto--nx"
	},
	{
		suffix: "政务",
		reversed: "b461rfz--nx"
	},
	{
		suffix: "政府",
		reversed: "m1qtxm--nx"
	},
	{
		suffix: "政府.hk",
		reversed: "kh.m1qtxm--nx"
	},
	{
		suffix: "政府.香港",
		reversed: "g391w6j--nx.m1qtxm--nx"
	},
	{
		suffix: "敎育.hk",
		reversed: "kh.d23rvcl--nx"
	},
	{
		suffix: "教育.hk",
		reversed: "kh.d22svcw--nx"
	},
	{
		suffix: "教育.香港",
		reversed: "g391w6j--nx.d22svcw--nx"
	},
	{
		suffix: "新加坡",
		reversed: "o76i4orfy--nx"
	},
	{
		suffix: "新潟.jp",
		reversed: "pj.s9nvfe--nx"
	},
	{
		suffix: "新闻",
		reversed: "h88yvfe--nx"
	},
	{
		suffix: "时尚",
		reversed: "u25te9--nx"
	},
	{
		suffix: "書籍",
		reversed: "b88uvor--nx"
	},
	{
		suffix: "机构",
		reversed: "f7vqn--nx"
	},
	{
		suffix: "東京.jp",
		reversed: "pj.d17sql1--nx"
	},
	{
		suffix: "栃木.jp",
		reversed: "pj.sxvp4--nx"
	},
	{
		suffix: "沖縄.jp",
		reversed: "pj.a85uwuu--nx"
	},
	{
		suffix: "淡马锡",
		reversed: "dref506w4b--nx"
	},
	{
		suffix: "游戏",
		reversed: "y4punu--nx"
	},
	{
		suffix: "滋賀.jp",
		reversed: "pj.d520xbz--nx"
	},
	{
		suffix: "澳門",
		reversed: "f198xim--nx"
	},
	{
		suffix: "澳门",
		reversed: "f280xim--nx"
	},
	{
		suffix: "点看",
		reversed: "k8uxp3--nx"
	},
	{
		suffix: "熊本.jp",
		reversed: "pj.u4rvp8--nx"
	},
	{
		suffix: "石川.jp",
		reversed: "pj.c94ptr5--nx"
	},
	{
		suffix: "神奈川.jp",
		reversed: "pj.a3xqi0ostn--nx"
	},
	{
		suffix: "福井.jp",
		reversed: "pj.h61qqle--nx"
	},
	{
		suffix: "福岡.jp",
		reversed: "pj.d861ti4--nx"
	},
	{
		suffix: "福島.jp",
		reversed: "pj.d787tlk--nx"
	},
	{
		suffix: "秋田.jp",
		reversed: "pj.h13ynr--nx"
	},
	{
		suffix: "移动",
		reversed: "g28zrf6--nx"
	},
	{
		suffix: "箇人.hk",
		reversed: "kh.i050qmg--nx"
	},
	{
		suffix: "組織.hk",
		reversed: "kh.vta0cu--nx"
	},
	{
		suffix: "組織.tw",
		reversed: "wt.vta0cu--nx"
	},
	{
		suffix: "組織.香港",
		reversed: "g391w6j--nx.vta0cu--nx"
	},
	{
		suffix: "組织.hk",
		reversed: "kh.a4ya0cu--nx"
	},
	{
		suffix: "網絡.cn",
		reversed: "nc.gla0do--nx"
	},
	{
		suffix: "網絡.hk",
		reversed: "kh.gla0do--nx"
	},
	{
		suffix: "網絡.香港",
		reversed: "g391w6j--nx.gla0do--nx"
	},
	{
		suffix: "網络.hk",
		reversed: "kh.xva0fz--nx"
	},
	{
		suffix: "網路.tw",
		reversed: "wt.a46oa0fz--nx"
	},
	{
		suffix: "组織.hk",
		reversed: "kh.ixa0km--nx"
	},
	{
		suffix: "组织.hk",
		reversed: "kh.ga0nt--nx"
	},
	{
		suffix: "组织机构",
		reversed: "ame00sf7vqn--nx"
	},
	{
		suffix: "网址",
		reversed: "g455ses--nx"
	},
	{
		suffix: "网店",
		reversed: "e418txh--nx"
	},
	{
		suffix: "网站",
		reversed: "g5mzt5--nx"
	},
	{
		suffix: "网絡.hk",
		reversed: "kh.b3qa0do--nx"
	},
	{
		suffix: "网络",
		reversed: "i7a0oi--nx"
	},
	{
		suffix: "网络.cn",
		reversed: "nc.i7a0oi--nx"
	},
	{
		suffix: "网络.hk",
		reversed: "kh.i7a0oi--nx"
	},
	{
		suffix: "群馬.jp",
		reversed: "pj.c462a0t7--nx"
	},
	{
		suffix: "联通",
		reversed: "a360a0y8--nx"
	},
	{
		suffix: "臺灣",
		reversed: "a883xnn--nx"
	},
	{
		suffix: "茨城.jp",
		reversed: "pj.h22tsiu--nx"
	},
	{
		suffix: "诺基亚",
		reversed: "b7w9u16qlj--nx"
	},
	{
		suffix: "谷歌",
		reversed: "e153wlf--nx"
	},
	{
		suffix: "购物",
		reversed: "c84xx2g--nx"
	},
	{
		suffix: "通販",
		reversed: "e1ta3kg--nx"
	},
	{
		suffix: "長崎.jp",
		reversed: "pj.k26rtl8--nx"
	},
	{
		suffix: "長野.jp",
		reversed: "pj.e51a4m2--nx"
	},
	{
		suffix: "集团",
		reversed: "m00tsb3--nx"
	},
	{
		suffix: "電訊盈科",
		reversed: "mgvu96d8syzf--nx"
	},
	{
		suffix: "青森.jp",
		reversed: "pj.h03pv23--nx"
	},
	{
		suffix: "静岡.jp",
		reversed: "pj.k797ti4--nx"
	},
	{
		suffix: "飞利浦",
		reversed: "a4x1d77xrck--nx"
	},
	{
		suffix: "食品",
		reversed: "m981rvj--nx"
	},
	{
		suffix: "餐厅",
		reversed: "n315rmi--nx"
	},
	{
		suffix: "香川.jp",
		reversed: "pj.k43qtr5--nx"
	},
	{
		suffix: "香格里拉",
		reversed: "gsgb639j43us5--nx"
	},
	{
		suffix: "香港",
		reversed: "g391w6j--nx"
	},
	{
		suffix: "高知.jp",
		reversed: "pj.e59ny7k--nx"
	},
	{
		suffix: "鳥取.jp",
		reversed: "pj.o131rot--nx"
	},
	{
		suffix: "鹿児島.jp",
		reversed: "pj.c678z7vq5d--nx"
	},
	{
		suffix: "닷넷",
		reversed: "a65b06t--nx"
	},
	{
		suffix: "닷컴",
		reversed: "c44ub1km--nx"
	},
	{
		suffix: "삼성",
		reversed: "ikb4gc--nx"
	},
	{
		suffix: "한국",
		reversed: "e707b0e3--nx"
	}
];

/** Highest positive signed 32-bit float value */
const maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

/** Bootstring parameters */
const base = 36;
const tMin = 1;
const tMax = 26;
const skew = 38;
const damp = 700;
const initialBias = 72;
const initialN = 128; // 0x80
const delimiter = '-'; // '\x2D'
const regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

/** Error messages */
const errors = {
	'overflow': 'Overflow: input needs wider integers to process',
	'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
	'invalid-input': 'Invalid input'
};

/** Convenience shortcuts */
const baseMinusTMin = base - tMin;
const floor = Math.floor;
const stringFromCharCode = String.fromCharCode;

/*--------------------------------------------------------------------------*/

/**
 * A generic error utility function.
 * @private
 * @param {String} type The error type.
 * @returns {Error} Throws a `RangeError` with the applicable error message.
 */
function error(type) {
	throw new RangeError(errors[type]);
}

/**
 * A generic `Array#map` utility function.
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} callback The function that gets called for every array
 * item.
 * @returns {Array} A new array of values returned by the callback function.
 */
function map(array, fn) {
	const result = [];
	let length = array.length;
	while (length--) {
		result[length] = fn(array[length]);
	}
	return result;
}

/**
 * A simple `Array#map`-like wrapper to work with domain name strings or email
 * addresses.
 * @private
 * @param {String} domain The domain name or email address.
 * @param {Function} callback The function that gets called for every
 * character.
 * @returns {Array} A new string of characters returned by the callback
 * function.
 */
function mapDomain(string, fn) {
	const parts = string.split('@');
	let result = '';
	if (parts.length > 1) {
		// In email addresses, only the domain name should be punycoded. Leave
		// the local part (i.e. everything up to `@`) intact.
		result = parts[0] + '@';
		string = parts[1];
	}
	// Avoid `split(regex)` for IE8 compatibility. See #17.
	string = string.replace(regexSeparators, '\x2E');
	const labels = string.split('.');
	const encoded = map(labels, fn).join('.');
	return result + encoded;
}

/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 * @see `punycode.ucs2.encode`
 * @see <https://mathiasbynens.be/notes/javascript-encoding>
 * @memberOf punycode.ucs2
 * @name decode
 * @param {String} string The Unicode input string (UCS-2).
 * @returns {Array} The new array of code points.
 */
function ucs2decode(string) {
	const output = [];
	let counter = 0;
	const length = string.length;
	while (counter < length) {
		const value = string.charCodeAt(counter++);
		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
			// It's a high surrogate, and there is a next character.
			const extra = string.charCodeAt(counter++);
			if ((extra & 0xFC00) == 0xDC00) { // Low surrogate.
				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
			} else {
				// It's an unmatched surrogate; only append this code unit, in case the
				// next code unit is the high surrogate of a surrogate pair.
				output.push(value);
				counter--;
			}
		} else {
			output.push(value);
		}
	}
	return output;
}

/**
 * Converts a digit/integer into a basic code point.
 * @see `basicToDigit()`
 * @private
 * @param {Number} digit The numeric value of a basic code point.
 * @returns {Number} The basic code point whose value (when used for
 * representing integers) is `digit`, which needs to be in the range
 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
 * used; else, the lowercase form is used. The behavior is undefined
 * if `flag` is non-zero and `digit` has no uppercase form.
 */
const digitToBasic = function(digit, flag) {
	//  0..25 map to ASCII a..z or A..Z
	// 26..35 map to ASCII 0..9
	return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
};

/**
 * Bias adaptation function as per section 3.4 of RFC 3492.
 * https://tools.ietf.org/html/rfc3492#section-3.4
 * @private
 */
const adapt = function(delta, numPoints, firstTime) {
	let k = 0;
	delta = firstTime ? floor(delta / damp) : delta >> 1;
	delta += floor(delta / numPoints);
	for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
		delta = floor(delta / baseMinusTMin);
	}
	return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
};

/**
 * Converts a string of Unicode symbols (e.g. a domain name label) to a
 * Punycode string of ASCII-only symbols.
 * @memberOf punycode
 * @param {String} input The string of Unicode symbols.
 * @returns {String} The resulting Punycode string of ASCII-only symbols.
 */
const encode = function(input) {
	const output = [];

	// Convert the input in UCS-2 to an array of Unicode code points.
	input = ucs2decode(input);

	// Cache the length.
	let inputLength = input.length;

	// Initialize the state.
	let n = initialN;
	let delta = 0;
	let bias = initialBias;

	// Handle the basic code points.
	for (const currentValue of input) {
		if (currentValue < 0x80) {
			output.push(stringFromCharCode(currentValue));
		}
	}

	let basicLength = output.length;
	let handledCPCount = basicLength;

	// `handledCPCount` is the number of code points that have been handled;
	// `basicLength` is the number of basic code points.

	// Finish the basic string with a delimiter unless it's empty.
	if (basicLength) {
		output.push(delimiter);
	}

	// Main encoding loop:
	while (handledCPCount < inputLength) {

		// All non-basic code points < n have been handled already. Find the next
		// larger one:
		let m = maxInt;
		for (const currentValue of input) {
			if (currentValue >= n && currentValue < m) {
				m = currentValue;
			}
		}

		// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
		// but guard against overflow.
		const handledCPCountPlusOne = handledCPCount + 1;
		if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
			error('overflow');
		}

		delta += (m - n) * handledCPCountPlusOne;
		n = m;

		for (const currentValue of input) {
			if (currentValue < n && ++delta > maxInt) {
				error('overflow');
			}
			if (currentValue == n) {
				// Represent delta as a generalized variable-length integer.
				let q = delta;
				for (let k = base; /* no condition */; k += base) {
					const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
					if (q < t) {
						break;
					}
					const qMinusT = q - t;
					const baseMinusT = base - t;
					output.push(
						stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
					);
					q = floor(qMinusT / baseMinusT);
				}

				output.push(stringFromCharCode(digitToBasic(q, 0)));
				bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
				delta = 0;
				++handledCPCount;
			}
		}

		++delta;
		++n;

	}
	return output.join('');
};

/**
 * Converts a Unicode string representing a domain name or an email address to
 * Punycode. Only the non-ASCII parts of the domain name will be converted,
 * i.e. it doesn't matter if you call it with a domain that's already in
 * ASCII.
 * @memberOf punycode
 * @param {String} input The domain name or email address to convert, as a
 * Unicode string.
 * @returns {String} The Punycode representation of the given domain name or
 * email address.
 */
const toASCII = function(input) {
	return mapDomain(input, function(string) {
		return regexNonASCII.test(string)
			? 'xn--' + encode(string)
			: string;
	});
};

const trie = createTrie();
const cache = new Map();
function createTrie() {
    const root = {
        key: '',
        parent: null,
        children: new Map(),
        suffix: '',
        end: false,
    };
    for (const rule of domainSuffixListReversed) {
        const word = rule.reversed + '.';
        let node = root;
        for (let i = 0; i < word.length; i++) {
            if (!node.children.has(word[i])) {
                node.children.set(word[i], {
                    key: word[i],
                    suffix: '',
                    parent: node,
                    children: new Map(),
                    end: false,
                });
            }
            node = node.children.get(word[i]);
            if (i === word.length - 1 || i === word.length - 2) {
                node.suffix = rule.suffix;
                node.end = true;
            }
        }
    }
    return root;
}
function search(domain) {
    let node = trie;
    for (let i = 0; i < domain.length; i++) {
        if (node.children.has(domain[i])) {
            node = node.children.get(domain[i]);
        }
        else {
            return node.end ? node.suffix : null;
        }
    }
    return node.end ? node.suffix : null;
}
function reverse(str) {
    let newStr = '';
    for (let i = str.length - 1; i >= 0; i--) {
        newStr += str[i];
    }
    return newStr;
}
function findRule(domain) {
    if (cache.has(domain)) {
        return cache.get(domain);
    }
    const punyDomain = toASCII(domain);
    let foundRule = null;
    const domainReversed = reverse(punyDomain);
    const rule = search(domainReversed);
    if (!rule) {
        return null;
    }
    const suffix = rule.replace(/^(\*\.|!)/, '');
    const wildcard = rule.charAt(0) === '*';
    const exception = rule.charAt(0) === '!';
    foundRule = { rule, suffix, wildcard, exception };
    cache.set(domain, foundRule);
    return foundRule;
}
const errorCodes = {
    DOMAIN_TOO_SHORT: 'Domain name too short.',
    DOMAIN_TOO_LONG: 'Domain name too long. It should be no more than 255 chars.',
    LABEL_STARTS_WITH_DASH: 'Domain name label can not start with a dash.',
    LABEL_ENDS_WITH_DASH: 'Domain name label can not end with a dash.',
    LABEL_TOO_LONG: 'Domain name label should be at most 63 chars long.',
    LABEL_TOO_SHORT: 'Domain name label should be at least 1 character long.',
    LABEL_INVALID_CHARS: 'Domain name label can only contain alphanumeric characters or dashes.',
};
// Hostnames are composed of series of labels concatenated with dots, as are all
// domain names. Each label must be between 1 and 63 characters long, and the
// entire hostname (including the delimiting dots) has a maximum of 255 chars.
//
// Allowed chars:
//
// * `a-z`
// * `0-9`
// * `-` but not as a starting or ending character
// * `.` as a separator for the textual portions of a domain name
//
// * http://en.wikipedia.org/wiki/Domain_name
// * http://en.wikipedia.org/wiki/Hostname
//
function validate(input) {
    const ascii = toASCII(input);
    // if (ascii.length < 1) {
    //   return 'DOMAIN_TOO_SHORT'
    // }
    // if (ascii.length > 255) {
    //   return 'DOMAIN_TOO_LONG'
    // }
    const labels = ascii.split('.');
    let label;
    for (let i = 0; i < labels.length; ++i) {
        label = labels[i];
        if (!label.length) {
            return 'LABEL_TOO_SHORT';
        }
        // if (label.length > 63) {
        //   return 'LABEL_TOO_LONG'
        // }
        // if (label.charAt(0) === '-') {
        //   return 'LABEL_STARTS_WITH_DASH'
        // }
        // if (label.charAt(label.length - 1) === '-') {
        //   return 'LABEL_ENDS_WITH_DASH'
        // }
        // if (!/^[a-z0-9\-]+$/.test(label)) {
        //   return 'LABEL_INVALID_CHARS'
        // }
    }
    return null;
}
function parsePunycode(domain, parsed) {
    if (!/xn--/.test(domain)) {
        return parsed;
    }
    if (parsed.domain) {
        parsed.domain = toASCII(parsed.domain);
    }
    if (parsed.subdomain) {
        parsed.subdomain = toASCII(parsed.subdomain);
    }
    return parsed;
}
function parse$1(domain) {
    const domainSanitized = domain.toLowerCase();
    const validationErrorCode = validate(domain);
    if (validationErrorCode) {
        throw new Error(JSON.stringify({
            input: domain,
            error: {
                message: errorCodes[validationErrorCode],
                code: validationErrorCode,
            },
        }));
    }
    const parsed = {
        input: domain,
        tld: null,
        sld: null,
        domain: null,
        subdomain: null,
        listed: false,
    };
    const domainParts = domainSanitized.split('.');
    const rule = findRule(domainSanitized);
    if (!rule) {
        if (domainParts.length < 2) {
            return parsed;
        }
        parsed.tld = domainParts.pop();
        parsed.sld = domainParts.pop();
        parsed.domain = `${parsed.sld}.${parsed.tld}`;
        if (domainParts.length) {
            parsed.subdomain = domainParts.pop();
        }
        return parsePunycode(domain, parsed);
    }
    parsed.listed = true;
    const tldParts = rule.suffix.split('.');
    const privateParts = domainParts.slice(0, domainParts.length - tldParts.length);
    if (rule.exception) {
        privateParts.push(tldParts.shift());
    }
    parsed.tld = tldParts.join('.');
    if (!privateParts.length) {
        return parsePunycode(domainSanitized, parsed);
    }
    if (rule.wildcard) {
        parsed.tld = `${privateParts.pop()}.${parsed.tld}`;
    }
    if (!privateParts.length) {
        return parsePunycode(domainSanitized, parsed);
    }
    parsed.sld = privateParts.pop();
    parsed.domain = `${parsed.sld}.${parsed.tld}`;
    if (privateParts.length) {
        parsed.subdomain = privateParts.join('.');
    }
    return parsePunycode(domainSanitized, parsed);
}
function get(domain) {
    if (!domain) {
        return null;
    }
    return parse$1(domain).domain;
}
function getEffectiveTLDPlusOne(hostname) {
    try {
        return get(hostname) || '';
    }
    catch (e) {
        return '';
    }
}

/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module exports.
 * @public
 */

var parse_1 = parse;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

function parse(str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  var obj = {};
  var opt = options || {};
  var dec = opt.decode || decode;

  var index = 0;
  while (index < str.length) {
    var eqIdx = str.indexOf('=', index);

    // no more cookie pairs
    if (eqIdx === -1) {
      break
    }

    var endIdx = str.indexOf(';', index);

    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      // backtrack on prior semicolon
      index = str.lastIndexOf(';', eqIdx - 1) + 1;
      continue
    }

    var key = str.slice(index, eqIdx).trim();

    // only assign once
    if (undefined === obj[key]) {
      var val = str.slice(eqIdx + 1, endIdx).trim();

      // quoted values
      if (val.charCodeAt(0) === 0x22) {
        val = val.slice(1, -1);
      }

      obj[key] = tryDecode(val, dec);
    }

    index = endIdx + 1;
  }

  return obj;
}

/**
 * URL-decode string value. Optimized to skip native call when no %.
 *
 * @param {string} str
 * @returns {string}
 */

function decode (str) {
  return str.indexOf('%') !== -1
    ? decodeURIComponent(str)
    : str
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}

function createCookieObjectFromHeaderValue(cookieValue) {
    let cookieName = '';
    const cookieObject = cookieValue.split('; ').reduce((prev, flag, index) => {
        const equalSignIndex = flag.indexOf('=');
        if (equalSignIndex === -1) {
            return { ...prev, [flag]: undefined };
        }
        const key = flag.slice(0, equalSignIndex);
        const value = flag.slice(equalSignIndex + 1, flag.length);
        if (index === 0) {
            cookieName = key;
            return { ...prev, value };
        }
        return { ...prev, [key]: value };
    }, { value: '' });
    return [cookieName, cookieObject];
}
function createCookieStringFromObject(name, cookie) {
    const result = [`${name}=${cookie.value}`];
    for (const key in cookie) {
        if (key === name || key === 'value') {
            continue;
        }
        const flagValue = cookie[key];
        const flag = flagValue ? `${key}=${flagValue}` : key;
        result.push(flag);
    }
    return result.join('; ');
}
function filterCookies(headers, filterFunc) {
    const newHeaders = new Headers(headers);
    const cookie = parse_1(headers.get('cookie') || '');
    const filteredCookieList = [];
    for (const cookieName in cookie) {
        if (filterFunc(cookieName)) {
            filteredCookieList.push(`${cookieName}=${cookie[cookieName]}`);
        }
    }
    newHeaders.delete('cookie');
    if (filteredCookieList.length > 0) {
        newHeaders.set('cookie', filteredCookieList.join('; '));
    }
    return newHeaders;
}

function removeTrailingSlashesAndMultiSlashes(str) {
    return str.replace(/\/+$/, '').replace(/(?<=\/)\/+/, '');
}
function createRoute(route) {
    let routeRegExp = route;
    // routeRegExp = addTrailingWildcard(routeRegExp) // Can be uncommented if wildcard (*) is needed
    routeRegExp = removeTrailingSlashesAndMultiSlashes(routeRegExp);
    // routeRegExp = replaceDot(routeRegExp) // Can be uncommented if dot (.) is needed
    return RegExp(`^[\\/\\w]*${routeRegExp}\\/*$`);
}

const DEFAULT_AGENT_VERSION = '3';
const DEFAULT_REGION = 'us';
function getAgentScriptEndpoint(searchParams) {
    const apiKey = searchParams.get('apiKey');
    const apiVersion = searchParams.get('version') || DEFAULT_AGENT_VERSION;
    const base = `https://fpcdn.io/v${apiVersion}/${apiKey}`;
    const loaderVersion = searchParams.get('loaderVersion');
    const lv = loaderVersion ? `/loader_v${loaderVersion}.js` : '';
    return `${base}${lv}`;
}
function getVisitorIdEndpoint(searchParams) {
    const region = searchParams.get('region') || 'us';
    const prefix = region === DEFAULT_REGION ? '' : `${region}.`;
    return `https://${prefix}api.fpjs.io`;
}

function copySearchParams$1(oldURL, newURL) {
    newURL.search = new URLSearchParams(oldURL.search).toString();
}
function createResponseWithMaxAge(oldResponse, maxMaxAge, maxSMaxAge) {
    const response = new Response(oldResponse.body, oldResponse);
    const oldCacheControlHeader = oldResponse.headers.get('cache-control');
    if (!oldCacheControlHeader) {
        return response;
    }
    const cacheControlHeader = getCacheControlHeaderWithMaxAgeIfLower(oldCacheControlHeader, maxMaxAge, maxSMaxAge);
    response.headers.set('cache-control', cacheControlHeader);
    return response;
}
function makeDownloadScriptRequest(request) {
    const oldURL = new URL(request.url);
    const agentScriptEndpoint = getAgentScriptEndpoint(oldURL.searchParams);
    const newURL = new URL(agentScriptEndpoint);
    copySearchParams$1(oldURL, newURL);
    addTrafficMonitoringSearchParamsForProCDN(newURL);
    const headers = new Headers(request.headers);
    headers.delete('Cookie');
    console.log(`Downloading script from cdnEndpoint ${newURL.toString()}...`);
    const newRequest = new Request(newURL.toString(), new Request(request, { headers }));
    const workerCacheTtl = 5 * 60;
    const maxMaxAge = 60 * 60;
    const maxSMaxAge = 60;
    return fetchCacheable(newRequest, workerCacheTtl).then((res) => createResponseWithMaxAge(res, maxMaxAge, maxSMaxAge));
}
async function handleDownloadScript(request) {
    try {
        return await makeDownloadScriptRequest(request);
    }
    catch (e) {
        return createErrorResponseForProCDN(e);
    }
}

function copySearchParams(oldURL, newURL) {
    newURL.search = new URLSearchParams(oldURL.search).toString();
}
function getCookieValueWithDomain(oldCookieValue, domain) {
    const [cookieName, cookieObject] = createCookieObjectFromHeaderValue(oldCookieValue);
    cookieObject.Domain = domain;
    return createCookieStringFromObject(cookieName, cookieObject);
}
function createResponseWithFirstPartyCookies(request, response) {
    const hostname = new URL(request.url).hostname;
    const eTLDPlusOneDomain = getEffectiveTLDPlusOne(hostname);
    const newHeaders = new Headers(response.headers);
    if (eTLDPlusOneDomain) {
        const cookiesArray = newHeaders.getAll('set-cookie');
        newHeaders.delete('set-cookie');
        for (const cookieValue of cookiesArray) {
            const newCookie = getCookieValueWithDomain(cookieValue, eTLDPlusOneDomain);
            newHeaders.append('set-cookie', newCookie);
        }
    }
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}
function makeIngressAPIRequest(request, env) {
    const oldURL = new URL(request.url);
    const endpoint = getVisitorIdEndpoint(oldURL.searchParams);
    const newURL = new URL(endpoint);
    copySearchParams(oldURL, newURL);
    addTrafficMonitoringSearchParamsForVisitorIdRequest(newURL);
    let headers = new Headers(request.headers);
    addProxyIntegrationHeaders(headers, env);
    headers = filterCookies(headers, (key) => key === '_iidt');
    console.log(`sending ingress api to ${newURL}...`);
    const newRequest = new Request(newURL.toString(), new Request(request, { headers }));
    return fetch(newRequest).then((response) => createResponseWithFirstPartyCookies(request, response));
}
async function handleIngressAPI(request, env) {
    try {
        return await makeIngressAPIRequest(request, env);
    }
    catch (e) {
        return createErrorResponseForIngress(request, e);
    }
}

function generateNonce() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const indices = crypto.getRandomValues(new Uint8Array(24));
    for (const index of indices) {
        result += characters[index % characters.length];
    }
    return btoa(result);
}
function buildHeaders(styleNonce) {
    const headers = new Headers();
    headers.append('Content-Type', 'text/html');
    headers.append('Content-Security-Policy', `default-src 'none'; img-src https://fingerprint.com; style-src 'nonce-${styleNonce}'`);
    return headers;
}
function createWorkerVersionElement() {
    return `
  <span>
  Worker version: 1.2.0
  </span>
  `;
}
function createContactInformationElement() {
    return `
  <span>
  Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues
  </span>
  `;
}
function createEnvVarsInformationElement(env) {
    const isScriptDownloadPathAvailable = isScriptDownloadPathSet(env);
    const isGetResultPathAvailable = isGetResultPathSet(env);
    const isProxySecretAvailable = isProxySecretSet(env);
    const isAllVarsAvailable = isScriptDownloadPathAvailable && isGetResultPathAvailable && isProxySecretAvailable;
    let result = '';
    if (!isAllVarsAvailable) {
        result += `
    <span>
    The following environment variables are not defined. Please reach out our support team.
    </span>
    `;
        if (!isScriptDownloadPathAvailable) {
            result += `
      <span>
      ${agentScriptDownloadPathVarName} is not set
      </span>
      `;
        }
        if (!isGetResultPathAvailable) {
            result += `
      <span>
      ${getResultPathVarName} is not set
      </span>
      `;
        }
        if (!isProxySecretAvailable) {
            result += `
      <span>
      ${proxySecretVarName} is not set
      </span>
      `;
        }
    }
    else {
        result += `
    <span>
    All environment variables are set
    </span>
    `;
    }
    return result;
}
function buildBody(env, styleNonce) {
    let body = `
  <html lang='en-US'>
  <head>
    <meta charset='utf-8'/>
    <title>Fingerprint Cloudflare Worker</title>
    <link rel='icon' type='image/x-icon' href='https://fingerprint.com/img/favicon.ico'>
    <style nonce='${styleNonce}'>
      span {
        display: block;
        padding-top: 1em;
        padding-bottom: 1em;
        text-align: center;
      }
    </style>
  </head>
  <body>
  `;
    body += `<span>Your worker is deployed</span>`;
    body += createWorkerVersionElement();
    body += createEnvVarsInformationElement(env);
    body += createContactInformationElement();
    body += `  
  </body>
  </html>
  `;
    return body;
}
function handleStatusPage(request, env) {
    if (request.method !== 'GET') {
        return new Response(null, { status: 405 });
    }
    const styleNonce = generateNonce();
    const headers = buildHeaders(styleNonce);
    const body = buildBody(env, styleNonce);
    return new Response(body, {
        status: 200,
        statusText: 'OK',
        headers,
    });
}

function createRoutes(env) {
    const routes = [];
    const downloadScriptRoute = {
        pathPattern: createRoute(getScriptDownloadPath(env)),
        handler: handleDownloadScript,
    };
    const ingressAPIRoute = {
        pathPattern: createRoute(getGetResultPath(env)),
        handler: handleIngressAPI,
    };
    const statusRoute = {
        pathPattern: createRoute(getStatusPagePath()),
        handler: (request, env) => handleStatusPage(request, env),
    };
    routes.push(downloadScriptRoute);
    routes.push(ingressAPIRoute);
    routes.push(statusRoute);
    return routes;
}
function handleNoMatch(urlPathname) {
    const responseHeaders = new Headers({
        'content-type': 'application/json',
    });
    return new Response(JSON.stringify({ error: `unmatched path ${urlPathname}` }), {
        status: 404,
        headers: responseHeaders,
    });
}
function handleRequestWithRoutes(request, env, routes) {
    const url = new URL(request.url);
    for (const route of routes) {
        if (url.pathname.match(route.pathPattern)) {
            return route.handler(request, env);
        }
    }
    return handleNoMatch(url.pathname);
}
async function handleRequest(request, env) {
    const routes = createRoutes(env);
    return handleRequestWithRoutes(request, env, routes);
}

var index = {
    async fetch(request, env) {
        return handleRequest(request, env).then(returnHttpResponse);
    },
};

export { index as default };
