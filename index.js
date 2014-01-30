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
            this.push({ coverage: stats });
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

module.exports.enforce = function (options) {
    var statements = options.statements || 100,
        blocks = options.blocks || 100,
        lines = options.lines || 100;
    return through2.obj(
        function (data, encoding, cb) {
            if (!data.coverage) {
                this.emit('error', new gutil.PluginError('gulp-coverage',
                    'Must call gather or report before calling enforce'));
                return cb();
            }
            if (data.coverage.statements < statements) {
                this.emit('error', new gutil.PluginError('gulp-coverage',
                    'statement coverage of ' + data.coverage.statements +
                    ' does not meet the threshold of ' + statements));
            }
            if (data.coverage.coverage < lines) {
                this.emit('error', new gutil.PluginError('gulp-coverage',
                    'line coverage of ' + data.coverage.coverage +
                    ' does not meet the threshold of ' + lines));
            }
            if (data.coverage.blocks < blocks) {
                this.emit('error', new gutil.PluginError('gulp-coverage',
                    'block coverage of ' + data.coverage.blocks +
                    ' does not meet the threshold of ' + blocks));
            }
            cb();
        }, function (cb) {
            cb();
        });
};
