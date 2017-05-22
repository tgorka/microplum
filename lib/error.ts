export class PlumError {
    constructor(public code: number, public name: string, public message: string) {
    };
}

export class ServerPlumError extends PlumError {
    constructor(message: string = "Unexpected server error") {
        super(500, PlumErrorNames.server_error, message);
    }
}

export class NotFoundPlumError extends PlumError {
    constructor(message: string = "Entity not found error") {
        super(404, PlumErrorNames.not_found, message);
    }
}

export class ForbiddenPlumError extends PlumError {
    constructor(message: string = "Access forbidden") {
        super(403, PlumErrorNames.forbidden, message);
    }
}

export class UnauthorizedPlumError extends PlumError {
    constructor(message: string = "Unauthorized access") {
        super(401, PlumErrorNames.unauthorized, message);
    }
}

export class ParametersPlumError extends PlumError {
    constructor(message: string) {
        super(400, PlumErrorNames.parameters_error, message);
    }
}

export class FieldError {
    constructor(public field: string, public name: string, public message: string) {
    }
}

export class ValidationPlumError extends PlumError {
    constructor(public fields: Object, message: string = null) {
        super(422, PlumErrorNames.validation_error, message);
    }
}

export class PreconditionFailedPlumError extends PlumError {
    constructor(message: string = null) {
        super(412, PlumErrorNames.predondition_error, message);
    }
}

/** Utility function to create a K:V from a list of strings */
function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}

/** Create a K:V */
export const PlumErrorNames = strEnum([
    "server_error",
    "not_found",
    "forbidden",
    "unauthorized",
    "parameters_error",
    "validation_error",
    "predondition_error",
]);
/** Create a Type */
export type PlumErrorNames = keyof typeof PlumErrorNames;