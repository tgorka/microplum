"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DEFAULT_OPTIONS = {
    version: "v1",
    environment: process.env.NODE_ENV || "production"
};
var Seneca = (function () {
    function Seneca(seneca, options, pin) {
        if (options === void 0) { options = {}; }
        if (pin === void 0) { pin = []; }
        this.seneca = seneca;
        this.options = options;
        this.pin = pin;
        this.util = seneca.util;
        /**
         * Default options
         */
        this.options = this.util.deepextend(DEFAULT_OPTIONS, options);
        this.seneca.add("role:a,cmd:b", function (args, done) {
            console.log('run abc', JSON.stringify(args));
            done(null, { msg: "done" });
        });
        this.pin.push("role:*");
        /*require( 'seneca' )()
         .use( 'customPlugin' )
         .listen()*/
    }
    Seneca.prototype.use = function (component, pin) {
        component.bind(this)(this.options);
        if (pin) {
            this.usePin(pin);
        }
    };
    Seneca.prototype.add = function (pin, cb) {
        pin.version = pin.version || this.options.version;
        pin.environment = pin.environment || this.options.environment;
        this.seneca.add(pin, cb);
        console.log("[Seneca] Registered service for PIN: " + JSON.stringify(pin));
    };
    Seneca.prototype.usePin = function (pin) {
        this.pin.push(pin);
        pin.version = pin.version || this.options.version;
        pin.environment = pin.environment || this.options.environment;
        if (this.options.environment === "dev" && this.options.developer) {
            pin.developer = this.options.developer;
        }
        var realPin = Object.keys(pin)
            .map(function (key) { return key + ":" + pin[key]; })
            .join(",");
        console.log("[Seneca] Register listen for PIN: \"" + realPin + "\"");
        this.pin.push(realPin);
    };
    return Seneca;
}());
exports.Seneca = Seneca;

//# sourceMappingURL=seneca.js.map
