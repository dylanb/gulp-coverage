/**
 * Module dependencies.
 */

var fs = require('fs'),
    path = require('path');

/**
 * Expose `'LCOVCov'`.
 */

exports = module.exports = LCOVCov;

function LCOVCov (coverageData, filename) {
    var output = 'TN:gulp-coverage output\n';

    coverageData.files.forEach(function (fileData) {
        var fileOutput = 'SF:' + path.join(process.cwd(), fileData.filename) + '\n',
            instrumented = 0;
        fileOutput += 'BRF:' + fileData.ssoc + '\n';
        fileOutput += 'BRH:' + Math.round(fileData.ssoc * fileData.statements/100) + '\n';
        fileData.source.forEach(function (lineData, index) {
            if (lineData.coverage !== null) {
                instrumented += 1;
                fileOutput += 'DA:' + (index + 1) + ',' + lineData.coverage + '\n';
            }
        });
        fileOutput += 'LH:' + instrumented + '\n';
        fileOutput += 'LF:' + fileData.source.length + '\n';
        fileOutput += 'end_of_record\n';
        output += fileOutput;
    });

    if (!filename) {
        return output;
    } else {
        fs.writeFileSync(filename, output);
    }
}
