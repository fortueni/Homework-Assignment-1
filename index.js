// dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var config = require('./config');
var stringDecoder = require('string_decoder').StringDecoder

// https server certificate locations object
var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
// server logic
var unifiedServer = function(req, res) {
    // extract information from user request
    var parsedUrl = url.parse(req.url, true);
    var method = req.method.toLowerCase();
    var headers = req.headers;
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    var queryStringObject = parsedUrl.query;

    // decode payload from user onto buffer
    var decoder = new stringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function(data) {
        buffer += decoder.end();

        // pack known data
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };

        // check if path is a known route
        var chosenHandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;
        chosenHandler(data, function (statusCode, payload) {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
            var payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log(trimmedPath, statusCode);
        });
    });
};

// route handlers
var handlers = {};
handlers.hello = function (data, callback) {
    callback(200, {'welcome message' : 'hello world'});
};
handlers.notFound = function (data, callback) {
  callback(404);
};
var router = {
    'hello' : handlers.hello
};

// create servers
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});

// start servers
httpServer.listen(config.httpPort, function () {
    console.log('http running on port: ' + config.httpPort);
});
httpsServer.listen(config.httpsPort, function () {
   console.log('https running on port: '+ config.httpsPort)
});

