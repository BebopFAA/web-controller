var gulp = require('gulp'),
	sass = require('gulp-sass'),
	browserify = require('gulp-browserify'),
	rename = require('gulp-rename');

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
		.pipe(browserify({ insertGlobals: true }))
		.pipe(rename('main-built.js'))
		.pipe(gulp.dest('public/js'));
});

// Default task to watch files
gulp.task('default', function () {
  gulp.watch('public/sass/**/*.scss', ['sass', 'scripts']);
});
