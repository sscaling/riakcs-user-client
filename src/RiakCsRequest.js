/**
 * Created by shauscal on 09/01/2016.
 */

var url = require('url');

function RiakCsRequest() {

    this.__date = new Date().toUTCString(); //.replace('GMT', 'UTC');
    this.__bucket = '';
    this.__method = 'GET';
    this.__path = '';
    this.__headers = {};
    this.__content = undefined;
    this.__contentType = '';
    // acl, lifecycle, location, logging, notification, partNumber, policy, requestPayment, torrent, uploadId, uploads, versionId, versioning, versions, and website
    this.__subResource = [];

    this.bucket = function(bucket) {
        this.__bucket = bucket;
        return this;
    };

    this.withAcl = function() {
        this.__subResource.push('acl');
        return this;
    };

    this.path = function(path) {
        this.__path = path;
        return this;
    };

    this.getDate = function() { return this.__date; };
    this.getBucket = function() { return this.__bucket; };
    this.getMethod = function() { return this.__method; };
    this.getPath = function() { return this.__path; };
    this.getHeaders = function() { return this.__headers; };
    this.getContent = function() { return this.__content; };
    this.getContentType = function() { return this.__contentType; };

    this.getAmzHeaders = function() {
        var headers = {};
        for (var h in this.__headers) {
            if (/^x-ams/i.test(this.__headers(h))) {
                headers[h] = this.__headers[h];
            }
        }
        return headers;
    };

    this.getSubResource = function() {
        if (this.__subResource.length > 0) {
            return '?' + this.__subResource.sort().join('&');
        }
        return '';
    };
}

RiakCsRequest.prototype.buildOptions = function(endpoint, authorization) {
    var parsed = url.parse(endpoint);

    var options = {
        method: this.getMethod(),
        protocol: parsed.protocol,
        host: parsed.hostname,
        headers: this.getHeaders(),
        path: '/' + this.getBucket() + this.getPath() + this.getSubResource(),
        port: parsed.port
    };

    options.headers.Authorization = authorization;
    options.headers.Date = this.getDate();

    var content = this.getContent();
    if (content) {
        options.headers['Content-Length'] = content.length;
        options.headers['Content-Type'] = this.getContentType();
    }
    return options;
};

RiakCsRequest.listBuckets = function() {
    return new RiakCsRequest();
};

RiakCsRequest.getAcl = function() {
    return new RiakCsRequest().withAcl();
};

RiakCsRequest.listObjects = function(bucket) {
    return new RiakCsRequest().bucket(bucket);
};

RiakCsRequest.getBucketAcl = function(bucket) {
    return new RiakCsRequest().bucket(bucket).withAcl();
};

RiakCsRequest.getCurrentUser = function() {
    return new RiakCsRequest().path('riak-cs/user');
};

RiakCsRequest.getAllUsers = function() {
    return new RiakCsRequest().path('riak-cs/users');
};

module.exports = RiakCsRequest;