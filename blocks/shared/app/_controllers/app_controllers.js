/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */

/**
 *
 * @module app_controllers
 * @overview Средства работы с контроллерами
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.04.13, 13:30
 * @version 2017.04.13, 13:30
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: app_controllers.js 8733 2017-07-11 16:47:15Z miheev $
 *
*/

modules.define('app', [
    'i-bem-dom',
    'project',
    'vow',
    'jquery',
],
function(provide,
    BEMDOM,
    project,
    vow,
    $,
__BASE) {

/**
 *
 * @exports
 * @class app_controllers
 * @bem
 * @classdesc __INFO__
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */

var app_controllers = /** @lends app_controllers.prototype */ {

    // Данные...

    // Методы...

    /** startControllers ** {{{ Запуск связанных контроллеров.
     * @param {array} ctxList - Список связанных контроллеров
     * @param {object} ctxList[] - Объект контроллера
     * @param {function} [ctxList[].start_actions] - Метод запуска контроллера.
     * @returns {Promise}
     */
    startControllers : function (ctxList) {

        // Запускаем все `start_actions()` во всех контроллерах...
        var allPromises = ctxList.map(function (ctx) {
            return ( ctx && typeof ctx === 'object' && typeof ctx.start_actions === 'function' ) ? ctx.start_actions() : null;
        });

        return vow.all(allPromises);

    },/*}}}*/

    // Методы, переопределяемые у родительского блока...

    // /** onSetMod... ** {{{ События на установку модификаторов...
    //  * @method
    //  */
    // onSetMod : {
    //
    //     /** (js:inited) ** {{{ Инициализация bem блока.
    //      */
    //     js : {
    //         inited : function() {
    //
    //             var app_controllers = this,
    //                 params = this.params,
    //                 undef
    //             ;
    //
    //             // NOTE: Если _onInited определён в базовом блоке, то он будет вызван помимо js:inited
    //             this.__base.apply(this, arguments);
    //
    //             this._onInited();
    //
    //         }
    //     },/*}}}*/
    //
    // },/*}}}*/

};

provide(__BASE.declMod({ modName : 'controllers', modVal : true }, app_controllers, /** @lends app_controllers */{

    // /** live() {{{ Lazy-инициализация.
    //  */
    // live : function() {
    //
    //     var ptp = this.prototype;
    //
    //     return this.__base.apply(this, arguments);
    // },/*}}}*/

})); // provide

}); // module


