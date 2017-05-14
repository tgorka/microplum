import { Entity } from "./model";

export abstract class ServiceEntity implements Entity {

    constructor(public name: string, public facade: any) {
    }

    public plugin(): Function {
        let addServices = this.addServices.bind(this);
        return function (options) {
            addServices(this, options);
        }
    }

    public publicPin(): any {
        return { role: this.name };
    }

    protected abstract addServices(seneca: any, options: any): void;

    protected pin(role: string, cmd: string, options: any): any {
        let pin = Object.assign({}, options.pin || {});
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
        seneca.add(this.pin(this.name, "find", options), this.handleService(
            args => this.facade.find(args.conditions)
        ));
        seneca.add(this.pin(this.name, "findOne", options), this.handleService(
            args => this.facade.findOne(args.conditions)
        ));
        seneca.add(this.pin(this.name, "findById", options), this.handleService(
            args => this.facade.findById(args.id)
        ));
        seneca.add(this.pin(this.name, "create", options), this.handleService(
            args => this.facade.create(args.input)
        ));
        seneca.add(this.pin(this.name, "update", options), this.handleService(
            args => this.facade.update(args.conditions, args.input)
        ));
        seneca.add(this.pin(this.name, "remove", options), this.handleService(
            args => this.facade.remove(args.id)
        ));
    }
}
