/* jshint camelcase: false */
/* jshint unused: false */
/* globals modules, applyCtx, content, applyNext, block, elem, attrs, def, tag, js, wrap */

/**
 *
 * @overview splashform
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.02.02 13:26
 * @version 2017.02.02 13:26
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: splashform.js 8733 2017-07-11 16:47:15Z miheev $
 *
*/

/*
 * @module splashform
 */

modules.define('splashform', [
        'i-bem-dom',
        // 'events__channels',
        // 'store',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        // channels,
        // store,
        $
    ) {

/*
 * @exports
 * @class splashform
 * @bem
 */

/**
 *
 * @class splashform
 * @classdesc __INFO__
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */

provide(BEMDOM.declBlock(this.name,  /** @lends splashform.prototype */ {

    // Данные...

    // Методы...

    // /** _actions() ** {{{ Действия пользователя и обработка событий.
    //  */
    // _actions : function() {
    //
    //     var splashform = this,
    //         that = this,
    //         params = this.params,
    //         undef
    //     ;
    //
    // },/*}}}*/

    /** _on_inited() ** {{{ Инициализируем блок.
     */
    _on_inited : function() {

        var splashform = this,
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

                var splashform = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this._on_inited();

            },
        },/*}}}*/

    },/*}}}*/

}, /** @lends splashform */{

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

