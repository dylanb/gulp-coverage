/*
 * Copyright (C) 2014 Dylan Barrell, all rights reserved
 *
 * Licensed under the MIT license
 *
 */

var path = require('path');
var fs = require('fs');
var cover = require('./contrib/cover');
var through2 = require('through2');
var coverInst;

module.exports.instrument = function (options) {
    cover.cleanup();
    cover.init();
    coverInst = cover.cover(options.pattern, options.debugDirectory);

    return through2.obj(function (file, encoding, done) {
        this.push(file);
        done();
    },
    function (cb) {
        cb();
    });
};

module.exports.report = function (options) {
    var reporter = options.reporter || 'html';

    return through2.obj(
        function (file, encoding, cb) {
            cb();
        }, function (cb) {
            var stats;

            if (!coverInst) {
                throw new Error('Must call instrument before calling report');
            }
            stats = coverInst.allStats();
            cover.reporters[reporter](stats, options.outFile ? options.outFile : undefined);
            cb();
        });
};

