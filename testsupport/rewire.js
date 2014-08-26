var assert = require('assert'),
    rewire = require('rewire'),
    myModule = rewire('./myModule');

describe('Test Rewire', function () {
    var called = false;
    myModule.__set__('myLocalGlobal', function () {
        called = true;
    })
    it('Should rewire the function and call the rewired function', function () {
        myModule.myFunction();
        assert.ok(called);
    });
});
