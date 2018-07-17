const gulp = require('gulp');
const livereload = require('gulp-livereload');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('styles', function () {
    gulp.src('./sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 7', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./css'));
});

gulp.task('watch', function () {
    livereload.listen();

    gulp.watch('./sass/**/*.scss', ['styles']);
    gulp.watch(['./css/*.css', './js/*.js', './*.html'], function (files) {
        livereload.changed(files);
    });
});