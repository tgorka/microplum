import * as jsonpath from "jsonpath";
import microplumCall from "./client";


// can encode data (ex. adding custom result code)
const handler = (fun: Function, obligatoryArgsJsonPath: string[] = [], optionalArgsJsonPath: string[] = []) => {
    return async (event, context, callback): Promise<void> => {
        try {
            const body: any = (!!event.body) && JSON.parse(event.body) ||
                (!!event.arguments) && JSON.parse(event.arguments) ||
                event;
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
            console.log(`Returning value ${JSON.stringify(response)}`);
            callback(null, response);
            console.log('afer the response')
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
            console.log(err);
            // force to exit the process so no waiting for timeout
            process.exit(-1);
        }
    }
};

// functions
export const act = handler(microplumCall, ["$"]);

