'use strict'
var AWS = require('aws-sdk');
var bunyan = require('bunyan');
var http = require('http');
var crypto = require('crypto');
var config = require('./config');

var s3list = [];

// Get a random image from s3
var log = bunyan.createLogger({
    name: 'imageServer',
    serializers: {
        req: bunyan.stdSerializers.req,
        res: bunyan.stdSerializers.res
    }
});

var server = http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  	res.setHeader('Access-Control-Request-Method', '*');
  	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  	res.setHeader('Access-Control-Allow-Headers', '*');
    log.info({ req: req }, 'start request');
    if (/\/health$/.test(req.url)) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("OK");
    } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        var item = s3list[Math.floor(Math.random() * s3list.length)];
        var imagePath = "https://s3.amazonaws.com/" + config.s3.bucket + "/" + item.Key;
        res.end(JSON.stringify({
            image_name: item.Key,
            image_path: imagePath,
            image_hash: crypto.createHash('md5').update(imagePath).digest('hex')
        }));
    }
    log.info({ res: res }, 'done response');
});
server.listen(config.server.port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    var s3 = new AWS.S3();
    s3.listObjects({ Bucket: config.s3.bucket }, function (err, data) {
        if (err) {
            log.error(err, err.stack); // an error occurred
            process.exit(1);
        } else {
            s3list = data.Contents;
        }
    });
    console.log(`server is listening on ${config.server.port}`)
})
