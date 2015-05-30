var gulp = require('gulp'),
    cover = require('./index'),
    mochaTask = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    exec = require('child_process').exec,
    jasmineTask = require('gulp-jasmine'),
    coverallsTask = require('gulp-coveralls'),
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
    testchainDeps = [],
    rewireDeps = [],
    classPatternDeps = [],
    coverallsDeps = [];

/*
 * Define the task functions
 */

function test () {
    return gulp.src(['test/**.js'], { read: false })
        .pipe(mochaTask({
            reporter: 'spec',
        }));
}

function lint () {
    return gulp.src(['test/**/*.js', 'index.js', 'contrib/cover.js', 'contrib/coverage_store.js', 'contrib/reporters/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
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

function mocha () {
    return gulp.src(['testsupport/src.js', 'testsupport/src3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug/info'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.gather())
        .pipe(cover.format({
            outFile: 'blnkt.html'
        }))
        .pipe(gulp.dest('./testoutput'));
}

function classPattern () {
    return gulp.src(['testsupport/src4.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test3.js'],
            debugDirectory: 'debug/info'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.gather())
        .pipe(cover.format({
            outFile: 'classPattern.html'
        }))
        .pipe(gulp.dest('./testoutput'));
}



function coveralls () {
    return gulp.src(['testsupport/src.js', 'testsupport/src3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug/info'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.gather())
        .pipe(cover.format({
            reporter: 'lcov'
        }))
        .pipe(coverallsTask())
        .pipe(gulp.dest('./testoutput'));
}

function rewire () {
    return gulp.src(['testsupport/rewire.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['testsupport/myModule.js'],
            debugDirectory: 'debug/info'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.gather())
        .pipe(cover.format({
            outFile: 'rewire.html'
        }))
        .pipe(gulp.dest('./testoutput'));
}

function json () {
    return gulp.src(['testsupport/src.js', 'testsupprt/src3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug/info'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.report({
            reporter: 'json',
            outFile: 'testoutput/json.json'
        }));
}

function jasmine () {
    return gulp.src('testsupport/srcjasmine.js')
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug/info'
        }))
        .pipe(jasmineTask())
        .pipe(cover.gather())
        .pipe(cover.format({
            outFile: 'jasmine.html'
        }))
        .pipe(gulp.dest('./testoutput'));
}

gulp.task('test', function() {
  // Be sure to return the stream
});

function testchain () {
    return gulp.src(['testsupport/srcchain.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/chain.js'],
            debugDirectory: 'debug/info'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.gather())
        .pipe(cover.format({
            outFile: 'chain.html'
        }))
        .pipe(gulp.dest('./testoutput'))
        .pipe(cover.format({
            outFile: 'chain.json',
            reporter: 'json'
        }))
        .pipe(gulp.dest('./testoutput'));
}


function testc2 () {
    return gulp.src(['testsupport/c2_test.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/c2_cov.js'],
            debugDirectory: 'debug/info'
        }))
        .pipe(mochaTask({
            reporter: 'spec'
        }))
        .pipe(cover.gather())
        .pipe(cover.format({
            outFile: 'c2.html'
        }))
        .pipe(gulp.dest('./testoutput'))
        .pipe(cover.format({
            outFile: 'c2.json',
            reporter: 'json'
        }))
        .pipe(gulp.dest('./testoutput'));
}
/*
 * setup function
 */

function setup () {
    gulp.task('coveralls', coverallsDeps, coveralls);
    gulp.task('rewire', rewireDeps, rewire);
    gulp.task('classPattern', classPatternDeps, classPattern);
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
    coverallsDeps = ['classPattern'];
    rewireDeps = ['coveralls'];
    testchainDeps = ['rewire'];
    jasmineDeps = ['testchain'];
    jsonDeps = ['jasmine'];
    mochaDeps = ['json'];
    testDeps = ['mocha'];
    setup();
    gulp.run('test');
});

gulp.task('debug', debugDeps, debug);

gulp.task('c2', [], testc2);

setup();

gulp.task('watch', function () {
    jasmineDeps = ['mocha'];
    setup();
    gulp.watch(['testsupport/src.js', 'testsupport/src3.js', 'testsupport/test.js', 'testsupport/test2.js'], function(event) {
      gulp.run('jasmine');
    });    
});

