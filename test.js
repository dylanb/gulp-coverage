module.exports = function () {
    var i, matcher,
        retVal = 0,
        a = true, b = false;

    // throw new Error('bugger');
    for (i = 0; i < 10; i++) {
        matcher = Math.floor(
            Math.random()*
            10+
            0.5
        );
        if (matcher === i) {
            retVal += 1;
            retVal += 1;
        } else {
            retVal = (retVal > 100 ? retVal + 1 : retVal + 2);
        }
    }
    if (a || b) {
        retVal += 2;
    } else {
        retVal += 1;
    }
    return retVal;
};
