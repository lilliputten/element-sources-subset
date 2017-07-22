/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module session
 * @overview Храним данные в течение сессии
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.05.16 12:30:36
 * @version 2017.05.16 12:30:36
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: session.js 8733 2017-07-11 16:47:15Z miheev $
 *
 */

modules.define('session', [
        // 'i-bem-dom',
        // 'vow',
        'project',
        // 'jquery',
    ],
    function(provide,
        // BEMDOM,
        // vow,
        project,
        // $,
    __BASE) {

/**
 *
 * @exports
 * @class session
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

// Ссылка на описание модуля
var __module = this;

var session = /** @lends session.prototype */ {

    /** Данные */
    storage : {},

    /** set ** {{{ */
    set : function (id, data) {
        this.storage[id] = data;
    },/*}}}*/

    /** get ** {{{ */
    get : function (id, defValue) {
        return ( this.storage[id] !== undefined ) ? this.storage[id] : defValue;
    },/*}}}*/

    /** remove ** {{{ */
    remove : function (id) {
        delete this.storage[id];
    },/*}}}*/

    /** clearAll ** {{{ */
    clearAll : function (id) {
        Object.keys(this.storage).map(this.remove, this);
    },/*}}}*/

};

provide(session); // provide

}); // module

