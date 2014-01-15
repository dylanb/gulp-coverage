module.exports = function () {
    var i,
        retVal = 0;

    for (i = 0; i < 10; i++) {
        if (false) {
            retVal/0;
            retVal += 1;
        } else {
            retVal = retVal;
        }
    }
    return retVal;
};
