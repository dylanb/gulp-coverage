var assert = require('assert'),
    cover = require('../index.js'),
    through2 = require('through2'),
    fs = require('fs'),
    path = require('path'),
    mocha = require('gulp-mocha');

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

describe('gulp-coverage', function () {
    var writer, reader;
    beforeEach(function () {
        delete require.cache[require.resolve('../test')];
        delete require.cache[require.resolve('../src')];
        if (fs.existsSync(process.cwd() + '/.coverdata')) {
            removeDirTree(process.cwd() + '/.coverdata');
        }
        if (fs.existsSync(process.cwd() + '/.coverrun')) {
            fs.unlinkSync(process.cwd() + '/.coverrun');
        }
        writer = through2.obj(function (chunk, enc, cb) {
            this.push(chunk);
            cb();
        }, function (cb) {
            cb();
        });
    });
    describe('instrument', function () {
        it('should instrument and collect data', function (done) {
            reader = through2.obj(function (chunk, enc, cb) {
                this.push(chunk);
                cb();
            },
            function (cb) {
                var filename = require.resolve('../test');
                // Should have created the coverdata directory
                assert.ok(fs.existsSync(process.cwd() + '/.coverdata'));
                // Should have created the run directory
                assert.ok(fs.existsSync(process.cwd() + '/.coverrun'));
                run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run;
                assert.ok(fs.existsSync(process.cwd() + '/.coverdata/' + run));
                // Should have collected data
                dataPath = path.join(process.cwd() + '/.coverdata/' + run, filename.replace(/[\/|\:|\\]/g, "_"));
                assert.ok(fs.existsSync(dataPath));
                cb();
                done();
            });
            reader.on('error', function(){
                console.log('error: ', arguments);
            });

            writer.pipe(cover.instrument({
                pattern: ['**/test*'],
                debugDirectory: process.cwd() + '/debug/'
            }))
                .pipe(mocha({}))
                .pipe(reader);

            writer.push({
                path: require.resolve('../src.js')
            });
            writer.end();
        });
    });
    describe('report', function () {
        beforeEach(function () {
            if (fs.existsSync('coverage.html')) {
                fs.unlinkSync('coverage.html');
            }
        });
        it('should create an HTML report', function (done) {
            reader = through2.obj(function (chunk, enc, cb) {
                cb();
            },
            function (cb) {
                assert.ok(fs.existsSync('coverage.html'));
                cb();
                done();
            });
            reader.on('error', function(){
                console.log('error: ', arguments);
            });
            writer.pipe(cover.instrument({
                pattern: ['**/test*'],
                debugDirectory: process.cwd() + '/debug/'
            })).pipe(mocha({
            })).pipe(cover.report({
                outFile: 'coverage.html',
                reporter: 'html'
            })).pipe(reader);

            writer.write({
                path: require.resolve('../src.js')
            });
            writer.end();
        });
    });
});
