/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project, window, document, setCookie, getCookie */
/**
 *
 * @module loader_type_libs
 * @description Загрузка библиотек
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: loader_type_libs.js 8733 2017-07-11 16:47:15Z miheev $
 *
 */

modules.define('loader_type_libs',
    [
        'loader_type_js',
        'vow',
        'objects',
        'project',
    ],
    function(provide,
        jsLoader,
        vow,
        objects,
        project,
    __BASE) {

var isArray = Array.isArray;
var isEmpty = objects.isEmpty;

provide(/** @lends loader.prototype */ {

    /** resolveModule ** {{{ Получить (загрузить, если не загружен) ym-модуль
     * @param {String} name
     * @param {String} url
     * @returns {Promise}
     */
    resolveModule : function (name, url) {

        url = project.helpers.expand_path(url);

        return new vow.Promise(function (resolve, reject) {
            var _resolveSuccess = function(){
                modules.require([name], function _resolveModule (module) {
                    resolve(module);
                });
            };
            if ( modules.isDefined(name) ) {
                _resolveSuccess();
            }
            else {
                jsLoader(url, _resolveSuccess, function(){
                    reject({ status : 'resolveModuleError', name : name, url : url });
                });
            }
        });

    },/*}}}*/

    /** resolveLibModule ** {{{ Асинхронная загрузка (получение, если загружен) модуля
     * @param {String} name
     * @param {String} url
     * @returns {Promise}
     * См. описание модулей/библиотек в `project.config.libs`, `resolveModule`.
     */
    resolveLibModule : function (name) {

        var that = this,
            libs = project.config.libs || {},
            lib = libs[name] || {},
            url = lib.url || lib.js
        ;

        return new vow.Promise(function (resolve, reject) {

            if ( isEmpty(lib) ) {
                return reject({ status : 'moduleNotFound', description : 'Не найдено описание модуля '+name });
            }

            // Если уже загружен...
            if ( lib._loadedModule ) {
                return resolve(lib._loadedModule);
            }

            // Обрабатываем зависимости, если указаны
            var
                deps = isArray(lib.deps) ? lib.deps : [],
                // Проверка циклических зависимостей?
                depsPromises = deps.map(that.resolveLibModule, that)
            ;

            // Ресольвим модуль
            return vow.all(depsPromises)
                .spread(function(){
                    return that.resolveModule(name, url);
                })
                .then(function(module){
                    lib._loadedModule = module;
                    return resolve(module);
                })
                .fail(function(error){
                    console.error('resolveLibModule error:', error);
                    /*DEBUG*//*jshint -W087*/debugger;
                    // app.error(error);
                    return vow.Promise.reject(error);
                })
            ;

        });

    },/*}}}*/

    /** resolveLibs ** {{{ Загрузить/получить модули по списку
     * @returns {Promise}
     * См. описание модулей/библиотек в `project.config.libs`, `resolveLibModule`.
     */
    resolveLibs : function (libNames) {

        var loaders = libNames.map(this.resolveLibModule, this);

        return vow.all(loaders);

    },/*}}}*/

});

});
