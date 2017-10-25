var browserify = require('browserify'),
  watchify = require('watchify'),
  gulp = require('gulp'),
  source = require('vinyl-source-stream'),
  sourceFile = './js/index.js',
  destFolder = './js/',
  destFile = 'esaleslogs.js';

var b = browserify({
  entries: sourceFile,
  debug: true,
  transform: [
    ['browserify-css']
  ]
});

gulp.task('browserify', function() {
  return b
    .bundle()
    .pipe(source(destFile))
    .pipe(gulp.dest(destFolder));
});

gulp.task('watch', function() {
  var bundler = watchify(b);
  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      .pipe(source(destFile))
      .pipe(gulp.dest(destFolder));
  }

  return rebundle();
});

gulp.task('default', ['browserify', 'watch']);