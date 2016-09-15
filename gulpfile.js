'use strict';

var gulp        = require('gulp'),
    $$          = require('gulp-load-plugins')();

var runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    exec        = require('child_process').exec,
    path        = require('path'),
    pipe        = require('multipipe');

var name     = 'extend-me',
    srcDir   = './src/',
    testDir  = './test/',
    buildDir  = './build/';

//  //  //  //  //  //  //  //  //  //  //  //

gulp.task('lint', lint);
gulp.task('test', test);
gulp.task('doc', doc);
gulp.task('browserify', browserify);
gulp.task('serve', browserSyncLaunchServer);

gulp.task('build', function(callback) {
    clearBashScreen();
    runSequence(
        'lint',
        'test',
        'doc',
        'browserify',
        callback);
});

gulp.task('reload', function() {
    browserSync.reload();
});

gulp.task('watch', function () {
    gulp.watch([srcDir + '**', testDir + '**'], ['build']);
    gulp.watch([buildDir + name + '.js'], ['reload']);
});

gulp.task('default', ['build', 'watch'], browserSyncLaunchServer);

//  //  //  //  //  //  //  //  //  //  //  //

function lint() {
    return gulp.src(srcDir + 'index.js')
        .pipe($$.excludeGitignore())
        .pipe($$.eslint())
        .pipe($$.eslint.format())
        .pipe($$.eslint.failAfterError());
}

function test(cb) {
    return gulp.src(testDir + 'index.js')
        .pipe($$.mocha({reporter: 'spec'}));
}

function doc(cb) {
    exec(path.resolve('jsdoc.sh'), function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
}

function browserify() {
    // browserify the root file src/index.js into build/filter-tree.js and filter-tree.min.js
    return gulp.src(srcDir + 'index.js')
        .pipe($$.replace(
            '\'use strict\';',
            '\'use strict\';\n\nwindow.Base = (function(){'
        ))
        .pipe($$.replace(
            'module.exports = extend;',
            'return extend;\n\n})().Base;'
        ))
        .pipe($$.mirror(
            pipe(
                $$.rename(name + '.js'),
                $$.browserify({ debug: true })
                    .on('error', $$.util.log)
            ),
            pipe(
                $$.rename(name + '.min.js'),
                $$.browserify(),
                $$.uglify()
                    .on('error', $$.util.log)
            )
        ))
        .pipe(gulp.dest(buildDir));
}

function browserSyncLaunchServer() {
    browserSync.init({
        server: {
            // Serve up our build folder
            baseDir: buildDir,
            index: "demo.html"
        },
        port: 5001
    });
}

function clearBashScreen() {
    var ESC = '\x1B';
    console.log(ESC + 'c'); // (VT-100 escape sequence)
}
