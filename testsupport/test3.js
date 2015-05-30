"use strict";

var AlertController = function () {
    this.count = 0;
};

AlertController.prototype = {
    /**
     * Comment
     */
    show: function () {
        this.count++;
        return this.count;
    },

    /**
     * comment
     */
    hide: function () {
        this.count--;
        return this.count;
    }
};

// to pull into node namespace if included
if (typeof module !== "undefined" && module.exports !== undefined) {
    module.exports = AlertController;
}
