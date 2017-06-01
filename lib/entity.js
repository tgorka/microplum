"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var error_1 = require("./error");
var ServiceEntity = (function () {
    function ServiceEntity(name, facade, servicePin) {
        this.name = name;
        this.facade = facade;
        this.servicePin = servicePin;
        this.act = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            console.log("[Microplum] '.act' not set in the service entity. Please use setAct method before.");
            throw new Error("'.act' service not found.");
        };
    }
    ServiceEntity.prototype.setAct = function (act) {
        this.act = act;
    };
    ServiceEntity.prototype.getAct = function (user) {
        var _this = this;
        return function (args) {
            if (user) {
                args.user = args.user || user;
            }
            return _this.act(args);
        };
    };
    ServiceEntity.prototype.plugin = function () {
        var addServices = this.addServices.bind(this);
        var addDefaultService = this.addDefaultService.bind(this);
        return function (options) {
            addServices(this, options);
            addDefaultService(this, options);
        };
    };
    ServiceEntity.prototype.publicPin = function () {
        return { role: this.name };
    };
    ServiceEntity.prototype.addDefaultService = function (seneca, options) {
        var _this = this;
        seneca.add(this.publicPin(), this.handleService(function (args) {
            console.log("[Microplum] Invalid arguments witm MSG", JSON.stringify(args));
            return Promise.resolve({
                status: false,
                code: 404,
                msg: "Unknown service from " + _this.publicPin()
            });
        }));
    };
    ;
    ServiceEntity.prototype.pin = function (role, cmd) {
        var pin = Object.assign({}, this.servicePin || {});
        pin.role = role;
        pin.cmd = cmd;
        return pin;
    };
    ServiceEntity.prototype.handleService = function (cb) {
        var escapeDoc = this.escapeDoc.bind(this);
        return function (args, done) {
            cb(args)
                .then(function (doc) { return done(null, { status: true, data: escapeDoc(doc) }); })
                .catch(function (err) {
                if (err instanceof error_1.PlumError) {
                    done(null, { status: false, error: err });
                }
                else {
                    done(err);
                }
            });
        };
    };
    ServiceEntity.prototype.escapeDoc = function (doc) {
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
    return ServiceEntity;
}());
exports.ServiceEntity = ServiceEntity;
/**
 * CRUD for the entity
 */
var RestEntity = (function (_super) {
    __extends(RestEntity, _super);
    function RestEntity() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RestEntity.prototype.addServices = function (seneca, options) {
        this.addGetServices(seneca);
        this.addStatisticalServices(seneca);
        this.addModifyServices(seneca);
    };
    RestEntity.prototype.addGetServices = function (seneca) {
        var _this = this;
        if (this.facade.find) {
            seneca.add(this.pin(this.name, "find"), this.handleService(function (args) { return _this.facade.find(args.conditions); }));
        }
        if (this.facade.findOne) {
            seneca.add(this.pin(this.name, "findOne"), this.handleService(function (args) { return _this.facade.findOne(args.conditions); }));
        }
        if (this.facade.findById) {
            seneca.add(this.pin(this.name, "findById"), this.handleService(function (args) { return _this.facade.findById(args.id); }));
        }
    };
    RestEntity.prototype.addStatisticalServices = function (seneca) {
        var _this = this;
        if (this.facade.count) {
            seneca.add(this.pin(this.name, "count"), this.handleService(function (args) { return _this.facade.count(args.conditions); }));
        }
    };
    RestEntity.prototype.addModifyServices = function (seneca) {
        var _this = this;
        if (this.facade.create) {
            seneca.add(this.pin(this.name, "create"), this.handleService(function (args) { return _this.facade.create(args.input); }));
        }
        if (this.facade.update) {
            seneca.add(this.pin(this.name, "update"), this.handleService(function (args) { return _this.facade.update(args.conditions, args.input); }));
        }
        if (this.facade.remove) {
            seneca.add(this.pin(this.name, "remove"), this.handleService(function (args) { return _this.facade.remove(args.id); }));
        }
    };
    return RestEntity;
}(ServiceEntity));
exports.RestEntity = RestEntity;

//# sourceMappingURL=entity.js.map
