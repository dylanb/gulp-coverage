#gulp-coverage

Gulp coverage reporting for Node.js that is independent of the test runner

#Example

To instrument and report on a file using Mocha as your test runner:

    cover = require('gulp-coverage');

    gulp.task('test', function () {
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

## Instrument

The `instrument` call must be made prior to the `report` call. The test targets must be required only after `instrument` has been called (in the example above, this is done by the mocha test runner).

### options

    filePattern - if this regular expression matches the file being required, then that file will be instrumented and reported-on. In the above example, there are two JavaScript files `test.js` and `test2.js` that are required by the two test files `src.js` and `src2.js`

    ignoreFiles - an array of full path names to files that should be ignored regardless of whether they match the pattern

    debugDirectory - a string pointing to a directory into which the instrumented source will be written. This is useful for debugging gulp-coverage itself

## Report

This will generate the reports for the instrumented files and can only be called after `instrument` has been called.

### options

    outFile - the name of the file into which the output will be written

    reporter - defaults to 'html' - this is the name of the reporter to use. Currently only the HTML reporter is available.

