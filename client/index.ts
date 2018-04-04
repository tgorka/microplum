import { default as Service, Microplum } from "..";

const appName = process.env.APP_NAME || "microplum";
const version = parseInt(process.env.VERSION || "1");
const roles = (process.env.ROLES || "").split(",");
const ampqUrl = process.env.AMQP_URI || process.env.CLOUDAMQP_URL || "amqp://localhost/microplum";
const debugUserId = process.env.DEBUG_USER_ID || null;

const init = () => {
    const microplum: Microplum = new Service({
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
    const microplum = init();
    const result = await microplum.actPromise(pin);
    microplum.close();
    return result;
};
