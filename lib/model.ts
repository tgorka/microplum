import * as seneca from "seneca";

export interface DefaultConfig {
    version?: number;
    subversion?: number,
    revision?: number,
    environment?: string;
    pin?: string[];
    clientPin?: string;
    seneca?: seneca.Options;
}

export interface Config extends DefaultConfig {
    app: string;
    amqpUrl: string;
    debugUserId?: string;
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

    useService(service: Entity, pin?: any): void

    add(pin: any, cb: Function): void;

    act(pin: any, respond: seneca.ActCallback): void;
    actPromise(pin: any, user?: any): Promise<any>;

}

export interface Entity {

    /**
     * Module seneca service definition.
     * @param options
     * @return seneca plugin
     */
    plugin(): Function;

    publicPin(): any;
    setAct(act: Function): void;
    getAct(user?: any): Function;

}
