"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("./error");
const invalidActFun = (args) => {
    console.log("[Microplum] '.act' not set in the service entity. Please use setAct method before.");
    throw new error_1.ServerPlumError("'act' service not set.");
};
/**
 * Facade class that can be extended with specific methods.
 */
class PlumFacade {
    constructor(act, args) {
        this.act = (act) ? act : invalidActFun;
        this.args = (args) ? args : {};
    }
}
exports.PlumFacade = PlumFacade;
class ServiceEntity {
    constructor(name, FacadeClass, servicePin) {
        this.name = name;
        this.FacadeClass = FacadeClass;
        this.servicePin = servicePin;
        this.act = invalidActFun;
        this.emptyFacade = (this.FacadeClass) ? new this.FacadeClass() : new PlumFacade();
    }
    setAct(act) {
        this.act = act;
    }
    getAct(user) {
        return (args) => {
            if (user) {
                args.user = args.user || user;
            }
            return this.act(args);
        };
    }
    createFacade(args = {}) {
        return new this.FacadeClass(this.act, args);
    }
    plugin() {
        let addServices = this.addServices.bind(this);
        let addDefaultService = this.addDefaultService.bind(this);
        return function (options) {
            addServices(this, options);
            addDefaultService(this, options);
        };
    }
    publicPin() {
        return { role: this.name };
    }
    addDefaultService(seneca, options) {
        let pin = this.pin(this.name, "*");
        seneca.add(pin, (args) => __awaiter(this, void 0, void 0, function* () {
            console.log(`WARNING: [Microplum] Method is not registered for PIN:${JSON.stringify(pin)}`);
            if (args.nonErrorDefault) {
                return Promise.resolve();
            }
            else {
                throw new error_1.NotAllowedPlumError("Service not found.", { service: pin, args: args });
            }
        }));
    }
    pin(role, cmd, additionalArgs = {}) {
        let pin = Object.assign({}, this.servicePin || {}, additionalArgs);
        pin.role = role;
        pin.cmd = cmd;
        return pin;
    }
}
exports.ServiceEntity = ServiceEntity;
/**
 * CRUD for the entity
 */
class RestEntity extends ServiceEntity {
    addServices(seneca, options) {
        this.addGetServices(seneca);
        this.addStatisticalServices(seneca);
        this.addModifyServices(seneca);
    }
    addGetServices(seneca) {
        if (this.emptyFacade.find) {
            seneca.add(this.pin(this.name, "find", { conditions: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).find(args.conditions); }));
        }
        if (this.emptyFacade.findOne) {
            seneca.add(this.pin(this.name, "findOne", { conditions: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).findOne(args.conditions); }));
        }
        if (this.emptyFacade.findById) {
            seneca.add(this.pin(this.name, "find", { id: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).findById(args.id); }));
        }
    }
    addStatisticalServices(seneca) {
        if (this.emptyFacade.count) {
            seneca.add(this.pin(this.name, "count", { conditions: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).count(args.conditions); }));
        }
    }
    addModifyServices(seneca) {
        if (this.emptyFacade.create) {
            seneca.add(this.pin(this.name, "create", { input: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).create(args.input); }));
        }
        if (this.emptyFacade.update) {
            seneca.add(this.pin(this.name, "updateAll", { conditions: "*", input: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).update(args.conditions, args.input); }));
        }
        if (this.emptyFacade.updateOne) {
            seneca.add(this.pin(this.name, "update", { conditions: "*", input: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).updateOne(args.conditions, args.input); }));
        }
        if (this.emptyFacade.updateById) {
            seneca.add(this.pin(this.name, "update", { id: "*", input: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).updateById(args.id, args.input); }));
        }
        if (this.emptyFacade.remove) {
            seneca.add(this.pin(this.name, "removeAll", { conditions: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).remove(args.conditions); }));
        }
        if (this.emptyFacade.removeOne) {
            seneca.add(this.pin(this.name, "remove", { conditions: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).removeOne(args.conditions); }));
        }
        if (this.emptyFacade.removeById) {
            seneca.add(this.pin(this.name, "remove", { id: "*" }), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).removeById(args.id); }));
        }
        if (this.emptyFacade.clean) {
            seneca.add(this.pin(this.name, "clean"), (args) => __awaiter(this, void 0, void 0, function* () { return this.createFacade(args).clean(); }));
        }
    }
}
exports.RestEntity = RestEntity;

//# sourceMappingURL=entity.js.map
