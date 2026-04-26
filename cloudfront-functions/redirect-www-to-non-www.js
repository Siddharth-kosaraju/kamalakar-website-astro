/**
 * CloudFront Function: viewer-request handler
 *
 * Order of operations (each step short-circuits with a 301 if it fires):
 *
 *   1. www → non-www                      (host canonicalisation)
 *   2. /te[/...] → /                      (retired Telugu pages — see commit 847d537)
 *   3. /?page=…   → /<clean-url>/         (legacy SPA query params)
 *      /?lang=…   → /                     (language selector — Telugu retired)
 *   4. /foo (no trailing slash) → /foo/   (trailing-slash canonicalisation)
 *   5. Directory rewrite for S3 REST origin
 *      (/about/ → /about/index.html, etc.)
 *
 * Steps 1–4 issue 301s. Step 5 is an internal rewrite only — the URL the
 * client sees is preserved, but the origin path is mapped to the underlying
 * index.html so the S3 REST API origin can serve it.
 *
 * Runtime: cloudfront-js-2.0 (ES5.1 + selected ES6 features).
 */
function handler(event) {
    var request = event.request;
    var headers = request.headers;
    var host = (headers.host && headers.host.value) ? headers.host.value : '';
    var uri = request.uri && request.uri.length > 0 ? request.uri : '/';
    var qs = request.querystring;
    var SITE = 'https://kamalakarheartcentre.com';

    function buildQs(qsObj) {
        var parts = [];
        if (qsObj && typeof qsObj === 'object') {
            for (var key in qsObj) {
                if (qsObj.hasOwnProperty(key)) {
                    var p = qsObj[key];
                    if (p.value !== undefined) {
                        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(p.value));
                    } else if (p.multiValue && p.multiValue.length > 0) {
                        p.multiValue.forEach(function (mv) {
                            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(mv.value));
                        });
                    }
                }
            }
        }
        return parts.length > 0 ? '?' + parts.join('&') : '';
    }

    function redirect301(target) {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                location: { value: target },
                'cache-control': { value: 'max-age=31536000, public, immutable' }
            }
        };
    }

    // 1. www → non-www
    if (host.toLowerCase() === 'www.kamalakarheartcentre.com') {
        return redirect301(SITE + uri + buildQs(qs));
    }

    // 2. Retired Telugu pages → homepage
    //    /te, /te/, /te/about, /te/services/foo  →  /
    if (uri === '/te' || uri.indexOf('/te/') === 0) {
        return redirect301(SITE + '/');
    }

    // 3. Legacy SPA query params on the homepage
    //    /?page=education            →  /education/
    //    /?page=education&lang=te    →  /education/
    //    /?lang=te                   →  /
    if (uri === '/' || uri === '/index.html') {
        var pageParam = (qs && qs.page && qs.page.value) ? qs.page.value : '';
        var langParam = (qs && qs.lang && qs.lang.value) ? qs.lang.value : '';

        if (pageParam) {
            // Whitelist of legacy SPA targets to avoid open-redirect surprises.
            var pageMap = {
                education: '/education/',
                about: '/about/',
                services: '/services/',
                contact: '/contact/',
                blog: '/blog/'
            };
            var target = pageMap[pageParam.toLowerCase()];
            return redirect301(SITE + (target || '/'));
        }
        if (langParam) {
            return redirect301(SITE + '/');
        }
    }

    // 4. Trailing-slash canonicalisation for non-asset URIs.
    //    /services/ecg-echo  →  /services/ecg-echo/
    //    Skip URIs that already end in '/' or that look like a file (have an extension).
    if (uri !== '/' && !uri.endsWith('/') && uri.indexOf('.') === -1) {
        return redirect301(SITE + uri + '/' + buildQs(qs));
    }

    // 5. Directory URI → index.html rewrite (S3 REST API origin requirement).
    //    /about/    →  /about/index.html
    //    /          →  /index.html
    //    /foo.xml   →  unchanged
    if (request.uri.endsWith('/')) {
        request.uri += 'index.html';
    } else if (!request.uri.includes('.')) {
        // Defensive — step 4 should have already redirected, but keep the
        // rewrite as a safety net so we never serve a 404 from the origin.
        request.uri += '/index.html';
    }

    return request;
}
