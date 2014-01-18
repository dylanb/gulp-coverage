/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * Expose `HTMLCov`.
 */

exports = module.exports = HTMLCov;

function HTMLCov (coverageData, filename) {
	var jade = require('jade'), 
		file = __dirname + '/templates/coverage.jade',
		str = fs.readFileSync(file, 'utf8'),
		fn = jade.compile(str, { filename: file }),
		output = fn({
			cov: coverageData,
			coverageClass: coverageClass
		});
	if (!filename) {
		process.stdout.write();
	} else {
		fs.writeFileSync(filename, output);
	}
}

function coverageClass (n) {
	if (n >= 75) {
		return 'high';
	}
	if (n >= 50) {
		return 'medium';
	}
	if (n >= 25) {
		return 'low';
	}
	return 'terrible';
}
