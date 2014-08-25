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
    options = options || {};
    cover.cleanup();
    cover.init();
    if (coverInst) {
        coverInst.release();
    }
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
    options = options || {};
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
    options = options || {};
    var statements = options.statements || 100,
        blocks = options.blocks || 100,
        lines = options.lines || 100,
        uncovered = options.uncovered;
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
            if (data.coverage.uncovered && uncovered !== undefined && data.coverage.uncovered.length > uncovered) {
                this.emit('error', new gutil.PluginError('gulp-coverage',
                    'uncovered files of ' + data.coverage.uncovered.length +
                    ' does not meet the threshold of ' + uncovered));
            }
            cb();
        }, function (cb) {
            cb();
        });
};

module.exports.format = function (options) {
    var reporters = options || [{}];
    if (!Array.isArray(reporters)) reporters = [reporters];
    return through2.obj(
        function (data, encoding, cb) {
            var file;
            if (!data.coverage) {
                this.emit('error', new gutil.PluginError('gulp-coverage',
                    'Must call gather before calling enforce'));
                cb();
                return;
            }
            reporters.forEach(function(opts) {
                if (typeof opts === 'string') opts = { reporter: opts };
                var reporter = opts.reporter || 'html';
                var outfile = opts.outFile || 'coverage.' + reporter;
                file = new gutil.File({
                    base: path.join(__dirname, './'),
                    cwd: __dirname,
                    path: path.join(__dirname, './', outfile),
                    contents: new Buffer(cover.reporters[reporter](data.coverage))
                });
                file.coverage = data.coverage;
                this.push(file);
            }, this);
            cb();
        }, function (cb) {
            cb();
        });
};
