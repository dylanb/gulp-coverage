var gulp = require('gulp'),
    cover = require('./index'),
    mocha = require('gulp-mocha'),
    exec = require('child_process').exec;

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
    gulp.src(['src.js', 'src2.js'], { read: false })
        .pipe(cover.instrument({
            filePattern: 'test',
            ignoreFiles: undefined,
            debugDirectory: 'debug'
        }))
        .pipe(mocha({
        }))
        .pipe(cover.report({
            outFile: 'coverage.html'
        }));
});

