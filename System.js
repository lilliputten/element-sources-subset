/* jshint camelcase: false, unused: false */
/* globals debugger, DBG, modules, window, document */
/**
 *
 * @overview System
 * @author lilliputten <lilliputten@yandex.ru>
 *
 * @since ~2017.01.09, 14:52
 * @version 2017.03.07, 06:55
 *
 * $Date$
 * $Id$
 *
 * @module System
 *
 */

var

    // // Глобальный объект
    __global = typeof global !== 'undefined' ? global : typeof module !== 'undefined' ? module : typeof window !== 'undefined' ? window : this,

    YENV = __global.YENV = ( process.env && process.env.YENV ) ? process.env.YENV : 'enb',

    modules = __global.modules = require('ym'),
    vow = require('vow'),
    path = require('path'),
    fs = require('fs'),

    // extend = require('extend'),
    lodashTemplate = require('lodash.template'),

    undef
;

var System = __global.System = {

    YENV : YENV,
    MODE : YENV,

    modules : modules,
    vow : vow,
    path : path,
    fs : fs,
    // extend : extend,

    lodashTemplate : lodashTemplate,

    /** Путь к корню проекта (относительно него загружаем все модули) */
    rootPath : process.cwd().replace(/[\\]/g,'/')+'/', // '../'

    /** Глобальный объект */
    global : __global,

    /** Движок модулей YM */
    modules : modules,

    /** Префикс пути для генерации bemjson-снапшотов */
    generatedBemjsonPrefix : 'bemjson/',
    /** Постфикс пути для генерации bemjson-снапшотов */
    generatedBemjsonPostfix : '.json',

    /** getPageId() ** {{{ Определение ID страницы (бандла) по его пути (имя последней папки)
     * @param {string} dirname - Имя директории модуля
     */
    getPageId : function (dirname) {
        var pageId = this.pageId = dirname.replace(/^.*[\\\/](.*)$/, '$1');
        return pageId;
    },/*}}}*/

    /** app() ** {{{ Создаём описание блока `inject/app` на основе описания страницы.
     *
     * @param {object} ctx - Объект описания страницы
     *
     */
    app : function(ctx) {

        ctx = ctx || {};

        var pageId = ctx.pageId || this.pageId;

        return {
            block : 'page',
            pageId : pageId,
            title : ctx.title || pageId,
            content : {
                block : 'app',
                pageId : pageId,
                // mix : [
                //     { block : pageId },
                // ],
                mods : Object.assign({
                        emulate : true,
                    },
                    // Расширяем модификаторы для подключения подмодулей
                    project.config.appModules,
                    ctx.mods
                ),
                js : Object.assign({
                    emulateId : ( pageId !== 'App' ) ? pageId : undefined,
                    // pageId : pageId,
                }, ctx.js),
                content : ctx.content,
            },
        };

    },/*}}}*/

    /** loadFile() ** {{{ Загрузить и кешировать файл относительно корня проекта
     * @param {string} filename - Относительное имя файла
     * Если файл не найден, возвращается null
     */
    loadFile : function (filename) {

        var loadPath = this.rootPath + filename;

        if ( this.loadedFiles && this.loadedFiles[filename] ) {
            // DBG( 'file from cache', filename );
            return this.loadedFiles[filename];
        }
        else if ( fs.existsSync(loadPath) ) {
            // DBG( 'loadFile', filename );
            var result = fs.readFileSync(loadPath, 'utf8');
            ( this.loadedFiles || ( this.loadedFiles = {} ) )[filename] = result;
            return result;
        }

        return null;

    },/*}}}*/

    /** parseLodashTemplate ** {{{ Обработать шаблон (lodash <%=...%>)
     * @param {string} template - Шаблон
     * @param {object} [ctx] - Контекст
     */
    parseLodashTemplate : function (template, ctx) {

        try {

            // Парсим lodash шаблон
            var template = lodashTemplate(template)(ctx);

            return template;

        }
        catch (e) {
            console.error( 'parseLodashTemplate error', e );
            /*DEBUG*//*jshint -W087*/debugger;
            return template;
        }

    },/*}}}*/

    /** preloadModulesPaths ** {{{ Файлы модулей, загрузка которых необходима для разрешения (см. ниже) */
    preloadModulesPaths : [
        'libs/bem-core/common.blocks/objects/objects.vanilla.js',
        'blocks/libs/objects/objects.js',
        'blocks/shared/project/project.js',
        'blocks/shared/project/__root/project__root.js',
        'blocks/shared/project/__config/project__config.js',
        'blocks/shared/project/__helpers/project__helpers.js',
        'blocks/libs/dateformatter/dateformatter.js',
    ],/*}}}*/

    /** loadModule() ** {{{*/loadModule : function (path) {
        try {
            return require(this.rootPath + path);
        }
        catch (e) {
            console.error( 'loadModule error', e );
            /*DEBUG*//*jshint -W087*/debugger;
        }
    },/*}}}*/

};

// Загружаем необходимые модули
System.preloadModulesPaths.map(function(modulePath){
    System.loadModule(modulePath);
});

// Промис на разрешение требуемых модулей
var promise = new vow.Promise(function(resolve,reject) {

    try {

        // Запрос модулей
        modules.require(['project'], function(project) {
            System.project = project; // Для исопльзования в сборке
            project.System = System; // Для использования в bemhtml
            project.config.System = System; // Для использования в bemhtml
            // Разрешаем объект в экспорт
            resolve(System);
        });

    }
    catch (e) {
        console.error( 'require:project error', e );
        /*DEBUG*//*jshint -W087*/debugger;
    }

});

// Экспорт модуля
module.exports = promise;

