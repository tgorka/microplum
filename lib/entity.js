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
var ServiceEntity = (function () {
    function ServiceEntity(name, facade, servicePin) {
        this.name = name;
        this.facade = facade;
        this.servicePin = servicePin;
    }
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
                .then(function (doc) { return done(null, escapeDoc(doc)); })
                .catch(function (err) { return done(err); });
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
        var _this = this;
        seneca.add(this.pin(this.name, "find"), this.handleService(function (args) { return _this.facade.find(args.conditions); }));
        seneca.add(this.pin(this.name, "findOne"), this.handleService(function (args) { return _this.facade.findOne(args.conditions); }));
        seneca.add(this.pin(this.name, "findById"), this.handleService(function (args) { return _this.facade.findById(args.id); }));
        seneca.add(this.pin(this.name, "create"), this.handleService(function (args) { return _this.facade.create(args.input); }));
        seneca.add(this.pin(this.name, "update"), this.handleService(function (args) { return _this.facade.update(args.conditions, args.input); }));
        seneca.add(this.pin(this.name, "remove"), this.handleService(function (args) { return _this.facade.remove(args.id); }));
    };
    return RestEntity;
}(ServiceEntity));
exports.RestEntity = RestEntity;

//# sourceMappingURL=entity.js.map
