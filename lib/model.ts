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
    provider?: string;
    amqpUrl: string;
    debugUserId?: string;
}

export interface Microplum {

    /**
     * Close the connection. Use it before exiting the app.
     */
    close(): void;

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

/**
 * Basic entity of the facade with the _id (optional) field.
 */
export interface FacadeEntity {
    _id?: string;
}

/**
 * Facade interface for the entity manipulation (CRUD+List). All the methods form the interface are optional.
 * All the methods are async
 */
export interface Facade<E extends FacadeEntity> {
    /**
     * Create new entity with the selected input
     * @param input
     * @param syncId null if needs to sync, id if it's already synced
     * @return created entity
     */
    create?(input: E, syncId?: string | null): Promise<E>;
    /**
     * Update all the entity for selected condition with selected update
     * @param conditions
     * @param update
     * @param syncId null if needs to sync, id if it's already synced
     * @return updated entity
     */
    update?(conditions: { [key: string]: any }, update: { [key: string]: any }, syncId?: string | null): Promise<E>;
    /**
     * Find the list of the entities for selected query
     * @param query (default all)
     * @return list of the entity
     */
    find?(query?: { [key: string]: any }): Promise<E[]>;
    /**
     * Find first entity for selected query
     * @param query (default all)
     * @return fist entity or null
     */
    findOne?(query?: { [key: string]: any }): Promise<E | null>;
    /**
     * Find entity by the id
     * @param id
     * @return found entity or null
     */
    findById?(id: string): Promise<E | null>;
    /**
     * Remove entity by the id
     * @param id
     * @param syncId null if needs to sync, id if it's already synced
     * @return removed entity or null
     */
    remove?(id: string, syncId?: string | null): Promise<E | null>;
    /**
     * Remove all the entities for selected query
     * @param syncId null if needs to sync, id if it's already synced
     * @param query (default all)
     */
    clean?(query?: { [key: string]: any }, syncId?: string | null): Promise<void>;
}
