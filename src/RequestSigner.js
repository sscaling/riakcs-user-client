/**
 * Created by shauscal on 09/01/2016.
 */

var crypto = require('crypto');

var debug = true;

function RequestSigner(accessKey, secretKey) {
    this.__access = accessKey;
    this.__secret = secretKey;

    /*
     Psuedocode from: http://docs.aws.amazon.com/AmazonS3/latest/dev/RESTAuthentication.html#ConstructingTheAuthenticationHeader

     Authorization = "AWS" + " " + AWSAccessKeyId + ":" + Signature;

     Signature = Base64( HMAC-SHA1( YourSecretAccessKeyID, UTF-8-Encoding-Of( StringToSign ) ) );

     StringToSign = HTTP-Verb + "\n" +
     Content-MD5 + "\n" +
     Content-Type + "\n" +
     Date + "\n" +
     CanonicalizedAmzHeaders +
     CanonicalizedResource;

     CanonicalizedResource = [ "/" + Bucket ] +
     <HTTP-Request-URI, from the protocol name up to the query string> +
     [ subresource, if present. For example "?acl", "?location", "?logging", or "?torrent"];

     CanonicalizedAmzHeaders = <described below>
     */
    this.sign = function(request) {

        var contentMd5 = request.getContent() ? crypto.createHash('md5').update(request.getContent()).digest("hex") : '';

        debug && console.log(contentMd5);

        var canonicalizedResource = '/';
        var bucket = request.getBucket();
        if (bucket.length) {
            canonicalizedResource = '/' + bucket; // for path style requests that don't address a bucket, do nothing
        }

        canonicalizedResource += request.getPath() +  // undecoded path part of the request-URI
                request.getSubResource(); //any subresource here (sorted by name)
                // TODO: + any query-string parameters override the response header values

        var canonicalizedAmzHeaders = [];
        var amzHeaders = request.getAmzHeaders();
        for (var h in amzHeaders) {
            if (amzHeaders.hasOwnProperty(h)) {
                var value = amzHeaders[h].replace(/\s+/g, ' ');
                console.log(value);
                canonicalizedAmzHeaders.push(h.toLowerCase() + ':' + value);
            }
        }

        var cHeaders = canonicalizedAmzHeaders.sort().join('\n')
        if (cHeaders.length) cHeaders += '\n';
        debug && console.log('canonicalized headers : %s', cHeaders);
        debug && console.log('canonicalized resource : %s', canonicalizedResource);
        var toSign = [request.getMethod(), contentMd5, request.getContentType(), request.getDate(), cHeaders + canonicalizedResource].join('\n');


        debug && console.log('toSign:\n' + toSign);

        var signature = crypto.createHmac('sha1', this.__secret).update(toSign).digest('base64');
        return 'AWS ' + this.__access + ':' + signature;
    };
}

module.exports = RequestSigner;