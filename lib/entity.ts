import { Entity } from "./model";

export abstract class ServiceEntity implements Entity {

    private _act: Function;
    private _user: any;

    constructor(public name: string, public facade: any, public servicePin?: any) {
        this._act = (...args) => {
            console.log("[Microplum] '.act' not set in the service entity. Please use setAct method before.");
            throw new Error("'.act' service not found.")
        };
        this._user = null;
    }

    public setAct(act: Function) {
        this._act = act;
    }

    public setUser(user: any): void {
        this._user = user;
    }

    public async act(args: any): Promise<any> {
        if (this._user) {
            args.user = args.user || this._user;
        }
        return this._act(args);
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
        seneca.add(this.publicPin(), this.handleService(
            args => {
                console.log("[Microplum] Invalid arguments witm MSG", JSON.stringify(args));
                return Promise.resolve({
                    status: false,
                    code: 404,
                    msg: `Unknown service from ${this.publicPin()}`
                })
            }
        ));
    };

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
                .then(doc => done(null, escapeDoc(doc)))
                .catch(err => done(err));
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
                args => this.facade.find(args.conditions)
            ));
        }
        if (this.facade.findOne) {
            seneca.add(this.pin(this.name, "findOne"), this.handleService(
                args => this.facade.findOne(args.conditions)
            ));
        }
        if (this.facade.findById) {
            seneca.add(this.pin(this.name, "findById"), this.handleService(
                args => this.facade.findById(args.id)
            ));
        }
    }

    protected addStatisticalServices(seneca: any): void {
        if (this.facade.count) {
            seneca.add(this.pin(this.name, "count"), this.handleService(
                args => this.facade.count(args.conditions)
            ));
        }
    }

    protected addModifyServices(seneca: any): void {
        if (this.facade.create) {
            seneca.add(this.pin(this.name, "create"), this.handleService(
                args => this.facade.create(args.input)
            ));
        }
        if (this.facade.update) {
            seneca.add(this.pin(this.name, "update"), this.handleService(
                args => this.facade.update(args.conditions, args.input)
            ));
        }
        if (this.facade.remove) {
            seneca.add(this.pin(this.name, "remove"), this.handleService(
                args => this.facade.remove(args.id)
            ));
        }
    }
}
