"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Decorators_1 = require("gulpclass/Decorators");
var child_process_1 = require("child_process");
var gulp = require("gulp");
var del = require("del");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var Gulpfile = (function () {
    function Gulpfile() {
    }
    Gulpfile.prototype.clean = function (cb) {
        return del(["./lib/**/*.js", "./gulpclass.js", "./**/*.map"], cb);
    };
    Gulpfile.prototype.build = function () {
        var tsProject = ts.createProject("tsconfig.json");
        return tsProject.src()
            .pipe(sourcemaps.init())
            .pipe(tsProject())
            .pipe(sourcemaps.write("."))
            .pipe(gulp.dest(""));
    };
    Gulpfile.prototype.test = function () {
        return child_process_1.spawn("node", ["."], { stdio: "inherit" });
    };
    Gulpfile.prototype.default = function () {
        return ["clean", "build", "test"];
    };
    return Gulpfile;
}());
__decorate([
    Decorators_1.Task("clean")
], Gulpfile.prototype, "clean", null);
__decorate([
    Decorators_1.Task("build")
], Gulpfile.prototype, "build", null);
__decorate([
    Decorators_1.Task("test")
], Gulpfile.prototype, "test", null);
__decorate([
    Decorators_1.SequenceTask()
], Gulpfile.prototype, "default", null);
Gulpfile = __decorate([
    Decorators_1.Gulpclass()
], Gulpfile);
exports.Gulpfile = Gulpfile;

//# sourceMappingURL=gulpclass.js.map
