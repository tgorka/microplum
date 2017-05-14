"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sourceMapSupport = require("source-map-support");
// errors thrown with the typescript files not generated js
sourceMapSupport.install();
var lib_1 = require("./lib");
exports.default = lib_1.SenecaPlum;
var entity_1 = require("./lib/entity");
exports.ServiceEntity = entity_1.ServiceEntity;
exports.RestEntity = entity_1.RestEntity;

//# sourceMappingURL=index.js.map
