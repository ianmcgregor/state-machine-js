/* jshint strict: false */
var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    jshint = require('gulp-jshint');

// paths and file names
var src = './src',
    jsSrc = src+'/utils/',
    vendors = src+'/vendors/';

// server
gulp.task('default', function() {
    browserSync({
        server: {
            baseDir: './'
        }
    });
});

// js hint - ignore libraries and bundled
gulp.task('jshint', function() {
  return gulp.src([
      './gulpfile.js',
      './example/main.js',
      jsSrc+'/**/*.js',
      //'test/**/*.js',
      '!'+vendors+'**/*.js'
    ])
    .pipe(jshint({
      'node': true,
      'browser': true,
      'es5': false,
      'esnext': true,
      'bitwise': false,
      'camelcase': false,
      'curly': true,
      'eqeqeq': true,
      'immed': true,
      'latedef': true,
      'newcap': true,
      'noarg': true,
      'quotmark': 'single',
      'regexp': true,
      'undef': true,
      'unused': true,
      'strict': true,
      'trailing': true,

      'predef': [
          'Modernizr',
          'ga'
      ]
  }))
  .pipe(jshint.reporter('jshint-stylish'));
});

