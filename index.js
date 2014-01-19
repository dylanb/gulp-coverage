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
            var stats = { files : []},
                filename, item, fstats, lines, sourceArray, segments,
                totSloc = 0, totCovered = 0;

            if (!coverInst) {
                throw new Error('Must call instrument before calling report');
            }
            Object.keys(coverInst.coverageData).forEach(function(filename) {
                fstats = coverInst.coverageData[filename].stats();
                lines = fstats.source.split('\n');
                sourceArray = [];
                lines.forEach(function (line, index) {
                    var found = false,
                        lineStruct;
                    fstats.lines.forEach(function (missedLine) {
                        if (index + 1 === missedLine.lineno) {
                            found = true;
                        }
                    });
                    if (!found) {
                        totCovered += 1;
                    }
                    lineStruct = {
                        coverage: !found ? 1 : 0,
                        source: lines[index]
                    };
                    sourceArray.push(lineStruct);
                });
                segments = filename.split('/');
                item = {
                    filename: filename,
                    basename: segments.pop(),
                    segments: segments.join('/') + '/',
                    coverage: fstats.percentage * 100,
                    source: sourceArray,
                    sloc: lines.length
                };
                totSloc += lines.length;
                stats.files.push(item);
            });
            stats.sloc = totSloc;
            stats.coverage = totCovered / totSloc * 100;
            cover.reporters[reporter](stats, options.outFile ? options.outFile : undefined);
            cb();
        });
};

