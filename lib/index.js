"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var seneca = require("seneca");
var senecaAmqpTransport = require("seneca-amqp-transport");
var error_1 = require("./error");
/**
 * get current environment value
 */
var currentEnvironment = function () { return process.env.NODE_ENV || "production"; };
/**
 * Default options value for the microplum
 * @type {DefaultConfig}
 */
var DEFAULT_OPTIONS = {
    version: 1,
    subversion: 0,
    revision: 0,
    environment: currentEnvironment(),
    pin: [],
    clientPin: "provider:*,version:*,subversion:*,revision:*,role:*,environment:" + currentEnvironment(),
    seneca: {
        log: "standard",
        transport: {},
        timeout: 5000
    },
};
var SenecaPlum = (function () {
    function SenecaPlum(options) {
        this.options = options;
        this.options = _.merge(DEFAULT_OPTIONS, options);
        this.options.seneca.transport.msgprefix = this.options.seneca.transport.msgprefix || this.options.app;
        this.initSeneca();
    }
    SenecaPlum.prototype.close = function () {
        this.seneca.close();
        console.log("[Microplum] Closing the connections.");
    };
    SenecaPlum.prototype.listen = function () {
        this.seneca.listen({
            type: "amqp",
            pin: this.options.pin,
            url: this.options.amqpUrl
        });
    };
    /**
     * Set-up seneca connection
     */
    SenecaPlum.prototype.client = function () {
        this.seneca.client({
            type: 'amqp',
            pin: this.options.clientPin,
            url: this.options.amqpUrl
        });
        console.log("[Microplum] Registered client for PIN: " + this.options.clientPin);
    };
    SenecaPlum.prototype.act = function (pin, respond) {
        this.addBasicProperties(pin);
        this.addAdditionalProperties(pin);
        this.seneca.act(pin, respond);
    };
    SenecaPlum.prototype.actPromise = function (pin, user) {
        var _this = this;
        console.log("[Microplum] CALL => " + JSON.stringify(pin));
        if (user) {
            pin.user = user;
        }
        if (user && (user.id || user.sub)) {
            pin.userId = (user.id) ? user.id : "" + (user.iss || "") + (user.sub || "");
        }
        if (user && user.name) {
            pin.userName = user.name;
        }
        return new Promise(function (resolve, reject) {
            _this.act(pin, function (err, data) {
                if (err) {
                    console.error("[Microplum] <= " + JSON.stringify(pin), err);
                    return reject(error_1.transformSenecaError(err));
                }
                else {
                    console.log("[Microplum] ANSWER [status:" + ((data) ? data.status : '') + "] <= " + JSON.stringify(pin));
                    if (data && typeof data.status === "boolean") {
                        if (data.status) {
                            return resolve(data.data);
                        }
                        else if (data.error) {
                            return reject(data.error);
                        }
                        else {
                            return reject(data);
                        }
                    }
                    else {
                        console.log("[Microplum] ANSWER unknown type: resolving data");
                        return resolve(data);
                    }
                }
            });
        });
    };
    SenecaPlum.prototype.useService = function (service, pin) {
        service.setAct(this.actPromise.bind(this));
        this.use(service.plugin(), pin || service.publicPin());
    };
    SenecaPlum.prototype.use = function (component, pin) {
        component.bind(this)(this.options);
        if (pin) {
            this.addPin(pin);
        }
    };
    SenecaPlum.prototype.add = function (pin, cb) {
        pin = this.addBasicProperties(pin);
        pin = this.addAdditionalProperties(pin);
        this.seneca.add(pin, this.encloseCallback(cb));
        console.log("[Microplum] Registered service for PIN: " + JSON.stringify(pin));
    };
    SenecaPlum.prototype.escapeDoc = function (doc) {
        var _this = this;
        if (Array.isArray(doc)) {
            return doc.map(function (docElement) { return _this.escapeDoc(docElement); });
        }
        else if (doc && doc.toObject) {
            return doc.toObject();
        }
        else if (doc) {
            return doc;
        }
        else {
            return null;
        }
    };
    SenecaPlum.prototype.encloseCallback = function (cb) {
        var _this = this;
        return (function (pin, done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, _c, err_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        _a = done;
                        _b = [null];
                        _c = this.escapeDoc;
                        return [4 /*yield*/, cb(pin)];
                    case 1:
                        _a.apply(void 0, _b.concat([_c.apply(this, [_d.sent()])]));
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _d.sent();
                        done(err_1);
                        throw err_1;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    SenecaPlum.prototype.addPin = function (pin) {
        pin = this.addBasicProperties(pin);
        pin.provider = "*";
        var realPin = Object.keys(pin)
            .filter(function (key) { return pin[key] !== undefined; })
            .map(function (key) { return key + ":" + pin[key]; })
            .join(",");
        console.log("[Microplum] Register listen for PIN: \"" + realPin + "\"");
        this.options.pin.push(realPin);
    };
    SenecaPlum.prototype.addBasicProperties = function (pin) {
        pin.provider = pin.provider || this.options.provider || this.options.app;
        pin.version = pin.version || this.options.version;
        pin.subversion = pin.subversion || this.options.subversion;
        pin.revision = pin.revision || this.options.revision;
        pin.environment = pin.environment || this.options.environment;
        return pin;
    };
    SenecaPlum.prototype.addAdditionalProperties = function (pin) {
        if (this.options.debugUserId) {
            pin.userId = this.options.debugUserId;
        }
        return pin;
    };
    /**
     * Set-up seneca with all the middleware libraries.
     */
    SenecaPlum.prototype.initSeneca = function () {
        this.seneca = seneca(this.options.seneca);
        this.seneca.use(senecaAmqpTransport);
    };
    return SenecaPlum;
}());
exports.SenecaPlum = SenecaPlum;

//# sourceMappingURL=index.js.map
