
// Instrumentation Header
{
    var fs = require('fs');
    var <%= instrumented.names.statement %>, <%= instrumented.names.expression %>, <%= instrumented.names.block %>;
    var store = require('<%= coverageStorePath %>');
    
    <%= instrumented.names.statement %> = function(i) {
        var fd = store.register('<%= filename %>');
        fs.writeSync(fd, '{"statement": {"node": ' + i + '}},\n');
    }; 
    
    <%= instrumented.names.expression %> = function(i) {
        var fd = store.register('<%= filename %>');
        fs.writeSync(fd, '{"expression": {"node": ' + i + '}},\n');
    }; 
    
    <%= instrumented.names.block %> = function(i) {
        var fd = store.register('<%= filename %>');
        fs.writeSync(fd, '{"block": ' + i + '},\n');
    }; 
    <%= instrumented.names.intro %> = function(id, obj) {
        // console.log('__intro: ', id, ', obj.__instrumented_miss: ', obj.__instrumented_miss, ', obj.length: ', obj.length);
        (typeof obj === 'object' || typeof obj === 'function') &&
            Object.defineProperty && Object.defineProperty(obj, '__instrumented_miss', {enumerable: false, writable: true});
        obj.__instrumented_miss = obj.__instrumented_miss || [];
        if ('undefined' !== typeof obj && null !== obj && 'undefined' !== typeof obj.__instrumented_miss) {
            if (obj.length === 0) {
                // console.log('interim miss: ', id);
                obj.__instrumented_miss[id] = true;
            } else {
                obj.__instrumented_miss[id] = false;
            }
        }
        return obj;
    };
    function isProbablyChainable(obj, id) {
        return obj &&
            obj.__instrumented_miss[id] !== undefined &&
            'number' === typeof obj.length;
    }
    <%= instrumented.names.extro %> = function(id, obj) {
        var fd = store.register('<%= filename %>');
        // console.log('__extro: ', id, ', obj.__instrumented_miss: ', obj.__instrumented_miss, ', obj.length: ', obj.length);
        if ('undefined' !== typeof obj && null !== obj && 'undefined' !== typeof obj.__instrumented_miss) {
            if (isProbablyChainable(obj, id) && obj.length === 0 && obj.__instrumented_miss[id]) {
                // if the call was not a "constructor" - i.e. it did not add things to the chainable
                // and it did not return anything from the chainable, it is a miss
                // console.log('miss: ', id);
            } else {
                fs.writeSync(fd, '{"chain": {"node": ' + id + '}},\n');
            }
            obj.__instrumented_miss[id] = undefined;
        } else {
            fs.writeSync(fd, '{"chain": {"node": ' + id + '}},\n');
        }
        return obj;
    };
};
////////////////////////

// Instrumented Code
<%= source %>