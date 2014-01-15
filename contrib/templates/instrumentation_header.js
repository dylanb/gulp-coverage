
// Instrumentation Header
{
    var fs = require('fs');
    var <%= instrumented.names.statement %>, <%= instrumented.names.expression %>, <%= instrumented.names.block %>;
    var store = require('<%= coverageStorePath %>');
    var fd = store.register('<%= filename %>');
    
    <%= instrumented.names.statement %> = function(i) {
        fs.writeSync(fd, '{"statement": {"node": ' + i + '}},\n');
    }; 
    
    <%= instrumented.names.expression %> = function(i) {
        fs.writeSync(fd, '{"expression": {"node": ' + i + '}},\n');
    }; 
    
    <%= instrumented.names.block %> = function(i) {
        fs.writeSync(fd, '{"block": ' + i + '},\n');
    }; 
};
////////////////////////

// Instrumented Code
<%= source %>