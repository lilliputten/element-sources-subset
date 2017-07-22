/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, eqnull:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module 00block
 * @overview __INFO__
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since __DATE__
 * @version __DATE__
 *
 * $Date: 2017-07-18 16:36:37 +0300 (Tue, 18 Jul 2017) $
 * $Id: 00block.js 8781 2017-07-18 13:36:37Z miheev $
 *
 */

modules.define('00block', [
        'i-bem-dom',
        'vow',
        'project',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        vow,
        project,
        $,
    __BASE) {

/**
 *
 * @exports
 * @class 00block
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

var 00block = /** @lends 00block.prototype */ {

    // Данные...

    // Методы...

    // /** _actions() ** {{{ Действия пользователя и обработка событий */
    // _actions : function () {
    //
    //     var 00block = this,
    //         that = this,
    //         params = this.params,
    //         undef
    //     ;
    //
    // },/*}}}*/

    /** onInited() ** {{{ Инициализируем блок */
    onInited : function () {

        var 00block = this,
            that = this,
            params = this.params,
            undef
        ;

        // this._actions();

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов... */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока */
        js : {

            inited : function () {

                var 00block = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this.onInited();

            },

        },/*}}}*/

    },/*}}}*/

};

provide(BEMDOM.declBlock(this.name, 00block, /** @lends 00block */{

    // /** live() {{{ Lazy-инициализация.
    //  */
    // live : function() {
    //
    //     var ptp = this.prototype;
    //     // this.liveInitOnBlockInsideEvent('tree_toggle', 'menu-item', ptp._onTreeToggle);
    //
    //     return this.__base.apply(this, arguments);
    // }/*}}}*/

})); // provide

}); // module

