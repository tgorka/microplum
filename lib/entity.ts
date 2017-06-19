import { Entity, HasAct, RestFacade } from "./model";
import { NotAllowedPlumError, PlumError, ServerPlumError } from "./error";


const invalidActFun: (args: { [key: string]: any }) => Promise<any> = (args: { [key: string]: any }): Promise<any> => {
    console.log("[Microplum] '.act' not set in the service entity. Please use setAct method before.");
    throw new ServerPlumError("'act' service not set.");
};

/**
 * Facade class that can be extended with specific methods.
 */
export class PlumFacade implements HasAct {

    public act: (args: { [key: string]: any }) => Promise<any>;
    public args: { [key: string]: any };

    constructor(act?: (args: any) => Promise<any>, args?: { [key: string]: any }) {
        this.act = (act) ? act : invalidActFun;
        this.args = (args) ? args : {};
    }
}

export abstract class ServiceEntity<F extends PlumFacade> implements Entity, HasAct {

    public act: (args: { [key: string]: any }) => Promise<any>;
    protected emptyFacade: F;

    constructor(public name: string,
                public FacadeClass?: new (act?: (args: any) => Promise<any>, args?: { [key: string]: any }) => F,
                public servicePin?: any) {
        this.act = invalidActFun;
        this.emptyFacade = (this.FacadeClass) ? new this.FacadeClass() : <F>new PlumFacade();
    }

    public setAct(act: (args: { [key: string]: any }) => Promise<any>) {
        this.act = act;
    }

    public getAct(user?: any): (args: { [key: string]: any }) => Promise<any> {
        return (args) => {
            if (user) {
                args.user = args.user || user;
            }
            return this.act(args);
        };
    }

    public createFacade(args: { [key: string]: any } = {}): F {
        return new this.FacadeClass(this.act, args);
    }

    public plugin(): Function {
        let addServices = this.addServices.bind(this);
        let addDefaultService = this.addDefaultService.bind(this);
        return function (options) {
            addServices(this, options);
            addDefaultService(this, options);
        }
    }

    public publicPin(): any {
        return { role: this.name };
    }

    protected abstract addServices(seneca: any, options: any): void;

    protected addDefaultService(seneca: any, options: any): void {
        let pin: any = this.pin(this.name, "*");
        seneca.add(pin, this.handleService(
            async args => {
                console.log(`WARNING: [Microplum] Method is not registered for PIN:${JSON.stringify(pin)}`);
                if (args.nonErrorDefault) {
                    return Promise.resolve();
                } else {
                    throw new NotAllowedPlumError("Service not found.", { service: pin, args: args });
                }
            }
        ));
    }

    protected pin(role: string, cmd: string, additionalArgs: {} = {}): any {
        let pin = Object.assign({}, this.servicePin || {}, additionalArgs);
        pin.role = role;
        pin.cmd = cmd;
        return pin;
    }

    protected handleService(cb: Function): Function {
        let escapeDoc = this.escapeDoc.bind(this);
        return function (args, done) {
            cb(args)
                .then(doc => done(null, { status: true, data: escapeDoc(doc) }))
                .catch(err => {
                    if (err instanceof PlumError) {
                        done(null, { status: false, error: err });
                    } else {
                        done(err);
                    }
                });
        };
    }

    private escapeDoc(doc: any): any {
        if (Array.isArray(doc)) {
            return doc.map(docElement => this.escapeDoc(docElement));
        } else if (doc && doc.toObject) {
            return doc.toObject();
        } else if (doc) {
            return doc;
        } else {
            return null;
        }
    }

}

/**
 * CRUD for the entity
 */
export class RestEntity extends ServiceEntity<RestFacade<any> & PlumFacade> {
    protected addServices(seneca: any, options: any): void {
        this.addGetServices(seneca);
        this.addStatisticalServices(seneca);
        this.addModifyServices(seneca);
    }

    protected addGetServices(seneca: any): void {
        if (this.emptyFacade.find) {
            seneca.add(this.pin(this.name, "find", { conditions: "*" }), this.handleService(
                async args => this.createFacade(args).find(args.conditions)
            ));
        }
        if (this.emptyFacade.findOne) {
            seneca.add(this.pin(this.name, "findOne", { conditions: "*" }), this.handleService(
                async args => this.createFacade(args).findOne(args.conditions)
            ));
        }
        if (this.emptyFacade.findById) {
            seneca.add(this.pin(this.name, "find", { id: "*" }), this.handleService(
                async args => this.createFacade(args).findById(args.id)
            ));
        }
    }

    protected addStatisticalServices(seneca: any): void {
        if (this.emptyFacade.count) {
            seneca.add(this.pin(this.name, "count", { conditions: "*" }), this.handleService(
                async args => this.createFacade(args).count(args.conditions)
            ));
        }
    }

    protected addModifyServices(seneca: any): void {
        if (this.emptyFacade.create) {
            seneca.add(this.pin(this.name, "create", { input: "*" }), this.handleService(
                async args => this.createFacade(args).create(args.input)
            ));
        }
        if (this.emptyFacade.update) {
            seneca.add(this.pin(this.name, "updateAll", { conditions: "*", input: "*" }), this.handleService(
                async args => this.createFacade(args).update(args.conditions, args.input)
            ));
        }
        if (this.emptyFacade.updateOne) {
            seneca.add(this.pin(this.name, "update", { conditions: "*", input: "*" }), this.handleService(
                async args => this.createFacade(args).updateOne(args.conditions, args.input)
            ));
        }
        if (this.emptyFacade.updateById) {
            seneca.add(this.pin(this.name, "update", { id: "*", input: "*" }), this.handleService(
                async args => this.createFacade(args).updateById(args.id, args.input)
            ));
        }
        if (this.emptyFacade.remove) {
            seneca.add(this.pin(this.name, "removeAll", { conditions: "*" }), this.handleService(
                async args => this.createFacade(args).remove(args.conditions)
            ));
        }
        if (this.emptyFacade.removeOne) {
            seneca.add(this.pin(this.name, "remove", { conditions: "*" }), this.handleService(
                async args => this.createFacade(args).removeOne(args.conditions)
            ));
        }
        if (this.emptyFacade.removeById) {
            seneca.add(this.pin(this.name, "remove", { id: "*" }), this.handleService(
                async args => this.createFacade(args).removeById(args.id)
            ));
        }
        if (this.emptyFacade.clean) {
            seneca.add(this.pin(this.name, "clean"), this.handleService(
                async args => this.createFacade(args).clean()
            ));
        }
    }
}
