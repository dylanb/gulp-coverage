var Chainable = require('./chainable');

module.exports = function () {
    chain = new Chainable();
    chain.find('zack').format({middle: false}).remove(0, 1).write();

    Math.floor(
        Math.random()*
        10+
        0.5
    );
};

