var gulp = require('gulp'),
	sass = require('gulp-sass');

// Compile SCSS files into CSS
gulp.task('sass', function () {
	return gulp.src('public/sass/**/*.scss')
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(gulp.dest('public/css'));
});

// Default task to watch files 
gulp.task('default', function() {
    gulp.watch('public/sass/**/*.scss', ['sass']);
});