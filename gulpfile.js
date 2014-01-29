var gulp = require('gulp'),
    cover = require('./index'),
    mocha = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    exec = require('child_process').exec,
    jasmine = require('gulp-jasmine');

gulp.task('test', function () {
    gulp.src(['test/**.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec'
        }));
});

gulp.task('lint', function () {
    gulp.src(['test/**/*.js', 'index.js', 'contrib/cover.js', 'contrib/coverage_store.js', 'contrib/reporters/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
});

gulp.task('debug', function () {
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
});

/*
 * these tasks are to actually use the plugin and test it within the context of gulp
 */

gulp.task('default', function(){
  gulp.run('mocha', 'json', 'jasmine', 'testchain', 'test', 'lint');
});

gulp.task('mocha', function () {
    gulp.src(['testsupport/src.js', 'testsupport/src3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug'
        }))
        .pipe(mocha({
            reporter: 'spec'
        }))
        .pipe(cover.report({
            outFile: 'testoutput/blnkt.html'
        }));
});

gulp.task('json', function () {
    gulp.src(['testsupport/src.js', 'vsrc3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*']
        }))
        .pipe(mocha({
            reporter: 'spec'
        }))
        .pipe(cover.report({
            reporter: 'json',
            outFile: 'testoutput/json.json'
        }));
});

gulp.task('jasmine', function () {
    gulp.src('testsupport/srcjasmine.js')
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug'
        }))
        .pipe(jasmine())
        .pipe(cover.report({
            outFile: 'testoutput/jasmine.html'
        }));
});

gulp.task('watch', function () {
    gulp.watch(['testsupport/src.js', 'testsupport/src3.js', 'test.js', 'test2.js'], function(event) {
      gulp.run('mocha');
    });    
});

gulp.task('testchain', function () {
    gulp.src(['testsupport/srcchain.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/chain.js'],
            debugDirectory: 'debug'
        }))
        .pipe(mocha({
            reporter: 'spec'
        }))
        .pipe(cover.report({
            outFile: 'testoutput/chain.html'
        }));
});


