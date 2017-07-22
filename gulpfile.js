/* jshint camelcase: false, unused: false */
/* globals debugger, DBG */
/**
 *
 * @overview gulpfile.js - Постобработка собранных файлов
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.11.18 13:05
 * @version 2017.05.09, 17:33
 *
 * $Date: 2017-06-30 12:58:00 +0300 (Fri, 30 Jun 2017) $
 * $Id: gulpfile.js 8673 2017-06-30 09:58:00Z miheev $
 *
*/

/*{{{ General requirements... */

var

    // parameters...
    argv = require('yargs').alias('d', 'debug').boolean('d').argv,

    // gulp system...

    gulp = require('gulp'),

    // Stream = require('stream'),
    // mergeStream = require('merge-stream'),
    // eventStream = require('event-stream'),

    // gulpFile = require('gulp-file'),

    gulpIf = require('gulp-if'), // https://github.com/robrich/gulp-if
    // gulpIgnore = require('gulp-ignore'), // https://www.npmjs.com/package/gulp-ignore
    gulpSequence = require('gulp-sequence'), // https://www.npmjs.com/package/gulp-sequence

    // lazypipe = require('lazypipe'), // https://github.com/OverZealous/lazypipe

    // exec = require('gulp-exec'), // https://www.npmjs.com/package/gulp-exec

    // gulpSort = require('gulp-sort'),
    // gulpOrder = require('gulp-order'),
    // insert = require('gulp-insert'),

    rename = require('gulp-rename'), // https://www.npmjs.com/package/gulp-rename

    through = require('gulp-through'), // https://www.npmjs.com/package/gulp-through

    // misc...

    // fs = require('fs'),
    fs = require('fs-extra'),

    // html_beautify = require('js-beautify').html, // https://github.com/beautify-web/js-beautify

    // tags = require('gulp-javascript-ctags'), // TODO 2017.03.15, 20:28 -- Взфть из старой версии

    path = require('path'),
    // gutil = require('gulp-util'), // https://www.npmjs.com/package/gulp-util
    // extend = require('extend'),

    yaml = require('js-yaml'),
    // cson = require('fs-cson'),

    // processing...

    concat = require('gulp-concat'),
    del = require('del'),
    // https://www.npmjs.com/package/gulp-template
    // https://lodash.com/docs//template
    template = require('gulp-template'),
    // https://www.npmjs.com/package/gulp-preprocess
    // https://github.com/jsoverson/preprocess//directive-syntax
    preprocess = require('gulp-preprocess'),

    // autoprefixer = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'), // https://www.npmjs.com/package/gulp-sourcemaps
    cssmin = require('gulp-cssmin'), // https://www.npmjs.com/package/gulp-cssmin
    uglify = require('gulp-uglify'), // https://www.npmjs.com/package/gulp-uglify
    replace = require('gulp-replace'), // https://www.npmjs.com/package/gulp-replace
    // prettify = require('gulp-prettify'), // https://www.npmjs.com/package/gulp-prettify

    REQUIRES_END
;

/*}}}*/
/*{{{ Variables... */

var

    // Глобальный объект
    __global = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : typeof module !== 'undefined' ? module : this,

    // Текущая дата
    now = new Date(),

    // Версия: дата
    dateTag = require('dateformat')(now, 'yymmdd-HHMMss'),
    // Версия: хэш
    hashTag = require('md5')(dateTag).substr(0,6),

    // Испортируем npm'овский проект
    PROJECT = require('./package.json'),

    // Файл конфигурации
    CONFIG_FILE = 'gulpfile.config.yaml',
    // Инициируем конфиг
    CONFIG = fs.existsSync(CONFIG_FILE) && yaml.load(fs.readFileSync(CONFIG_FILE), 'utf8') || {},

    // // Корневая папка проекта (2017.03.15, 20:14 -- не используется?)
    // PROJECT_ROOT = process.cwd().replace(/\\/g,'/').replace(/([^\/])$/,'$1/'),

    VARIABLES_END
;

console.info( 'hashTag', hashTag );

// Расширяем CONFIG параметрами версификации
Object.assign(CONFIG, {
    projectName : PROJECT.name,
    projectVersion : PROJECT.version,
    dateTag : dateTag,
    hashTag : hashTag,
    projectTag : PROJECT.version + ' @ ' + dateTag + ' | ' + hashTag,
});
CONFIG.projectTagFull = PROJECT.name + ' v.' + CONFIG.projectTag;
CONFIG.projectTagFullComment = '<!-- ' + CONFIG.projectTagFull + ' -->';

// Флаг вывода расширенной информации в задачах gulp
CONFIG.GULP_DEBUG = argv.debug || true;

// Экспортируем конфигурацию // ???
__global.gulpConfig = CONFIG;

/*}}}*/
/*{{{ Tools... */

var

    /** Краткое обращение к console.log */
    DBG = function () { if ( console ) { console.log.apply(console, arguments); } },

    /** Тест */
    testFunc = () => { return 'ok'; },

    /** Отладочный pipe */
    gulpDebug = CONFIG.GULP_DEBUG && require('gulp-debug') || through('noDebug', (file, config) => { return; }),

    /** Пустой поток */
    emptyStream = through('emptyStream', (file, config) => { return; }),

    /** expandFilesList ** {{{ Дополнить пути в массиве (постфиксная маска, префиксный путь)
     * @param {string[]} files - Список файлов
     * @param {string} [prefix] - Путь, добавляемый перед именем файла
     * @returns {string[]}
     */
    expandFilesList = (files, prefix) => {
        return files.map( (file) => {
            file = file.endsWith('/') && file + '**/*' || file;
            if ( prefix ) {
                file = path.posix.join(prefix, file);
            }
            return file;
        });
    },/*}}}*/

    /** expandDestFilesList ** {{{ Дополнить пути в массиве (добавляем CONFIG.DEST_PATH)
     * @param {string[]} files - Список файлов
     * @returns {string[]}
     * @see {@link #expandFilesList
     */
    expandDestFilesList = (files) => {
        return expandFilesList(files, CONFIG.DEST_PATH);
    },/*}}}*/

    /** posixFilesList ** {{{ Преобразуем список имён файлов в posix-compatible вид (`/`)
     * @param {string[]} files - Список файлов
     * @returns {string[]}
     */
    posixFilesList = (files) => {
        return files.map( (file) => {
            file.replace(/\\/g,'/');
        });
    },/*}}}*/

    /** normalizePath ** {{{ Избавляемся от последовательностей вида `path/..` в путях.
     * @param {string} file - Путь файловой системы (POSIX)
     * @returns {string}
     */
    normalizePath = (filename) => {
        while ( true ) { // filename.indexOf('/..') > 0
            var newFilename = filename.replace(/\/[^\/]*\/\.\./g, '');
            if ( filename === newFilename ) { break; }
            filename = newFilename;
        }
        return filename;
    },/*}}}*/

    TOOLS_END
;

/*}}}*/

/*{{{ Tasks : utils */

/** bootstrapJs ** {{{ Пересобрать js для библиоткеи bootstrap в соответствии с заданным списком файлов.
 */
gulp.task( 'bootstrapJs', () => {
    return gulp.src( expandFilesList(CONFIG.BOOTSTRAP_JS_FILES, CONFIG.BOOTSTRAP_JS_PATH), { base: CONFIG.BOOTSTRAP_JS_PATH } )
        .pipe( sourcemaps.init() )
        .pipe( concat( CONFIG.BOOTSTRAP_JS_COMBO ) )
        .pipe( sourcemaps.write() )
        .pipe( gulp.dest( CONFIG.BOOTSTRAP_JS_PATH ) )
        .pipe( uglify() )
        .pipe( rename({ suffix: '.min' }) )
        .pipe( gulp.dest( CONFIG.BOOTSTRAP_JS_PATH ) )
});/*}}}*/

/*}}}*/
/*{{{ Tasks : clean*/

/** cleanFakeData ** {{{ Очищаем всё */
gulp.task( 'cleanFakeData', (next) => {
    var pagesPath = path.posix.join(CONFIG.FAKE_DATA_PATH, '**/*');
    var files = [
        pagesPath,
    ];
    console.info( 'cleanFakeData:', files.map((file)=>{ return '\n- '+file }).join('') );
    return del( files, next );
});/*}}}*/
/** cleanBem ** {{{ Очищаем всё */
gulp.task( 'cleanBem', (next) => {
    var pagesPath = path.posix.join(CONFIG.PAGES_PATH, '*/*');
    var files = [
        pagesPath,
        '!' + pagesPath + '.{bemjson,bemjson.js}',
        '.enb/tmp',
    ];
    console.info( 'cleanBem:', files.map((file)=>{ return '\n- '+file }).join('') );
    return del( files, next );
});/*}}}*/

/** cleanInit ** {{{ */
gulp.task( 'cleanInit', (next) => {
    // DBG( CONFIG.CLEAN_INIT_FILES );
    files =
        // [
        //     CONFIG.INJECT_BLOCKS_ASSETS_PATH,
        //     CONFIG.INJECT_LIBS_PATH,
        //     CONFIG.INJECT_DEPS_PATH,
        // ]
        CONFIG.CLEAN_INIT_FILES
        .map( (file) => { return path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL, file) })
    ;
    console.info( 'cleanInit:', files.map((file)=>{ return '\n- '+file }).join('') );
    return del( files, { force: true }, next );
});/*}}}*/

/** cleanLogs ** {{{ */
gulp.task( 'cleanLogs', (next) => {
    files =
        [
        ]
        .concat(CONFIG.LOGS_FILES)
        .map( (file) => { return path.posix.join(CONFIG.INJECT_PATH, file) })
    ;
    console.info( 'cleanLogs:', files.map((file)=>{ return '\n- '+file }).join('') );
    return del( files, { force: true }, next );
});/*}}}*/
/** cleanCache ** {{{ */
gulp.task( 'cleanCache', (next) => {
    files =
        [
        ]
        .concat(CONFIG.CACHE_FILES)
        .map( (file) => { return path.posix.join(CONFIG.INJECT_PATH, file) })
    ;
    console.info( 'cleanCache:', files.map((file)=>{ return '\n- '+file }).join('') );
    return del( files, { force: true }, next );
});/*}}}*/

/** cleanInject ** {{{ */
gulp.task( 'cleanInject', (next) => {
    files =
        [
            CONFIG.APP_PAGE_NAME + '.html',
        ]
        .concat(CONFIG.CLEAN_INJECT_FILES)
        .map( (file) => { return path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL, file) })
    ;
    console.info( 'cleanInject:', files.map((file)=>{ return '\n- '+file }).join('') );
    return del( files, { force: true }, next );
});/*}}}*/

/*}}}*/
/*{{{ Tasks : init */

/** copyBemBlocksAssets ** {{{ */
gulp.task( 'copyBemBlocksAssets', () => {
    var destPath = path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL, CONFIG.INJECT_BLOCKS_ASSETS_PATH);
    return gulp.src( expandFilesList(CONFIG.INJECT_BLOCKS_ASSETS_FILES), { base: '.' } )
        .pipe( gulp.dest( destPath ) )
        .pipe( gulpDebug({ title: 'copyBemBlocksAssets ->' }) )
    ;
});/*}}}*/

/** copyDeps ** {{{ */
gulp.task( 'copyDeps', () => {
    var destPath = path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL, CONFIG.INJECT_LIBS_PATH);
    return gulp.src( expandFilesList(CONFIG.DEPS_FILES, CONFIG.DEPS_PATH), { base: CONFIG.DEPS_PATH } )
        .pipe( gulp.dest( destPath ) )
        .pipe( gulpDebug({ title: 'copyDeps ->' }) )
    ;
});/*}}}*/

/** copyLibs ** {{{ */
gulp.task( 'copyLibs', () => {
    var destPath = path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL, CONFIG.INJECT_LIBS_PATH);
    return gulp.src( expandFilesList(CONFIG.LIBS_FILES, CONFIG.LIBS_PATH), { base: CONFIG.LIBS_PATH } )
        .pipe( gulp.dest( destPath ) )
        .pipe( gulpDebug({ title: 'copyLibs ->' }) )
    ;
});/*}}}*/
/** copyLibsDev ** {{{ */
gulp.task( 'copyLibsDev', () => {
    var destPath = path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL, CONFIG.INJECT_LIBS_PATH);
    return gulp.src( expandFilesList(CONFIG.LIBS_DEV_FILES, CONFIG.LIBS_DEV_PATH), { base: CONFIG.LIBS_DEV_PATH } )
        .pipe( gulp.dest( destPath ) )
        .pipe( gulpDebug({ title: 'copyLibsDev ->' }) )
    ;
});/*}}}*/

/** preInit ** {{{ */
gulp.task( 'preInit', (next) => {
    return gulpSequence( CONFIG.PRE_INIT_TASKS, next );
});/*}}}*/

/** init ** {{{ */
gulp.task( 'init', (next) => {
    return gulpSequence( 'preInit', [
        'copyBemBlocksAssets',
        'copyDeps',
        'copyLibs',
        'copyLibsDev',
        // 'copyScatic',
        // 'copyRoot',
    ], next);
});/*}}}*/

/** reinit ** {{{ */
gulp.task( 'reinit', (next) => {
    return gulpSequence(
        'cleanInit',
        'init',
        next
    );
});/*}}}*/

/*}}}*/
/*{{{ Tasks : make */

/** bem ** {{{ */
gulp.task( 'bem', () => {
    process.env.YENV = 'inject';
    var
        enb = require('enb/lib/api'),
        makePromise = enb.make()
    ;
    makePromise.fail( (e) => {
        console.error( 'Error:', e );
        process.exit(1);
    });
    return makePromise;
});/*}}}*/

/** reBem ** {{{ */
gulp.task( 'reBem', (next) => {
    return gulpSequence(
        'cleanBem',
        'bem',
        next
    );
});/*}}}*/

/*}}}*/
/*{{{ Tasks : inject */

/** injectVariables ** {{{ */
gulp.task( 'injectVariables', [ ], () => {
    var data = Object.assign(CONFIG, {
        PROJECT: PROJECT,
    });
    data.VARIABLES = CONFIG.EXPORT_VARIABLES.map( (name,n) => {
        return { name : name, value : eval('data.'+name) }
    });
    gulp.src( CONFIG.EXPORT_VARIABLES_TEMPLATE )
        .pipe( gulpDebug({ title: 'injectVariables <- ' }) )
        .pipe( template(CONFIG) )
        .pipe( preprocess({ context: CONFIG }) )
        // .pipe( replace(/<!--.*?-->/g, '') )
        .pipe( rename( CONFIG.EXPORT_VARIABLES_FILE ) )
        .pipe( gulp.dest( path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL) ) )
        .pipe( gulpDebug({ title: 'injectVariables ->' }) )
});/*}}}*/

/** injectBemjson ** {{{ */
gulp.task( 'injectBemjson', () => {
    var destPath = path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL);
    return gulp.src( path.posix.join(CONFIG.PAGES_PATH, '**/*.json') )
        // .pipe( gulpDebug({ title: 'injectBemjson <- ' }) )
        .pipe( rename( (path) => {
            path.dirname = CONFIG.BEMJSON_PAGES_FOLDER;
        }) )
        .pipe( gulp.dest( destPath ) )
        .pipe( gulpDebug({ title: 'injectBemjson ->' }) )
});/*}}}*/

/** injectAssets ** {{{ */
gulp.task( 'injectAssets', () => {
    var destPath = path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL);//, CONFIG.VENDOR_PATHS.js);
    var minify = !CONFIG.DEBUG && CONFIG.INJECT_MINIFIED_ASSETS;
    return gulp.src( path.posix.join(CONFIG.PAGES_PATH, '**/*.{bemhtml,browser,styles}x.{js,css}') )
        // .pipe( gulpDebug({ title: 'injectAssets <- ' }) )
        .pipe( rename( (path) => {
            path.dirname = CONFIG.VENDOR_PATHS[path.extname.substr(1)]; // Изменяем: vendor({page})/{page}.{ext} -> {ext}.{page}.{ext}
            path.basename = path.basename.substr(0, path.basename.length-1); // Изменяем: {page}.{tech}x.* -> {page}.{tech}.*
        }) )
        // Минифицируем, если установлен флаг
        .pipe( gulpIf( (file) => { return minify && file.path.endsWith('.js') }, uglify() ) )
        .pipe( gulpIf( (file) => { return minify && file.path.endsWith('.css') }, cssmin() ) )
        .pipe( gulp.dest( destPath ) )
        .pipe( gulpDebug({ title: 'injectAssets ->' }) )
        // Минимизируем и сохраняем как '.min'...
        // .pipe( gulpIf( (file) => { return file.path.endsWith('.js') }, uglify() ) )
        // .pipe( gulpIf( (file) => { return file.path.endsWith('.css') }, cssmin() ) )
        // .pipe( rename({ suffix: '.min' }) )
        // .pipe( gulpDebug({ title: 'injectAssets (min) ->' }) )
        // .pipe( gulp.dest( destPath ) )
});/*}}}*/

/** injectApp ** {{{ */
gulp.task( 'injectApp', () => {
    var destPath = path.posix.join(CONFIG.INJECT_PATH, CONFIG.CORE_SUBURL);
    return gulp.src( path.posix.join(CONFIG.PAGES_PATH, CONFIG.APP_PAGE_NAME, CONFIG.APP_PAGE_NAME + '.html') )
        // .pipe( rename( (path) => { path.basename = 'layout'; }) )
        // .pipe( rename({ basename: 'layout' }) )
        .pipe( gulp.dest( destPath ) )
        .pipe( gulpDebug({ title: 'injectApp ->' }) )
});/*}}}*/

/** inject ** {{{ */
gulp.task( 'inject', [
    'injectApp',
    'injectAssets',
    'injectBemjson',
    'injectVariables',
]);/*}}}*/

/** reInject ** {{{ */
gulp.task( 'reInject', (next) => {
    return gulpSequence(
        'cleanInject',
        'inject',
        next
    );
});/*}}}*/

/*}}}*/
/*{{{ Tasks : test */

/** test ** {{{ */
gulp.task('test', () => {
    // DBG( 'CONFIG:', CONFIG );
    DBG( testFunc() );
});/*}}}*/

/*}}}*/

/** regenerate ** {{{ Пересобрать всё, включая библиотки (init, bem, inject) */
gulp.task( 'regenerate', (next) => {
    gulpSequence(
        [ 'cleanBem', 'cleanInit' ],
        [ 'init', 'bem', 'cleanInject' ],
        'inject',
        next
    );
});/*}}}*/

/** remake ** {{{ Пересобрать всё (без библиотек: bem, inject) */
gulp.task( 'remake', (next) => {
    gulpSequence(
        [ 'cleanBem' ],
        [ 'bem', 'cleanInject' ],
        'inject',
        next
    );
});/*}}}*/

/** cleanAll ** {{{ Очистить всё */
gulp.task( 'cleanAll', [
    'cleanFakeData',
    'cleanBem',
    'cleanInit',
    'cleanInject',
] );/*}}}*/

gulp.task( 'make', [ 'bem' ] );
gulp.task( 'default', [ 'remake' ] );
gulp.task( 'all', [ 'regenerate' ] );

