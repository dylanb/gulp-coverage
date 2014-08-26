var myLocalGlobal = function () {};

// Calls myLocalGlobal
exports.myFunction = function () {
    myLocalGlobal();
}
