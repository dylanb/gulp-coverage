// Copyright 2011 Itay Neeman
//
// Licensed under the MIT License

console.log('global.coverageStore: ', global.coverageStore);
(function() {
    global.coverageStore = global.coverageStore || {};
    var coverageStore = global.coverageStore,
        fs = require('fs');
    
    module.exports = {};
    module.exports.register = function(filename) {
        var run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run,
            runDirectory = process.cwd() + '/.coverdata/' + run + '/';

        filename = filename.replace(/[\/|\:|\\]/g, "_");
        if (!coverageStore[filename]) {
            console.log('opening: ', filename);
            coverageStore[filename] = fs.openSync(runDirectory + filename, 'w');
        }
        return coverageStore[filename];
    };
    
    module.exports.getStore = function(filename) {
        var run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run,
            runDirectory = process.cwd() + '/.coverdata/' + run + '/';

        filename = filename.replace(/[\/|\:|\\]/g, "_");
        if (!coverageStore[filename]) {
            coverageStore[filename] = fs.openSync(runDirectory + filename, 'a');
        }
        return coverageStore[filename];
    };
    module.exports.getStoreData = function(filename) {
        var run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run,
            runDirectory = process.cwd() + '/.coverdata/' + run + '/';

        filename = filename.replace(/[\/|\:|\\]/g, "_");
        return fs.readFileSync(runDirectory + filename);
    };
    module.exports.clearStore = function() {
        var filename;
        for (filename in coverageStore) {
            if (coverageStore.hasOwnProperty(filename)) {
                console.log('closing: ', filename);
                fs.closeSync(coverageStore[filename]);
                delete coverageStore[filename];
            }
        }
    };
})();