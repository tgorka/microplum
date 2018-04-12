import * as _debug from "debug";
import Microplum from "..";

const appName = process.env.APP_NAME || "microplum";
const version = parseInt(process.env.VERSION || "1");
const roles = (process.env.ROLES || "").split(",");
const ampqUrl = process.env.AMQP_URI || process.env.CLOUDAMQP_URL || "amqp://localhost/microplum";
const debugUserId = process.env.DEBUG_USER_ID || null;

const debug = _debug("microplum-debug");
const info = _debug("microplum-info");

const init = () => {
    const microplum = new Microplum({
        app: appName,
        version: version,
        roles: roles,
        amqpUrl: ampqUrl,
        debugUserId: debugUserId,
    });
    microplum.client();
    return microplum;
};

export const act = async (pin: any): Promise<any> => {
    info(`[microplum][CALL]<<{role:${pin.role},cmd:${pin.cmd}...}`);
    debug(`[microplum][CALL]<<${JSON.stringify(pin)}`);
    const microplum = init();
    debug("[microplum] client initialized");
    const result = await microplum.actPromise(pin);
    debug(`[microplum][RESULT]>>${JSON.stringify(result)}`);
    microplum.close();
    debug("[microplum] closed");
    info(`[microplum][RESULT]>>success`);
    return result;
};
export default act;
