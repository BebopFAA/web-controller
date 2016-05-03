var gulp = require('gulp');
var sass = require('gulp-sass');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');

// Compile SCSS files into CSS
gulp.task('sass', function () {
  return gulp.src('public/sass/**/*.scss')
  .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
  .pipe(gulp.dest('public/css'));
});

// Basic usage
gulp.task('scripts', function () {
  // Single entry point to browserify
  gulp.src('public/js/main.js')
		.pipe(browserify({
      insertGlobals: true,
      ignore: [
        './lib-cov/fluent-ffmpeg'
      ]
    }))
    .on('prebundle', function (bundler) {
      bundler.require('cylon-keyboard');
      bundler.require('cylon-bebop');
    })
		.pipe(rename('main-built.js'))
		.pipe(gulp.dest('public/js'));
});

// Default task to watch files
gulp.task('default', ['sass', 'scripts'], function () {
  gulp.watch('public/sass/**/*.scss', ['sass']);
  gulp.watch('public/js/main.js', ['scripts']);
});
