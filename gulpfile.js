/*global require*/

var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var postcss = require('gulp-postcss');
var nano = require('cssnano');
var flatten = require('gulp-flatten');
var Promise = require('bluebird');

var watchify = require('watchify');
var browserify = require('browserify');
var reactify = require('reactify');

var path = require('path');
var fs = Promise.promisifyAll(require('fs'));

var dist = 'dist/';

var watching = false;
var b = watchify(browserify(watchify.args))
  .transform(reactify)
  .add('index.jsx')
  .on('log', gutil.log);

function bundle () {
  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
      // Add transformation tasks to the pipeline here
      .pipe(uglify({compress: {drop_debugger: false}}))
      .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dist))
    .on('end', function () { if (!watching) b.close(); });
};
gulp.task('build-js', bundle);
gulp.task('build-fonts', function () {
  return gulp.src('**/*.{ttf,woff,woff2,eof,svg}')
    .pipe(flatten())
    .pipe(gulp.dest(path.join(dist, 'fonts')));
});
gulp.task('build-css', function () {
  return gulp.src('index.less')
    .pipe(sourcemaps.init())
      // Add transformation tasks to the pipeline here
      .pipe(less())
      .pipe(postcss([nano]))
      .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dist));
});
gulp.task('build', ['build-js', 'build-css', 'build-fonts']);

gulp.task('before-watch', function () { watching = true; });
gulp.task('watch', ['before-watch', 'build'], function () {
  b.on('update', bundle);
  gulp.watch('**/*.less', ['build-css']);
});

gulp.task('default', ['build']);
