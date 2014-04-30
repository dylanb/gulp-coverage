var assert = require('assert'),
    test = require('./chain');

describe('Test Src', function () {
    it('Should run this test for the chainable and not find an enumerable __instrumented_miss attribute on the object', function () {
        var chain = test(),
            props = [],
            i;
        for(i in chain) {
            props[i] = true;
        }
        assert.ok(chain.hasOwnProperty('__instrumented_miss'));
        assert.ok(!props['__instrumented_miss']);
    });
});
