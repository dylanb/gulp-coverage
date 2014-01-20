var assert = require('assert'),
    cover = require('../contrib/cover.js'),
    fs = require('fs'),
    path = require('path');

function removeDir(dir) {
    fs.readdirSync(dir).forEach(function(name) {
        if (name !== '.' && name !== '..') {
            fs.unlinkSync(dir+ '/' + name);
        }
    });
    fs.rmdirSync(dir);
}

function removeDirTree(dir) {
    fs.readdirSync(dir).forEach(function(name) {
        if (name !== '.' && name !== '..') {
            removeDir(dir + '/' + name);
        }
    });
}

describe('cover.js', function () {
    describe('cover', function () {
        beforeEach(function () {
            if (fs.existsSync(process.cwd() + '/.coverdata')) {
                removeDirTree(process.cwd() + '/.coverdata');
            }
            if (fs.existsSync(process.cwd() + '/.coverrun')) {
                fs.unlinkSync(process.cwd() + '/.coverrun');
            }
        });
        it('cover.init() will create the coverdata directory', function () {
            cover.init();
            assert.ok(fs.existsSync(process.cwd() + '/.coverdata'));
        });
        it('cover.init() will create the .coverrun file', function () {
            cover.init();
            assert.ok(fs.existsSync(process.cwd() + '/.coverrun'));
        });
        it('cover.init() will put the run directory into the .coverrun file', function () {
            var run;
            cover.init();
            run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run;
            assert.ok(fs.existsSync(process.cwd() + '/.coverdata/' + run));
        });
        it('cover.init() will remove prior run directories', function () {
            var run;
            cover.init();
            run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run;
            assert.ok(fs.existsSync(process.cwd() + '/.coverdata/' + run));
            cover.init();
            assert.ok(!fs.existsSync(process.cwd() + '/.coverdata/' + run));
        });
        it('cover.init() will remove prior run directories', function () {
            var run;
            cover.init();
            run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run;
            assert.ok(fs.existsSync(process.cwd() + '/.coverdata/' + run));
            cover.init();
            assert.ok(!fs.existsSync(process.cwd() + '/.coverdata/' + run));
        });
    });
    describe('coverInst', function () {
        var coverInst;
        beforeEach(function () {
            delete require.cache[require.resolve('../test')];
            cover.cleanup();
            cover.init();
            coverInst = cover.cover('**/test.js', process.cwd() + '/debug/');
        });
        it('will cause the require function to instrument the file', function () {
            var test = require('../test'),
                filename = require.resolve('../test'),
                outputPath = path.join(process.cwd() + '/debug/', filename.replace(/[\/|\:|\\]/g, "_") + ".js");
            assert.ok(fs.existsSync(outputPath));
        });
        it('will cause the data to be collected when the instrumented file is executed', function () {
            var test = require('../test'),
                run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run,
                filename = require.resolve('../test'),
                dataPath = path.join(process.cwd() + '/.coverdata/' + run, filename.replace(/[\/|\:|\\]/g, "_"));
            test();
            assert.ok(fs.existsSync(dataPath));
        });
    });
    describe('coverInst.coverageData[filename].stats()', function () {
        var test, coverInst, stats, filename;
        cover.cleanup();
        cover.init();
        coverInst = cover.cover('**/test2.js');
        test = require('../test2');
        filename = require.resolve('../test2');
        test();
        stats = coverInst.coverageData[filename].stats();
        it('will return the correct number of covered lines', function () {
            assert.equal(stats.lines, 7);
        });
        it('will return the correct number of code lines', function () {
            assert.equal(stats.sloc, 9);
        });
        it('will return the correct number of covered statements', function () {
            assert.equal(stats.statements, 9);
        });
        it('will return the correct number of statements', function () {
            assert.equal(stats.ssoc, 13);
        });
        it('will return the correct number of covered blocks', function () {
            assert.equal(stats.blocks, 3);
        });
        it('will return the correct number of blocks', function () {
            assert.equal(stats.sboc, 4);
        });
        it('will return the lines of code as an array', function () {
            assert.equal(stats.code.length, 14);
        });
        it('will return the code correctly', function () {
            var codeArray = fs.readFileSync(filename).toString().trim().split('\n');
            assert.deepEqual(stats.code, codeArray);
        });
        it('will return the correct lineDetails sparse array', function () {
            assert.equal(stats.lineDetails.length, 14);
            assert.equal(stats.lineDetails.filter(function(item){return item}).length, 9);
        });
        it('will return the correct count for lines that were not covered', function () {
            assert.equal(stats.lineDetails[7].count, 0);
        });
        it('will return the correct count for lines that are blocks around other code', function () {
            assert.equal(stats.lineDetails[0].count, 1);
            assert.equal(stats.lineDetails[13].count, 1);
        });
        it('will return the correct line and position information for the statements', function () {
            assert.equal(stats.lineDetails[4].statementDetails[0].loc.start.line, 5);
            assert.equal(stats.lineDetails[4].statementDetails[0].loc.start.column, 16);
            assert.equal(stats.lineDetails[4].statementDetails[0].loc.end.line, 5);
            assert.equal(stats.lineDetails[4].statementDetails[0].loc.end.column, 22);
            assert.equal(stats.lineDetails[4].statementDetails[2].loc.start.line, 5);
            assert.equal(stats.lineDetails[4].statementDetails[2].loc.start.column, 24);
            assert.equal(stats.lineDetails[4].statementDetails[2].loc.end.line, 5);
            assert.equal(stats.lineDetails[4].statementDetails[2].loc.end.column, 27);
        });
        it('will return the correct coverage count for the covered statements', function () {
            assert.equal(stats.lineDetails[4].statementDetails[0].count, 11);
            assert.equal(stats.lineDetails[4].statementDetails[2].count, 10);
        });
        it('will return the correct coverage count for the uncovered statements', function () {
            assert.equal(stats.lineDetails[6].statementDetails[0].count, 0);
            assert.equal(stats.lineDetails[6].statementDetails[2].count, 0);
        });
    });
});
