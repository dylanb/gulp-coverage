module.exports = function () {
    var i,
        retVal = 0;

    for (i = 0; i < 10; i++) {
        if (false) {
            console.log('WOOOOOAHH, wormhole dude\n');
            retVal += 1;
        } else {
            console.log('Does not match\n');
        }
    }
    return retVal;
};
