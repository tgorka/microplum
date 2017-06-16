import { Entity, HasAct } from "./model";
import { NotAllowedPlumError, PlumError, ServerPlumError } from "./error";

export abstract class ServiceEntity implements Entity {

    private act: (args: any) => Promise<any>;

    constructor(public name: string, public facade?: any & HasAct, public servicePin?: any) {
        this.act = (args: object) => {
            console.log("[Microplum] '.act' not set in the service entity. Please use setAct method before.");
            throw new ServerPlumError("'.act' service not found.")
        };
        if (this.facade) {
            this.facade.act = this.act;
        }
    }

    public setAct(act: (args: any) => Promise<any>) {
        this.act = act;
        if (this.facade) {
            this.facade.act = this.act;
        }
    }

    public getAct(user?: any): (args: any) => Promise<any> {
        return (args) => {
            if (user) {
                args.user = args.user || user;
            }
            return this.act(args);
        };
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

    protected pin(role: string, cmd: string): any {
        let pin = Object.assign({}, this.servicePin || {});
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
export class RestEntity extends ServiceEntity {
    protected addServices(seneca: any, options: any): void {
        this.addGetServices(seneca);
        this.addStatisticalServices(seneca);
        this.addModifyServices(seneca);
    }

    protected addGetServices(seneca: any): void {
        if (this.facade.find) {
            seneca.add(this.pin(this.name, "find"), this.handleService(
                async args => this.facade.find(args.conditions)
            ));
        }
        if (this.facade.findOne) {
            seneca.add(this.pin(this.name, "findOne"), this.handleService(
                async args => this.facade.findOne(args.conditions)
            ));
        }
        if (this.facade.findById) {
            seneca.add(this.pin(this.name, "findById"), this.handleService(
                async args => this.facade.findById(args.id)
            ));
        }
    }

    protected addStatisticalServices(seneca: any): void {
        if (this.facade.count) {
            seneca.add(this.pin(this.name, "count"), this.handleService(
                async args => this.facade.count(args.conditions)
            ));
        }
    }

    protected addModifyServices(seneca: any): void {
        if (this.facade.create) {
            seneca.add(this.pin(this.name, "create"), this.handleService(
                async args => this.facade.create(args.input)
            ));
        }
        if (this.facade.update) {
            seneca.add(this.pin(this.name, "update"), this.handleService(
                async args => this.facade.update(args.conditions, args.input)
            ));
        }
        if (this.facade.remove) {
            seneca.add(this.pin(this.name, "remove"), this.handleService(
                async args => this.facade.remove(args.id)
            ));
        }
    }
}
