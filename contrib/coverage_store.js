// Copyright 2011 Itay Neeman
//
// Licensed under the MIT License
(function() {
    global.coverageStore = global.coverageStore || {};
    var coverageStore = global.coverageStore,
        fs = require('fs');
    
    module.exports = {};
    module.exports.register = function(filename) {
        var run = JSON.parse(fs.readFileSync(process.cwd() + '/.coverrun')).run,
            runDirectory = process.cwd() + '/.coverdata/' + run + '/';

        filename = filename.replace(/[\/|\:|\\]/g, "_");
        if (!coverageStore[filename] || !fs.existsSync(runDirectory + filename)) {
            if (coverageStore.hasOwnProperty(filename)) {
                fs.closeSync(coverageStore[filename]);
                coverageStore[filename] = undefined;
                delete coverageStore[filename];
            }
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
                fs.closeSync(coverageStore[filename]);
                coverageStore[filename] = undefined;
                delete coverageStore[filename];
            }
        }
    };
})();