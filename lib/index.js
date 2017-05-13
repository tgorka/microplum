"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var seneca = require("seneca");
var senecaAmqpTransport = require("seneca-amqp-transport");
var DEFAULT_OPTIONS = {
    version: "v1",
    environment: process.env.NODE_ENV || "production",
    pin: [],
    clientPin: "role:*,cmd:*",
    seneca: {
        log: { level: "info+" },
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
    };
    SenecaPlum.prototype.use = function (component, pin) {
        component.bind(this)(this.options);
        if (pin) {
            this.addPin(pin);
        }
    };
    SenecaPlum.prototype.add = function (pin, cb) {
        this.addBasicProperties(pin);
        this.seneca.add(pin, cb);
        console.log("[Microplum] Registered service for PIN: " + JSON.stringify(pin));
    };
    SenecaPlum.prototype.addPin = function (pin) {
        this.addBasicProperties(pin);
        var realPin = Object.keys(pin)
            .map(function (key) { return key + ":" + pin[key]; })
            .join(",");
        console.log("[Microplum] Register listen for PIN: \"" + realPin + "\"");
        this.options.pin.push(realPin);
    };
    SenecaPlum.prototype.addBasicProperties = function (pin) {
        pin.version = pin.version || this.options.version;
        pin.environment = pin.environment || this.options.environment;
        if (this.options.environment === "dev" && this.options.developer) {
            pin.developer = this.options.developer;
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
