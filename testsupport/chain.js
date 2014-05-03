var Chainable = require('./chainable');

module.exports = function () {
    var str = '473628742687';
    chain = new Chainable();
    chain.find('zack').format({middle: false}).remove(0, 1).write();

    str = str.substr(0, 2);
    Math.floor(
        Math.random()*
        10+
        0.5
    );
    return chain;
};

