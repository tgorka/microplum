import { Config, DefaultConfig, Entity, Microplum } from "./model";

import * as _ from "lodash";
import * as seneca from "seneca";
import * as senecaAmqpTransport from "seneca-amqp-transport";
import { PlumError, ServerPlumError, TimeoutPlumError, transformSenecaError } from "./error";

/**
 * Seneca interface for updating with non specified seneca methods
 */
interface Seneca extends seneca.Instance {
    /**
     * Close connection to the queue. Use it on closing the app to be sure that no zombie connections have stayed.
     */
    close(): void;
}

/**
 * get current environment value
 */
const currentEnvironment = () => process.env.NODE_ENV || "production";

/**
 * Default options value for the microplum
 * @type {DefaultConfig}
 */
const DEFAULT_OPTIONS: DefaultConfig = {
    version: 1,
    subversion: 0,
    revision: 0,
    environment: currentEnvironment(),
    pin: [],
    clientPin: `provider:*,version:*,subversion:*,revision:*,role:*,environment:${currentEnvironment()}`,
    seneca: {
        log: "standard",
        transport: {},
        timeout: 5000
    },
};

export class SenecaPlum implements Microplum {

    public seneca: Seneca;

    constructor(public options: Config) {
        this.options = _.merge(DEFAULT_OPTIONS, options);
        this.options.seneca.transport.msgprefix = this.options.seneca.transport.msgprefix || this.options.app;
        this.initSeneca();
    }

    public close(): void {
        this.seneca.close();
        console.log(`[Microplum] Closing the connections.`);
    }

    public listen(): void {
        this.seneca.listen({
            type: "amqp",
            pin: this.options.pin,
            url: this.options.amqpUrl
        });
    }

    /**
     * Set-up seneca connection
     */
    public client(): void {
        this.seneca.client({
            type: 'amqp',
            pin: this.options.clientPin,
            url: this.options.amqpUrl
        });
        console.log(`[Microplum] Registered client for PIN: ${this.options.clientPin}`);
    }

    public act(pin: any, respond: seneca.ActCallback): void {
        this.addBasicProperties(pin);
        this.addAdditionalProperties(pin);
        this.seneca.act(pin, respond);
    }

    public actPromise(pin: any, user?: any): Promise<any> {
        console.log(`[Microplum] CALL => ${JSON.stringify(pin)}`);
        if (user) {
            pin.user = user;
        }
        if (user && (user.id || user.sub)) {
            pin.userId = (user.id) ? user.id : `${user.iss || ""}${user.sub || ""}`;
        }
        if (user && user.name) {
            pin.userName = user.name;
        }
        return new Promise((resolve, reject) => {
            this.act(pin, (err: any | null, data: any): void => {
                if (err) {
                    console.error(`[Microplum] <= ${JSON.stringify(pin)}`, err);
                    return reject(transformSenecaError(err));
                } else {
                    console.log(`[Microplum] ANSWER [status:${(data) ? data.status : ''}] <= ${JSON.stringify(pin)}`);
                    if (data && typeof data.status === "boolean") {
                        if (data.status) {
                            return resolve(data.data);
                        } else if (data.error) {
                            return reject(data.error);
                        } else {
                            return reject(data);
                        }
                    } else {
                        console.log("[Microplum] ANSWER unknown type: resolving data");
                        return resolve(data);
                    }
                }
            });
        });
    }

    public useService(service: Entity, pin?: any): void {
        service.setAct(this.actPromise.bind(this));
        this.use(service.plugin(), pin || service.publicPin());
    }

    public use(component: Function, pin?: any): void {
        component.bind(this)(this.options);
        if (pin) {
            this.addPin(pin);
        }
    }

    public add(pin: any, cb: (args: any) => Promise<any | void>): void {
        pin = this.addBasicProperties(pin);
        pin = this.addAdditionalProperties(pin);
        this.seneca.add(pin, this.encloseCallback(cb));
        console.log(`[Microplum] Registered service for PIN: ${JSON.stringify(pin)}`);
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

    protected encloseCallback(cb: (args: any) => Promise<any | void>): seneca.AddCallback {
        return <seneca.AddCallback>(async (pin: any, done: seneca.ActCallback): Promise<void> => {
            try {
                done(null, { status: true, data: this.escapeDoc(await cb(pin)) });
                //cb(pin, (err: any, result: any): void => done(null, this.escapeDoc(result)));
            } catch (err) {
                let transformedError = transformSenecaError(err);
                done(null, { status: false, error: transformedError });
                if (transformedError instanceof TimeoutPlumError) {
                    throw transformedError;
                } else {
                    throw err;
                }
            }
        });
    }

    protected addPin(pin: any): void {
        pin = this.addBasicProperties(pin);
        pin.provider = "*";
        let realPin: string = Object.keys(pin)
            .filter(key => pin[key] !== undefined)
            .map(key => `${key}:${pin[key]}`)
            .join(",");

        console.log(`[Microplum] Register listen for PIN: \"${realPin}\"`);
        this.options.pin.push(realPin);
    }

    protected addBasicProperties(pin: any): any {
        pin.provider = pin.provider || this.options.provider || this.options.app;
        pin.version = pin.version || this.options.version;
        pin.subversion = pin.subversion || this.options.subversion;
        pin.revision = pin.revision || this.options.revision;
        pin.environment = pin.environment || this.options.environment;
        return pin;
    }

    protected addAdditionalProperties(pin: any): any {
        if (this.options.debugUserId) {
            pin.userId = this.options.debugUserId;
        }
        return pin;
    }

    /**
     * Set-up seneca with all the middleware libraries.
     */
    protected initSeneca(): void {
        this.seneca = <Seneca>seneca(this.options.seneca);
        this.seneca.use(senecaAmqpTransport);
    }

}
