"use strict";
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
        seneca.add(pin, async (args) => {
            console.log(`WARNING: [Microplum] Method is not registered for PIN:${JSON.stringify(pin)}`);
            if (args.nonErrorDefault) {
                return Promise.resolve();
            }
            else {
                throw new error_1.NotAllowedPlumError("Service not found.", { service: pin, args: args });
            }
        });
    }
    pin(role, cmd, additionalArgs = {}) {
        let pin = Object.assign({}, this.servicePin || {}, additionalArgs);
        pin.role = role;
        pin.cmd = cmd;
        return pin;
    }
}
exports.ServiceEntity = ServiceEntity;
class SeedEntity extends ServiceEntity {
    addServices(seneca, options) {
        if (this.emptyFacade.reset) {
            seneca.add(this.pin(this.name, "reset"), async (args) => this.createFacade(args).reset(args.seed));
        }
        if (this.emptyFacade.seed) {
            seneca.add(this.pin(this.name, "seed"), async (args) => this.createFacade(args).seed());
        }
    }
}
exports.SeedEntity = SeedEntity;
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
            seneca.add(this.pin(this.name, "find", { conditions: "*" }), async (args) => this.createFacade(args).find(args.conditions));
        }
        if (this.emptyFacade.findOne) {
            seneca.add(this.pin(this.name, "findOne", { conditions: "*" }), async (args) => this.createFacade(args).findOne(args.conditions));
        }
        if (this.emptyFacade.findById) {
            seneca.add(this.pin(this.name, "find", { id: "*" }), async (args) => this.createFacade(args).findById(args.id));
        }
    }
    addStatisticalServices(seneca) {
        if (this.emptyFacade.count) {
            seneca.add(this.pin(this.name, "count", { conditions: "*" }), async (args) => this.createFacade(args).count(args.conditions));
        }
    }
    addModifyServices(seneca) {
        if (this.emptyFacade.create) {
            seneca.add(this.pin(this.name, "create", { input: "*" }), async (args) => this.createFacade(args).create(args.input));
        }
        if (this.emptyFacade.update) {
            seneca.add(this.pin(this.name, "updateAll", { conditions: "*", input: "*" }), async (args) => this.createFacade(args).update(args.conditions, args.input));
        }
        if (this.emptyFacade.updateOne) {
            seneca.add(this.pin(this.name, "update", { conditions: "*", input: "*" }), async (args) => this.createFacade(args).updateOne(args.conditions, args.input));
        }
        if (this.emptyFacade.updateById) {
            seneca.add(this.pin(this.name, "update", { id: "*", input: "*" }), async (args) => this.createFacade(args).updateById(args.id, args.input));
        }
        if (this.emptyFacade.remove) {
            seneca.add(this.pin(this.name, "removeAll", { conditions: "*" }), async (args) => this.createFacade(args).remove(args.conditions));
        }
        if (this.emptyFacade.removeOne) {
            seneca.add(this.pin(this.name, "remove", { conditions: "*" }), async (args) => this.createFacade(args).removeOne(args.conditions));
        }
        if (this.emptyFacade.removeById) {
            seneca.add(this.pin(this.name, "remove", { id: "*" }), async (args) => this.createFacade(args).removeById(args.id));
        }
        if (this.emptyFacade.clean) {
            seneca.add(this.pin(this.name, "clean"), async (args) => this.createFacade(args).clean());
        }
    }
}
exports.RestEntity = RestEntity;

//# sourceMappingURL=entity.js.map
