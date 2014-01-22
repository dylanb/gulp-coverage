/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * Expose `JSONCov`.
 */

exports = module.exports = JSONCov;

function JSONCov (coverageData, filename) {
    if (!filename) {
        process.stdout.write(JSON.stringify(coverageData));
    } else {
        fs.writeFileSync(filename, JSON.stringify(coverageData));
    }
}
