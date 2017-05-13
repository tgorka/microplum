import * as sourceMapSupport from "source-map-support";
// errors thrown with the typescript files not generated js
sourceMapSupport.install();

export { SenecaPlum as default } from "./lib";
export { Microplum, Config } from "./lib/model";
