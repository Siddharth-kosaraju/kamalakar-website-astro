/**
 * CloudFront Function: viewer-request handler
 *
 * 1. Redirect www → non-www (301) for SEO canonicalization.
 * 2. Rewrite directory URIs to index.html so S3 REST API origin
 *    can resolve /about/ → /about/index.html (S3 REST API does
 *    NOT do this automatically, unlike the S3 website endpoint).
 */
function handler(event) {
    var request = event.request;
    var headers = request.headers;
    var host = (headers.host && headers.host.value) ? headers.host.value : '';

    // --- www → non-www redirect ---
    if (host.toLowerCase() === 'www.kamalakarheartcentre.com') {
        var uri = request.uri && request.uri.length > 0 ? request.uri : '/';
        var qsParts = [];
        var qs = request.querystring;
        if (qs && typeof qs === 'object') {
            for (var key in qs) {
                if (qs.hasOwnProperty(key)) {
                    var param = qs[key];
                    if (param.value !== undefined) {
                        qsParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(param.value));
                    } else if (param.multiValue && param.multiValue.length > 0) {
                        param.multiValue.forEach(function (mv) {
                            qsParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(mv.value));
                        });
                    }
                }
            }
        }
        var qsString = qsParts.length > 0 ? '?' + qsParts.join('&') : '';

        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                location: { value: 'https://kamalakarheartcentre.com' + uri + qsString },
                'cache-control': { value: 'max-age=31536000, public, immutable' }
            }
        };
    }

    // --- Directory URI → index.html rewrite ---
    // /about/  → /about/index.html
    // /        → /index.html
    // /foo.xml → unchanged (has extension)
    if (request.uri.endsWith('/')) {
        request.uri += 'index.html';
    } else if (!request.uri.includes('.')) {
        // No trailing slash and no file extension → append /index.html
        // e.g. /about → /about/index.html
        request.uri += '/index.html';
    }

    return request;
}
