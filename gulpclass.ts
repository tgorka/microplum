import { Gulpclass, SequenceTask, Task } from "gulpclass/Decorators";
import { spawn } from "child_process";

import * as gulp from "gulp";
import * as del from "del";
import * as ts from "gulp-typescript";
import * as sourcemaps from "gulp-sourcemaps";


@Gulpclass()
export class Gulpfile {

    @Task("clean")
    clean(cb: Function) {
        return del(["./lib/**/*.js", "./gulpclass.js", "./**/*.map"], cb);
    }

    @Task("build")
    build() {
        let tsProject: any = ts.createProject("tsconfig.json");

        return tsProject.src()
            .pipe(sourcemaps.init())
            .pipe(tsProject())
            .pipe(sourcemaps.write("."))
            .pipe(gulp.dest(""));
    }

    @Task("test")
    test() {
        return spawn("node", ["."], { stdio: "inherit" });
    }

    @SequenceTask()
    default() {
        return ["clean", "build", "test"];
    }
}
