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
var gutil = require('gulp-util');
var coverInst;

module.exports.instrument = function (options) {
    cover.cleanup();
    cover.init();
    coverInst = cover.cover(options.pattern, options.debugDirectory);

    return through2.obj(function (file, encoding, cb) {
        if (!file.path) {
            this.emit('error', new gutil.PluginError('gulp-coverage', 'Streaming not supported'));
            return cb();
        }

        this.push(file);
        cb();
    },
    function (cb) {
        cb();
    });
};

module.exports.report = function (options) {
    var reporter = options.reporter || 'html';

    return through2.obj(
        function (file, encoding, cb) {
            if (!file.path) {
                this.emit('error', new gutil.PluginError('gulp-coverage', 'Streaming not supported'));
                return cb();
            }
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

module.exports.gather = function () {
    return through2.obj(
        function (file, encoding, cb) {
            if (!file.path) {
                this.emit('error', new gutil.PluginError('gulp-coverage', 'Streaming not supported'));
                return cb();
            }
            cb();
        }, function (cb) {
            var stats;

            if (!coverInst) {
                throw new Error('Must call instrument before calling report');
            }
            stats = coverInst.allStats();
            this.push({ coverage: stats });
            cb();
        });
};
