var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var CompleteFileList =
    [
        './Libs/Voxii.Core.js',
        './Libs/Voxii.MagickaVox.js',
        './Libs/Voxii.Slab.js',
        './Libs/Voxii.Qb.js',
        './Libs/Voxii.Embed.js',
        './ThirdpartyLibs/OrbitControls.js'
    ];

gulp.task('default', function()
{
    return gulp.src(
        CompleteFileList)
        .pipe(sourcemaps.init())
        .pipe(concat('Voxii.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build/'));
});

var watcher = gulp.watch('./Libs/*.js', ['default']);
watcher.on('change', function(event)
{
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});