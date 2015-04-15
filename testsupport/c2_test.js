var assert = require('assert'),
    test = require('./c2_cov');

describe('Test C2', function () {
    it('SShould just run', function () {
        test();
        assert(true);
    });
});
