var Chainable = require('./chainable');

module.exports = function () {
    var str = '473628742687';
    var f = function () {};

    // Chanable function
    f.func = function () {return this};
    f.func().func();

    // Chainable object
    chain = new Chainable();
    chain.find('zack').format({middle: false}).remove(0, 1).write();

    // non-object method call (looks like a chainable from a syntax tree perspective)
    str = str.substr(0, 2);

    Math.floor(
        Math.random()*
        10+
        0.5
    );
    return chain;
};

