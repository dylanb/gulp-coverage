module.exports = function () {
    var i,
        retVal = 0;

    for (i = 0; i < 10; i++) {
        if (false) {
            retVal/0;
            retVal += 1;
            //#JSCOVERAGE_IF
            retVal += 2;
            //#JSCOVERAGE_ENDIF
        } else {
            retVal = retVal;
        }
    }
    return retVal;
};
var uncovered = true; //cover:false
//#JSCOVERAGE_IF
if (false) {
    var retVal = 19;
}
//#JSCOVERAGE_IF 0
//#JSCOVERAGE_IF
if (false) {
    retVal += 1;
}
if (false) {
    retVal += 1;
}
if (false) {
    retVal += 1;
}