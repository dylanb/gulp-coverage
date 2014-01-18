var gulp = require('gulp'),
    cover = require('./index'),
    mocha = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    exec = require('child_process').exec;


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
    exec('node --debug-brk blnkt.js', {}, function (error, stdout, stderr) {
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

gulp.task('blnkt', function () {
    gulp.src(['src.js', 'src2.js', 'src3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug'
        }))
        .pipe(mocha({
        }))
        .pipe(cover.report({
            outFile: 'coverage.html'
        }));
});

gulp.task('blnkt2', function () {
    gulp.src(['src2.js', 'src3.js'], { read: false })
        .pipe(cover.instrument({
            pattern: ['**/test*'],
            debugDirectory: 'debug'
        }))
        .pipe(mocha({
        }))
        .pipe(cover.report({
            outFile: 'coverage.html'
        }));
});

