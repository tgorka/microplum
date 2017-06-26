"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PlumError {
    constructor(status, code, message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
    ;
}
exports.PlumError = PlumError;
class ParametersPlumError extends PlumError {
    constructor(message) {
        super(400, exports.PlumErrorCodes.parameters_error, message);
    }
}
exports.ParametersPlumError = ParametersPlumError;
class UnauthorizedPlumError extends PlumError {
    constructor(message = "Unauthorized access") {
        super(401, exports.PlumErrorCodes.unauthorized, message);
    }
}
exports.UnauthorizedPlumError = UnauthorizedPlumError;
class ForbiddenPlumError extends PlumError {
    constructor(message = "Access forbidden") {
        super(403, exports.PlumErrorCodes.forbidden, message);
    }
}
exports.ForbiddenPlumError = ForbiddenPlumError;
class NotFoundPlumError extends PlumError {
    constructor(message = "Entity not found error") {
        super(404, exports.PlumErrorCodes.not_found, message);
    }
}
exports.NotFoundPlumError = NotFoundPlumError;
class NotAllowedPlumError extends PlumError {
    constructor(message = "Method not allowed error", scope) {
        super(405, exports.PlumErrorCodes.not_allowed, message);
        this.scope = scope;
    }
}
exports.NotAllowedPlumError = NotAllowedPlumError;
class TimeoutPlumError extends PlumError {
    constructor(message = "Method timeout error", scope) {
        super(408, exports.PlumErrorCodes.timeout, message);
        this.scope = scope;
    }
}
exports.TimeoutPlumError = TimeoutPlumError;
class PreconditionFailedPlumError extends PlumError {
    constructor(message = null) {
        super(412, exports.PlumErrorCodes.predondition_error, message);
    }
}
exports.PreconditionFailedPlumError = PreconditionFailedPlumError;
class FieldError {
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
}
exports.FieldError = FieldError;
class ValidationPlumError extends PlumError {
    constructor(fields, message = null) {
        super(422, exports.PlumErrorCodes.validation_error, message);
        this.fields = fields;
    }
}
exports.ValidationPlumError = ValidationPlumError;
class ServerPlumError extends PlumError {
    constructor(message = "Unexpected server error") {
        super(500, exports.PlumErrorCodes.server_error, message);
    }
}
exports.ServerPlumError = ServerPlumError;
exports.transformSenecaError = (err) => {
    if (err instanceof PlumError) {
        return err;
    }
    else if (err.seneca && err.details && err.details.message) {
        switch (err.details.message) {
            case "[TIMEOUT]":
                return new TimeoutPlumError(err.msg);
        }
    }
    else {
        return new ServerPlumError(err.message);
    }
};
/** Utility function to create a K:V from a list of strings */
function strEnum(o) {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}
/** Create a K:V */
exports.PlumErrorCodes = strEnum([
    "server_error",
    "not_found",
    "not_allowed",
    "forbidden",
    "timeout",
    "unauthorized",
    "parameters_error",
    "validation_error",
    "predondition_error",
]);

//# sourceMappingURL=error.js.map
