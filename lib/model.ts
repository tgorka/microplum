import * as seneca from "seneca";

export interface DefaultConfig {
    version?: string;
    environment?: string;
    developer?: string;
    pin?: string[];
    clientPin?: string;
    seneca?: seneca.Options;
}

export interface Config extends DefaultConfig {
    app: string;
    amqpUrl: string;
}

export interface Microplum {

    /**
     * Listen app trigger os selected configuration.
     */
    listen(): void;

    /**
     * Set-up seneca connection for calls.
     */
    client(): void;

    use(component: Function, pin?: any): void;

    add(pin: any, cb: Function): void;

    act(pin: any, respond: seneca.ActCallback): void;
    actPromise: Function;

}