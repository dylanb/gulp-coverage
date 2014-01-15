var assert = require('assert'),
    cover = require('../index.js'),
    Stream = require('stream'),
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
        delete require.cache[require.resolve('../test2')];
        delete require.cache[require.resolve('../src2')];
        if (fs.existsSync(process.cwd() + '/.coverdata')) {
            removeDirTree(process.cwd() + '/.coverdata');
        }
        if (fs.existsSync(process.cwd() + '/.coverrun')) {
            fs.unlinkSync(process.cwd() + '/.coverrun');
        }
        writer = new Stream.Duplex({objectMode: true});
        writer._write = function (file, encoding, cb) {
            writer.push(file);
            cb();
        };

        reader = new Stream.Duplex({objectMode: true})
        reader._read = writer._read = function () {};
    });
    describe('instrument', function () {
        it('should instrument and collect data', function (done) {
            reader._write = function () {
                var filename = require.resolve('../test2');
                // Should have created the coverdata directory
                assert.ok(fs.existsSync(process.cwd() + '/.coverdata'));
                // Should have created the run directory
                assert.ok(fs.existsSync(process.cwd() + '/.coverrun'));
                run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run;
                assert.ok(fs.existsSync(process.cwd() + '/.coverdata/' + run));
                // Should have collected data
                dataPath = path.join(process.cwd() + '/.coverdata/' + run, filename.replace(/[\/|\:|\\]/g, "_"));
                assert.ok(fs.existsSync(dataPath));
                done();
            };


            writer.pipe(cover.instrument({
                filePattern: 'test',
                ignoreFiles: undefined,
                debugDirectory: process.cwd() + '/debug/'
            })).pipe(mocha({
            })).pipe(reader);

            writer.write({
                path: require.resolve('../src2')
            });
        });
    });
    describe('report', function () {
        beforeEach(function () {
            if (fs.existsSync('coverage.html')) {
                fs.unlinkSync('coverage.html');
            }
        });
        it('should create an HTML report', function (done) {
            reader._write = function () {
                assert.ok(fs.existsSync('coverage.html'));
                done();
            };

            writer.pipe(cover.instrument({
                filePattern: 'test',
                ignoreFiles: undefined,
                debugDirectory: process.cwd() + '/debug/'
            })).pipe(mocha({
            })).pipe(cover.report({
                outFile: 'coverage.html',
                reporter: 'html'
            })).pipe(reader);

            writer.write({
                path: require.resolve('../src2')
            });
        });
    });
});
