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
        return JSON.stringify(coverageData, null, ' ');
    } else {
        fs.writeFileSync(filename, JSON.stringify(coverageData, null, ' '));
    }
}
