module.exports = function () {
    var i, matcher,
        retVal = 0;

    // throw new Error('bugger');
    for (i = 0; i < 10; i++) {
        matcher = Math.floor(Math.random()*10+0.5);
        if (matcher === i) {
            retVal += 1;
            retVal += 1;
        } else {
            retVal = (retVal > 100 ? retVal + 1 : retVal + 2);
        }
    }
    return retVal;
};
