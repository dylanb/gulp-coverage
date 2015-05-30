var assert = require('assert'),
    cover = require('../contrib/cover.js'),
    fs = require('fs'),
    path = require('path');

function clearStore() {
    var filename;
    for (filename in coverageStore) {
        if (coverageStore.hasOwnProperty(filename)) {
            fs.closeSync(coverageStore[filename]);
            coverageStore[filename] = undefined;
            delete coverageStore[filename];
        }
    }
}

function removeDir(dir) {
    fs.readdirSync(dir).forEach(function(name) {
        if (name !== '.' && name !== '..') {
            fs.unlinkSync(path.join(dir, name));
        }
    });
    fs.rmdirSync(dir);
}

function removeDirTree(dir) {
    clearStore();
    fs.readdirSync(dir).forEach(function(name) {
        if (name !== '.' && name !== '..') {
            removeDir(path.join(dir, name));
        }
    });
}

describe('cover.js', function () {
    describe('cover', function () {
        beforeEach(function () {
            if (fs.existsSync(path.join(process.cwd(), '.coverdata'))) {
                removeDirTree(path.join(process.cwd(), '.coverdata'));
            }
            if (fs.existsSync(path.join(process.cwd(), '.coverrun'))) {
                fs.unlinkSync(path.join(process.cwd(), '.coverrun'));
            }
        });
        it('cover.init() will create the coverdata directory', function () {
            cover.init();
            assert.ok(fs.existsSync(path.join(process.cwd(), '.coverdata')));
        });
        it('cover.init() will create the .coverrun file', function () {
            cover.init();
            assert.ok(fs.existsSync(path.join(process.cwd(), '.coverrun')));
        });
        it('cover.init() will put the run directory into the .coverrun file', function () {
            var run;
            cover.init();
            run = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.coverrun'))).run;
            assert.ok(fs.existsSync(path.join(process.cwd(), '.coverdata', run)));
        });
        it('cover.init() will remove prior run directories', function () {
            var run;
            cover.init();
            run = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.coverrun'))).run;
            assert.ok(fs.existsSync(path.join(process.cwd(), '.coverdata', run)));
            cover.init();
            assert.ok(!fs.existsSync(path.join(process.cwd(), '.coverdata', run)));
        });
        it('cover.init() will remove prior run directories', function () {
            var run;
            cover.init();
            run = JSON.parse(fs.readFileSync(path.join(process.cwd(),  '.coverrun'))).run;
            assert.ok(fs.existsSync(path.join(process.cwd(), '.coverdata', run)));
            cover.init();
            assert.ok(!fs.existsSync(path.join(process.cwd(), '.coverdata', run)));
        });
    });
    describe('coverInst', function () {
        var coverInst;
        beforeEach(function () {
            delete require.cache[require.resolve('../testsupport/test')];
            cover.cleanup();
            cover.init();
            // Note: the cover pattern is relative to the process.cwd()
            coverInst = cover.cover('./testsupport/test.js', path.join(process.cwd(), 'debug'));
        });
        it('will cause the require function to instrument the file', function () {
            var test = require('../testsupport/test'),
                filename = require.resolve('../testsupport/test'),
                outputPath = path.join(process.cwd(), 'debug', filename.replace(/[\/|\:|\\]/g, "_") + ".js");
            assert.ok(fs.existsSync(outputPath));
        });
        it('will cause the data to be collected when the instrumented file is executed', function () {
            var test = require('../testsupport/test'),
                run = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.coverrun'))).run,
                filename = require.resolve('../testsupport/test'),
                dataPath = path.join(process.cwd(), '.coverdata', run, filename.replace(/[\/|\:|\\]/g, "_"));
            test();
            assert.ok(fs.existsSync(dataPath));
        });
    });
    describe('coverInst.coverageData[filename].stats()', function () {
        var test, coverInst, stats, filename;
        cover.cleanup();
        cover.init();
        coverInst = cover.cover('**/test2.js');
        test = require('../testsupport/test2');
        filename = require.resolve('../testsupport/test2');
        test();
        filename = filename.replace(/\\/g, '/');
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
            assert.equal(stats.code.length, 33);
        });
        it('will return the code correctly', function () {
            var codeArray = fs.readFileSync(filename).toString().trim().split('\n');
            assert.deepEqual(stats.code, codeArray);
        });
        it('will return the correct lineDetails sparse array', function () {
            assert.equal(stats.lineDetails.length, 17);
            assert.equal(stats.lineDetails.filter(function(item){return item;}).length, 9);
        });
        it('will return the correct count for lines that were not covered', function () {
            assert.equal(stats.lineDetails[7].count, 0);
        });
        it('will return the correct count for lines that are blocks around other code', function () {
            assert.equal(stats.lineDetails[0].count, 1);
            assert.equal(stats.lineDetails[16].count, 1);
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
    describe('coverInst.allStats()', function () {
        var test, coverInst, stats, filename;
        delete require.cache[require.resolve('../testsupport/test2')];
        cover.cleanup();
        cover.init();
        coverInst = cover.cover('**/testsupport/*.js');
        test = require('../testsupport/test2');
        filename = require.resolve('../testsupport/test2');
        test();
        stats = coverInst.allStats();
        // console.log(stats);
        it('will return the uncovered files', function () {
            //console.log(stats.uncovered);
            assert.deepEqual(stats.uncovered, [
                'testsupport/c2_cov.js',
                'testsupport/c2_test.js',
                'testsupport/chain.js',
                'testsupport/chainable.js',
                'testsupport/myModule.js',
                'testsupport/rewire.js',
                'testsupport/src.js',
                'testsupport/src2.js',
                'testsupport/src3.js',
                'testsupport/src4.js',
                'testsupport/srcchain.js',
                'testsupport/srcjasmine.js',
                'testsupport/test.js',
                'testsupport/test3.js' ]);
        });
        it('will return the correct number of code lines', function () {
            assert.equal(stats.sloc, 9);
        });
        it('will return the correct number of statements', function () {
            assert.equal(stats.ssoc, 13);
        });
        it('will return the correct number of blocks', function () {
            assert.equal(stats.sboc, 4);
        });
        it('will return the correct coverage', function () {
            assert.equal(Math.floor(stats.coverage), 77);
        });
        it('will return the correct statements coverage', function () {
            assert.equal(Math.floor(stats.statements), 69);
        });
        it('will return the correct blocks coverage', function () {
            assert.equal(Math.floor(stats.blocks), 75);
        });
        it('will return the file data', function () {
            assert.equal(stats.files.length, 1);
        });

    });
});
