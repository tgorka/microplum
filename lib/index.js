"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const seneca = require("seneca");
const senecaAmqpTransport = require("seneca-amqp-transport");
const error_1 = require("./error");
/**
 * get current environment value
 */
const currentEnvironment = () => process.env.NODE_ENV || "production";
/**
 * Default options value for the microplum
 * @type {DefaultConfig}
 */
const DEFAULT_OPTIONS = {
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
class SenecaPlum {
    constructor(options) {
        this.options = options;
        this.options = _.merge(DEFAULT_OPTIONS, options);
        this.options.seneca.transport.msgprefix = this.options.seneca.transport.msgprefix || this.options.app;
        this.initSeneca();
    }
    close() {
        this.seneca.close();
        console.log(`[Microplum] Closing the connections.`);
    }
    listen() {
        this.seneca.listen({
            type: "amqp",
            pin: this.options.pin,
            url: this.options.amqpUrl,
            exchange: {
                //type: "topic",
                name: "seneca.topic",
                options: {
                    durable: false,
                    autoDelete: true,
                }
            },
            deadLetter: {
                /*queue: {
                    name: "seneca.dlq"
                },*/
                exchange: {
                    //type: "topic",
                    //name: "seneca.dlx",
                    options: {
                        durable: true,
                        autoDelete: false
                    }
                }
            },
            listen: {
                /*channel: {
                    "prefetch": 1
                },*/
                queues: {
                    //prefix: "seneca.add",
                    //separator: ".",
                    options: {
                        durable: false,
                        arguments: {
                            //"x-dead-letter-exchange": "seneca.dlx",
                            "x-message-ttl": 10000
                        }
                    }
                }
            },
            client: {
                /*channel: {
                    prefetch: 1
                },*/
                queues: {
                    //prefix: "seneca.act",
                    //separator: ".",
                    options: {
                        autoDelete: true,
                        exclusive: true,
                        arguments: {
                            //"x-dead-letter-exchange": "seneca.dlx",
                            "x-message-ttl": 10000
                        }
                    }
                }
            },
        });
    }
    /**
     * Set-up seneca connection
     */
    client() {
        this.seneca.client({
            type: 'amqp',
            pin: this.options.clientPin,
            url: this.options.amqpUrl,
            exchange: {
                //type: "topic",
                name: "seneca.topic",
                options: {
                    durable: false,
                    autoDelete: true,
                }
            },
            deadLetter: {
                /*queue: {
                 name: "seneca.dlq"
                 },*/
                exchange: {
                    //type: "topic",
                    //name: "seneca.dlx",
                    options: {
                        durable: true,
                        autoDelete: false,
                    }
                }
            },
            listen: {
                /*channel: {
                 "prefetch": 1
                 },*/
                queues: {
                    //prefix: "seneca.add",
                    //separator: ".",
                    options: {
                        durable: false,
                        arguments: {
                            //"x-dead-letter-exchange": "seneca.dlx",
                            "x-message-ttl": 10000
                        }
                    }
                }
            },
            client: {
                /*channel: {
                 prefetch: 1
                 },*/
                queues: {
                    //prefix: "seneca.act",
                    //separator: ".",
                    options: {
                        autoDelete: true,
                        exclusive: true,
                        arguments: {
                            //"x-dead-letter-exchange": "seneca.dlx",
                            "x-message-ttl": 10000
                        }
                    }
                }
            },
        });
        console.log(`[Microplum] Registered client for PIN: ${this.options.clientPin}`);
    }
    act(pin, respond) {
        this.addBasicProperties(pin);
        this.addAdditionalProperties(pin);
        this.seneca.act(pin, respond);
    }
    actPromise(pin, user) {
        console.log(`[Microplum] CALL => ${JSON.stringify(pin)}`);
        if (!pin.role || typeof pin.role !== "string" || !pin.cmd || typeof pin.cmd !== "string") {
            throw new error_1.NotAllowedPlumError(`[act] there is no service with no string 'role' or 'cmd' parameter: ` +
                `<= ${JSON.stringify(pin)}`);
        }
        else if (!this.options.roles.includes(pin.role)) {
            throw new error_1.NotAllowedPlumError(`[act] the role is not in the list ` +
                `${JSON.stringify(this.options.roles)} <= ${JSON.stringify(pin)}`);
        }
        // add user information
        if (user) {
            pin.user = user;
        }
        if (user && (user.id || user.sub)) {
            pin.userId = (user.id) ? user.id : `${user.iss || ""}${user.sub || ""}`;
        }
        if (user && user.name) {
            pin.userName = user.name;
        }
        // call the service
        return new Promise((resolve, reject) => {
            this.act(pin, (err, data) => {
                if (err) {
                    console.error(`[Microplum] <= ${JSON.stringify(pin)}`, err);
                    return reject(error_1.transformSenecaError(err));
                }
                else {
                    console.log(`[Microplum] ANSWER [status:${(data) ? data.status : ''}] <= ${JSON.stringify(pin)}`);
                    if (data && typeof data.status === "boolean") {
                        if (data.status) {
                            return resolve(data.data);
                        }
                        else if (data.error) {
                            return reject(data.error);
                        }
                        else {
                            return reject(data);
                        }
                    }
                    else {
                        console.log("[Microplum] ANSWER unknown type: resolving data");
                        return resolve(data);
                    }
                }
            });
        });
    }
    useService(service, pin) {
        service.setAct(this.actPromise.bind(this));
        this.use(service.plugin(), pin || service.publicPin());
    }
    use(component, pin) {
        component.bind(this)(this.options);
        if (pin) {
            this.addPin(pin);
        }
    }
    add(pin, cb) {
        pin = this.addBasicProperties(pin);
        pin = this.addAdditionalProperties(pin);
        this.seneca.add(pin, this.encloseCallback(cb));
        console.log(`[Microplum] Registered service for PIN: ${JSON.stringify(pin)}`);
    }
    escapeDoc(doc) {
        if (Array.isArray(doc)) {
            return doc.map(docElement => this.escapeDoc(docElement));
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
    }
    encloseCallback(cb) {
        return (async (pin, done) => {
            try {
                done(null, { status: true, data: this.escapeDoc(await cb(pin)) });
                //cb(pin, (err: any, result: any): void => done(null, this.escapeDoc(result)));
            }
            catch (err) {
                done(null, { status: false, error: error_1.transformSenecaError(err) });
                throw err;
            }
        });
    }
    addPin(pin) {
        pin = this.addBasicProperties(pin);
        pin.provider = "*";
        let realPin = Object.keys(pin)
            .filter(key => pin[key] !== undefined)
            .map(key => `${key}:${pin[key]}`)
            .join(",");
        console.log(`[Microplum] Register listen for PIN: \"${realPin}\"`);
        this.options.pin.push(realPin);
    }
    addBasicProperties(pin) {
        pin.provider = pin.provider || this.options.provider || "*";
        pin.version = pin.version || this.options.version;
        pin.subversion = pin.subversion || this.options.subversion;
        pin.revision = pin.revision || this.options.revision;
        pin.environment = pin.environment || this.options.environment;
        return pin;
    }
    addAdditionalProperties(pin) {
        if (this.options.debugUserId) {
            pin.userId = this.options.debugUserId;
        }
        return pin;
    }
    /**
     * Set-up seneca with all the middleware libraries.
     */
    initSeneca() {
        this.seneca = seneca(this.options.seneca);
        this.seneca.use(senecaAmqpTransport);
    }
}
exports.SenecaPlum = SenecaPlum;

//# sourceMappingURL=index.js.map
