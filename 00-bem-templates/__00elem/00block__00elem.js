/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, eqnull:true */
/* globals modules, BEMHTML, app, project */
/**
 * @module 00block__00elem
 * @overview __INFO__
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since __DATE__
 * @version __DATE__
 *
 * $Date: 2017-07-18 16:36:37 +0300 (Tue, 18 Jul 2017) $
 * $Id: 00block__00elem.js 8781 2017-07-18 13:36:37Z miheev $
 */

modules.define('00block__00elem', [
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
 * @exports
 * @class 00block__00elem
 * @bem
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */
var 00block__00elem = /** @lends 00block__00elem.prototype */ {

    /** onInited() ** {{{ Инициализация блока */
    onInited : function () {

        var 00block__00elem = this,
            that = this,
            params = this.params
        ;

        // Инициализация блока-родителя
        // this.__base.apply(this, arguments);

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

provide(BEMDOM.declElem('00block', '00elem', 00block__00elem)); // provide

}); // module
