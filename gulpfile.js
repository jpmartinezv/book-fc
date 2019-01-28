const gulp = require('gulp');
const livereload = require('gulp-livereload');

gulp.task('watch', function () {
    livereload.listen();

    gulp.watch(['./css/*.css', './js/*.js', './*.html'], function (files) {
        livereload.changed(files);
    });
});