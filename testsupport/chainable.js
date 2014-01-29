var inherits = require('util').inherits;
var extend = require('extend');

var Chainable = function() {
};

inherits(Chainable, Array);

var dataBase = [
    'karin eichmann',
    'dylan barrell',
    'john smith',
    'laurel a. neighbor',
    'donny evans',
    'julie y. jankowicz',
    'zack pearlfisher'];

Chainable.prototype.find = function(qTerm) {
    var q = qTerm.toLowerCase();
    dataBase.forEach(function(item) {
        if (item.indexOf(q) !== -1) {
            this.push(item);
        }
    }, this);
    return this;
};

Chainable.prototype.remove = function(index, number) {
    if (index !== -1) {
        this.splice(index, number !== undefined ? number : 1);
    }
    return this;
};

Chainable.prototype.format = function(options) {
    var defaultOptions = {
        first: true,
        last: true,
        middle : true
    };
    extend(defaultOptions, options);
    this.forEach(function(item, index) {
        var arr = item.trim().split(' '),
            i;
        if (defaultOptions.middle && arr.length > 2) {
            for (i = 1; i < arr.length - 1; i++) {
                arr[i] = arr[i][0].toUpperCase() + arr[i].substring(1);
            }
        }
        if (defaultOptions.first) {
            arr[0] = arr[0][0].toUpperCase() + arr[0].substring(1);
        }
        if (defaultOptions.last) {
            arr[arr.length - 1] = arr[arr.length - 1][0].toUpperCase() + arr[arr.length - 1].substring(1);
        }
        this[index] = arr.join(' ');
    }, this);
    return this;
};

Chainable.prototype.write = function() {
    // noop
    return this;
};


module.exports = Chainable;
