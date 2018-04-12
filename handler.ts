import "source-map-support/register";
import * as _debug from "debug";
import * as jsonpath from "jsonpath";
import microplumCall from "./client";

const debug = _debug("microplum-debug-handler");

// can encode data (ex. adding custom result code)
const handler = (fun: Function, obligatoryArgsJsonPath: string[] = [], optionalArgsJsonPath: string[] = []) => {
    return async (event, context, callback): Promise<void> => {
        try {
            debug(`calling with event ${JSON.stringify(event)}; context ${JSON.stringify(context)}`);
            let body: any = event.body || event.arguments || event;
            body = (typeof body === "string") ? JSON.parse(body) : body;
            const nonExistingObligatoryArgs = obligatoryArgsJsonPath
                .filter(argName => jsonpath.value(body, argName) === undefined);
            if (nonExistingObligatoryArgs.length > 0) {
                throw new Error(`There are obligatory fields missing in the parameters for JSONPaths: ` +
                    `[${nonExistingObligatoryArgs.join(",")}].`);
            }
            const ArgsJsonPath = obligatoryArgsJsonPath.concat(optionalArgsJsonPath);
            const args = ArgsJsonPath.map(argName => jsonpath.value(body, argName));

            const results = await fun(...args);

            const response = (!event.body) ? results : {
                statusCode: 200,
                body: JSON.stringify(results),
            };
            debug(`returning value ${JSON.stringify(response)}`);
            callback(null, response);
            debug('calling afer the response')
            // force to exit the process so no waiting for timeout
            //process.exit(0);
        } catch (err) {
            err.status = err.status || false;
            err.errorType = err.errorType || "Error";
            err.statusCode = err.statusCode || 500;
            err.stackTrace = err.stackTrace || [];
            err.body = err.body || err.message || err.msg || err.errorMessage;
            callback(err);
            //throw err;
            // force to exit the process so no waiting for timeout
            process.exit(-1);
        }
    }
};

// functions
export const act = handler(microplumCall, ["$"]);

