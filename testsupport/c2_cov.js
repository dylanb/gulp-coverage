module.exports = function () {
	var a = false, b = false;

	if (a && b) {
		console.log('a && b');
	}

	a = true;

	if (a && b) {
		console.log('a && b');
	}

	b = true;
	a = false;

	if (a && b) {
		console.log('a && b');
	}

	a = true;
	b = true;

	if (a && b) {
		console.log('a && b');
	}
};
