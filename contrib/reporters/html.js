/**
 * Module dependencies.
 */

var fs = require('fs'),
	path = require('path');

/**
 * Expose `HTMLCov`.
 */

exports = module.exports = HTMLCov;

function HTMLCov (coverageData, filename) {
	var jade = require('jade'), 
		file = path.join(__dirname, 'templates', 'coverage.jade'),
		str = fs.readFileSync(file, 'utf8'),
		fn = jade.compile(str, { filename: file }),
		output = fn({
			cov: coverageData,
			coverageClass: coverageClass,
			coverageCategory: coverageCategory
		});
	if (!filename) {
		return output;
	} else {
		fs.writeFileSync(filename, output);
	}
}

function coverageCategory(line) {
	return line.coverage === 0 ?
				'miss' :
				(line.statements ?
					'hit ' + (line.statements.toFixed(0) != 100 ? 'partial' : '')
					: '');
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
