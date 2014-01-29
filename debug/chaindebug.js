var instrument = require('../contrib/instrument'),
    fs = require('fs'),
    src = fs.readFileSync('./testsupport/chain.js').toString(),
    inst;

inst = instrument(src);
