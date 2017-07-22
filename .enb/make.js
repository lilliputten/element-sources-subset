/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals debugger, DBG */
/**
 *
 * @overview Управление инфраструктурой одностраничного приложения (SPA).
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.03
 * @version 2017.01.24, 13:51
 *
 * $Date: 2017-05-30 19:23:01 +0300 (Tue, 30 May 2017) $
 * $Id: make.js 8446 2017-05-30 16:23:01Z miheev $
 *
*/

var
    __global = typeof global !== 'undefined' ? global : typeof module !== 'undefined' ? module : typeof window !== 'undefined' ? window : this,

    // inject|enb
    YENV = __global.YENV = __global.YENV ? __global.YENV : ( process.env && process.env.YENV ) ? process.env.YENV : 'enb',

    // Порт nginx
    NGINX_PORT = '5590',

    // Запускаемся из-под nginx/enb?
    LOCAL_NGINX = __global.LOCAL_NGINX = (
        __global.enbServerRequest &&
        __global.enbServerRequest.headers &&
        __global.enbServerRequest.headers.host &&
        __global.enbServerRequest.headers.host.indexOf(':'+NGINX_PORT) !== -1
        ) ? true : false,

    // Параметры...

    CSS_CORE_URL = ( YENV === 'inject' || LOCAL_NGINX ) ? '../../' : '/core/',
    CSS_LIBS_URL = ( YENV === 'inject' || LOCAL_NGINX ) ? CSS_CORE_URL + 'libs/' : '/libs/',
    CSS_BLOCKS_URL = ( YENV === 'inject' || LOCAL_NGINX ) ? CSS_LIBS_URL + 'bem-blocks-assets/' : '/blocks/',

    // Папка с блоками
    blocksDir = 'blocks',

    // Страница-приложение, пакеты которой включают общие блоки
    rootPage = 'App',
    // "Особенные" блоки -- не включаются в общие (SHARED, App, etc) пакеты
    customBlocks = [ 'pages', 'custom' ],

    // Зависимости...
    // fs = require('fs'),
    fs = require('fs-extra'),
    path = require('path'),
    // extend = require('extend'),
    naming = require('bem-naming'),

    sourceRoot = process.cwd(), // .replace(/\\/g, '/'),

    bemTechs = require('enb-bem-techs'),
    // bemSpecs = require('enb-bem-specs'),

    /** techs ** {{{ Технологии
     */
    techs = {
        // essential
        fileProvider: require('enb/techs/file-provider'),
        fileMerge: require('enb/techs/file-merge'),

        // Сборщик
        borschik: require('enb-borschik/techs/borschik'),

        // Предобработка включений во время сборки -- ???
        borschikInclude: require('enb-borschik/techs/js-borschik-include'),

        // css
        stylus: require('enb-stylus/techs/stylus'),

        // browser.js
        // WEB_TINTS/source/node_modules/enb-js/techs/browser-js.js
        browserJs: require('enb-js/techs/browser-js'),
        // bemhtmlJs
        // WEB_TINTS/source/node_modules/enb-bemxjst/techs/bemhtml.js
        bemhtmlJs: require('enb-bemxjst/techs/bemhtml'),

        // // bundle
        // cssChunks: require('enb-bembundle/techs/css-borschik-chunks'),
        // jsChunks: require('./techs/js-vanilla-chunks'),
        // jsBembundleComponent: require('./techs/js-bembundle-component'),
        // jsBembundlepage: require('enb-bembundle/techs/js-bembundle-page'),

        // bemtree
        // bemtree: require('enb-bemxjst/techs/bemtree'),

        // bemhtml
        bemjsonToHtml: require('enb-bemxjst/techs/bemjson-to-html'),
        bemjsonToJson: require('./techs/bemjson-to-json'),

        bemtree: require('enb-bemxjst/techs/bemtree'),

        // repack
        repackBemhtml: require('./techs/enb-repack-bemhtml'),
        repackBrowser: require('./techs/enb-repack-browser'),
        repackStyles: require('./techs/enb-repack-styles'),

        // beautify
        htmlBeautify: require('enb-beautify/techs/enb-beautify-html'),
        // cssBeautify: require('enb-beautify/techs/enb-beautify-css'),

    },/*}}}*/

    /** srcLevelsFirst ** {{{ Иходные блоки: первыми перечисляем те, для которых важен порядок подключения */
    srcLevelsFirst = [
        'root',
        'shared',
        'controllers',
        'interface',
    ]
    .map((folder) => { return path.posix.join(blocksDir, folder); }),
    /*}}}*/
    /** srcLevels ** {{{ Исходные блоки: добавляем все оставшиеся */
    srcLevels = srcLevelsFirst
    .concat(fs.readdirSync(blocksDir)
        .filter((folder) => { return !folder.startsWith('00') && !folder.startsWith('.'); } )
        .map((folder) => { return path.posix.join(blocksDir, folder); } )
        .filter((folder) => { return srcLevelsFirst.indexOf(folder) === -1; })
    ),
    /*}}}*/
    /** libLevels ** {{{ Исходные блоки библиотек */
    libLevels = [

        { path: 'libs/bem-core/common.blocks', check: false },
        { path: 'libs/bem-core/desktop.blocks', check: false },

        { path: 'libs/bem-components/common.blocks', check: false },
        { path: 'libs/bem-components/desktop.blocks', check: false },
        { path: 'libs/bem-components/design/common.blocks', check: false },
        { path: 'libs/bem-components/design/desktop.blocks', check: false },

    ],
    /*}}}*/

    /** Все исходные блоки */
    levels = libLevels.concat(srcLevels),

    LEVELS_END

;

/** wrapInPage ** {{{ */
function wrapInPage(bemjson, meta) {
    var basename = path.basename(meta.filename, '.bemjson.js');
    return {
        block: 'page',
        title: naming.stringify(meta.notation),
        head: [{ elem: 'css', url: basename + '.css' }],
        scripts: [{ elem: 'js', url: basename + '.js' }],
        mods: { theme: getThemeFromBemjson(bemjson) },
        content: bemjson
    };
}/*}}}*/

// DEBUG
// console.log('srcLevels', srcLevels);
// process.exit();

module.exports = function (config) {

    var isProd = false; //process.env.YENV === 'production';

    /*{{{ specs... */

    config.includeConfig('enb-bem-specs');
    var specs = config.module('enb-bem-specs').createConfigurator('specs');
    var specsConfig = {
        destPath: blocksDir + '.specs',
        levels: srcLevels,
        jsSuffixes: ['vanilla.js', 'browser.js', 'js'],
        scripts: ['https://yastatic.net/es5-shims/0.0.2/es5-shims.min.js'],
        sourceLevels: libLevels.concat([
            // { path: 'libs/bem-core/common.blocks', check: false },
            // { path: 'libs/bem-core/desktop.blocks', check: false },
            // { path: 'libs/bem-components/common.blocks', check: false },
            // { path: 'libs/bem-components/desktop.blocks', check: false },
            // { path: 'libs/bem-components/design/common.blocks', check: false },
            // { path: 'libs/bem-components/design/desktop.blocks', check: false },
            { path: 'libs/bem-pr/spec.blocks', check: false },
            // 'common.blocks',
            // 'blocks/design',
        ]).concat(srcLevels),
        templateEngine: {
            bemtreeTemplateTech: require('enb-bemxjst/techs/bemtree'),
            templateTech: require('enb-bemxjst/techs/bemhtml'),
            templateOptions: { sourceSuffixes: ['bemhtml', 'bemhtml.js'] },
            htmlTech: require('enb-bemxjst/techs/bemjson-to-html'),
            htmlTechOptionNames: { bemjsonFile: 'bemjsonFile', templateFile: 'bemhtmlFile' }
        }
    };
    specs.configure(specsConfig);

    /*}}}*/

    /*{{{ docs... */

    config.includeConfig('enb-bem-examples');
    var examplesConfigurator = config.module('enb-bem-examples').createConfigurator('examples');
    var examplesConfig = {
        levels: srcLevels,
        destPath: blocksDir + '.examples',
        techSuffixes: ['examples'],
        fileSuffixes: ['bemjson.js', 'title.txt'],
        inlineBemjson: true,
        processInlineBemjson: wrapInPage
    };
    examplesConfigurator.configure(examplesConfig);

    config.includeConfig('enb-bem-docs');
    var docsConfigurator = config.module('enb-bem-docs').createConfigurator('docs', 'examples');
    /*{{{ Original...
    var docsConfig = {
        levels: levels,
        destPath: path.join(destFolder, lib, platform + '.docs'),
        exampleSets: [path.join(destFolder, lib, platform + '.examples')],
        langs: config.getLanguages(),
        jsdoc: {
            suffixes: ['vanilla.js', 'browser.js', 'js'],
            parser: libConf.jsdoc
        }
    }; }}}*/
    var docsConfig = {
        levels: srcLevels,
        destPath: blocksDir + '.docs',
        exampleSets: [blocksDir + '.examples'],
        langs: ['ru'], //config.getLanguages(),
        jsdoc: {
            suffixes: ['vanilla.js', 'browser.js', 'js'],
            // parser: libConf.jsdoc,
        },
    };
    docsConfigurator.configure(docsConfig);

    /*}}}*/

    // ***

    /*{{{ config.nodes */
    config.nodes('pages/*', function(node) {

        node.addTechs([

            // Собствено сканирование и сборка
            [bemTechs.levels, { levels: levels }],
            [techs.fileProvider, { target: '?.bemjson' }],
            [bemTechs.bemjsonToBemdecl, { source: '?.bemjson' }],
            [bemTechs.deps],
            [bemTechs.files],

            // bemtree
            // [bemTechs.bemtree, { sourceSuffixes: ['bemtree', 'bemtree.js'], target: '?.bemtree.js' }],

            // HTML
            [techs.bemjsonToHtml, {
                bemjsonFile: '?.bemjson',
                target: '?.htm',
            }],
            [techs.htmlBeautify, {
                htmlFile: '?.htm',
                target: '?.html',
            }],

            // JSON
            [techs.bemjsonToJson, {
                bemjsonFile: '?.bemjson',
            }],

            // // client bemhtml
            // [bemTechs.depsByTechToBemdecl, {
            //     target: '?.bemhtml.bemdecl.js',
            //     sourcemap: true,
            //     sourceTech: 'js',
            //     destTech: 'bemhtml'
            // }],
            // [bemTechs.deps, {
            //     target: '?.bemhtml.deps.js',
            //     sourcemap: true,
            //     bemdeclFile: '?.bemhtml.bemdecl.js'
            // }],
            // [bemTechs.files, {
            //     depsFile: '?.bemhtml.deps.js',
            //     filesTarget: '?.bemhtml.files',
            //     dirsTarget: '?.bemhtml.dirs'
            // }],
            // [techs.bemhtmlJs, {
            //     target: '?.browser.bemhtml.js',
            //     sourcemap: true,
            //     filesTarget: '?.bemhtml.files',
            //     sourceSuffixes: ['bemhtml', 'bemhtml.js'],
            // }],

            // Собираем исходные файлы browser.js
            [techs.browserJs, {
                // sourceSuffixes: ['vanilla.js', 'js', 'browser.js'],
                includeYM: true,
                compress : false,
                sourcemap : {
                    // Параметры для модифицированной версии `node_modules/enb-source-map/lib/file.js` (см. docs:Patches:enb-js-source-maps)
                    sourceRoot : sourceRoot, // Базовый путь файлов проекта
                    outputSourceRoot : '/', // Подстановка sourceRoot для `sourceMappingURL` в `enb-source-map/lib/utils.js:joinContentAndSourceMap`
                    unpackedData : false, // Упаковывать ли данные для `sourceMappingURL` в `enb-source-map/lib/utils.js:joinContentAndSourceMap`
                },
                target: '?.browser.js', // Для передачи в препроцессинг технологией borschik (см. ниже)
            }],
            // // Препроцессинг browser.js borschik (`borschik:include:*`)
            // [techs.borschik, {
            //     source: '?.browser.pre.js',
            //     target: '?.browser.js',
            //     minify: false,
            // }],

            // Собираем исходные файлы bemhtmlJs
            [techs.bemhtmlJs, {
                sourceSuffixes: ['bemhtml', 'bemhtml.js'],
                target: '?.bemhtml.js', // Для передачи в препроцессинг технологией borschik (см. ниже)
            }],
            // // Препроцессинг bemhtml.js borschik (`borschik:include:*`)
            // [techs.borschik, {
            //     source: '?.bemhtml.pre.js',
            //     target: '?.bemhtml.js',
            //     minify: false,
            // }],

            // Собираем стили (с передачей параметров)
            [techs.stylus, {
                target: '?.styles.css',
                sourcemap: true,
                use : function (style) {
                    style.import('../../blocks/.includes/all.styl');
                    style.define('YENV', YENV);
                    style.define('LOCAL_NGINX', LOCAL_NGINX);
                    style.define('CSS_CORE_URL', CSS_CORE_URL);
                    style.define('CSS_LIBS_URL', CSS_LIBS_URL);
                    style.define('CSS_BLOCKS_URL', CSS_BLOCKS_URL);
                    // style.define('ENB_MODE', 'DEV');
                    // style.define('ENB_EXT', '.styles.css');
                },
                autoprefixer: {
                    browsers: ['ie >= 10', 'last 2 versions', 'opera 12.1', '> 2%']
                }
            }],

            // // Пакеты bembundle (не используем)
            // [techs.cssChunks, { freeze: true }],
            // [techs.jsChunks],
            // [techs.jsBembundleComponent],

            // // Объединённые пакеты (пока не используется -- ?)
            // [techs.fileMerge, {
            //     target: '?.all.js',
            //     // target: '?.js',
            //     sourcemap: true,
            //     sources: ['?.browser.js', '?.browser.bemhtml.js']
            // }],

            // Переупаковка
            [techs.repackBrowser, {
                sourceSuffixes: ['browser.js'],
                target: '?.browserx.js',
                rootPage : rootPage,
                customBlocks : customBlocks,
            }],
            [techs.repackBemhtml, {
                sourceSuffixes: ['bemhtml.js'],
                target: '?.bemhtmlx.js',
                rootPage : rootPage,
                customBlocks : customBlocks,
            }],
            [techs.repackStyles, {
                sourceSuffixes: ['styles.css'],
                target: '?.stylesx.css',
                rootPage : rootPage,
                customBlocks : customBlocks,
            }],

            // // Минимификация
            // [techs.borschik, {
            //     source: '?.js',
            //     target: '?.min.js',
            //     minify: isProd,
            // }],
            // [techs.borschik, {
            //     source: '?.css',
            //     target: '?.min.css',
            //     tech: 'cleancss',
            //     map: true,
            //     // map: 'file',
            //     // 'input-map': 'auto',
            //     // 'input_map': 'auto',
            //     // 'inputMap': 'auto',
            //     minify: isProd,
            // }],

        ]);

        node.addTargets( [

            // '?.bemtree.js',
            '?.json',

            '?.htm',
            '?.html',

            '?.styles.css',
            '?.browser.js',
            '?.bemhtml.js',

            '?.stylesx.css',
            '?.browserx.js',
            '?.bemhtmlx.js',

            // Пакеты:
            // '?.js',
            // '?.all.js',

            // Бандлы:
            // '?.css-chunks.js', '?.js-chunks.js', '?.bembundle.js',

        ] );

    });/*}}}*/

    /*{{{ Попытка сделать merge/substract...
    config.node('./', function (node) {

        node.addTech([bemTechs.mergeDeps, {
            sources: [
                // 'bundle-1.deps.js',
                // 'bundle-2.deps.js',
                'pages/App/App.deps.js',
                'pages/Test/Test.deps.js',
            ],
            target: 'merged-bundle.deps.js'
        }]);

        node.addTarget('merged-bundle.deps.js');

    });
    }}}*/

};

