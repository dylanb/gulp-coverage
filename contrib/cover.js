var instrument = require('./instrument');
var Module = require('module').Module;
var path = require('path');
var fs = require('fs');
var vm = require('vm');
var _ = require('underscore');
var multimatch = require('multimatch');
var extend = require('extend');

/**
 * Class used to track the coverage data for a single source code file
 *
 * @class FileCoverageData
 * @constructor
 * @param {String} filename - the name of the file
 * @param {Object} instrumentor - the object that will help with instrumentation
 */
function FileCoverageData (filename, instrumentor) {
    var theLines = {};
    /*
     * Create a map between the lines and the nodes
     * This is used later for calculating the code coverage stats
     */
    Object.keys(instrumentor.nodes).forEach(function(index) {
        var node = instrumentor.nodes[index],
            lineStruct;

        if (!theLines[node.loc.start.line]) {
            lineStruct = theLines[node.loc.start.line] = {
                nodes: []
            };
        } else {
            lineStruct = theLines[node.loc.start.line];
        }
        if (lineStruct.nodes.indexOf(node) === -1) {
            lineStruct.nodes.push(node);
        }
        if (!theLines[node.loc.end.line]) {
            lineStruct = theLines[node.loc.end.line] = {
                nodes: []
            };
        } else {
            lineStruct = theLines[node.loc.end.line];
        }
        if (lineStruct.nodes.indexOf(node) === -1) {
            lineStruct.nodes.push(node);
        }
    });
    this.lines = theLines;
    this.instrumentor = instrumentor;
    this.filename = filename;
    this.nodes = {};
    this.visitedBlocks = {};
    this.source = instrumentor.source;
}

/**
 * calculate the block coverage stats
 *
 * @private
 * @method _block
 * @return {Object} - structure containing `total` and `seen` counts for the blocks
 */
FileCoverageData.prototype._blocks = function() {
    var totalBlocks = this.instrumentor.blockCounter;
    var numSeenBlocks = 0;
    for(var index in this.visitedBlocks) {
        numSeenBlocks++;
    }    
    var toReturn = {
        total: totalBlocks,
        seen: numSeenBlocks
    };
    return toReturn;
};

/**
 * read the instrumentation data from the store into memory
 *
 * @private
 * @method _prepare
 * @return {undefined}
 */
FileCoverageData.prototype._prepare = function() {
    var data = require('./coverage_store').getStoreData(this.filename),
        rawData, store, index;

    data = '[' + data  + '{}]';
    rawData = JSON.parse(data);
    store = {nodes: {}, blocks: {}};
    rawData.forEach(function(item) {
        var it;
        if (item.hasOwnProperty('block')) {
            store.blocks[item.block] = store.blocks[item.block] || {count: 0};
            store.blocks[item.block].count += 1;
        } else {
            if (item.expression) {
                it = item.expression;
            } else if (item.statement) {
                it = item.statement;
            } else {
                return;
            }
            store.nodes[it.node] = store.nodes[it.node] || {count: 0};
            store.nodes[it.node].count += 1;
        }
    });
    for (index in store.nodes) {
        if (store.nodes.hasOwnProperty(index)) {
            this.instrumentor.nodes[index].count = store.nodes[index].count;
        }
    }
    for (index in store.blocks) {
        if (store.blocks.hasOwnProperty(index)) {
            this.visitedBlocks[index] = {count: store.blocks[index].count};
        }
    }
};

/**
 * 
 * Get statistics for the entire file, including per-line code coverage
 * statement coverage and block-level coverage
 * This function returns an object with the following structure:
 * {
 *      lines: Integer - the number of lines covered
 *      blocks: Integer - the number of blocks covered
 *      statements: Integer - the number of statements covered
 *      lineDetails: Array[Object] - a sparse array of the detailed information on each line
 *      sloc: Integer - the number of relevant lines in the file
 *      sboc: Integer - the number of relevant blocks in the file
 *      ssoc: Integer - the number of relevant statements in the file
 *      code: Array[String] - an Array of strings, one for each line of the file
 * }
 *
 * The line detail objects have the following structure
 * {
 *      number: Integer - the line number
 *      count: Integer - the number of times the line was executed
 *      statements: Integer - the number of statements covered
 *      ssoc: Integer - the number of statements in the line
 *      statementDetails : Array[Object] - an array of the statement details
 * }
 *
 * The statement detail objects have the following structure
 * {
 *      loc: Object - a location object
 *      count: the number of times the statement was executed
 * }
 *
 */

FileCoverageData.prototype.stats = function() {
    this._prepare();
        var filedata = this.instrumentor.source.split('\n');
    var lineDetails = [],
        lines = 0, fileStatements = 0, fileSsoc = 0, fileSloc = 0,
        theLines = this.lines,
        blockInfo;

    Object.keys(theLines).forEach(function(index) {
        var line = theLines[index],
            lineStruct,
            lineCount = 0,
            statements = 0,
            ssoc = 0,
            statementDetails = [];
        line.nodes.forEach(function(node) {
            var loc;
            if (node.count === null || node.count === undefined) {
                node.count = 0;
            }
            lineCount = Math.max(lineCount, node.count);
            ssoc += 1;
            if (node.count) {
                statements += 1;
            }
            loc = {}
            extend(loc, node.loc);
            statementDetails.push({
                loc: loc,
                count: node.count
            });
        });
        lineStruct = {
            number: index,
            count: lineCount,
            ssoc: ssoc,
            statements: statements,
            statementDetails: statementDetails
        };
        lines += (lineStruct.count ? 1 : 0);
        fileSloc += 1;
        fileStatements += lineStruct.statements;
        fileSsoc += lineStruct.ssoc;
        lineDetails[index-1] = lineStruct;
    });
    blockInfo = this._blocks();
    retVal = {
        lines: lines,
        statements: fileStatements,
        blocks: blockInfo.seen,
        sloc: fileSloc,
        ssoc: fileSsoc,
        sboc: blockInfo.total,
        lineDetails: lineDetails,
        code: filedata
    };
    return retVal;
};


/**
 * Generate the header at the top of the instrumented file that sets up the data structures that
 * are used to collect instrumentation data.
 *
 * @private
 * @method addInstrumentationHeader
 * @param {String} template - the contents of the template file
 * @param {String} filename - the full path name of the file being instrumented
 * @param {String} instrumented - the instrumented source code of the file
 * @param {String} coverageStorePath - the path to the coverage store
 * @return {String} the rendered file with instrumentation and instrumentation header
 */
var addInstrumentationHeader = function(template, filename, instrumented, coverageStorePath) {
    var templ = _.template(template),
        renderedSource = templ({
            instrumented: instrumented,
            coverageStorePath: coverageStorePath,
            filename: filename,
            source: instrumented.instrumentedSource
        });
    return renderedSource;
};

/**
 * @class CoverageSession
 * @constructor
 * @param {Array[glob]} pattern - the array of glob patterns of includes and excludes
 * @param {String} debugDirectory - the name of the director to contain debug instrumentation files
 */
var CoverageSession = function(pattern, debugDirectory) {
    function stripBOM(content) {
        // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
        // because the buffer-to-string conversion in `fs.readFileSync()`
        // translates it to FEFF, the UTF-16 BOM.
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        return content;
    }
    var originalRequire = this.originalRequire = require.extensions['.js'];
    var coverageData = this.coverageData = {};
    var pathToCoverageStore = path.resolve(path.resolve(__dirname), "coverage_store.js").replace(/\\/g, "/");
    var templatePath = path.resolve(path.resolve(__dirname), "templates", "instrumentation_header.js");
    var template = fs.readFileSync(templatePath, 'utf-8');
    require.extensions['.js'] = function(module, filename) {
        filename = filename.replace(/\\/g, "/");

        //console.log('filename: ', filename, ', pattern: ', pattern, ', match: ', multimatch(filename, pattern));
        if (!multimatch(filename, pattern).length) {
            return originalRequire(module, filename);
        }
        if (filename === pathToCoverageStore) {
            return originalRequire(module, filename);
        }

        var data = stripBOM(fs.readFileSync(filename, 'utf8').trim());
        data = data.replace(/^\#\!.*/, '');

        var instrumented = instrument(data);
        coverageData[filename] = new FileCoverageData(filename, instrumented);

        var newCode = addInstrumentationHeader(template, filename, instrumented, pathToCoverageStore);

        if (debugDirectory) {
            var outputPath = path.join(debugDirectory, filename.replace(/[\/|\:|\\]/g, "_") + ".js");
            fs.writeFileSync(outputPath, newCode);
        }

        return module._compile(newCode, filename);
    };
    
};

/**
 * Release the original require function
 *
 * @method release
 */
CoverageSession.prototype.release = function() {
  require.extensions['.js'] = this.originalRequire;
};


/**
 * This function returns the unique segments for the lines that are covered by the statementDetails
 * argument. This is necessary because the segments, as generated by the parser/instrumentor, overlap
 * so in order to determine which segment is actually the segment responsible for a particular
 * piece of code, we have to split and eliminate the overlaps. Because we are interested only in the
 * segments that were missed, we can also try to consolidate the adjacent segments that were hit
 *
 * @private
 * @method getSegments
 * @param {Array[String]} code - array of the lines for the entire file
 * @param {Array[Object]} lines - array of the line ojects for the entire file
 * @param Integer count - the hit count for the outermost statement
 * @param Array{object} - array of overlapping statement segments
 */
function getSegments(code, lines, count, statementDetails) {
    var lengths = [], beginLine = code.length+1, endLine = 0, sd = [],
        linesCode, i, j, k, splintered, segments;
    // calculate the lengths of each line
    code.forEach(function (codeLine) {
        lengths.push(codeLine.length);
    });
    // work out which lines we are talking about
    statementDetails.forEach(function(item) {
        if (item.loc.start.line < beginLine) {
            beginLine = item.loc.start.line;
        }
        if (item.loc.end.line > endLine) {
            endLine = item.loc.end.line;
        }
    });
    // modify all the coordinates into a single number
    statementDetails.forEach(function(item) {
        var lineNo = beginLine,
            startOff = 0;
        while (item.loc.start.line > lineNo) {
            startOff += lengths[lineNo] + 1;
            lineNo += 1;
        }
        startOff += item.loc.start.column;
        endOff = 0;
        lineNo = beginLine
        while (item.loc.end.line > lineNo) {
            endOff += lengths[lineNo] + 1;
            lineNo += 1;
        }
        endOff += item.loc.end.column;
        sd.push({
            start: startOff,
            end: endOff,
            count: item.count
        });
    });
    linesCode = code.filter(function(item, index) {
        return (index >= beginLine-1 && index <= endLine-1);
    }).join('\n');

    // push on a synthetic segment to catch all the parts of the line(s)
    sd.push({
        start: 0,
        end: linesCode.length,
        count: count
    });

    // reconcile the overlapping segments
    sd.sort(function(a, b) {
        return (a.end - b.end);
    });
    sd.sort(function(a, b) {
        return (a.start - b.start);
    });
    // Will now be sorted in start order with end as the second sort criterium
    splintered = [];
    for ( i = 0; i < sd.length; i++) {
        var us = new Array(sd[i].end - sd[i].start + 1);
        for (k = sd[i].end - sd[i].start; k >= 0; k--) {
            us[k] = 1;                
        }
        for (j = 0; j < sd.length; j++) {
            if (j !== i) {
                if (sd[i].start <= sd[j].start && sd[i].end >= sd[j].end && 
                    (sd[i].count !== sd[j].count || !sd[i].count || !sd[j].count)) {
                    for ( k = sd[j].start; k <= sd[j].end; k++) {
                        us[k - sd[i].start] = 0;
                    }
                }
            }
        }
        if (us.indexOf(0) !== -1) {
            // needs to be split
            splitStart = undefined;
            splitEnd = undefined;
            for (k = 0; k < us.length; k++) {
                if (us[k] === 1 && splitStart === undefined) {
                    splitStart = k;
                } else if (us[k] === 0 && splitStart !== undefined) {
                    splitEnd = k - 1;
                    splintered.push({
                        start: splitStart + sd[i].start,
                        end: splitEnd + sd[i].start,
                        count: sd[i].count
                    });
                    splitStart = undefined;
                }
            }
            if (splitStart !== undefined) {
                splintered.push({
                    start: splitStart + sd[i].start,
                    end: k - 1 + sd[i].start,
                    count: sd[i].count
                });
            }
        } else {
            splintered.push(sd[i]);
        }
    }
    splintered.sort(function(a, b) {
        return (b.end - a.end);
    });
    splintered.sort(function(a, b) {
        return (a.start - b.start);
    });
    var combined = [splintered[0]];
    splintered.reduce(function(p, c) {
        if (p && p.start <= c.start && p.end >= c.end &&
            (p.count === c.count || (p.count && c.count))) {
            // Can get rid of c
            return p;
        } else {
            combined.push(c);
            return c
        }
    });
    // combine adjacent segments
    currentItem = {
        start: combined[0].start,
        end: combined[0].end,
        count: combined[0].count
    };
    segments = [];
    combined.splice(0,1);
    combined.forEach(function(item) {
        if (item.count === currentItem.count || (item.count && currentItem.count)) {
            currentItem.end = item.end;
        } else {
            segments.push(currentItem);
            currentItem = {
                start: item.start,
                end: item.end,
                count: item.count
            };
        }
    });
    segments.push(currentItem);
    // Now add the code to each segment
    segments.forEach(function(item) {
        item.code = linesCode.substring(item.start, item.end);
    });
    return segments;
}

/**
 * The nodes (lines) that are returned by the parser overlap. There is one node generated for the beginning
 * and one for the end of each block and individual nodes may span multiple lines. This function
 * eliminates the duplicates and the overlaps such that there is at most one line responsible for each
 * source code line. The function does this by splitting the line objects that wrap other lines into the
 * piece before and the piece after.
 *
 * @private
 * @method splitOverlaps
 * @param {Array[Object]} lines - array of line (node) objects
 * @param {Array[String]} code - array of source code lines
 */
function splitOverlaps(lines, code) {
    var i, j, left, right, insertAt;

    for ( i = 0; i < lines.length; i++) {
        if (lines[i]) {
            for (j = lines[i].statementDetails.length; j--;) {
                if (lines[i].statementDetails[j].loc.start.line < i+1) {
                    if (lines[i].statementDetails[j].loc.end.line >= i+1) {
                        lines[i].statementDetails[j].loc.start.line = i+1;
                        lines[i].statementDetails[j].loc.start.column = 0;
                    } else {
                        lines[i].statementDetails.splice(j, 1);
                    }
                }            
            }
            if (lines[i].statementDetails[0].loc.start.column) {
                lines[i].statementDetails[0].loc.start.column = 0;
            }
            for (j = i + 1; j < lines.length; j++) {
                if (lines[i] && lines[j]) {
                    left = {
                        start: undefined,
                        end: undefined
                    };
                    right = {
                        start: undefined,
                        end: undefined
                    };
                    lines[i].statementDetails.forEach(function(item, index) {
                        if (left.start === undefined) {
                            left.start = item.loc.start.line;
                        }
                        if (left.end === undefined) {
                            left.end = item.loc.end.line;
                        } else {
                            left.end = Math.max(left.end, item.loc.end.line);
                        }
                    });
                    lines[j].statementDetails.forEach(function(item) {
                        if (right.start === undefined) {
                            right.start = item.loc.start.line;
                        }
                        if (right.end === undefined) {
                            right.end = item.loc.end.line;
                        } else {
                            right.end = Math.max(right.end, item.loc.end.line);
                        }
                    });
                }
                if (i !== j &&
                    lines[i] && lines[j] && left.start <= right.start && left.end >= right.end) {
                    if (left.start === right.start && left.end <= right.end) {
                        lines[j] = undefined;
                    } else {
                        lines[i].statementDetails.forEach(function(item, index) {
                            if (item.loc.start.line !== item.loc.end.line) {
                                if (i > j || left.start === right.start) {
                                    lines[i] = undefined;
                                }
                                if (item.loc.end.line > right.end) {
                                    // need to split it
                                    insertAt = right.end+1;
                                    while (lines[insertAt-1] && insertAt <= left.end) {
                                        insertAt += 1;
                                    }
                                    if (insertAt <= left.end) {
                                        lines[insertAt-1] = {
                                            number: (insertAt).toString(),
                                            count: undefined,
                                            statementDetails: [{
                                                loc: {
                                                    start: {
                                                        line: insertAt,
                                                        column: 0
                                                    },
                                                    end: {
                                                        line: item.loc.end.line,
                                                        column: item.loc.end.column
                                                    }
                                                }
                                            }]
                                        };
                                    }
                                }
                                if (i < j && left.start !== right.start) {
                                    item.loc.end.line = right.start - 1;
                                    item.loc.end.column = code[item.loc.start.line-1].length;
                                }
                            }
                        });
                    }
                }
            }
        } else {
            lines[i] = undefined;
        }
    }
    for (j = lines.length; j--;) {
        if (!lines[j]) {
            lines[j] = undefined;
        } else {
            if (lines[j].statementDetails[0].loc.start.column === 0 &&
                lines[j].statementDetails[0].loc.end.column === 0) {
                lines[j] = undefined;
            }
        }
    }
    return lines;
}

function linesWithData(lines) {
    var interim = [],
        unique, i;
    lines.forEach(function(item, index) {
        if (item) {
            item.statementDetails.forEach(function(statement) {
                for (i = statement.loc.start.line; i <= statement.loc.end.line; i++) {
                    interim.push(i);
                }
            });
        }
    });
    interim.sort(function(a,b) {return a - b});
    unique = [interim[0]];
    interim.reduce(function(p, c) {
        if (p === c) {
            // Can get rid of c
            return p;
        } else {
            unique.push(c);
            return c
        }
    });
    return unique;
}

/**
 * Generate a coverage statistics structure for all of the instrumented files given all the data that
 * has been geenrated for them to date
 * {
 *        sloc: Integer - how many source lines of code there were in total
 *        ssoc: Integer - how many statements of code there were in total
 *        sboc: Integer - how many blocks of code there were in total
 *        coverage: Float - percentage of lines covered
 *        statements: Float - percentage of statements covered
 *        blocks: Float: percentage of blocks covered
 *        files: Array[Object] - array of information about each file
 * }
 *
 * Each file has the following structure
 * {
 *        filename: String - the file
 *        basename: String - the file short name
 *        segments: String - the file's directory
 *        coverage: Float - the percentage of lines covered
 *        statements: Float - the percentage of statements covered
 *        blocks: Float - the percentage of blocks covered
 *        source: Array[Object] - array of objects, one for each line of code
 *        sloc: Integer - the number of lines of code
 *        ssoc: Integer - the number of statements of code
 *        sboc: Integer - the number of blocks of code
 * }
 *
 * Each line has the following structure
 * {
 *        count: Integer - number of times the line was hit
 *        statements: Float - the percentage of statements covered
 *        segments: Array[Object] - the segments of statements that make up the line
 * }  
 *
 * Each statement segment has the following structure
 * {
 *      code: String - the string of code for the segment
 *      count: Integer - the hit count for the segment
 * }
 *
 * @method allStats
 * @return {Object} - the structure containing all the coverage stats for the coverage instance
 *
 */
CoverageSession.prototype.allStats = function () {
    var stats = { files : []},
        filename, item, lines, sourceArray, segments,
        totSloc, totCovered, totBloc, totStat, totStatCovered, totBlocCovered,
        coverageData = this.coverageData;

    totSloc = totCovered = totBloc = totStat = totStatCovered = totBlocCovered = 0;
    Object.keys(coverageData).forEach(function(filename) {
        var fstats, lines, code, dataLines;

        fstats = coverageData[filename].stats();
        code = fstats.code;
        splitOverlaps(fstats.lineDetails, code);
        dataLines = linesWithData(fstats.lineDetails);
        lines = fstats.lineDetails;
        sourceArray = [];
        code.forEach(function(codeLine, index){
            var count = null, statements = null, numStatements = 0, segs, lineNo, allSame = true, lineStruct;
            line = lines[index];
            if (line) {
                count = line.count;
                statements = 0;
                lineNo = line.statementDetails[0].loc.start.line;
                line.statementDetails.forEach(function(statement) {
                    numStatements += 1;
                    if (statement.count) {
                        statements += 1;
                    }
                    if (statement.loc.start.line !== statement.loc.end.line || statement.loc.start.line !== lineNo) {
                        allSame = false;
                    }
                });
                if (count) {
                    segs = getSegments(code, lines, count, line.statementDetails);
                } else {
                    segs = [{
                        code: codeLine,
                        count: count
                    }];
                }
            } else if (dataLines.indexOf(index+1) === -1) {
                segs = [{
                    code: codeLine,
                    count: 0
                }];
            } else {
                return;
            }
            lineStruct = {
                coverage: count,
                statements: statements === null ? null : (statements / numStatements) * 100,
                segments: segs
            };
            sourceArray.push(lineStruct);
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
            sloc: fstats.sloc,
            sboc: fstats.sboc,
            ssoc: fstats.ssoc
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
    return stats;
};

/**
 * create a new CoverageSession object
 *
 * @method cover
 * @param {Array[glob]} pattern - the array of glob patterns of includes and excludes
 * @param {String} debugDirectory - the name of the director to contain debug instrumentation files
 * @return {Object} the CoverageSession instance
 */
var cover = function(pattern, debugDirectory) {    
    return new CoverageSession(pattern, debugDirectory);
};


function removeDir(dirName) {
    fs.readdirSync(dirName).forEach(function(name) {
        if (name !== '.' && name !== '..') {
            fs.unlinkSync(dirName + '/' + name);
        }
    });
    fs.rmdirSync(dirName);
}

/**
 * This initializes a new coverage run. It does this by creating a randomly generated directory
 * in the .coverdata and updating the .coverrun file in the process' cwd with the directory's
 * name, so that the data collection can write data into this directory
 */
var init = function() {
    var directoryName = '.cover_' + Math.random().toString().substring(2),
        dataDir = process.cwd() + '/.coverdata';
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    } else {
        fs.readdirSync(dataDir).forEach(function(name) {
            if (name !== '.' && name !== '..') {
                removeDir(dataDir + '/' + name);
            }
        });
    }
    fs.mkdirSync(dataDir + '/' + directoryName);
    fd = fs.writeFileSync(process.cwd() + '/.coverrun', '{ "run" : "' + directoryName + '" }');
    global.coverageData = {};
};

var cleanup = function() {
    var store = require('./coverage_store');

    store.clearStore();
};

module.exports = {
    cover: cover,
    init: init,
    cleanup: cleanup,
    reporters: {
        html:   require('./reporters/html'),
        json:   require('./reporters/json')
    }
};