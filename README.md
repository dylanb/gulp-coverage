# gulp-coverage

Gulp coverage reporting for Node.js that is independent of the test runner

# Report

gulp-coverage generates block, line, chainable and statement coverage for Node.js JavaScript files. This is equivalent to function, statement, branch and "modified condition/decision" coverage, where a "statement" is equivalent to a "modified condition/decision". The HTML report gives summary information for the block, line and statement covereage across all the files as well as for each file.

## Chainables
The chainable coverage supports Array-like chainables and will record misses where the chained member calls both receive and result-in an empty array.

## HTML report
For each covered file, a chain of links is built allowing you to click through from the summary to the first and then all subsequent instances of each type of miss (line misses and statement misses).

![Example Report Showing missed lines, missed statements and chains of links](https://raw.githubusercontent.com/dylanb/gulp-coverage/master/screenshots/gulp-coverage.png "Example Report")

The HTML report format has been desiged to be accessible and conformant with WCAG 2 Level AA.

## Excluding code from coverage reporting

To exclude a single line from the coverage report, you can append a comment with the content of "cover:false" to the end of the line.

```
var uncovered = "this line will not be covered"; // cover:false
```

If you would like to exclude a block of code from coverage reporting, then wrap the block in a pair of comments to turn coverage off and then back on. Note that the start and end comments should be at the same indent level or the outcome will not be what you expect. To turn off the coverage, put the text "#JSCOVERAGE_IF" into a comment. To turn it back on, use a comment with one of the following texts "#JSCOVERAGE_IF 0", or "#JSCOVERAGE_ENDIF".

```
var covered = "this line is covered";
//#JSCOVERAGE_IF
if (false) {
  // this code will never be covered
  console.log("Why does nobody listen to me?!?!?");
}
//#JSCOVERAGE_ENDIF
var alsoCovered = "this line is also covered";
```

# Example

To instrument and report on a file using Mocha as your test runner:

```js
    mocha = require('gulp-mocha');
    cover = require('gulp-coverage');

    gulp.task('test', function () {
        return gulp.src(['src.js', 'src2.js'], { read: false })
                .pipe(cover.instrument({
                    pattern: ['**/test*'],
                    debugDirectory: 'debug'
                }))
                .pipe(mocha())
                .pipe(cover.gather())
                .pipe(cover.format())
                .pipe(gulp.dest('reports'));
    });
```

To instrument and report using Jasmine as your test system:

```js
    jasmine = require('gulp-jasmine');
    cover = require('gulp-coverage');

    gulp.task('jasmine', function () {
        return gulp.src('srcjasmine.js')
                .pipe(cover.instrument({
                    pattern: ['**/test*'],
                    debugDirectory: 'debug'
                }))
                .pipe(jasmine())
                .pipe(cover.gather())
                .pipe(cover.format())
                .pipe(gulp.dest('reports'));
    });
```

## Tasks

There are five different tasks, `instrument`, `gather`, `report`, `format` and `enforce`. The `instrument` task must be run before any of the others can be called and either the `gather`, or the `report` task must be run before the `enforce` or the `format` task can be run. Enforce can follow `format` and should be run last if you want the reports generated even when the thresholds have not been met.

After the `instrument` call, the target files must be required and executed (preferably using some sort of test runner such as gulp-mocha or gulp-jasmine). This will allow the instrumentation to capture the required data (in the example above, this is done by the mocha test runner).

The gulp-coverage `gather` task will NOT pass any of the original stream files to the subsequent tasks. It must therefore be called after all other stream transformations have occurred.

## The Instrument task

### options

`pattern` - A multimatch glob pattern or list of glob patterns. The globa patterns are relative to the CWD of the process running the gulp file. The pattern `'index.js'` will match the index.js file in the same directory as the gulpfile. Globs for file relative to this directory may contain the './'. For example `'./index.js'` is equivalent to `'index.js'` (you can also use `'**/index.js'` to match this file but this will match any other index.js files within the project's directory structure).

The patterns can include match and exclude patterns. In the Mocha and Jasmine examples shown above, there are two JavaScript files `test.js` and `test2.js` that are required by the two test files `src.js` and `src2.js`. The `**` will match these files no matter which directory they live in. Patterns are additive while negations (eg ['**/foo*', '!**/node_modules/**/*']) are based on the current set. Exception is if the first pattern is negation, then it will get the full set, so to match user expectation (eg. ['!**/foo*'] will match everything except a file with foo in its name). Order matters. 

`debugDirectory` - a string pointing to a directory into which the instrumented source will be written. This is useful for debugging gulp-coverage itself

## The Gather Task

The gather task will collate all of the collected data and form this data into a JSON structure that will be placed into the Gulp task stream. It will not pass the original stream files into the stream, so gather cannot be used before another Gulp task that requires the original stream contents.

The format of the JSON structure is a Modified LCOV format. The format has been modified to make it much easier for a template engine like JADE or HAML to generate decorated source code output.

### The Modified LCOV JSON format

```
  lcov : {
         sloc: Integer - how many source lines of code there were in total
         ssoc: Integer - how many statements of code there were in total
         sboc: Integer - how many blocks of code there were in total
         coverage: Float - percentage of lines covered
         statements: Float - percentage of statements covered
         blocks: Float: percentage of blocks covered
         files: Array[Object] - array of information about each file
         uncovered: Array[String] - array of the files that match the pattern but were not tested at all
  }
```

Each `file` has the following structure

```
  file : {
         filename: String - the file
         basename: String - the file short name
         segments: String - the file's directory
         coverage: Float - the percentage of lines covered
         statements: Float - the percentage of statements covered
         blocks: Float - the percentage of blocks covered
         source: Array[Object] - array of objects, one for each line of code
         sloc: Integer - the number of lines of code
         ssoc: Integer - the number of statements of code
         sboc: Integer - the number of blocks of code
  }
```

Source contains `line` objects which have the following structure
```
  line : {
         count: Integer - number of times the line was hit
         statements: Float - the percentage of statements covered
         segments: Array[Object] - the segments of statements that make up the line
  }
```

Each statement `segment` has the following structure
```
  segment : {
       code: String - the string of code for the segment
       count: Integer - the hit count for the segment
  }
```

## The Enforce Task

The `enforce` task can be used to emit an error (throw an exception) when the overall coverage values fall below your specified thresholds. The default thesholds are 100% for all metrics. This task is useful if you would like the Gulp task to fail in a way that your CI or build system can easily detect.

### options

If you would like to specify thresholds lower than 100%, pass in the thresholds in the first argument to the task. The defaults are:

```
  options : {
      statements: 100,
      blocks: 100,
      lines: 100,
      uncovered: undefined
  }
```

If uncovered is undefined, no threshold will be defined, otherwise it must be an integer of the number of files that are allowed to not be covered. Setting this to 0 will enforce that there are no uncovered files that match the patterm passed into the instrument task.

## The Format Task

The `format` task can be used to generate a textual, formatted version of the coverage data and emit this to the Gulp stream. By default, it will call the 'html' formatter (currently only `'html'` and `'json'` are supported). It will add the formatted text the stream. After calling both `gather` and `format`, the stream will contain a vinyl file with an additional attribute called `coverage`, that contains the JSON formatted data.

The coverage file will be called "coverage.{reporter}" by default and can be output to the disk using gulp.dest(). if the reporter is `'html'`, then it will be "coverage.html" and if the reporter is `'json'`, then it will be "coverage.json".

You must call `gather` prior to calling `format`.

### options

The task takes one optional argument that is either an object that contains the options, or is an array of objects that contain options. If the argument is an array, then two vinyl files will be created and added to the gulp stream. 

There are 2 options, here are the default values:

```
  {
    reporter: 'html',
    outFile: 'coverage.html'
  }
```

Calling format with the following arguments will all create two vinyl files in the gulp stream that have a path of coverage.html and coverage.json respectively:

#### Multiple Formats Example 1

```
  [ { reporter: 'html' }, { reporter: 'json' } ]
```

#### Multiple Formats Example 2

```
  [ { reporter: 'html', outFile: 'coverage.html' }, { reporter: 'json', outFile: 'coverage.json' } ]
```

#### Multiple Formats Example 3

```
  [ 'html', 'json']
```

## The Report Task (Deprecated)

This task is deprecated because it does not support the gulp.dest task and will probably be removed before the first 1.0.0 release. Use [The Gather Task](#the-gather-task) and [The Format Task](#the-format-task) instead.

Report will generate the reports for the instrumented files and can only be called after `instrument` has been called. It will also change the stream content for the tasks and pass through the LCOV JSON data so that the enforce task can be run.

### options

`outFile` - the name of the file into which the report output will be written

`reporter` - defaults to 'html' - this is the name of the reporter to use. Currently there are an HTML reporter ('html') and a JSON ('json') reporter.

