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
                filename, item, lines, sourceArray, segments,
                totSloc, totCovered, totBloc, totStat, totStatCovered, totBlocCovered;

            totSloc = totCovered = totBloc = totStat = totStatCovered = totBlocCovered = 0;
            if (!coverInst) {
                throw new Error('Must call instrument before calling report');
            }
            Object.keys(coverInst.coverageData).forEach(function(filename) {
                var fstats, lines, code;

                fstats = coverInst.coverageData[filename].stats();
                lines = fstats.lineDetails;
                code = fstats.code;
                sourceArray = [];
                code.forEach(function(codeLine, index){
                    var count = null, statements = null, numStatements = 0, missedRanges = [];
                    line = lines[index];
                    if (line) {
                        count = line.count;
                        statements = 0;
                        line.statementDetails.forEach(function(statement) {
                            numStatements += 1;
                            if (statement.count) {
                                statements += 1;
                            }
                        });
                    }
                    sourceArray.push({
                        coverage: count,
                        statements: statements === null ? null : (statements / numStatements) * 100,
                        source: codeLine
                    });
                });
                segments = filename.split('/');
                item = {
                    filename: filename,
                    basename: segments.pop(),
                    segments: segments.join('/') + '/',
                    coverage: (fstats.lines / fstats.sloc) * 100,
                    statements: (fstats.statements / fstats.ssoc) * 100,
                    blocks: (fstats.blocks / fstats.sboc) * 100,
                    source: sourceArray,
                    sloc: fstats.sloc
                };
                totStat += fstats.ssoc;
                totBloc += fstats.sboc;
                totSloc += fstats.sloc;
                totCovered += fstats.lines;
                totStatCovered += fstats.statements;
                totBlocCovered += fstats.blocks;
                stats.files.push(item);
            });
            stats.sloc = totSloc;
            stats.ssoc = totStat;
            stats.sboc = totBloc;
            stats.coverage = totCovered / totSloc * 100;
            stats.statements = totStatCovered / totStat * 100;
            stats.blocks = totBlocCovered / totBloc * 100;
            cover.reporters[reporter](stats, options.outFile ? options.outFile : undefined);
            cb();
        });
};

