module.exports = function () {
    var i, matcher,
        retVal = 0;

    for (i = 0; i < 10; i++) {
        matcher = Math.floor(Math.random()*10+0.5);
        if (matcher === i) {
            retVal += 1;
            retVal += 1;
        } else {
            retVal = retVal;
        }
    }
    return retVal;
};
