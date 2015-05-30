var assert = require('assert'),
    Controller = require('./test3');

describe('Test AlertController', function () {
    it('Should work', function () {
        var c = new Controller();
        assert.equal(c.show(), 1);
        assert.equal(c.hide(), 0);
    });
});
