/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, eqnull:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module 00block_00mod_00val
 * @overview __INFO__
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since __DATE__
 * @version __DATE__
 *
 * $Date: 2017-07-18 16:36:37 +0300 (Tue, 18 Jul 2017) $
 * $Id: 00block_00mod_00val.js 8781 2017-07-18 13:36:37Z miheev $
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
    00block) {

/**
 *
 * @exports
 * @class 00block_00mod_00val
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

/**
 * @exports
 * @class 00block_00mod_00val
 * @bem
 *
 */
var 00block_00mod_00val = /** @lends 00block_00mod_00val.prototype */ {

    /** onInited() ** {{{ Инициализация блока */
    onInited : function () {

        var 00block_00mod_00val = this,
            that = this,
            params = this.params,
            undef
        ;

        // Инициализация блока-родителя
        this.__base.apply(this, arguments);

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов... */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока */
        js : {

            inited : function () {
                this.onInited();
            }

        },/*}}}*/

    },/*}}}*/

};

provide(00block.declMod({ modName : '00mod', modVal : '00val' }, 00block_00mod_00val)); // provide

}); // module
