var gulp = require('gulp'),
    cover = require('./index'),
    mochaTask = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    exec = require('child_process').exec,
    jasmineTask = require('gulp-jasmine'),
    through2 = require('through2');

/*
 * Define the dependency arrays
 */

var lintDeps = [],
    testDeps = [],
    debugDeps = [],
    mochaDeps = [],
    jsonDeps = [],
    jasmineDeps = [],
    testchainDeps = []

/*
 * Define the task functions
 */

function synchro (done) {
    return through2.obj(function (data, enc, cb) {
        cb();
    },
    function (cb) {
        cb();
        done();
    });
}

function test () {
    gulp.src(['test/**.js'], { read: false })
        .pipe(mochaTask({
            reporter: 'spec'
        }));
}

function lint (done) {
    gulp.src(['test/**/*.js', 'index.js', 'contrib/cover.js', 'contrib/coverage_store.js', 'contrib/reporters/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default')
        .pipe(synchro(done)));
}

function debug (cb) {
    exec('node --debug-brk debug/chaindebug.js', {}, function (error, stdout, stderr) {
        console.log('STDOUT');
        console.log(stdout);
        console.log('STDERR');
        console.log(stderr);
        if (error) {
            console.log('-------ERROR-------');
            console.log(error);
        }
    });
    cb();
}

function mocha (done) {
    gulp.src(['testsupport/src.js', 'testsupport/src3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.report({
            outFile: 'testoutput/blnkt.html'
        })
        .pipe(synchro(done)));
}

function json (done) {
    gulp.src(['testsupport/src.js', 'testsupprt/src3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.report({
            reporter: 'json',
            outFile: 'testoutput/json.json'
        })
        .pipe(synchro(done)));
}

function jasmine (done) {
    gulp.src('testsupport/srcjasmine.js')
        .pipe(cover.instrument({
            pattern: ['**/test*']
        }))
        .pipe(jasmineTask())
        .pipe(cover.report({
            outFile: 'testoutput/jasmine.html'
        })
        .pipe(cover.enforce())
        .pipe(synchro(done)));
}

function testchain (done) {
    gulp.src(['testsupport/srcchain.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/chain.js'],
            debugDirectory: 'debug'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.gather())
        .pipe(cover.format({
            outFile: 'chain.html'
        }))
        .pipe(gulp.dest('./testoutput'))
        .pipe(synchro(done));
}

/*
 * setup function
 */

function setup () {
    gulp.task('test', testDeps, test);
    gulp.task('lint', lintDeps, lint);
    gulp.task('mocha', mochaDeps, mocha);
    gulp.task('json', jsonDeps, json);
    gulp.task('jasmine', jasmineDeps, jasmine);
    gulp.task('testchain', testchainDeps, testchain);    
}

/*
 * Actual task defn
 */

gulp.task('default', function() {
    // Setup the chain of dependencies
    jasmineDeps = ['testchain'];
    jsonDeps = ['jasmine'];
    mochaDeps = ['json'];
    testDeps = ['mocha'];
    setup();
    gulp.run('test');
});

gulp.task('debug', debugDeps, debug);

setup();

gulp.task('watch', function () {
    jasmineDeps = ['mocha'];
    setup();
    gulp.watch(['testsupport/src.js', 'testsupport/src3.js', 'testsupport/test.js', 'testsupport/test2.js'], function(event) {
      gulp.run('jasmine');
    });    
});

