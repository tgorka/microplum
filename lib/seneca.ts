import { Config } from "./model";

const DEFAULT_OPTIONS: Config = {
    version: "v1",
    environment: process.env.NODE_ENV || "production"
};

export class Seneca {

    public util: any;

    constructor(public seneca: any, public options: any = {}, public pin:string[] = []) {
        this.util = seneca.util;
        /**
         * Default options
         */
        this.options = this.util.deepextend(DEFAULT_OPTIONS, options);

        this.seneca.add("role:a,cmd:b", function(args, done) {
            console.log('run abc', JSON.stringify(args));
            done(null, {msg:"done"});
        });
        this.pin.push("role:*");

        /*require( 'seneca' )()
         .use( 'customPlugin' )
         .listen()*/
    }

    public use(component: Function, pin?: any): void {
        component.bind(this)(this.options);
        if (pin) {
            this.usePin(pin);
        }
    }

    public add(pin: any, cb: Function): void {
        pin.version = pin.version || this.options.version;
        pin.environment = pin.environment || this.options.environment;


        this.seneca.add(pin, cb);
        console.log(`[Seneca] Registered service for PIN: ${JSON.stringify(pin)}`);
    }

    private usePin(pin: any): void {this.pin.push(pin);
        pin.version = pin.version || this.options.version;
        pin.environment = pin.environment || this.options.environment;
        if (this.options.environment === "dev" && this.options.developer) {
            pin.developer = this.options.developer
        }

        let realPin:string = Object.keys(pin)
            .map(key => `${key}:${pin[key]}`)
            .join(",");

        console.log(`[Seneca] Register listen for PIN: \"${realPin}\"`);
        this.pin.push(realPin);
    }

}
