#gulp-coverage

Gulp coverage reporting for Node.js that is independent of the test runner

#Report

gulp-coverage generates block, line and statement coverage for Node.js JavaScript files. This is equivalent to function, statement, branch and "modified condition/decision" coverage, where a "statement" is equivalent to a "modified condition/decision". The HTML report gives summary information for the block, line and statement covereage across all the files as well as for each file.

For each file, a chain of links is built allowing you to click through from the summary to the first and then all subsequent instances of each type of miss (line misses and statement misses).

![Example Report Showing missed lines, missed statements and chains of links](./screenshots/gulp-coverage.png "Example Report")

The report format has been desiged to be accessible and conformant with WCAG 2 Level AA.

#Example

To instrument and report on a file using Mocha as your test runner:

    mocha = require('gulp-mocha');
    cover = require('gulp-coverage');

    gulp.task('test', function () {
        gulp.src(['src.js', 'src2.js'], { read: false })
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

To instrument and report using Jasmine as your test system:

    jasmine = require('gulp-jasmine');
    cover = require('gulp-coverage');

    gulp.task('jasmine', function () {
        gulp.src('srcjasmine.js')
            .pipe(cover.instrument({
                pattern: ['**/test*'],
                debugDirectory: 'debug'
            }))
            .pipe(jasmine())
            .pipe(cover.report({
                outFile: 'jasmine.html'
            }));
    });


## Instrument

The `instrument` call must be made prior to the `report` call. The test targets must be required only after `instrument` has been called (in the example above, this is done by the mocha test runner).

### options

`pattern` - A multimatch glob pattern or list of glob patterns. The patterns can include match and exclude patterns. In the above example, there are two JavaScript files `test.js` and `test2.js` that are required by the two test files `src.js` and `src2.js`. The `**` will match these files no matter which directory they live in.Patterns are additive while negations (eg ['**/foo*', '!**/bar*']) are based on the current set. Exception is if the first pattern is negation, then it will get the full set, so to match user expectation (eg. ['!**/foo*'] will match everything except a file with foo in its name). Order matters. 

`debugDirectory` - a string pointing to a directory into which the instrumented source will be written. This is useful for debugging gulp-coverage itself

## Report

This will generate the reports for the instrumented files and can only be called after `instrument` has been called.

### options

`outFile` - the name of the file into which the report output will be written

`reporter` - defaults to 'html' - this is the name of the reporter to use. Currently only the HTML reporter is available.

