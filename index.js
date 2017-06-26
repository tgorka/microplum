"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const sourceMapSupport = require("source-map-support");
// errors thrown with the typescript files not generated js
sourceMapSupport.install();
var lib_1 = require("./lib");
exports.default = lib_1.SenecaPlum;
__export(require("./lib/entity"));
__export(require("./lib/error"));

//# sourceMappingURL=index.js.map
