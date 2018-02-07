"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var error_1 = require("./error");
exports.invalidActFun = function (args) {
    console.log("[Microplum] '.act' not set in the service entity. Please use setAct method before.");
    throw new error_1.ServerPlumError("'act' service not set.");
};
/**
 * Facade class that can be extended with specific methods.
 */
var PlumFacade = /** @class */ (function () {
    function PlumFacade(act, args) {
        this.act = (act) ? act : exports.invalidActFun;
        this.args = (args) ? args : {};
    }
    return PlumFacade;
}());
exports.PlumFacade = PlumFacade;

//# sourceMappingURL=model.js.map
