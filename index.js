var path = require('path');
var through = require('through');
var gutil = require('gulp-util');
var fs = require('fs');
var cover = require('./contrib/cover');
var Duplex = require('stream').Duplex;
var coverInst;

module.exports.instrument = function (options) {
    var duplex = new Duplex({objectMode: true});
    cover.cleanup();
    cover.init();
    coverInst = cover.cover(options.filePattern, options.ignoreFiles, options.debugDirectory);

    duplex._write = function (file, encoding, done) {
        console.log('file.path: ', file.path);
        duplex.push(file);
        done();
    };

    duplex._read = function () {};

    return duplex;
};

module.exports.report = function (options) {
    var duplex = new Duplex({objectMode: true}),
        reporter = options.reporter || 'html';

    duplex._write = function (file, encoding, done) {
        var stats = { files : []},
            filename, item, fstats, lines, sourceArray, segments,
            totSloc = 0, totCovered = 0;
        if (!coverInst) {
            throw 'Must call instrument before calling report';
        }
        for (filename in coverInst.coverageData) {
            fstats = coverInst.coverageData[filename].stats();
            lines = fstats.source.split('\n');
            sourceArray = [];
            lines.forEach(function(line, index) {
                var found = false;
                fstats.lines.forEach(function(missedLine) {
                    if (index+1 === missedLine.lineno) {
                        found = true;
                    }
                });
                if (!found) {
                    totCovered += 1;
                }
                var lineStruct = {
                    coverage: !found ? 1 : 0,
                    source: lines[index]
                }
                sourceArray.push(lineStruct)
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
        }
        stats.sloc = totSloc;
        stats.coverage = totCovered / totSloc * 100;
        cover.reporters[reporter](stats, options.outFile ? __dirname + '/' + options.outFile : undefined);
        duplex.push(file);
        done();
    };

    duplex._read = function () {};

    return duplex;
};
