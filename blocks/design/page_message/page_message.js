/* jshint camelcase: false, unused: false */
/* globals modules, app, project */

/**
 *
 * @module page_message
 * @overview page_message
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.03.23 14:03:57
 * @version 2017.03.23 14:03:57
 *
 * $Date: 2017-03-23 14:03:45 +0300 (Чт, 23 мар 2017) $
 * $Id: page_message.js 7901 2017-03-23 11:03:45Z miheev $
 *
*/

modules.define('page_message', [
        'i-bem-dom',
        'project',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        project,
        $,
    __BASE) {

/**
 *
 * @exports
 * @class page_message
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

var page_message = /** @lends page_message.prototype */ {

    // Данные...

    // Методы...

    // /** _actions() ** {{{ Действия пользователя и обработка событий.
    //  */
    // _actions : function() {
    //
    //     var page_message = this,
    //         that = this,
    //         params = this.params,
    //         undef
    //     ;
    //
    // },/*}}}*/

    /** _onInited() ** {{{ Инициализируем блок.
     */
    _onInited : function() {

        var page_message = this,
            that = this,
            params = this.params,
            undef
        ;

        // this._actions();

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока.
         */
        js : {
            inited : function () {

                var page_message = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this._onInited();

            },
        },/*}}}*/

    },/*}}}*/

};

provide(BEMDOM.declBlock(this.name, page_message, /** @lends page_message */{

    // /** live() {{{ Lazy-инициализация.
    //  */
    // live : function() {
    //
    //     var ptp = this.prototype;
    //
    //     return this.__base.apply(this, arguments);
    // }/*}}}*/

})); // provide

}); // module

