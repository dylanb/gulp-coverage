module.exports = function () {
    var i, matcher,
        retVal = 0;

    for (i = 0; i < 10; i++) {
        matcher = Math.floor(Math.random()*10+0.5);
        if (matcher === i) {
            console.log('Matches 10% chance :-)\n');
            retVal += 1;
        } else {
            console.log('Does not match\n');
        }
    }
    return retVal;
};
