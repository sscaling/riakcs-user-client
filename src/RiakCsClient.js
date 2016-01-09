/**
 * Created by shauscal on 09/01/2016.
 */

var RiakCsRequest = require('./RiakCsRequest.js'),
    RequestSigner = require('./RequestSigner.js'),
    http = require('http'),
    https = require('https'),
    xml2js = require('xml2js');

/**
 * RiakCS client compatible with RiakCS 1.5.4 (uses V2 Signatures)
 */
function RiakCsClient(accessKey, secretKey, endpoint) {
    this.__signer = new RequestSigner(accessKey, secretKey);
    this.__endpoint = endpoint;
}

function makeRequest(request, callback) {
    var signature = this.__signer.sign(request);

    console.log('Sig: %s', signature);

    var options = request.buildOptions(this.__endpoint, signature);

    console.log('%j', options);

    function handleResponse(response) {
        var str = '';

        console.log(response.statusCode);
        for (var h in response.headers) {
            console.log(h + ': ' + response.headers[h]);
        }

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            xml2js.parseString(str, function(err, result) {
                console.log('RESPONSE: %j', result);

                if (!result) {
                    callback(null, str);
                } else {
                    callback(err, result);
                }
            });
        });
    }

    var h = this.__endpoint.match(/^https:\/\//i) ? https : http;
    if (request.getContent()) {
        var req = h.request(options, request.getContent(), handleResponse);
        req.write(request.getContent())
        req.end();
    } else {
        h.request(options, handleResponse).end();
    }
}


RiakCsClient.prototype.listBuckets = function(callback) {
    makeRequest.call(this, RiakCsRequest.listBuckets(), callback);
};

RiakCsClient.prototype.getAcl = function(callback) {
    makeRequest.call(this, RiakCsRequest.getAcl(), callback);
};

RiakCsClient.prototype.listObjects = function(bucket, callback) {
    makeRequest.call(this, RiakCsRequest.listObjects(bucket), callback);
};

RiakCsClient.prototype.getBucketAcl = function(bucket, callback) {
    makeRequest.call(this, RiakCsRequest.getBucketAcl(bucket), callback);
};

RiakCsClient.prototype.getCurrentUser = function(callback) {
    makeRequest.call(this, RiakCsRequest.getCurrentUser(), callback);
}



RiakCsClient.prototype.getAllUsers = function(callback) {
    makeRequest.call(this, RiakCsRequest.getAllUsers(), function(err, response) {
        if (err) return callback(err);

        var users = [];

        function parse(data) {
            var start = data.indexOf('<');

            if (-1 == start) {
                return callback(null, users);
            }

            var end = data.indexOf('\r\n', start);
            //console.log('slice between %d and %d', start, end);
            var chunk = data.substr(start, start + end);
            //console.log('chunk: %s', chunk);

            xml2js.parseString(chunk, function(err, parsed) {
                if (err) return callback(err);

                //console.log('parsed: %j', parsed);
                if (parsed.Users.User) {
                    users = users.concat(parsed.Users.User);
                }

                parse(data.substr(data.indexOf('<', end)));
            });
        }

        parse(response);
    });
};

module.exports = RiakCsClient;